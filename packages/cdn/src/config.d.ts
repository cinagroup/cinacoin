/**
 * CDN global configuration via window.CinaConnect.
 *
 * Users can set configuration before loading the CDN bundle:
 *
 * ```html
 * <script>
 *   window.CinaConnect = {
 *     projectId: 'your-project-id',
 *     theme: 'dark',
 *     primaryColor: '#6366F1',
 *     chains: [1, 10, 137],
 *   };
 * </script>
 * <script src="https://cdn.cinaconnect.dev/connect.js"></script>
 * ```
 */
export interface CinaConnectConfig {
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
        CinaConnect?: CinaConnectConfig;
    }
}
/**
 * Get the merged configuration from window.CinaConnect.
 * Falls back to defaults for any missing values.
 */
export declare function getConfig(): CinaConnectConfig;
/**
 * Validate that required configuration is present.
 * Returns a list of missing keys.
 */
export declare function validateConfig(config: CinaConnectConfig): string[];
//# sourceMappingURL=config.d.ts.map