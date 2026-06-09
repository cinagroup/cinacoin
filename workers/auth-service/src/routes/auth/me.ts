/**
 * GET /auth/me
 * Get current authenticated user
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { requireAuth, type AuthContext } from '../../middleware/auth.js';
import { findUserById } from '../../db/users.js';
import { toPublicUser } from '../../lib/types.js';

const auth = new Hono<{ Bindings: Env }>();

auth.get('/me', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const dbUser = await findUserById(c.env.DB, user.sub);

    if (!dbUser) {
      return c.json({ error: 'Not found', message: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: toPublicUser(dbUser),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to get user' }, 500);
  }
});

export default auth;
