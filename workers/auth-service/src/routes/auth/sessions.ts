/**
 * GET /auth/sessions
 * List active sessions for the authenticated user
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { requireAuth, type AuthContext } from '../../middleware/auth.js';

const auth = new Hono<{ Bindings: Env }>();

auth.get('/sessions', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const userId = user.sub;

    // List all session entries for this user from KV
    const prefix = `session:${userId}:`;
    const result = await c.env.KV.list({ prefix });

    const sessions = [];

    for (const key of result.keys) {
      const value = await c.env.KV.get(key.name);
      if (value) {
        try {
          const sessionData = JSON.parse(value);
          sessions.push({
            jti: sessionData.jti,
            revokedAt: sessionData.revokedAt,
            createdAt: key.expiration
              ? new Date((key.expiration - 900) * 1000).toISOString()
              : null,
            expiresAt: key.expiration
              ? new Date(key.expiration * 1000).toISOString()
              : null,
          });
        } catch {
          // Skip malformed entries
        }
      }
    }

    return c.json({
      success: true,
      data: {
        sessions,
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error('Sessions list error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to list sessions' }, 500);
  }
});

export default auth;
