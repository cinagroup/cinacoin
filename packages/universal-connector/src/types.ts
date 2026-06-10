/**
 * @cinacoin/universal-connector — Type definitions.
 *
 * Defines the unified multi-chain connector interface and all supporting
 * types used across adapters, chain management, and event handling.
 *
 * Design philosophy:
 * - Build on top of @cinacoin/core-sdk types (Chain, TransactionRequest, etc.)
 * - Build on top of @cinacoin/chain-registry types (ChainRegistryEntry)
 * - Provide a chain-agnostic abstraction layer
 */

import type {
  Chain,
  ChainNamespace,
  TransactionRequest,
  EventHandler,
} from '@cinacoin/core-sdk';

import type { ChainRegistryEntry } from '@cinacoin/chain-registry';

// Re-export core types for downstream consumers
export type { TransactionRequest, EventHandler };

/* ------------------------------------------------------------------ */
/*  Chain Info                                                          */
/* ------------------------------------------------------------------ */

/**
 * Unified chain metadata used throughout the universal connector.
 *
 * Combines core-sdk Chain data with chain-registry metadata and
 * adds namespace information for multi-chain support.
 */
export interface ChainInfo {
  /** Unique chain identifier (CAIP-2 format, e.g. "eip155:1"). */
  id: string;
  /** Chain namespace (e.g. "eip155", "solana", "bip122"). */
  namespace: ChainNamespace;
  /** Human-readable chain name. */
  name: string;
  /** Short name / slug (e.g. "eth", "arb"). */
  shortName?: string;
  /** JSON-RPC endpoint URL. */
  rpcUrl: string;
  /** Additional RPC endpoints for failover. */
  rpcUrls?: string[];
  /** Native currency metadata. */
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Block explorer base URL. */
  explorerUrl?: string;
  /** Chain icon URL. */
  iconUrl?: string;
  /** Whether this is a testnet. */
  testnet: boolean;
  /** Category tag for filtering. */
  category?: string;
}

/* ------------------------------------------------------------------ */
/*  Connection Types                                                    */
/* ------------------------------------------------------------------ */

/**
 * Options for connecting to a chain.
 */
export interface ConnectOptions {
  /** Target chain ID (CAIP-2). Overrides adapter default. */
  chainId?: string;
  /** Specific wallet provider to use (e.g. "metamask", "phantom"). */
  provider?: string;
  /** Requested accounts / addresses. */
  accounts?: string[];
  /** Whether to request chain switch if already connected to a different chain. */
  autoSwitchChain?: boolean;
  /** Connection timeout in milliseconds. */
  timeout?: number;
  /** Whether to persist the connection across page reloads. */
  persist?: boolean;
  /** Arbitrary adapter-specific options. */
  [key: string]: unknown;
}

/**
 * Result of a successful chain connection.
 */
export interface ConnectionResult {
  /** Unique session identifier. */
  sessionId: string;
  /** The chain that was connected to. */
  chainId: string;
  /** Connected account addresses. */
  accounts: string[];
  /** The adapter that handled the connection. */
  adapterId: string;
  /** Connection timestamp (ms since epoch). */
  connectedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Signing Types                                                       */
/* ------------------------------------------------------------------ */

/**
 * Result of a message signing operation.
 */
export interface SignatureResult {
  /** The signed message. */
  message: string;
  /** The signature (hex-encoded or base58, chain-dependent). */
  signature: string;
  /** The address that signed. */
  address: string;
  /** The chain context for the signature. */
  chainId: string;
}

/**
 * Result of a transaction signing / submission.
 */
export interface TxResult {
  /** Transaction hash / ID. */
  hash: string;
  /** The chain the transaction was submitted to. */
  chainId: string;
  /** Sender address. */
  from: string;
  /** Recipient address (if applicable). */
  to?: string;
  /** Raw signed transaction data (chain-specific encoding). */
  raw?: string;
  /** Whether the transaction was successfully broadcast. */
  broadcast: boolean;
}

/* ------------------------------------------------------------------ */
/*  Balance Types                                                       */
/* ------------------------------------------------------------------ */

/**
 * Result of a balance query.
 */
export interface BalanceResult {
  /** The queried address. */
  address: string;
  /** Balance in smallest unit (wei, lamports, satoshis, etc.). */
  balance: string;
  /** Human-readable formatted balance. */
  formatted: string;
  /** Native currency symbol. */
  symbol: string;
  /** The chain context. */
  chainId: string;
}

/* ------------------------------------------------------------------ */
/*  Events                                                              */
/* ------------------------------------------------------------------ */

/**
 * Standard event names emitted by the universal connector.
 */
export type ConnectorEvent =
  | 'connect'
  | 'disconnect'
  | 'chainChanged'
  | 'accountsChanged'
  | 'error';

/**
 * Payload for the 'connect' event.
 */
export interface ConnectEventPayload {
  chainId: string;
  accounts: string[];
  adapterId: string;
}

/**
 * Payload for the 'disconnect' event.
 */
export interface DisconnectEventPayload {
  chainId: string;
  reason?: string;
}

/**
 * Payload for the 'chainChanged' event.
 */
export interface ChainChangedEventPayload {
  chainId: string;
  previousChainId: string;
}

/**
 * Payload for the 'accountsChanged' event.
 */
export interface AccountsChangedEventPayload {
  chainId: string;
  accounts: string[];
  previousAccounts: string[];
}

/**
 * Generic event callback type.
 */
export type EventCallback = (...args: any[]) => void;

/* ------------------------------------------------------------------ */
/*  Main Interface                                                      */
/* ------------------------------------------------------------------ */

/**
 * IUniversalConnector — unified multi-chain connector interface.
 *
 * Provides a single API surface for connecting to, interacting with,
 * and managing connections across multiple blockchain networks.
 *
 * @example
 * ```ts
 * const connector = new UniversalConnector();
 * const result = await connector.connect('eip155:1');
 * const sig = await connector.signMessage('hello', 'eip155:1');
 * ```
 */
export interface IUniversalConnector {
  /**
   * Connect to a specific chain.
   *
   * @param chainId - CAIP-2 chain identifier (e.g. "eip155:1").
   * @param options - Optional connection parameters.
   * @returns Connection result with accounts and session info.
   */
  connect(chainId: string, options?: ConnectOptions): Promise<ConnectionResult>;

