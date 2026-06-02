/**
 * Cloudflare Worker — Passkey Auth API
 *
 * Server-side endpoints for WebAuthn registration and authentication.
 * Deploy as a Cloudflare Worker.
 *
 * Endpoints:
 *   POST /api/passkey/register/start    — Generate registration challenge
 *   POST /api/passkey/register/finish   — Verify registration response
 *   POST /api/passkey/authenticate/start — Generate auth challenge
 *   POST /api/passkey/authenticate/finish — Verify auth response
 *   GET  /api/passkey/credentials/:userId — List user's credentials
 *   DELETE /api/passkey/credentials/:credentialId — Remove credential
 *
 * Environment variables (D1 bindings):
 *   DB — D1 database binding for credential storage
 *   RP_ID — Relying party ID (e.g., "example.com")
 *   RP_NAME — Relying party display name
 *   ORIGIN — Expected origin (e.g., "https://example.com")
 *   SESSION_SECRET — HMAC key for session tokens
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import {
  parseRegistrationResponse,
  parseAuthenticationResponse,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  type ParsedRegistrationResponse,
  type ParsedAuthenticationResponse,
  type CredentialRecord,
} from '../src/credentials.js';

// ─── Types ──────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database;
  RP_ID: string;
  RP_NAME: string;
  ORIGIN: string;
  SESSION_SECRET: string;
}

interface ChallengeRecord {
  userId: string;
  challenge: string;
  createdAt: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const inMemoryChallenges = new Map<string, ChallengeRecord>();

function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// ─── CORS ───────────────────────────────────────────────────────────────

function withCors(response: Response, origin: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function handleCors(request: Request, origin: string): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  return null;
}

// ─── D1 Database Helpers ────────────────────────────────────────────────

async function getCredential(db: D1Database, credentialId: string): Promise<CredentialRecord | null> {
  const result = await db.prepare(
    'SELECT id, user_handle, public_key, counter, created_at FROM credentials WHERE id = ?'
  ).bind(credentialId).first();

  if (!result) return null;

  return {
    id: result.id as string,
    userHandle: result.user_handle as string,
    publicKey: result.public_key as string,
    counter: result.counter as number,
    createdAt: result.created_at as string,
  };
}

async function saveCredential(db: D1Database, credential: CredentialRecord): Promise<void> {
  await db.prepare(
    'INSERT OR REPLACE INTO credentials (id, user_handle, public_key, counter, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    credential.id,
    credential.userHandle,
    credential.publicKey,
    credential.counter,
    credential.createdAt
  ).run();
}

async function updateCredentialCounter(db: D1Database, credentialId: string, counter: number): Promise<void> {
  await db.prepare(
    'UPDATE credentials SET counter = ? WHERE id = ?'
  ).bind(counter, credentialId).run();
}

async function listCredentials(db: D1Database, userId: string): Promise<CredentialRecord[]> {
  const results = await db.prepare(
    'SELECT id, user_handle, public_key, counter, created_at FROM credentials WHERE user_handle = ?'
  ).bind(userId).all();

  return results.results?.map((r) => ({
    id: r.id as string,
    userHandle: r.user_handle as string,
    publicKey: r.public_key as string,
    counter: r.counter as number,
    createdAt: r.created_at as string,
  })) ?? [];
}

async function deleteCredential(db: D1Database, credentialId: string): Promise<boolean> {
  const result = await db.prepare(
    'DELETE FROM credentials WHERE id = ?'
  ).bind(credentialId).run();
  return result.meta?.changes > 0;
}

// ─── Request Handlers ───────────────────────────────────────────────────

/**
 * POST /api/passkey/register/start
 *
 * Generate a registration challenge.
 *
 * Request body: { userId, userName, displayName }
 * Response: { challenge, options }
 */
