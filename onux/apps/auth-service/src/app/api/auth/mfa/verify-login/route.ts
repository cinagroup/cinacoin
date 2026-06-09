/**
 * POST /api/auth/mfa/verify-login
 * Verify MFA code during login flow and issue JWT tokens
 * 
 * This endpoint is called after the user has successfully authenticated with
 * password and received an mfaToken from POST /api/auth/login.
 * 
 * Request body: { mfaToken: string, code: string }
 * Response: JWT tokens on successful MFA verification
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTokenPair, toPublicUser } from '@/lib';
import { findUserById, updateLastLogin, getUserTotpMethod, consumeMfaSession, verifyRecoveryCode } from '@/db';
import { verifyTotpToken } from '@/lib/totp';

// Validation schema
const verifyLoginSchema = z.object({
  mfaToken: z.string().uuid('Invalid MFA token format'),
  code: z.string().min(6, 'Code must be at least 6 characters').max(20, 'Code too long'),
  method: z.enum(['totp', 'recovery_code']).optional().default('totp'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = verifyLoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: 'Validation failed',
          details: validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
        },
        { status: 400 }
      );
    }

    const { mfaToken, code, method } = validation.data;

    // Consume the MFA session (validates token and marks as used)
    const userId = await consumeMfaSession(mfaToken);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired MFA token' },
        { status: 401 }
      );
    }

    // Fetch user to verify they're still active
    const user = await findUserById(userId);
    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Account is suspended or deleted' },
        { status: 403 }
      );
    }

    // Verify the MFA code
    let verified = false;
    
    if (method === 'recovery_code') {
      // Verify recovery code
      verified = await verifyRecoveryCode(userId, code);
    } else {
      // Verify TOTP code
      const totpMethod = await getUserTotpMethod(userId);
      if (!totpMethod || !totpMethod.totp_secret) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'MFA not configured for this user' },
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

    // MFA verification successful - issue JWT tokens
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
  } catch (error) {
    console.error('MFA verify-login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to verify MFA' },
      { status: 500 }
    );
  }
}
