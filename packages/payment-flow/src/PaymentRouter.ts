/**
 * PaymentRouter — Automatic optimal payment path selection
 *
 * Routes payment requests through the best available path based on:
 * - Cost (fees)
 * - Speed (estimated time)
 * - User preferences
 * - Provider availability
 *
 * @example
 * ```ts
 * const router = new PaymentRouter({
 *   aggregator,
 *   defaultPreferences: {
 *     maxFeePercent: 5,
 *     maxDeliveryTimeMinutes: 30,
 *   },
 * });
 *
 * const route = await router.findBestRoute({
 *   type: 'buy',
 *   fiatAmount: 100,
 *   fiatCurrency: 'USD',
 *   cryptoToken: 'ETH',
 *   chainId: 1,
 *   destinationAddress: '0x...',
 * });
 * ```
 */

import { logger } from '@cinacoin/logger';
import type { OnRampQuote, OnRampProviderId, UserPreferences } from '@cinacoin/onramp-sdk';
import type { SwapQuote } from '@cinacoin/swap-sdk';

// ============================================================
// Types
// ============================================================

export type PaymentType = 'buy' | 'swap' | 'deposit';

export interface OnRampAggregatorLike {
  getQuotes(params: Record<string, unknown>): Promise<OnRampQuote[]>;
}

export interface SwapRouterLike {
  getQuotes(params: Record<string, unknown>): Promise<SwapQuote[]>;
}

export interface PaymentRouteRequest {
  type: PaymentType;
  fiatAmount?: number;
  fiatCurrency?: string;
  cryptoAmount?: number;
  cryptoToken: string;
  chainId: number;
  destinationAddress: string;
  userRegion?: string;
  paymentMethod?: string;
}

export interface PaymentRoute {
  type: PaymentType;
  provider?: OnRampProviderId;
  estimatedCost: number;
  estimatedTime: number;
  quotes: OnRampQuote[] | SwapQuote[];
  selectedQuote: OnRampQuote | SwapQuote | null;
  confidence: number; // 0-1, how confident we are this is the best route
}

export interface PaymentRouterConfig {
  /** Default user preferences */
  defaultPreferences?: UserPreferences;
  /** Maximum number of quotes to fetch */
  maxQuotes?: number;
  /** Timeout for route finding (ms) */
  timeoutMs?: number;
  /** Whether to prefer faster routes over cheaper ones */
  preferSpeed?: boolean;
}

// ============================================================
// PaymentRouter
// ============================================================

export class PaymentRouter {
  private config: PaymentRouterConfig;
  private aggregator: OnRampAggregatorLike | null = null; // OnRampAggregator - avoid circular dependency
  private swapRouter: SwapRouterLike | null = null; // SwapRouter - avoid circular dependency

  constructor(config: PaymentRouterConfig = {}) {
    this.config = {
      defaultPreferences: {},
      maxQuotes: 10,
      timeoutMs: 10000,
      preferSpeed: false,
      ...config,
    };
  }

  /**
   * Set the onramp aggregator instance.
   */
  setAggregator(aggregator: OnRampAggregatorLike): void {
    this.aggregator = aggregator;
  }

  /**
   * Set the swap router instance.
   */
  setSwapRouter(router: SwapRouterLike): void {
    this.swapRouter = router;
  }

  /**
   * Find the best payment route for the given request.
   */
  async findBestRoute(
    request: PaymentRouteRequest,
    preferences?: UserPreferences
  ): Promise<PaymentRoute> {
    const prefs = { ...this.config.defaultPreferences, ...preferences };

    switch (request.type) {
      case 'buy':
        return this.findBuyRoute(request, prefs);
      case 'swap':
        return this.findSwapRoute(request, prefs);
      case 'deposit':
        return this.findDepositRoute(request, prefs);
      default:
        throw new Error(`Unknown payment type: ${request.type}`);
    }
  }

  /**
   * Find the best route for buying crypto with fiat.
   */
  private async findBuyRoute(
    request: PaymentRouteRequest,
    preferences: UserPreferences
  ): Promise<PaymentRoute> {
    if (!this.aggregator) {
      throw new Error('OnRamp aggregator not set');
    }

    if (!request.fiatAmount || !request.fiatCurrency) {
      throw new Error('fiatAmount and fiatCurrency required for buy route');
    }

    const startTime = Date.now();

    try {
      // Fetch quotes from all providers
      const quotes = await this.aggregator.getQuotes({
        fiatAmount: request.fiatAmount,
        fiatCurrency: request.fiatCurrency,
        cryptoToken: request.cryptoToken,
        chainId: request.chainId,
        destinationAddress: request.destinationAddress,
        userRegion: request.userRegion ?? 'US',
        paymentMethod: request.paymentMethod,
      });

      if (quotes.length === 0) {
        return {
          type: 'buy',
          estimatedCost: 0,
          estimatedTime: 0,
          quotes: [],
          selectedQuote: null,
          confidence: 0,
        };
      }

      // Sort quotes by preference
      const sorted = this.sortQuotes(quotes, preferences);
      const bestQuote = sorted[0];

      const elapsed = Date.now() - startTime;
      const confidence = Math.max(0, 1 - elapsed / this.config.timeoutMs!);

      return {
        type: 'buy',
        provider: bestQuote.provider,
        estimatedCost: bestQuote.totalCost,
        estimatedTime: bestQuote.estimatedTime,
        quotes: sorted,
        selectedQuote: bestQuote,
        confidence,
      };
    } catch (error) {
      logger.error('[PaymentRouter] Failed to find buy route:', error);
      throw error;
    }
  }

