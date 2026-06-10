/**
 * @cinacoin/universal-connector — Chain Manager.
 *
 * Manages chain metadata by combining data from @cinacoin/chain-registry
 * (EVM chains) with manually registered non-EVM chains. Provides lookup,
 * conversion, and filtering capabilities.
 */

import type { ChainNamespace } from '@cinacoin/core-sdk';
import {
  getAllChains as getRegistryChains,
  getChainById as getRegistryChainById,
  toCaip2,
  registerChain as registerRegistryChain,
} from '@cinacoin/chain-registry';
import type { ChainRegistryEntry } from '@cinacoin/chain-registry';
import type { ChainInfo } from '../types.js';

/**
 * ChainManager — unified chain metadata manager.
 *
 * Combines chain-registry data (100+ EVM chains) with support for
 * registering non-EVM chains (Solana, Bitcoin, TON, TRON, etc.).
 *
 * All chain IDs use CAIP-2 format: "{namespace}:{reference}".
 *
 * @example
 * ```ts
 * const manager = new ChainManager();
 * // EVM chains are pre-populated from chain-registry
 * const ethChain = manager.getChain('eip155:1');
 * // Register non-EVM chains manually
 * manager.registerChain({
 *   id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
 *   namespace: 'solana',
 *   name: 'Solana Mainnet',
 *   ...
 * });
 * ```
 */
export class ChainManager {
  /** All chains indexed by CAIP-2 ID. */
  private readonly chains: Map<string, ChainInfo> = new Map();

  /** Chains indexed by namespace. */
  private readonly byNamespace: Map<ChainNamespace, Set<string>> = new Map();

  /** Human-readable name → chain ID mapping. */
  private readonly byName: Map<string, string> = new Map();

  constructor() {
    this._initializeEvmChains();
  }

  /* ------------------------------------------------------------------ */
  /*  Initialization                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Load EVM chains from @cinacoin/chain-registry.
   * Converts ChainRegistryEntry → ChainInfo format.
   */
  private _initializeEvmChains(): void {
    const registryChains = getRegistryChains();

    for (const entry of registryChains) {
      const chainInfo = this._registryEntryToChainInfo(entry);
      this._addChain(chainInfo);
    }
  }

  /**
   * Convert a chain-registry entry to ChainInfo format.
   */
  private _registryEntryToChainInfo(entry: ChainRegistryEntry): ChainInfo {
    const caip2 = toCaip2(entry);

    return {
      id: caip2,
      namespace: 'eip155',
      name: entry.name,
      shortName: entry.shortName,
      rpcUrl: entry.rpcUrls[0] ?? '',
      rpcUrls: entry.rpcUrls,
      nativeCurrency: entry.nativeCurrency,
      explorerUrl: entry.blockExplorer,
      iconUrl: entry.icon,
      testnet: entry.testnet,
      category: entry.category,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Chain Management                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Add a chain to all internal indexes.
   */
  private _addChain(chain: ChainInfo): void {
    this.chains.set(chain.id, chain);
    this.byName.set(chain.name.toLowerCase(), chain.id);

    const nsSet = this.byNamespace.get(chain.namespace);
    if (nsSet) {
      nsSet.add(chain.id);
    } else {
      this.byNamespace.set(chain.namespace, new Set([chain.id]));
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Register a chain (for non-EVM chains or custom chains).
   *
   * @param chain - Chain information to register.
   * @returns The registered chain info.
   */
  registerChain(chain: ChainInfo): ChainInfo {
    this._addChain(chain);
    return chain;
  }

  /**
   * Register multiple chains.
   *
   * @param chains - Array of chain information.
   */
  registerChains(chains: ChainInfo[]): void {
    for (const chain of chains) {
      this._addChain(chain);
    }
  }

  /**
   * Get a chain by CAIP-2 ID.
   *
   * @param chainId - Chain identifier (e.g. "eip155:1").
   * @returns Chain info or undefined.
   */
  getChain(chainId: string): ChainInfo | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all registered chains.
   */
  getAllChains(): ChainInfo[] {
    return Array.from(this.chains.values());
  }

  /**
   * Get chains by namespace.
   *
   * @param namespace - Chain namespace.
   */
  getChainsByNamespace(namespace: ChainNamespace): ChainInfo[] {
    const ids = this.byNamespace.get(namespace);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.chains.get(id))
      .filter((c): c is ChainInfo => c !== undefined);
  }

  /**
   * Get chains by name (case-insensitive partial match).
   *
   * @param query - Search query.
   * @returns Matching chains.
   */
  searchChains(query: string): ChainInfo[] {
    const q = query.toLowerCase();
    return this.getAllChains().filter(
      chain =>
        chain.name.toLowerCase().includes(q) ||
        chain.shortName?.toLowerCase().includes(q) ||
        chain.id.toLowerCase().includes(q),
    );
  }

  /**
   * Check if a chain is registered.
   *
   * @param chainId - Chain identifier.
   */
  hasChain(chainId: string): boolean {
    return this.chains.has(chainId);
  }

  /**
   * Get the chain ID from a human-readable name.
   *
   * @param name - Chain name.
   * @returns Chain ID or undefined.
   */
  getChainIdByName(name: string): string | undefined {
    return this.byName.get(name.toLowerCase());
  }

  /**
   * Look up a chain by EVM chain ID (numeric).
   *
   * @param chainId - Numeric EVM chain ID.
   * @returns Chain info or undefined.
   */
  getChainByEvmId(chainId: number): ChainInfo | undefined {
    const registryEntry = getRegistryChainById(chainId);
    if (!registryEntry) return undefined;
    const caip2 = toCaip2(registryEntry);
    return this.chains.get(caip2);
  }

  /**
   * Get all registered namespaces.
   */
  getNamespaces(): ChainNamespace[] {
    return Array.from(this.byNamespace.keys());
  }

  /**
   * Get chain count.
   */
  getChainCount(): number {
    return this.chains.size;
  }

  /**
   * Get EVM chain count (for quick stats).
   */
  getEvmChainCount(): number {
    return this.byNamespace.get('eip155')?.size ?? 0;
  }
}
