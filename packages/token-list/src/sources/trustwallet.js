const TRUST_WALLET_TOKENS_BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';
/**
 * Trust Wallet token list source.
 * Fetches token data from the trustwallet/assets repository.
 */
export class TrustWalletSource {
    constructor(options = {}) {
        this.name = 'trustwallet';
        this.baseUrl = options.baseUrl || TRUST_WALLET_TOKENS_BASE;
    }
    async fetch(chain = 'ethereum') {
        const url = `${this.baseUrl}/${chain}/tokenlist.json`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Trust Wallet token list error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.tokens.map((t) => ({
            address: t.contractAddress,
            chainId: t.decimals ? data.tokenChainId ?? 1 : 1,
            name: t.name,
            symbol: t.symbol,
            decimals: t.decimals,
            logoURI: t.logoURI,
            tags: ['trustwallet'],
            extensions: {
                chain,
            },
        }));
    }
    /**
     * Fetch token logo URI from Trust Wallet assets.
     */
    getLogoUri(chain, address) {
        return `${this.baseUrl}/${chain}/${address.toLowerCase()}/logo.png`;
    }
    /**
     * Get the info URL for a token on Trust Wallet.
     */
    getInfoUrl(chain, address) {
        return `${this.baseUrl}/${chain}/${address.toLowerCase()}/info.json`;
    }
}
//# sourceMappingURL=trustwallet.js.map