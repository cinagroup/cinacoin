/**
 * GET /api/auth/mfa/status
 * Get MFA status for the authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getUserTotpMethod, getRecoveryCodesCount, getUserPasskeys } from '@/db';

async function handler(req: NextRequest) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get TOTP status
    const totpMethod = await getUserTotpMethod(userId);
    
    // Get recovery codes count
    const recoveryCodesRemaining = await getRecoveryCodesCount(userId);
    
    // Get passkeys count
    const passkeys = await getUserPasskeys(userId);

    return NextResponse.json({
      success: true,
      data: {
        mfaEnabled: !!totpMethod,
        totp: {
          enabled: !!totpMethod,
          verified: totpMethod?.totp_verified || false,
        },
        passkeys: {
          count: passkeys.length,
          devices: passkeys.map(pk => ({
            id: pk.id,
            name: pk.name,
            deviceType: pk.device_type,
            lastUsedAt: pk.last_used_at,
            createdAt: pk.created_at,
          })),
        },
        recoveryCodes: {
          remaining: recoveryCodesRemaining,
        },
      },
    });
  } catch (error) {
    console.error('MFA status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get MFA status' },
      { status: 500 }
    );
  }
}

export const GET = requireAuth(handler);
