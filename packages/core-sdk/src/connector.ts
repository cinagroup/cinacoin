/**
 * Connector interface — abstract base for all wallet connection methods.
 */

import type { ConnectParams, ConnectionResult, EventHandler, TransactionRequest } from './types';
import { EventEmitter } from './events';

/**
 * Connector abstract base class.
 *
 * Each wallet connection method (injected, QR, relay/WC) implements
 * this interface to provide a uniform API.
 */
export abstract class Connector extends EventEmitter {
  /** Unique connector identifier. */
  abstract readonly id: string;

  /** Human-readable connector name (for UI display). */
  abstract readonly name: string;

  /** Icon URL or data URI for the connector. */
  abstract readonly icon: string;

  /** Whether this connector is available (e.g., wallet extension installed). */
  abstract readonly installed: boolean;

  /** Connection type: 'injected' | 'qr' | 'relay' | 'walletconnect' */
  abstract readonly type: string;

  /**
   * Connect to a wallet.
   * @param params - Optional connection parameters.
   * @returns Connection result with accounts, chain ID, and session ID.
   */
  abstract connect(params?: ConnectParams): Promise<ConnectionResult>;

  /**
   * Disconnect from the wallet.
   */
  abstract disconnect(): Promise<void>;

  /**
   * Get the currently connected account addresses.
   * @returns Array of account addresses.
   */
  abstract getAccounts(): Promise<string[]>;

  /**
   * Get the current chain ID.
   * @returns Numeric chain ID.
   */
  abstract getChainId(): Promise<number>;

  /**
   * Switch to a different chain.
   * @param chainId - Target chain ID.
   */
  abstract switchChain(chainId: number): Promise<void>;

  /**
   * Sign a message with the connected account.
   * @param message - Message to sign.
   * @returns Signature as a hex string.
   */
  abstract signMessage(message: string): Promise<string>;

  /**
   * Sign a transaction.
   * @param tx - Transaction request.
   * @returns Signed transaction as a hex string.
   */
  abstract signTransaction(tx: TransactionRequest): Promise<string>;

  /**
   * Get the raw underlying provider for advanced usage.
   * Returns null if the connector doesn't expose a raw provider.
   */
  getProvider(): unknown {
    return null;
  }
}
