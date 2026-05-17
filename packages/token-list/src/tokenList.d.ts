import type { TokenInfo, TokenSource, TokenWithPrice, FilterOptions, ValidationResult, PriceData, TokenListCache } from './types.js';
/**
 * TokenList — Unified token management with multi-source fetching,
 * searching, filtering, caching, and validation.
 */
export declare class TokenList {
    private sources;
    private cache;
    private tokenMap;
    constructor(options?: {
        cache?: TokenListCache;
        sources?: TokenSource[];
    });
    /**
     * Register a token source.
     */
    addSource(source: TokenSource): void;
    /**
     * Fetch tokens from all registered sources, merging results.
     */
    fetchAll(): Promise<TokenInfo[]>;
    /**
     * Search tokens by symbol, name, or address.
     */
    search(query: string, options?: FilterOptions): TokenInfo[];
    /**
     * Filter tokens by chain, tags, address, symbol.
     */
    filter(options: FilterOptions): TokenInfo[];
    /**
     * Validate a single token against basic schema rules.
     */
    validateToken(token: TokenInfo): ValidationResult;
    /**
     * Get price data for a token (if available in the enriched map).
     */
    getPrice(token: TokenWithPrice): PriceData | undefined;
    /**
     * Enrich tokens with price data from a source.
     */
    enrichWithPrices(tokens: TokenInfo[], priceMap: Map<string, PriceData>): Promise<TokenWithPrice[]>;
    /**
     * Get a token by address and chainId.
     */
    getToken(address: string, chainId: number): TokenInfo | undefined;
    /**
     * Clear the internal cache and token map.
     */
    clear(): void;
    private matchesFilter;
}
//# sourceMappingURL=tokenList.d.ts.map