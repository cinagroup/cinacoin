import 'package:flutter/material.dart';
import '../appkit_config/chain_registry.dart';
import '../appkit_config/cinacoin_theme.dart';

/// Card displaying connected wallet account info
class CinacoinAccountCard extends StatelessWidget {
  final String address;
  final int? chainId;
  final VoidCallback? onDisconnect;
  final CinacoinTheme? theme;

  const CinacoinAccountCard({
    super.key,
    required this.address,
    this.chainId,
    this.onDisconnect,
    this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final themeData = theme ?? _getThemeFromBrightness(context);
    final chain = chainId != null ? ChainRegistry.getChain(chainId!) : null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: themeData.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: themeData.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _shortenAddress(address),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'monospace',
                    color: themeData.text,
                  ),
                ),
                if (chain != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    chain.name,
                    style: TextStyle(
                      fontSize: 12,
                      color: themeData.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (onDisconnect != null)
            IconButton(
              onPressed: onDisconnect,
              icon: Icon(Icons.logout, color: themeData.textSecondary),
            ),
        ],
      ),
    );
  }

  String _shortenAddress(String address) {
    if (address.length <= 10) return address;
    return '${address.substring(0, 6)}...${address.substring(address.length - 4)}';
  }

  CinacoinTheme _getThemeFromBrightness(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return brightness == Brightness.dark 
        ? CinacoinTheme.dark 
        : CinacoinTheme.light;
  }
}
