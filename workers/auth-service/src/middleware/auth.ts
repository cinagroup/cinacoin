/**
 * Authentication middleware for Hono
 * Verifies JWT tokens and attaches user to context
 * Enforces 2FA requirement for all authenticated routes
 */
import { Context, Next } from 'hono';
import { verifyAccessToken } from '../lib/jwt.js';
import { findUserById } from '../db/users.js';
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
 * Middleware to require authentication + enforce 2FA
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

    // Check if token has been revoked (logged out)
    if (payload.jti) {
      const revoked = await c.env.KV.get(`revoked:${payload.jti}`);
      if (revoked) {
        return c.json(
          { error: 'Unauthorized', message: 'Token has been revoked' },
          401
        );
      }
    }

    c.set('user', payload);

    // ── 2FA Enforcement ──────────────────────────────────────────────
    // Skip for MFA setup/verification endpoints and logout
    const path = c.req.path;
    const exemptPaths = [
      '/auth/mfa/enable',
      '/auth/mfa/verify',
      '/auth/mfa/verify-login',
      '/auth/mfa/status',
      '/auth/mfa/disable',
      '/auth/2fa-status',
      '/auth/logout',
    ];

    if (!exemptPaths.some(p => path.startsWith(p))) {
      const userRecord = await findUserById(c.env.DB, payload.sub);
      if (userRecord && userRecord.mfa_required && !userRecord.mfa_enabled) {
        if (userRecord.two_factor_enforced_at) {
          const enforcementDate = new Date(userRecord.two_factor_enforced_at);
          const now = new Date();
          if (now > enforcementDate) {
            return c.json({
              error: 'Forbidden',
              message: '2FA is required. Please set up two-factor authentication.',
              code: '2FA_REQUIRED',
              setupRequired: true,
              gracePeriodExpired: true,
            }, 403);
          }
          // Grace period active — warn via headers but allow
          c.header('X-2FA-Setup-Required', 'true');
          c.header('X-2FA-Grace-Until', userRecord.two_factor_enforced_at);
        } else {
          return c.json({
            error: 'Forbidden',
            message: '2FA is required. Please set up two-factor authentication.',
            code: '2FA_REQUIRED',
            setupRequired: true,
          }, 403);
        }
      }
    }

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
