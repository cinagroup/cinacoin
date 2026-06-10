/**
 * @cinacoin/universal-connector — Adapter registry.
 *
 * Central registry for all chain adapters. Manages registration,
 * lookup, and lifecycle of adapters.
 */

import type { ChainNamespace } from '@cinacoin/core-sdk';
import { BaseAdapter } from './BaseAdapter.js';
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
    return Array.from(this.adapters.values()).filter(adapter =>
      adapter.namespaces.includes(namespace),
    );
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
          await adapter.disconnect(chain.id);
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
  }
}

// Export BaseAdapter for convenience
export { BaseAdapter } from './BaseAdapter.js';

// Export all adapter implementations
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

/**
 * Create a default registry with all built-in adapters pre-registered.
 *
 * @example
 * ```ts
 * import { createDefaultRegistry } from '@cinacoin/universal-connector';
 *
 * const registry = createDefaultRegistry();
 * const ethAdapter = registry.getAdapterForChain('eip155:1');
 * ```
 */
export function createDefaultRegistry(): AdapterRegistry {
  const registry = new AdapterRegistry();

  // Register all built-in adapters
  registry.register(new EvmAdapter());
  registry.register(new SolanaAdapter());
  registry.register(new BitcoinAdapter());
  registry.register(new CosmosAdapter());
  registry.register(new SuiAdapter());
  registry.register(new NearAdapter());
  registry.register(new TonAdapter());
  registry.register(new TronAdapter());
  registry.register(new StarknetAdapter());
  registry.register(new HederaAdapter());

  return registry;
}
