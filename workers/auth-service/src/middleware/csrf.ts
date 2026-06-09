/**
 * CSRF protection middleware for Hono
 * Validates X-CSRF-Token header for state-changing requests (POST/PUT/DELETE)
 * on authenticated routes. Self-contained: extracts user from JWT independently.
 */
import { Context, Next } from 'hono';
import type { Env } from '../lib/types.js';
import { verifyAccessToken } from '../lib/jwt.js';

export type CsrfContext = Context<{
  Bindings: Env;
  Variables: {
    csrfValidated?: boolean;
  };
}>;

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Public endpoints that don't need CSRF (no existing session to hijack)
const CSRF_EXEMPT_PATHS = ['/auth/login', '/auth/register'];

/**
 * Generate a cryptographically random CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store a CSRF token in KV, tied to a user ID
 */
export async function storeCsrfToken(
  kv: KVNamespace,
  userId: string,
  token: string,
  ttlSeconds: number = 604800 // 7 days
): Promise<void> {
  await kv.put(`csrf:${userId}`, token, { expirationTtl: ttlSeconds });
}

/**
 * Validate a CSRF token from KV using constant-time comparison
 */
export async function validateCsrfToken(
  kv: KVNamespace,
  userId: string,
  token: string
): Promise<boolean> {
  const stored = await kv.get(`csrf:${userId}`);
  if (!stored) return false;
  if (stored.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < stored.length; i++) {
    mismatch |= stored.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * CSRF protection middleware
 * - Skips safe methods (GET, HEAD, OPTIONS)
 * - Skips exempt paths (login, register — no session to hijack)
 * - For other state-changing requests: extracts user from JWT, validates CSRF token against KV
 */
export async function requireCsrf(c: CsrfContext, next: Next) {
  // Skip CSRF check for safe methods
  if (SAFE_METHODS.includes(c.req.method)) {
    await next();
    return;
  }

  // Skip CSRF for public endpoints (login/register have no existing session)
  const path = new URL(c.req.url).pathname;
  if (CSRF_EXEMPT_PATHS.some((p) => path.endsWith(p))) {
    await next();
    return;
  }

  const csrfToken = c.req.header('X-CSRF-Token');

  if (!csrfToken) {
    return c.json(
      { error: 'Forbidden', message: 'Missing CSRF token' },
      403
    );
  }

  // Extract user from JWT to look up CSRF token in KV
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    // No auth header means requireAuth will reject it anyway; let it pass through
    await next();
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    await next();
    return;
  }

  try {
    const payload = await verifyAccessToken(token, c.env);
    const isValid = await validateCsrfToken(c.env.KV, payload.sub, csrfToken);
    if (!isValid) {
      return c.json(
        { error: 'Forbidden', message: 'Invalid CSRF token' },
        403
      );
    }
    c.set('csrfValidated', true);
  } catch {
    // If JWT is invalid, let requireAuth handle the 401
    await next();
    return;
  }

  await next();
}
