/**
 * Authentication middleware for Hono
 * Verifies JWT tokens and attaches user to context
 */
import { Context, Next } from 'hono';
import { verifyAccessToken } from '../lib/jwt.js';
import type { Env, TokenPayload } from '../lib/types.js';

/**
 * Extend Hono context to include user
 */
export type AuthContext = Context<{
  Bindings: Env;
  Variables: {
    user: TokenPayload;
  };
}>;

/**
 * Middleware to require authentication
 */
export async function requireAuth(c: AuthContext, next: Next) {
  const authHeader = c.req.header('authorization');

  if (!authHeader) {
    return c.json(
      { error: 'Unauthorized', message: 'Missing authorization header' },
      401
    );
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return c.json(
      { error: 'Unauthorized', message: 'Invalid authorization scheme' },
      401
    );
  }

  try {
    const payload = await verifyAccessToken(token, c.env);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json(
      { error: 'Unauthorized', message: 'Invalid or expired token' },
      401
    );
  }
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: string[]) {
  return async (c: AuthContext, next: Next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) {
      return c.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        403
      );
    }
    await next();
  };
}
