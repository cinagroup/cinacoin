/**
 * Authentication Middleware
 *
 * Supports three auth strategies:
 * 1. JWT Bearer token — verified using jose (from Auth Service)
 * 2. Bearer token (API key) — hashed and looked up in DB
 * 3. Admin API key (X-Admin-Key header) — for privileged operations
 *
 * On success, sets `c.set('userId', ...)` and `c.set('authType', ...)` for downstream use.
 */

import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import type { Env } from '../db/schema';
import { getApiKeyByHash } from '../db/queries';

/** Extend Hono context variables after auth */
export type AuthVariables = {
  userId: string;
  authType: 'jwt' | 'api_key' | 'admin';
  scopes: string[];
  email?: string;
  role?: string;
};

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * requireAuth — ensures the request carries a valid credential.
 * Sets userId, authType, scopes on the context.
 */
export const requireAuth = createMiddleware<{ Bindings: Env; Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const adminKey = c.req.header('X-Admin-Key');

  // ── Admin API Key ──────────────────────────────────────────────────────────
  if (adminKey) {
    if (adminKey !== c.env.ADMIN_API_KEY) {
      return c.json({ error: 'Invalid admin key' }, 401);
    }
    c.set('userId', 'admin');
    c.set('authType', 'admin');
    c.set('scopes', ['*']);
    await next();
    return;
  }

  // ── Bearer Token (JWT or API Key) ──────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (!token) {
      return c.json({ error: 'Empty bearer token' }, 401);
    }

    // Try JWT verification first
    if (c.env.JWT_SECRET) {
      try {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, {
          issuer: c.env.JWT_ISSUER,
          audience: c.env.JWT_AUDIENCE,
        });

        // Verify it's an access token
        if (payload.type !== 'access') {
          return c.json({ error: 'Invalid token type: expected access token' }, 401);
        }

        c.set('userId', payload.sub as string);
        c.set('authType', 'jwt');
        c.set('email', payload.email as string);
        c.set('role', payload.role as string);
        c.set('scopes', ['*']); // JWT tokens have full user scope
        await next();
        return;
      } catch (jwtError) {
        // JWT verification failed, fall through to API key check
        // SECURITY: Don't log JWT error details — may leak token info
      }
    }

    // Fall back to API key verification
    const keyHash = await sha256(token);
    const apiKey = await getApiKeyByHash(c.env.DB, keyHash, c.env.CACHE);

    if (!apiKey) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Check expiration
    if (apiKey.expires_at !== null && apiKey.expires_at < Math.floor(Date.now() / 1000)) {
      return c.json({ error: 'API key expired' }, 401);
    }

    let scopes: string[] = [];
    try {
      scopes = JSON.parse(apiKey.scopes);
    } catch {
      scopes = [];
    }

    c.set('userId', apiKey.user_id);
    c.set('authType', 'api_key');
    c.set('scopes', scopes);
    await next();
    return;
  }

  return c.json({ error: 'Authentication required. Provide Bearer token or X-Admin-Key header.' }, 401);
});

/**
 * optionalAuth — tries to authenticate but doesn't fail if no credentials.
 * Useful for endpoints that behave differently for authenticated vs anonymous users.
 */
export const optionalAuth = createMiddleware<{ Bindings: Env; Variables: Partial<AuthVariables> }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const adminKey = c.req.header('X-Admin-Key');

  if (adminKey && adminKey === c.env.ADMIN_API_KEY) {
    c.set('userId', 'admin');
    c.set('authType', 'admin');
    c.set('scopes', ['*']);
  } else if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) {
      // Try JWT first
      if (c.env.JWT_SECRET) {
        try {
          const secret = new TextEncoder().encode(c.env.JWT_SECRET);
          const { payload } = await jwtVerify(token, secret, {
            issuer: c.env.JWT_ISSUER,
            audience: c.env.JWT_AUDIENCE,
          });
          if (payload.type === 'access') {
            c.set('userId', payload.sub as string);
            c.set('authType', 'jwt');
            c.set('email', payload.email as string);
            c.set('role', payload.role as string);
            c.set('scopes', ['*']);
            await next();
            return;
          }
        } catch (jwtError) {
          // JWT failed, try API key
        }
      }

      // Fall back to API key
      const keyHash = await sha256(token);
      const apiKey = await getApiKeyByHash(c.env.DB, keyHash, c.env.CACHE);
      if (apiKey && (apiKey.expires_at === null || apiKey.expires_at >= Math.floor(Date.now() / 1000))) {
        let scopes: string[] = [];
        try { scopes = JSON.parse(apiKey.scopes); } catch {}
        c.set('userId', apiKey.user_id);
        c.set('authType', 'api_key');
        c.set('scopes', scopes);
      }
    }
  }

  await next();
});

export { sha256 };
