/**
 * POST /auth/register
 * Register a new user account
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { registerSchema, validate } from '../../lib/validation.js';
import { hashPassword } from '../../lib/password.js';
import { createUser, emailExists, usernameExists } from '../../db/users.js';
import { withRateLimit } from '../../middleware/rate-limit.js';
import { toPublicUser } from '../../lib/types.js';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/register', withRateLimit('register'), async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return c.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        400
      );
    }

    const { email, username, password, displayName } = validation.data;

    // Check if email exists
    if (await emailExists(c.env.DB, email)) {
      return c.json({ error: 'Conflict', message: 'Email already registered' }, 409);
    }

    // Check if username exists
    if (await usernameExists(c.env.DB, username)) {
      return c.json({ error: 'Conflict', message: 'Username already taken' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser(c.env.DB, {
      email,
      username,
      passwordHash,
      displayName,
    });

    // SECURITY FIX: Do not issue tokens directly after registration.
    // User must complete 2FA setup first to prevent 2FA bypass.
    return c.json(
      {
        success: true,
        data: {
          userId: user.id,
          user: toPublicUser(user),
          mfaSetupRequired: true,
          mfaSetupUrl: `/auth/mfa/setup`,
          message: 'Registration successful. Please complete 2FA setup to receive access tokens.',
        },
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to register user' }, 500);
  }
});

export default auth;
