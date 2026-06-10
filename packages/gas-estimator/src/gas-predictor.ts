/**
 * Gas Price Prediction — Forecast gas prices using historical data.
 *
 * Uses statistical methods on fee history to predict gas prices
 * for different speed tiers (slow, standard, fast).
 *
 * @packageDocumentation
 */

import type {
import { logger } from '@cinacoin/logger';
  GasPricePrediction,
  FeeHistoryEntry,
  AggregatedGasPrice,
  GasPriceData,
} from './types.js';

// ---------------------------------------------------------------------------
// GasPricePredictor
// ---------------------------------------------------------------------------

/**
 * Predicts EVM gas prices using historical fee data.
 *
 * Analyzes fee history to compute:
 * - Base fee trend (increasing, stable, or decreasing)
 * - Priority fee distribution across percentiles
 * - Congestion-based time estimates
 *
 * @example
 * ```ts
 * import { GasPricePredictor } from '@cinacoin/gas-estimator';
 *
 * const predictor = new GasPricePredictor();
 *
 * const prediction = predictor.predict({
 *   baseFeePerGas: 30_000_000_000n,
 *   history: feeHistoryEntries,
 *   currentGasPrice: 35_000_000_000n,
 * });
 *
 * logger.info('Fast:', prediction.fast);
 * logger.info('Standard:', prediction.standard);
 * logger.info('Slow:', prediction.slow);
 * ```
 */
export class GasPricePredictor {
  /** Number of recent blocks to analyze for trend detection. */
  private readonly trendWindow: number;

  /** Number of recent blocks for priority fee analysis. */
  private readonly priorityWindow: number;

  constructor(options?: {
    /** Blocks to analyze for trend (default: 20). */
    trendWindow?: number;
    /** Blocks to analyze for priority fees (default: 10). */
    priorityWindow?: number;
  }) {
    this.trendWindow = options?.trendWindow ?? 20;
    this.priorityWindow = options?.priorityWindow ?? 10;
  }

  /**
   * Predict gas prices for slow, standard, and fast speed tiers.
   *
   * @param params - Prediction parameters.
   * @returns Gas price predictions for each tier.
   */
  predict(params: {
    /** Current base fee per gas. */
    baseFeePerGas: bigint;
    /** Fee history entries. */
    history: FeeHistoryEntry[];
    /** Optional current gas price (from eth_gasPrice). */
    currentGasPrice?: bigint;
    /** Optional aggregated multi-source data. */
    aggregated?: AggregatedGasPrice;
  }): GasPricePrediction {
    const { baseFeePerGas, history } = params;

    // Trim history to trend window
    const recentHistory = history.slice(-this.trendWindow);

    // Analyze base fee trend
    const trend = this._analyzeBaseFeeTrend(recentHistory, baseFeePerGas);

    // Calculate priority fees from reward data
    const priorityFees = this._calculatePriorityFees(recentHistory, baseFeePerGas);

    // Calculate congestion factor
    const congestion = this._calculateCongestion(recentHistory);

    // Derive predictions
    const slowPriority = priorityFees.slow;
    const stdPriority = priorityFees.standard;
    const fastPriority = priorityFees.fast;

    // Time estimates based on congestion and trend
    const baseTime = this._estimateBaseTime(congestion, trend);

    return {
      slow: {
        maxFeePerGas: baseFeePerGas * 2n + slowPriority,
        maxPriorityFeePerGas: slowPriority,
        estimatedTime: Math.round(baseTime * 2),
      },
      standard: {
        maxFeePerGas: baseFeePerGas * 2n + stdPriority,
        maxPriorityFeePerGas: stdPriority,
        estimatedTime: baseTime,
      },
      fast: {
        maxFeePerGas: baseFeePerGas * 2n + fastPriority,
        maxPriorityFeePerGas: fastPriority,
        estimatedTime: Math.max(Math.round(baseTime / 3), 5),
      },
    };
  }

  /**
   * Predict gas price for the next N blocks based on trend.
   *
   * EIP-1559 base fee adjustment: increases by up to 12.5% per block
   * when gas usage > target, decreases by up to 12.5% when below.
   *
   * @param baseFeePerGas - Current base fee.
   * @param blocksAhead - Number of blocks to predict.
   * @param avgGasUsedRatio - Average gas used ratio (0-1).
   * @returns Predicted base fee.
   */
  predictBaseFee(
    baseFeePerGas: bigint,
    blocksAhead: number,
    avgGasUsedRatio: number = 0.5,
  ): bigint {
    // EIP-1559 target is 50% gas usage
    const targetRatio = 0.5;
    let fee = baseFeePerGas;

    for (let i = 0; i < blocksAhead; i++) {
      if (avgGasUsedRatio > targetRatio) {
        // Above target — base fee increases
        // Max increase: 12.5% per block
        const excess = avgGasUsedRatio - targetRatio;
        const adjustment = excess / targetRatio; // 0 to 1
        const increase = fee * BigInt(Math.round(adjustment * 125)) / 1000n; // max 12.5%
        fee = fee + increase;
      } else if (avgGasUsedRatio < targetRatio) {
        // Below target — base fee decreases
        // Max decrease: 12.5% per block
        const deficit = targetRatio - avgGasUsedRatio;
        const adjustment = deficit / targetRatio; // 0 to 1
        const decrease = fee * BigInt(Math.round(adjustment * 125)) / 1000n;
        fee = fee - decrease;
        if (fee < 0n) fee = 0n;
      }
      // At target — fee stays the same
    }

    return fee;
  }

