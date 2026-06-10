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
 *   async connect(chainId: string, options?: ConnectOptions): Promise<ConnectionResult> {
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

  /** Event emitter for adapter-specific events. */
  protected readonly emitter: EventEmitter;

  /** Registered chains for this adapter. */
  protected readonly chains: Map<string, ChainInfo> = new Map();

  /** Connection state per chain. */
  protected readonly connectionStates: Map<string, ChainConnectionState> = new Map();

  constructor(config: AdapterConfig) {
    this.id = config.id;
    this.name = config.id; // Can be overridden
    this.namespaces = config.namespaces;
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
   * @returns Chain info or undefined.
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
  isConnected(chainId: string): boolean {
    return this.getConnectionState(chainId).connected;
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
  /*  Abstract Methods (must be implemented by subclasses)                */
  /* ------------------------------------------------------------------ */

  /**
   * Connect to a chain.
   *
   * @param chainId - Chain identifier.
   * @param options - Connection options.
   * @returns Connection result.
   */
  abstract connect(chainId: string, options?: ConnectOptions): Promise<ConnectionResult>;

  /**
   * Disconnect from a chain.
   *
   * @param chainId - Chain identifier.
   */
  abstract disconnect(chainId: string): Promise<void>;

  /**
   * Sign a message.
   *
   * @param message - Message to sign.
   * @param chainId - Chain context.
   * @returns Signature result.
   */
  abstract signMessage(message: string, chainId: string): Promise<SignatureResult>;

  /**
   * Sign a transaction.
   *
   * @param tx - Transaction request.
   * @param chainId - Chain context.
   * @returns Transaction result.
   */
  abstract signTransaction(tx: unknown, chainId: string): Promise<TxResult>;

  /**
   * Get connected accounts.
   *
   * @param chainId - Chain identifier.
   * @returns Array of account addresses.
   */
  abstract getAccounts(chainId: string): Promise<string[]>;

  /**
   * Switch to a different chain.
   *
   * @param chainId - Target chain identifier.
   */
  abstract switchChain(chainId: string): Promise<void>;
}
