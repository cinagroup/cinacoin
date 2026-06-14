/**
 * useWallets hook — manages wallet list, filtering, and recent wallets
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { WalletInfo, RecentWallet, WalletPlatform } from '../types';

// ============================================================================
// Default Featured Wallets
// ============================================================================

const DEFAULT_WALLETS: WalletInfo[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/01839d47-86dc-490a-b2dd-02e650226701?projectId=x',
    platforms: ['browser', 'mobile'],
    rdns: 'io.metamask',
    deepLink: 'metamask://',
    chromeUrl: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
    homepage: 'https://metamask.io',
    featured: true,
  },
  {
    id: 'walletconnect',
    name: 'Cinacoin',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/3c3e4620-9c65-48de-bb0d-76540d0a8a22?projectId=x',
    platforms: ['mobile', 'desktop'],
    rdns: 'com.walletconnect',
    deepLink: 'wc://',
    homepage: 'https://walletconnect.com',
    featured: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/a5ebc364-8f15-42e4-8eb7-e2ac33b89e71?projectId=x',
    platforms: ['browser', 'mobile'],
    rdns: 'com.coinbase.wallet',
    deepLink: 'cbwallet://',
    homepage: 'https://wallet.coinbase.com',
    featured: true,
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/952dc31d-6a16-4600-b3e8-40a9c39e5a14?projectId=x',
    platforms: ['browser', 'mobile'],
    rdns: 'app.phantom',
    deepLink: 'phantom://',
    homepage: 'https://phantom.app',
    featured: true,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/7a33d7f1-3d12-4c5c-b389-12e4a0cb1ad8?projectId=x',
    platforms: ['browser', 'mobile'],
    rdns: 'me.rainbow',
    deepLink: 'rainbow://',
    homepage: 'https://rainbow.me',
    featured: true,
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0528ee7e-16d1-4700-b2d8-9e8a8b1e8a1c?projectId=x',
    platforms: ['mobile'],
    rdns: 'com.trustwallet',
    deepLink: 'trust://',
    homepage: 'https://trustwallet.com',
    featured: true,
  },
  {
    id: 'ledger',
    name: 'Ledger',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/56362878-9ff6-458d-b3b5-4e343a7a1f3c?projectId=x',
    platforms: ['hardware', 'desktop'],
    rdns: 'com.ledger',
    homepage: 'https://ledger.com',
    featured: true,
  },
  {
    id: 'safe',
    name: 'Safe',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/1e0a9c36-2f14-5555-ae08-4fe87b5e2a30?projectId=x',
    platforms: ['browser', 'mobile'],
    rdns: 'safe',
    homepage: 'https://safe.global',
    featured: true,
  },
];

const STORAGE_KEY = 'cinacoin-appkit-recent-wallets';
const MAX_RECENT = 4;

/**
 * Load recent wallets from localStorage
 */
function loadRecentWallets(): RecentWallet[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save recent wallets to localStorage
 */
function saveRecentWallets(wallets: RecentWallet[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseWalletsOptions {
  /** Custom wallet list (overrides defaults) */
  wallets?: WalletInfo[];
  /** Filter by platform */
  platformFilter?: WalletPlatform;
}

export interface UseWalletsReturn {
  /** All available wallets */
  wallets: WalletInfo[];
  /** Featured wallets */
  featuredWallets: WalletInfo[];
  /** Filtered wallets based on search */
  filteredWallets: WalletInfo[];
  /** Recently used wallets */
  recentWallets: RecentWallet[];
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Mark a wallet as recently used */
  markRecent: (walletId: string, address?: string) => void;
  /** Clear recent wallets */
  clearRecent: () => void;
  /** Detect installed wallets (browser extensions) */
  detectInstalled: () => Set<string>;
}

/**
 * Hook for managing wallet list, search, and recent wallets
 */
export function useWallets(options: UseWalletsOptions = {}): UseWalletsReturn {
  const { wallets: customWallets, platformFilter } = options;
  const [searchQuery, setSearchQuery] = useState('');
  const [recentWallets, setRecentWallets] = useState<RecentWallet[]>(loadRecentWallets);

  // Use custom wallets or defaults
  const allWallets = useMemo(() => {
    let wallets = customWallets ?? DEFAULT_WALLETS;
    if (platformFilter) {
      wallets = wallets.filter(w => w.platforms.includes(platformFilter));
    }
    return wallets;
  }, [customWallets, platformFilter]);

  // Featured wallets
  const featuredWallets = useMemo(
    () => allWallets.filter(w => w.featured),
    [allWallets],
  );

  // Filtered wallets based on search
  const filteredWallets = useMemo(() => {
    if (!searchQuery.trim()) return allWallets;
    const query = searchQuery.toLowerCase();
    return allWallets.filter(
      w =>
        w.name.toLowerCase().includes(query) ||
        w.id.toLowerCase().includes(query),
    );
  }, [allWallets, searchQuery]);

  // Mark a wallet as recently used
  const markRecent = useCallback((walletId: string, address?: string) => {
    setRecentWallets(prev => {
      const filtered = prev.filter(r => r.id !== walletId);
      const updated: RecentWallet[] = [
        { id: walletId, lastUsed: Date.now(), address },
        ...filtered,
      ].slice(0, MAX_RECENT);
      saveRecentWallets(updated);
      return updated;
    });
  }, []);

  // Clear recent wallets
  const clearRecent = useCallback(() => {
    setRecentWallets([]);
    saveRecentWallets([]);
  }, []);

  // Detect installed browser extension wallets
  const detectInstalled = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    const installed = new Set<string>();
    const ethereum = (window as Record<string, unknown>).ethereum as Record<string, unknown> | undefined;

    if (ethereum) {
      if (ethereum.isMetaMask) installed.add('metamask');
      if (ethereum.isCoinbaseWallet) installed.add('coinbase');
      if (ethereum.isTrust) installed.add('trust');
    }

    if ((window as Record<string, unknown>).phantom?.ethereum) {
      installed.add('phantom');
    }

    return installed;
  }, []);

  // Sync recent wallets to storage on change
  useEffect(() => {
    saveRecentWallets(recentWallets);
  }, [recentWallets]);

  return {
    wallets: allWallets,
    featuredWallets,
    filteredWallets,
    recentWallets,
    searchQuery,
    setSearchQuery,
    markRecent,
    clearRecent,
    detectInstalled,
  };
}
