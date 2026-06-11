import { logger } from '@cinacoin/logger';
/**
 * Cinacoin Keys Server — Cloudflare Worker
 *
 * Manages encrypted key pairs and sessions using D1 (SQLite) + KV.
 * Replaces the PostgreSQL + Redis architecture.
 */

// --- Inlined from @cinacoin/config ---
function createLogger(serviceName: string) {
  return {
    debug: (msg: string, ctx?: Record<string, unknown>) => console.debug(`[${serviceName}] ${msg}`, ctx ? JSON.stringify(ctx) : ''),
    info: (msg: string, ctx?: Record<string, unknown>) => logger.info(`[${serviceName}] ${msg}`, ctx ? JSON.stringify(ctx) : ''),
    warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(`[${serviceName}] ${msg}`, ctx ? JSON.stringify(ctx) : ''),
    error: (msg: string, ctx?: Record<string, unknown>) => logger.error(`[${serviceName}] ${msg}`, ctx ? JSON.stringify(ctx) : ''),
  };
}
function extractRequestId(request: Request): string {
  return request.headers.get('x-request-id') || request.headers.get('x-correlation-id') || request.headers.get('cf-ray') || crypto.randomUUID();
}
const CSRF_ALLOWED_ORIGINS: string[] = [];
function validateCsrf(request: Request): boolean {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return true;
  if (CSRF_ALLOWED_ORIGINS.length === 0) return true;
  const origin = request.headers.get('origin');
  return origin ? CSRF_ALLOWED_ORIGINS.includes(origin) : false;
}
// ------------------------------------

const logger = createLogger('keys-server');
const START_TIME = Date.now();

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

interface RateEntry { count: number; resetAt: number }
const rateLimits = new Map<string, RateEntry>();

function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
}

function checkRate(ip: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

const DEFAULT_RATE_LIMIT = 100; // requests per minute

// ---------------------------------------------------------------------------
// Security Utilities
// ---------------------------------------------------------------------------

/** Constant-time string comparison to prevent timing attacks on API key validation. */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  ENCRYPTION_KEY?: string;
  API_KEY?: string;
}

interface Metrics {
  requestCount: number;
  errorCount: number;
  keypairCreateCount: number;
  keypairListCount: number;
  sessionCreateCount: number;
  startTime: number;
}

// Global metrics storage
let metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  keypairCreateCount: 0,
  keypairListCount: 0,
  sessionCreateCount: 0,
  startTime: Date.now(),
};

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function handleMetrics(): Response {
  const uptime = Date.now() - metrics.startTime;
  const errorRate = metrics.requestCount > 0
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2)
    : "0.00";

  return jsonResponse({
    service: "cinacoin-keys-server",
    uptime_ms: uptime,
    uptime_readable: formatUptime(uptime),
    request_count: metrics.requestCount,
    error_count: metrics.errorCount,
    error_rate_percent: parseFloat(errorRate),
    keypair_create_count: metrics.keypairCreateCount,
    keypair_list_count: metrics.keypairListCount,
    session_create_count: metrics.sessionCreateCount,
    timestamp: new Date().toISOString(),
  });
}

function handlePrometheusMetrics(): Response {
  const uptime = Date.now() - metrics.startTime;
  const errorRate = metrics.requestCount > 0
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2)
    : "0.00";

  const lines: string[] = [
    '# HELP keys_server_request_count_total Total requests processed',
    '# TYPE keys_server_request_count_total counter',
    `keys_server_request_count_total ${metrics.requestCount}`,
    '',
    '# HELP keys_server_error_count_total Total errors',
    '# TYPE keys_server_error_count_total counter',
    `keys_server_error_count_total ${metrics.errorCount}`,
    '',
    '# HELP keys_server_error_rate Error rate as percentage',
    '# TYPE keys_server_error_rate gauge',
    `keys_server_error_rate ${errorRate}`,
    '',
    '# HELP keys_server_keypair_create_total Keypair creations',
    '# TYPE keys_server_keypair_create_total counter',
    `keys_server_keypair_create_total ${metrics.keypairCreateCount}`,
    '',
    '# HELP keys_server_keypair_list_total Keypair list requests',
    '# TYPE keys_server_keypair_list_total counter',
    `keys_server_keypair_list_total ${metrics.keypairListCount}`,
    '',
    '# HELP keys_server_session_create_total Session creations',
    '# TYPE keys_server_session_create_total counter',
    `keys_server_session_create_total ${metrics.sessionCreateCount}`,
    '',
    '# HELP keys_server_uptime_ms Uptime in milliseconds',
    '# TYPE keys_server_uptime_ms gauge',
    `keys_server_uptime_ms ${uptime}`,
    '',
    '# HELP keys_server_up Whether the service is alive',
    '# TYPE keys_server_up gauge',
    'keys_server_up 1',
  ];

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' },
  });
}

