/**
 * Authentication Middleware
 *
 * Supports two auth strategies:
 * 1. Bearer token (API key) — hashed and looked up in DB
 * 2. Admin API key (X-Admin-Key header) — for privileged operations
 *
 * On success, sets `c.set('userId', ...)` and `c.set('authType', ...)` for downstream use.
 */

import { createMiddleware } from 'hono/factory';
import type { Env } from '../db/schema';
import { getApiKeyByHash } from '../db/queries';

/** Extend Hono context variables after auth */
export type AuthVariables = {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
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

  // ── Bearer Token (API Key) ─────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (!token) {
      return c.json({ error: 'Empty bearer token' }, 401);
    }

    const keyHash = await sha256(token);
    const apiKey = await getApiKeyByHash(c.env.DB, keyHash, c.env.CACHE);

    if (!apiKey) {
      return c.json({ error: 'Invalid API key' }, 401);
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
