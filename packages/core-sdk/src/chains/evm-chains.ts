/**
 * EVM Chain Configurations — 100+ EVM-compatible chains via @cinacoin/chain-registry.
 *
 * Each chain includes chain ID, RPC URLs, block explorers, native currency
 * metadata, and testnet flags. Used by the EVM adapter for automatic
 * chain registration.
 *
 * Chain data is sourced from the chain-registry package, which auto-generates
 * entries from chainid.network data. This module re-exports and adapts the
 * registry data into the legacy EvmChainConfig format for backward compatibility.
 */

import type { Chain } from '../types.js';
import { CHAIN_REGISTRY, getAllChains, getChainById as getChainByIdFromRegistry, getChainByName as getChainByNameFromRegistry, searchChains as searchChainsFromRegistry } from '@cinacoin/chain-registry';

/**
 * Extended chain definition with multiple RPC URLs, explorer URLs,
 * and additional metadata beyond the base Chain type.
 */
export interface EvmChainConfig {
  /** Numeric chain ID (CAIP-2 reference). */
  id: number;
  /** Human-readable chain name. */
  name: string;
  /** Short name / ticker (e.g. 'eth', 'arb'). */
  shortName: string;
  /** Network identifier (e.g. 'mainnet', 'sepolia'). */
  network: string;
  /** Native currency metadata. */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** JSON-RPC endpoint URLs (at least 2). */
  rpcUrls: string[];
  /** Block explorer base URLs. */
  blockExplorerUrls: string[];
  /** Chain icon URLs (optional). */
  iconUrls?: string[];
  /** Whether this is a testnet. */
  isTestnet: boolean;
}

/**
 * Convert an EvmChainConfig to the base Chain type for SDK compatibility.
 */
function toChain(cfg: EvmChainConfig): Chain {
  return {
    id: `eip155:${cfg.id}`,
    name: cfg.name,
    rpcUrl: cfg.rpcUrls[0],
    nativeCurrency: cfg.nativeCurrency,
    explorerUrl: cfg.blockExplorerUrls[0],
  };
}

/* ------------------------------------------------------------------ */
/*  Chain Definitions                                                  */
/* ------------------------------------------------------------------ */

/**
 * Convert a chain-registry entry to the legacy EvmChainConfig format.
 */
function fromRegistry(cfg: ReturnType<typeof getAllChains>[number]): EvmChainConfig {
  return {
    id: cfg.id,
    name: cfg.name,
    shortName: cfg.shortName,
    network: cfg.testnet ? (cfg.name.toLowerCase().includes('sepolia') ? 'sepolia' : 'testnet') : 'mainnet',
    nativeCurrency: cfg.nativeCurrency,
    rpcUrls: cfg.rpcUrls,
    blockExplorerUrls: cfg.blockExplorer ? [cfg.blockExplorer] : [],
    iconUrls: cfg.icon ? [cfg.icon] : [],
    isTestnet: cfg.testnet,
  };
}

const evmChains: EvmChainConfig[] = CHAIN_REGISTRY.map(fromRegistry);

// Re-export legacy search functions that delegate to chain-registry
/** Find a chain by numeric chain ID. */
export function getChainById(chainId: number): EvmChainConfig | undefined {
  const entry = getChainByIdFromRegistry(chainId);
  return entry ? fromRegistry(entry) : undefined;
}

/** Find a chain by name (case-insensitive). */
export function getChainByName(name: string): EvmChainConfig | undefined {
  const entry = getChainByNameFromRegistry(name);
  return entry ? fromRegistry(entry) : undefined;
}

/** Search chains by query (delegates to chain-registry). */
export function searchChains(query: string): EvmChainConfig[] {
  return searchChainsFromRegistry(query).map(fromRegistry);
}

export { CHAIN_REGISTRY } from '@cinacoin/chain-registry';

/* ------------------------------------------------------------------ */
/*  Public Exports                                                     */
/* ------------------------------------------------------------------ */

/** All EVM chain configurations. */
export const EVM_CHAINS: EvmChainConfig[] = evmChains;

/** All chains converted to the base Chain type for SDK compatibility. */
export const DEFAULT_EVM_CHAINES: Chain[] = evmChains.map(toChain);
