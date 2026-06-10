/**
 * QuoteAggregator — Multi-provider quote aggregation and comparison
 *
 * Aggregates quotes from multiple sources (onramp providers, DEX aggregators)
 * and provides unified comparison and selection logic.
 *
 * @example
 * ```ts
 * const aggregator = new QuoteAggregator({
 *   onrampAggregator,
 *   swapRouter,
 *   cacheTTL: 30000,
 * });
 *
 * const quotes = await aggregator.getQuotes({
 *   type: 'buy',
 *   fiatAmount: 100,
 *   fiatCurrency: 'USD',
 *   cryptoToken: 'ETH',
 *   chainId: 1,
 *   destinationAddress: '0x...',
 * });
 *
 * const best = aggregator.selectBest(quotes, {
 *   strategy: 'lowest_cost',
 * });
 * ```
 */

import { logger } from '@cinacoin/logger';
import type { OnRampQuote, OnRampProviderId } from '@cinacoin/onramp-sdk';
import type { SwapQuote } from '@cinacoin/swap-sdk';

// ============================================================
// Types
// ============================================================

export type QuoteType = 'onramp' | 'swap';

export interface UnifiedQuote {
  type: QuoteType;
  provider?: OnRampProviderId;
  inputAmount: number;
  inputToken: string;
  outputAmount: number;
  outputToken: string;
  exchangeRate: number;
  fees: number;
  estimatedTime: number;
  rawQuote: OnRampQuote | SwapQuote;
  score: number; // Calculated score for ranking
}

export interface QuoteRequest {
  type: QuoteType;
  inputAmount: number;
  inputToken: string;
  outputToken: string;
  chainId: number;
  destinationAddress?: string;
  userRegion?: string;
  paymentMethod?: string;
}

export type SelectionStrategy = 'lowest_cost' | 'fastest' | 'best_rate' | 'balanced';

export interface QuoteAggregatorConfig {
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Maximum age for cached quotes (ms) */
  maxCacheAge?: number;
  /** Whether to enable caching */
  enableCache?: boolean;
  /** Default selection strategy */
  defaultStrategy?: SelectionStrategy;
}

interface CacheEntry {
  quotes: UnifiedQuote[];
  timestamp: number;
  requestHash: string;
}

// ============================================================
// QuoteAggregator
// ============================================================

export class QuoteAggregator {
  private onrampAggregator: any; // OnRampAggregator
  private swapRouter: any; // SwapRouter
  private config: Required<QuoteAggregatorConfig>;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(
    onrampAggregator: any,
    swapRouter: any,
    config: QuoteAggregatorConfig = {}
  ) {
    this.onrampAggregator = onrampAggregator;
    this.swapRouter = swapRouter;
    this.config = {
      cacheTTL: config.cacheTTL ?? 30000, // 30 seconds
      maxCacheAge: config.maxCacheAge ?? 60000, // 1 minute
      enableCache: config.enableCache ?? true,
      defaultStrategy: config.defaultStrategy ?? 'balanced',
    };
  }

  /**
   * Get quotes from all available sources.
   */
  async getQuotes(request: QuoteRequest): Promise<UnifiedQuote[]> {
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.getFromCache(request);
      if (cached) {
        return cached;
      }
    }

    let quotes: UnifiedQuote[] = [];

