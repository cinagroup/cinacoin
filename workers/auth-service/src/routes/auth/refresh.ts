/**
 * POST /auth/refresh
 * Refresh access token using refresh token with rotation
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { refreshSchema, validate } from '../../lib/validation.js';
import { verifyRefreshToken, generateTokenPair } from '../../lib/jwt.js';
import { findUserById } from '../../db/users.js';
import {
  rotateRefreshToken,
  detectTokenReuse,
  revokeAllUserTokens,
  logSecurityEvent,
} from '../../lib/token-rotation.js';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validation = validate(refreshSchema, body);
    if (!validation.success) {
      return c.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        400
      );
    }

    const { refreshToken } = validation.data;

    // Verify refresh token signature and expiry
    let payload;
    try {
      payload = await verifyRefreshToken(refreshToken, c.env);
    } catch (error) {
      return c.json(
        { error: 'Unauthorized', message: 'Invalid or expired refresh token' },
        401
      );
    }

    // Check for token reuse
    const reuseCheck = await detectTokenReuse(c.env.DB, refreshToken);
    if (reuseCheck.isReused) {
      // SECURITY ALERT: Token reuse detected
      const userId = reuseCheck.userId!;
      const familyId = reuseCheck.familyId!;

      await revokeAllUserTokens(c.env.DB, userId, 'Token reuse detected - possible theft');

      await logSecurityEvent({
        db: c.env.DB,
        userId,
        eventType: 'TOKEN_REUSE_DETECTED',
        severity: 'critical',
        details: {
          tokenFamilyId: familyId,
          ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
          userAgent: c.req.header('user-agent'),
        },
      });

      return c.json({ error: 'Unauthorized', message: 'Token has been revoked' }, 401);
    }

    // Find user
    const user = await findUserById(c.env.DB, payload.sub);
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'User not found' }, 401);
    }

    if (user.status !== 'active') {
      return c.json({ error: 'Forbidden', message: 'Account is suspended or deleted' }, 403);
    }

    // Perform token rotation
    let newRefreshToken: string;
    let familyId: string;

    try {
      const rotationResult = await rotateRefreshToken(
        c.env.DB,
        refreshToken,
        payload,
        c.env,
        {
          ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || undefined,
          userAgent: c.req.header('user-agent') || undefined,
        }
      );
      newRefreshToken = rotationResult.newToken;
      familyId = rotationResult.familyId;
    } catch (error: unknown) {
      const err = error as { code?: string; userId?: string; familyId?: string };
      if (err.code === 'TOKEN_NOT_FOUND') {
        await logSecurityEvent({
          db: c.env.DB,
          userId: payload.sub,
          eventType: 'TOKEN_NOT_FOUND',
          severity: 'high',
          details: {
            ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
            userAgent: c.req.header('user-agent'),
          },
        });

        return c.json({ error: 'Unauthorized', message: 'Invalid refresh token' }, 401);
      }

      if (err.code === 'TOKEN_REUSE_DETECTED') {
        const userId = err.userId || payload.sub;
        const familyId = err.familyId;

        await revokeAllUserTokens(c.env.DB, userId, 'Token reuse detected during rotation');

        await logSecurityEvent({
          db: c.env.DB,
          userId,
          eventType: 'TOKEN_REUSE_DETECTED',
          severity: 'critical',
          details: {
            tokenFamilyId: familyId,
            ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
            userAgent: c.req.header('user-agent'),
          },
        });

        return c.json({ error: 'Unauthorized', message: 'Token has been revoked' }, 401);
      }

      throw error;
    }

    // Generate new access token
    const tokens = await generateTokenPair(
      { sub: user.id, email: user.email, role: user.role },
      c.env
    );

    await logSecurityEvent({
      db: c.env.DB,
      userId: user.id,
      eventType: 'TOKEN_ROTATED',
      severity: 'low',
      details: {
        tokenFamilyId: familyId,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      },
    });

    return c.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: newRefreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer' as const,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to refresh token' }, 500);
  }
});

export default auth;
