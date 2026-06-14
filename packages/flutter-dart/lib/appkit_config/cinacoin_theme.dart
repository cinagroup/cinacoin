import 'package:flutter/material.dart';

/// Cinacoin brand theme configuration
class CinacoinTheme {
  final Color primary;
  final Color secondary;
  final Color background;
  final Color surface;
  final Color text;
  final Color textSecondary;
  final Color border;
  final Color error;
  final Color success;

  final CinacoinTypography typography;
  final CinacoinSpacing spacing;
  final CinacoinBorderRadius borderRadius;

  const CinacoinTheme({
    required this.primary,
    required this.secondary,
    required this.background,
    required this.surface,
    required this.text,
    required this.textSecondary,
    required this.border,
    required this.error,
    required this.success,
    this.typography = const CinacoinTypography(),
    this.spacing = const CinacoinSpacing(),
    this.borderRadius = const CinacoinBorderRadius(),
  });

  /// Dark theme (default)
  static const dark = CinacoinTheme(
    primary: Color(0xFF0070F3),
    secondary: Color(0xFF6366F1),
    background: Color(0xFF000000),
    surface: Color(0xFF141414),
    text: Color(0xFFFFFFFF),
    textSecondary: Color(0xFFA1A1AA),
    border: Color(0xFF27272A),
    error: Color(0xFFEF4444),
    success: Color(0xFF22C55E),
  );

  /// Light theme
  static const light = CinacoinTheme(
    primary: Color(0xFF0070F3),
    secondary: Color(0xFF6366F1),
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFF4F4F5),
    text: Color(0xFF000000),
    textSecondary: Color(0xFF71717A),
    border: Color(0xFFE4E4E7),
    error: Color(0xFFEF4444),
    success: Color(0xFF22C55E),
  );
}

/// Typography configuration
class CinacoinTypography {
  final double small;
  final double medium;
  final double large;
  final double xlarge;

  const CinacoinTypography({
    this.small = 12,
    this.medium = 14,
    this.large = 16,
    this.xlarge = 20,
  });
}

/// Spacing configuration
class CinacoinSpacing {
  final double xs;
  final double sm;
  final double md;
  final double lg;
  final double xl;

  const CinacoinSpacing({
    this.xs = 4,
    this.sm = 8,
    this.md = 16,
    this.lg = 24,
    this.xl = 32,
  });
}

/// Border radius configuration
class CinacoinBorderRadius {
  final double small;
  final double medium;
  final double large;

  const CinacoinBorderRadius({
    this.small = 4,
    this.medium = 8,
    this.large = 12,
  });
}
