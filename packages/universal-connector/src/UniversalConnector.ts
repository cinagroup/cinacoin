/**
 * @cinacoin/universal-connector — UniversalConnector main class.
 *
 * Implements IUniversalConnector — a single API surface for connecting to,
 * interacting with, and managing connections across multiple blockchain
 * networks via the adapter registry and chain manager.
 */

import type {
  IUniversalConnector,
  ConnectOptions,
  ConnectionResult,
  SignatureResult,
  TransactionRequest,
  TxResult,
  ChainInfo,
  EventHandler,
} from './types';

import type { BaseAdapter } from './adapters/BaseAdapter';
import { getAdapter, listAdapters } from './adapters';
import { ChainManager, getAllChains } from './chains';

/* ------------------------------------------------------------------ */
/*  UniversalConnector                                                  */
/* ------------------------------------------------------------------ */

/**
 * Configuration for the UniversalConnector instance.
 */
export interface UniversalConnectorConfig {
  /** WalletConnect / infrastructure project ID. */
  projectId?: string;
  /** CAIP-2 chain IDs to pre-register (e.g. "eip155:1"). */
  chains?: string[];
  /** Default chain ID. */
  defaultChain?: string;
  /** Whether to auto-detect and connect on init. */
  autoConnect?: boolean;
}

/**
 * UniversalConnector — the main entry point.
 *
 * Manages a registry of chain adapters (EVM, Solana, Bitcoin, etc.)
 * and exposes a unified connection/signing API.
 *
 * @example
 * ```ts
 * const connector = new UniversalConnector({
 *   projectId: 'abc123',
 *   chains: ['eip155:1', 'solana:mainnet'],
 *   defaultChain: 'eip155:1',
 * });
 *
 * const result = await connector.connect('eip155:1');
 * const sig = await connector.signMessage('hello');
 * ```
 */
export class UniversalConnector implements IUniversalConnector {
  private chainManager: ChainManager;
  private eventListeners: Map<string, Set<EventHandler>> = new Map();
  private _currentChain: string | null = null;
  private _projectId?: string;

  constructor(config?: UniversalConnectorConfig) {
    this._projectId = config?.projectId;
    this.chainManager = new ChainManager({
      defaultChain: config?.defaultChain,
    });

    // Pre-register chains
    if (config?.chains) {
      for (const chainId of config.chains) {
        this.chainManager.register(chainId);
      }
    }
  }

  /* ── Connection ── */

  /**
   * Connect to a specific chain via its registered adapter.
   */
  async connect(chainId: string, options?: ConnectOptions): Promise<ConnectionResult> {
    const adapter = this.resolveAdapter(chainId);
    if (!adapter) {
      throw new Error(`No adapter registered for chain "${chainId}"`);
    }

    const result = await adapter.connect({
      ...(options ?? {}),
      timeout: options?.timeout ?? 30_000,
    });

    // Update state
    this._currentChain = chainId;
    this.chainManager.setConnected(chainId, result.accounts, result.sessionId);

    // Emit event
    this.emit('connect', {
      chainId,
      accounts: result.accounts,
      adapterId: result.adapterId,
    });

    return result;
  }

  /**
   * Disconnect from a chain, or all chains if no chainId specified.
   */
  async disconnect(chainId?: string): Promise<void> {
    if (chainId) {
      const adapter = this.resolveAdapter(chainId);
      if (adapter) {
        await adapter.disconnect();
      }
      this.chainManager.setDisconnected(chainId);

      if (this._currentChain === chainId) {
        this._currentChain = null;
      }

      this.emit('disconnect', { chainId });
    } else {
      // Disconnect all
      for (const adapter of listAdapters()) {
        try {
          await adapter.disconnect();
        } catch {
          // ignore
        }
      }
      this.chainManager.disconnectAll();
      this._currentChain = null;
      this.emit('disconnect', { chainId: '*' });
    }
  }

  /* ── Signing ── */

  /**
   * Sign a message on a specific chain.
   */
  async signMessage(message: string, chainId?: string): Promise<SignatureResult> {
    const target = chainId ?? this._currentChain;
    if (!target) {
      throw new Error('No active chain. Connect first or specify chainId.');
    }

    const adapter = this.resolveAdapter(target);
    if (!adapter) {
      throw new Error(`No adapter for chain "${target}"`);
    }

    return adapter.signMessage(message);
  }

  /**
   * Sign and optionally broadcast a transaction.
   */
  async signTransaction(tx: TransactionRequest, chainId?: string): Promise<TxResult> {
    const target = chainId ?? this._currentChain;
    if (!target) {
      throw new Error('No active chain. Connect first or specify chainId.');
    }

    const adapter = this.resolveAdapter(target);
    if (!adapter) {
      throw new Error(`No adapter for chain "${target}"`);
    }

    return adapter.signTransaction(tx);
  }

  /* ── Chain Management ── */

