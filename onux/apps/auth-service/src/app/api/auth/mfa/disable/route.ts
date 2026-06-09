/**
 * POST /api/auth/mfa/disable
 * Disable MFA for the authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { disableMfa, getUserTotpMethod, getRecoveryCodesCount } from '@/db';
import { verifyTotpToken } from '@/lib/totp';

async function handler(req: NextRequest) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { code, confirmDisable } = body;

    if (!confirmDisable) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Must confirm disable with confirmDisable: true' },
        { status: 400 }
      );
    }

    // Require TOTP code to disable MFA (security measure)
    if (code) {
      const totpMethod = await getUserTotpMethod(userId);
      if (totpMethod && totpMethod.totp_secret) {
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
      }
    }

    // Disable all MFA methods
    await disableMfa(userId);

    return NextResponse.json({
      success: true,
      data: {
        mfaEnabled: false,
        message: 'MFA has been disabled',
      },
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to disable MFA' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handler);
