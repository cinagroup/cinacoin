/**
 * 2FA Enforcement Middleware
 * Ensures all authenticated users have 2FA enabled.
 * Users without 2FA receive a 403 with setup instructions.
 */
import { Context, Next } from 'hono';
import type { Env, TokenPayload } from '../lib/types.js';
import { findUserById } from '../db/users.js';

export type TwoFaContext = Context<{
  Bindings: Env;
  Variables: {
    user: TokenPayload;
  };
}>;

/**
 * Middleware that enforces 2FA for all authenticated requests.
 * If user doesn't have 2FA enabled, returns 403 with setup-required flag.
 * 
 * Exemptions:
 * - MFA setup/verify endpoints themselves
 * - Health check
 * - OAuth callbacks
 */
export async function enforceTwoFactor(c: TwoFaContext, next: Next) {
  // Skip enforcement for 2FA setup/verification endpoints
  const path = c.req.path;
  const exemptPaths = [
    '/auth/mfa/enable',
    '/auth/mfa/verify',
    '/auth/mfa/verify-login',
    '/auth/mfa/status',
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/oauth',
    '/health',
  ];

  if (exemptPaths.some(p => path.startsWith(p))) {
    await next();
    return;
  }

  const user = c.get('user');
  if (!user || !user.sub) {
    await next();
    return;
  }

  // Check user's 2FA status from DB
  const userRecord = await findUserById(c.env.DB, user.sub);
  
  if (!userRecord) {
    return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
  }

  // Check if 2FA is required for this user
  if (userRecord.mfa_required) {
    // Check if user has 2FA enabled
    if (!userRecord.mfa_enabled) {
      // Check grace period
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
        } else {
          // Still in grace period - warn but allow
          c.header('X-2FA-Setup-Required', 'true');
          c.header('X-2FA-Grace-Until', userRecord.two_factor_enforced_at);
        }
      } else {
        // No enforcement date set - require immediately
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
}

/**
 * Check if a user needs to set up 2FA
 */
export async function checkTwoFAStatus(db: D1Database, userId: string): Promise<{
  required: boolean;
  enabled: boolean;
  gracePeriodUntil: string | null;
  setupRequired: boolean;
}> {
  const user = await findUserById(db, userId);
  
  if (!user) {
    return { required: false, enabled: false, gracePeriodUntil: null, setupRequired: false };
  }

  const required = !!user.mfa_required;
  const enabled = !!user.mfa_enabled;
  const gracePeriodUntil = user.two_factor_enforced_at;
  
  let setupRequired = false;
  if (required && !enabled) {
    if (gracePeriodUntil) {
      setupRequired = new Date() > new Date(gracePeriodUntil);
    } else {
      setupRequired = true;
    }
  }

  return { required, enabled, gracePeriodUntil, setupRequired };
}
