/**
 * @cinacoin/universal-connector — Adapter registry and global adapter management.
 *
 * Central registry for all chain adapters. Manages registration,
 * lookup, and lifecycle of adapters.
 *
 * Exports all 10 chain adapter implementations:
 * - EvmAdapter (Ethereum, Polygon, BSC, Arbitrum, Optimism, etc.)
 * - SolanaAdapter (Solana mainnet + devnet)
 * - BitcoinAdapter (BTC mainnet + testnet)
 * - CosmosAdapter (Cosmos Hub + IBC chains)
 * - SuiAdapter (Sui mainnet + testnet)
 * - NearAdapter (NEAR mainnet + testnet)
 * - TonAdapter (TON mainnet + testnet)
 * - TronAdapter (TRON mainnet + testnet)
 * - StarknetAdapter (Starknet mainnet + testnet)
 * - HederaAdapter (Hedera mainnet + testnet)
 *
 * @example
 * ```ts
 * import { registerAdapter, getAdapter, listAdapters } from './adapters';
 * import { EvmAdapter, SolanaAdapter } from './adapters';
 *
 * registerAdapter(new EvmAdapter());
 * registerAdapter(new SolanaAdapter());
 *
 * const adapter = getAdapter('eip155:1');
 * ```
 */

import type { ChainNamespace } from '@cinacoin/core-sdk';
import { BaseAdapter } from './BaseAdapter.js';

/* ------------------------------------------------------------------ */
/*  Imports — All 10 chain adapters                                     */
/* ------------------------------------------------------------------ */

import { EvmAdapter } from './EvmAdapter.js';
import { SolanaAdapter } from './SolanaAdapter.js';
import { BitcoinAdapter } from './BitcoinAdapter.js';
import { CosmosAdapter } from './CosmosAdapter.js';
import { SuiAdapter } from './SuiAdapter.js';
import { NearAdapter } from './NearAdapter.js';
import { TonAdapter } from './TonAdapter.js';
import { TronAdapter } from './TronAdapter.js';
import { StarknetAdapter } from './StarknetAdapter.js';
import { HederaAdapter } from './HederaAdapter.js';

/* ------------------------------------------------------------------ */
/*  AdapterRegistry                                                     */
/* ------------------------------------------------------------------ */

/**
 * AdapterRegistry — manages all registered chain adapters.
 *
 * Provides:
 * - Adapter registration and lookup
 * - Chain-to-adapter resolution
 * - Namespace-based adapter discovery
 *
 * @example
 * ```ts
 * const registry = new AdapterRegistry();
 * registry.register(new EvmAdapter());
 * registry.register(new SolanaAdapter());
 *
 * const adapter = registry.getAdapterForChain('eip155:1');
 * ```
 */
export class AdapterRegistry {
  /** Registered adapters by ID. */
  private readonly adapters: Map<string, BaseAdapter> = new Map();

  /** Chain-to-adapter mapping for fast lookup. */
  private readonly chainAdapterMap: Map<string, string> = new Map();

  /** Namespace-to-adapter mapping. */
  private readonly namespaceAdapterMap: Map<string, Set<string>> = new Map();

