/**
 * EIP-6963 Multi-Injected Provider Discovery.
 *
 * Standardized way to discover multiple wallet extensions installed
 * in the same browser session.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */

import type { EventHandler } from './types';

/** EIP-6963 provider info. */
export interface EIP6963ProviderInfo {
  /** Reverse DNS identifier. */
  rdns: string;
  /** Wallet name. */
  name: string;
  /** Icon (data URI). */
  icon: string;
  /** Unique identifier. */
  uuid: string;
}

/** EIP-1193 compatible provider. */
export interface EIP1193Provider {
  /** Send a JSON-RPC request. */
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  /** Listen for events. */
  on(event: string, handler: EventHandler): void;
  /** Remove event listener. */
  removeListener(event: string, handler: EventHandler): void;
}

/** EIP-6963 provider detail (info + provider instance). */
export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

/** EIP-6963 announce event detail. */
interface EIP6963AnnounceEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

/**
 * Discover all EIP-6963 compatible wallet providers.
 *
 * Returns a promise that resolves with all discovered wallets
 * after a 300ms discovery window.
 *
 * @returns Promise resolving to array of discovered providers.
 */
export function discoverWallets(): Promise<EIP6963ProviderDetail[]> {
  return new Promise((resolve) => {
    const wallets: EIP6963ProviderDetail[] = [];
    const seen = new Set<string>();

    const handleAnnounce = (event: Event) => {
      const detail = (event as EIP6963AnnounceEvent).detail;
      if (detail && !seen.has(detail.info.rdns)) {
        seen.add(detail.info.rdns);
        wallets.push(detail);
      }
    };

    // Listen for wallet announcements
    window.addEventListener('eip6963:announceProvider', handleAnnounce);

    // Trigger discovery
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Resolve after 300ms discovery window
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounce);
      resolve(wallets);
    }, 300);
  });
}

/**
 * Watch for wallet provider changes.
 *
 * Useful for detecting wallet install/uninstall during a session.
 *
 * @param callback - Invoked each time a new provider is discovered.
 * @returns Unsubscribe function.
 */
export function watchWallets(
  callback: (detail: EIP6963ProviderDetail) => void,
): () => void {
  const handleAnnounce = (event: Event) => {
    const detail = (event as EIP6963AnnounceEvent).detail;
    if (detail) {
      callback(detail);
    }
  };

  window.addEventListener('eip6963:announceProvider', handleAnnounce);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  return () => {
    window.removeEventListener('eip6963:announceProvider', handleAnnounce);
  };
}

/**
 * Find a specific wallet by its RDNS identifier.
 *
 * @param rdns - Reverse DNS identifier to search for.
 * @returns The provider detail if found, undefined otherwise.
 */
export async function findWalletByRdns(
  rdns: string,
): Promise<EIP6963ProviderDetail | undefined> {
  const wallets = await discoverWallets();
  return wallets.find((w) => w.info.rdns === rdns);
}
