/**
 * Cinacoin Supported Chains Configuration
 *
 * Defines all blockchain networks supported by Cinacoin.
 * Uses Reown AppKit chain definitions.
 */

import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  type Chain,
} from '@reown/appkit/networks';

/**
 * Re-export commonly used chains from Reown
 */
export { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche };

/**
 * All EVM chains supported by Cinacoin
 */
export const EVM_CHAINS: Chain[] = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

/**
 * Chain metadata for display
 */
export interface ChainMetadata {
  id: string;
  name: string;
  icon: string;
  isTestnet?: boolean;
}

/**
 * Chain display metadata
 */
export const CHAIN_METADATA: Record<string, ChainMetadata> = {
  'eip155:1': {
    id: 'eip155:1',
    name: 'Ethereum',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x1?projectId=cinacoin',
  },
  'eip155:137': {
    id: 'eip155:137',
    name: 'Polygon',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x89?projectId=cinacoin',
  },
  'eip155:42161': {
    id: 'eip155:42161',
    name: 'Arbitrum',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0xa4b1?projectId=cinacoin',
  },
  'eip155:10': {
    id: 'eip155:10',
    name: 'Optimism',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0xa?projectId=cinacoin',
  },
  'eip155:8453': {
    id: 'eip155:8453',
    name: 'Base',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x2105?projectId=cinacoin',
  },
  'eip155:56': {
    id: 'eip155:56',
    name: 'BNB Chain',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0x38?projectId=cinacoin',
  },
  'eip155:43114': {
    id: 'eip155:43114',
    name: 'Avalanche',
    icon: 'https://explorer-api.walletconnect.com/v3/logo/lg/0xa86a?projectId=cinacoin',
  },
};

/**
 * Default chain for Cinacoin
 */
export const DEFAULT_CHAIN = mainnet;

/**
 * Get chain metadata by CAIP-2 ID
 */
export function getChainMetadata(chainId: string): ChainMetadata | undefined {
  return CHAIN_METADATA[chainId];
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): string[] {
  return Object.keys(CHAIN_METADATA);
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: string): boolean {
  return chainId in CHAIN_METADATA;
}
