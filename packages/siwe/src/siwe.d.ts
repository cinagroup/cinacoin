/**
 * Core SIWE (Sign-In with Ethereum) implementation per EIP-4361.
 *
 * Provides message generation, parsing, and signature verification
 * for Ethereum-based authentication.
 *
 * Reference: https://eips.ethereum.org/EIPS/eip-4361
 */
import type { SIWEParams, ParsedSIWE, SIWEVerificationResult } from './types.js';
/**
 * Generate a SIWE message string from structured parameters.
 *
 * The message follows the EIP-4361 ABNF grammar:
 *
 * ```
 * ${domain} wants you to sign in with your Ethereum account:
 * ${address}
 *
 * ${statement}
 *
 * URI: ${uri}
 * Version: ${version}
 * Chain ID: ${chainId}
 * Nonce: ${nonce}
 * Issued At: ${issuedAt}
 * Expiration Time: ${expirationTime}
 * Not Before: ${notBefore}
 * Request ID: ${requestId}
 * Resources:
 * - ${resource1}
 * - ${resource2}
 * ```
 *
 * @param params - SIWE message parameters.
 * @returns Formatted SIWE message string ready for signing.
 * @throws Error if parameters fail validation.
 */
export declare function generateMessage(params: SIWEParams): string;
/**
 * Parse a SIWE message string into structured data.
 *
 * Reverses the generateMessage function to extract all fields
 * from a formatted SIWE message.
 *
 * @param message - SIWE message string.
 * @returns Parsed SIWE data object.
 * @throws Error if the message cannot be parsed.
 */
export declare function parseMessage(message: string): ParsedSIWE;
/**
 * Verify a SIWE signature against the message and recover the address.
 *
 * Uses the provided provider (ethers, viem, or web3) to perform
 * the cryptographic verification.
 *
 * @param message - The SIWE message string that was signed.
 * @param signature - The signature (hex string with 0x prefix).
 * @param provider - EIP-1193 provider or ethers/viem compatible provider.
 * @returns Verification result with parsed data and validity status.
 */
export declare function verifyMessage(message: string, signature: string, provider: any): Promise<SIWEVerificationResult>;
//# sourceMappingURL=siwe.d.ts.map