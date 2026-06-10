/**
 * Multi-chain registry with preset chain configurations.
 *
 * Pre-configured chains for EVM, Solana, and Bitcoin networks.
 * Import and use directly in your CoinProvider setup.
 *
 * @example
 * ```ts
 * import { mainnet, polygon, solanaMainnet, bitcoinMainnet } from '@cinacoin/core-sdk/chains';
 *
 * <CoinProvider chains={[mainnet, polygon, solanaMainnet, bitcoinMainnet]}>
 *   <App />
 * </CoinProvider>
 * ```
 */

import type { Chain } from './types.js';

// ============================================================================
// EVM Chains
// ============================================================================

export const mainnet: Chain = {
  id: 'eip155:1',
  name: 'Ethereum',
  rpcUrl: 'https://eth.llamarpc.com',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://etherscan.io',
  iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
};

export const goerli: Chain = {
  id: 'eip155:5',
  name: 'Goerli',
  rpcUrl: 'https://rpc.ankr.com/eth_goerli',
  nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://goerli.etherscan.io',
};

export const sepolia: Chain = {
  id: 'eip155:11155111',
  name: 'Sepolia',
  rpcUrl: 'https://rpc.sepolia.org',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://sepolia.etherscan.io',
};

export const polygon: Chain = {
  id: 'eip155:137',
  name: 'Polygon',
  rpcUrl: 'https://polygon-rpc.com',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  explorerUrl: 'https://polygonscan.com',
  iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
};

export const arbitrum: Chain = {
  id: 'eip155:42161',
  name: 'Arbitrum One',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://arbiscan.io',
  iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
};

export const optimism: Chain = {
  id: 'eip155:10',
  name: 'Optimism',
  rpcUrl: 'https://mainnet.optimism.io',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://optimistic.etherscan.io',
  iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg',
};

export const base: Chain = {
  id: 'eip155:8453',
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://basescan.org',
  iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
};

export const bsc: Chain = {
  id: 'eip155:56',
  name: 'BNB Chain',
  rpcUrl: 'https://bsc-dataseed.binance.org',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  explorerUrl: 'https://bscscan.com',
};

export const avalanche: Chain = {
  id: 'eip155:43114',
  name: 'Avalanche',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  explorerUrl: 'https://snowtrace.io',
};

export const gnosis: Chain = {
  id: 'eip155:100',
  name: 'Gnosis',
  rpcUrl: 'https://rpc.gnosischain.com',
  nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
  explorerUrl: 'https://gnosisscan.io',
};

export const zkSync: Chain = {
  id: 'eip155:324',
  name: 'zkSync Era',
  rpcUrl: 'https://mainnet.era.zksync.io',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://explorer.zksync.io',
};

export const celo: Chain = {
  id: 'eip155:42220',
  name: 'Celo',
  rpcUrl: 'https://forno.celo.org',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  explorerUrl: 'https://celoscan.io',
};

// ============================================================================
// Solana Chains
// ============================================================================

export const solanaMainnet: Chain = {
  id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  name: 'Solana',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  explorerUrl: 'https://explorer.solana.com',
  iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_solana.jpg',
};

export const solanaDevnet: Chain = {
  id: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  name: 'Solana Devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
};

export const solanaTestnet: Chain = {
  id: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
  name: 'Solana Testnet',
  rpcUrl: 'https://api.testnet.solana.com',
  nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
};

// ============================================================================
// Bitcoin Chains
// ============================================================================

export const bitcoinMainnet: Chain = {
  id: 'bip122:000000000019d6689c085ae165831e93',
  name: 'Bitcoin',
  rpcUrl: 'https://blockstream.info/api',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  explorerUrl: 'https://blockstream.info',
  iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_bitcoin.jpg',
};

export const bitcoinTestnet: Chain = {
  id: 'bip122:000000000933ea01ad0ee984209779ba',
  name: 'Bitcoin Testnet',
  rpcUrl: 'https://blockstream.info/testnet/api',
  nativeCurrency: { name: 'Testnet Bitcoin', symbol: 'tBTC', decimals: 8 },
  explorerUrl: 'https://blockstream.info/testnet',
};

// ============================================================================
// Chain Collections
// ============================================================================

/** All EVM chains */
export const EVM_CHAINS: Chain[] = [
  mainnet, polygon, arbitrum, optimism, base, bsc, avalanche, gnosis, zkSync, celo,
  goerli, sepolia,
];

/** All Solana chains */
export const SOLANA_CHAINS: Chain[] = [
  solanaMainnet, solanaDevnet, solanaTestnet,
];

/** All Bitcoin chains */
export const BITCOIN_CHAINS: Chain[] = [
  bitcoinMainnet, bitcoinTestnet,
];

/** All supported chains */
export const ALL_CHAINS: Chain[] = [
  ...EVM_CHAINS,
  ...SOLANA_CHAINS,
  ...BITCOIN_CHAINS,
];

/** Mainnet-only chains (no testnets) */
export const MAINNET_CHAINS: Chain[] = [
  mainnet, polygon, arbitrum, optimism, base, bsc, avalanche, gnosis, zkSync, celo,
  solanaMainnet,
  bitcoinMainnet,
];

// ============================================================================
// Chain Lookup Utilities
// ============================================================================

/**
 * Find a chain by its CAIP-2 ID or numeric ID.
 */
export function findChain(chainId: string | number, chains: Chain[] = ALL_CHAINS): Chain | undefined {
  if (typeof chainId === 'number') {
    return chains.find(c => {
      const ref = c.id.split(':')[1];
      return parseInt(ref, 10) === chainId;
    });
  }
  return chains.find(c => c.id === chainId || c.name.toLowerCase() === chainId.toLowerCase());
}

/**
 * Get a chain by ID, throwing if not found.
 */
export function getChain(chainId: string | number, chains?: Chain[]): Chain {
  const chain = findChain(chainId, chains);
  if (!chain) throw new Error(`Chain not found: ${chainId}`);
  return chain;
}

/**
 * Check if a chain ID is a testnet.
 */
export function isTestnet(chainId: string | number): boolean {
  const TESTNETS = new Set([
    'eip155:5', 'eip155:11155111',
    'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
    'bip122:000000000933ea01ad0ee984209779ba',
  ]);
  const id = typeof chainId === 'number' ? `eip155:${chainId}` : chainId;
  return TESTNETS.has(id);
}
