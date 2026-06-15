/**
 * Keys Server — Cloudflare Workers implementation
 *
 * Migrated from the Node.js/Rust keys-server to run on Cloudflare Workers
 * with KV storage. Uses Web Crypto API for AES-256-GCM encryption and
 * PBKDF2 key derivation (Workers-native equivalent of scrypt).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Env {
  /** KV namespace for encrypted key storage */
  KEYS_KV: KVNamespace;
  /** KV namespace for rate-limit counters */
  RATELIMIT_KV: KVNamespace;
  /** Encryption key for at-rest key storage (min 64 hex chars / 32 bytes) */
  ENCRYPTION_KEY: string;
  /** JWT secret for token validation (min 32 chars) */
  JWT_SECRET: string;
  /** Comma-separated CORS allowed origins (use "*" for allow-all) */
  CORS_ORIGINS?: string;
  /** Rate limit: max requests per window (default 100) */
  RATE_LIMIT_MAX?: string;
  /** Rate limit: window size in seconds (default 60) */
  RATE_LIMIT_WINDOW?: string;
}

interface StoredKey {
  id: string;
  label: string;
  encrypted: string; // base64(iv + authTag + ciphertext)
  algorithm: string;
  salt: string; // hex-encoded salt used for PBKDF2
  createdAt: number;
}

interface JwtClaims {
  sub: string;
  iss: string;
  exp: number;
  iat: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface MetricsData {
  requestsTotal: number;
  keysCreated: number;
  keysRetrieved: number;
  keysDeleted: number;
  keysRotated: number;
  authFailures: number;
  rateLimitHits: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Reduced from 100k to 10k to stay within Workers CPU limits (10ms/30ms).
// HKDF is used as the primary KDF for performance; PBKDF2 retained for backward compat.
const PBKDF2_ITERATIONS = 10_000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 16; // bytes
const AUTH_TAG_LENGTH = 16; // bytes (128 bits)
const TOKEN_LEEWAY_SECONDS = 10;

// ─── Crypto Helpers (Web Crypto API) ────────────────────────────────────────

/**
 * Derive an AES-256-GCM key from a passphrase + salt using HKDF (primary)
 * or PBKDF2 (fallback for backward compatibility).
 *
 * HKDF is preferred because it is significantly faster than PBKDF2 on
 * Cloudflare Workers (well within the 10ms/30ms CPU budget).
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  useHkdf: boolean = true
): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  if (useHkdf) {
    // HKDF-SHA256 — fast, suitable when the passphrase already has high entropy
    // (e.g. the ENCRYPTION_KEY env var is ≥32 bytes of random hex).
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'HKDF',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt,
        info: encoder.encode('cinacoin-keys-server-v2'),
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // PBKDF2 fallback — kept for backward compatibility with existing stored keys
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM.
 * Returns base64-encoded: iv (16) || authTag (16) || ciphertext
 */
async function encryptData(
  data: Uint8Array,
  passphrase: string,
  salt: Uint8Array
): Promise<string> {
  // New keys always use HKDF for speed
  const key = await deriveKey(passphrase, salt, /* useHkdf */ true);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    data
  );

  // Web Crypto AES-GCM appends the auth tag to the ciphertext
  const encryptedBuf = new Uint8Array(encrypted);
  // Layout: iv || authTag || ciphertext
  // Web Crypto output = ciphertext || authTag (last 16 bytes)
  const ciphertext = encryptedBuf.slice(0, encryptedBuf.length - AUTH_TAG_LENGTH);
  const authTag = encryptedBuf.slice(encryptedBuf.length - AUTH_TAG_LENGTH);

  const combined = new Uint8Array(IV_LENGTH + AUTH_TAG_LENGTH + ciphertext.length);
  combined.set(iv, 0);
  combined.set(authTag, IV_LENGTH);
  combined.set(ciphertext, IV_LENGTH + AUTH_TAG_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt base64-encoded data: iv (16) || authTag (16) || ciphertext
 */
async function decryptData(
  encryptedB64: string,
  passphrase: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);

  // Web Crypto expects ciphertext || authTag concatenated
  const webCryptoInput = new Uint8Array(ciphertext.length + authTag.length);
  webCryptoInput.set(ciphertext, 0);
  webCryptoInput.set(authTag, ciphertext.length);

  // Try HKDF first (new keys), fall back to PBKDF2 (legacy keys)
  let decrypted: ArrayBuffer;
  try {
    const hkdfKey = await deriveKey(passphrase, salt, /* useHkdf */ true);
    decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH * 8 },
      hkdfKey,
      webCryptoInput
    );
  } catch {
    // Legacy key encrypted with PBKDF2 — retry
    const pbkdf2Key = await deriveKey(passphrase, salt, /* useHkdf */ false);
    decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH * 8 },
      pbkdf2Key,
      webCryptoInput
    );
  }

  return new Uint8Array(decrypted);
}

