/**
 * SIWX (Sign-In with Cross-chain) — Cross-chain authentication abstraction.
 *
 * Unified interface for sign-in across EVM (EIP-4361), Solana, and Bitcoin (BIP-322).
 */
import type { SIWXParams, SIWXResult, SIWXVerifyInput, ChainType } from './types.js';
/**
 * Create a sign-in message for the specified chain type.
 *
 * Automatically enriches params with defaults (nonce, issuedAt) if not provided.
 *
 * @param params - SIWX parameters.
 * @param chainType - Target chain type ('evm' | 'solana' | 'bitcoin').
 * @returns Formatted sign-in message string.
 */
export declare function createSignInMessage(params: SIWXParams, chainType: ChainType): string;
/**
 * Verify a cross-chain sign-in signature.
 *
 * Dispatches to the appropriate chain-specific verification method.
 *
 * @param input - Verification input (message, signature, address, chainType).
 * @param provider - Optional provider (required for EVM verification).
 * @returns SIWX result with validity status.
 */
export declare function verifySignIn(input: SIWXVerifyInput, provider?: any): Promise<SIWXResult>;
/**
 * SIWX adapter interface for extending with new chain types.
 */
export interface SIWXAdapter {
    /** Chain type this adapter handles. */
    readonly chainType: ChainType;
    /**
     * Create a sign-in message for this chain.
     */
    createMessage(params: SIWXParams): string;
    /**
     * Verify a signature for this chain.
     */
    verify(input: SIWXVerifyInput, provider?: any): Promise<SIWXResult>;
}
/**
 * Registry of SIWX adapters for extensible chain support.
 */
export declare class SIWXRegistry {
    private adapters;
    /**
     * Register a new chain adapter.
     */
    register(adapter: SIWXAdapter): void;
    /**
     * Get an adapter by chain type.
     */
    get(chainType: ChainType): SIWXAdapter | undefined;
    /**
     * Check if an adapter exists for a chain type.
     */
    has(chainType: ChainType): boolean;
    /**
     * Get all registered chain types.
     */
    getRegisteredChains(): ChainType[];
}
export declare const defaultRegistry: SIWXRegistry;
//# sourceMappingURL=siwx.d.ts.map