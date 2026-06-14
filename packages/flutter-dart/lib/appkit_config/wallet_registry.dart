/// Recommended wallet configuration
class WalletConfig {
  final String id;
  final String name;
  final String? iconUrl;
  final String? universalLink;
  final String? deepLink;

  const WalletConfig({
    required this.id,
    required this.name,
    this.iconUrl,
    this.universalLink,
    this.deepLink,
  });
}

/// Registry of recommended wallets for Cinacoin
class WalletRegistry {
  WalletRegistry._();

  /// Recommended wallets
  static const List<WalletConfig> recommended = [
    WalletConfig(
      id: 'metamask',
      name: 'MetaMask',
      iconUrl: 'https://registry.walletconnect.com/v2/logo/lg/0x1234',
      universalLink: 'https://metamask.app.link',
      deepLink: 'metamask://',
    ),
    WalletConfig(
      id: 'rainbow',
      name: 'Rainbow',
      iconUrl: 'https://registry.walletconnect.com/v2/logo/lg/0x5678',
      universalLink: 'https://rainbow.link',
      deepLink: 'rainbow://',
    ),
    WalletConfig(
      id: 'trust',
      name: 'Trust Wallet',
      iconUrl: 'https://registry.walletconnect.com/v2/logo/lg/0x9abc',
      universalLink: 'https://link.trustwallet.com',
      deepLink: 'trust://',
    ),
    WalletConfig(
      id: 'coinbase',
      name: 'Coinbase Wallet',
      iconUrl: 'https://registry.walletconnect.com/v2/logo/lg/0xdef0',
      universalLink: 'https://go.cb-w.com',
      deepLink: 'cbwallet://',
    ),
  ];

  /// Get wallet by ID
  static WalletConfig? getWallet(String id) {
    try {
      return recommended.firstWhere((w) => w.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Check if wallet is recommended
  static bool isRecommended(String id) =>
      recommended.any((w) => w.id == id);
}
