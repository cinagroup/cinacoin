/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { loginSchema, validate } from '../../lib/validation.js';
import { generateTokenPair } from '../../lib/jwt.js';
import { verifyPassword } from '../../lib/password.js';
import { findUserByEmail, updateLastLogin } from '../../db/users.js';
import { getUserTotpMethod, createMfaSession } from '../../db/mfa.js';
import { withRateLimit } from '../../middleware/rate-limit.js';
import { toPublicUser } from '../../lib/types.js';
import { recordTokenIssuance } from '../../lib/token-rotation.js';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', withRateLimit('login'), async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      return c.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        400
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await findUserByEmail(c.env.DB, email);
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'Invalid email or password' }, 401);
    }

    // Check user status
    if (user.status !== 'active') {
      return c.json({ error: 'Forbidden', message: 'Account is suspended or deleted' }, 403);
    }

    // Verify password
    if (!user.password_hash) {
      return c.json({ error: 'Unauthorized', message: 'Invalid email or password' }, 401);
    }

    const validPassword = await verifyPassword(user.password_hash, password);
    if (!validPassword) {
      return c.json({ error: 'Unauthorized', message: 'Invalid email or password' }, 401);
    }

    // Check if MFA is enabled
    const totpMethod = await getUserTotpMethod(c.env.DB, user.id);

    if (totpMethod && totpMethod.is_enabled) {
      // MFA required - create temporary session token
      const mfaToken = await createMfaSession(c.env.DB, user.id);

      return c.json({
        success: true,
        data: {
          mfaRequired: true,
          mfaToken,
          mfaTokenExpiresIn: 300,
        },
      });
    }

    // No MFA - issue tokens directly
    await updateLastLogin(c.env.DB, user.id);

    const tokens = await generateTokenPair(
      { sub: user.id, email: user.email, role: user.role },
      c.env
    );

    // Record refresh token for rotation
    await recordTokenIssuance(c.env.DB, user.id, tokens.refreshToken, {
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    return c.json({
      success: true,
      data: {
        ...tokens,
        tokenType: 'Bearer' as const,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to login' }, 500);
  }
});

export default auth;
