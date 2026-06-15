/**
 * Cinacoin Core SDK — Self-hosted wallet connection toolkit.
 *
 * A complete replacement for Cinacoin/Cinacoin infrastructure,
 * providing self-hosted relay, RPC proxy, and client-side SDK.
 *
 * @packageDocumentation
 */

// Types
export type {
  Chain,
  ChainNamespace,
  ChainReference,
  ConnectParams,
  ConnectionResult,
  AppMetadata,
  TransactionRequest,
  EventHandler,
  PairingData,
  SessionProposal,
  RequiredNamespace,
} from './types.js';

// Connector
export { Connector } from './connector.js';

// Session
export { SessionManager } from './session.js';
export type { SessionState } from './session.js';

// State management
export { createCinacoinStore, initializeStore } from './store.js';
export type { CinacoinState, ConnectionStatus, StoreConfig } from './store.js';

// Events
export { EventEmitter } from './events.js';

// EIP-6963
export { discoverWallets, watchWallets, findWalletByRdns } from './eip6963.js';
export type { EIP6963ProviderInfo, EIP1193Provider, EIP6963ProviderDetail } from './eip6963.js';

// Transports
export { RelayTransport } from './transports/relay.js';
export type { RelayTransportConfig } from './transports/relay.js';

// Cloud Relay (official relay integration with failover)
export { CloudRelay } from './relay/cloud-relay.js';
export type {
  CloudRelayConfig,
  CloudRelayState,
  CloudRelayMetrics,
  CloudRelayPoolConfig,
  CloudRelayRetryConfig,
  CloudRelayHeartbeatConfig,
  RelayEndpoint,
} from './relay/cloud-relay.js';

export { InjectedProvider } from './transports/injected.js';

export { QRTransport } from './transports/qr.js';
export type { QRTransportConfig } from './transports/qr.js';

// EVM Adapter
export { EvmAdapter } from './adapters/evm.js';
export type { EthCallParams } from './adapters/evm.js';

// EVM Chain Configs
export { EVM_CHAINS, DEFAULT_EVM_CHAINES, getChainById, getChainByName } from './chains/evm-chains.js';
export type { EvmChainConfig } from './chains/evm-chains.js';

// viem Adapter (optional — requires viem peer dep)
export { ViemChainAdapter, createViemAdapter } from './adapters/viem.js';
export type { ViemClient, ViemAccount, ViemChain, ViemTransport } from './adapters/viem.js';

// wagmi Adapter (optional — requires wagmi peer dep)
export {
  WagmiConnector,
  MultiChainConnector,
  createWagmiConnector,
  createMultiChainConnector,
} from './adapters/wagmi.js';
export type {
  WagmiConfig,
  WagmiChain,
  WagmiTransport,
  WagmiConnectorInstance,
  WagmiStorage,
  CreateWagmiConfig,
} from './adapters/wagmi.js';

// ethers v5 Adapter (optional — requires ethers@5 peer dep)
export { Ethers5Adapter } from './adapters/ethers5.js';
export type {
  Ethers5Provider,
  Ethers5Network,
  Ethers5BigNumber,
  Ethers5Signer,
  Ethers5TransactionRequest,
  Ethers5TransactionResponse,
  Ethers5TransactionReceipt,
  Ethers5Log,
} from './adapters/ethers5.js';

// ethers v6 Adapter (optional — requires ethers@6 peer dep)
export { Ethers6Adapter } from './adapters/ethers6.js';
export type {
  Ethers6Provider,
  Ethers6Network,
  Ethers6BigInt,
  Ethers6Signer,
  Ethers6TransactionRequest,
  Ethers6TransactionResponse,
  Ethers6TransactionReceipt,
  Ethers6Log,
} from './adapters/ethers6.js';

// Adapter types
export type {
  ChainAdapter,
  ChainAdapterMethods,
  AdapterFactoryConfig,
} from './adapters/types.js';

// Crypto
export {
  generateKeypair,
  sharedSecret,
  serializeKeypair,
  deserializeKeypair,
  bytesToHex,
  hexToBytes,
} from './crypto/keypair.js';
export type { X25519Keypair } from './crypto/keypair.js';

export { encrypt, decrypt, deriveSymmetricKey, deriveTopic, generateNonce } from './crypto/encrypt.js';

// SIWE Authentication (optional — requires @cinacoin/siwe)
export { SIWEAuth } from './auth/siwe.js';
export type { SIWEAuthConfig, SIWESignInResult } from './auth/siwe.js';

/**
 * Factory configuration for creating chain adapters.
 *
 * Covers all supported adapter types including EVM libraries (viem, wagmi,
 * ethers v5/v6) and native chain adapters (Solana, Bitcoin, TON, TRON,
 * Polkadot, Cosmos, Hedera, Sui, Starknet, NEAR, XRPL).
 */
