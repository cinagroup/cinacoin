/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token with rotation
 * 
 * Security features:
 * - Refresh token rotation: old token is blacklisted, new token issued
 * - Token reuse detection: if a revoked token is reused, all user sessions are revoked
 * - Security event logging for suspicious activities
 */
import { NextRequest, NextResponse } from 'next/server';
import { refreshSchema, validate, verifyRefreshToken, generateTokenPair } from '@/lib';
import { findUserById } from '@/db';
import { 
  rotateRefreshToken, 
  detectTokenReuse, 
  revokeAllUserTokens, 
  logSecurityEvent 
} from '@/lib/token-rotation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validate(refreshSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { refreshToken } = validation.data;

    // Verify refresh token signature and expiry
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Check for token reuse BEFORE attempting rotation
    const reuseCheck = await detectTokenReuse(refreshToken);
    if (reuseCheck.isReused) {
      // SECURITY ALERT: Token reuse detected - possible token theft!
      const userId = reuseCheck.userId!;
      const familyId = reuseCheck.familyId!;
      
      // Revoke all tokens for this user
      await revokeAllUserTokens(userId, 'Token reuse detected - possible theft');
      
      // Log security event
      await logSecurityEvent({
        userId,
        eventType: 'TOKEN_REUSE_DETECTED',
        severity: 'critical',
        details: {
          tokenFamilyId: familyId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent'),
        },
      });
      
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token has been revoked' },
        { status: 401 }
      );
    }

    // Find user to ensure they still exist and are active
    const user = await findUserById(payload.sub);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Account is suspended or deleted' },
        { status: 403 }
      );
    }

    // Perform token rotation
    let newRefreshToken: string;
    let familyId: string;
    
    try {
      const rotationResult = await rotateRefreshToken(refreshToken, payload, {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
      newRefreshToken = rotationResult.newToken;
      familyId = rotationResult.familyId;
    } catch (error: any) {
      if (error.code === 'TOKEN_NOT_FOUND') {
        // Token not found in database - might be a replay of an old token
        await logSecurityEvent({
          userId: payload.sub,
          eventType: 'TOKEN_NOT_FOUND',
          severity: 'high',
          details: {
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent'),
          },
        });
        
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid refresh token' },
          { status: 401 }
        );
      }
      
      if (error.code === 'TOKEN_REUSE_DETECTED') {
        // Race condition or concurrent reuse - revoke everything
        const userId = error.userId || payload.sub;
        const familyId = error.familyId;
        
        await revokeAllUserTokens(userId, 'Token reuse detected during rotation');
        
        await logSecurityEvent({
          userId,
          eventType: 'TOKEN_REUSE_DETECTED',
          severity: 'critical',
          details: {
            tokenFamilyId: familyId,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent'),
          },
        });
        
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Token has been revoked' },
          { status: 401 }
        );
      }
      
      throw error;
    }

    // Generate new access token (keep the same payload)
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Log successful token rotation
    await logSecurityEvent({
      userId: user.id,
      eventType: 'TOKEN_ROTATED',
      severity: 'low',
      details: {
        tokenFamilyId: familyId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: newRefreshToken, // Use the new rotated token
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer' as const,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
