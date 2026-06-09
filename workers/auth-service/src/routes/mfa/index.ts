/**
 * MFA routes - enable, disable, verify, verify-login, status
 */
import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../../lib/types.js';
import { toPublicUser } from '../../lib/types.js';
import { requireAuth, type AuthContext } from '../../middleware/auth.js';
import { withRateLimit } from '../../middleware/rate-limit.js';
import { generateTokenPair } from '../../lib/jwt.js';
import { verifyTotpToken, generateTotpSecret, generateTotpUri, generateRecoveryCodes } from '../../lib/totp.js';
import {
  createTotpMethod,
  enableTotpMethod,
  getUserTotpMethod,
  disableMfa,
  storeRecoveryCodes,
  verifyRecoveryCode,
  getRecoveryCodesCount,
  consumeMfaSession,
} from '../../db/mfa.js';
import { findUserById, updateLastLogin } from '../../db/users.js';

const mfa = new Hono<{ Bindings: Env }>();

/**
 * POST /mfa/enable - Start TOTP MFA setup
 */
mfa.post('/enable', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');

    const secret = generateTotpSecret();
    const { uri } = generateTotpUri({
      issuer: 'Cinacoin',
      account: user.email,
      secret,
    });

    const method = await createTotpMethod(c.env.DB, { userId: user.sub, secret });
    const recoveryCodes = generateRecoveryCodes(10);
    await storeRecoveryCodes(c.env.DB, user.sub, recoveryCodes);

    return c.json({
      success: true,
      data: {
        methodId: method.id,
        secret,
        uri,
        recoveryCodes,
      },
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to enable MFA' }, 500);
  }
});

/**
 * POST /mfa/verify - Verify TOTP code (setup or login)
 */
mfa.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const { code, method, sessionToken } = body;

    if (!code) {
      return c.json({ error: 'Bad Request', message: 'Code is required' }, 400);
    }

    // If sessionToken provided, this is MFA verification during login
    if (sessionToken) {
      return handleMfaLoginVerification(c, sessionToken, code, method);
    }

    // Otherwise, this is initial TOTP setup verification
    const authHeader = c.req.header('authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
    }

    // Use requireAuth inline
    const { verifyAccessToken } = await import('../../lib/jwt.js');
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return c.json({ error: 'Unauthorized', message: 'Invalid authorization scheme' }, 401);
    }

    let payload;
    try {
      payload = await verifyAccessToken(token, c.env);
    } catch {
      return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
    }

    const userId = payload.sub;

    const totpMethod = await getUserTotpMethod(c.env.DB, userId);
    if (!totpMethod || !totpMethod.totp_secret) {
      return c.json(
        { error: 'Bad Request', message: 'MFA not set up. Call /mfa/enable first.' },
        400
      );
    }

    const isValid = verifyTotpToken({
      secret: totpMethod.totp_secret,
      token: code,
    });

    if (!isValid) {
      return c.json({ error: 'Unauthorized', message: 'Invalid TOTP code' }, 401);
    }

    // If not yet verified, enable it
    if (!totpMethod.totp_verified) {
      const enabled = await enableTotpMethod(c.env.DB, totpMethod.id, userId);
      if (!enabled) {
        return c.json({ error: 'Internal server error', message: 'Failed to enable MFA' }, 500);
      }
    }

    return c.json({
      success: true,
      data: {
        verified: true,
        mfaEnabled: true,
        message: 'MFA has been successfully enabled',
      },
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to verify MFA' }, 500);
  }
});

/**
 * POST /mfa/verify-login - Verify MFA during login flow
 */