  /**
   * Connect to multiple chains in parallel.
   *
   * @param chainIds - Array of CAIP-2 chain identifiers.
   * @param options - Optional connection parameters applied to all.
   * @returns Array of connection results (settled, not all-settled — rejects on first failure).
   */
  connectMultiple(chainIds: string[], options?: ConnectOptions): Promise<ConnectionResult[]>;

  /**
   * Disconnect from a chain, or all chains if no chainId specified.
   *
   * @param chainId - Optional chain to disconnect from. Omit to disconnect all.
   */
  disconnect(chainId?: string): Promise<void>;

  /**
   * Sign a message on a specific chain.
   *
   * @param message - The message to sign.
   * @param chainId - Optional chain context. Uses current chain if omitted.
   * @returns Signature result.
   */
  signMessage(message: string, chainId?: string): Promise<SignatureResult>;

  /**
   * Sign and optionally broadcast a transaction.
   *
   * @param tx - Transaction request.
   * @param chainId - Optional chain context. Uses current chain if omitted.
   * @returns Transaction result with hash.
   */
  signTransaction(tx: TransactionRequest, chainId?: string): Promise<TxResult>;

  /**
   * Get balance for an address on a specific chain.
   *
   * @param address - Account address. If omitted, uses the connected account.
   * @param chainId - Optional chain context. Uses current chain if omitted.
   * @returns Balance result.
   */
  getBalance(address?: string, chainId?: string): Promise<BalanceResult>;

  /**
   * Get all registered / available chains.
   */
  getChains(): ChainInfo[];

  /**
   * Switch the active chain.
   *
   * @param chainId - CAIP-2 chain identifier to switch to.
   */
  switchChain(chainId: string): Promise<void>;

  /**
   * Get the currently active chain, or null if not connected.
   */
  getCurrentChain(): ChainInfo | null;

  /**
   * Register an event listener.
   *
   * @param event - Event name.
   * @param callback - Handler function.
   */
  on(event: string, callback: EventHandler): void;

  /**
   * Remove an event listener.
   *
   * @param event - Event name.
   * @param callback - Handler to remove.
   */
  off(event: string, callback: EventHandler): void;
}

/* ------------------------------------------------------------------ */
/*  Adapter Types                                                       */
/* ------------------------------------------------------------------ */

/**
 * Configuration for initializing a chain adapter.
 */
export interface AdapterConfig {
  /** Adapter identifier (e.g. "evm", "solana", "bitcoin"). */
  id: string;
  /** Human-readable adapter display name. */
  name?: string;
  /** Supported chain namespaces. */
  namespaces: ChainNamespace[];
  /** Adapter-specific options. */
  options?: Record<string, unknown>;
}

/**
 * Connection state for a single chain.
 */
export interface ChainConnectionState {
  /** Whether the chain is currently connected. */
  connected: boolean;
  /** Connected accounts. */
  accounts: string[];
  /** Connection timestamp. */
  connectedAt?: number;
  /** Session identifier. */
  sessionId?: string;
}

/**
 * Adapter registry interface (for type exports).
 */
export interface AdapterRegistry {
  register(adapter: import('./adapters/BaseAdapter').BaseAdapter): void;
  unregister(adapterId: string): void;
  getAdapter(adapterId: string): import('./adapters/BaseAdapter').BaseAdapter | undefined;
  getAdapterForChain(chainId: string): import('./adapters/BaseAdapter').BaseAdapter | undefined;
  getAllAdapters(): import('./adapters/BaseAdapter').BaseAdapter[];
  isChainSupported(chainId: string): boolean;
}
