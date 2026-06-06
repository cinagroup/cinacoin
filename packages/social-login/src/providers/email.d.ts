/**
 * Email-based authentication provider for social login.
 *
 * Implements magic link and OTP-based authentication that
 * creates a wallet bound to the user's email identity.
 *
 * Flow:
 * 1. User enters email
 * 2. System sends magic link or OTP
 * 3. User clicks link or enters OTP
 * 4. System verifies and issues JWT + wallet address
 */
import type { SocialLoginResult, MagicLinkParams } from '../types.js';
/**
 * Generate a one-time password (OTP) for email verification.
 *
 * @param length - OTP length (default: 6).
 * @returns Numeric OTP string.
 */
export declare function generateOTP(length?: number): string;
/**
 * Generate a magic link token.
 *
 * @returns Cryptographically secure random token (hex, 32 bytes).
 */
export declare function generateMagicLinkToken(): string;
/**
 * Build a magic link URL.
 *
 * @param params - Magic link parameters.
 * @param token - Pre-generated or newly generated token.
 * @returns Full magic link URL.
 */
export declare function buildMagicLink(params: MagicLinkParams, token?: string): string;
/**
 * Validate a magic link token.
 *
 * @param token - The token from the magic link.
 * @param email - The email address to verify against.
 * @param storedToken - The server-stored token for comparison.
 * @param expiry - Token expiration timestamp (Unix seconds).
 * @returns True if the token is valid.
 */
export declare function validateMagicLinkToken(token: string, email: string, storedToken: string, expiry: number): boolean;
/**
 * Validate an OTP code.
 *
 * @param provided - The OTP entered by the user.
 * @param stored - The server-stored OTP.
 * @param expiry - OTP expiration timestamp (Unix seconds).
 * @returns True if the OTP is valid.
 */
export declare function validateOTP(provided: string, stored: string, expiry: number): boolean;
/**
 * Handle the full email login flow.
 *
 * @param email - User's email address.
 * @param sendEmail - Function to send the email (magic link or OTP).
 * @param deriveWallet - Function to derive a wallet from the email identity.
 * @param generateJWT - Function to generate a JWT token for the authenticated user.
 * @param loginMethod - 'magiclink' or 'otp'.
 * @param verifyData - Token/OTP data for verification step.
 * @returns Social login result.
 */
export declare function loginWithEmail(email: string, sendEmail: (to: string, subject: string, body: string) => Promise<void>, deriveWallet: (email: string) => Promise<{
    address: string;
    publicKey?: string;
}>, generateJWT: (userId: string, email: string) => Promise<{
    token: string;
    expiresAt: number;
}>, loginMethod?: 'magiclink' | 'otp', verifyData?: {
    token?: string;
    otp?: string;
    storedToken?: string;
    storedOTP?: string;
    expiry?: number;
}): Promise<SocialLoginResult>;
//# sourceMappingURL=email.d.ts.map