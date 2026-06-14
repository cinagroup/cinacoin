import 'models/chain_config.dart';

/// Centralized chain configuration for Cinacoin SDKs.
/// Aligned with Web SDK chain registry.
class ChainRegistry {
  ChainRegistry._();

  // Well-known EVM Chains

  static const ethereum = ChainConfig(
    chainId: 1,
    name: 'Ethereum',
    shortName: 'eth',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
  );

  static const polygon = ChainConfig(
    chainId: 137,
    name: 'Polygon',
    shortName: 'matic',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
  );

  static const arbitrum = ChainConfig(
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'arb',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
  );

  static const optimism = ChainConfig(
    chainId: 10,
    name: 'Optimism',
    shortName: 'op',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg',
  );

  static const base = ChainConfig(
    chainId: 8453,
    name: 'Base',
    shortName: 'base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
  );

  static const bsc = ChainConfig(
    chainId: 56,
    name: 'BNB Smart Chain',
    shortName: 'bsc',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_bsc.jpg',
  );

  static const avalanche = ChainConfig(
    chainId: 43114,
    name: 'Avalanche C-Chain',
    shortName: 'avax',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg',
  );

  /// All supported EVM chains
  static const List<ChainConfig> allEVMChains = [
    ethereum,
    polygon,
    arbitrum,
    optimism,
    base,
    bsc,
    avalanche,
  ];

  /// Lookup chain by chain ID
  static ChainConfig? getChain(int chainId) {
    try {
      return allEVMChains.firstWhere((c) => c.chainId == chainId);
    } catch (_) {
      return null;
    }
  }

  /// Get CAIP-2 namespace string
  static String namespaceString(int chainId) => 'eip155:$chainId';
}
