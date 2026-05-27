/**
 * JWT utilities for session token verification.
 * Uses jose library for production-grade JWT handling.
 */

import { jwtVerify, decodeJwt } from 'jose';

export interface SessionTokenPayload {
  address: string;
  chainId: number;
  nonce: string;
  expiresAt: number;
  iat?: number;
}

/**
 * Verify and decode a JWT session token.
 * @param token - The JWT token to verify
 * @param secret - The secret key for verification
 * @returns Decoded payload or null if invalid
 */
export async function verifySessionToken(token: string, secret: string): Promise<SessionTokenPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    
    // Validate required fields
    if (
      typeof payload.address === 'string' &&
      typeof payload.chainId === 'number' &&
      typeof payload.nonce === 'string' &&
      typeof payload.expiresAt === 'number'
    ) {
      return payload as SessionTokenPayload;
    }
    
    return null;
  } catch (error) {
    console.warn('JWT verification failed:', error);
    return null;
  }
}

/**
 * Decode JWT without verification (for debugging only).
 * @param token - The JWT token to decode
 * @returns Decoded payload or null if invalid
 */
export function decodeSessionTokenUnsafe(token: string): SessionTokenPayload | null {
  try {
    const { payload } = decodeJwt(token);
    return payload as SessionTokenPayload;
  } catch (error) {
    console.warn('JWT decode failed:', error);
    return null;
  }
}