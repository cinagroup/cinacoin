/**
 * POST /api/auth/passkey/login/verify
 * Verify authentication response and issue tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { 
  consumeWebAuthnChallenge, 
  findPasskeyByCredentialId, 
  updatePasskeyCounter,
  findUserById,
  updateLastLogin 
} from '@/db';
import { generateTokenPair, toPublicUser, getConfig } from '@/lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, challenge } = body;
    
    if (!credential || !challenge) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Credential and challenge are required' },
        { status: 400 }
      );
    }
    
    // Consume the challenge
    const challengeRecord = await consumeWebAuthnChallenge(challenge, 'authentication');
    if (!challengeRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired challenge' },
        { status: 401 }
      );
    }
    
    // Find passkey by credential ID
    const credentialIdBuffer = Buffer.from(credential.id, 'base64url');
    const passkey = await findPasskeyByCredentialId(credentialIdBuffer);
    
    if (!passkey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Unknown credential' },
        { status: 401 }
      );
    }
    
    const config = getConfig();
    
    // Verify authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: config.cors.origin,
      expectedRPID: new URL(config.cors.origin).hostname,
      authenticator: {
        credentialID: Buffer.from(passkey.credential_id).toString('base64url'),
        credentialPublicKey: new Uint8Array(passkey.public_key),
        counter: passkey.counter,
      },
    });
    
    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Verification failed' },
        { status: 401 }
      );
    }
    
    // Update counter
    await updatePasskeyCounter(passkey.id, verification.authenticationInfo.newCounter);
    
    // Get user
    const user = await findUserById(passkey.user_id);
    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Account is suspended or deleted' },
        { status: 403 }
      );
    }
    
    // Update last login
    await updateLastLogin(user.id);
    
    // Generate tokens
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
    console.error('Passkey login verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to verify authentication' },
      { status: 500 }
    );
  }
}
