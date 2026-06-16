import { Context, Next } from 'hono';

/**
 * Admin authentication middleware for sensitive endpoints.
 * Verifies admin JWT or API key from environment.
 * 
 * Supports two authentication methods:
 * 1. Bearer token (admin JWT) in Authorization header
 * 2. X-Admin-Key header with static API key
 */
export async function requireAdminAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const adminKey = c.env.ADMIN_API_KEY;

  if (!adminKey) {
    console.error('[AdminAuth] ADMIN_API_KEY not configured');
    return c.json({ error: 'Server misconfiguration' }, 500);
  }

  // Option 1: Bearer token (admin JWT)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = await verifyAdminJWT(token, c.env);
      if (payload && payload.role === 'admin') {
        c.set('admin', payload);
        return next();
      }
    } catch {
      // Fall through to API key check
    }
  }

  // Option 2: X-Admin-Key header (static API key)
  const providedKey = c.req.header('X-Admin-Key');
  if (providedKey && timingSafeEqual(providedKey, adminKey)) {
    return next();
  }

  return c.json({ error: 'Unauthorized', message: 'Admin authentication required' }, 401);
}

interface AdminEnv {
  JWT_SECRET: string;
}

interface AdminPayload {
  sub: string;
  role?: string;
  [key: string]: unknown;
}

async function verifyAdminJWT(token: string, env: AdminEnv): Promise<AdminPayload> {
  // Use jose library like other auth middleware
  const { jwtVerify } = await import('jose');
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload as AdminPayload;
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
