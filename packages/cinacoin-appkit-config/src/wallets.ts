/**
 * Cinacoin Recommended Wallets Configuration
 *
 * Defines the preferred wallet list for Cinacoin users.
 * These wallets are prioritized in the connection UI.
 */

/**
 * Wallet metadata
 */
export interface WalletMetadata {
  id: string;
  name: string;
  icon: string;
  rdns?: string;
  universalLink?: string;
  deepLink?: string;
}

/**
 * Recommended wallets for Cinacoin
 * Ordered by priority (most recommended first)
 */
export const RECOMMENDED_WALLETS: WalletMetadata[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x1?projectId=cinacoin',
    rdns: 'io.metamask',
    universalLink: 'https://metamask.app.link',
    deepLink: 'metamask://',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x1?projectId=cinacoin',
    rdns: 'me.rainbow',
    universalLink: 'https://rainbow.me',
    deepLink: 'rainbow://',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x1?projectId=cinacoin',
    rdns: 'com.trustwallet.app',
    universalLink: 'https://link.trustwallet.com',
    deepLink: 'trust://',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x1?projectId=cinacoin',
    rdns: 'org.toshi',
    universalLink: 'https://go.cb-w.com',
    deepLink: 'cbwallet://',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x1?projectId=cinacoin',
    rdns: 'app.phantom',
    universalLink: 'https://phantom.app/ul',
    deepLink: 'phantom://',
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x1?projectId=cinacoin',
    rdns: 'com.okex.wallet',
    universalLink: 'https://www.okx.com/download',
    deepLink: 'okex://',
  },
];

/**
 * Get recommended wallet IDs
 */
export function getRecommendedWalletIds(): string[] {
  return RECOMMENDED_WALLETS.map((w) => w.id);
}

/**
 * Get wallet metadata by ID
 */
export function getWalletMetadata(walletId: string): WalletMetadata | undefined {
  return RECOMMENDED_WALLETS.find((w) => w.id === walletId);
}

/**
 * Check if wallet is recommended
 */
export function isWalletRecommended(walletId: string): boolean {
  return RECOMMENDED_WALLETS.some((w) => w.id === walletId);
}
