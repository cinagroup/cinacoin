/**
 * CSRF protection middleware for Hono
 * Validates X-CSRF-Token header for state-changing requests (POST/PUT/DELETE/PATCH)
 * Uses session-based CSRF tokens stored in KV.
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
const CSRF_EXEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/csrf-token'];

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
 * Store a CSRF token in KV, tied to a session ID
 */
export async function storeCsrfToken(
  kv: KVNamespace,
  sessionId: string,
  token: string,
  ttlSeconds: number = 86400 // 24 hours
): Promise<void> {
  await kv.put(`csrf:${sessionId}`, token, { expirationTtl: ttlSeconds });
}

/**
 * Validate a CSRF token from KV using constant-time comparison
 */
export async function validateCsrfToken(
  kv: KVNamespace,
  sessionId: string,
  token: string
): Promise<boolean> {
  const stored = await kv.get(`csrf:${sessionId}`);
  if (!stored) return false;
  if (stored.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < stored.length; i++) {
    mismatch |= stored.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Delete a CSRF token from KV (one-time use)
 */
export async function deleteCsrfToken(
  kv: KVNamespace,
  sessionId: string
): Promise<void> {
  await kv.delete(`csrf:${sessionId}`);
}

/**
 * CSRF protection middleware
 * - Skips safe methods (GET, HEAD, OPTIONS)
 * - Skips exempt paths (login, register, csrf-token — no session to hijack)
 * - For state-changing requests: validates CSRF token against session ID in KV
 * - Falls back to JWT user ID validation for backward compatibility
 * - Deletes token after successful validation (one-time use)
 */
export async function requireCsrf(c: CsrfContext, next: Next) {
  // Skip CSRF check for safe methods
  if (SAFE_METHODS.includes(c.req.method)) {
    await next();
    return;
  }

  // Skip CSRF for public endpoints (login/register/csrf-token have no existing session)
  const path = new URL(c.req.url).pathname;
  if (CSRF_EXEMPT_PATHS.some((p) => path.endsWith(p))) {
    await next();
    return;
  }

  const csrfToken = c.req.header('X-CSRF-Token');
  const sessionId = c.req.header('X-Session-ID');

  if (!csrfToken || !sessionId) {
    return c.json(
      { error: 'Forbidden', message: 'Missing CSRF token or session ID' },
      403
    );
  }

  // Try session-based validation first
  const isValid = await validateCsrfToken(c.env.KV, sessionId, csrfToken);
  if (isValid) {
    // Delete token after successful validation (one-time use)
    await deleteCsrfToken(c.env.KV, sessionId);
    c.set('csrfValidated', true);
    await next();
    return;
  }

  // Fallback: try JWT user ID-based validation for backward compatibility
  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      try {
        const payload = await verifyAccessToken(token, c.env);
        const isValidUser = await validateCsrfToken(c.env.KV, payload.sub, csrfToken);
        if (isValidUser) {
          await deleteCsrfToken(c.env.KV, payload.sub);
          c.set('csrfValidated', true);
          await next();
          return;
        }
      } catch {
        // JWT invalid, fall through to rejection
      }
    }
  }

  return c.json(
    { error: 'Forbidden', message: 'Invalid or expired CSRF token' },
    403
  );
}
