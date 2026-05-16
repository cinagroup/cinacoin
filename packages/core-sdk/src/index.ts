/**
 * OnChainUX Core SDK — Self-hosted wallet connection toolkit.
 *
 * A complete replacement for Reown/WalletConnect infrastructure,
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
export { createOnChainUXStore, initializeStore } from './store.js';
export type { OnChainUXState, ConnectionStatus, StoreConfig } from './store.js';

// Events
export { EventEmitter } from './events.js';

// EIP-6963
export { discoverWallets, watchWallets, findWalletByRdns } from './eip6963.js';
export type { EIP6963ProviderInfo, EIP1193Provider, EIP6963ProviderDetail } from './eip6963.js';

// Transports
export { RelayTransport } from './transports/relay.js';
export type { RelayTransportConfig } from './transports/relay.js';

export { InjectedProvider } from './transports/injected.js';

export { QRTransport } from './transports/qr.js';
export type { QRTransportConfig } from './transports/qr.js';

// EVM Adapter
export { EvmAdapter } from './adapters/evm.js';
export type { EthCallParams } from './adapters/evm.js';

// Solana Adapter
export {
  SolanaChainAdapter,
  SOLANA_CHAINS,
  SOLANA_WALLETS,
  isValidSolanaAddress,
  base58Decode,
} from './adapters/solana.js';
export type { SolanaWalletInfo } from './adapters/solana.js';

// Bitcoin Adapter
export {
  BitcoinChainAdapter,
  BITCOIN_CHAINS,
  BITCOIN_WALLETS,
  validateBitcoinAddress,
} from './adapters/bitcoin.js';
export type { UTXO, AddressFormat, BitcoinWalletInfo } from './adapters/bitcoin.js';

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

// SIWE Authentication
export { SIWEAuth } from './auth/siwe.js';
export type { SIWEAuthConfig, SIWESignInResult } from './auth/siwe.js';

// Deep Linking
export {
  generateDeepLink,
  registerWalletDeepLink,
  getAppStoreUrl,
  WALLET_DEEP_LINKS,
  generateUniversalLink,
  generateWalletConnectUniversalLink,
  smartRedirect,
  detectPlatform,
} from './links.js';
export type {
  DeepLinkParams,
  Platform as DeepLinkPlatform,
  RedirectResult,
  RedirectOptions,
  WalletDeepLinkConfig,
  UniversalLinkParams,
} from './links.js';

/**
 * SDK version.
 */
export const VERSION = '0.1.0';
