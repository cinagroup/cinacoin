/**
 * Cinacoin AppKit Configuration
 *
 * Main configuration for Reown AppKit with Cinacoin branding.
 * This is the central configuration that should be used across all Cinacoin applications.
 */

import { createAppKit } from '@reown/appkit';
import type { AppKitOptions } from '@reown/appkit';

import { EVM_CHAINS } from './chains';
import { getThemeVariables } from './theme';
import { RECOMMENDED_WALLETS } from './wallets';

/**
 * Cinacoin AppKit configuration options
 */
export interface CinacoinAppKitConfig {
  /** Project ID from Reown Cloud */
  projectId: string;
  /** Application metadata */
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  /** Theme mode */
  themeMode?: 'light' | 'dark';
  /** Enable analytics */
  enableAnalytics?: boolean;
  /** Enable email login */
  enableEmail?: boolean;
  /** Enable social logins */
  enableSocials?: boolean;
  /** Custom chains to support (defaults to EVM_CHAINS) */
  chains?: typeof EVM_CHAINS;
  /** Custom recommended wallets */
  recommendedWallets?: typeof RECOMMENDED_WALLETS;
}

/**
 * Default Cinacoin metadata
 */
const DEFAULT_METADATA = {
  name: 'Cinacoin',
  description: 'Connect any wallet to any chain',
  url: 'https://cinacoin.com',
  icons: ['https://cinacoin.com/icon.png'],
};

/**
 * Create a Cinacoin-branded AppKit instance
 */
export function createCinacoinAppKit(options: CinacoinAppKitConfig) {
  const {
    projectId,
    metadata = DEFAULT_METADATA,
    themeMode = 'dark',
    chains = EVM_CHAINS,
  } = options;

  // Build AppKit options
  const appKitOptions: AppKitOptions = {
    projectId,
    metadata,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    networks: chains as [any, ...any[]],
    themeMode,
    themeVariables: getThemeVariables(themeMode),
    allowUnsupportedChain: false,
  };

  // Create and return AppKit instance
  return createAppKit(appKitOptions);
}

/**
 * Get Cinacoin theme configuration
 */
export function getCinacoinTheme(mode: 'light' | 'dark' = 'dark') {
  return getThemeVariables(mode);
}

/**
 * Get default Cinacoin metadata
 */
export function getDefaultMetadata() {
  return { ...DEFAULT_METADATA };
}

/**
 * Get supported chains
 */
export function getSupportedChains() {
  return [...EVM_CHAINS];
}

/**
 * Get recommended wallets
 */
export function getRecommendedWallets() {
  return [...RECOMMENDED_WALLETS];
}
