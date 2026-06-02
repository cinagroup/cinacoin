/**
 * Cross-Chain Sync Type Definitions
 */

// ============================================================
// Chain Families
// ============================================================

/** Supported chain families */
export type ChainFamily = "evm" | "solana" | "bitcoin" | "ton" | "tron" | "polkadot";

// ============================================================
// Chain Route (used by bridge.ts legacy module)
// ============================================================

/** Chain route configuration for bridge operations */
export interface ChainRoute {
  family: ChainFamily;
  chainId: number;
  name: string;
  nativeCurrency: string;
  isL2?: boolean;
  isSidechain?: boolean;
  rpcUrl?: string;
  explorerUrl?: string;
}

// ============================================================
// Bridge Pair (used by bridge.ts legacy module)
// ============================================================

/** Bridge pair metadata for a supported route */
export interface BridgePair {
  sourceChain: ChainRoute;
  destChain: ChainRoute;
  protocol: string;
  supportsNativeETH: boolean;
  supportsERC20: boolean;
  estimatedTimeSeconds: number;
  baseFeeBps: number;
}

// ============================================================
// Accounts & Identity
// ============================================================

/** Base account info for any chain */
export interface ChainAccount {
  chain: ChainFamily;
  chainId?: number;
  address: string;
  label?: string;
  addedAt: number;
  lastSyncedAt?: number;
}

/** Unified identity across chains */
export interface UnifiedIdentity {
  identityHash: string;
  accounts: ChainAccount[];
  primaryAccount?: ChainAccount;
  metadata: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// State
// ============================================================

/** Cross-chain state to sync */
export interface CrossChainState {
  identity: UnifiedIdentity;
  sessions: Record<string, SessionState>;
  preferences: Record<string, string>;
  lastSyncedAt: number;
}

/** Session state on a specific chain */
export interface SessionState {
  chain: ChainFamily;
  chainId?: number;
  address: string;
  accounts?: ChainAccount[];
  sessionKey?: string;
  expiresAt: number;
  data: Record<string, string>;
}

/** Sync result */
export interface SyncResult {
  success: boolean;
  syncedChains: ChainFamily[];
  failedChains: ChainFamily[];
  errors: Record<string, string>;
  syncedAt: number;
}

/** Linking proof */
export interface LinkingProof {
  sourceAddress: string;
  sourceChain: ChainFamily;
  targetAddress: string;
  targetChain: ChainFamily;
  signature: string;
  message: string;
  createdAt: number;
}

// ============================================================
// Storage
// ============================================================

/** Storage backend interface */
export interface StateStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// ============================================================
// Bridge Configuration (legacy)
// ============================================================

export interface BridgeConfig {
  sourceChain: string;
  targetChain: string;
  tokenAddress?: string;
}

// ============================================================
// Bridge Route Types (bridge-routes.ts)
// ============================================================

/** A supported bridge route between two EVM chains */
export interface BridgeRoute {
  /** Route ID (e.g., "eth-arb", "eth-base") */
  id: string;
  /** Source chain name */
  fromChain: string;
  /** Source chain ID */
  fromChainId: number;
  /** Destination chain name */
  toChain: string;
  /** Destination chain ID */
  toChainId: number;
  /** Estimated bridge time in seconds */
  estimatedTimeSeconds: number;
  /** Base fee percentage (e.g., 0.05 = 0.05%) */
  feePercent: number;
  /** Minimum bridge amount (in native token smallest unit) */
  minAmount: bigint;
  /** Maximum bridge amount (in native token smallest unit) */
  maxAmount: bigint;
  /** Whether the route is currently active */
  active: boolean;
  /** Bridge protocol used */
  protocol: string;
}

// ============================================================
// Bridge Fee Estimation
// ============================================================

export interface BridgeFeeEstimate {
  /** Fee as a percentage of the bridge amount */
  feePercent: number;
  /** Absolute fee in native token smallest unit */
  feeAmount: bigint;
  /** Estimated gas cost on source chain (in wei) */
  sourceGasEstimate: bigint;
  /** Estimated gas cost on destination chain (in wei) */
  destGasEstimate: bigint;
  /** Total estimated cost */
  totalEstimate: bigint;
  /** Token symbol for display */
  tokenSymbol: string;
}

// ============================================================
// Bridge Time Estimation
// ============================================================

export interface BridgeTimeEstimate {
  /** Estimated source chain confirmation time (seconds) */
  sourceConfirmationSeconds: number;
  /** Estimated relay/message transit time (seconds) */
  relayTimeSeconds: number;
  /** Estimated dest chain confirmation time (seconds) */
  destConfirmationSeconds: number;
  /** Total estimated time (seconds) */
  totalSeconds: number;
  /** Human-readable description */
  description: string;
}

// ============================================================
// Bridge Lifecycle State (P0 state machine)
// ============================================================

export type BridgeLifecycleState =
  | "initiated"
  | "confirming"
  | "locking"
  | "minting"
  | "completed"
  | "failed"
  | "expired"
  | "refunded";

/** Bridge state transition record */
export interface BridgeStateTransition {
  from: BridgeLifecycleState;
  to: BridgeLifecycleState;
  timestamp: number;
  metadata?: Record<string, string | number | boolean>;
}

/** A single bridge transfer record */
export interface BridgeTransferRecord {
  transferId: string;
  state: BridgeLifecycleState;
  fromChain: string;
  fromChainId: number;
  toChain: string;
  toChainId: number;
  sourceToken: string;
  destToken: string;
  amount: bigint;
  tokenSymbol: string;
  decimals: number;
  sender: string;
  recipient: string;
  sourceTxHash?: string;
  destTxHash?: string;
  relayMessageId?: string;
  history: BridgeStateTransition[];
  error?: string;
  createdAt: number;
  updatedAt: number;
  /** Soft delete flag (for bridge-manager compat) */
  deleted?: boolean;
}

// ============================================================
// Bridge Engine Options (bridge-engine.ts)
// ============================================================

export interface BridgeEngineOptions {
  /** Custom state manager (defaults to new BridgeStateManager) */
  stateManager?: BridgeStateManagerLike;
}

/** Minimal interface for BridgeStateManager used by BridgeEngine */
export interface BridgeStateManagerLike {
  saveTransfer(record: BridgeTransferRecord): Promise<void>;
  loadTransfer(transferId: string): Promise<BridgeTransferRecord | null>;
  loadAllTransfers(): Promise<BridgeTransferRecord[]>;
  loadTransfersByState(state: BridgeLifecycleState): Promise<BridgeTransferRecord[]>;
  updateState(
    transferId: string,
    newState: BridgeLifecycleState,
    metadata?: Record<string, string | number | boolean>,
  ): Promise<BridgeTransferRecord>;
}

export interface CreateBridgeTransferOptions {
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
  recipient: string;
  sender?: string;
  decimals?: number;
}

export interface BridgeTransferResult {
  transferId: string;
  state: BridgeLifecycleState;
  fromChain: string;
  toChain: string;
  amount: string;
  token: string;
  recipient: string;
  estimatedFee: BridgeFeeEstimate | null;
  estimatedTime: BridgeTimeEstimate | null;
  /** The full BridgeTransferRecord (for hooks compat) */
  transfer?: BridgeTransferRecord;
}

export interface BridgeHistoryFilter {
  fromChain?: string;
  toChain?: string;
  token?: string;
  state?: BridgeLifecycleState;
  limit?: number;
  offset?: number;
}
