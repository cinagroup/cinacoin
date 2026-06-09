/**
 * POST /api/auth/web3/nonce
 * Generate a nonce for SIWE signing
 */
import { NextRequest, NextResponse } from 'next/server';
import { createWeb3Nonce } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, domain } = body;
    
    if (!address || !domain) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Address and domain are required' },
        { status: 400 }
      );
    }
    
    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }
    
    const nonceRecord = await createWeb3Nonce({
      address: address.toLowerCase(),
      domain,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        nonce: nonceRecord.nonce,
        domain,
        address: address.toLowerCase(),
        expiresAt: nonceRecord.expires_at,
      },
    });
  } catch (error) {
    console.error('Web3 nonce error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
