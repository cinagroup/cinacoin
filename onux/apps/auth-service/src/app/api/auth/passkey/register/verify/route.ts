/**
 * POST /api/auth/passkey/register/verify
 * Verify registration response and store passkey
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { consumeWebAuthnChallenge, createPasskey } from '@/db';
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
    
    const body = await req.json();
    const { credential, challenge } = body;
    
    if (!credential || !challenge) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Credential and challenge are required' },
        { status: 400 }
      );
    }
    
    // Consume the challenge
    const challengeRecord = await consumeWebAuthnChallenge(challenge, 'registration');
    if (!challengeRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired challenge' },
        { status: 401 }
      );
    }
    
    const config = getConfig();
    
    // Verify registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: config.cors.origin,
      expectedRPID: new URL(config.cors.origin).hostname,
    });
    
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Verification failed' },
        { status: 401 }
      );
    }
    
    const { credentialID, credentialPublicKey, counter, aaguid } = verification.registrationInfo;
    
    // Store passkey
    const passkey = await createPasskey({
      userId,
      credentialId: Buffer.from(credentialID),
      publicKey: Buffer.from(credentialPublicKey),
      counter,
      deviceType: aaguid ? 'platform' : 'cross-platform',
      name: body.name || 'Passkey',
    });
    
    return NextResponse.json({
      success: true,
      data: {
        passkeyId: passkey.id,
        name: passkey.name,
        createdAt: passkey.created_at,
      },
    });
  } catch (error) {
    console.error('Passkey register verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to verify registration' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handler);
