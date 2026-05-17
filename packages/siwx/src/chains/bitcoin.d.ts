/**
 * Bitcoin BIP-322 sign-in adapter for cross-chain authentication.
 *
 * Implements "Sign Message" verification per BIP-322,
 * adapted for cross-chain sign-in (SIWX) purposes.
 *
 * BIP-322 Reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */
import type { SIWXParams, SIWXResult, SIWXVerifyInput } from '../types.js';
/**
 * Create a sign-in message for Bitcoin chains using BIP-322 compatible format.
 *
 * @param params - SIWX parameters.
 * @returns Bitcoin sign-in message string.
 */
export declare function createBitcoinSignInMessage(params: SIWXParams): string;
/**
 * Verify a Bitcoin BIP-322 signature against a message.
 *
 * BIP-322 defines a generic "Sign Message" scheme that works with
 * P2PKH, P2WPKH, and Taproot addresses.
 *
 * @param input - Verification input.
 * @returns SIWX result with validity status.
 *
 * Note: Full BIP-322 verification requires access to Bitcoin script
 * validation. In practice, use a Bitcoin library like bitcoinjs-lib.
 */
export declare function verifyBitcoinSignature(input: SIWXVerifyInput): Promise<SIWXResult>;
/**
 * Parse a Bitcoin sign-in message into structured data.
 *
 * @param message - Bitcoin sign-in message string.
 * @returns Parsed message fields.
 */
export declare function parseBitcoinMessage(message: string): Record<string, any>;
//# sourceMappingURL=bitcoin.d.ts.map