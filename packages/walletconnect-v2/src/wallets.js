/**
 * Wallet Registry — Known wallet deep link schemes and metadata.
 *
 * Provides wallet discovery data for the connect modal, including
 * deep link schemes, universal links, and app store URLs for
 * 18+ major mobile wallets.
 */
/**
 * Registry of well-known wallets with their deep link schemes,
 * universal links, and app store URLs.
 */
export const WALLET_REGISTRY = [
    // ─── EVM Wallets ──────────────────────────────────────
    {
        id: 'metamask',
        name: 'MetaMask',
        homepage: 'https://metamask.io',
        deepLink: 'metamask://',
        universalLink: 'https://metamask.app.link',
        appStoreUrl: 'https://apps.apple.com/app/metamask/id1438668043',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/metamask',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:56'],
        rdns: 'io.metamask',
    },
    {
        id: 'rainbow',
        name: 'Rainbow',
        homepage: 'https://rainbow.me',
        deepLink: 'rainbow://',
        universalLink: 'https://rnbwapp.com',
        appStoreUrl: 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=me.rainbow',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/rainbow',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'],
        rdns: 'me.rainbow',
    },
    {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        homepage: 'https://www.coinbase.com/wallet',
        deepLink: 'cbwallet://',
        universalLink: 'https://go.cb-w.com',
        appStoreUrl: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=org.toshi',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/coinbase',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        rdns: 'com.coinbase.wallet',
    },
    {
        id: 'trust',
        name: 'Trust Wallet',
        homepage: 'https://trustwallet.com',
        deepLink: 'trust://',
        universalLink: 'https://link.trustwallet.com',
        appStoreUrl: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/trust',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:56', 'eip155:137', 'eip155:43114', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        rdns: 'com.trustwallet.app',
    },
    {
        id: 'zerion',
        name: 'Zerion',
        homepage: 'https://zerion.io',
        deepLink: 'zerion://',
        universalLink: 'https://app.zerion.io',
        appStoreUrl: 'https://apps.apple.com/app/zerion/id1456732164',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=io.zerion.android',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/zerion',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10'],
        rdns: 'io.zerion.wallet',
    },
    {
        id: 'rabby',
        name: 'Rabby',
        homepage: 'https://rabby.io',
        deepLink: 'rabby://',
        universalLink: 'https://rabby.io',
        appStoreUrl: 'https://apps.apple.com/app/rabby-wallet/id1628947930',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.debank.rabby',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/rabby',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:56'],
        rdns: 'io.rabby',
    },
    {
        id: 'imtoken',
        name: 'imToken',
        homepage: 'https://token.im',
        deepLink: 'imtokenv2://',
        universalLink: 'https://token.im',
        appStoreUrl: 'https://apps.apple.com/app/imtoken/id1594723776',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=im.token.app',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/imtoken',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:56', 'eip155:137'],
        rdns: 'im.token',
    },
    {
        id: 'tokenpocket',
        name: 'TokenPocket',
        homepage: 'https://www.tokenpocket.pro',
        deepLink: 'tpoutside://',
        universalLink: 'https://www.tokenpocket.pro',
        appStoreUrl: 'https://apps.apple.com/app/tokenpocket/id1436002486',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=vip.mytokenpocket',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/tokenpocket',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:56', 'eip155:137', 'eip155:43114'],
        rdns: 'pro.tokenpocket',
    },
    {
        id: 'ledger',
        name: 'Ledger Live',
        homepage: 'https://www.ledger.com',
        deepLink: 'ledgerlive://',
        universalLink: 'https://ledgerlive.onelink.me',
        appStoreUrl: 'https://apps.apple.com/app/ledger-live/id1361671700',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ledger.live',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/ledger',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161'],
        rdns: 'com.ledger.live',
    },
    {
        id: 'uniswap',
        name: 'Uniswap Wallet',
        homepage: 'https://wallet.uniswap.org',
        deepLink: 'uniswap://',
        universalLink: 'https://wallet.uniswap.org',
        appStoreUrl: 'https://apps.apple.com/app/uniswap-wallet/id6443944476',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.uniswap.mobile',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/uniswap',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'],
        rdns: 'org.uniswap.wallet',
    },
    {
        id: 'okx',
        name: 'OKX Wallet',
        homepage: 'https://www.okx.com/web3',
        deepLink: 'okex://',
        universalLink: 'https://www.okx.com',
        appStoreUrl: 'https://apps.apple.com/app/okx/id1484717480',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.okinc.okex',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/okx',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:56', 'eip155:137', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        rdns: 'com.okex',
    },
    {
        id: 'safepal',
        name: 'SafePal',
        homepage: 'https://www.safepal.com',
        deepLink: 'safepal://',
        universalLink: 'https://www.safepal.com',
        appStoreUrl: 'https://apps.apple.com/app/safepal/id1541662925',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=io.safepal.wallet',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/safepal',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:56', 'eip155:137'],
        rdns: 'com.safepal.wallet',
    },
    {
        id: 'bitget',
        name: 'Bitget Wallet',
        homepage: 'https://web3.bitget.com',
        deepLink: 'bitkeep://',
        universalLink: 'https://web3.bitget.com',
        appStoreUrl: 'https://apps.apple.com/app/bitget-wallet/id1395301115',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.bitkeep.wallet',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/bitget',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:56', 'eip155:137', 'eip155:43114'],
        rdns: 'com.bitget.wallet',
    },
    // ─── Multi-chain / Solana-first ──────────────────────
    {
        id: 'phantom',
        name: 'Phantom',
        homepage: 'https://phantom.app',
        deepLink: 'phantom://',
        universalLink: 'https://phantom.app',
        appStoreUrl: 'https://apps.apple.com/app/phantom-crypto-wallet/id1598432977',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.phantom.app',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/phantom',
        supportsWcV2: true,
        chains: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', 'eip155:1', 'eip155:137'],
        rdns: 'app.phantom',
    },
    {
        id: 'solflare',
        name: 'Solflare',
        homepage: 'https://solflare.com',
        deepLink: 'solflare://',
        universalLink: 'https://solflare.com',
        appStoreUrl: 'https://apps.apple.com/app/solflare-wallet/id1580908064',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.solflare.wallet',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/solflare',
        supportsWcV2: true,
        chains: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        rdns: 'com.solflare',
    },
    {
        id: 'backpack',
        name: 'Backpack',
        homepage: 'https://backpack.app',
        deepLink: 'backpack://',
        universalLink: 'https://backpack.app',
        appStoreUrl: 'https://apps.apple.com/app/backpack/id6445964121',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=app.backpack.mobile',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/backpack',
        supportsWcV2: true,
        chains: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', 'eip155:1'],
        rdns: 'app.backpack',
    },
    {
        id: 'exodus',
        name: 'Exodus',
        homepage: 'https://www.exodus.com',
        deepLink: 'exodus://',
        universalLink: 'https://www.exodus.com',
        appStoreUrl: 'https://apps.apple.com/app/exodus-crypto-wallet/id1277214541',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=exodusmovement.exodus',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/exodus',
        supportsWcV2: true,
        chains: ['eip155:1', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        rdns: 'com.exodus',
    },
    {
        id: 'walletconnect',
        name: 'WalletConnect',
        homepage: 'https://walletconnect.com',
        deepLink: 'wc://',
        universalLink: 'https://walletconnect.com',
        imageUrl: 'https://registry.walletconnect.com/api/v2/logo/md/walletconnect',
        supportsWcV2: true,
        chains: ['eip155:1', 'eip155:137', 'eip155:42161'],
    },
];
// ============================================================
// Lookup helpers
// ============================================================
/**
 * Get a wallet entry by ID.
 */
