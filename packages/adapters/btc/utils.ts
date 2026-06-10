/**
 * Bitcoin adapter utilities.
 */

import type { BitcoinProvider, BitcoinAccount } from './types.js';

declare global {
  interface Window {
    /** Leather wallet (formerly Hiro) */
    LeatherProvider?: BitcoinProvider;
    /** Xverse wallet */
    XverseProviders?: {
      BitcoinProvider?: BitcoinProvider;
    };
    /** UniSat wallet */
    unisat?: BitcoinProvider & {
      getPublicKey: () => Promise<string>;
      getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
      getInscriptions: (cursor: number, size: number) => Promise<{ list: unknown[]; total: number }>;
      switchNetwork: (network: string) => Promise<void>;
    };
    /** OKX wallet */
    okxwallet?: {
      bitcoin?: BitcoinProvider & {
        connect: () => Promise<{ address: string; publicKey: string }>;
        getPublicKey: () => Promise<string>;
      };
    };
  }
}

/**
 * Detect available Bitcoin wallet provider.
 */
export function detectBitcoinWallet(preferred?: string): { provider: BitcoinProvider; name: string } | null {
  if (typeof window === 'undefined') return null;

  // Try preferred wallet first
  if (preferred) {
    const result = tryDetectWallet(preferred);
    if (result) return result;
  }

  // Try all wallets in order
  const wallets = ['leather', 'xverse', 'unisat', 'okx'];
  for (const wallet of wallets) {
    const result = tryDetectWallet(wallet);
    if (result) return result;
  }

  return null;
}

function tryDetectWallet(name: string): { provider: BitcoinProvider; name: string } | null {
  if (typeof window === 'undefined') return null;

  switch (name) {
    case 'leather':
      if (window.LeatherProvider) {
        return { provider: window.LeatherProvider, name: 'Leather' };
      }
      break;
    case 'xverse':
      if (window.XverseProviders?.BitcoinProvider) {
        return { provider: window.XverseProviders.BitcoinProvider, name: 'Xverse' };
      }
      break;
    case 'unisat':
      if (window.unisat) {
        return { provider: window.unisat, name: 'Unisat' };
      }
      break;
    case 'okx':
      if (window.okxwallet?.bitcoin) {
        return { provider: window.okxwallet.bitcoin, name: 'OKX' };
      }
      break;
  }
  return null;
}

/**
 * Check if any Bitcoin wallet is installed.
 */
export function isBitcoinWalletInstalled(): boolean {
  return !!detectBitcoinWallet();
}

/**
 * Get installation links for Bitcoin wallets.
 */
export function getBitcoinWalletInstallLinks(): Record<string, string> {
  return {
    leather: 'https://leather.io/install-extension',
    xverse: 'https://www.xverse.app/download',
    unisat: 'https://unisat.io/download',
    okx: 'https://www.okx.com/web3',
  };
}

/**
 * Validate a Bitcoin address.
 */
export function isValidBitcoinAddress(address: string): boolean {
  // P2PKH (legacy)
  if (/^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
  // P2SH (nested segwit)
  if (/^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
  // Bech32 (native segwit)
  if (/^(bc1|tb1)[a-z0-9]{25,90}$/.test(address.toLowerCase())) return true;
  // Taproot
  if (/^(bc1p|tb1p)[a-z0-9]{58}$/.test(address.toLowerCase())) return true;

  return false;
}

/**
 * Get address type from address string.
 */
export function getAddressType(address: string): string {
  if (address.startsWith('1')) return 'p2pkh';
  if (address.startsWith('3')) return 'p2sh';
  if (address.toLowerCase().startsWith('bc1q') || address.toLowerCase().startsWith('tb1q')) return 'p2wpkh';
  if (address.toLowerCase().startsWith('bc1p') || address.toLowerCase().startsWith('tb1p')) return 'p2tr';
  return 'unknown';
}

/**
 * Format satoshis to BTC string.
 */
export function formatBTC(satoshis: number): string {
  return (satoshis / 1e8).toFixed(8);
}

/**
 * Parse BTC amount to satoshis.
 */
export function parseBTCAmount(btc: string): number {
  return Math.round(parseFloat(btc) * 1e8);
}

/**
 * Get network name for Bitcoin provider.
 */
export function getNetworkName(network: string): string {
  switch (network) {
    case 'mainnet': return 'livenet';
    case 'testnet': return 'testnet';
    case 'signet': return 'signet';
    default: return 'livenet';
  }
}
