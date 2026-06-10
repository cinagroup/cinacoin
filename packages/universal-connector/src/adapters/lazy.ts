/**
 * Lazy-loaded adapter registry for @cinacoin/universal-connector
 *
 * Provides on-demand loading of chain adapters to reduce initial bundle size
 * and improve startup performance. Adapters are loaded only when first accessed.
 */

import type { BaseAdapter } from './BaseAdapter.js';
import type { ChainNamespace } from '@cinacoin/core-sdk';

/**
 * Lazy adapter loader function type
 */
export type LazyAdapterLoader = () => Promise<{ default: new () => BaseAdapter } | (new () => BaseAdapter)>;

/**
 * Lazy adapter registry entry
 */
interface LazyAdapterEntry {
  loader: LazyAdapterLoader;
  instance?: BaseAdapter;
  loading?: Promise<BaseAdapter>;
}

/**
 * LazyAdapterRegistry - Manages lazy-loaded chain adapters
 *
 * Adapters are loaded on-demand when first accessed, reducing initial bundle size.
 * Once loaded, adapters are cached for subsequent accesses.
 *
 * @example
 * ```typescript
 * const registry = new LazyAdapterRegistry();
 *
 * // Register adapters with dynamic imports
 * registry.register('evm', () => import('./EvmAdapter.js'));
 * registry.register('solana', () => import('./SolanaAdapter.js'));
 *
 * // Adapter loads only when accessed
 * const evmAdapter = await registry.getAdapter('evm');
 * ```
 */
export class LazyAdapterRegistry {
  private adapters = new Map<string, LazyAdapterEntry>();
  private chainToAdapter = new Map<string, string>();
  private namespaceToAdapters = new Map<ChainNamespace, Set<string>>();

  /**
   * Register a lazy-loaded adapter
   *
   * @param id - Unique adapter identifier
   * @param loader - Dynamic import function that returns the adapter class
   * @param chains - Chain IDs this adapter supports (optional, can be set later)
   * @param namespaces - Chain namespaces this adapter supports (optional)
   */
  register(
    id: string,
    loader: LazyAdapterLoader,
    chains: string[] = [],
    namespaces: ChainNamespace[] = []
  ): void {
    this.adapters.set(id, { loader });

    // Map chains to this adapter
    for (const chain of chains) {
      this.chainToAdapter.set(chain, id);
    }

    // Map namespaces to this adapter
    for (const ns of namespaces) {
      if (!this.namespaceToAdapters.has(ns)) {
        this.namespaceToAdapters.set(ns, new Set());
      }
      this.namespaceToAdapters.get(ns)!.add(id);
    }
  }

  /**
   * Get an adapter by ID, loading it if necessary
   *
   * @param id - Adapter identifier
   * @returns Promise resolving to the adapter instance
   */
  async getAdapter(id: string): Promise<BaseAdapter | undefined> {
    const entry = this.adapters.get(id);
    if (!entry) {
      return undefined;
    }

    // Return cached instance if available
    if (entry.instance) {
      return entry.instance;
    }

    // If already loading, wait for it
    if (entry.loading) {
      return entry.loading;
    }

    // Load the adapter
    entry.loading = (async () => {
      try {
        const module = await entry.loader();
        const AdapterClass = 'default' in module ? module.default : module;
        const instance = new AdapterClass();
        entry.instance = instance;
        return instance;
      } catch (error) {
        console.error(`Failed to load adapter ${id}:`, error);
        throw error;
      } finally {
        entry.loading = undefined;
      }
    })();

    return entry.loading;
  }

  /**
   * Get adapter for a specific chain
   *
   * @param chainId - Chain identifier (e.g., 'eip155:1')
   * @returns Promise resolving to the adapter instance
   */
  async getAdapterForChain(chainId: string): Promise<BaseAdapter | undefined> {
    const adapterId = this.chainToAdapter.get(chainId);
    if (!adapterId) {
      return undefined;
    }
    return this.getAdapter(adapterId);
  }

  /**
   * Get all adapters for a namespace
   *
   * @param namespace - Chain namespace (e.g., 'eip155', 'solana')
   * @returns Promise resolving to array of adapter instances
   */
  async getAdaptersByNamespace(namespace: ChainNamespace): Promise<BaseAdapter[]> {
    const adapterIds = this.namespaceToAdapters.get(namespace);
    if (!adapterIds) {
      return [];
    }

    const adapters: BaseAdapter[] = [];
    for (const id of adapterIds) {
      const adapter = await this.getAdapter(id);
      if (adapter) {
        adapters.push(adapter);
      }
    }
    return adapters;
  }

