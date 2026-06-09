/**
 * Gas estimation types for @cinacoin/gas-estimator
 */

export interface EvmGasEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  baseFeePerGas?: bigint;
  estimatedCost: bigint; // total in wei
}

export interface LegacyGasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  estimatedCost: bigint;
}

export interface SolanaGasEstimate {
  computeUnits: number;
  computeUnitPrice: bigint; // micro-lamports
  baseFee: bigint; // lamports
  estimatedCost: bigint; // total in lamports
}

export interface FeeHistoryEntry {
  baseFeePerGas: bigint;
  gasUsedRatio: number;
  reward?: bigint[];
}

export interface GasPricePrediction {
  slow: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; estimatedTime: number };
  standard: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; estimatedTime: number };
  fast: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; estimatedTime: number };
}

export type ChainType = 'evm' | 'solana';

export interface GasEstimatorConfig {
  cacheTtlMs?: number;
  rpcUrl?: string;
  /** Custom chain configs to override/extend defaults */
  chains?: Record<number, ChainConfig>;
  /** Maximum RPC request timeout in ms */
  rpcTimeoutMs?: number;
}

/**
 * Known chain configurations with default RPC URLs.
 */
export interface ChainConfig {
  chainId: number;
  name: string;
  defaultRpcUrl: string;
  type: ChainType;
  blockTimeMs?: number;
}

export const DEFAULT_CHAINS: Record<number, ChainConfig> = {
  1: { chainId: 1, name: 'Ethereum', defaultRpcUrl: 'https://eth.llamarpc.com', type: 'evm', blockTimeMs: 12_000 },
  137: { chainId: 137, name: 'Polygon', defaultRpcUrl: 'https://polygon-rpc.com', type: 'evm', blockTimeMs: 2_000 },
  56: { chainId: 56, name: 'BNB Chain', defaultRpcUrl: 'https://bsc-dataseed.binance.org', type: 'evm', blockTimeMs: 3_000 },
  42161: { chainId: 42161, name: 'Arbitrum', defaultRpcUrl: 'https://arb1.arbitrum.io/rpc', type: 'evm', blockTimeMs: 1_000 },
  10: { chainId: 10, name: 'Optimism', defaultRpcUrl: 'https://mainnet.optimism.io', type: 'evm', blockTimeMs: 2_000 },
  8453: { chainId: 8453, name: 'Base', defaultRpcUrl: 'https://mainnet.base.org', type: 'evm', blockTimeMs: 2_000 },
  100: { chainId: 100, name: 'Gnosis', defaultRpcUrl: 'https://rpc.gnosischain.com', type: 'evm', blockTimeMs: 5_000 },
  43114: { chainId: 43114, name: 'Avalanche', defaultRpcUrl: 'https://api.avax.network/ext/bc/C/rpc', type: 'evm', blockTimeMs: 2_000 },
};

export interface GasCache {
  get(key: string): GasPriceData | undefined;
  set(key: string, data: GasPriceData): void;
  has(key: string): boolean;
  clear(): void;
}

export interface GasPriceData {
  gasPrice: bigint;
  baseFee?: bigint;
  priorityFee?: bigint;
  timestamp: number;
}

export interface GasEstimationResult {
  chainType: ChainType;
  estimate: EvmGasEstimate | SolanaGasEstimate | LegacyGasEstimate;
}

/**
 * Raw JSON-RPC response helpers.
 */
export interface RpcResponse<T> {
  jsonrpc: '2.0';
  id: number;
  result: T;
  error?: { code: number; message: string };
}

// ---------------------------------------------------------------------------
// Multi-Source Gas Aggregation Types
// ---------------------------------------------------------------------------

/** Identifier for a gas price source. */
export type GasSourceId = 'ethgasstation' | 'blocknative' | 'rpc' | 'custom';

/** Gas price data from a single source. */
export interface GasSourceData {
  /** Source identifier. */
  source: GasSourceId;
  /** Gas price in wei. */
  gasPrice: bigint;
  /** Optional EIP-1559 base fee. */
  baseFee?: bigint;
  /** Optional EIP-1559 priority fee. */
  priorityFee?: bigint;
  /** Confidence level (0-1). */
  confidence: number;
  /** Timestamp when data was fetched. */
  timestamp: number;
  /** Optional error message. */
  error?: string;
}

/** Weighted gas price result from aggregation. */
export interface AggregatedGasPrice {
  /** Weighted average gas price. */
  gasPrice: bigint;
  /** Weighted average base fee. */
  baseFee?: bigint;
  /** Weighted average priority fee. */
  priorityFee?: bigint;
  /** Number of sources that contributed. */
  sourceCount: number;
  /** Individual source results. */
  sources: GasSourceData[];
  /** Timestamp of aggregation. */
  timestamp: number;
  /** Standard deviation of source prices. */
  stdDeviation: number;
}

/** Configuration for a gas price source. */
export interface GasSourceConfig {
  /** API key. */
  apiKey?: string;
  /** Custom API endpoint override. */
  endpoint?: string;
  /** Source weight in the aggregation. */
  weight?: number;
  /** Request timeout in ms. */
  timeoutMs?: number;
  /** Whether this source is enabled. */
  enabled?: boolean;
}

/** Configuration for the multi-source aggregator. */
export interface MultiSourceGasAggregatorConfig {
  /** Per-source configuration overrides. */
  sources?: Partial<Record<GasSourceId, GasSourceConfig>>;
  /** Custom RPC URL for eth_gasPrice fallback. */
  rpcUrl?: string;
  /** RPC timeout in ms. */
  rpcTimeoutMs?: number;
  /** Minimum number of sources required. */
  minSources?: number;
}
