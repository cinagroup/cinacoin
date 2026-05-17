import type { MetaOptions } from '@cinaconnect/core-sdk';
/**
 * Network identifiers supported by CinaConnect.
 */
export type CinaConnectNetwork = 'mainnet' | 'testnet' | 'arbitrum' | 'arbitrum-sepolia' | 'base' | 'base-sepolia' | 'optimism' | 'optimism-sepolia' | 'polygon' | 'polygon-mumbai' | string;
/**
 * Module options for the Nuxt 3 CinaConnect module.
 */
export interface CinaConnectModuleOptions {
    /**
     * CinaConnect project ID (from https://cloud.cinaconnect.com).
     */
    projectId: string;
    /**
     * Network keys to enable (e.g. ['mainnet', 'arbitrum', 'base']).
     * Defaults to ['mainnet'].
     */
    networks?: CinaConnectNetwork[];
    /**
     * WalletConnect metadata for the connection.
     */
    metadata?: MetaOptions;
    /**
     * Theme mode for the connect UI.
     * @default 'auto'
     */
    themeMode?: 'auto' | 'dark' | 'light';
    /**
     * Theme variables override.
     */
    themeVariables?: Record<string, string>;
}
/**
 * CinaConnect Nuxt module — provides wallet connection for Nuxt 3 apps.
 *
 * Automatically adds the @cinaconnect/vue plugin, runtime config,
 * composables, and a connect-button component.
 */
declare const _default: import("nuxt/schema").NuxtModule<CinaConnectModuleOptions, CinaConnectModuleOptions, false>;
export default _default;
//# sourceMappingURL=module.d.ts.map