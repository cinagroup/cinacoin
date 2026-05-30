/**
 * POST /api/auth/login — Verify SIWE signature and set session cookie
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cinacoin-session';
const NONCE_COOKIE = 'cinacoin-nonce';
const SESSION_TTL = 24 * 60 * 60; // 24 hours

async function verifySiweSignature(message: string, signature: string): Promise<string> {
  const { recoverAddress, hashMessage } = await import('viem');

  if (!signature.startsWith('0x') || signature.length !== 132) {
    throw new Error('Invalid signature format');
  }

  const msgHash = hashMessage(message);
  const recovered = await recoverAddress({
    hash: msgHash,
    signature: signature as `0x${string}`,
  });

  const lines = message.split('\n');
  const claimedAddress = lines[1]?.trim();
  if (!claimedAddress || claimedAddress.toLowerCase() !== recovered.toLowerCase()) {
    throw new Error('Address mismatch — signature does not match claimed address');
  }

  return recovered;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, signature, nonce } = body;

    if (!message || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing message, signature, or nonce' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const storedNonce = cookieStore.get(NONCE_COOKIE);
    if (!storedNonce || storedNonce.value !== nonce) {
      return NextResponse.json(
        { error: 'Invalid or expired nonce' },
        { status: 401 },
      );
    }

    const recoveredAddress = await verifySiweSignature(message, signature);

    const now = Math.floor(Date.now() / 1000);
    const session = {
      address: recoveredAddress,
      nonce,
      timestamp: now,
      expiresAt: now + SESSION_TTL,
    };

    const token = btoa(JSON.stringify(session));

    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_TTL,
    });

    cookieStore.delete(NONCE_COOKIE);

    return NextResponse.json({
      success: true,
      address: recoveredAddress,
      expiresAt: new Date((now + SESSION_TTL) * 1000).toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 },
    );
  }
}
