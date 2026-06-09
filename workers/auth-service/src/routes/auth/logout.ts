/**
 * POST /auth/logout
 * Logout user - revoke access token by adding to KV blacklist
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { requireAuth } from '../../middleware/auth.js';
import { jwtVerify } from 'jose';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/logout', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const authHeader = c.req.header('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);

    // Decode token to get jti and exp
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    let jti: string | undefined;
    let exp: number | undefined;

    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: c.env.JWT_ISSUER,
        audience: c.env.JWT_AUDIENCE,
      });
      jti = payload.jti as string | undefined;
      exp = payload.exp as number | undefined;
    } catch {
      // Token is already invalid/expired - still return success for logout
      return c.json({
        success: true,
        message: 'Logged out successfully',
        userId: user.sub,
      });
    }

    if (!jti) {
      // Legacy token without jti - can't blacklist, but still return success
      return c.json({
        success: true,
        message: 'Logged out successfully (legacy token)',
        userId: user.sub,
      });
    }

    // Calculate TTL for blacklist entry (match token expiry)
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp ? exp - now : 900; // fallback to 15 min

    if (ttl > 0) {
      // Blacklist the access token by jti
      await c.env.KV.put(`revoked:${jti}`, 'true', { expirationTtl: ttl });

      // Also store a session index for listing active sessions per user
      const sessionData = JSON.stringify({
        jti,
        revokedAt: new Date().toISOString(),
        userId: user.sub,
      });
      await c.env.KV.put(`session:${user.sub}:${jti}`, sessionData, { expirationTtl: ttl });
    }

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