  /**
   * Get all registered / available chains.
   */
  getChains(): ChainInfo[] {
    return this.chainManager.getAll();
  }

  /**
   * Switch the active chain.
   */
  async switchChain(chainId: string): Promise<void> {
    const previousChain = this._currentChain;

    // Ensure the chain is registered
    const chainInfo = this.chainManager.getById(chainId);
    if (!chainInfo) {
      throw new Error(`Chain "${chainId}" is not registered`);
    }

    // Connect to the new chain if not already connected
    const state = this.chainManager.getState(chainId);
    if (!state.connected) {
      await this.connect(chainId);
    } else {
      this._currentChain = chainId;
    }

    this.emit('chainChanged', {
      chainId,
      previousChainId: previousChain ?? '',
    });
  }

  /**
   * Get the currently active chain, or null if not connected.
   */
  getCurrentChain(): ChainInfo | null {
    if (!this._currentChain) return null;
    return this.chainManager.getById(this._currentChain);
  }

  /**
   * Get the current chain ID string, or null.
   */
  getCurrentChainId(): string | null {
    return this._currentChain;
  }

  /**
   * Get balances across all connected chains for a given address.
   * Queries each registered adapter to fetch the balance.
   *
   * @param address - Account address to query balances for.
   * @param chainIds - Optional list of specific chain IDs to query.
   *   If omitted, queries all registered chains.
   * @returns Array of balance results with chain info.
   *
   * @example
   * ```ts
   * const balances = await connector.getBalancesAcrossChains('0x123...');
   * for (const b of balances) {
   *   console.log(`${b.chainId}: ${b.formatted} ${b.symbol}`);
   * }
   * ```
   */
  async getBalancesAcrossChains(
    address: string,
    chainIds?: string[],
  ): Promise<
    Array<{
      chainId: string;
      address: string;
      balance: string;
      formatted: string;
      symbol: string;
      success: boolean;
      error?: string;
    }>
  > {
    const targets = chainIds ?? this.chainManager.getAll().map(c => c.id);

    const results = await Promise.allSettled(
      targets.map(async chainId => {
        const adapter = this.resolveAdapter(chainId);
        if (!adapter) {
          return {
            chainId,
            address,
            balance: '0',
            formatted: '0',
            symbol: 'UNKNOWN',
            success: false,
            error: `No adapter for chain "${chainId}"`,
          };
        }

        try {
          const balanceResult = await adapter.getBalance(address);
          return {
            chainId,
            address: balanceResult.address,
            balance: balanceResult.balance,
            formatted: balanceResult.formatted,
            symbol: balanceResult.symbol,
            success: true,
          };
        } catch (err) {
          return {
            chainId,
            address,
            balance: '0',
            formatted: '0',
            symbol: 'UNKNOWN',
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      }),
    );

    return results.map(r => {
      if (r.status === 'fulfilled') return r.value;
      return {
        chainId: 'unknown',
        address,
        balance: '0',
        formatted: '0',
        symbol: 'UNKNOWN',
        success: false,
        error: 'Query failed',
      };
    });
  }

  /**
   * Get the total USD value of balances across chains.
   * Requires price feeds for each token.
   *
   * @param balances - Array of balance results from getBalancesAcrossChains.
   * @returns Total estimated USD value.
   */
  async getTotalPortfolioValue(
    balances: Awaited<ReturnType<typeof this.getBalancesAcrossChains>>,
  ): Promise<{ totalUsd: number; perChain: Array<{ chainId: string; usd: number; symbol: string }> }> {
    // In production, fetch prices from a price oracle or CoinGecko API
    // This is a placeholder implementation
    const perChain = balances.map(b => ({
      chainId: b.chainId,
      usd: b.success ? parseFloat(b.formatted) * 0 : 0, // Placeholder
      symbol: b.symbol,
    }));

    return {
      totalUsd: perChain.reduce((sum, c) => sum + c.usd, 0),
      perChain,
    };
  }

  /* ── Events ── */

  /**
   * Register an event listener.
   */
  on(event: string, callback: EventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove an event listener.
   */
  off(event: string, callback: EventHandler): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /* ── Internal ── */

  /**
   * Resolve the appropriate adapter for a given chain ID.
   * Looks up the namespace from the chain ID and finds a matching adapter.
   */
  private resolveAdapter(chainId: string): BaseAdapter | null {
    // Try direct lookup first
    const direct = getAdapter(chainId);
    if (direct) return direct;

    // Try by namespace (e.g. "eip155:1" → namespace "eip155")
    const namespace = chainId.split(':')[0];
    return getAdapter(namespace);
  }

  /**
   * Emit an event to all registered listeners.
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[UniversalConnector] Event handler error for "${event}":`, err);
        }
      }
    }
    // Also emit on the generic 'error' event if it's an error
    if (event !== 'error' && data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) {
      this.emit('error', data);
    }
  }
}
