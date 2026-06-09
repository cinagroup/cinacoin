/**
 * Gas Price Sources — Multi-source aggregation for EVM gas prices.
 *
 * Aggregates gas price data from:
 * - ETH Gas Station API (ethgasstation.info)
 * - Blocknative Gas Platform
 * - Direct eth_gasPrice RPC fallback
 * - Weighted average algorithm for final estimate
 *
 * @packageDocumentation
 */

import type { GasPriceData, RpcResponse } from './types.js';

// ---------------------------------------------------------------------------
// Types
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

  /** Confidence level (0-1) indicating data reliability. */
  confidence: number;

  /** Timestamp when data was fetched. */
  timestamp: number;

  /** Optional error message if source partially failed. */
  error?: string;
}

/** Weighted gas price result from aggregation. */
export interface AggregatedGasPrice {
  /** Weighted average gas price. */
  gasPrice: bigint;

  /** Weighted average base fee (if available). */
  baseFee?: bigint;

  /** Weighted average priority fee (if available). */
  priorityFee?: bigint;

  /** Number of sources that contributed. */
  sourceCount: number;

  /** Individual source results. */
  sources: GasSourceData[];

  /** Timestamp of aggregation. */
  timestamp: number;

  /** Standard deviation of source prices (for confidence). */
  stdDeviation: number;
}

/** Configuration for a gas price source. */
export interface GasSourceConfig {
  /** API key (required for Blocknative and some Gas Station tiers). */
  apiKey?: string;

  /** Custom API endpoint override. */
  endpoint?: string;

  /** Source weight in the aggregation (default: varies by source). */
  weight?: number;

  /** Request timeout in ms (default: 5000). */
  timeoutMs?: number;

  /** Whether this source is enabled (default: true). */
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

  /** Minimum number of sources required before returning result. */
  minSources?: number;
}

// ---------------------------------------------------------------------------
// Source Fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch gas prices from ETH Gas Station API.
 *
 * Returns slow/average/fast gas prices in Gwei.
 * API: https://ethgasstation.info/api/ethgasAPI.json
 *
 * Note: The API returns values in Gwei * 10 (e.g., 200 = 20 Gwei).
 */