async function handleRegisterStart(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const body = await request.json() as {
    userId: string;
    userName: string;
    displayName: string;
  };

  if (!body.userId || !body.userName) {
    return errorResponse('Missing userId or userName');
  }

  const challenge = generateChallenge();
  const challengeB64 = toBase64Url(challenge);

  // Store challenge
  inMemoryChallenges.set(challengeB64, {
    userId: body.userId,
    challenge: challengeB64,
    createdAt: Date.now(),
  });

  // Also store in D1 for distributed deployments
  try {
    await env.DB.prepare(
      'INSERT INTO challenges (challenge, user_id, created_at) VALUES (?, ?, ?)'
    ).bind(challengeB64, body.userId, Date.now().toString()).run();
  } catch {
    // D1 table might not exist for challenges — in-memory fallback is OK
  }

  const options = {
    rp: { name: env.RP_NAME, id: env.RP_ID },
    user: {
      id: toBase64Url(new TextEncoder().encode(body.userId)),
      name: body.userName,
      displayName: body.displayName || body.userName,
    },
    challenge: challengeB64,
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
  };

  return jsonResponse({ challenge: challengeB64, options });
}

/**
 * POST /api/passkey/register/finish
 *
 * Verify a registration response.
 *
 * Request body: { response, challenge }
 * Response: { success, credentialId }
 */
async function handleRegisterFinish(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const body = await request.json() as {
    response: ParsedRegistrationResponse;
    challenge: string;
  };

  if (!body.response || !body.challenge) {
    return errorResponse('Missing response or challenge');
  }

  // Verify challenge hasn't expired
  const challengeRecord = inMemoryChallenges.get(body.challenge);
  if (!challengeRecord || Date.now() - challengeRecord.createdAt > CHALLENGE_TTL_MS) {
    return errorResponse('Challenge expired or not found', 401);
  }

  const result = verifyRegistrationResponse(
    body.response,
    body.challenge,
    origin,
    env.RP_ID
  );

  if (!result.verified || !result.credential) {
    inMemoryChallenges.delete(body.challenge);
    return errorResponse(`Verification failed: ${result.error}`, 400);
  }

  // Save credential to D1
  await saveCredential(env.DB, result.credential);
  inMemoryChallenges.delete(body.challenge);

  return jsonResponse({
    success: true,
    credentialId: result.credential.id,
  });
}

/**
 * POST /api/passkey/authenticate/start
 *
 * Generate an authentication challenge.
 *
 * Request body: { userId } (optional — if omitted, allows any credential)
 * Response: { challenge, options }
 */
async function handleAuthenticateStart(
  request: Request,
  env: Env
): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { userId?: string };

  const challenge = generateChallenge();
  const challengeB64 = toBase64Url(challenge);

  // Store challenge
  inMemoryChallenges.set(challengeB64, {
    userId: body.userId || '',
    challenge: challengeB64,
    createdAt: Date.now(),
  });

  const options: {
    challenge: string;
    timeout: number;
    rpId: string;
    userVerification: string;
    allowCredentials?: Array<{ type: string; id: string }>;
  } = {
    challenge: challengeB64,
    timeout: 60000,
    rpId: env.RP_ID,
    userVerification: 'required',
  };

  // If userId is provided, only allow that user's credentials
  if (body.userId) {
    const credentials = await listCredentials(env.DB, body.userId);
    options.allowCredentials = credentials.map((c) => ({
      type: 'public-key',
      id: c.id,
    }));
  }

  return jsonResponse({ challenge: challengeB64, options });
}

/**
 * POST /api/passkey/authenticate/finish
 *
 * Verify an authentication response.
 *
 * Request body: { response, challenge }
 * Response: { success, userHandle, counter }
 */
