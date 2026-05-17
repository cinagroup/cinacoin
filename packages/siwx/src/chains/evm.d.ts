/**
 * EVM SIWE adapter for cross-chain sign-in.
 *
 * Implements EIP-4361 (Sign-In with Ethereum) message generation
 * and verification for the EVM chain family.
 */
import type { SIWXParams, SIWXResult, SIWXVerifyInput } from '../types.js';
/**
 * Create a sign-in message for EVM chains using EIP-4361 format.
 *
 * @param params - SIWX parameters.
 * @returns EIP-4361 formatted message string.
 */
export declare function createEvmSignInMessage(params: SIWXParams): string;
/**
 * Verify an EVM SIWE signature.
 *
 * @param input - Verification input with message, signature, address.
 * @param provider - EIP-1193 or ethers/viem provider for cryptographic verification.
 * @returns SIWX result with validity status.
 */
export declare function verifyEvmSignature(input: SIWXVerifyInput, provider: any): Promise<SIWXResult>;
/**
 * Parse an EVM SIWE message into structured data.
 *
 * @param message - EIP-4361 formatted message string.
 * @returns Parsed message fields.
 */
export declare function parseEvmMessage(message: string): any;
//# sourceMappingURL=evm.d.ts.map