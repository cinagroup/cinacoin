/**
 * EVM Chain Configurations — Top 22 EVM-compatible chains.
 *
 * Each chain includes chain ID, RPC URLs, block explorers, native currency
 * metadata, and testnet flags. Used by the EVM adapter for automatic
 * chain registration.
 */

import type { Chain } from '../types.js';

/**
 * Extended chain definition with multiple RPC URLs, explorer URLs,
 * and additional metadata beyond the base Chain type.
 */
export interface EvmChainConfig {
  /** Numeric chain ID (CAIP-2 reference). */
  id: number;
  /** Human-readable chain name. */
  name: string;
  /** Short name / ticker (e.g. 'eth', 'arb'). */
  shortName: string;
  /** Network identifier (e.g. 'mainnet', 'sepolia'). */
  network: string;
  /** Native currency metadata. */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** JSON-RPC endpoint URLs (at least 2). */
  rpcUrls: string[];
  /** Block explorer base URLs. */
  blockExplorerUrls: string[];
  /** Chain icon URLs (optional). */
  iconUrls?: string[];
  /** Whether this is a testnet. */
  isTestnet: boolean;
}

/**
 * Convert an EvmChainConfig to the base Chain type for SDK compatibility.
 */
function toChain(cfg: EvmChainConfig): Chain {
  return {
    id: `eip155:${cfg.id}`,
    name: cfg.name,
    rpcUrl: cfg.rpcUrls[0],
    nativeCurrency: cfg.nativeCurrency,
    explorerUrl: cfg.blockExplorerUrls[0],
  };
}

/* ------------------------------------------------------------------ */
/*  Chain Definitions                                                  */
/* ------------------------------------------------------------------ */

