import 'package:flutter/material.dart';
import '../appkit_config/chain_registry.dart';
import '../appkit_config/cinacoin_theme.dart';
import '../appkit_config/models/chain_config.dart';

/// Chain selector dropdown
class CinacoinChainSelector extends StatelessWidget {
  final int selectedChainId;
  final void Function(int chainId) onChainSelected;
  final List<ChainConfig> chains;
  final CinacoinTheme? theme;

  const CinacoinChainSelector({
    super.key,
    required this.selectedChainId,
    required this.onChainSelected,
    this.chains = const [],
    this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final themeData = theme ?? _getThemeFromBrightness(context);
    final chainList = chains.isEmpty ? ChainRegistry.allEVMChains : chains;
    final selectedChain = chainList.firstWhere(
      (c) => c.chainId == selectedChainId,
      orElse: () => ChainRegistry.ethereum,
    );

    return PopupMenuButton<int>(
      onSelected: onChainSelected,
      offset: const Offset(0, 40),
      color: themeData.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: themeData.border),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: themeData.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: themeData.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selectedChain.iconUrl != null)
              CircleAvatar(
                radius: 10,
                backgroundImage: NetworkImage(selectedChain.iconUrl!),
                backgroundColor: themeData.surface,
              ),
            const SizedBox(width: 8),
            Text(
              selectedChain.shortName.toUpperCase(),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: themeData.text,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down,
              size: 16,
              color: themeData.textSecondary,
            ),
          ],
        ),
      ),
      itemBuilder: (context) {
        return chainList.map((chain) {
          return PopupMenuItem<int>(
            value: chain.chainId,
            child: Row(
              children: [
                if (chain.iconUrl != null)
                  CircleAvatar(
                    radius: 10,
                    backgroundImage: NetworkImage(chain.iconUrl!),
                  ),
                const SizedBox(width: 8),
                Text(
                  chain.name,
                  style: TextStyle(color: themeData.text),
                ),
                const Spacer(),
                if (chain.chainId == selectedChainId)
                  Icon(Icons.check, color: themeData.primary, size: 16),
              ],
            ),
          );
        }).toList();
      },
    );
  }

  CinacoinTheme _getThemeFromBrightness(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return brightness == Brightness.dark 
        ? CinacoinTheme.dark 
        : CinacoinTheme.light;
  }
}
