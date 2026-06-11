/**
 * @cinacoin/universal-connector — Base adapter abstract class.
 *
 * All chain-specific adapters must extend this base class.
 * Provides common functionality for connection management, event handling,
 * and chain state tracking.
 */

import { EventEmitter } from '@cinacoin/core-sdk';
import type { Chain, EventHandler } from '@cinacoin/core-sdk';
import type {
  ChainInfo,
  ConnectOptions,
  ConnectionResult,
  SignatureResult,
  TxResult,
  BalanceResult,
  ChainConnectionState,
  AdapterConfig,
} from '../types.js';

/**
 * BaseAdapter — abstract base class for all chain adapters.
 *
 * Provides:
 * - Event emitter integration
 * - Connection state management
 * - Chain registration and lookup
 * - Abstract methods that subclasses must implement
 *
 * @example
 * ```ts
 * class EvmAdapter extends BaseAdapter {
 *   async connect(options?: ConnectOptions): Promise<ConnectionResult> {
 *     // EVM-specific connection logic
 *   }
 *   // ... implement other abstract methods
 * }
 * ```
 */
export abstract class BaseAdapter {
  /** Unique adapter identifier. */
  readonly id: string;

  /** Human-readable adapter name. */
  readonly name: string;

  /** Supported chain namespaces. */
  readonly namespaces: string[];

  /** Adapter-specific options. */
  protected readonly options: Record<string, unknown>;

  /** Event emitter for adapter-specific events. */
  protected readonly emitter: EventEmitter;

  /** Registered chains for this adapter. */
  protected readonly chains: Map<string, ChainInfo> = new Map();

  /** Connection state per chain. */
  protected readonly connectionStates: Map<string, ChainConnectionState> = new Map();

  /** Currently active chain ID for this adapter. */
  protected _activeChainId: string | null = null;

  constructor(config: AdapterConfig) {
    this.id = config.id;
    this.name = config.name ?? config.id;
    this.namespaces = config.namespaces;
    this.options = config.options ?? {};
    this.emitter = new EventEmitter();
  }

  /* ------------------------------------------------------------------ */
  /*  Chain Registration                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Register a chain with this adapter.
   *
   * @param chain - Chain information to register.
   */
  registerChain(chain: ChainInfo): void {
    this.chains.set(chain.id, chain);
  }

  /**
   * Register multiple chains.
   *
   * @param chains - Array of chain information.
   */
  registerChains(chains: ChainInfo[]): void {
    for (const chain of chains) {
      this.registerChain(chain);
    }
  }

  /**
   * Get a registered chain by ID.
   *
   * @param chainId - Chain identifier.
   */
  getChain(chainId: string): ChainInfo | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all registered chains.
   */
  getChains(): ChainInfo[] {
    return Array.from(this.chains.values());
  }

  /**
   * Check if this adapter supports a chain.
   *
   * @param chainId - Chain identifier.
   */
  supportsChain(chainId: string): boolean {
    return this.chains.has(chainId);
  }

  /* ------------------------------------------------------------------ */
  /*  Connection State                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Get connection state for a chain.
   *
   * @param chainId - Chain identifier.
   */
  getConnectionState(chainId: string): ChainConnectionState {
    return (
      this.connectionStates.get(chainId) ?? {
        connected: false,
        accounts: [],
      }
    );
  }

  /**
   * Check if connected to a chain.
   *
   * @param chainId - Chain identifier.
   */
  isConnected(chainId?: string): boolean {
    const target = chainId ?? this._activeChainId;
    if (!target) return false;
    return this.getConnectionState(target).connected;
  }

  /**
   * Set connection state for a chain.
   *
   * @param chainId - Chain identifier.
   * @param state - Connection state.
   */
  protected setConnectionState(chainId: string, state: ChainConnectionState): void {
    this.connectionStates.set(chainId, state);
  }

  /**
   * Clear connection state for a chain.
   *
   * @param chainId - Chain identifier.
   */
  protected clearConnectionState(chainId: string): void {
    this.connectionStates.delete(chainId);
  }

  /**
   * Get the currently active chain ID.
   */
  getActiveChainId(): string | null {
    return this._activeChainId;
  }

  /* ------------------------------------------------------------------ */
  /*  Event Handling                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Register an event listener.
   *
   * @param event - Event name.
   * @param handler - Event handler.
   */
  on(event: string, handler: EventHandler): void {
    this.emitter.on(event, handler);
  }

  /**
   * Remove an event listener.
   *
   * @param event - Event name.
   * @param handler - Event handler.
   */
  off(event: string, handler: EventHandler): void {
    this.emitter.off(event, handler);
  }

  /**
   * Emit an event.
   *
   * @param event - Event name.
   * @param args - Event arguments.
   */
  protected emit(event: string, ...args: unknown[]): void {
    this.emitter.emit(event, ...args);
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a unique session ID.
   */
  protected generateSessionId(): string {
    return `${this.id}-${Date.now()}-${crypto.randomUUID().slice(0, 10)}`;
  }

  /**
   * Resolve the target chain ID from options or active chain.
   *
   * @param options - Connect options that may contain chainId.
   */
  protected resolveChainId(options?: ConnectOptions): string {
    const fromOptions = options?.chainId;
    if (fromOptions && typeof fromOptions === 'string') {
      return fromOptions;
    }
    if (this._activeChainId) return this._activeChainId;
    // Default to first registered chain
    const first = this.chains.keys().next();
    if (!first.done && first.value) return first.value;
    throw new Error(`[${this.id}] No chain specified and no active chain`);
  }

  /**
   * Require connection to a chain, throwing if not connected.
   *
   * @param chainId - Optional chain to check. Defaults to active chain.
   */
  protected requireConnection(chainId?: string): ChainConnectionState {
    const target = chainId ?? this._activeChainId;
    if (!target) {
      throw new Error(`[${this.id}] Not connected. Call connect() first.`);
    }
    const state = this.getConnectionState(target);
    if (!state.connected) {
      throw new Error(`[${this.id}] Not connected to chain "${target}". Call connect() first.`);
    }
    return state;
  }

  /* ------------------------------------------------------------------ */
  /*  Abstract Methods (must be implemented by subclasses)                */
  /* ------------------------------------------------------------------ */

  /**
   * Connect to a chain.
   *
   * @param options - Connection options (may include chainId, provider, etc.).
   * @returns Connection result.
   */
  abstract connect(options?: ConnectOptions): Promise<ConnectionResult>;

  /**
   * Disconnect from the current chain (or all chains managed by this adapter).
   */
  abstract disconnect(): Promise<void>;

  /**
   * Sign a message on the active chain.
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  abstract signMessage(message: string): Promise<SignatureResult>;

  /**
   * Sign a transaction on the active chain.
   *
   * @param tx - Transaction request (chain-specific shape).
   * @returns Transaction result.
   */
  abstract signTransaction(tx: unknown): Promise<TxResult>;

  /**
   * Get balance for an address on the active chain.
   *
   * @param address - Account address. If omitted, uses connected account.
   * @returns Balance result.
   */
  abstract getBalance(address?: string): Promise<BalanceResult>;

  /**
   * Get connected accounts for the active chain.
   *
   * @returns Array of account addresses.
   */
  abstract getAccounts(): Promise<string[]>;

  /**
   * Switch to a different chain within this adapter's namespace.
   *
   * @param chainId - Target chain identifier.
   */
  abstract switchChain(chainId: string): Promise<void>;
}