mfa.post('/verify-login', withRateLimit('mfaVerify'), async (c) => {
  try {
    const body = await c.req.json();

    const verifyLoginSchema = z.object({
      mfaToken: z.string().min(1, 'MFA token is required'),
      code: z.string().min(6, 'Code must be at least 6 characters').max(20, 'Code too long'),
      method: z.enum(['totp', 'recovery_code']).optional().default('totp'),
    });

    const validation = verifyLoginSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Validation failed',
          details: validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        },
        400
      );
    }

    const { mfaToken, code, method } = validation.data;

    const userId = await consumeMfaSession(c.env.DB, mfaToken);
    if (!userId) {
      return c.json({ error: 'Unauthorized', message: 'Invalid or expired MFA token' }, 401);
    }

    const user = await findUserById(c.env.DB, userId);
    if (!user || user.status !== 'active') {
      return c.json({ error: 'Forbidden', message: 'Account is suspended or deleted' }, 403);
    }

    let verified = false;

    if (method === 'recovery_code') {
      verified = await verifyRecoveryCode(c.env.DB, userId, code);
    } else {
      const totpMethod = await getUserTotpMethod(c.env.DB, userId);
      if (!totpMethod || !totpMethod.totp_secret) {
        return c.json({ error: 'Bad Request', message: 'MFA not configured for this user' }, 400);
      }
      verified = verifyTotpToken({ secret: totpMethod.totp_secret, token: code });
    }

    if (!verified) {
      return c.json({ error: 'Unauthorized', message: 'Invalid verification code' }, 401);
    }

    await updateLastLogin(c.env.DB, user.id);

    const tokens = await generateTokenPair(
      { sub: user.id, email: user.email, role: user.role },
      c.env
    );

    return c.json({
      success: true,
      data: {
        ...tokens,
        tokenType: 'Bearer' as const,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    console.error('MFA verify-login error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to verify MFA' }, 500);
  }
});

/**
 * POST /mfa/disable - Disable MFA
 */
mfa.post('/disable', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { code, confirmDisable } = body;

    if (!confirmDisable) {
      return c.json(
        { error: 'Bad Request', message: 'Must confirm disable with confirmDisable: true' },
        400
      );
    }

    if (code) {
      const totpMethod = await getUserTotpMethod(c.env.DB, user.sub);
      if (totpMethod && totpMethod.totp_secret) {
        const isValid = verifyTotpToken({
          secret: totpMethod.totp_secret,
          token: code,
        });
        if (!isValid) {
          return c.json({ error: 'Unauthorized', message: 'Invalid TOTP code' }, 401);
        }
      }
    }

    await disableMfa(c.env.DB, user.sub);

    return c.json({
      success: true,
      data: { mfaEnabled: false, message: 'MFA has been disabled' },
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to disable MFA' }, 500);
  }
});

/**
 * GET /mfa/status - Get MFA status
 */
mfa.get('/status', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');

    const totpMethod = await getUserTotpMethod(c.env.DB, user.sub);
    const recoveryCodesRemaining = await getRecoveryCodesCount(c.env.DB, user.sub);

    return c.json({
      success: true,
      data: {
        mfaEnabled: !!totpMethod,
        totp: {
          enabled: !!totpMethod,
          verified: !!totpMethod?.totp_verified,
        },
        recoveryCodes: { remaining: recoveryCodesRemaining },
      },
    });
  } catch (error) {
    console.error('MFA status error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to get MFA status' }, 500);
  }
});

/**
 * Handle MFA verification during login flow (internal helper)
 */
async function handleMfaLoginVerification(
  c: any,
  sessionToken: string,
  code: string,
  method?: string
) {
  const userId = await consumeMfaSession(c.env.DB, sessionToken);
  if (!userId) {
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired MFA session' }, 401);
  }

  let verified = false;

  if (method === 'recovery_code') {
    verified = await verifyRecoveryCode(c.env.DB, userId, code);
  } else {
    const totpMethod = await getUserTotpMethod(c.env.DB, userId);
    if (!totpMethod || !totpMethod.totp_secret) {
      return c.json({ error: 'Bad Request', message: 'MFA not configured' }, 400);
    }
    verified = verifyTotpToken({ secret: totpMethod.totp_secret, token: code });
  }

  if (!verified) {
    return c.json({ error: 'Unauthorized', message: 'Invalid verification code' }, 401);
  }

  const user = await findUserById(c.env.DB, userId);
  if (!user || user.status !== 'active') {
    return c.json({ error: 'Forbidden', message: 'Account is suspended or deleted' }, 403);
  }

  await updateLastLogin(c.env.DB, user.id);

  const tokens = await generateTokenPair(
    { sub: user.id, email: user.email, role: user.role },
    c.env
  );

  return c.json({
    success: true,
    data: {
      ...tokens,
      tokenType: 'Bearer' as const,
      user: toPublicUser(user),
    },
  });
}

export default mfa;