// ---------------------------------------------------------------------------
// Session Validation
// ---------------------------------------------------------------------------

interface SessionRecord {
  id: string;
  address: string;
  nonce: string;
  expires_at: number;
}

/**
 * Validate a session by ID: check existence and expiry.
 * Returns the session record if valid, null if expired, or throws on error.
 */
export async function validateSession(
  sessionId: string,
  env: Env
): Promise<SessionRecord | null> {
  const result = await env.DB.prepare(
    'SELECT id, address, nonce, expires_at FROM sessions WHERE id = ?'
  ).bind(sessionId).first<SessionRecord>();

  if (!result) {
    return null;
  }

  // Check expiry
  if (result.expires_at < Date.now()) {
    return null; // expired
  }

  return result;
}

/**
 * Extract session token from Authorization header.
 * Supports "Bearer <token>" or bare "<token>".
 */
function extractSessionToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth) return null;
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return auth.trim();
}

/**
 * Middleware: require a valid, non-expired session.
 * Returns null if session is valid, or a 401 Response if not.
 */
async function requireValidSession(
  request: Request,
  env: Env,
  origin: string | null
): Promise<Response | null> {
  const token = extractSessionToken(request);
  if (!token) {
    return jsonResponse({ error: 'Unauthorized: missing session token' }, 401, origin);
  }

  const session = await validateSession(token, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized: invalid or expired session' }, 401, origin);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cron: Cleanup expired sessions
// ---------------------------------------------------------------------------

/**
 * Delete all expired sessions from the D1 database.
 * Call this on a cron schedule (e.g. every hour).
 */
export async function cleanupExpiredSessions(env: Env): Promise<number> {
  const now = Date.now();
  const result = await env.DB.prepare(
    'DELETE FROM sessions WHERE expires_at < ?'
  ).bind(now).run();
  return result.meta?.changes ?? 0;
}

// ---------------------------------------------------------------------------
// Request Handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    metrics.requestCount++;

    const origin = getCorsOrigin(request);

    // CORS preflight (before rate limiting)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    // Rate limiting (skip health check)
    if (url.pathname !== '/health') {
      const ip = getClientIp(request);
      if (!checkRate(ip, DEFAULT_RATE_LIMIT)) {
        return jsonResponse({ error: 'rate_limit_exceeded' }, 429, origin);
      }
    }

    // CSRF protection for state-changing requests
    if (!validateCsrf(request)) {
      return jsonResponse({ error: 'CSRF validation failed' }, 403, origin);
    }

    try {
      switch (url.pathname) {
        case '/health': {
          const uptimeSec = Math.floor((Date.now() - START_TIME) / 1000);
          return jsonResponse({ status: 'ok', uptime: uptimeSec, version: '1.0.0', timestamp: new Date().toISOString() }, 200, origin);
        }

        case '/metrics': {
          const accept = request.headers.get('Accept') || '';
          if (accept.includes('text/plain') || accept.includes('application/openmetrics')) {
            return handlePrometheusMetrics();
          }
          return handleMetrics();
        }

        case '/api/v1/keypairs': {
          // Session required for both read and write
          const sessionError = await requireValidSession(request, env, origin);
          if (sessionError) return sessionError;

          if (request.method === 'GET') return listKeypairs(request, env, origin);
          if (request.method === 'POST') return createKeypair(request, env, origin);
          return methodNotAllowed(origin);
        }

        case '/api/v1/sessions': {
          // API key required for session creation
          if (request.method === 'POST' && !verifyApiKey(request, env)) {
            return jsonResponse({ error: 'Unauthorized' }, 401, origin);
          }
          if (request.method === 'POST') return createSession(request, env, origin);
          return methodNotAllowed(origin);
        }

        case '/api/keys': {
          const sessionError = await requireValidSession(request, env, origin);
          if (sessionError) return sessionError;
          if (request.method === 'GET') return listApiKeys(request, env, origin);
          if (request.method === 'POST') return createApiKey(request, env, origin);
          return methodNotAllowed(origin);
        }

        default: {
          // Handle /api/keys/:id routes
          const apiKeyMatch = url.pathname.match(/^\/api\/keys\/([^/]+)$/);
          if (apiKeyMatch) {
            const sessionError = await requireValidSession(request, env, origin);
            if (sessionError) return sessionError;
            const keyId = decodeURIComponent(apiKeyMatch[1]);
            if (request.method === 'GET') return getApiKey(request, env, origin, keyId);
            if (request.method === 'DELETE') return deleteApiKey(request, env, origin, keyId);
            if (request.method === 'PATCH') return updateApiKey(request, env, origin, keyId);
            return methodNotAllowed(origin);
          }
          return notFound(origin);
        }
      }
    } catch (err) {
      metrics.errorCount++;
      // Security: never expose internal error details to clients
      const requestId = extractRequestId(request);
      logger.error('Internal error', { requestId, error: String(err) });
      return jsonResponse({ error: 'Internal server error' }, 500, origin);
    }
  },

  // Cron handler for expired session cleanup
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const deleted = await cleanupExpiredSessions(env);
    logger.info('Cron: cleaned up expired sessions', { count: deleted });
  },
};

