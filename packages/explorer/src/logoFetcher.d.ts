/**
 * Logo fetching utility for wallets and chains.
 * Caches results in memory ( IndexedDB in browser).
 */
/** In-memory logo cache. */
export declare const logoCache: Map<string, string>;
/**
 * Fetch a wallet logo by ID.
 *
 * @param walletId - e.g. 'metamask', 'coinbase-wallet'
 * @param size - icon size in pixels (default 96)
 * @returns icon URL
 */
export declare function fetchWalletLogo(walletId: string, size?: number): string;
/**
 * Fetch a chain logo by CAIP-2 chain ID.
 *
 * @param chainId - e.g. 'eip155:1'
 * @returns icon URL
 */
export declare function fetchChainLogo(chainId: string): string;
/**
 * Preload logos for a list of wallets.
 * Useful for warming the cache before rendering a wallet list.
 *
 * @param walletIds - list of wallet IDs to preload
 */
export declare function preloadLogos(walletIds: string[]): void;
//# sourceMappingURL=logoFetcher.d.ts.map