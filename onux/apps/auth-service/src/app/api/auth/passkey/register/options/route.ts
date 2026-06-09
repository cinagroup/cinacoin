/**
 * POST /api/auth/passkey/register/options
 * Generate registration options for WebAuthn
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createWebAuthnChallenge } from '@/db';
import { getConfig } from '@/lib';

async function handler(req: NextRequest) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const config = getConfig();
    
    // Get existing passkeys to exclude
    const { getUserPasskeys } = await import('@/db');
    const existingPasskeys = await getUserPasskeys(userId);
    
    const options = await generateRegistrationOptions({
      rpName: 'Cinacoin',
      rpID: new URL(config.cors.origin).hostname,
      userID: new TextEncoder().encode(userId),
      userName: req.user?.email || userId,
      userDisplayName: req.user?.email || userId,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: existingPasskeys.map(pk => ({
        id: Buffer.from(pk.credential_id).toString('base64url'),
        type: 'public-key',
        transports: pk.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });
    
    // Store challenge
    await createWebAuthnChallenge({
      userId,
      challenge: options.challenge,
      type: 'registration',
    });
    
    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Passkey register options error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handler);
