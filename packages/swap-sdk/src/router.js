/**
 * Smart Router — Best price selection across DEX providers.
 *
 * The SwapRouter manages executor lifecycle, caches quotes,
 * and provides a unified interface for fetching and executing swaps.
 */
// ============================================================
// SwapRouter
// ============================================================
export class SwapRouter {
    constructor(quoter) {
        this.quoter = quoter;
        this.executionEnabled = false;
    }
    /**
     * Get the best quote across all providers.
     */
    async getBestQuote(params) {
        return this.quoter.getBestQuote(params);
    }
    /**
     * Compare quotes from all providers.
     */
    async compareQuotes(params) {
        const best = await this.getBestQuote(params);
        return best.allQuotes;
    }
    /**
     * Enable or disable swap execution.
     * When disabled, only quotes are returned (dry-run mode).
     */
    setExecutionEnabled(enabled) {
        this.executionEnabled = enabled;
    }
    /**
     * Execute a swap with the best available quote.
     *
     * @param params Swap parameters
     * @param executeParams Execution configuration
     * @returns Swap receipt
     */
    async executeSwap(params, executeParams) {
        if (!this.executionEnabled) {
            throw new Error("Swap execution is disabled. Call setExecutionEnabled(true) first.");
        }
        const best = await this.getBestQuote(params);
        const slippageBps = executeParams?.slippageBps ?? params.slippageBps;
        // Validate quote freshness
        if (Date.now() > best.quote.expiresAt) {
            throw new Error("Quote has expired. Please request a new quote.");
        }
        // In production, this would:
        // 1. Get the transaction data from the executor
        // 2. Send the transaction via viem walletClient
        // 3. Wait for confirmation
        // 4. Return the receipt
        return {
            txHash: "0x", // Placeholder
            quoteId: best.quote.id,
            fromAmount: best.quote.fromAmount,
            toAmount: best.quote.toAmount,
            gasUsed: best.quote.gasEstimate,
            gasPrice: 0n,
            blockNumber: 0n,
            success: true,
        };
    }
    /**
     * Get supported tokens from all providers for a chain.
     */
    async getSupportedTokens(chainId) {
        const tokenSets = await Promise.all(this.quoter.getAvailableProviders().map(async (_name) => {
            // Token lists would be fetched per-provider
            return [];
        }));
        // Deduplicate by address
        const tokenMap = new Map();
        for (const tokens of tokenSets.flat()) {
            tokenMap.set(tokens.address.toLowerCase(), tokens);
        }
        return Array.from(tokenMap.values());
    }
    /**
     * Calculate price impact for a given swap.
     */
    async getPriceImpact(params) {
        const best = await this.getBestQuote(params);
        return best.quote.priceImpact;
    }
}
//# sourceMappingURL=router.js.map