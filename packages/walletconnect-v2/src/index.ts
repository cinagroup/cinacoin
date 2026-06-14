/**
 * @cinacoin/walletconnect-v2
 *
 * WalletConnect v2 protocol implementation for Cinacoin.
 * Provides pairing, session management, crypto utilities,
 * relay client, JSON-RPC methods, wallet registry, and
 * a unified WalletConnectClient.
 *
 * @packageDocumentation
 */

// Types
export type {
  Pairing,
  ParsedWcUri,
  Session,
  SessionNamespace,
  SessionProposal,
  SessionProposalResponse,
  SessionNotification,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  EncryptedEnvelope,
  Envelope,
  EnvelopeType0,
  EnvelopeType1,
  RelayConfig,
  RelayMessage,
  WalletRegistryEntry,
  WcClientEvent,
} from './types.js';

// Error codes
export {
  WC_PAIRING_ERRORS,
  WC_SESSION_ERRORS,
  WC_JSON_RPC_ERRORS,
} from './types.js';
export type { WcErrorCode } from './types.js';

// Crypto
export {
  generateKeypair,
  sharedSecret,
  serializeKeypair,
  deserializeKeypair,
  bytesToHex,
  hexToBytes,
  encrypt,
  decrypt,
  deriveSymmetricKey,
  deriveTopic,
  generateNonce,
  generateSymKey,
  generateTopic,
  deriveSharedSecret,
  deriveSessionTopic,
  deriveAuthKey,
  computeHmac,
  verifyHmac,
  encodeType0Envelope,
  decodeType0Envelope,
  encodeType1Envelope,
  decodeType1Envelope,
  isValidTopic,
  isValidSymKey,
  base64ToHex,
  hexToBase64,
  coreEncrypt,
  coreDecrypt,
} from './crypto.js';

export type { X25519Keypair } from '@cinacoin/core-sdk';

// Relay
export { WcRelay } from './relay.js';
export type { RelayState } from './relay.js';

// Cloud Relay
export { CloudRelay, WC_CLOUD_RELAY_URL, FALLBACK_RELAY_URLS, IRN_PROTOCOL_VERSION } from './cloud-relay.js';
export type { CloudRelayState, CloudRelayConfig } from './cloud-relay.js';

// Pairing
export {
  parseWcUri,
  formatWcUri,
  createPairing,
  approvePairing,
  deletePairing,
  rejectPairing,
  pairingPing,
  encryptPairingMessage,
  decryptPairingMessage,
  isValidWcUri,
  isPairingExpired,
  isPairingValid,
} from './pairing.js';
export type { PairingConfig } from './pairing.js';

// Session
export { WcSessionManager } from './session.js';
export type { SessionManagerConfig } from './session.js';

// Multi-Session Manager
export { MultiSessionManager } from './multi-session-manager.js';
export type { MultiSessionManagerConfig, ManagedSession, MultiSessionState } from './multi-session-manager.js';

// Session Manager (Enhanced)
export { SessionManager } from './session-manager.js';
export type { EnhancedSessionManagerConfig, SessionManagerState, SessionManagerEvent } from './session-manager.js';

// Session Store
export { SessionStore, CURRENT_SCHEMA_VERSION } from './session-store.js';
export type {
  StoredPairing,
  StoredSession,
  StoredKeypair,
  StoredMeta,
  StoredNonce,
} from './session-store.js';

// Signature Verification
export {
  recoverPersonalSignature,
  verifyPersonalSignature,
  verifyTypedDataSignature,
  verifySiweSignature,
  parseSiweMessage,
  NonceManager,
  computeHmac as computeHmacSig,
  verifyHmac as verifyHmacSig,
  deriveAuthKey as deriveAuthKeySig,
  generateAuthChallenge,
  isValidAddress,
  toChecksumAddress,
  normalizeAddress,
} from './signature-verification.js';
export type {
  TypedDataDomain,
  TypedDataField,
  TypedData,
  NonceEntry,
  VerificationResult,
} from './signature-verification.js';

// Client
export { WalletConnectClient, WcClientError } from './client.js';
export type { WalletConnectClientConfig } from './client.js';

// WC Connector
export { WcConnector } from './wc-connector.js';
export type { WcConnectorConfig } from './wc-connector.js';

// Methods
export {
  WC_METHODS,
  WC_EVENTS,
  SOLANA_METHODS,
  SOLANA_EVENTS,
  getDefaultRequiredNamespaces,
  buildSendTransaction,
  buildSignTransaction,
  buildPersonalSign,
  buildEthSign,
  buildSignTypedDataV4,
  buildSwitchChain,
  buildAddChain,
  buildWatchAsset,
  buildScanQRCode,
  buildSolanaSignMessage,
  buildSolanaSignTransaction,
  METHOD_REGISTRY,
  isEvmMethod,
  isSolanaMethod,
  isWcInternalMethod,
  getMethodDescription,
} from './methods.js';
export type { NamespacesConfig, AddChainParams } from './methods.js';

// Heartbeat
export {
  HeartbeatManager,
  createHeartbeat,
} from './heartbeat.js';
export type { HeartbeatConfig, HeartbeatStatus, HeartbeatEvent, HeartbeatConnector } from './heartbeat.js';

// Wallets
export {
  WALLET_REGISTRY,
  getWallets,
  getWalletById,
  getWalletIds,
  searchWallets,
  buildWalletDeepLink,
  buildWalletUniversalLink,
  getWalletsForChain,
  getWcV2Wallets,
  getRecommendedWalletOrder,
  invalidateCache,
} from './wallets.js';
export type { FetchWalletsOptions } from './wallets.js';

/**
 * SDK version.
 */
export const VERSION = '0.2.0';
