/**
 * React hooks for gas estimation — useGasPrice and useGasEstimate.
 *
 * Provides reactive interfaces for gas price fetching, prediction,
 * and transaction cost estimation in React applications.
 *
 * @packageDocumentation
 */

import type {
  GasPriceData,
  GasPricePrediction,
  FeeHistoryEntry,
  EvmGasEstimate,
  AggregatedGasPrice,
  GasSourceData,
} from './types.js';

// ---------------------------------------------------------------------------
// useGasPrice
// ---------------------------------------------------------------------------

/**
 * React hook for fetching and tracking current gas prices.
 *
 * Supports both single-source (RPC) and multi-source aggregation.
 * Auto-refreshes at a configurable interval.
 *
 * @param options - Hook configuration.
 * @returns Gas price state, sources, and refresh function.
 *
 * @example
 * ```tsx
 * import { useGasPrice } from '@cinacoin/gas-estimator';
 *
 * function GasPriceDisplay() {
 *   const { gasPrice, prediction, sources, isLoading, error, refresh } = useGasPrice({
 *     chainId: 1,
 *     rpcUrl: 'https://eth.llamarpc.com',
 *     enableMultiSource: true,
 *     blocknativeApiKey: 'your-key',
 *     refreshIntervalMs: 30_000,
 *   });
 *
 *   if (isLoading) return <p>Loading gas prices...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <div>
 *       <p>Gas Price: {(Number(gasPrice) / 1e9).toFixed(2)} Gwei</p>
 *       <p>Sources: {sources.length}</p>
 *       {prediction && (
 *         <div>
 *           <p>Fast: {(Number(prediction.fast.maxFeePerGas) / 1e9).toFixed(2)} Gwei</p>
 *           <p>Standard: {(Number(prediction.standard.maxFeePerGas) / 1e9).toFixed(2)} Gwei</p>
 *           <p>Slow: {(Number(prediction.slow.maxFeePerGas) / 1e9).toFixed(2)} Gwei</p>
 *         </div>
 *       )}
 *       <button onClick={() => refresh()}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGasPrice(options?: {
  /** EVM chain ID. */
  chainId?: number;
  /** RPC URL for gas price fetching. */
  rpcUrl?: string;
  /** Enable multi-source aggregation (default: false). */
  enableMultiSource?: boolean;
  /** Blocknative API key. */
  blocknativeApiKey?: string;
  /** Auto-refresh interval in ms (0 to disable). */
  refreshIntervalMs?: number;
}): {
  /** Current gas price in wei. */
  gasPrice: bigint;

  /** Base fee (if available). */
  baseFee: bigint | null;

  /** Priority fee (if available). */
  priorityFee: bigint | null;

  /** Gas price prediction for speed tiers. */
  prediction: GasPricePrediction | null;

  /** Individual source data (if multi-source enabled). */
  sources: GasSourceData[];

  /** Whether data is being fetched. */
  isLoading: boolean;

  /** Last error, if any. */
  error: Error | null;

  /** Manually refresh gas prices. */
  refresh: () => Promise<void>;
} {
  // NOTE: Type-safe stub. Full React implementation with useState / useEffect / useCallback
  // would be in the React-specific build. This provides the interface for TypeScript.

  const gasPrice: bigint = 0n;
  const baseFee: bigint | null = null;
  const priorityFee: bigint | null = null;
  const prediction: GasPricePrediction | null = null;
  const sources: GasSourceData[] = [];
  const isLoading: boolean = false;
  const error: Error | null = null;

  const refresh = async (): Promise<void> => {
    // Stub — React implementation fetches from configured sources
  };

  return { gasPrice, baseFee, priorityFee, prediction, sources, isLoading, error, refresh };
}

// ---------------------------------------------------------------------------
// useGasEstimate
// ---------------------------------------------------------------------------

/**
 * React hook for estimating transaction gas costs.
 *
 * Combines gas price data with gas limit to compute total transaction cost.
 * Supports both EIP-1559 and legacy transactions.
 *
 * @param options - Hook configuration.
 * @returns Gas estimate state and recalculate function.
 *
 * @example
 * ```tsx
 * import { useGasEstimate } from '@cinacoin/gas-estimator';
 *
 * function TransactionCost({ gasLimit }: { gasLimit: bigint }) {
 *   const {
 *     estimate,
 *     totalCostWei,
 *     totalCostEth,
 *     isLoading,
 *     recalculate,
 *   } = useGasEstimate({
 *     chainId: 1,
 *     rpcUrl: 'https://eth.llamarpc.com',
 *     gasLimit,
 *     transactionType: 'eip1559',
 *   });
 *
 *   if (isLoading) return <p>Estimating...</p>;
 *
 *   return (
 *     <div>
 *       <p>Estimated Cost: {totalCostEth} ETH</p>
 *       <p>Max Fee: {(Number(estimate?.maxFeePerGas || 0n) / 1e9).toFixed(2)} Gwei</p>
 *       <button onClick={() => recalculate()}>Recalculate</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGasEstimate(options?: {
  /** EVM chain ID. */
  chainId?: number;
  /** RPC URL for gas price fetching. */
  rpcUrl?: string;
  /** Gas limit for the transaction. */
  gasLimit?: bigint;
  /** Transaction type: 'eip1559' or 'legacy'. */
  transactionType?: 'eip1559' | 'legacy';
  /** Custom maxFeePerGas (overrides fetched value). */
  maxFeePerGas?: bigint;
  /** Custom maxPriorityFeePerGas (overrides fetched value). */
  maxPriorityFeePerGas?: bigint;
  /** Custom gasPrice for legacy transactions. */
  gasPrice?: bigint;
}): {
  /** EVM gas estimate (if available). */
  estimate: EvmGasEstimate | null;

  /** Total cost in wei. */
  totalCostWei: bigint;

  /** Total cost in ETH (string for display). */
  totalCostEth: string;

  /** Whether estimation is in progress. */
  isLoading: boolean;

  /** Last error, if any. */
  error: Error | null;

  /** Manually recalculate the estimate. */
  recalculate: () => Promise<void>;
} {
  // NOTE: Type-safe stub. Full React implementation with useState / useEffect / useCallback
  // would be in the React-specific build.

  const estimate: EvmGasEstimate | null = null;
  const totalCostWei: bigint = 0n;
  const totalCostEth: string = '0';
  const isLoading: boolean = false;
  const error: Error | null = null;

  const recalculate = async (): Promise<void> => {
    // Stub — React implementation fetches gas prices and computes cost
  };

  return { estimate, totalCostWei, totalCostEth, isLoading, error, recalculate };
}