async function handleAuthenticateFinish(
  request: Request,
  env: Env,
  origin: string
): Promise<Response> {
  const body = await request.json() as {
    response: ParsedAuthenticationResponse;
    challenge: string;
  };

  if (!body.response || !body.challenge) {
    return errorResponse('Missing response or challenge');
  }

  // Verify challenge hasn't expired
  const challengeRecord = inMemoryChallenges.get(body.challenge);
  if (!challengeRecord || Date.now() - challengeRecord.createdAt > CHALLENGE_TTL_MS) {
    return errorResponse('Challenge expired or not found', 401);
  }

  // Fetch stored credential
  const credential = await getCredential(env.DB, body.response.rawId);
  if (!credential) {
    inMemoryChallenges.delete(body.challenge);
    return errorResponse('Credential not found', 404);
  }

  const result = verifyAuthenticationResponse(
    body.response,
    credential,
    body.challenge,
    origin,
    env.RP_ID
  );

  if (!result.verified) {
    inMemoryChallenges.delete(body.challenge);
    return errorResponse(`Verification failed: ${result.error}`, 400);
  }

  // Update counter
  if (result.counter !== undefined) {
    await updateCredentialCounter(env.DB, body.response.rawId, result.counter);
  }

  inMemoryChallenges.delete(body.challenge);

  return jsonResponse({
    success: true,
    userHandle: result.userHandle,
    counter: result.counter,
  });
}

/**
 * GET /api/passkey/credentials/:userId
 *
 * List all credentials for a user.
 */
async function handleListCredentials(
  env: Env,
  userId: string
): Promise<Response> {
  const credentials = await listCredentials(env.DB, userId);
  return jsonResponse({
    credentials: credentials.map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      counter: c.counter,
    })),
  });
}

/**
 * DELETE /api/passkey/credentials/:credentialId
 *
 * Remove a credential.
 */
async function handleDeleteCredential(
  env: Env,
  credentialId: string
): Promise<Response> {
  const deleted = await deleteCredential(env.DB, credentialId);
  if (!deleted) {
    return errorResponse('Credential not found', 404);
  }
  return jsonResponse({ success: true });
}

// ─── Router ─────────────────────────────────────────────────────────────

const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = env.ORIGIN || url.origin;

    // Handle CORS
    const corsResponse = handleCors(request, origin);
    if (corsResponse) return withCors(corsResponse, origin);

    const path = url.pathname;

    try {
      // Registration
      if (path === '/api/passkey/register/start' && request.method === 'POST') {
        return withCors(await handleRegisterStart(request, env, origin), origin);
      }
      if (path === '/api/passkey/register/finish' && request.method === 'POST') {
        return withCors(await handleRegisterFinish(request, env, origin), origin);
      }

      // Authentication
      if (path === '/api/passkey/authenticate/start' && request.method === 'POST') {
        return withCors(await handleAuthenticateStart(request, env), origin);
      }
      if (path === '/api/passkey/authenticate/finish' && request.method === 'POST') {
        return withCors(await handleAuthenticateFinish(request, env, origin), origin);
      }

      // Credential management
      const credentialListMatch = path.match(/^\/api\/passkey\/credentials\/([^/]+)$/);
      if (credentialListMatch && request.method === 'GET') {
        return withCors(await handleListCredentials(env, credentialListMatch[1]), origin);
      }
      if (credentialListMatch && request.method === 'DELETE') {
        return withCors(await handleDeleteCredential(env, credentialListMatch[1]), origin);
      }

      return withCors(new Response('Not Found', { status: 404 }), origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return withCors(
        new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
        origin
      );
    }
  },
};

export default worker;

// ─── D1 Schema ──────────────────────────────────────────────────────────
// Run: wrangler d1 execute cinacoin --file schema.sql
//
// CREATE TABLE IF NOT EXISTS credentials (
//   id TEXT PRIMARY KEY,
//   user_handle TEXT NOT NULL,
//   public_key TEXT NOT NULL,
//   counter INTEGER NOT NULL DEFAULT 0,
//   created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
// );
//
// CREATE INDEX IF NOT EXISTS idx_credentials_user_handle ON credentials(user_handle);
//
// CREATE TABLE IF NOT EXISTS challenges (
//   challenge TEXT PRIMARY KEY,
//   user_id TEXT NOT NULL,
//   created_at TEXT NOT NULL
// );
//
// CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at);
