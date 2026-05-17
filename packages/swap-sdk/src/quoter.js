/**
 * Swap Quoter — Aggregate quotes from multiple DEX providers.
 *
 * Fetches quotes from all configured DEX executors, compares them,
 * and returns the best route for the user.
 */
import { calculateMinimumReceived } from "./slippage.js.js";
const DEFAULT_CONFIG = {
    quoteTimeoutMs: 5000,
    defaultSlippageBps: 50,
    enablePriceImpactCheck: true,
    minOutputThreshold: 0n,
};
// ============================================================
// SwapQuoter
// ============================================================
export class SwapQuoter {
    constructor(executors, config) {
        this.executors = executors;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Fetch quotes from all providers and return the best one.
     */
    async getBestQuote(params) {
        const allQuotes = await this.fetchAllQuotes(params);
        // Filter out invalid quotes
        const validQuotes = allQuotes.filter((q) => q.toAmount > this.config.minOutputThreshold &&
            q.toAmount > 0n);
        if (validQuotes.length === 0) {
            throw new Error("No valid swap quotes available");
        }
        // Sort by output amount descending (best price first)
        validQuotes.sort((a, b) => {
            if (b.toAmount > a.toAmount)
                return 1;
            if (b.toAmount < a.toAmount)
                return -1;
            // Tie-breaker: prefer lower gas
            return a.gasEstimate < b.gasEstimate ? 1 : -1;
        });
        const best = validQuotes[0];
        const second = validQuotes.length > 1 ? validQuotes[1] : null;
        const savingsVsSecond = second
            ? best.toAmount - second.toAmount
            : 0n;
        return {
            quote: best,
            allQuotes: validQuotes,
            savingsVsSecond,
        };
    }
    /**
     * Fetch quotes from a single provider.
     */
    async getQuoteFrom(provider, params) {
        const executor = this.executors.find((e) => e.name === provider);
        if (!executor) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        return executor.getQuote(params);
    }
    /**
     * Fetch quotes from all providers concurrently.
     */
    async fetchAllQuotes(params) {
        const quotePromises = this.executors.map(async (executor) => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), this.config.quoteTimeoutMs);
                const quote = await executor.getQuote(params);
                clearTimeout(timeout);
                // Enrich with slippage calculation
                return this.enrichQuote(quote, params.slippageBps);
            }
            catch (err) {
                // Log and skip failed providers
                console.warn(`Quote failed for ${executor.name}:`, err);
                return null;
            }
        });
        const results = await Promise.allSettled(quotePromises);
        return results
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value)
            .filter((q) => q !== null);
    }
    /**
     * Enrich a quote with slippage protection and price impact data.
     */
    enrichQuote(quote, slippageBps) {
        // Calculate minimum received
        const minimumReceived = calculateMinimumReceived(quote.toAmount, slippageBps);
        return {
            ...quote,
            minimumReceived,
        };
    }
    /**
     * Get all available provider names.
     */
    getAvailableProviders() {
        return this.executors.map((e) => e.name);
    }
    /**
     * Add a new executor at runtime.
     */
    addExecutor(executor) {
        this.executors.push(executor);
    }
    /**
     * Remove an executor by name.
     */
    removeExecutor(name) {
        this.executors = this.executors.filter((e) => e.name !== name);
    }
}
//# sourceMappingURL=quoter.js.map