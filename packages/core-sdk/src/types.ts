/**
 * Core type definitions for the Cinacoin SDK.
 *
 * These types define the shared data structures used across all
 * chain adapters, connectors, and the session manager.
 *
 * CAIP-2/10/19 types are re-exported from `@cinacoin/caip` for use
 * throughout the monorepo.
 */

import type {
  Caip2ChainId,
  Caip10AccountId,
  Caip19AssetId,
} from '@cinacoin/caip';

// Re-export CAIP types for downstream consumers
export type { Caip2ChainId, Caip10AccountId, Caip19AssetId };

/**
 * Supported blockchain network namespaces (CAIP-2 format).
 *
 * Each namespace groups chains that share a common protocol:
 * - `eip155`: EVM-compatible chains (Ethereum, Polygon, BSC, etc.)
 * - `solana`: Solana mainnet, devnet, testnet
 * - `bip122`: Bitcoin-based chains (mainnet, testnet, signet)
 * - `tron`, `ton`, `polkadot`, `sui`, `hedera`: respective networks
 *
 * Note: `bip121` is included for legacy compatibility.
 */
export type ChainNamespace = 'eip155' | 'solana' | 'bip121' | 'bip122' | 'tron' | 'ton' | 'polkadot' | 'sui' | 'hedera';

/**
 * Chain reference following CAIP-2 format (namespace:reference).
 *
 * @example
 * ```ts
 * { namespace: 'eip155', reference: '1' } // Ethereum mainnet
 * ```
 */
export interface ChainReference {
  /** Chain namespace (e.g., 'eip155'). */
  namespace: ChainNamespace;
  /** Chain reference (e.g., '1' for Ethereum mainnet). */
  reference: string;
}

/**
 * Full chain definition with all metadata needed for RPC calls,
 * UI display, and transaction construction.
 */
export interface Chain {
  /** Unique chain identifier (e.g., 'eip155:1' for Ethereum). */
  id: string;
  /** Human-readable chain name. */
  name: string;
  /** JSON-RPC endpoint URL for on-chain queries. */
  rpcUrl: string;
  /** CAIP-2 chain reference (e.g., '1' for Ethereum mainnet). */
  reference?: string;
  /** CAIP-2 namespace (e.g., 'eip155', 'solana'). */
  namespace?: string;
  /** Native currency metadata. */
  nativeCurrency?: {
    /** Currency display name (e.g., 'Ether'). */
    name: string;
    /** Currency ticker symbol (e.g., 'ETH'). */
    symbol: string;
    /** Number of decimal places (e.g., 18 for ETH). */
    decimals: number;
  };
  /** Block explorer base URL. */
  explorerUrl?: string;
  /** Chain icon URL (data URI or HTTPS). */
  iconUrl?: string;
}

/** Connection parameters for wallet connection. */
export interface ConnectParams {
  /** Optional topic for existing session. */
  topic?: string;
  /** Optional relay URL override. */
  relayUrl?: string;
  /** Optional pairing URI (Cinacoin format). */
  uri?: string;
  /** Chain IDs the dApp supports. */
  chains?: number[];
  /** Optional metadata about the dApp. */
  metadata?: AppMetadata;
}

/** Application metadata for pairing. */
export interface AppMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

/** Result of a successful wallet connection. */
export interface ConnectionResult {
  /** Session ID. */
  sessionId: string;
  /** Connected account addresses. */
  accounts: string[];
  /** Connected chain ID. */
  chainId: number;
  /** Connector that was used. */
  connectorId: string;
}

/** Transaction request to be signed. */
export interface TransactionRequest {
  /** From address. */
  from: string;
  /** To address. */
  to: string;
  /** Value in wei (hex string). */
  value?: string;
  /** Data payload (hex string). */
  data?: string;
  /** Gas limit (hex string). */
  gas?: string;
  /** Gas price (hex string). */
  gasPrice?: string;
  /** Max fee per gas (EIP-1559, hex string). */
  maxFeePerGas?: string;
  /** Max priority fee per gas (EIP-1559, hex string). */
  maxPriorityFeePerGas?: string;
  /** Nonce (hex string). */
  nonce?: string;
  /** Chain ID. */
  chainId?: number;
}

/** Event handler function. */
export type EventHandler = (...args: unknown[]) => void;

/** Pairing data structure. */
export interface PairingData {
  /** Pairing topic. */
  topic: string;
  /** Pairing URI (Cinacoin format). */
  uri: string;
  /** Peer metadata. */
  peerMetadata?: AppMetadata;
  /** Active state. */
  active: boolean;
  /** Expiration timestamp (ms). */
  expiry: number;
}

/** Session proposal data. */
export interface SessionProposal {
  /** Proposal ID. */
  id: number;
  /** Required namespaces (CAIP-2). */
  requiredNamespaces: Record<string, RequiredNamespace>;
  /** Optional namespaces. */
  optionalNamespaces?: Record<string, RequiredNamespace>;
  /** Relayer metadata. */
  relays: { protocol: string; data?: string }[];
  /** Proposer metadata. */
  proposer: {
    publicKey: string;
    metadata: AppMetadata;
  };
}

/** Required namespace for session proposal. */
export interface RequiredNamespace {
  /** Required chains. */
  chains: string[];
  /** Required methods. */
  methods: string[];
  /** Required events. */
  events: string[];
}

// ============================================================================
// Re-export error system types and classes
// ============================================================================

export type {
  ErrorSeverity,
  ErrorCodeDefinition,
} from './errors/codes.js';

export type { SupportedLocale } from './errors/i18n.js';

export {
  CONNECTION,
  AUTHENTICATION,
  CHAIN,
  TRANSACTION,
  WALLET_CONNECT,
  SIGNING,
  NETWORK,
  SDK,
  SECURITY,
  ERROR_CODES,
  ERROR_CODE_COUNT,
  getErrorCode,
  getErrorByIdentifier,
} from './errors/codes.js';

export {
  CinacoinError,
  ConnectionError,
  AuthenticationError,
  ChainError,
  TransactionError,
  CinacoinError,
  SigningError,
  NetworkError,
  SdkError,
  SecurityError,
  createError,
  resolveCodeDef,
} from './errors/classes.js';

export {
  isError,
  isConnectionError,
  isAuthenticationError,
  isChainError,
  isTransactionError,
  isCinacoinError,
  isSigningError,
  isNetworkError,
  isSdkError,
  isSecurityError,
  getErrorSeverity,
  isRetryable,
  getErrorDocumentation,
  formatError,
  formatErrorCompact,
  errorToJSON,
  errorFromJSON,
} from './errors/utils.js';

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isLocaleSupported,
  resolveLocale,
  getMessage,
  getAllTranslations,
} from './errors/i18n.js';
