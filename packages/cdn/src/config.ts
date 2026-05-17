/**
 * CDN global configuration via window.OnChainUX.
 *
 * Users can set configuration before loading the CDN bundle:
 *
 * ```html
 * <script>
 *   window.OnChainUX = {
 *     projectId: 'your-project-id',
 *     theme: 'dark',
 *     primaryColor: '#6366F1',
 *     chains: [1, 10, 137],
 *   };
 * </script>
 * <script src="https://cdn.onchainux.dev/connect.js"></script>
 * ```
 */

export interface OnChainUXConfig {
  /** WalletConnect Project ID */
  projectId?: string;
  /** Theme mode */
  theme?: "light" | "dark";
  /** Custom primary color */
  primaryColor?: string;
  /** Default chain IDs */
  chains?: number[];
  /** Default chain ID */
  defaultChainId?: number;
  /** Wallet metadata */
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  /** Whether to show recent connections */
  showRecent?: boolean;
  /** Supported wallet types */
  wallets?: string[];
  /** RPC URLs per chain */
  rpcUrls?: Record<number, string>;
}

/**
 * Global configuration interface on window.
 */
declare global {
  interface Window {
    OnChainUX?: OnChainUXConfig;
  }
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: OnChainUXConfig = {
  theme: "light",
  chains: [1],
  showRecent: true,
};

/**
 * Get the merged configuration from window.OnChainUX.
 * Falls back to defaults for any missing values.
 */
export function getConfig(): OnChainUXConfig {
  const userConfig = typeof window !== "undefined" ? window.OnChainUX : undefined;
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };
}

/**
 * Validate that required configuration is present.
 * Returns a list of missing keys.
 */
export function validateConfig(config: OnChainUXConfig): string[] {
  const missing: string[] = [];
  if (!config.projectId) {
    missing.push("projectId");
  }
  return missing;
}
