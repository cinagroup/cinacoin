/**
 * @cinacoin/appkit-config
 *
 * Cinacoin brand configuration layer for Reown AppKit.
 * This package provides a unified configuration for integrating
 * Reown AppKit with Cinacoin branding across all applications.
 */

// Main configuration
export {
  createCinacoinAppKit,
  getCinacoinTheme,
  getDefaultMetadata,
  getSupportedChains,
  getRecommendedWallets,
  type CinacoinAppKitConfig,
} from './config';

// Theme configuration
export {
  CINACOIN_THEME,
  CINACOIN_COLORS,
  LIGHT_THEME_VARIABLES,
  DARK_THEME_VARIABLES,
  getThemeVariables,
  type CinacoinTheme,
} from './theme';

// Chain configuration
export {
  EVM_CHAINS,
  DEFAULT_CHAIN,
  CHAIN_METADATA,
  getChainMetadata,
  getSupportedChainIds,
  isChainSupported,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  type ChainMetadata,
} from './chains';

// Wallet configuration
export {
  RECOMMENDED_WALLETS,
  getRecommendedWalletIds,
  getWalletMetadata,
  isWalletRecommended,
  type WalletMetadata,
} from './wallets';
