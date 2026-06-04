/**
 * @cinacoin/chain-registry
 *
 * EVM chain registry with 150+ chains, auto-generated from chainid.network.
 * CAIP-2 compatible with search, category filtering, and dynamic registration.
 */

import { CHAIN_REGISTRY } from './chains.js';
import type { ChainRegistryEntry, ChainCategory } from './types.js';

// Internal mutable registry
const _registry = new Map<number, ChainRegistryEntry>(
  CHAIN_REGISTRY.map((c) => [c.id, c])
);

const _nameIndex = new Map<string, ChainRegistryEntry>(
  CHAIN_REGISTRY.map((c) => [c.name.toLowerCase(), c])
);

// Popular chains by TVL / usage
const POPULAR_IDS = [1, 10, 56, 137, 42161, 8453, 43114, 100, 324, 250, 59144, 534352, 1284, 42220, 25, 97, 80002, 421614, 11155111, 11155420];

/** Get all registered chains. */
export function getAllChains(): ChainRegistryEntry[] {
  return Array.from(_registry.values());
}

/** Get a chain by its numeric chainId. */
export function getChainById(chainId: number): ChainRegistryEntry | undefined {
  return _registry.get(chainId);
}

/** Get a chain by its name (case-insensitive). */
export function getChainByName(name: string): ChainRegistryEntry | undefined {
  return _nameIndex.get(name.toLowerCase());
}

/** Search chains by name or symbol. */
export function searchChains(query: string): ChainRegistryEntry[] {
  const q = query.toLowerCase();
  return Array.from(_registry.values()).filter(
    (c) => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q)
  );
}

/** Get chains by category. */
export function getChainsByCategory(category: ChainCategory): ChainRegistryEntry[] {
  return Array.from(_registry.values()).filter((c) => c.category === category);
}

/** Get the top 20 most popular chains. */
export function getPopularChains(): ChainRegistryEntry[] {
  return POPULAR_IDS.map((id) => _registry.get(id)).filter(Boolean) as ChainRegistryEntry[];
}

/** Get all testnets. */
export function getTestnets(): ChainRegistryEntry[] {
  return Array.from(_registry.values()).filter((c) => c.testnet);
}

/** Get all mainnets. */
export function getMainnets(): ChainRegistryEntry[] {
  return Array.from(_registry.values()).filter((c) => !c.testnet);
}

/** Register a new chain dynamically. */
export function registerChain(chain: ChainRegistryEntry): void {
  _registry.set(chain.id, chain);
  _nameIndex.set(chain.name.toLowerCase(), chain);
}

/** Convert a chain entry to CAIP-2 string. */
export function toCaip2(chain: ChainRegistryEntry): string {
  return `eip155:${chain.id}`;
}

/** Parse a CAIP-2 string to chain entry. */
export function fromCaip2(caip2: string): ChainRegistryEntry | undefined {
  const match = /^eip155:(\d+)$/.exec(caip2);
  if (!match) return undefined;
  return _registry.get(Number(match[1]));
}

/** Total chain count. */
export const CHAIN_COUNT = _registry.size;

/** Export the static registry data for direct access. */
export { CHAIN_REGISTRY };
export type { ChainRegistryEntry, ChainCategory };