  /* ------------------------------------------------------------------ */
  /*  Registration                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Register an adapter.
   *
   * @param adapter - Adapter instance to register.
   * @throws Error if an adapter with the same ID is already registered.
   */
  register(adapter: BaseAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter "${adapter.id}" is already registered`);
    }

    this.adapters.set(adapter.id, adapter);

    // Map all chains from the adapter to its ID
    for (const chain of adapter.getChains()) {
      this.chainAdapterMap.set(chain.id, adapter.id);
    }

    // Map namespaces
    for (const ns of adapter.namespaces) {
      if (!this.namespaceAdapterMap.has(ns)) {
        this.namespaceAdapterMap.set(ns, new Set());
      }
      this.namespaceAdapterMap.get(ns)!.add(adapter.id);
    }
  }

  /**
   * Unregister an adapter.
   *
   * @param adapterId - Adapter identifier.
   */
  unregister(adapterId: string): void {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) return;

    // Remove chain mappings
    for (const chain of adapter.getChains()) {
      this.chainAdapterMap.delete(chain.id);
    }

    // Remove namespace mappings
    for (const ns of adapter.namespaces) {
      this.namespaceAdapterMap.get(ns)?.delete(adapterId);
    }

    this.adapters.delete(adapterId);
  }

  /**
   * Register a chain with an existing adapter.
   *
   * @param adapterId - Adapter identifier.
   * @param chain - Chain to register.
   */
  registerChain(adapterId: string, chain: { id: string }): void {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new Error(`Adapter "${adapterId}" not found`);
    }

    // Update the chain-adapter mapping
    this.chainAdapterMap.set(chain.id, adapterId);
  }

  /* ------------------------------------------------------------------ */
  /*  Lookup                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Get an adapter by ID.
   *
   * @param adapterId - Adapter identifier.
   * @returns Adapter instance or undefined.
   */
  getAdapter(adapterId: string): BaseAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  /**
   * Get the adapter responsible for a specific chain.
   *
   * @param chainId - Chain identifier (e.g. "eip155:1").
   * @returns Adapter instance or undefined.
   */
  getAdapterForChain(chainId: string): BaseAdapter | undefined {
    const adapterId = this.chainAdapterMap.get(chainId);
    if (!adapterId) return undefined;
    return this.adapters.get(adapterId);
  }

  /**
   * Get all registered adapters.
   */
  getAllAdapters(): BaseAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters that support a specific namespace.
   *
   * @param namespace - Chain namespace (e.g. "eip155", "solana").
   */
  getAdaptersByNamespace(namespace: ChainNamespace): BaseAdapter[] {
    const adapterIds = this.namespaceAdapterMap.get(namespace);
    if (!adapterIds) return [];
    return Array.from(adapterIds)
      .map(id => this.adapters.get(id))
      .filter((a): a is BaseAdapter => a !== undefined);
  }

  /**
   * Get all registered chain IDs.
   */
  getRegisteredChainIds(): string[] {
    return Array.from(this.chainAdapterMap.keys());
  }

  /**
   * Check if a chain is supported by any adapter.
   *
   * @param chainId - Chain identifier.
   */
  isChainSupported(chainId: string): boolean {
    return this.chainAdapterMap.has(chainId);
  }

  /* ------------------------------------------------------------------ */
  /*  Lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Disconnect all adapters.
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.adapters.values()).map(async adapter => {
      // Disconnect all chains for this adapter
      for (const chain of adapter.getChains()) {
        if (adapter.isConnected(chain.id)) {
          await adapter.disconnect();
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Clear all registered adapters.
   */
  clear(): void {
    this.adapters.clear();
    this.chainAdapterMap.clear();
    this.namespaceAdapterMap.clear();
  }
}

/* ------------------------------------------------------------------ */
/*  Global Singleton                                                    */
/* ------------------------------------------------------------------ */

/**
 * Global adapter registry instance.
 * All adapters are registered here by default.
 */
const globalRegistry = new AdapterRegistry();

/**
 * Register all 10 chain adapters into the global registry.
 */
function registerDefaultAdapters(): void {
  const adapters = [
    new EvmAdapter(),
    new SolanaAdapter(),
    new BitcoinAdapter(),
    new CosmosAdapter(),
    new SuiAdapter(),
    new NearAdapter(),
    new TonAdapter(),
    new TronAdapter(),
    new StarknetAdapter(),
    new HederaAdapter(),
  ];

  for (const adapter of adapters) {
    globalRegistry.register(adapter);
  }
}

// Auto-register default adapters
registerDefaultAdapters();

/* ------------------------------------------------------------------ */
/*  Convenience Functions                                               */
/* ------------------------------------------------------------------ */

/**
 * Register an adapter into the global registry.
 *
 * @param adapter - Adapter instance to register.
 */
export function registerAdapter(adapter: BaseAdapter): void {
  globalRegistry.register(adapter);
}

/**
 * Get an adapter by chain ID or adapter ID.
 *
 * @param identifier - Chain ID (e.g. "eip155:1") or adapter ID (e.g. "evm").
 * @returns Adapter instance or undefined.
 */
export function getAdapter(identifier: string): BaseAdapter | undefined {
  // Try direct chain lookup first
  const byChain = globalRegistry.getAdapterForChain(identifier);
  if (byChain) return byChain;

  // Try adapter ID lookup
  return globalRegistry.getAdapter(identifier);
}

/**
 * List all registered adapters.
 */
export function listAdapters(): BaseAdapter[] {
  return globalRegistry.getAllAdapters();
}

/**
 * Get the global adapter registry.
 */
export function getRegistry(): AdapterRegistry {
  return globalRegistry;
}

/* ------------------------------------------------------------------ */
/*  Re-exports                                                          */
/* ------------------------------------------------------------------ */

export { BaseAdapter } from './BaseAdapter.js';
export { EvmAdapter } from './EvmAdapter.js';
export { SolanaAdapter } from './SolanaAdapter.js';
export { BitcoinAdapter } from './BitcoinAdapter.js';
export { CosmosAdapter } from './CosmosAdapter.js';
export { SuiAdapter } from './SuiAdapter.js';
export { NearAdapter } from './NearAdapter.js';
export { TonAdapter } from './TonAdapter.js';
export { TronAdapter } from './TronAdapter.js';
export { StarknetAdapter } from './StarknetAdapter.js';
export { HederaAdapter } from './HederaAdapter.js';
