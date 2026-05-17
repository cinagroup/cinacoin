/**
 * SIWX Verifier Registry — Chain-specific signature verifier management.
 *
 * Provides a pluggable registry for registering, retrieving, and managing
 * signature verifiers across different blockchain namespaces (EVM, Solana,
 * Bitcoin, TON, Tron, and custom chains).
 *
 * @packageDocumentation
 */
import type { SIWXVerifyInput, SIWXResult } from './types.js';
/**
 * Verifier function signature.
 *
 * A verifier takes a SIWXVerifyInput and returns an SIWXResult with the
 * verification outcome.
 */
export type VerifierFn = (input: SIWXVerifyInput) => Promise<SIWXResult> | SIWXResult;
/**
 * Registered verifier descriptor.
 */
export interface VerifierDescriptor {
    /** Human-readable name of the chain/namespace. */
    name: string;
    /** CAIP-2 namespace identifier (e.g., 'eip155', 'solana', 'bip122', 'ton', 'tron'). */
    namespace: string;
    /** The verification function. */
    verify: VerifierFn;
    /** Whether this verifier is built-in or custom-registered. */
    source: 'builtin' | 'custom';
    /** Version of the verifier implementation. */
    version: string;
}
/**
 * Configuration for registering a custom verifier.
 */
export interface RegisterVerifierOptions {
    /** Human-readable name for the verifier. */
    name?: string;
    /** Optional version string (default: '1.0.0'). */
    version?: string;
}
/**
 * SIWX Verifier Registry.
 *
 * Central registry for chain-specific signature verifiers. Comes pre-loaded
 * with built-in verifiers for EVM, Solana, Bitcoin, TON, and Tron. Custom
 * verifiers can be registered at runtime.
 *
 * @example
 * ```ts
 * import { VerifierRegistry } from '@cinaconnect/siwx';
 *
 * const registry = new VerifierRegistry();
 *
 * // Get a built-in verifier
 * const evmVerifier = registry.getVerifier('eip155');
 * const result = await evmVerifier({
 *   message: '...',
 *   signature: '0x...',
 *   address: '0x...',
 *   chainType: 'evm',
 * });
 *
 * // Register a custom verifier
 * registry.registerVerifier('polkadot', async (input) => {
 *   // Custom Polkadot verification logic
 *   return { /* ... *\/ };
 * });
 * ```
 */
export declare class VerifierRegistry {
    /** Map of namespace → verifier descriptor. */
    private _verifiers;
    constructor();
    /**
     * Register a custom verifier for a chain namespace.
     *
     * If a verifier already exists for the namespace, it is overwritten
     * (unless the existing one is built-in — in that case, a warning is
     * emitted and the custom verifier is still registered, shadowing the
     * built-in).
     *
     * @param namespace - CAIP-2 namespace identifier (e.g., 'polkadot', 'cosmos').
     * @param verifyFn - The verification function.
     * @param options - Optional name and version for the verifier.
     */
    registerVerifier(namespace: string, verifyFn: VerifierFn, options?: RegisterVerifierOptions): void;
    /**
     * Get a verifier by namespace.
     *
     * @param namespace - CAIP-2 namespace identifier.
     * @returns The verifier descriptor, or `undefined` if not registered.
     */
    getVerifier(namespace: string): VerifierDescriptor | undefined;
    /**
     * Get all registered namespace identifiers.
     *
     * @returns Array of namespace strings.
     */
    getRegisteredNamespaces(): string[];
    /**
     * Check whether a verifier is registered for a namespace.
     *
     * @param namespace - CAIP-2 namespace identifier.
     * @returns `true` if a verifier exists.
     */
    hasVerifier(namespace: string): boolean;
    /**
     * Remove a custom verifier.
     *
     * Built-in verifiers cannot be removed (use `registerVerifier` to shadow
     * them instead).
     *
     * @param namespace - CAIP-2 namespace identifier.
     * @returns `true` if a custom verifier was removed.
     */
    removeVerifier(namespace: string): boolean;
    /**
     * Get summary information about all registered verifiers.
     *
     * Useful for debugging and admin panels.
     */
    listVerifiers(): Array<{
        namespace: string;
        name: string;
        source: 'builtin' | 'custom';
        version: string;
    }>;
    /** Register all built-in verifiers. */
    private _registerBuiltins;
    private _registerBuiltin;
}
/**
 * Default singleton VerifierRegistry instance.
 *
 * Pre-loaded with built-in verifiers for eip155, solana, bip122, ton, and tron.
 */
export declare const defaultVerifierRegistry: VerifierRegistry;
//# sourceMappingURL=verifier-registry.d.ts.map