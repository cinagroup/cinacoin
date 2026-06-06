/**
 * Farcaster Sign-In authentication.
 *
 * Provides Sign-In with Farcaster (SIWF) message generation and validation.
 *
 * @packageDocumentation
 */
import type { FarcasterUser, SignInWithFarcasterParams, SignInWithFarcasterResult } from './types.js';
/**
 * Generate a Sign-In with Farcaster (SIWE-compatible) message.
 *
 * Follows EIP-4361 format adapted for Farcaster identity.
 *
 * @param user - Farcaster user data.
 * @param params - Sign-in parameters.
 * @returns Formatted sign-in message.
 */
export declare function createSiweMessage(user: FarcasterUser, params: SignInWithFarcasterParams): string;
/**
 * Validate a signature against a signed message.
 *
 * This is a placeholder that would be implemented with viem's
 * verifyMessage or similar on the server side.
 *
 * @param message - The message that was signed.
 * @param signature - The signature to verify.
 * @param address - The expected signer address.
 * @returns true if the signature is valid.
 */
export declare function verifySignature(_message: string, _signature: `0x${string}`, _address: `0x${string}`): boolean;
/**
 * FarcasterAuth: Authentication utilities for Farcaster Mini Apps.
 */
export declare class FarcasterAuth {
    /**
     * Create a sign-in message for a Farcaster user.
     *
     * @param user - Farcaster user data.
     * @param params - Sign-in parameters.
     * @returns SIWE-formatted message string.
     */
    static createSignInMessage(user: FarcasterUser, params: SignInWithFarcasterParams): string;
    /**
     * Generate a nonce for replay protection.
     *
     * @returns Random hex string (32 chars).
     */
    static generateNonce(): string;
    /**
     * Extract the Farcaster FID from a sign-in message.
     *
     * @param message - SIWE message string.
     * @returns Farcaster FID or null.
     */
    static extractFid(message: string): number | null;
    /**
     * Build a sign-in result from user data.
     *
     * @param user - Farcaster user.
     * @param params - Sign-in parameters.
     * @returns Partial SignInWithFarcasterResult (without signature).
     */
    static buildResult(user: FarcasterUser, params: SignInWithFarcasterParams): Omit<SignInWithFarcasterResult, 'success'>;
    /**
     * Check if a Farcaster user has a verified Ethereum address.
     *
     * @param user - Farcaster user.
     * @returns First verified ETH address or null.
     */
    static getVerifiedAddress(user: FarcasterUser): `0x${string}` | null;
}
//# sourceMappingURL=FarcasterAuth.d.ts.map