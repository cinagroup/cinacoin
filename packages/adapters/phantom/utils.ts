/**
 * Phantom adapter utilities.
 */

import type { PhantomSolanaProvider, PhantomEthereumProvider } from './types.js';

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomSolanaProvider;
      ethereum?: PhantomEthereumProvider;
    };
    solana?: PhantomSolanaProvider;
  }
}

/**
 * Detect Phantom Solana provider.
 */
export function detectPhantomSolana(): PhantomSolanaProvider | null {
  if (typeof window === 'undefined') return null;

  // Phantom-specific namespace
  if (window.phantom?.solana?.isPhantom) {
    return window.phantom.solana;
  }

  // Fallback to window.solana
  if (window.solana?.isPhantom) {
    return window.solana;
  }

  return null;
}

/**
 * Detect Phantom Ethereum provider.
 */
export function detectPhantomEthereum(): PhantomEthereumProvider | null {
  if (typeof window === 'undefined') return null;

  if (window.phantom?.ethereum?.isPhantom) {
    return window.phantom.ethereum;
  }

  return null;
}

/**
 * Check if Phantom is installed.
 */
export function isPhantomInstalled(): boolean {
  return !!(detectPhantomSolana() || detectPhantomEthereum());
}

/**
 * Get Phantom installation link.
 */
export function getPhantomInstallLink(): string {
  if (typeof navigator === 'undefined') return 'https://phantom.app/';

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    if (ua.includes('android')) return 'https://play.google.com/store/apps/details?id=app.phantom';
    return 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977';
  }

  return 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjakhhpkkkedlg';
}

/**
 * Encode a message for Solana signing.
 */
export function encodeSolanaMessage(message: string): Uint8Array {
  return new TextEncoder().encode(message);
}

/**
 * Decode a Solana signature to hex string.
 */
export function solanaSignatureToHex(signature: Uint8Array): string {
  return '0x' + Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get Solana network URL.
 */
export function getSolanaNetworkUrl(network: string): string {
  switch (network) {
    case 'mainnet-beta':
      return 'https://api.mainnet-beta.solana.com';
    case 'devnet':
      return 'https://api.devnet.solana.com';
    case 'testnet':
      return 'https://api.testnet.solana.com';
    default:
      return 'https://api.mainnet-beta.solana.com';
  }
}
