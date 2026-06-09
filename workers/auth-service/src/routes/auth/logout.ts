/**
 * POST /auth/logout
 * Logout user (client-side token deletion)
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { requireAuth } from '../../middleware/auth.js';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/logout', requireAuth, async (c) => {
  try {
    // In a stateless JWT system, logout is primarily client-side
    // For enhanced security, you could implement token blacklisting in KV
    // For now, we just return success

    const user = c.get('user');

    // Optional: Add token to blacklist in KV
    // const token = c.req.header('authorization')?.split(' ')[1];
    // if (token) {
    //   await c.env.KV.put(`blacklist:${token}`, '1', { expirationTtl: 900 });
    // }

    return c.json({
      success: true,
      message: 'Logged out successfully',
      userId: user.sub,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to logout' }, 500);
  }
});

export default auth;
