/**
 * Coinbase Wallet adapter utilities.
 */

import type { CoinbaseWalletProvider } from './types.js';

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

/**
 * Convert chain ID to hex string for Coinbase Wallet.
 */
export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

/**
 * Parse hex chain ID to number.
 */
export function fromHexChainId(hex: string): number {
  return parseInt(hex, 16);
}
