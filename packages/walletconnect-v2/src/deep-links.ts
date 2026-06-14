/**
 * Deep Link Utilities — Wallet connection via deep links.
 *
 * Provides tools for generating wallet-specific deep links,
 * detecting installed wallets, and building universal links
 * that fall back to app stores.
 *
 * @packageDocumentation
 */

import { WALLET_REGISTRY, getWalletById } from './wallets.js';
import type { WalletRegistryEntry } from './types.js';

// ============================================================
// Types
// ============================================================

/** Wallet deep link interface. */
export interface WalletDeepLink {
  /** Wallet ID. */
  id: string;
  /** Wallet display name. */
  name: string;
  /** Wallet icon URL. */
  icon: string;
  /** Generate deep link for a WC URI. */
  buildLink(wcUri: string): string;
  /** Whether this wallet is installed (browser detection). */
  isInstalled(): boolean;
}

// ============================================================
// Deep Link Builder
// ============================================================

/**
 * Build deep links for a WC URI across known wallets.
 *
 * @param wcUri - The WC v2 URI to encode in deep links.
 * @returns Array of WalletDeepLink objects for all known wallets.
 *
 * @example
 * ```ts
 * const links = buildWalletDeepLinks('wc:abc123@2?relay-protocol=irn&symKey=xyz');
 * links.forEach(link => {
 *   console.log(`${link.name}: ${link.buildLink(wcUri)}`);
 * });
 * ```
 */
export function buildWalletDeepLinks(wcUri: string): WalletDeepLink[] {
  return WALLET_REGISTRY.map((wallet) => createWalletDeepLink(wallet, wcUri));
}

/**
 * Build a universal link that opens in the wallet's app or falls back to app store.
 *
 * @param wcUri - The WC v2 URI to encode.
 * @param walletId - The wallet ID to build the link for.
 * @returns Universal link URL, or undefined if wallet not found.
 *
 * @example
 * ```ts
 * const link = buildUniversalLink('wc:abc123@2?symKey=xyz', 'metamask');
 * // Returns: https://metamask.app.link/wc?uri=...
 * ```
 */
export function buildUniversalLink(wcUri: string, walletId: string): string | undefined {
  const wallet = getWalletById(walletId);
  if (!wallet || !wallet.universalLink) {
    return undefined;
  }
  
  // Universal links typically use the format: universalLink/wc?uri=encodedUri
  return `${wallet.universalLink}/wc?uri=${encodeURIComponent(wcUri)}`;
}

/**
 * Detect installed wallets (browser environment only).
 *
 * Uses protocol detection to check if wallet apps are installed.
 * Returns an array of wallet IDs that appear to be installed.
 *
 * @returns Array of wallet IDs that are detected as installed.
 *
 * @example
 * ```ts
 * const installed = detectInstalledWallets();
 * console.log(installed); // ['metamask', 'rainbow']
 * ```
 */
export function detectInstalledWallets(): string[] {
  // Browser environment check
  if (typeof window === 'undefined') {
    return [];
  }
  
  const installed: string[] = [];
  
  // Check for common wallet providers via browser APIs
  // MetaMask
  if ((window as any).ethereum?.isMetaMask) {
    installed.push('metamask');
  }
  
  // Coinbase Wallet
  if ((window as any).ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension) {
    installed.push('coinbase');
  }
  
  // Trust Wallet
  if ((window as any).trustwallet) {
    installed.push('trust');
  }
  
  // Phantom
  if ((window as any).phantom?.solana?.isPhantom) {
    installed.push('phantom');
  }
  
  // Rabby
  if ((window as any).ethereum?.isRabby) {
    installed.push('rabby');
  }
  
  // OKX Wallet
  if ((window as any).okxwallet) {
    installed.push('okx');
  }
  
  // Bitget Wallet
  if ((window as any).bitkeep?.ethereum || (window as any).bitkeep) {
    installed.push('bitget');
  }
  
  // TokenPocket
  if ((window as any).ethereum?.isTokenPocket) {
    installed.push('tokenpocket');
  }
  
  // imToken
  if ((window as any).ethereum?.isImToken) {
    installed.push('imtoken');
  }
  
  return installed;
}

// ============================================================
// Internal Helpers
// ============================================================

/**
 * Create a WalletDeepLink object for a specific wallet.
 */
function createWalletDeepLink(wallet: WalletRegistryEntry, wcUri: string): WalletDeepLink {
  return {
    id: wallet.id,
    name: wallet.name,
    icon: wallet.imageUrl,
    
    buildLink(uri: string): string {
      if (!wallet.deepLink) {
        // Fall back to universal link if no deep link scheme
        if (wallet.universalLink) {
          return `${wallet.universalLink}/wc?uri=${encodeURIComponent(uri)}`;
        }
        return uri; // Return raw URI as last resort
      }
      
      // Deep link format: scheme://wc?uri=encodedUri
      return `${wallet.deepLink}wc?uri=${encodeURIComponent(uri)}`;
    },
    
    isInstalled(): boolean {
      // Browser environment check
      if (typeof window === 'undefined') {
        return false;
      }
      
      // Check via browser APIs (same logic as detectInstalledWallets)
      const installed = detectInstalledWallets();
      return installed.includes(wallet.id);
    },
  };
}
