import type { WalletInfo, SearchFilter } from '../types';
/**
 * React hook for wallet/dApp discovery and logo fetching.
 *
 * @example
 * ```tsx
 * const { searchWallets, getWallet, getWalletLogo, getPopularWallets } = useExplorer();
 * ```
 */
export declare function useExplorer(): {
    searchQuery: any;
    setSearchQuery: any;
    searchWallets: (filter?: SearchFilter) => WalletInfo[];
    getWallet: (walletId: string) => WalletInfo | undefined;
    getWalletLogo: (walletId: string, size?: number) => string;
    getPopularWallets: () => any;
};
//# sourceMappingURL=useExplorer.d.ts.map