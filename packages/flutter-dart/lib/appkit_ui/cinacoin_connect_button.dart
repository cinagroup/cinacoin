import 'package:flutter/material.dart';
import '../appkit_config/cinacoin_theme.dart';

/// Cinacoin branded connect wallet button
class CinacoinConnectButton extends StatelessWidget {
  final VoidCallback onPressed;
  final CinacoinConnectButtonStyle style;
  final CinacoinTheme? theme;

  const CinacoinConnectButton({
    super.key,
    required this.onPressed,
    this.style = CinacoinConnectButtonStyle.defaultStyle,
    this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final themeData = theme ?? _getThemeFromBrightness(context);
    
    Color backgroundColor;
    Color foregroundColor;
    BorderSide? border;

    switch (style) {
      case CinacoinConnectButtonStyle.defaultStyle:
        backgroundColor = themeData.primary;
        foregroundColor = Colors.white;
        border = null;
        break;
      case CinacoinConnectButtonStyle.outline:
        backgroundColor = Colors.transparent;
        foregroundColor = themeData.text;
        border = BorderSide(color: themeData.border);
        break;
      case CinacoinConnectButtonStyle.minimal:
        backgroundColor = Colors.transparent;
        foregroundColor = themeData.text;
        border = null;
        break;
    }

    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: border ?? BorderSide.none,
          ),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.account_balance_wallet, size: 20),
            const SizedBox(width: 8),
            const Text(
              'Connect Wallet',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
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

enum CinacoinConnectButtonStyle {
  defaultStyle,
  outline,
  minimal,
}
