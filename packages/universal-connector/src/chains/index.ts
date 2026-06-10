/**
 * @cinacoin/universal-connector — Chains module barrel export.
 *
 * Re-exports ChainManager and provides convenience functions
 * for accessing chain metadata globally.
 */

import { ChainManager } from './ChainManager.js';
import type { ChainInfo } from '../types.js';
import type { ChainNamespace } from '@cinacoin/core-sdk';

/* ------------------------------------------------------------------ */
/*  Global ChainManager singleton                                       */
/* ------------------------------------------------------------------ */

const globalChainManager = new ChainManager();

/**
 * Register a chain globally.
 *
 * @param chain - Chain information to register.
 * @returns The registered chain info.
 */
export function addChain(chain: ChainInfo): ChainInfo {
  return globalChainManager.registerChain(chain);
}

/**
 * Register multiple chains globally.
 *
 * @param chains - Array of chain information.
 */
export function addChains(chains: ChainInfo[]): void {
  globalChainManager.registerChains(chains);
}

/**
 * Get all registered chains.
 */
export function getAllChains(): ChainInfo[] {
  return globalChainManager.getAllChains();
}

/**
 * Get a chain by CAIP-2 ID.
 *
 * @param chainId - Chain identifier (e.g. "eip155:1").
 * @returns Chain info or undefined.
 */
export function getChainById(chainId: string): ChainInfo | undefined {
  return globalChainManager.getChain(chainId);
}

/**
 * Get chains by category.
 *
 * @param category - Category tag (e.g. "evm", "l2", "testnet").
 * @returns Matching chains.
 */
export function getChainsByCategory(category: string): ChainInfo[] {
  return getAllChains().filter(chain => chain.category === category);
}

/**
 * Get chains by namespace.
 *
 * @param namespace - Chain namespace (e.g. "eip155", "solana").
 * @returns Matching chains.
 */
export function getChainsByNamespace(namespace: ChainNamespace): ChainInfo[] {
  return globalChainManager.getChainsByNamespace(namespace);
}

/**
 * Search chains by name (case-insensitive partial match).
 *
 * @param query - Search query.
 * @returns Matching chains.
 */
export function searchChains(query: string): ChainInfo[] {
  return globalChainManager.searchChains(query);
}

/**
 * Get the global ChainManager instance.
 */
export function getChainManager(): ChainManager {
  return globalChainManager;
}

// Re-export ChainManager class for advanced usage
export { ChainManager } from './ChainManager.js';