  /**
   * Find the best route for swapping tokens.
   */
  private async findSwapRoute(
    request: PaymentRouteRequest,
    preferences: UserPreferences
  ): Promise<PaymentRoute> {
    if (!this.swapRouter) {
      throw new Error('Swap router not set');
    }

    if (!request.cryptoAmount) {
      throw new Error('cryptoAmount required for swap route');
    }

    const startTime = Date.now();

    try {
      // Fetch quotes from swap router
      const quotes = await this.swapRouter.getQuotes({
        fromToken: request.fiatCurrency ?? 'USDC',
        toToken: request.cryptoToken,
        amount: request.cryptoAmount,
        chainId: request.chainId,
        slippageBps: 50, // Default 0.5% slippage
      });

      if (quotes.length === 0) {
        return {
          type: 'swap',
          estimatedCost: 0,
          estimatedTime: 0,
          quotes: [],
          selectedQuote: null,
          confidence: 0,
        };
      }

      // Sort by output amount (higher is better)
      const sorted = [...quotes].sort((a, b) => {
        const aOut = Number(a.toAmount);
        const bOut = Number(b.toAmount);
        return bOut - aOut;
      });

      const bestQuote = sorted[0];
      const elapsed = Date.now() - startTime;
      const confidence = Math.max(0, 1 - elapsed / this.config.timeoutMs!);

      return {
        type: 'swap',
        estimatedCost: Number(bestQuote.fee),
        estimatedTime: 1, // Swaps are typically fast
        quotes: sorted,
        selectedQuote: bestQuote,
        confidence,
      };
    } catch (error) {
      logger.error('[PaymentRouter] Failed to find swap route:', error);
      throw error;
    }
  }

  /**
   * Find the best route for depositing from an exchange.
   */
  private async findDepositRoute(
    request: PaymentRouteRequest,
    preferences: UserPreferences
  ): Promise<PaymentRoute> {
    // Deposit routes don't have quotes, just return a placeholder
    return {
      type: 'deposit',
      estimatedCost: 0,
      estimatedTime: 10, // Average deposit time
      quotes: [],
      selectedQuote: null,
      confidence: 1,
    };
  }

  /**
   * Sort quotes based on user preferences.
   */
  private sortQuotes(
    quotes: OnRampQuote[],
    preferences: UserPreferences
  ): OnRampQuote[] {
    return [...quotes].sort((a, b) => {
      // Filter by max fee if specified
      if (preferences.maxFeePercent !== undefined) {
        if (a.fees.totalFeePercent > preferences.maxFeePercent) return 1;
        if (b.fees.totalFeePercent > preferences.maxFeePercent) return -1;
      }

      // Filter by max delivery time if specified
      if (preferences.maxDeliveryTimeMinutes !== undefined) {
        if (a.estimatedTime > preferences.maxDeliveryTimeMinutes) return 1;
        if (b.estimatedTime > preferences.maxDeliveryTimeMinutes) return -1;
      }

      // Prefer speed over cost if configured
      if (this.config.preferSpeed) {
        if (a.estimatedTime !== b.estimatedTime) {
          return a.estimatedTime - b.estimatedTime;
        }
        return a.totalCost - b.totalCost;
      }

      // Default: prefer cost over speed
      if (a.totalCost !== b.totalCost) {
        return a.totalCost - b.totalCost;
      }
      return a.estimatedTime - b.estimatedTime;
    });
  }

  /**
   * Compare multiple routes and select the best one.
   */
  async compareRoutes(
    requests: PaymentRouteRequest[],
    preferences?: UserPreferences
  ): Promise<PaymentRoute[]> {
    const routes = await Promise.allSettled(
      requests.map((req) => this.findBestRoute(req, preferences))
    );

    return routes
      .filter((r): r is PromiseFulfilledResult<PaymentRoute> => r.status === 'fulfilled')
      .map((r) => r.value)
      .sort((a, b) => {
        // Sort by confidence first, then by cost
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        return a.estimatedCost - b.estimatedCost;
      });
  }
}