async function listKeypairs(request: Request, env: Env, origin: string | null): Promise<Response> {
  metrics.keypairListCount++;

  const url = new URL(request.url);
  const address = url.searchParams.get('address');

  // Validate address format if provided
  if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return jsonResponse({ error: 'Invalid address format' }, 400, origin);
  }

  let query = 'SELECT id, address, chain_id, public_key, created_at, updated_at FROM keypairs';
  const params: string[] = [];

  if (address) {
    query += ' WHERE address = ?';
    params.push(address);
  }

  const result = await env.DB.prepare(query).bind(...params).all();
  return jsonResponse({ keypairs: result.results }, 200, origin);
}

async function createKeypair(request: Request, env: Env, origin: string | null): Promise<Response> {
  metrics.keypairCreateCount++;

  // Validate request size (limit to 64KB)
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 65536) {
    return jsonResponse({ error: 'Request too large' }, 413, origin);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const raw = body as Record<string, unknown>;
  const address = raw.address;
  const chainId = raw.chainId;
  const encryptedKey = raw.encryptedKey;
  const publicKey = raw.publicKey;

  if (typeof address !== 'string' || !address) {
    return jsonResponse({ error: 'Missing or invalid field: address' }, 400, origin);
  }
  if (typeof chainId !== 'string' || !chainId) {
    return jsonResponse({ error: 'Missing or invalid field: chainId' }, 400, origin);
  }
  if (typeof encryptedKey !== 'string' || !encryptedKey) {
    return jsonResponse({ error: 'Missing or invalid field: encryptedKey' }, 400, origin);
  }
  if (typeof publicKey !== 'string' || !publicKey) {
    return jsonResponse({ error: 'Missing or invalid field: publicKey' }, 400, origin);
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return jsonResponse({ error: 'Invalid address format' }, 400, origin);
  }

  // Validate chainId (numeric string, max 10 digits)
  if (!/^\d{1,10}$/.test(chainId)) {
    return jsonResponse({ error: 'Invalid chainId: must be a numeric string' }, 400, origin);
  }

  // Validate encryptedKey size (limit to 4KB)
  if (encryptedKey.length > 4096) {
    return jsonResponse({ error: 'encryptedKey too large (max 4096)' }, 400, origin);
  }

  // Validate publicKey size (limit to 1KB)
  if (publicKey.length > 1024) {
    return jsonResponse({ error: 'publicKey too large (max 1024)' }, 400, origin);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB.prepare(
    'INSERT INTO keypairs (id, address, chain_id, encrypted_key, public_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, address, chainId, encryptedKey, publicKey, now, now).run();

  return jsonResponse({ id, address, chainId, publicKey, createdAt: now }, 201, origin);
}

async function createSession(request: Request, env: Env, origin: string | null): Promise<Response> {
  metrics.sessionCreateCount++;

  // Validate request size
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 65536) {
    return jsonResponse({ error: 'Request too large' }, 413, origin);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const raw = body as Record<string, unknown>;
  const address = raw.address;
  const nonce = raw.nonce;
  const expiresIn = raw.expiresIn;

  if (typeof address !== 'string' || !address) {
    return jsonResponse({ error: 'Missing or invalid field: address' }, 400, origin);
  }
  if (typeof nonce !== 'string' || !nonce) {
    return jsonResponse({ error: 'Missing or invalid field: nonce' }, 400, origin);
  }
  // Limit nonce size
  if (nonce.length > 1024) {
    return jsonResponse({ error: 'nonce too large (max 1024)' }, 400, origin);
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return jsonResponse({ error: 'Invalid address format' }, 400, origin);
  }

  // Clamp expiry to max 7 days
  const expiresInSec = typeof expiresIn === 'number' ? Math.min(expiresIn, 604800) : 86400;
  const expiresAt = Date.now() + expiresInSec * 1000;

  const id = crypto.randomUUID();

  await env.DB.prepare(
    'INSERT INTO sessions (id, address, nonce, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(id, address, nonce, expiresAt).run();

  return jsonResponse({ id, address, expiresAt }, 201, origin);
}

// ---------------------------------------------------------------------------
// API Keys Management
// ---------------------------------------------------------------------------

async function listApiKeys(request: Request, env: Env, origin: string | null): Promise<Response> {
  const token = extractSessionToken(request);
  const session = await validateSession(token!, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const result = await env.DB.prepare(
    'SELECT id, name, key_prefix, permissions, expires_at, last_used_at, created_at, updated_at FROM api_keys WHERE user_id = ?'
  ).bind(session.address).all();

  return jsonResponse({ keys: result.results }, 200, origin);
}

async function getApiKey(request: Request, env: Env, origin: string | null, keyId: string): Promise<Response> {
  const token = extractSessionToken(request);
  const session = await validateSession(token!, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const result = await env.DB.prepare(
    'SELECT id, name, key_prefix, permissions, expires_at, last_used_at, created_at, updated_at FROM api_keys WHERE id = ? AND user_id = ?'
  ).bind(keyId, session.address).first();

  if (!result) {
    return jsonResponse({ error: 'API key not found' }, 404, origin);
  }

  return jsonResponse({ key: result }, 200, origin);
}

async function createApiKey(request: Request, env: Env, origin: string | null): Promise<Response> {
  const token = extractSessionToken(request);
  const session = await validateSession(token!, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const raw = body as Record<string, unknown>;
  const name = raw.name;
  const permissions = raw.permissions;

  if (typeof name !== 'string' || !name || name.length > 100) {
    return jsonResponse({ error: 'Missing or invalid field: name (max 100 chars)' }, 400, origin);
  }

  // Generate a new API key
  const apiKey = 'ck_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = apiKey.substring(0, 12);

  const id = crypto.randomUUID();
  const now = Date.now();
  const permissionsStr = typeof permissions === 'object' && permissions !== null
    ? JSON.stringify(permissions)
    : '{}';

  await env.DB.prepare(
    'INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, session.address, name, keyHash, keyPrefix, permissionsStr, now, now).run();

  // Return the full key only on creation
  return jsonResponse({ id, name, key: apiKey, keyPrefix, permissions: permissionsStr, createdAt: now }, 201, origin);
}

async function deleteApiKey(request: Request, env: Env, origin: string | null, keyId: string): Promise<Response> {
  const token = extractSessionToken(request);
  const session = await validateSession(token!, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  const result = await env.DB.prepare(
    'DELETE FROM api_keys WHERE id = ? AND user_id = ?'
  ).bind(keyId, session.address).run();

  if (!result.meta?.changes || result.meta.changes === 0) {
    return jsonResponse({ error: 'API key not found' }, 404, origin);
  }

  return jsonResponse({ success: true, id: keyId }, 200, origin);
}

async function updateApiKey(request: Request, env: Env, origin: string | null, keyId: string): Promise<Response> {
  const token = extractSessionToken(request);
  const session = await validateSession(token!, env);
  if (!session) {
    return jsonResponse({ error: 'Unauthorized' }, 401, origin);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const raw = body as Record<string, unknown>;
  const permissions = raw.permissions;
  const name = raw.name;

  if (permissions === undefined && name === undefined) {
    return jsonResponse({ error: 'No fields to update (name or permissions)' }, 400, origin);
  }

  const now = Date.now();
  let query = 'UPDATE api_keys SET updated_at = ?';
  const params: (string | number)[] = [now];

  if (typeof name === 'string' && name.length > 0 && name.length <= 100) {
    query += ', name = ?';
    params.push(name);
  }

  if (typeof permissions === 'object' && permissions !== null) {
    query += ', permissions = ?';
    params.push(JSON.stringify(permissions));
  }

  query += ' WHERE id = ? AND user_id = ?';
  params.push(keyId, session.address);

  const result = await env.DB.prepare(query).bind(...params).run();

  if (!result.meta?.changes || result.meta.changes === 0) {
    return jsonResponse({ error: 'API key not found' }, 404, origin);
  }

  return jsonResponse({ success: true, id: keyId }, 200, origin);
}

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(data: unknown, status = 200, origin: string | null = null): Response {
  const headers: Record<string, string> = {
    ...corsHeaders(origin),
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
  return new Response(JSON.stringify(data), { status, headers });
}

function methodNotAllowed(origin: string | null): Response {
  return jsonResponse({ error: 'Method not allowed' }, 405, origin);
}

function notFound(origin: string | null): Response {
  return jsonResponse({ error: 'Not found' }, 404, origin);
}

// ---------------------------------------------------------------------------
// Security Configuration
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
  'https://docs.cinacoin.com',
  'https://status.cinacoin.com',
  // 'http://localhost:3000', // dev only
  // 'http://localhost:5173', // dev only
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  };
}

/** Verify API key from Authorization header */
function verifyApiKey(request: Request, env: Env): boolean {
  const apiKey = env.API_KEY;
  if (!apiKey) return true; // skip if not configured
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  const expected = `Bearer ${apiKey}`;
  return constantTimeCompare(auth, expected) || constantTimeCompare(auth, apiKey);
}

/** Check and return CORS origin */
function getCorsOrigin(request: Request): string | null {
  return request.headers.get('Origin');
}
