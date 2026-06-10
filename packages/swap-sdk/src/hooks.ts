/**
 * React Hooks for the Swap SDK
 *
 * Provides useSwap and useBestRoute hooks for React applications
 * integrating with the Cinacoin Swap Aggregator.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type {
  SwapQuoteParams,
  SwapQuote,
  SwapReceipt,
  BestQuote,
  SwapExecuteParams,
  TokenInfo,
} from "./types.js";
import type { SwapRouter } from "./router.js";
import type { SwapQuoter } from "./quoter.js";
import type {
  CrossChainSwapParams,
  CrossChainQuote,
  CrossChainRoute,
} from "./cross-chain.js";
import { CrossChainSwapRouter } from "./cross-chain.js";
import { logger } from '@cinacoin/logger';

// ============================================================
// useSwap Hook
// ============================================================

export interface UseSwapOptions {
  /** SwapRouter instance */
  router: SwapRouter;
  /** Auto-refresh interval for quotes (ms), 0 to disable */
  refreshIntervalMs?: number;
  /** Whether to enable execution */
  executionEnabled?: boolean;
}

export interface UseSwapReturn {
  /** Current best quote */
  quote: BestQuote | null;
  /** All available quotes */
  allQuotes: SwapQuote[];
  /** Whether a quote is being fetched */
  isLoading: boolean;
  /** Whether a swap is being executed */
  isExecuting: boolean;
  /** Last error */
  error: Error | null;
  /** Execute a swap with current params */
  executeSwap: (executeParams: SwapExecuteParams) => Promise<SwapReceipt>;
  /** Fetch a fresh quote */
  refreshQuote: () => Promise<void>;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for managing swap quotes and execution.
 *
 * @example
 * ```tsx
 * const { quote, executeSwap, isLoading } = useSwap({ router, refreshIntervalMs: 15000 });
 *
 * useEffect(() => {
 *   if (quote) {
 *     // Display quote to user
 *   }
 * }, [quote]);
 *
 * const handleSwap = async () => {
 *   const receipt = await executeSwap({ walletClient, publicClient });
 *   logger.info('Swap complete:', receipt.txHash);
 * };
 * ```
 */
export function useSwap(
  params: SwapQuoteParams | null,
  options: UseSwapOptions,
): UseSwapReturn {
  const { router, refreshIntervalMs = 15000, executionEnabled = false } = options;

  const [quote, setQuote] = useState<BestQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const fetchQuote = useCallback(async () => {
    const currentParams = paramsRef.current;
    if (!currentParams) return;

    setIsLoading(true);
    setError(null);
    try {
      router.setExecutionEnabled(executionEnabled);
      const best = await router.getBestQuote(currentParams);
      setQuote(best);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [router, executionEnabled]);

  // Auto-refresh
  useEffect(() => {
    if (!params) {
      setQuote(null);
      return;
    }

    fetchQuote();

    if (refreshIntervalMs > 0) {
      const interval = setInterval(fetchQuote, refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [params, router, refreshIntervalMs, fetchQuote]);

  const executeSwap = useCallback(
    async (executeParams: SwapExecuteParams): Promise<SwapReceipt> => {
      if (!quote) throw new Error("No quote available");
      if (!paramsRef.current) throw new Error("No swap parameters");

      setIsExecuting(true);
      setError(null);
      try {
        const receipt = await router.executeSwap(paramsRef.current, executeParams);
        // Refresh quote after execution
        await fetchQuote();
        return receipt;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsExecuting(false);
      }
    },
    [router, quote, fetchQuote],
  );

  const allQuotes = useMemo(
    () => quote?.allQuotes ?? [],
    [quote],
  );

  const reset = useCallback(() => {
    setQuote(null);
    setError(null);
    setIsLoading(false);
    setIsExecuting(false);
  }, []);

  return {
    quote,
    allQuotes,
    isLoading,
    isExecuting,
    error,
    executeSwap,
    refreshQuote: fetchQuote,
    reset,
  };
}

// ============================================================
// useBestRoute Hook
// ============================================================

export interface UseBestRouteOptions {
  /** Source chain SwapQuoter */
  sourceQuoter: SwapQuoter;
  /** Destination chain SwapQuoter (for cross-chain swaps) */
  destQuoter?: SwapQuoter;
  /** Quote refresh interval (ms), 0 to disable */
  refreshIntervalMs?: number;
}

export interface UseBestRouteReturn {
  /** Best same-chain quote */
  bestQuote: BestQuote | null;
  /** Best cross-chain route (if destChainId differs) */
  bestCrossChainRoute: CrossChainQuote | null;
  /** Whether we're fetching quotes */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Determine if cross-chain swap is better */
  isCrossChainBetter: boolean;
  /** All same-chain quotes */
  allQuotes: SwapQuote[];
  /** All cross-chain routes */
  allCrossChainRoutes: CrossChainRoute[];
  /** Refresh quotes */
  refresh: () => Promise<void>;
}

/**
 * Hook that finds the best route — same-chain or cross-chain.
 *
 * When params.chainId === params.destChainId, it returns same-chain quotes.
 * When they differ, it evaluates both same-chain and cross-chain options
 * and indicates which is better.
 *
 * @example
 * ```tsx
 * const { bestQuote, bestCrossChainRoute, isCrossChainBetter } = useBestRoute(
 *   {
 *     fromToken: usdcAddress,
 *     toToken: ethAddress,
 *     fromAmount: 1000n * 10n ** 6n,
 *     chainId: 1,
 *     destChainId: 8453, // Cross-chain to Base
 *     slippageBps: 50,
 *   },
 *   { sourceQuoter, destQuoter }
 * );
 * ```
 */
export function useBestRoute(
  params: (SwapQuoteParams & { destChainId?: number }) | null,
  options: UseBestRouteOptions,
): UseBestRouteReturn {
  const { sourceQuoter, destQuoter, refreshIntervalMs = 20000 } = options;

  const [bestQuote, setBestQuote] = useState<BestQuote | null>(null);
  const [bestCrossChainRoute, setBestCrossChainRoute] = useState<CrossChainQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const fetchRoutes = useCallback(async () => {
    const currentParams = paramsRef.current;
    if (!currentParams) return;

    setIsLoading(true);
    setError(null);

    try {
      // Same-chain quote
      const sameChainParams: SwapQuoteParams = {
        fromToken: currentParams.fromToken,
        toToken: currentParams.toToken,
        fromAmount: currentParams.fromAmount,
        chainId: currentParams.chainId,
        slippageBps: currentParams.slippageBps,
        recipient: currentParams.recipient,
        feeRecipient: currentParams.feeRecipient,
        feeBps: currentParams.feeBps,
      };

      const best = await sourceQuoter.getBestQuote(sameChainParams);
      setBestQuote(best);

      // Cross-chain if destChainId differs
      if (currentParams.destChainId && currentParams.destChainId !== currentParams.chainId) {
        const crossChainRouter = new CrossChainSwapRouter(sourceQuoter, {
          destQuoter: destQuoter,
        });

        const ccParams: CrossChainSwapParams = {
          ...sameChainParams,
          destChainId: currentParams.destChainId,
          destToken: (currentParams as CrossChainSwapParams).destToken,
        };

        try {
          const ccQuote = await crossChainRouter.getBestCrossChainRoute(ccParams);
          setBestCrossChainRoute(ccQuote);
        } catch {
          setBestCrossChainRoute(null);
        }
      } else {
        setBestCrossChainRoute(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [sourceQuoter, destQuoter]);

  // Auto-refresh
  useEffect(() => {
    if (!params) {
      setBestQuote(null);
      setBestCrossChainRoute(null);
      return;
    }

    fetchRoutes();

    if (refreshIntervalMs > 0) {
      const interval = setInterval(fetchRoutes, refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [params, sourceQuoter, destQuoter, refreshIntervalMs, fetchRoutes]);

  const isCrossChainBetter = useMemo(() => {
    if (!bestQuote || !bestCrossChainRoute) return false;
    return bestCrossChainRoute.route.totalOutput > bestQuote.quote.toAmount;
  }, [bestQuote, bestCrossChainRoute]);

  const allQuotes = useMemo(
    () => bestQuote?.allQuotes ?? [],
    [bestQuote],
  );

  const allCrossChainRoutes = useMemo(
    () => bestCrossChainRoute?.allRoutes ?? [],
    [bestCrossChainRoute],
  );

  return {
    bestQuote,
    bestCrossChainRoute,
    isLoading,
    error,
    isCrossChainBetter,
    allQuotes,
    allCrossChainRoutes,
    refresh: fetchRoutes,
  };
}

// ============================================================
// useSwapTokens Hook
// ============================================================

export interface UseSwapTokensOptions {
  /** SwapRouter instance */
  router?: InstanceType<typeof import("./router.js").SwapRouter> | null;
  /** Chain ID to fetch tokens for */
  chainId: number;
}

export interface UseSwapTokensReturn {
  /** Available tokens */
  tokens: TokenInfo[];
  /** Whether tokens are loading */
  isLoading: boolean;
}

/**
 * Hook to fetch available swap tokens for a chain.
 */
export function useSwapTokens(options: UseSwapTokensOptions): UseSwapTokensReturn {
  const { router, chainId } = options;
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!router) return;

    setIsLoading(true);
    router
      .getSupportedTokens(chainId)
      .then(setTokens)
      .catch(() => setTokens([]))
      .finally(() => setIsLoading(false));
  }, [router, chainId]);

  return { tokens, isLoading };
}
