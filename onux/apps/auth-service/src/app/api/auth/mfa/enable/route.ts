/**
 * POST /api/auth/mfa/enable
 * Enable TOTP MFA for the authenticated user
 * Returns QR code URI and secret for setup
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { createTotpMethod, storeRecoveryCodes } from '@/db';
import { generateTotpSecret, generateTotpUri, generateRecoveryCodes } from '@/lib/totp';

async function handler(req: NextRequest) {
  try {
    const userId = req.user?.sub;
    const email = req.user?.email;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Generate TOTP secret
    const secret = generateTotpSecret();

    // Generate URI for QR code
    const { uri } = generateTotpUri({
      issuer: 'Cinacoin',
      account: email || userId,
      secret,
    });

    // Store the TOTP method (unverified until user confirms)
    const method = await createTotpMethod({ userId, secret });

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    await storeRecoveryCodes(userId, recoveryCodes);

    return NextResponse.json({
      success: true,
      data: {
        methodId: method.id,
        secret,
        uri,
        recoveryCodes,
      },
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to enable MFA' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handler);
