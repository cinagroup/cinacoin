import type { TokenInfo, TokenSource } from '../types.js';
export interface CoinGeckoOptions {
    apiKey?: string;
    baseUrl?: string;
}
/**
 * CoinGecko API token source.
 * Fetches token metadata from the CoinGecko API.
 */
export declare class CoinGeckoSource implements TokenSource {
    readonly name = "coingecko";
    private apiKey?;
    private baseUrl;
    constructor(options?: CoinGeckoOptions);
    fetch(): Promise<TokenInfo[]>;
    /**
     * Fetch price data for a specific token.
     */
    fetchPrice(coingeckoId: string, vsCurrency?: string): Promise<{
        price: number;
        change24h?: number;
    }>;
    private platformToChainId;
}
//# sourceMappingURL=coingecko.d.ts.map