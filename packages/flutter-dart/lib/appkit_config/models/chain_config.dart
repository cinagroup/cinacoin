/// Chain configuration model
class ChainConfig {
  final int chainId;
  final String name;
  final String shortName;
  final String symbol;
  final int decimals;
  final String rpcUrl;
  final String explorerUrl;
  final String? iconUrl;
  final bool testnet;

  const ChainConfig({
    required this.chainId,
    required this.name,
    required this.shortName,
    required this.symbol,
    this.decimals = 18,
    required this.rpcUrl,
    required this.explorerUrl,
    this.iconUrl,
    this.testnet = false,
  });

  /// Get CAIP-2 namespace string (e.g., "eip155:1")
  String toNamespaceString() => 'eip155:$chainId';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ChainConfig &&
          runtimeType == other.runtimeType &&
          chainId == other.chainId;

  @override
  int get hashCode => chainId.hashCode;
}
