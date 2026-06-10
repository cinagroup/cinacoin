/**
 * MetaMask adapter utilities.
 */

import type { MetaMaskProvider, EIP6963ProviderDetail } from './types.js';

declare global {
  interface Window {
    ethereum?: MetaMaskProvider & {
      providers?: MetaMaskProvider[];
    };
  }
}

/**
 * Detect MetaMask provider via EIP-6963 or window.ethereum.
 */
export async function detectMetaMask(useEIP6963 = true): Promise<MetaMaskProvider | null> {
  if (typeof window === 'undefined') return null;

  if (useEIP6963) {
    return new Promise<MetaMaskProvider | null>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(detectLegacy());
      }, 1000);

      const handler = (event: Event) => {
        const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
        if (detail.info.rdns === 'io.metamask' || detail.info.name.toLowerCase().includes('metamask')) {
          clearTimeout(timeout);
          window.removeEventListener('eip6963:announceProvider', handler);
          resolve(detail.provider as MetaMaskProvider);
        }
      };

      window.addEventListener('eip6963:announceProvider', handler);
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    });
  }

  return detectLegacy();
}

function detectLegacy(): MetaMaskProvider | null {
  if (typeof window === 'undefined') return null;

  const eth = window.ethereum;
  if (!eth) return null;

  // If multiple providers, find MetaMask
  if (eth.providers?.length) {
    return eth.providers.find(p => p.isMetaMask) || (eth.isMetaMask ? eth : null);
  }

  return eth.isMetaMask ? eth : null;
}

/**
 * Check if MetaMask is installed.
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.ethereum?.isMetaMask;
}

/**
 * Get MetaMask installation link for the current platform.
 */
export function getMetaMaskInstallLink(): string {
  if (typeof navigator === 'undefined') return 'https://metamask.io/download/';

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('firefox')) return 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/';
  if (ua.includes('edg/')) return 'https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm';
  if (ua.includes('opera') || ua.includes('opr/')) return 'https://addons.opera.com/en/extensions/details/metamask-10/';
  return 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';
}

/**
 * Format chain ID for MetaMask (hex string).
 */
export function toHexChainId(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

/**
 * Parse chain ID from MetaMask hex format.
 */
export function fromHexChainId(hex: string): number {
  return parseInt(hex, 16);
}