    try {
      if (request.type === 'onramp') {
        quotes = await this.getOnrampQuotes(request);
      } else if (request.type === 'swap') {
        quotes = await this.getSwapQuotes(request);
      }

      // Calculate scores for all quotes
      quotes = this.calculateScores(quotes);

      // Cache the results
      if (this.config.enableCache) {
        this.setCache(request, quotes);
      }

      return quotes;
    } catch (error) {
      logger.error('[QuoteAggregator] Failed to fetch quotes:', error);
      throw error;
    }
  }

  /**
   * Get quotes from onramp providers.
   */
  private async getOnrampQuotes(request: QuoteRequest): Promise<UnifiedQuote[]> {
    if (!this.onrampAggregator) {
      return [];
    }

    try {
      const onrampQuotes: OnRampQuote[] = await this.onrampAggregator.getQuotes({
        fiatAmount: request.inputAmount,
        fiatCurrency: request.inputToken,
        cryptoToken: request.outputToken,
        chainId: request.chainId,
        destinationAddress: request.destinationAddress ?? '0x0000000000000000000000000000000000000000',
        userRegion: request.userRegion ?? 'US',
        paymentMethod: request.paymentMethod,
      });

      return onrampQuotes.map((quote) => this.normalizeOnrampQuote(quote));
    } catch (error) {
      logger.warn('[QuoteAggregator] Failed to fetch onramp quotes:', error);
      return [];
    }
  }

  /**
   * Get quotes from swap routers.
   */
  private async getSwapQuotes(request: QuoteRequest): Promise<UnifiedQuote[]> {
    if (!this.swapRouter) {
      return [];
    }

    try {
      const swapQuotes: SwapQuote[] = await this.swapRouter.getQuotes({
        fromToken: request.inputToken,
        toToken: request.outputToken,
        amount: request.inputAmount,
        chainId: request.chainId,
        slippageBps: 50,
      });

      return swapQuotes.map((quote) => this.normalizeSwapQuote(quote));
    } catch (error) {
      logger.warn('[QuoteAggregator] Failed to fetch swap quotes:', error);
      return [];
    }
  }

  /**
   * Normalize an onramp quote to unified format.
   */
  private normalizeOnrampQuote(quote: OnRampQuote): UnifiedQuote {
    return {
      type: 'onramp',
      provider: quote.provider,
      inputAmount: quote.fiatAmount,
      inputToken: quote.fiatCurrency,
      outputAmount: quote.cryptoAmount,
      outputToken: quote.cryptoToken,
      exchangeRate: quote.exchangeRate,
      fees: quote.fees.totalFeePercent,
      estimatedTime: quote.estimatedTime,
      rawQuote: quote,
      score: 0, // Will be calculated later
    };
  }

  /**
   * Normalize a swap quote to unified format.
   */
  private normalizeSwapQuote(quote: SwapQuote): UnifiedQuote {
    const inputAmount = Number(quote.fromAmount);
    const outputAmount = Number(quote.toAmount);
    const exchangeRate = inputAmount > 0 ? outputAmount / inputAmount : 0;

    return {
      type: 'swap',
      inputAmount,
      inputToken: quote.fromToken.symbol,
      outputAmount,
      outputToken: quote.toToken.symbol,
      exchangeRate,
      fees: Number(quote.fee),
      estimatedTime: 1, // Swaps are typically fast
      rawQuote: quote,
      score: 0,
    };
  }

  /**
   * Calculate scores for all quotes based on multiple factors.
   */
  private calculateScores(quotes: UnifiedQuote[]): UnifiedQuote[] {
    if (quotes.length === 0) return [];

    // Find min/max values for normalization
    const maxOutput = Math.max(...quotes.map((q) => q.outputAmount));
    const minFees = Math.min(...quotes.map((q) => q.fees));
    const minTime = Math.min(...quotes.map((q) => q.estimatedTime));

    return quotes.map((quote) => {
      // Normalize each factor to 0-1 range
      const outputScore = maxOutput > 0 ? quote.outputAmount / maxOutput : 0;
      const feeScore = minFees > 0 ? minFees / quote.fees : 1;
      const timeScore = minTime > 0 ? minTime / quote.estimatedTime : 1;

      // Weighted average (can be adjusted based on strategy)
      const score = outputScore * 0.5 + feeScore * 0.3 + timeScore * 0.2;

      return { ...quote, score };
    });
  }

  /**
   * Select the best quote based on a strategy.
   */
  selectBest(
    quotes: UnifiedQuote[],
    options: { strategy?: SelectionStrategy } = {}
  ): UnifiedQuote | null {
    if (quotes.length === 0) return null;

    const strategy = options.strategy ?? this.config.defaultStrategy;

    const sorted = [...quotes].sort((a, b) => {
      switch (strategy) {
        case 'lowest_cost':
          return a.fees - b.fees;
        case 'fastest':
          return a.estimatedTime - b.estimatedTime;
        case 'best_rate':
          return b.exchangeRate - a.exchangeRate;
        case 'balanced':
        default:
          return b.score - a.score;
      }
    });

    return sorted[0];
  }

  /**
   * Compare quotes and return ranked list.
   */
  rankQuotes(
    quotes: UnifiedQuote[],
    strategy: SelectionStrategy = 'balanced'
  ): UnifiedQuote[] {
    return [...quotes].sort((a, b) => {
      switch (strategy) {
        case 'lowest_cost':
          return a.fees - b.fees;
        case 'fastest':
          return a.estimatedTime - b.estimatedTime;
        case 'best_rate':
          return b.exchangeRate - a.exchangeRate;
        case 'balanced':
        default:
          return b.score - a.score;
      }
    });
  }

  // ============================================================
  // Cache Management
  // ============================================================

  private getCacheKey(request: QuoteRequest): string {
    return `${request.type}:${request.inputAmount}:${request.inputToken}:${request.outputToken}:${request.chainId}`;
  }

  private getFromCache(request: QuoteRequest): UnifiedQuote[] | null {
    const key = this.getCacheKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.config.maxCacheAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.quotes;
  }

  private setCache(request: QuoteRequest, quotes: UnifiedQuote[]): void {
    const key = this.getCacheKey(request);
    this.cache.set(key, {
      quotes,
      timestamp: Date.now(),
      requestHash: key,
    });

    // Clean up old entries
    this.cleanupCache();
  }

  /**
   * Clear all cached quotes.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove expired cache entries.
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxCacheAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }
}
