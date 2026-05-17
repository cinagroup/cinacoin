/**
 * Wallet Registry — Known wallet deep link schemes and metadata.
 *
 * Provides wallet discovery data for the connect modal, including
 * deep link schemes, universal links, and app store URLs for
 * 18+ major mobile wallets.
 */
import type { WalletRegistryEntry } from './types.js';
/**
 * Registry of well-known wallets with their deep link schemes,
 * universal links, and app store URLs.
 */
export declare const WALLET_REGISTRY: ReadonlyArray<WalletRegistryEntry>;
/**
 * Get a wallet entry by ID.
 */
export declare function getWalletById(id: string): WalletRegistryEntry | undefined;
/**
 * Get all wallet IDs.
 */
export declare function getWalletIds(): string[];
/**
 * Search wallets by name (case-insensitive substring match).
 */
export declare function searchWallets(query: string): WalletRegistryEntry[];
/**
 * Build a deep link URL for a wallet with a WC v2 URI.
 */
export declare function buildWalletDeepLink(walletId: string, wcUri: string): string | undefined;
/**
 * Build a universal link URL for a wallet with a WC v2 URI.
 */
export declare function buildWalletUniversalLink(walletId: string, wcUri: string): string | undefined;
/**
 * Get wallets that support a specific chain.
 */
export declare function getWalletsForChain(chain: string): WalletRegistryEntry[];
/**
 * Get wallets that support WalletConnect v2.
 */
export declare function getWcV2Wallets(): WalletRegistryEntry[];
/**
 * Get the recommended wallet order for display.
 * Returns wallets sorted by: supports WC v2 first, then by chain support breadth.
 */
export declare function getRecommendedWalletOrder(): WalletRegistryEntry[];
//# sourceMappingURL=wallets.d.ts.map