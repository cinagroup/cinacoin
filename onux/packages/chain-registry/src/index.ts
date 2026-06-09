/**
 * @cinacoin/chain-registry — Public API.
 *
 * Provides access to 100+ EVM chains with:
 * - CAIP-2 compatible identifiers
 * - Search, category filtering, dynamic registration
 * - Popular chains helper (top 20 by TVL)
 */

import type { ChainRegistryEntry, ChainCategory, Caip2 } from './types.js';
import {
  CHAIN_REGISTRY,
  CHAIN_BY_ID,
  CHAIN_BY_NAME,
  searchChains,
  getChainsByCategory,
} from './chains.js';

/* ------------------------------------------------------------------ */
/*  Core Query Functions                                                */
/* ------------------------------------------------------------------ */

/** Get all registered chains. */
export function getAllChains(): ChainRegistryEntry[] {
  return [...CHAIN_REGISTRY];
}

/** Look up a chain by numeric chain ID. */
export function getChainById(chainId: number): ChainRegistryEntry | undefined {
  return CHAIN_BY_ID.get(chainId);
}

/** Look up a chain by name (case-insensitive). */
export function getChainByName(name: string): ChainRegistryEntry | undefined {
  return CHAIN_BY_NAME.get(name.toLowerCase());
}

/**
 * Re-export: fuzzy search chains by name, shortName, category, or ID substring.
 */
export { searchChains } from './chains.js';

/**
 * Re-export: get all chains matching a category.
 */
export { getChainsByCategory } from './chains.js';

/* ------------------------------------------------------------------ */
/*  Popular Chains                                                      */
/* ------------------------------------------------------------------ */

/**
 * Top 20 chains by approximate TVL / usage popularity.
 * Order matters — first = most popular.
 */
const POPULAR_CHAIN_IDS: number[] = [
  1,          // Ethereum
  56,         // BNB Smart Chain
  137,        // Polygon
  42161,      // Arbitrum One
  10,         // Optimism
  8453,       // Base
  43114,      // Avalanche
  1666600000, // Harmony
  250,        // Fantom
  324,        // zkSync Era
  888888888,  // Ancient8
  534352,     // Scroll
  59144,      // Linea
  81457,      // Blast
  7777777,    // Zora
  245022934,  // Neon EVM
  34443,      // Mode
  169,        // Manta Pacific
  480,        // World Chain
  1101,       // Polygon zkEVM
];

/**
 * Get the top 20 most popular chains (by TVL).
 */
export function getPopularChains(): ChainRegistryEntry[] {
  return POPULAR_CHAIN_IDS
    .map(id => CHAIN_BY_ID.get(id))
    .filter((c): c is ChainRegistryEntry => c !== undefined);
}

/* ------------------------------------------------------------------ */
/*  Dynamic Registration                                                */
/* ------------------------------------------------------------------ */

/**
 * Register a new chain dynamically at runtime.
 * Useful for custom / private chains not in the default registry.
 */
export function registerChain(chain: ChainRegistryEntry): void {
  // Replace existing entry if same ID
  const idx = CHAIN_REGISTRY.findIndex(c => c.id === chain.id);
  if (idx !== -1) {
    CHAIN_REGISTRY[idx] = chain;
  } else {
    CHAIN_REGISTRY.push(chain);
  }
  // Update lookup maps
  CHAIN_BY_ID.set(chain.id, chain);
  CHAIN_BY_NAME.set(chain.name.toLowerCase(), chain);
}

/* ------------------------------------------------------------------ */
/*  CAIP-2 Conversion                                                   */
/* ------------------------------------------------------------------ */

/**
 * Convert a chain entry to a CAIP-2 string: "eip155:{chainId}"
 */
export function toCaip2(chain: ChainRegistryEntry | number): Caip2 {
  const chainId = typeof chain === 'number' ? chain : chain.id;
  return `eip155:${chainId}`;
}

/**
 * Parse a CAIP-2 string back to a chain ID.
 */
export function fromCaip2(caip2: Caip2 | string): number | undefined {
  if (!caip2.startsWith('eip155:')) return undefined;
  const id = Number(caip2.slice(7));
  return Number.isFinite(id) ? id : undefined;
}

/* ------------------------------------------------------------------ */
/*  Type Exports                                                        */
/* ------------------------------------------------------------------ */

export type { ChainRegistryEntry, ChainCategory, Caip2 } from './types.js';

/** Re-export the raw registry and lookup maps for advanced usage. */
export { CHAIN_REGISTRY, CHAIN_BY_ID, CHAIN_BY_NAME } from './chains.js';
