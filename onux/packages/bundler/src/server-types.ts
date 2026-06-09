import type { Address, Hex, Hash } from 'viem';

// ── Server Configuration ──────────────────────────────────────────────

/** Multi-chain bundler server configuration. */
export interface BundlerServerConfig {
  /** HTTP listen host:port. */
  listen: string;
  /** Bundler signer private key (hex, 0x-prefixed). */
  beneficiary: Address;
  /** Supported entry point addresses. */
  entryPoints: Address[];
  /** Max UserOps per bundle. */
  maxOpsPerBundle: number;
  /** Bundle creation interval (ms). */
  bundleIntervalMs: number;
  /** Bundle timeout before sending (ms). */
  bundleTimeoutMs: number;
  /** Minimum total gas for a bundle. */
  minBundleGas: number;
  /** Min profit margin in basis points (100 = 1%). */
  minProfitMarginBps: number;
  /** Reputation thresholds. */
  reputation: ReputationConfig;
  /** Blacklisted sender addresses. */
  blacklistedSenders: Address[];
  /** Simulation limits. */
  simulation: SimulationConfig;
  /** Health check path. */
  healthPath: string;
  /** Metrics path (Prometheus). */
  metricsPath: string;
  /** Metrics enabled. */
  metricsEnabled: boolean;
}

/** Reputation thresholds per sender. */
export interface ReputationConfig {
  throttleThreshold: number;
  banThreshold: number;
  throttleDurationSec: number;
  banDurationSec: number;
  maxPendingPerSender: number;
}

/** Simulation limits. */
export interface SimulationConfig {
  enabled: boolean;
  maxSimulationGas: number;
}

// ── Pending UserOp (in-mempool record) ────────────────────────────────

export interface PendingUserOp {
  /** Keccak256 hash of the serialised UserOp. */
  hash: Hash;
  /** The UserOperation itself. */
  userOp: RawUserOperation;
  /** Timestamp when accepted into mempool. */
  receivedAt: number;
  /** Current status. */
  status: UserOpPoolStatus;
  /** Priority score for ordering. */
  priority: number;
  /** Retry count for failed submissions. */
  retries: number;
  /** Associated bundle tx hash (if submitted). */
  bundleTxHash?: Hash;
  /** Revert reason if rejected. */
  rejectReason?: string;
}

/** Raw wire-format UserOperation (all bigint fields as hex strings). */
export interface RawUserOperation {
  sender: Address;
  nonce: Hex;
  initCode: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  paymasterAndData: Hex;
  signature: Hex;
}

/** UserOp status in the pool. */
export enum UserOpPoolStatus {
  Pending = 'pending',
  Submitted = 'submitted',
  Included = 'included',
  Reverted = 'reverted',
  Rejected = 'rejected',
  Expired = 'expired',
}

// ── Bundle ────────────────────────────────────────────────────────────

export interface Bundle {
  /** The UserOps included in this bundle. */
  userOps: PendingUserOp[];
  /** Beneficiary address that receives fees. */
  beneficiary: Address;
  /** Estimated total gas for the bundle. */
  estimatedGas: bigint;
  /** When the bundle was created. */
  createdAt: number;
}

export interface BundleResult {
  /** Transaction hash on-chain. */
  txHash?: Hash;
  /** Whether the bundle was successfully submitted. */
  success: boolean;
  /** Number of UserOps in the bundle. */
  count: number;
  /** Gas used. */
  gasUsed?: bigint;
  /** Error message if failed. */
  error?: string;
}

// ── Validation ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// ── Pimlico-compatible API types ──────────────────────────────────────

export interface PimlicoGasPrice {
  slow: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
  standard: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
  fast: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
}

export interface PimlicoUserOpStatus {
  status: 'not_found' | 'not_found_on_chain' | 'pending' | 'reverted' | 'included';
  transactionHash?: Hash;
  userOperation?: RawUserOperation;
  userOperationReceipt?: UserOpReceiptData;
}

export interface UserOpReceiptData {
  userOpHash: Hash;
  sender: Address;
  nonce: Hex;
  actualGasUsed: Hex;
  actualGasCost: Hex;
  success: boolean;
  transactionHash: Hash;
  blockNumber: Hex;
  logs: unknown[];
  receipt?: {
    transactionHash: Hash;
    blockNumber: Hex;
    gasUsed: Hex;
    logs: unknown[];
  };
  reason?: string;
}

// ── JSON-RPC envelope ────────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string | null;
  method: string;
  params?: unknown[];
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// ── Health ────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  chainId: number;
  pendingOps: number;
  uptimeSeconds: number;
  entryPoints: Address[];
}

// ── Reputation ────────────────────────────────────────────────────────

export interface SenderReputation {
  score: number;
  violations: number;
  successes: number;
  throttled: boolean;
  banned: boolean;
}

// ── Metrics ───────────────────────────────────────────────────────────

export interface BundlerMetrics {
  totalOpsReceived: number;
  totalOpsSubmitted: number;
  totalOpsIncluded: number;
  totalOpsRejected: number;
  totalBundlesSent: number;
  pendingOps: number;
  avgGasPerBundle: bigint;
  uptimeSeconds: number;
}
