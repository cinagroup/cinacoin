/**
 * Server-side Next.js API route handlers for the blockchain-api package.
 *
 * Usage — import individual handlers into your Next.js app:
 *
 *   // app/api/balance/route.ts
 *   export { POST } from "@cinacoin/blockchain-api/server";
 *
 * Or copy the handler bodies if you need custom auth / middleware.
 */

import { timingSafeEqual } from 'crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { BlockchainApiClient } from '../client.js';
import { getEnv } from '../env.js';

// ---------------------------------------------------------------------------
// Security Configuration
// ---------------------------------------------------------------------------

/** Allowed origins for CORS */
const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
  'https://docs.cinacoin.com',
  'https://status.cinacoin.com',
  'http://localhost:3000',
];

function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed || '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

function withCors(response: NextResponse, origin?: string | null): NextResponse {
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const DEFAULT_CHAIN_ID = 1;

/**
 * Lazily create (or reuse) a client from env vars.
 * In production you may want a shared instance per process.
 */
function getClient(): BlockchainApiClient {
  const env = getEnv();
  return new BlockchainApiClient({
    rpcUrls: env.RPC_URLS ? JSON.parse(env.RPC_URLS) : {},
    metadataBaseUrl: env.METADATA_BASE_URL,
    defaultChainId: env.DEFAULT_CHAIN_ID ? Number(env.DEFAULT_CHAIN_ID) : DEFAULT_CHAIN_ID,
  });
}

/** Parse JSON body safely. */
async function parseBody<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  return (await req.json()) as T;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ---------------------------------------------------------------------------
// Security: API Key Authentication
// ---------------------------------------------------------------------------

/**
 * Verify API key using constant-time comparison to prevent timing attacks.
 */
function verifyApiKey(req: NextRequest): boolean {
  const env = getEnv();
  const expectedKey = env.BLOCKCHAIN_API_KEY;

  // If no key configured, reject all requests (fail secure)
  if (!expectedKey) {
    return false;
  }

  // Check Authorization: Bearer <key>
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const providedKey = authHeader.slice(7);
    return safeCompare(providedKey, expectedKey);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers.get('x-api-key');
  if (apiKeyHeader) {
    return safeCompare(apiKeyHeader, expectedKey);
  }

  return false;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid leaking length info
    const bufA = Buffer.from(a.padEnd(b.length, ' '));
    const bufB = Buffer.from(b);
    timingSafeEqual(bufA, bufB);
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ---------------------------------------------------------------------------
// Security: Rate Limiting (in-memory, per-process)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

/**
 * Check if request is rate limited.
 * Returns true if allowed, false if rate limited.
 */
function checkRateLimit(req: NextRequest): boolean {
  const env = getEnv();
  const maxRequests = parseInt(env.BLOCKCHAIN_RATE_LIMIT ?? String(RATE_LIMIT_MAX_REQUESTS), 10);

  // Get client IP (X-Forwarded-For for proxied requests, or socket address)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const entry = rateLimitStore.get(clientIp);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// POST /api/balance
// ---------------------------------------------------------------------------

/**
 * Request body:
 *   { address: string; chainId?: number; tokenAddresses?: string[] }
 * Response:
 *   { balances: Balance[] }
 */
export async function POST_balance(req: NextRequest) {
  // Security: Authentication
  if (!verifyApiKey(req)) {
    return withCors(
      errorResponse('Unauthorized: Invalid or missing API key', 401),
      req.headers.get('origin')
    );
  }

  // Security: Rate limiting
  if (!checkRateLimit(req)) {
    return withCors(errorResponse('Rate limit exceeded', 429), req.headers.get('origin'));
  }

  try {
    const body = await parseBody<{
      address: string;
      chainId?: number;
      tokenAddresses?: string[];
    }>(req);

    if (!body.address) {
      return errorResponse('Missing required field: address');
    }

    const client = getClient();
    const balances = await client.getTokenBalances(body.address, body.chainId, body.tokenAddresses);

    return NextResponse.json({ balances });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(msg, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/history
// ---------------------------------------------------------------------------

/**
 * Request body:
 *   { address: string; chainId?: number; limit?: number; cursor?: string }
 * Response:
 *   { transactions: Transaction[]; nextCursor?: string; hasMore: boolean }
 */
export async function POST_history(req: NextRequest) {
  // Security: Authentication
  if (!verifyApiKey(req)) {
    return withCors(
      errorResponse('Unauthorized: Invalid or missing API key', 401),
      req.headers.get('origin')
    );
  }

  // Security: Rate limiting
  if (!checkRateLimit(req)) {
    return withCors(errorResponse('Rate limit exceeded', 429), req.headers.get('origin'));
  }

  try {
    const body = await parseBody<{
      address: string;
      chainId?: number;
      limit?: number;
      cursor?: string;
    }>(req);

    if (!body.address) {
      return errorResponse('Missing required field: address');
    }

    const client = getClient();
    const result = await client.getTransactionHistory(
      body.address,
      body.chainId,
      body.limit ?? 20,
      body.cursor
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(msg, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/ens/resolve
// ---------------------------------------------------------------------------

/**
 * Request body:
 *   { name?: string; address?: string }
 * Response (forward lookup):
 *   { address: string | null }
 * Response (reverse lookup):
 *   { name: string | null }
 */
export async function POST_ens_resolve(req: NextRequest) {
  // Security: Authentication
  if (!verifyApiKey(req)) {
    return withCors(
      errorResponse('Unauthorized: Invalid or missing API key', 401),
      req.headers.get('origin')
    );
  }

  // Security: Rate limiting
  if (!checkRateLimit(req)) {
    return withCors(errorResponse('Rate limit exceeded', 429), req.headers.get('origin'));
  }

  try {
    const body = await parseBody<{
      name?: string;
      address?: string;
      chainId?: number;
    }>(req);

    const client = getClient();

    if (body.name) {
      const address = await client.resolveENS(body.name);
      return NextResponse.json({ address });
    }

    if (body.address) {
      const name = await client.reverseENS(body.address, body.chainId);
      return NextResponse.json({ name });
    }

    return errorResponse("Provide either 'name' or 'address'");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(msg, 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/token/metadata
// ---------------------------------------------------------------------------

/**
 * Request body:
 *   { tokenAddress: string; chainId?: number }
 * Response:
 *   { metadata: TokenMetadata }
 */
export async function POST_token_metadata(req: NextRequest) {
  // Security: Authentication
  if (!verifyApiKey(req)) {
    return withCors(
      errorResponse('Unauthorized: Invalid or missing API key', 401),
      req.headers.get('origin')
    );
  }

  // Security: Rate limiting
  if (!checkRateLimit(req)) {
    return withCors(errorResponse('Rate limit exceeded', 429), req.headers.get('origin'));
  }

  try {
    const body = await parseBody<{
      tokenAddress: string;
      chainId?: number;
    }>(req);

    if (!body.tokenAddress) {
      return errorResponse('Missing required field: tokenAddress');
    }

    const client = getClient();
    const metadata = await client.getTokenMetadata(body.tokenAddress, body.chainId);

    return NextResponse.json({ metadata });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(msg, 500);
  }
}
