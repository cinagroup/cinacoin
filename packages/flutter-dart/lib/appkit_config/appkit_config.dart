import 'chain_registry.dart';
import 'cinacoin_theme.dart';
import 'wallet_registry.dart';
import 'models/chain_config.dart';

/// Configuration for Cinacoin AppKit Flutter
class AppKitConfig {
  final String projectId;
  final AppMetadata metadata;
  final ThemeMode themeMode;
  final List<ChainConfig> chains;
  final List<String> recommendedWallets;
  final bool enableAnalytics;
  final bool enableEmail;
  final bool enableSocials;

  const AppKitConfig({
    required this.projectId,
    required this.metadata,
    this.themeMode = ThemeMode.dark,
    this.chains = const [],
    this.recommendedWallets = const [],
    this.enableAnalytics = false,
    this.enableEmail = false,
    this.enableSocials = false,
  }) : _chainsSpecified = true;

  const AppKitConfig._({
    required this.projectId,
    required this.metadata,
    this.themeMode = ThemeMode.dark,
    List<ChainConfig>? chains,
    List<String>? recommendedWallets,
    this.enableAnalytics = false,
    this.enableEmail = false,
    this.enableSocials = false,
  })  : chains = chains ?? ChainRegistry.allEVMChains,
        recommendedWallets = recommendedWallets ??
            WalletRegistry.recommended.map((w) => w.id).toList(),
        _chainsSpecified = false;

  final bool _chainsSpecified;

  /// Create config with defaults
  factory AppKitConfig.defaults({
    required String projectId,
    required AppMetadata metadata,
    ThemeMode themeMode = ThemeMode.dark,
    bool enableAnalytics = false,
    bool enableEmail = false,
    bool enableSocials = false,
  }) {
    return AppKitConfig._(
      projectId: projectId,
      metadata: metadata,
      themeMode: themeMode,
      enableAnalytics: enableAnalytics,
      enableEmail: enableEmail,
      enableSocials: enableSocials,
    );
  }

  /// Get theme based on mode
  CinacoinTheme get theme => themeMode == ThemeMode.light
      ? CinacoinTheme.light
      : CinacoinTheme.dark;
}

/// App metadata
class AppMetadata {
  final String name;
  final String description;
  final String url;
  final List<String> icons;

  const AppMetadata({
    required this.name,
    required this.description,
    required this.url,
    this.icons = const [],
  });
}

/// Theme mode
enum ThemeMode {
  light,
  dark,
}

/// Main entry point for Cinacoin AppKit Flutter
class CinacoinAppKit {
  CinacoinAppKit._();

  static AppKitConfig? _config;

  /// Current configuration
  static AppKitConfig? get config => _config;

  /// Configure Cinacoin AppKit
  static void configure(AppKitConfig config) {
    _config = config;
  }

  /// Reset configuration
  static void reset() {
    _config = null;
  }
}