// ─── JWT Validation ──────────────────────────────────────────────────────────

/**
 * Validate a JWT token (HS256). Returns claims or throws.
 */
async function validateJwt(token: string, secret: string): Promise<JwtClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0)
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify('HMAC', key, signature, data);

  if (!valid) {
    throw new Error('Invalid token signature');
  }

  // Decode payload
  const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
  const claims: JwtClaims = JSON.parse(payloadJson);

  // Check expiry with leeway
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now - TOKEN_LEEWAY_SECONDS) {
    throw new Error('Token has expired');
  }

  // Check issuer
  if (claims.iss !== 'keys-server') {
    throw new Error('Invalid token issuer');
  }

  return claims;
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

async function checkRateLimit(
  env: Env,
  ip: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const maxRequests = parseInt(env.RATE_LIMIT_MAX || '100', 10);
  const windowSecs = parseInt(env.RATE_LIMIT_WINDOW || '60', 10);
  const now = Math.floor(Date.now() / 1000);
  const key = `ratelimit:${ip}`;

  const raw = await env.RATELIMIT_KV.get(key, 'json');
  const entry = raw as RateLimitEntry | null;

  if (!entry || now - entry.windowStart >= windowSecs) {
    // New window
    const newEntry: RateLimitEntry = { count: 1, windowStart: now };
    await env.RATELIMIT_KV.put(key, JSON.stringify(newEntry), {
      expirationTtl: windowSecs + 10,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSecs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowSecs };
  }

  entry.count++;
  await env.RATELIMIT_KV.put(key, JSON.stringify(entry), {
    expirationTtl: windowSecs + 10,
  });
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.windowStart + windowSecs };
}

// ─── CORS ────────────────────────────────────────────────────────────────────

