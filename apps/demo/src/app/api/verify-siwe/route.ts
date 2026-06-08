/**
 * Server-side SIWE signature verification API route.
 *
 * SECURITY: Client-side verification (in siwe.ts) only checks that the wallet
 * is still connected and the address matches. This server-side route performs
 * actual cryptographic signature recovery using ethers.verifyMessage() to
 * ensure the signature was genuinely produced by the claimed address.
 *
 * POST /api/verify-siwe
 * Body: { address: string, message: string, signature: string }
 * Response: { valid: boolean, recoveredAddress?: string, error?: string }
 */

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export interface VerifySiweRequest {
  address: string;
  message: string;
  signature: string;
}

export interface VerifySiweResponse {
  valid: boolean;
  recoveredAddress?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<VerifySiweResponse>> {
  try {
    const body = await request.json() as VerifySiweRequest;
    const { address, message, signature } = body;

    // Validate required fields
    if (!address || !message || !signature) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields: address, message, signature' },
        { status: 400 }
      );
    }

    // Validate address format (basic Ethereum address check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Perform cryptographic signature recovery
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Compare recovered address with claimed address (case-insensitive)
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          recoveredAddress,
          error: 'Signature verification failed: recovered address does not match claimed address',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      recoveredAddress,
    });
  } catch (error) {
    console.error('[SIWE Verification Error]', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';

    return NextResponse.json(
      { valid: false, error: `Verification failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
