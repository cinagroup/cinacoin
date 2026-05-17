/**
 * Solana sign-in adapter for cross-chain authentication.
 *
 * Implements Solana's sign-message flow (ed25519 signatures)
 * for cross-chain sign-in compatible with SIWX.
 */
import type { SIWXParams, SIWXResult, SIWXVerifyInput } from '../types.js';
/**
 * Create a sign-in message for Solana chains.
 *
 * Solana doesn't have an EIP-4361 equivalent, so we use a
 * structured plain-text format inspired by the SIWE specification.
 *
 * @param params - SIWX parameters.
 * @returns Solana sign-in message string.
 */
export declare function createSolanaSignInMessage(params: SIWXParams): string;
/**
 * Verify a Solana ed25519 signature against a message.
 *
 * Solana uses ed25519 signatures which require the public key
 * to be available for verification (no recovery like ECDSA).
 *
 * @param input - Verification input.
 * @returns SIWX result with validity status.
 *
 * Note: This requires an ed25519 verification implementation.
 * In practice, use @noble/ed25519 or @stablelib/ed25519.
 */
export declare function verifySolanaSignature(input: SIWXVerifyInput): Promise<SIWXResult>;
/**
 * Parse a Solana sign-in message into structured data.
 *
 * @param message - Solana sign-in message string.
 * @returns Parsed message fields.
 */
export declare function parseSolanaMessage(message: string): Record<string, any>;
//# sourceMappingURL=solana.d.ts.map