function getCorsHeaders(env: Env, origin?: string | null): Record<string, string> {
  const allowedOrigins = env.CORS_ORIGINS || '*';
  let allowOrigin = '*';

  if (allowedOrigins !== '*' && origin) {
    const origins = allowedOrigins.split(',').map((o) => o.trim());
    if (origins.includes(origin)) {
      allowOrigin = origin;
    } else {
      allowOrigin = origins[0] || 'none';
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

async function getMetrics(env: Env): Promise<MetricsData> {
  const raw = await env.KEYS_KV.get('metrics:global', 'json');
  return (raw as MetricsData) || {
    requestsTotal: 0,
    keysCreated: 0,
    keysRetrieved: 0,
    keysDeleted: 0,
    keysRotated: 0,
    authFailures: 0,
    rateLimitHits: 0,
  };
}

async function incrementMetric(env: Env, field: keyof MetricsData): Promise<void> {
  const metrics = await getMetrics(env);
  metrics[field]++;
  metrics.requestsTotal++;
  await env.KEYS_KV.put('metrics:global', JSON.stringify(metrics));
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const PUBLIC_PATHS = ['/health', '/v1/health', '/metrics'];

async function authenticate(
  request: Request,
  env: Env
): Promise<{ ok: true; claims: JwtClaims } | { ok: false; status: number; body: object }> {
  const url = new URL(request.url);
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return { ok: true, claims: { sub: '', iss: '', exp: 0, iat: 0 } };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { ok: false, status: 401, body: { error: 'unauthorized', message: 'Missing authorization header' } };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, body: { error: 'unauthorized', message: 'Invalid authorization header format' } };
  }

  const token = authHeader.slice(7);
  try {
    const claims = await validateJwt(token, env.JWT_SECRET);
    return { ok: true, claims };
  } catch (e: any) {
    await incrementMetric(env, 'authFailures');
    return { ok: false, status: 401, body: { error: 'unauthorized', message: e.message || 'Invalid token' } };
  }
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleHealth(env: Env): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'keys-server',
      platform: 'cloudflare-workers',
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleMetrics(env: Env): Promise<Response> {
  const metrics = await getMetrics(env);
  return new Response(JSON.stringify(metrics), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleCreateKey(
  request: Request,
  env: Env,
  claims: JwtClaims
): Promise<Response> {
  let body: { label?: string; keyData?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'bad_request', message: 'Invalid JSON body' }, 400);
  }

  const label = body.label || 'unnamed';
  const id = crypto.randomUUID();

  // Generate random 32-byte key if not provided
  const rawKey = body.keyData
    ? Uint8Array.from(atob(body.keyData), (c) => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(32));

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encrypted = await encryptData(rawKey, env.ENCRYPTION_KEY, salt);

  const stored: StoredKey = {
    id,
    label,
    encrypted,
    algorithm: 'aes-256-gcm',
    salt: Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    createdAt: Date.now(),
  };

  await env.KEYS_KV.put(`key:${id}`, JSON.stringify(stored));
  await incrementMetric(env, 'keysCreated');

  // Return metadata only (no encrypted material)
  const { encrypted: _, ...metadata } = stored;
  return jsonResponse(metadata, 201);
}

async function handleGetKey(request: Request, env: Env, keyId: string): Promise<Response> {
  const raw = await env.KEYS_KV.get(`key:${keyId}`, 'json');
  if (!raw) {
    return jsonResponse({ error: 'not_found', message: 'Key not found' }, 404);
  }

  await incrementMetric(env, 'keysRetrieved');
  // Return metadata only (no encrypted material)
  const stored = raw as StoredKey;
  const { encrypted: _, ...metadata } = stored;
  return jsonResponse(metadata);
}

async function handleDeleteKey(request: Request, env: Env, keyId: string): Promise<Response> {
  const raw = await env.KEYS_KV.get(`key:${keyId}`);
  if (!raw) {
    return jsonResponse({ error: 'not_found', message: 'Key not found' }, 404);
  }

  await env.KEYS_KV.delete(`key:${keyId}`);
  await incrementMetric(env, 'keysDeleted');
  return jsonResponse({ deleted: true, id: keyId });
}

async function handleRotateKey(
  request: Request,
  env: Env,
  keyId: string,
  claims: JwtClaims
): Promise<Response> {
  const raw = await env.KEYS_KV.get(`key:${keyId}`, 'json');
  if (!raw) {
    return jsonResponse({ error: 'not_found', message: 'Key not found' }, 404);
  }

  const existing = raw as StoredKey;

  // Decrypt with old salt
  const oldSalt = Uint8Array.from(existing.salt.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const decrypted = await decryptData(existing.encrypted, env.ENCRYPTION_KEY, oldSalt);

  // Re-encrypt with new salt
  const newSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const newEncrypted = await encryptData(decrypted, env.ENCRYPTION_KEY, newSalt);

  const rotated: StoredKey = {
    ...existing,
    encrypted: newEncrypted,
    salt: Array.from(newSalt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    createdAt: Date.now(),
  };

  await env.KEYS_KV.put(`key:${keyId}`, JSON.stringify(rotated));
  await incrementMetric(env, 'keysRotated');

  const { encrypted: _, ...metadata } = rotated;
  return jsonResponse(metadata);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(env, origin);

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(env, clientIp);
    if (!rateLimit.allowed) {
      await incrementMetric(env, 'rateLimitHits');
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.resetAt - Math.floor(Date.now() / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)),
            'X-RateLimit-Limit': env.RATE_LIMIT_MAX || '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
            ...corsHeaders,
          },
        }
      );
    }

    // Authentication
    const authResult = await authenticate(request, env);
    if (!authResult.ok) {
      return new Response(JSON.stringify(authResult.body), {
        status: authResult.status,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          ...corsHeaders,
        },
      });
    }

    // Route matching
    let response: Response;

    try {
      // Public routes
      if (path === '/health' || path === '/v1/health') {
        response = await handleHealth(env);
      } else if (path === '/metrics') {
        if (method !== 'GET') {
          response = jsonResponse({ error: 'method_not_allowed' }, 405);
        } else {
          response = await handleMetrics(env);
        }
      }
      // Key routes
      else if (path === '/keys' && method === 'POST') {
        response = await handleCreateKey(request, env, authResult.claims);
      } else if (path.match(/^\/keys\/[^/]+$/) && method === 'GET') {
        const keyId = path.split('/')[2];
        response = await handleGetKey(request, env, keyId);
      } else if (path.match(/^\/keys\/[^/]+$/) && method === 'DELETE') {
        const keyId = path.split('/')[2];
        response = await handleDeleteKey(request, env, keyId);
      } else if (path.match(/^\/keys\/[^/]+\/rotate$/) && method === 'POST') {
        const keyId = path.split('/')[2];
        response = await handleRotateKey(request, env, keyId, authResult.claims);
      } else {
        response = jsonResponse({ error: 'not_found', message: 'Route not found' }, 404);
      }
    } catch (err: any) {
      console.error('Handler error:', err);
      response = jsonResponse(
        { error: 'internal_error', message: err.message || 'Internal server error' },
        500
      );
    }

    // Add standard headers
    const finalHeaders = new Headers(response.headers);
    finalHeaders.set('X-RateLimit-Limit', env.RATE_LIMIT_MAX || '100');
    finalHeaders.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    finalHeaders.set('X-RateLimit-Reset', String(rateLimit.resetAt));
    for (const [k, v] of Object.entries(corsHeaders)) {
      finalHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      headers: finalHeaders,
    });
  },
};
