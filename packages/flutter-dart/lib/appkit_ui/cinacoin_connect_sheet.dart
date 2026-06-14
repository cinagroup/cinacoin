import 'package:flutter/material.dart';
import '../appkit_config/cinacoin_theme.dart';
import '../appkit_config/wallet_registry.dart';

/// Cinacoin branded wallet connection bottom sheet
class CinacoinConnectSheet extends StatelessWidget {
  final void Function(WalletConfig wallet)? onWalletSelect;
  final CinacoinTheme? theme;

  const CinacoinConnectSheet({
    super.key,
    this.onWalletSelect,
    this.theme,
  });

  /// Show the connect sheet as a modal bottom sheet
  static Future<T?> show<T>({
    required BuildContext context,
    void Function(WalletConfig wallet)? onWalletSelect,
    CinacoinTheme? theme,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => CinacoinConnectSheet(
        onWalletSelect: onWalletSelect,
        theme: theme,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeData = theme ?? _getThemeFromBrightness(context);

    return Container(
      decoration: BoxDecoration(
        color: themeData.background,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  'Connect Wallet',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: themeData.text,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close, color: themeData.textSecondary),
                ),
              ],
            ),
          ),
          const Divider(),
          
          // Wallet List
          FlexibleSpaceBar.createSettings(
            child: ListView.builder(
              shrinkWrap: true,
              padding: const EdgeInsets.all(16),
              itemCount: WalletRegistry.recommended.length,
              itemBuilder: (context, index) {
                final wallet = WalletRegistry.recommended[index];
                return _WalletRow(
                  wallet: wallet,
                  theme: themeData,
                  onTap: () {
                    onWalletSelect?.call(wallet);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          
          // Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: themeData.surface),
            child: Text(
              'By connecting, you agree to our Terms of Service',
              style: TextStyle(
                fontSize: 12,
                color: themeData.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  CinacoinTheme _getThemeFromBrightness(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return brightness == Brightness.dark 
        ? CinacoinTheme.dark 
        : CinacoinTheme.light;
  }
}

class _WalletRow extends StatelessWidget {
  final WalletConfig wallet;
  final CinacoinTheme theme;
  final VoidCallback onTap;

  const _WalletRow({
    required this.wallet,
    required this.theme,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: theme.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          radius: 20,
          backgroundImage: wallet.iconUrl != null 
              ? NetworkImage(wallet.iconUrl!) 
              : null,
          backgroundColor: theme.surface,
        ),
        title: Text(
          wallet.name,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: theme.text,
          ),
        ),
        trailing: Icon(Icons.chevron_right, color: theme.textSecondary),
      ),
    );
  }
}