export async function fetchEthGasStation(
  config: GasSourceConfig = {},
): Promise<GasSourceData> {
  const endpoint = config.endpoint || 'https://ethgasstation.info/api/ethgasAPI.json';
  const timeoutMs = config.timeoutMs || 5000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json() as Record<string, unknown>;

    // ETH Gas Station returns values in Gwei * 10
    const averageGwei = (data.average as number) || 0;
    const fastGwei = (data.fast as number) || 0;

    // Use the "average" as the base estimate
    const gasPrice = BigInt(Math.round(averageGwei / 10 * 1e9)); // Gwei → wei

    // Derive base fee and priority fee from the spread
    const fastWei = BigInt(Math.round(fastGwei / 10 * 1e9));
    const priorityFee = fastWei > gasPrice ? fastWei - gasPrice : 1_000_000_000n;
    const baseFee = gasPrice > priorityFee ? gasPrice - priorityFee : gasPrice / 2n;

    return {
      source: 'ethgasstation',
      gasPrice,
      baseFee,
      priorityFee,
      confidence: 0.7, // Moderate — data is sampled, not real-time
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      source: 'ethgasstation',
      gasPrice: 0n,
      confidence: 0,
      timestamp: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fetch gas prices from Blocknative Gas Platform.
 *
 * Returns EIP-1559 estimated base fee and priority fees.
 * API: https://api.blocknative.com/gasPrices
 *
 * Requires an API key for production use.
 */
export async function fetchBlocknative(
  config: GasSourceConfig = {},
): Promise<GasSourceData> {
  const apiKey = config.apiKey;
  const endpoint = config.endpoint || 'https://api.blocknative.com/gasPrices';
  const timeoutMs = config.timeoutMs || 5000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(endpoint, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json() as Record<string, unknown>;

    // Blocknative returns estimatedBaseFee in Gwei
    const estimatedBaseFeeGwei = (data.estimatedBaseFee as number) || 0;
    const baseFee = BigInt(Math.round(estimatedBaseFeeGwei * 1e9));

    // Priority fees are often in the response too
    const blockPrices = data.blockPrices as Array<Record<string, unknown>> | undefined;
    let priorityFee = 1_000_000_000n; // 1 Gwei default

    if (blockPrices && blockPrices.length > 0) {
      const firstBlock = blockPrices[0];
      const estimatedPrices = firstBlock.estimatedPrices as Array<Record<string, unknown>> | undefined;
      if (estimatedPrices && estimatedPrices.length > 0) {
        // Use the median confidence price (index 1)
        const medianPrice = estimatedPrices[1];
        const price = medianPrice?.price as number | undefined;
        if (price) {
          priorityFee = BigInt(Math.round(price * 1e9));
        }
      }
    }

    const gasPrice = baseFee + priorityFee;

    return {
      source: 'blocknative',
      gasPrice,
      baseFee,
      priorityFee,
      confidence: 0.9, // High — Blocknative uses real-time mempool data
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      source: 'blocknative',
      gasPrice: 0n,
      confidence: 0,
      timestamp: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fetch gas price directly from an EVM RPC node via eth_gasPrice.
 *
 * This is the most reliable fallback since it queries the chain directly.
 */
export async function fetchRpcGasPrice(
  rpcUrl: string,
  timeoutMs: number = 5000,
): Promise<GasSourceData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json() as RpcResponse<string>;
    if (json.error) {
      throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
    }

    const gasPrice = BigInt(json.result);

    return {
      source: 'rpc',
      gasPrice,
      confidence: 0.85, // High — direct from chain, but single point
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      source: 'rpc',
      gasPrice: 0n,
      confidence: 0,
      timestamp: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Weighted Average Aggregator
// ---------------------------------------------------------------------------

/**
 * Default weights for each gas source.
 *
 * Higher weight = more influence on the final result.
 * Blocknative gets highest weight (real-time mempool data).
 * RPC gets medium-high weight (direct chain data).
 * ETH Gas Station gets lowest weight (sampled, less real-time).
 */
const DEFAULT_WEIGHTS: Record<GasSourceId, number> = {
  blocknative: 0.5,
  rpc: 0.35,
  ethgasstation: 0.15,
  custom: 0.0,
};

/**
 * Aggregate gas prices from multiple sources using a weighted average.
 *
 * @param sources - Array of gas source data results.
 * @param weights - Optional custom weights (uses defaults if omitted).
 * @returns Aggregated gas price result.
 */
export function aggregateGasPrices(
  sources: GasSourceData[],
  weights?: Partial<Record<GasSourceId, number>>,
): AggregatedGasPrice {
  // Filter out failed sources (confidence 0)
  const validSources = sources.filter((s) => s.confidence > 0 && s.gasPrice > 0n);

  if (validSources.length === 0) {
    throw new Error('No valid gas price sources available');
  }

  const w = { ...DEFAULT_WEIGHTS, ...weights };

  // Calculate weighted average for gas price
  let totalWeight = 0;
  let weightedGasPrice = 0n;
  let weightedBaseFee = 0n;
  let weightedPriorityFee = 0n;
  let baseFeeCount = 0;
  let priorityFeeCount = 0;

  const prices: number[] = [];

  for (const source of validSources) {
    const weight = w[source.source] ?? 0.1;
    if (weight === 0) continue;

    const priceNum = Number(source.gasPrice);
    prices.push(priceNum);

    weightedGasPrice += source.gasPrice * BigInt(Math.round(weight * 1000));
    totalWeight += Math.round(weight * 1000);

    if (source.baseFee !== undefined) {
      weightedBaseFee += source.baseFee * BigInt(Math.round(weight * 1000));
      baseFeeCount++;
    }

    if (source.priorityFee !== undefined) {
      weightedPriorityFee += source.priorityFee * BigInt(Math.round(weight * 1000));
      priorityFeeCount++;
    }
  }

  if (totalWeight === 0) {
    throw new Error('No valid weights available');
  }

  const totalWeightBig = BigInt(totalWeight);
  const gasPrice = weightedGasPrice / totalWeightBig;
  const baseFee = baseFeeCount > 0 ? weightedBaseFee / totalWeightBig : undefined;
  const priorityFee = priorityFeeCount > 0 ? weightedPriorityFee / totalWeightBig : undefined;

  // Calculate standard deviation for confidence
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length;
  const stdDeviation = Math.sqrt(variance);

  return {
    gasPrice,
    baseFee,
    priorityFee,
    sourceCount: validSources.length,
    sources: validSources,
    timestamp: Date.now(),
    stdDeviation,
  };
}

// ---------------------------------------------------------------------------
// Multi-Source Gas Aggregator
// ---------------------------------------------------------------------------

/**
 * Fetches and aggregates gas prices from multiple sources.
 *
 * Supports ETH Gas Station, Blocknative, and direct RPC calls.
 * Automatically applies weighted averaging for the final estimate.
 *
 * @example
 * ```ts
 * import { MultiSourceGasAggregator } from '@cinacoin/gas-estimator';
 *
 * const aggregator = new MultiSourceGasAggregator({
 *   rpcUrl: 'https://eth.llamarpc.com',
 *   sources: {
 *     blocknative: { apiKey: 'your-key' },
 *   },
 * });
 *
 * const result = await aggregator.fetch();
 * console.log(`Aggregated gas price: ${result.gasPrice} wei`);
 * console.log(`Sources: ${result.sourceCount}`);
 * ```
 */
export class MultiSourceGasAggregator {
  private config: MultiSourceGasAggregatorConfig;

  constructor(config: MultiSourceGasAggregatorConfig = {}) {
    this.config = config;
  }

  /**
   * Fetch gas prices from all enabled sources and aggregate.
   *
   * @param overrides - Optional config overrides for this fetch.
   * @returns Aggregated gas price result.
   */
  async fetch(
    overrides?: Partial<MultiSourceGasAggregatorConfig>,
  ): Promise<AggregatedGasPrice> {
    const config = { ...this.config, ...overrides };
    const sources = config.sources || {};

    const sourceConfigs: GasSourceConfig = {
      ...sources.ethgasstation,
    };
    const blocknativeConfig: GasSourceConfig = {
      ...sources.blocknative,
    };
    const rpcUrl = config.rpcUrl;
    const rpcTimeoutMs = config.rpcTimeoutMs || 5000;
    const minSources = config.minSources || 1;

    // Fetch from all enabled sources concurrently
    const fetchPromises: Promise<GasSourceData>[] = [];

    // ETH Gas Station
    if (sources.ethgasstation?.enabled !== false) {
      fetchPromises.push(fetchEthGasStation(sourceConfigs));
    }

    // Blocknative
    if (sources.blocknative?.enabled !== false) {
      fetchPromises.push(fetchBlocknative(blocknativeConfig));
    }

    // RPC fallback (always enabled if URL is provided)
    if (rpcUrl) {
      fetchPromises.push(fetchRpcGasPrice(rpcUrl, rpcTimeoutMs));
    }

    if (fetchPromises.length === 0) {
      throw new Error('No gas price sources configured. Provide rpcUrl or enable a provider.');
    }

    const results = await Promise.allSettled(fetchPromises);
    const sourceData: GasSourceData[] = results
      .filter((r): r is PromiseFulfilledResult<GasSourceData> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (sourceData.length < minSources) {
      throw new Error(
        `Only ${sourceData.length} sources succeeded (minimum: ${minSources})`,
      );
    }

    return aggregateGasPrices(sourceData);
  }

  /**
   * Fetch from a single source.
   *
   * @param sourceId - Source identifier.
   * @param rpcUrl - RPC URL (required for 'rpc' source).
   * @returns Gas source data.
   */
  async fetchSingle(
    sourceId: GasSourceId,
    rpcUrl?: string,
  ): Promise<GasSourceData> {
    const sourceConfig = this.config.sources?.[sourceId] || {};

    switch (sourceId) {
      case 'ethgasstation':
        return fetchEthGasStation(sourceConfig);
      case 'blocknative':
        return fetchBlocknative(sourceConfig);
      case 'rpc':
        if (!rpcUrl && !this.config.rpcUrl) {
          throw new Error('rpcUrl is required for RPC source');
        }
        return fetchRpcGasPrice(
          rpcUrl || this.config.rpcUrl!,
          this.config.rpcTimeoutMs || 5000,
        );
      default:
        throw new Error(`Unknown source: ${sourceId}`);
    }
  }
}