  /**
   * Estimate the probability that a given gas price will be included.
   *
   * Uses historical data to compute what percentage of blocks
   * would have included a transaction at the given priority fee.
   *
   * @param priorityFee - Priority fee to evaluate.
   * @param history - Fee history entries.
   * @returns Inclusion probability (0-1).
   */
  estimateInclusionProbability(
    priorityFee: bigint,
    history: FeeHistoryEntry[],
  ): number {
    if (history.length === 0) return 0.5; // Unknown

    const recent = history.slice(-this.priorityWindow);
    let included = 0;

    for (const entry of recent) {
      if (entry.reward && entry.reward.length > 0) {
        // Check if the 25th percentile reward is below our priority fee
        const p25 = entry.reward[0] ?? 0n;
        if (priorityFee >= p25) {
          included++;
        }
      } else {
        // No reward data — assume 50% chance
        included += 0.5;
      }
    }

    return included / recent.length;
  }

  // -----------------------------------------------------------------------
  // Internal Analysis Methods
  // -----------------------------------------------------------------------

  /** Analyze the base fee trend from recent history. */
  private _analyzeBaseFeeTrend(
    history: FeeHistoryEntry[],
    currentBaseFee: bigint,
  ): 'increasing' | 'stable' | 'decreasing' {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-Math.min(history.length, 10));
    const firstBaseFee = recent[0].baseFeePerGas;

    if (currentBaseFee > firstBaseFee) {
      const changePercent =
        Number((currentBaseFee - firstBaseFee) * 100n / firstBaseFee);
      return changePercent > 5 ? 'increasing' : 'stable';
    } else if (currentBaseFee < firstBaseFee) {
      const changePercent =
        Number((firstBaseFee - currentBaseFee) * 100n / firstBaseFee);
      return changePercent > 5 ? 'decreasing' : 'stable';
    }

    return 'stable';
  }

  /** Calculate priority fees for slow/standard/fast tiers. */
  private _calculatePriorityFees(
    history: FeeHistoryEntry[],
    baseFeePerGas: bigint,
  ): { slow: bigint; standard: bigint; fast: bigint } {
    const recent = history.slice(-this.priorityWindow);

    // Collect all reward percentiles
    const slowRewards: bigint[] = [];
    const stdRewards: bigint[] = [];
    const fastRewards: bigint[] = [];

    for (const entry of recent) {
      if (entry.reward && entry.reward.length >= 3) {
        slowRewards.push(entry.reward[0]);  // 25th percentile
        stdRewards.push(entry.reward[1]);   // 50th percentile
        fastRewards.push(entry.reward[2]);  // 75th percentile
      }
    }

    const avgSlow = slowRewards.length > 0
      ? slowRewards.reduce((a, b) => a + b, 0n) / BigInt(slowRewards.length)
      : baseFeePerGas / 10n;

    const avgStd = stdRewards.length > 0
      ? stdRewards.reduce((a, b) => a + b, 0n) / BigInt(stdRewards.length)
      : baseFeePerGas / 5n;

    const avgFast = fastRewards.length > 0
      ? fastRewards.reduce((a, b) => a + b, 0n) / BigInt(fastRewards.length)
      : baseFeePerGas / 2n;

    // Ensure minimum priority fees (1 Gwei)
    const minPriority = 1_000_000_000n;

    return {
      slow: avgSlow > minPriority ? avgSlow : minPriority,
      standard: avgStd > minPriority ? avgStd : minPriority,
      fast: avgFast > minPriority ? avgFast : minPriority,
    };
  }

  /** Calculate network congestion factor (0-1). */
  private _calculateCongestion(history: FeeHistoryEntry[]): number {
    if (history.length === 0) return 0.5;

    const avgGasUsed = history.reduce(
      (sum, h) => sum + h.gasUsedRatio,
      0,
    ) / history.length;

    return Math.min(Math.max(avgGasUsed, 0), 1);
  }

  /** Estimate base inclusion time in seconds based on congestion and trend. */
  private _estimateBaseTime(
    congestion: number,
    trend: 'increasing' | 'stable' | 'decreasing',
  ): number {
    // Base time: 15 seconds (one block on Ethereum)
    let baseTime = 15;

    // Congestion multiplier
    if (congestion > 0.8) {
      baseTime *= 3; // Heavy congestion
    } else if (congestion > 0.6) {
      baseTime *= 2; // Moderate congestion
    } else if (congestion > 0.4) {
      baseTime *= 1.5; // Light congestion
    }

    // Trend adjustment
    if (trend === 'increasing') {
      baseTime *= 1.3; // Prices going up, more competition
    } else if (trend === 'decreasing') {
      baseTime *= 0.8; // Prices going down, less competition
    }

    return Math.round(baseTime);
  }
}
