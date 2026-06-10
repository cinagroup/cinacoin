/**
 * Chain utility functions.
 *
 * Provides helpers for chain ID conversion, name resolution,
 * and rendering utilities for multi-chain support.
 *
 * @example
 * ```ts
 * import { getChainName, formatChainId, isEVMChain } from '@cinacoin/core-sdk/utils/chain';
 *
 * const name = getChainName(1);        // 'Ethereum'
 * const caip = formatChainId(1);        // 'eip155:1'
 * const isEvm = isEVMChain('eip155:1'); // true
 * ```
 */

import type { Chain, ChainNamespace } from '../types.js';

// ============================================================================
// Chain ID Utilities
// ============================================================================

/**
 * Convert a numeric chain ID to CAIP-2 format.
 *
 * @param chainId - Numeric chain ID (e.g., 1, 137)
 * @param namespace - Chain namespace (default: 'eip155')
 * @returns CAIP-2 chain ID string (e.g., 'eip155:1')
 */
export function formatChainId(chainId: number, namespace: ChainNamespace = 'eip155'): string {
  return `${namespace}:${chainId}`;
}

/**
 * Parse a CAIP-2 chain ID into namespace and reference.
 *
 * @param caipId - CAIP-2 chain ID (e.g., 'eip155:1')
 * @returns Object with namespace and reference
 */
export function parseChainId(caipId: string): { namespace: ChainNamespace; reference: string } {
  const [namespace, reference] = caipId.split(':');
  return {
    namespace: namespace as ChainNamespace,
    reference: reference || '',
  };
}

/**
 * Extract numeric chain ID from CAIP-2 format or plain number.
 *
 * @param chainId - CAIP-2 string or numeric chain ID
 * @returns Numeric chain ID
 */
export function toNumericChainId(chainId: string | number): number {
  if (typeof chainId === 'number') return chainId;
  const parts = chainId.split(':');
  return parseInt(parts[parts.length - 1], 10);
}

// ============================================================================
// Chain Name Resolution
// ============================================================================

/** Well-known chain names */
const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  5: 'Goerli',
  10: 'Optimism',
  56: 'BNB Chain',
  100: 'Gnosis',
  137: 'Polygon',
  250: 'Fantom',
  324: 'zkSync Era',
  1101: 'Polygon zkEVM',
  534352: 'Scroll',
  42161: 'Arbitrum One',
  42170: 'Arbitrum Nova',
  43114: 'Avalanche',
  59144: 'Linea',
  7777777: 'Base',
  8453: 'Base',
  42220: 'Celo',
  11155111: 'Sepolia',
  // Solana
  101: 'Solana Mainnet',
  102: 'Solana Testnet',
  103: 'Solana Devnet',
  // Bitcoin
  0: 'Bitcoin Mainnet',
  11155112: 'Bitcoin Testnet',
};

/**
 * Get human-readable chain name from chain ID.
 *
 * @param chainId - Numeric or CAIP-2 chain ID
 * @returns Chain name string
 */
export function getChainName(chainId: number | string): string {
  const numeric = toNumericChainId(chainId);
  return CHAIN_NAMES[numeric] || `Chain ${numeric}`;
}

/**
 * Get native currency symbol for a chain.
 *
 * @param chainId - Numeric or CAIP-2 chain ID
 * @returns Currency symbol (ETH, MATIC, SOL, BTC, etc.)
 */
export function getNativeCurrency(chainId: number | string): { symbol: string; decimals: number } {
  const numeric = toNumericChainId(chainId);
  const namespace = typeof chainId === 'string' ? chainId.split(':')[0] : 'eip155';

  if (namespace === 'solana') {
    return { symbol: 'SOL', decimals: 9 };
  }
  if (namespace === 'bip122') {
    return { symbol: 'BTC', decimals: 8 };
  }

  // EVM chains
  const currencies: Record<number, { symbol: string; decimals: number }> = {
    1: { symbol: 'ETH', decimals: 18 },
    5: { symbol: 'ETH', decimals: 18 },
    10: { symbol: 'ETH', decimals: 18 },
    56: { symbol: 'BNB', decimals: 18 },
    100: { symbol: 'xDAI', decimals: 18 },
    137: { symbol: 'MATIC', decimals: 18 },
    250: { symbol: 'FTM', decimals: 18 },
    324: { symbol: 'ETH', decimals: 18 },
    42161: { symbol: 'ETH', decimals: 18 },
    42170: { symbol: 'ETH', decimals: 18 },
    43114: { symbol: 'AVAX', decimals: 18 },
    8453: { symbol: 'ETH', decimals: 18 },
    42220: { symbol: 'CELO', decimals: 18 },
    11155111: { symbol: 'ETH', decimals: 18 },
  };

  return currencies[numeric] || { symbol: 'ETH', decimals: 18 };
}