export function getWalletById(id) {
    return WALLET_REGISTRY.find((w) => w.id === id);
}
/**
 * Get all wallet IDs.
 */
export function getWalletIds() {
    return WALLET_REGISTRY.map((w) => w.id);
}
/**
 * Search wallets by name (case-insensitive substring match).
 */
export function searchWallets(query) {
    const q = query.toLowerCase();
    return WALLET_REGISTRY.filter((w) => w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q));
}
/**
 * Build a deep link URL for a wallet with a WC v2 URI.
 */
export function buildWalletDeepLink(walletId, wcUri) {
    const wallet = getWalletById(walletId);
    if (!wallet || !wallet.deepLink)
        return undefined;
    return `${wallet.deepLink}wc?uri=${encodeURIComponent(wcUri)}`;
}
/**
 * Build a universal link URL for a wallet with a WC v2 URI.
 */
export function buildWalletUniversalLink(walletId, wcUri) {
    const wallet = getWalletById(walletId);
    if (!wallet || !wallet.universalLink)
        return undefined;
    return `${wallet.universalLink}/wc?uri=${encodeURIComponent(wcUri)}`;
}
/**
 * Get wallets that support a specific chain.
 */
export function getWalletsForChain(chain) {
    return WALLET_REGISTRY.filter((w) => w.chains?.includes(chain) ?? false);
}
/**
 * Get wallets that support WalletConnect v2.
 */
export function getWcV2Wallets() {
    return WALLET_REGISTRY.filter((w) => w.supportsWcV2);
}
/**
 * Get the recommended wallet order for display.
 * Returns wallets sorted by: supports WC v2 first, then by chain support breadth.
 */
export function getRecommendedWalletOrder() {
    return [...WALLET_REGISTRY]
        .filter((w) => w.supportsWcV2)
        .sort((a, b) => (b.chains?.length ?? 0) - (a.chains?.length ?? 0));
}
//# sourceMappingURL=wallets.js.map