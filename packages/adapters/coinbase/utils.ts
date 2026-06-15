/**
 * Coinbase Wallet adapter utilities.
 */

import type { CoinbaseWalletProvider } from './types.js';
import { toHexChainId, fromHexChainId } from '@cinacoin/core-sdk/utils/chain';

// L-005: Re-export shared utilities for backward compatibility
export { toHexChainId, fromHexChainId };

declare global {
  interface Window {
    coinbaseWalletExtension?: CoinbaseWalletProvider;
    ethereum?: CoinbaseWalletProvider & {
      isCoinbaseWallet?: boolean;
      providers?: CoinbaseWalletProvider[];
    };
  }
}

/**
 * Detect Coinbase Wallet provider.
 */
export function detectCoinbaseWallet(): CoinbaseWalletProvider | null {
  if (typeof window === 'undefined') return null;

  // Direct extension
  if (window.coinbaseWalletExtension) {
    return window.coinbaseWalletExtension;
  }

  // Via window.ethereum
  const eth = window.ethereum;
  if (!eth) return null;

  // Multiple providers
  if (eth.providers?.length) {
    const cb = eth.providers.find(p => p.isCoinbaseWallet);
    if (cb) return cb;
  }

  if (eth.isCoinbaseWallet) return eth;

  return null;
}

/**
 * Check if Coinbase Wallet is installed.
 */
export function isCoinbaseWalletInstalled(): boolean {
  return !!detectCoinbaseWallet();
}

/**
 * Get Coinbase Wallet installation link.
 */
export function getCoinbaseWalletInstallLink(): string {
  if (typeof navigator === 'undefined') return 'https://www.coinbase.com/wallet';

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    if (ua.includes('android')) return 'https://play.google.com/store/apps/details?id=org.toshi';
    return 'https://apps.apple.com/app/coinbase-wallet/id1278383455';
  }

  return 'https://chrome.google.com/webstore/detail/coinbase-wallet-extension/hnfanknocfeofbddgcijnmhnfnkdnaad';
}

// L-005: toHexChainId and fromHexChainId are now imported from @cinacoin/core-sdk/utils/chain
// and re-exported above for backward compatibility
