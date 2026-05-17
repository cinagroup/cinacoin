/**
 * OnRampWidgetCore — Framework-agnostic on-ramp widget controller.
 *
 * Manages quote fetching, provider selection, and provider redirect
 * for the OnRampWidget UI.
 */
/**
 * Core on-ramp widget controller (framework-agnostic).
 *
 * Usage:
 * ```ts
 * const core = new OnRampWidgetCore({
 *   params: { destinationAddress: '0x...', defaultFiatCurrency: 'USD' },
 *   fetchQuotes: async (params) => {...},
 *   redirectToProvider: async (quote) => {...},
 * });
 *
 * core.setFiatAmount(100);
 * core.setFiatCurrency('EUR');
 * core.setCryptoToken('ETH');
 * await core.fetchQuotes();
 * core.selectProvider('moonpay');
 * await core.redirectToProvider();
 * ```
 */
export class OnRampWidgetCore {
    constructor(config) {
        this._listeners = new Set();
        this.config = config;
        this._state = {
            state: "idle",
            fiatAmount: config.params.defaultFiatAmount ?? 100,
            fiatCurrency: config.params.defaultFiatCurrency ?? "USD",
            cryptoToken: config.params.defaultCryptoToken ?? "ETH",
            selectedProvider: null,
            quotes: [],
            error: null,
            lastResult: null,
        };
    }
    // ── Getters ──────────────────────────────────────────────
    get state() {
        return this._state;
    }
    get canRedirect() {
        return this._state.selectedProvider !== null && this._state.quotes.length > 0;
    }
    // ── Input Controls ───────────────────────────────────────
    setFiatAmount(amount) {
        if (amount < 0)
            return;
        this._patch({ fiatAmount: amount });
        this._clearQuotes();
    }
    setFiatCurrency(currency) {
        this._patch({ fiatCurrency: currency.toUpperCase() });
        this._clearQuotes();
    }
    setCryptoToken(token) {
        this._patch({ cryptoToken: token });
        this._clearQuotes();
    }
    setUserRegion(region) {
        this._patch({});
        // Region doesn't clear quotes but will be used in fetch
    }
    // ── Quote Fetching ───────────────────────────────────────
    async fetchQuotes() {
        const { fiatAmount, fiatCurrency, cryptoToken } = this._state;
        const params = this.config.params;
        if (fiatAmount <= 0) {
            this._patch({ error: "Please enter a valid amount." });
            return;
        }
        this._patch({ state: "fetching-quotes", error: null });
        try {
            const quoteParams = {
                fiatCurrency,
                fiatAmount,
                cryptoToken,
                chainId: 1, // default, should be configurable
                destinationAddress: params.destinationAddress,
                userRegion: params.userRegion ?? "US",
                paymentMethod: undefined,
            };
            const quotes = await this.config.fetchQuotes(quoteParams);
            // Filter by enabled providers if specified
            const filtered = params.enabledProviders && params.enabledProviders.length > 0
                ? quotes.filter((q) => params.enabledProviders.includes(q.provider))
                : quotes;
            // Sort by best exchange rate (most crypto for the fiat)
            const sorted = [...filtered].sort((a, b) => b.cryptoAmount - a.cryptoAmount);
            this._patch({
                state: "quotes-ready",
                quotes: sorted,
                selectedProvider: sorted[0]?.provider ?? null,
                error: null,
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch quotes";
            this._patch({ state: "error", error: message, quotes: [] });
        }
    }
    // ── Provider Selection ───────────────────────────────────
    selectProvider(provider) {
        const available = this._state.quotes.map((q) => q.provider);
        if (!available.includes(provider))
            return;
        this._patch({ selectedProvider: provider });
    }
    getSelectedQuote() {
        if (!this._state.selectedProvider)
            return null;
        return (this._state.quotes.find((q) => q.provider === this._state.selectedProvider) ?? null);
    }
    getBestQuote() {
        return this._state.quotes[0] ?? null;
    }
    // ── Provider Redirect ────────────────────────────────────
    async redirectToProvider() {
        const quote = this.getSelectedQuote();
        if (!quote) {
            this._patch({ error: "No provider selected" });
            return null;
        }
        this._patch({ state: "redirecting", error: null });
        try {
            const result = await this.config.redirectToProvider(quote);
            this._patch({
                state: result.completed ? "completed" : "idle",
                lastResult: result,
                error: null,
            });
            return result;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Redirect failed";
            this._patch({ state: "error", error: message });
            return null;
        }
    }
    // ── Reset ────────────────────────────────────────────────
    reset() {
        this._patch({
            state: "idle",
            fiatAmount: this.config.params.defaultFiatAmount ?? 100,
            fiatCurrency: this.config.params.defaultFiatCurrency ?? "USD",
            cryptoToken: this.config.params.defaultCryptoToken ?? "ETH",
            selectedProvider: null,
            quotes: [],
            error: null,
            lastResult: null,
        });
    }
    // ── Change Notifications ─────────────────────────────────
    onChange(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }
    // ── Private Helpers ──────────────────────────────────────
    _patch(partial) {
        this._state = { ...this._state, ...partial };
        this._notify();
    }
    _clearQuotes() {
        this._patch({
            quotes: [],
            selectedProvider: null,
            error: null,
            state: "idle",
        });
    }
    _notify() {
        for (const listener of this._listeners) {
            try {
                listener();
            }
            catch {
                // swallow
            }
        }
    }
}
//# sourceMappingURL=OnRampWidgetCore.js.map