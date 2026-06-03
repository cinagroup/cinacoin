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
} from "./types";

export type { EvmAccount } from "./adapters/evm";
export type { SolanaAccount } from "./adapters/solana";
export type { BitcoinAccount } from "./adapters/bitcoin";

// Sync
export { StateSync } from "./sync";

// Identity
export {
  CrossChainIdentityManager,
  generateIdentityHash,
  verifyLinkingProof,
  createLinkingProof,
} from "./identity";

// Adapters
export { syncEvmState, getEvmSession } from "./adapters/evm";
export { syncSolanaState, getSolanaSession } from "./adapters/solana";
export { syncBitcoinState, getBitcoinSession } from "./adapters/bitcoin";

// Storage
export { InMemoryStorage, LocalStorage } from "./storage";

// Bridge Engine
export { BridgeEngine } from "./bridge-engine";
export type { BridgeEngineOptions, BridgeCreateOptions } from "./bridge-engine";

// Bridge Executor (real contract interactions)
export {
  BridgeExecutor,
  getChainOrDefine,
  pollTransactionReceipt,
  STANDARD_BRIDGE_ABI,
  POLYGON_POS_BRIDGE_ABI,
  LOCK_MINT_BRIDGE_ABI,
  ERC20_ABI,
  BRIDGE_CONTRACTS,
} from "./bridge-executor";
export type {
  BridgeExecuteParams,
  BridgeProtocol,
  BridgeExecutionResult,
  BridgeExecutionState,
  SourceLockResult,
  DestMintResult,
  TxPollOptions,
} from "./bridge-executor";

// Bridge State Manager
export { BridgeStateManager } from "./bridge-state-manager";

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
} from "./bridge-routes";

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
} from "./message-validation";
export type { MerkleProof } from "./message-validation";

// Messaging / Relay
export {
  createCrossChainMessage,
  serializeMessage,
  deserializeMessage,
  isMessageExpired,
  RelayClient,
} from "./messaging";
export type {
  CrossChainMessage,
  CrossChainMessageType,
  CrossChainMessageStatus,
  RelaySubmitResponse,
  RelayStatusResponse,
} from "./messaging";

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
} from "./bridge";

// React Hooks
export {
  useBridgeTransfer,
  useBridgeStatus,
  useBridgeHistory,
  useBridgeFee,
  useBridgeRoutes,
} from "./hooks";
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
} from "./hooks";
