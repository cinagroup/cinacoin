/**
 * POST /api/auth/web3/verify
 * Verify SIWE signature and issue tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { 
  consumeWeb3Nonce, 
  findWeb3Wallet, 
  upsertWeb3Wallet, 
  findUserByEmail,
  createUser,
  updateLastLogin 
} from '@/db';
import { verifySiweSignature, parseSiweMessage } from '@/lib/siwe';
import { generateTokenPair, toPublicUser } from '@/lib';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, signature, domain } = body;
    
    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Message and signature are required' },
        { status: 400 }
      );
    }
    
    // Parse SIWE message
    const parsed = parseSiweMessage(message);
    
    if (!parsed.address || !parsed.nonce) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid SIWE message format' },
        { status: 400 }
      );
    }
    
    // Verify nonce
    const nonceRecord = await consumeWeb3Nonce(parsed.nonce, parsed.address);
    if (!nonceRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired nonce' },
        { status: 401 }
      );
    }
    
    // Verify signature
    const isValid = await verifySiweSignature({
      message,
      signature,
      address: parsed.address,
    });
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Check if wallet exists
    let wallet = await findWeb3Wallet(parsed.address, 'ethereum');
    let user;
    
    if (wallet) {
      // Existing wallet - find user
      const { findUserById } = await import('@/db');
      user = await findUserById(wallet.user_id);
      
      if (!user || user.status === 'deleted') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Account is suspended or deleted' },
          { status: 403 }
        );
      }
      
      // Update wallet last used
      const { updateWeb3WalletLastUsed } = await import('@/db');
      await updateWeb3WalletLastUsed(wallet.id);
    } else {
      // New wallet - create user or link to existing
      // For now, create a new user with a generated email
      const tempEmail = `${parsed.address.toLowerCase()}@web3.cinacoin.local`;
      user = await findUserByEmail(tempEmail);
      
      if (!user) {
        // Create new user
        user = await createUser({
          email: tempEmail,
          username: `web3_${parsed.address.slice(2, 10)}`,
          passwordHash: '', // No password for Web3-only users
          displayName: `${parsed.address.slice(0, 6)}...${parsed.address.slice(-4)}`,
        });
      }
      
      // Link wallet to user
      wallet = await upsertWeb3Wallet({
        userId: user.id,
        address: parsed.address,
        chain: 'ethereum',
        chainId: parsed.chainId || 1,
      });
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
        wallet: {
          address: wallet.address,
          chain: wallet.chain,
          isPrimary: wallet.is_primary,
        },
      },
    });
  } catch (error) {
    console.error('Web3 verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to verify signature' },
      { status: 500 }
    );
  }
}
