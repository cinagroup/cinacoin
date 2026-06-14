/**
 * Cinacoin adapter utilities.
 */

import type { CinacoinConfig, CinacoinProvider, CinacoinSession } from './types.js';

/**
 * Default Cinacoin relay URL.
 */
export const DEFAULT_RELAY_URL = 'wss://relay.walletconnect.com';

/**
 * Default required methods for EVM chains.
 */
export const DEFAULT_EVM_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_sendRawTransaction',
];

/**
 * Default required events for EVM chains.
 */
export const DEFAULT_EVM_EVENTS = [
  'chainChanged',
  'accountsChanged',
  'message',
  'disconnect',
];

/**
 * Build required namespaces for Cinacoin session.
 */
export function buildRequiredNamespaces(config: CinacoinConfig): Record<string, {
  chains: string[];
  methods: string[];
  events: string[];
}> {
  const chains = config.requiredChains || ['eip155:1'];
  const methods = config.requiredMethods || DEFAULT_EVM_METHODS;
  const events = config.requiredEvents || DEFAULT_EVM_EVENTS;

  // Group chains by namespace
  const namespaces: Record<string, string[]> = {};
  for (const chain of chains) {
    const [namespace] = chain.split(':');
    if (!namespaces[namespace]) namespaces[namespace] = [];
    namespaces[namespace].push(chain);
  }

  const result: Record<string, { chains: string[]; methods: string[]; events: string[] }> = {};
  for (const [namespace, nsChains] of Object.entries(namespaces)) {
    result[namespace] = {
      chains: nsChains,
      methods,
      events,
    };
  }

  return result;
}

/**
 * Parse accounts from Cinacoin session namespaces.
 */
export function parseSessionAccounts(session: CinacoinSession): string[] {
  const accounts: string[] = [];
  for (const namespace of Object.values(session.namespaces)) {
    for (const account of namespace.accounts) {
      // Account format: namespace:chainId:address
      const parts = account.split(':');
      if (parts.length >= 3) {
        accounts.push(parts[2]);
      }
    }
  }
  return accounts;
}

/**
 * Parse chain ID from Cinacoin session.
 */
export function parseSessionChainId(session: CinacoinSession): number {
  for (const namespace of Object.values(session.namespaces)) {
    if (namespace.chains && namespace.chains.length > 0) {
      const chainId = namespace.chains[0].split(':')[1];
      return parseInt(chainId, 10);
    }
    // Fallback: parse from first account
    if (namespace.accounts.length > 0) {
      const parts = namespace.accounts[0].split(':');
      if (parts.length >= 2) {
        return parseInt(parts[1], 10);
      }
    }
  }
  return 1; // Default to Ethereum
}

/**
 * Check if session is expired.
 */
export function isSessionExpired(session: CinacoinSession): boolean {
  return Date.now() >= session.expiry * 1000;
}

/**
 * Format session for display.
 */
export function formatSessionInfo(session: CinacoinSession): {
  peerName: string;
  peerUrl: string;
  peerIcons: string[];
  accounts: string[];
  chains: string[];
  expiry: Date;
} {
  const accounts = parseSessionAccounts(session);
  const chains: string[] = [];
  for (const namespace of Object.values(session.namespaces)) {
    if (namespace.chains) {
      chains.push(...namespace.chains);
    }
  }

  return {
    peerName: session.peer.metadata.name,
    peerUrl: session.peer.metadata.url,
    peerIcons: session.peer.metadata.icons,
    accounts,
    chains: [...new Set(chains)],
    expiry: new Date(session.expiry * 1000),
  };
}
