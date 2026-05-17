const COINGECKO_API = 'https://api.coingecko.com/api/v3';
/**
 * CoinGecko API token source.
 * Fetches token metadata from the CoinGecko API.
 */
export class CoinGeckoSource {
    constructor(options = {}) {
        this.name = 'coingecko';
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl || COINGECKO_API;
    }
    async fetch() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['x-cg-pro-api-key'] = this.apiKey;
        }
        const url = `${this.baseUrl}/coins/list?include_platform=true`;
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }
        const coins = await response.json();
        return coins
            .filter((coin) => Object.keys(coin.platforms).length > 0)
            .flatMap((coin) => Object.entries(coin.platforms).map(([platform, address]) => ({
            address,
            chainId: this.platformToChainId(platform),
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            decimals: 18, // Default; actual decimals require a separate API call
            logoURI: undefined,
            tags: ['coingecko'],
            extensions: {
                coingeckoId: coin.id,
                platform,
            },
        })));
    }
    /**
     * Fetch price data for a specific token.
     */
    async fetchPrice(coingeckoId, vsCurrency = 'usd') {
        const url = `${this.baseUrl}/simple/price?ids=${coingeckoId}&vs_currencies=${vsCurrency}&include_24hr_change=true`;
        const headers = { 'Content-Type': 'application/json' };
        if (this.apiKey) {
            headers['x-cg-pro-api-key'] = this.apiKey;
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`CoinGecko price error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const entry = data[coingeckoId];
        return {
            price: entry?.[vsCurrency] ?? 0,
            change24h: entry?.[`${vsCurrency}_24h_change`],
        };
    }
    platformToChainId(platform) {
        const mapping = {
            ethereum: 1,
            binance
        } - smart - chain;
        56,
            polygon - pos;
        137,
            'avalanche';
        43114,
            optimism;
        10,
            arbitrum;
        42161,
            fantom;
        250,
            'base';
        8453,
        ;
    }
    ;
}
return mapping[platform] ?? 0;
//# sourceMappingURL=coingecko.js.map