export interface NewChainAdapterFactoryConfig {
  /** Adapter type identifier. */
  type: 'viem' | 'wagmi' | 'ethers5' | 'ethers6';
  /** Underlying client/provider (library-specific). */
  client?: unknown;
  /** Cinacoin connector instance. */
  connector?: import('./connector.js').Connector;
  /** Supported chains for the adapter. */
  chains?: import('./types.js').Chain[];
}

/**
 * Create a ChainAdapter from factory config.
 *
 * Dynamically imports the requested adapter module and returns an
 * initialized adapter instance.
 *
 * @param config - Adapter factory configuration specifying type and options.
 * @returns Promise resolving to the adapter instance.
 * @throws Error if the adapter type is unknown or initialization fails.
 *
 * @example
 * ```ts
 * const adapter = await createAdapter({ type: 'viem', client });
 * const wagmi = await createAdapter({ type: 'wagmi' });
 * ```
 */
export async function createAdapter(
  config: import('./adapters/types.js').AdapterFactoryConfig | NewChainAdapterFactoryConfig,
): Promise<unknown> {
  switch (config.type) {
    case 'viem': {
      const mod = await import('./adapters/viem.js');
      return mod.createViemAdapter(
        config.client as import('./adapters/viem.js').ViemClient | undefined,
        config.connector,
      );
    }
    case 'wagmi': {
      const mod = await import('./adapters/wagmi.js');
      return mod.createMultiChainConnector(config as unknown as import('./adapters/wagmi.js').CreateWagmiConfig);
    }
    case 'ethers5': {
      const mod = await import('./adapters/ethers5.js');
      return new mod.Ethers5Adapter(
        config.client as import('./adapters/ethers5.js').Ethers5Provider | undefined,
      );
    }
    case 'ethers6': {
      const mod = await import('./adapters/ethers6.js');
      return new mod.Ethers6Adapter(
        config.client as import('./adapters/ethers6.js').Ethers6Provider | undefined,
      );
    }
    default: throw new Error(`Unknown adapter type: ${config.type}`);
  }
}

// Deep Linking
export {
  generateDeepLink,
  registerWalletDeepLink,
  getAppStoreUrl,
  WALLET_DEEP_LINKS,
  generateUniversalLink,
  generateCinacoinUniversalLink,
  smartRedirect,
  detectPlatform,
} from './links/index.js';
export type {
  DeepLinkParams,
  Platform as DeepLinkPlatform,
  RedirectResult,
  RedirectOptions,
  WalletDeepLinkConfig,
  UniversalLinkParams,
} from './links/index.js';

// React Integration (optional — requires React peer dep)
export * from './react/index.js';

// Chain Registry
export * from './chains/index.js';

// Error System
export {
  CinacoinError,
  ConnectionError,
  AuthenticationError,
  ChainError,
  TransactionError,
  WalletConnectError,
  SigningError,
  NetworkError,
  SdkError,
  SecurityError,
  createError,
  resolveCodeDef,
} from './errors/index.js';
export type {
  ErrorSeverity,
  ErrorCodeDefinition,
} from './errors/index.js';
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
  getErrorCode,
  getErrorByIdentifier,
} from './errors/index.js';

// Utility Functions
export * from './utils/signature.js';
export * from './utils/chain.js';

// Performance Utilities
export {
  ResultCache,
  RequestBatcher,
  debounce,
  throttle,
  memoize,
  createLazyLoader,
  AdapterRegistry,
  conditionalLoad,
  loadWithTimeout,
  ConnectionPool,
  createInterceptedFetch,
  createRetryFetch,
} from './performance/index.js';
export type {
  CacheOptions,
  BatchHandler,
  ModuleLoader,
  AdapterRegistration,
  ConnectionPoolConfig,
  RequestInterceptor,
  RetryConfig,
} from './performance/index.js';

/**
 * SDK version.
 */
export const VERSION = '0.1.0';
// EIP-5792: Wallet Call API (atomic batch transactions)
export {
  // Types
  type EIP5792Client,
  type WalletCapabilities,
  type ChainCapabilities,
  type Call,
  type SendCallsParams,
  type SendCallsResult,
  type CallsStatus,
  type GetCallsStatusResult,
  type CallReceipt,
  type GetCapabilitiesParams,
  type AtomicBatchConfig,
  type AtomicBatchResult,
  // Capabilities
  walletGetCapabilities,
  hasCapability,
  getChainCapabilities,
  getSupportedChains,
  filterByCapability,
  // Send Calls
  walletSendCalls,
  sendSingleCall,
  sendErc20Transfer,
  sendBatch,
  // Get Calls Status
  walletGetCallsStatus,
  waitForCallsStatus,
  allCallsSucceeded,
  getFailedReceipts,
  // Atomic Batch
  supportsAtomicBatch,
  buildAtomicBatch,
  executeAtomicBatch,
  createEthTransferCall,
  createContractCall,
  createErc20ApproveCall,
  createApproveAndSwapCalls,
  validateBatchConfig,
  // Context Registry
  registerEIP5792Context,
  unregisterEIP5792Context,
  getEIP5792Context,
} from './eip5792/index.js';
