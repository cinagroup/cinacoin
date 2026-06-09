/**
 * POST /api/auth/passkey/login/options
 * Generate authentication options for WebAuthn login
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createWebAuthnChallenge, getUserPasskeys, findPasskeyByCredentialId } from '@/db';
import { getConfig } from '@/lib';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    const config = getConfig();
    let allowCredentials: { id: string; type: 'public-key'; transports?: AuthenticatorTransport[] }[] = [];
    
    // If userId provided, get user's passkeys
    if (userId) {
      const passkeys = await getUserPasskeys(userId);
      allowCredentials = passkeys.map(pk => ({
        id: Buffer.from(pk.credential_id).toString('base64url'),
        type: 'public-key' as const,
        transports: pk.transports as AuthenticatorTransport[],
      }));
    }
    
    const options = await generateAuthenticationOptions({
      rpID: new URL(config.cors.origin).hostname,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: 'preferred',
      timeout: 60000,
    });
    
    // Store challenge
    await createWebAuthnChallenge({
      userId: userId || undefined,
      challenge: options.challenge,
      type: 'authentication',
    });
    
    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Passkey login options error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}
