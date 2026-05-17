/**
 * On-Ramp Aggregator — Fetches quotes from multiple fiat-to-crypto providers
 * and selects the best one based on cost, speed, and user preferences.
 *
 * Supported providers: MoonPay, Ramp, Transak, Stripe, Coinbase.
 */
const DEFAULT_CONFIG = {
    quoteTimeoutMs: 8000,
    defaultRegion: "US",
    providerInfoTTL: 5 * 60 * 1000,
};
// ============================================================
// OnRampAggregator
// ============================================================
export class OnRampAggregator {
    constructor(config) {
        this.providers = new Map();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Register a provider adapter.
     */
    registerProvider(provider) {
        this.providers.set(provider.id, provider);
    }
    /**
     * Unregister a provider by ID.
     */
    unregisterProvider(id) {
        this.providers.delete(id);
    }
    /**
     * Get all registered providers.
     */
    getProviders(region) {
        const results = [];
        for (const adapter of this.providers.values()) {
            try {
                const info = adapter.getProviderInfo();
                if (region && !info.regions.includes(region)) {
                    continue;
                }
                results.push(info);
            }
            catch {
                // Skip providers that fail to return info
            }
        }
        return results;
    }
    /**
     * Fetch quotes from all available providers concurrently.
     */
    async getQuotes(params) {
        const quotePromises = Array.from(this.providers.values()).map(async (provider) => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), this.config.quoteTimeoutMs);
                const quote = await provider.getQuote(params);
                clearTimeout(timeout);
                return quote;
            }
            catch (err) {
                console.warn(`Quote failed for ${provider.id}:`, err);
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
     * Get the best quote based on user preferences.
     *
     * Selection priority:
     * 1. Lowest total cost
     * 2. Shortest delivery time
     * 3. Preferred payment method match
     */
    async getBestQuote(params, preferences) {
        const quotes = await this.getQuotes(params);
        if (quotes.length === 0) {
            return null;
        }
        const sorted = this.sortQuotes(quotes, preferences);
        return sorted[0];
    }
    /**
     * Sort quotes by preference.
     */
    sortQuotes(quotes, preferences) {
        return [...quotes].sort((a, b) => {
            // 1. Total cost (lower is better)
            if (a.totalCost !== b.totalCost) {
                return a.totalCost - b.totalCost;
            }
            // 2. Delivery time (shorter is better)
            if (a.estimatedTime !== b.estimatedTime) {
                return a.estimatedTime - b.estimatedTime;
            }
            // 3. Fee percentage
            return a.fees.totalFeePercent - b.fees.totalFeePercent;
        });
    }
    /**
     * Get the widget URL for the best available quote.
     */
    getWidgetUrl(params) {
        const providerId = params.enabledProviders?.[0];
        if (providerId) {
            const provider = this.providers.get(providerId);
            if (provider) {
                return provider.getWidgetUrl(params);
            }
        }
        // Use the first available provider
        for (const adapter of this.providers.values()) {
            try {
                return adapter.getWidgetUrl(params);
            }
            catch {
                // Continue to next provider
            }
        }
        return null;
    }
    /**
     * Handle the result of a widget session.
     */
    handleWidgetResult(result) {
        if (result.completed) {
            console.log(`On-ramp purchase completed: ${result.cryptoAmount} via ${result.provider}`);
        }
        else {
            console.warn(`On-ramp purchase failed or cancelled: ${result.error}`);
        }
    }
}
//# sourceMappingURL=aggregator.js.map