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
} from './types';

// Connector
export { Connector } from './connector';

// Session
export { SessionManager } from './session';
export type { SessionState } from './session';

// State management
export { createOnChainUXStore, initializeStore } from './store';
export type { OnChainUXState, ConnectionStatus, StoreConfig } from './store';

// Events
export { EventEmitter } from './events';

// EIP-6963
export { discoverWallets, watchWallets, findWalletByRdns } from './eip6963';
export type { EIP6963ProviderInfo, EIP1193Provider, EIP6963ProviderDetail } from './eip6963';

// Transports
export { RelayTransport } from './transports/relay';
export type { RelayTransportConfig } from './transports/relay';

export { InjectedProvider } from './transports/injected';

export { QRTransport } from './transports/qr';
export type { QRTransportConfig } from './transports/qr';

// EVM Adapter
export { EvmAdapter } from './adapters/evm';
export type { EthCallParams } from './adapters/evm';

// Crypto
export {
  generateKeypair,
  sharedSecret,
  serializeKeypair,
  deserializeKeypair,
  bytesToHex,
  hexToBytes,
} from './crypto/keypair';
export type { X25519Keypair } from './crypto/keypair';

export { encrypt, decrypt, deriveSymmetricKey, deriveTopic } from './crypto/encrypt';

/**
 * SDK version.
 */
export const VERSION = '0.1.0';
