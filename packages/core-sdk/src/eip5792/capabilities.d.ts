/** @ts-nocheck */
/**
 * wallet_getCapabilities implementation (EIP-5792).
 *
 * Queries a wallet for its supported capabilities per chain,
 * such as paymasterService, sessionKeys, atomicBatch, etc.
 */
import type { Address, WalletClient } from 'viem';
import type { WalletCapabilities, ChainCapabilities } from './types.js';
/**
 * Request wallet capabilities from a connected wallet provider.
 *
 * Calls the `wallet_getCapabilities` JSON-RPC method.
 *
 * @param client - Viem WalletClient connected to the wallet.
 * @param account - Optional account address to query.
 * @returns WalletCapabilities keyed by chain ID (hex).
 */
export declare function walletGetCapabilities(client: WalletClient, account?: Address): Promise<WalletCapabilities>;
/**
 * Check if the wallet supports a specific capability on a chain.
 *
 * @param capabilities - WalletCapabilities from wallet_getCapabilities.
 * @param chainId - Chain ID in hex format.
 * @param capability - Capability name (e.g., 'paymasterService').
 * @returns True if the capability is supported.
 */
export declare function hasCapability(capabilities: WalletCapabilities, chainId: string, capability: keyof ChainCapabilities): boolean;
/**
 * Get capabilities for a specific chain, returning defaults if not found.
 */
export declare function getChainCapabilities(capabilities: WalletCapabilities, chainId: string): ChainCapabilities;
/**
 * Get all chain IDs the wallet supports with any capabilities.
 */
export declare function getSupportedChains(capabilities: WalletCapabilities): string[];
/**
 * Filter capabilities to only chains that support a specific feature.
 */
export declare function filterByCapability(capabilities: WalletCapabilities, capability: keyof ChainCapabilities): WalletCapabilities;
//# sourceMappingURL=capabilities.d.ts.map