const evmChains: EvmChainConfig[] = [
  // 1. Ethereum Mainnet
  {
    id: 1,
    name: 'Ethereum Mainnet',
    shortName: 'eth',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth', 'https://eth-mainnet.public.blastapi.io'],
    blockExplorerUrls: ['https://etherscan.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/ethereum.svg'],
    isTestnet: false,
  },
  // 2. Ethereum Sepolia
  {
    id: 11155111,
    name: 'Ethereum Sepolia',
    shortName: 'sep',
    network: 'sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org', 'https://sepolia.drpc.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    isTestnet: true,
  },
  // 3. Polygon
  {
    id: 137,
    name: 'Polygon',
    shortName: 'matic',
    network: 'mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com', 'https://rpc.ankr.com/polygon', 'https://polygon-mainnet.public.blastapi.io'],
    blockExplorerUrls: ['https://polygonscan.com'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/polygon.svg'],
    isTestnet: false,
  },
  // 4. Polygon Amoy
  {
    id: 80002,
    name: 'Polygon Amoy',
    shortName: 'amoy',
    network: 'amoy',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-amoy.polygon.technology', 'https://polygon-amoy-bor-rpc.publicnode.com'],
    blockExplorerUrls: ['https://amoy.polygonscan.com'],
    isTestnet: true,
  },
  // 5. BNB Smart Chain
  {
    id: 56,
    name: 'BNB Smart Chain',
    shortName: 'bnb',
    network: 'mainnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org', 'https://rpc.ankr.com/bsc', 'https://bsc-dataseed1.defibit.io'],
    blockExplorerUrls: ['https://bscscan.com'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/binance.svg'],
    isTestnet: false,
  },
  // 6. BSC Testnet
  {
    id: 97,
    name: 'BSC Testnet',
    shortName: 'bnbt',
    network: 'testnet',
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc1.bnbchain.org', 'https://bsc-testnet-rpc.publicnode.com'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    isTestnet: true,
  },
  // 7. Arbitrum One
  {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'arb1',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum', 'https://arbitrum-one.public.blastapi.io'],
    blockExplorerUrls: ['https://arbiscan.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/arbitrum.svg'],
    isTestnet: false,
  },
  // 8. Arbitrum Sepolia
  {
    id: 421614,
    name: 'Arbitrum Sepolia',
    shortName: 'arb-sep',
    network: 'sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc', 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    isTestnet: true,
  },
  // 9. Optimism
  {
    id: 10,
    name: 'Optimism',
    shortName: 'op',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism', 'https://optimism-mainnet.public.blastapi.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/optimism.svg'],
    isTestnet: false,
  },
  // 10. Optimism Sepolia
  {
    id: 11155420,
    name: 'Optimism Sepolia',
    shortName: 'opsep',
    network: 'sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.optimism.io', 'https://optimism-sepolia.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://sepolia-optimistic.etherscan.io'],
    isTestnet: true,
  },
  // 11. Base
  {
    id: 8453,
    name: 'Base',
    shortName: 'base',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org', 'https://rpc.ankr.com/base', 'https://base-mainnet.public.blastapi.io'],
    blockExplorerUrls: ['https://basescan.org'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/base.svg'],
    isTestnet: false,
  },
  // 12. Base Sepolia
  {
    id: 84532,
    name: 'Base Sepolia',
    shortName: 'basesep',
    network: 'sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org', 'https://base-sepolia.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
    isTestnet: true,
  },
  // 13. Avalanche C-Chain
  {
    id: 43114,
    name: 'Avalanche C-Chain',
    shortName: 'avax',
    network: 'mainnet',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc', 'https://rpc.ankr.com/avalanche', 'https://avalanche-mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://snowtrace.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/avalanche.svg'],
    isTestnet: false,
  },
  // 14. Avalanche Fuji
  {
    id: 43113,
    name: 'Avalanche Fuji',
    shortName: 'fuji',
    network: 'fuji',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc', 'https://avalanche-fuji-c-chain-rpc.publicnode.com'],
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
    isTestnet: true,
  },
  // 15. Fantom Opera
  {
    id: 250,
    name: 'Fantom Opera',
    shortName: 'ftm',
    network: 'mainnet',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    rpcUrls: ['https://rpc.ftm.tools', 'https://rpc.ankr.com/fantom', 'https://fantom-rpc.publicnode.com'],
    blockExplorerUrls: ['https://ftmscan.com'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/fantom.svg'],
    isTestnet: false,
  },
  // 16. zkSync Era
  {
    id: 324,
    name: 'zkSync Era',
    shortName: 'zksync',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.era.zksync.io', 'https://rpc.ankr.com/zksync-era'],
    blockExplorerUrls: ['https://explorer.zksync.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/zksync.svg'],
    isTestnet: false,
  },
  // 17. Linea
  {
    id: 59144,
    name: 'Linea',
    shortName: 'linea',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.linea.build', 'https://linea-mainnet.infura.io/v3'],
    blockExplorerUrls: ['https://lineascan.build'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/linea.svg'],
    isTestnet: false,
  },
  // 18. Scroll
  {
    id: 534352,
    name: 'Scroll',
    shortName: 'scr',
    network: 'mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.scroll.io', 'https://rpc.ankr.com/scroll'],
    blockExplorerUrls: ['https://scrollscan.com'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/scroll.svg'],
    isTestnet: false,
  },
  // 19. Gnosis Chain
  {
    id: 100,
    name: 'Gnosis Chain',
    shortName: 'gno',
    network: 'mainnet',
    nativeCurrency: { name: 'xDAI', symbol: 'XDAI', decimals: 18 },
    rpcUrls: ['https://rpc.gnosischain.com', 'https://rpc.ankr.com/gnosis', 'https://gnosis-mainnet.public.blastapi.io'],
    blockExplorerUrls: ['https://gnosisscan.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/gnosis.svg'],
    isTestnet: false,
  },
  // 20. Cronos
  {
    id: 25,
    name: 'Cronos',
    shortName: 'cro',
    network: 'mainnet',
    nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
    rpcUrls: ['https://evm.cronos.org', 'https://rpc.ankr.com/cronos'],
    blockExplorerUrls: ['https://cronoscan.com'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/cronos.svg'],
    isTestnet: false,
  },
  // 21. Celo
  {
    id: 42220,
    name: 'Celo',
    shortName: 'celo',
    network: 'mainnet',
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    rpcUrls: ['https://forno.celo.org', 'https://rpc.ankr.com/celo'],
    blockExplorerUrls: ['https://celoscan.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/celo.svg'],
    isTestnet: false,
  },
  // 22. Moonbeam
  {
    id: 1284,
    name: 'Moonbeam',
    shortName: 'glmr',
    network: 'mainnet',
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
    rpcUrls: ['https://rpc.api.moonbeam.network', 'https://moonbeam-rpc.dwellir.com'],
    blockExplorerUrls: ['https://moonscan.io'],
    iconUrls: ['https://icons.llamao.fi/icons/chains/moonbeam.svg'],
    isTestnet: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Public Exports                                                     */
/* ------------------------------------------------------------------ */

/** All EVM chain configurations. */
export const EVM_CHAINS: EvmChainConfig[] = evmChains;

/** All chains converted to the base Chain type for SDK compatibility. */
export const DEFAULT_EVM_CHAINES: Chain[] = evmChains.map(toChain);

/** Find a chain by numeric chain ID. */
export function getChainById(chainId: number): EvmChainConfig | undefined {
  return evmChains.find((c) => c.id === chainId);
}

/** Find a chain by name (case-insensitive). */
export function getChainByName(name: string): EvmChainConfig | undefined {
  const lower = name.toLowerCase();
  return evmChains.find(
    (c) => c.name.toLowerCase() === lower || c.shortName.toLowerCase() === lower || c.network.toLowerCase() === lower,
  );
}