// ============================================================================
// Chain Type Detection
// ============================================================================

/**
 * Check if a chain ID belongs to an EVM chain.
 */
export function isEVMChain(chainId: string | number): boolean {
  if (typeof chainId === 'string') {
    return chainId.startsWith('eip155:');
  }
  return true; // numeric IDs are assumed EVM
}

/**
 * Check if a chain ID belongs to Solana.
 */
export function isSolanaChain(chainId: string): boolean {
  return chainId.startsWith('solana:');
}

/**
 * Check if a chain ID belongs to Bitcoin.
 */
export function isBitcoinChain(chainId: string): boolean {
  return chainId.startsWith('bip122:');
}

/**
 * Get the namespace for a chain ID.
 */
export function getChainNamespace(chainId: string | number): ChainNamespace {
  if (typeof chainId === 'string' && chainId.includes(':')) {
    return chainId.split(':')[0] as ChainNamespace;
  }
  return 'eip155';
}

// ============================================================================
// Rendering Utilities
// ============================================================================

/**
 * Get chain icon URL or emoji for display.
 *
 * @param chainId - Numeric or CAIP-2 chain ID
 * @returns Emoji or icon URL
 */
export function getChainIcon(chainId: number | string): string {
  const numeric = toNumericChainId(chainId);
  const icons: Record<number, string> = {
    1: '💎',
    10: '🔴',
    56: '🟡',
    100: '🟢',
    137: '🟣',
    250: '🔵',
    324: '⚡',
    42161: '🔷',
    43114: '🔺',
    8453: '🔵',
    42220: '🟩',
  };
  return icons[numeric] || '⛓️';
}

/**
 * Get block explorer URL for a transaction or address.
 *
 * @param chainId - Chain ID
 * @param type - 'tx' or 'address'
 * @param value - Transaction hash or address
 * @returns Explorer URL or null
 */
export function getExplorerUrl(
  chainId: number | string,
  type: 'tx' | 'address',
  value: string,
): string | null {
  const numeric = toNumericChainId(chainId);
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    10: 'https://optimistic.etherscan.io',
    56: 'https://bscscan.com',
    100: 'https://gnosisscan.io',
    137: 'https://polygonscan.com',
    250: 'https://ftmscan.com',
    324: 'https://explorer.zksync.io',
    42161: 'https://arbiscan.io',
    43114: 'https://snowtrace.io',
    8453: 'https://basescan.org',
    11155111: 'https://sepolia.etherscan.io',
  };

  const base = explorers[numeric];
  if (!base) return null;

  return `${base}/${type}/${value}`;
}

/**
 * Format a chain for display in a dropdown or list.
 *
 * @param chain - Chain object
 * @returns Formatted display string
 */
export function formatChainDisplay(chain: Chain): string {
  const icon = getChainIcon(chain.id);
  const name = chain.name || getChainName(chain.id);
  return `${icon} ${name}`;
}

/**
 * Sort chains by priority (mainnets first, then testnets).
 */
export function sortChains(chains: Chain[]): Chain[] {
  const TESTNET_IDS = new Set([5, 11155111, 102, 103, 11155112]);

  return [...chains].sort((a, b) => {
    const aNum = toNumericChainId(a.id);
    const bNum = toNumericChainId(b.id);
    const aTest = TESTNET_IDS.has(aNum);
    const bTest = TESTNET_IDS.has(bNum);

    if (aTest !== bTest) return aTest ? 1 : -1;
    return aNum - bNum;
  });
}

/**
 * Filter chains by namespace.
 */
export function filterChainsByNamespace(chains: Chain[], namespace: ChainNamespace): Chain[] {
  return chains.filter(c => getChainNamespace(c.id) === namespace);
}

/**
 * Validate that a chain ID is supported.
 */
export function isChainSupported(chainId: string | number, supportedChains: Chain[]): boolean {
  const numeric = toNumericChainId(chainId);
  return supportedChains.some(c => toNumericChainId(c.id) === numeric);
}
