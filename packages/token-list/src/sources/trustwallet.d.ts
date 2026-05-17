import type { TokenInfo, TokenSource } from '../types.js';
export interface TrustWalletOptions {
    baseUrl?: string;
}
/**
 * Trust Wallet token list source.
 * Fetches token data from the trustwallet/assets repository.
 */
export declare class TrustWalletSource implements TokenSource {
    readonly name = "trustwallet";
    private baseUrl;
    constructor(options?: TrustWalletOptions);
    fetch(chain?: string): Promise<TokenInfo[]>;
    /**
     * Fetch token logo URI from Trust Wallet assets.
     */
    getLogoUri(chain: string, address: string): string;
    /**
     * Get the info URL for a token on Trust Wallet.
     */
    getInfoUrl(chain: string, address: string): string;
}
//# sourceMappingURL=trustwallet.d.ts.map