  /**
   * Check if an adapter is registered
   *
   * @param id - Adapter identifier
   */
  hasAdapter(id: string): boolean {
    return this.adapters.has(id);
  }

  /**
   * Check if an adapter is loaded
   *
   * @param id - Adapter identifier
   */
  isLoaded(id: string): boolean {
    const entry = this.adapters.get(id);
    return entry?.instance !== undefined;
  }

  /**
   * Get all registered adapter IDs
   */
  getAdapterIds(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get all loaded adapter instances
   */
  getLoadedAdapters(): BaseAdapter[] {
    const adapters: BaseAdapter[] = [];
    for (const entry of this.adapters.values()) {
      if (entry.instance) {
        adapters.push(entry.instance);
      }
    }
    return adapters;
  }

  /**
   * Preload specific adapters (useful for critical paths)
   *
   * @param ids - Adapter IDs to preload
   */
  async preload(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.getAdapter(id)));
  }

  /**
   * Preload all registered adapters
   */
  async preloadAll(): Promise<void> {
    await Promise.all(this.getAdapterIds().map(id => this.getAdapter(id)));
  }

  /**
   * Unload an adapter to free memory
   *
   * @param id - Adapter identifier
   */
  unload(id: string): void {
    const entry = this.adapters.get(id);
    if (entry) {
      entry.instance = undefined;
      entry.loading = undefined;
    }
  }

  /**
   * Unload all adapters
   */
  unloadAll(): void {
    for (const entry of this.adapters.values()) {
      entry.instance = undefined;
      entry.loading = undefined;
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    loaded: number;
    loading: number;
  } {
    let loaded = 0;
    let loading = 0;

    for (const entry of this.adapters.values()) {
      if (entry.instance) {
        loaded++;
      } else if (entry.loading) {
        loading++;
      }
    }

    return {
      total: this.adapters.size,
      loaded,
      loading,
    };
  }
}

/**
 * Create a lazy adapter registry with default adapters
 *
 * @returns LazyAdapterRegistry instance with all adapters registered
 */
export function createLazyAdapterRegistry(): LazyAdapterRegistry {
  const registry = new LazyAdapterRegistry();

  // Register all adapters with dynamic imports
  registry.register(
    'evm',
    () => import('./EvmAdapter.js'),
    ['eip155:1', 'eip155:137', 'eip155:56', 'eip155:42161', 'eip155:10'],
    ['eip155']
  );

  registry.register(
    'solana',
    () => import('./SolanaAdapter.js'),
    ['solana:4uhcVjyU9pJkvQyS88uRDiswHXSCkY3b', 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'],
    ['solana']
  );

  registry.register(
    'bitcoin',
    () => import('./BitcoinAdapter.js'),
    ['bip122:000000000019d6689c085ae165831e93', 'bip122:000000000933ea01ad0ee984209779ba'],
    ['bip122']
  );

  registry.register(
    'cosmos',
    () => import('./CosmosAdapter.js'),
    ['cosmos:cosmoshub-4', 'cosmos:osmosis-1'],
    ['cosmos']
  );

  registry.register(
    'sui',
    () => import('./SuiAdapter.js'),
    ['sui:mainnet', 'sui:testnet'],
    ['sui']
  );

  registry.register(
    'near',
    () => import('./NearAdapter.js'),
    ['near:mainnet', 'near:testnet'],
    ['near']
  );

  registry.register(
    'ton',
    () => import('./TonAdapter.js'),
    ['ton:mainnet', 'ton:testnet'],
    ['ton']
  );

  registry.register(
    'tron',
    () => import('./TronAdapter.js'),
    ['tron:mainnet', 'tron:nile'],
    ['tron']
  );

  registry.register(
    'starknet',
    () => import('./StarknetAdapter.js'),
    ['starknet:mainnet', 'starknet:testnet'],
    ['starknet']
  );

  registry.register(
    'hedera',
    () => import('./HederaAdapter.js'),
    ['hedera:mainnet', 'hedera:testnet'],
    ['hedera']
  );

  return registry;
}
