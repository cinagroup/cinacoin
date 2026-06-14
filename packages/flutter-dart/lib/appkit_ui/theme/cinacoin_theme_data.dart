import 'package:flutter/material.dart';
import '../../appkit_config/cinacoin_theme.dart';

/// Extension to convert CinacoinTheme to Flutter ThemeData
extension CinacoinThemeExtension on CinacoinTheme {
  /// Convert to Flutter ThemeData
  ThemeData toThemeData() {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: primary,
      scaffoldBackgroundColor: background,
      cardColor: surface,
      dividerColor: border,
      colorScheme: ColorScheme(
        brightness: Brightness.dark,
        primary: primary,
        onPrimary: Colors.white,
        secondary: secondary,
        onSecondary: Colors.white,
        error: error,
        onError: Colors.white,
        surface: surface,
        onSurface: text,
      ),
      textTheme: TextTheme(
        bodySmall: TextStyle(fontSize: typography.small, color: text),
        bodyMedium: TextStyle(fontSize: typography.medium, color: text),
        bodyLarge: TextStyle(fontSize: typography.large, color: text),
        headlineSmall: TextStyle(fontSize: typography.xlarge, color: text),
      ),
    );
  }
}

/// Get Cinacoin ThemeData based on brightness
ThemeData cinacoinThemeData({bool darkMode = true}) {
  return (darkMode ? CinacoinTheme.dark : CinacoinTheme.light).toThemeData();
}
