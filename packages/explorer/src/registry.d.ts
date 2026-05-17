/**
 * Wallet Registry — search, discovery, and metadata for 600+ wallets.
 */
import type { WalletInfo, DappInfo, ChainInfo, SearchFilter } from './types';
/** Singleton wallet/dApp registry. */
export declare class WalletRegistry {
    private static _instance;
    private wallets;
    private dapps;
    private chains;
    private logoCache;
    private constructor();
    static getInstance(): WalletRegistry;
    private _seedWallets;
    getWallet(walletId: string): WalletInfo | undefined;
    getAllWallets(): WalletInfo[];
    getPopularWallets(limit?: number): WalletInfo[];
    getWalletsForChain(chainId: string): WalletInfo[];
    getWalletsForPlatform(platform: WalletInfo['platforms'][number]): WalletInfo[];
    search(query: string, type?: 'wallet' | 'dapp' | 'chain'): (WalletInfo | DappInfo | ChainInfo)[];
    searchWallets(filter?: SearchFilter): WalletInfo[];
    getCachedLogo(walletId: string): string | undefined;
    cacheLogo(walletId: string, dataUri: string): void;
    registerChain(info: ChainInfo): void;
    registerDapp(info: DappInfo): void;
    getChain(caipNetworkId: string): ChainInfo | undefined;
    getAllChains(): ChainInfo[];
}
export declare const registry: WalletRegistry;
//# sourceMappingURL=registry.d.ts.map