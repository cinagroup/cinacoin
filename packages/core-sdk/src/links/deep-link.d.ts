/**
 * Deep link URL generation for wallet apps.
 *
 * Supports MetaMask, WalletConnect, Rainbow, Coinbase Wallet, and custom schemes.
 */
import type { DeepLinkParams, WalletDeepLinkConfig } from './types.js';
/** Built-in wallet deep link configurations. */
export declare const WALLET_DEEP_LINKS: Record<string, WalletDeepLinkConfig>;
/**
 * Generate a deep link URL for a specific wallet.
 *
 * @param params - Deep link parameters including wallet ID and URI.
 * @returns The complete deep link URL string.
 * @throws Error if the wallet ID is not recognized.
 */
export declare function generateDeepLink(params: DeepLinkParams): string;
/**
 * Register a custom wallet deep link configuration.
 *
 * @param walletId - Unique wallet identifier.
 * @param config - Deep link configuration for the wallet.
 */
export declare function registerWalletDeepLink(walletId: string, config: WalletDeepLinkConfig): void;
/**
 * Get the app store URL for a wallet on a given platform.
 *
 * @param walletId - Wallet identifier.
 * @param platform - Target platform ('ios' or 'android').
 * @returns App store URL or undefined if not available.
 */
export declare function getAppStoreUrl(walletId: string, platform: 'ios' | 'android'): string | undefined;
//# sourceMappingURL=deep-link.d.ts.map