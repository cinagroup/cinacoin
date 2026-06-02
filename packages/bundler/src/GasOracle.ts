import { createPublicClient, http, type PublicClient, type Chain } from 'viem';
import type { PimlicoGasPrice } from './server-types';

/**
 * GasOracle — fetches current network gas prices and provides
 * tiered (slow/standard/fast) pricing suggestions.
 */
export class GasOracle {
  private publicClient: PublicClient;
  /** Cached gas prices. */
  private cached: PimlicoGasPrice | null = null;
  /** Timestamp of last cache. */
  private cachedAt = 0;
  /** Cache validity duration (ms). */
  private cacheTtlMs: number;

  constructor(chain: Chain, rpcUrl: string, cacheTtlMs: number = 12_000) {
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Get current gas prices with slow/standard/fast tiers.
   * Uses cached values if still fresh.
   */
  async getGasPrices(): Promise<PimlicoGasPrice> {
    if (this.cached && Date.now() - this.cachedAt < this.cacheTtlMs) {
      return this.cached;
    }

    // Fetch latest block for base fee
    const block = await this.publicClient.getBlock();
    const baseFee = block.baseFeePerGas ?? 0n;

    // Use the chain's feeHistory for priority fee percentiles
    const feeHistory = await this.publicClient.getFeeHistory({
      blockCount: 10,
      rewardPercentiles: [10, 25, 75],
    });

    const priorityFees = feeHistory.reward ?? [];

    // Calculate average priority fees from history
    const slowPrio = this.averagePriorityFee(priorityFees, 0); // 10th percentile
    const stdPrio = this.averagePriorityFee(priorityFees, 1); // 25th percentile
    const fastPrio = this.averagePriorityFee(priorityFees, 2); // 75th percentile

    // maxFeePerGas = 2 * baseFee + priorityFee (EIP-1559 formula)
    const slowMax = 2n * baseFee + slowPrio;
    const stdMax = 2n * baseFee + stdPrio;
    const fastMax = 2n * baseFee + fastPrio;

    this.cached = {
      slow: { maxFeePerGas: slowMax, maxPriorityFeePerGas: slowPrio },
      standard: { maxFeePerGas: stdMax, maxPriorityFeePerGas: stdPrio },
      fast: { maxFeePerGas: fastMax, maxPriorityFeePerGas: fastPrio },
    };
    this.cachedAt = Date.now();

    return this.cached;
  }

  /**
   * Get just the current base fee.
   */
  async getBaseFee(): Promise<bigint> {
    const block = await this.publicClient.getBlock();
    return block.baseFeePerGas ?? 0n;
  }

  private averagePriorityFee(rewards: bigint[][], index: number): bigint {
    if (rewards.length === 0) return 1_000_000_000n; // Default 1 gwei
    let sum = 0n;
    let count = 0n;
    for (const block of rewards) {
      if (block[index] !== undefined) {
        sum += block[index];
        count += 1n;
      }
    }
    return count > 0n ? sum / count : 1_000_000_000n;
  }

  /** Force a cache refresh. */
  refresh(): void {
    this.cached = null;
    this.cachedAt = 0;
  }
}
