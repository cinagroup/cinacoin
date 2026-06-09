/**
 * POST /api/auth/mfa/verify
 * Verify TOTP code and activate MFA
 * Also used to verify TOTP during login (MFA challenge)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { 
  enableTotpMethod, 
  getUserTotpMethod, 
  verifyRecoveryCode,
  consumeMfaChallenge,
  createMfaChallenge 
} from '@/db';
import { verifyTotpToken } from '@/lib/totp';
import { generateTokenPair, toPublicUser } from '@/lib';
import { findUserById, updateLastLogin } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, method, sessionToken } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Code is required' },
        { status: 400 }
      );
    }

    // If sessionToken provided, this is MFA verification during login
    if (sessionToken) {
      return handleMfaLoginVerification(sessionToken, code, method);
    }

    // Otherwise, this is initial TOTP setup verification
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authorization scheme' },
        { status: 401 }
      );
    }

    const { verifyAccessToken } = await import('@/lib');
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = payload.sub;

    // Get user's TOTP method
    const totpMethod = await getUserTotpMethod(userId);
    if (!totpMethod || !totpMethod.totp_secret) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'MFA not set up. Call /api/auth/mfa/enable first.' },
        { status: 400 }
      );
    }

    // If already verified, just re-confirm
    if (totpMethod.totp_verified) {
      const isValid = verifyTotpToken({
        secret: totpMethod.totp_secret,
        token: code,
      });

      return NextResponse.json({
        success: true,
        data: { verified: isValid },
      });
    }

    // Verify TOTP code to activate MFA
    const isValid = verifyTotpToken({
      secret: totpMethod.totp_secret,
      token: code,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid TOTP code' },
        { status: 401 }
      );
    }

    // Enable the TOTP method
    const enabled = await enableTotpMethod(totpMethod.id, userId);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Internal server error', message: 'Failed to enable MFA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { 
        verified: true,
        mfaEnabled: true,
        message: 'MFA has been successfully enabled',
      },
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to verify MFA' },
      { status: 500 }
    );
  }
}

/**
 * Handle MFA verification during login flow
 */
async function handleMfaLoginVerification(sessionToken: string, code: string, method?: string) {
  // Consume the MFA challenge
  const challenge = await consumeMfaChallenge(sessionToken);
  if (!challenge) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired MFA session' },
      { status: 401 }
    );
  }

  const userId = challenge.user_id;
  let verified = false;

  if (method === 'recovery_code') {
    // Verify recovery code
    verified = await verifyRecoveryCode(userId, code);
  } else {
    // Verify TOTP
    const totpMethod = await getUserTotpMethod(userId);
    if (!totpMethod || !totpMethod.totp_secret) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'MFA not configured' },
        { status: 400 }
      );
    }

    verified = verifyTotpToken({
      secret: totpMethod.totp_secret,
      token: code,
    });
  }

  if (!verified) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid verification code' },
      { status: 401 }
    );
  }

  // MFA passed - issue tokens
  const user = await findUserById(userId);
  if (!user || user.status !== 'active') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Account is suspended or deleted' },
      { status: 403 }
    );
  }

  await updateLastLogin(user.id);

  const tokens = generateTokenPair({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    success: true,
    data: {
      ...tokens,
      tokenType: 'Bearer' as const,
      user: toPublicUser(user),
    },
  });
}
