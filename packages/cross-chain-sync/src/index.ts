/**
 * @cinacoin/cross-chain-sync
 *
 * Cinacoin Cross-Chain Account Sync — unified state and identity across
 * EVM/Solana/BTC/TON/TRON/Polkadot.
 */

// Types
export type {
  ChainFamily,
  ChainAccount,
  CrossChainState,
  SessionState,
  SyncResult,
  LinkingProof,
  StateStorage,
  UnifiedIdentity,
  BridgeConfig,
  BridgeRoute,
  BridgeFeeEstimate,
  BridgeLifecycleState,
  BridgeTransferRecord,
  BridgeStateTransition,
} from "./types.js";

export type { EvmAccount } from "./adapters/evm.js";
export type { SolanaAccount } from "./adapters/solana.js";
export type { BitcoinAccount } from "./adapters/bitcoin.js";

// Sync
export { StateSync } from "./sync.js";

// Identity
export {
  CrossChainIdentityManager,
  generateIdentityHash,
  verifyLinkingProof,
  createLinkingProof,
} from "./identity.js";

// Adapters
export { syncEvmState, getEvmSession } from "./adapters/evm.js";
export { syncSolanaState, getSolanaSession } from "./adapters/solana.js";
export { syncBitcoinState, getBitcoinSession } from "./adapters/bitcoin.js";

// Storage
export { InMemoryStorage, LocalStorage } from "./storage.js";

// Bridge Engine
export { BridgeEngine } from "./bridge-engine.js";
export type { BridgeEngineOptions, BridgeCreateOptions } from "./bridge-engine.js";

// Bridge State Manager
export { BridgeStateManager } from "./bridge-state-manager.js";

// Bridge Routes
export {
  BRIDGE_ROUTES,
  CHAIN_IDS,
  CHAIN_NAMES,
  getRoute,
  getRouteById,
  getRouteByIdString,
  isSupportedPair,
  getRoutesFromChain,
  getRoutesToChain,
  getActiveRoutes,
} from "./bridge-routes.js";

// Message Validation
export {
  createMessageHash,
  signMessage,
  verifyMessageSignature,
  MessageValidator,
  computeMerkleRoot,
  verifyMerkleProof,
  generateMerkleProof,
  verifyMessageInStateRoot,
} from "./message-validation.js";
export type { MerkleProof } from "./message-validation.js";

// Messaging / Relay
export {
  createCrossChainMessage,
  serializeMessage,
  deserializeMessage,
  isMessageExpired,
  RelayClient,
} from "./messaging.js";
export type {
  CrossChainMessage,
  CrossChainMessageType,
  CrossChainMessageStatus,
  RelaySubmitResponse,
  RelayStatusResponse,
} from "./messaging.js";

// Bridge Lifecycle (legacy compat)
export {
  BridgeState,
  BridgeAsset,
  BridgeTransfer,
  BridgeTransition,
  isValidTransition,
  createBridgeTransferRecord,
  transitionBridgeState,
  getBridgeProgress,
  isBridgeTerminal,
  canRetryBridge,
} from "./bridge.js";

// React Hooks
export {
  useBridgeTransfer,
  useBridgeStatus,
  useBridgeHistory,
  useBridgeFee,
  useBridgeRoutes,
} from "./hooks.js";
export type {
  UseBridgeTransferOptions,
  UseBridgeTransferReturn,
  UseBridgeStatusOptions,
  UseBridgeStatusReturn,
  UseBridgeHistoryOptions,
  UseBridgeHistoryReturn,
  UseBridgeFeeOptions,
  UseBridgeFeeReturn,
  UseBridgeRoutesReturn,
} from "./hooks.js";
