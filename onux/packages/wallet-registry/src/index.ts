/**
 * @cinacoin/wallet-registry
 *
 * Cinacoin Wallet Registry — standardized wallet metadata for 100+ wallets
 * with type-safe query APIs.
 *
 * @example
 * ```ts
 * import { getAllWallets, getWalletById, filterWallets, searchWallets } from '@cinacoin/wallet-registry';
 *
 * // Get all wallets
 * const wallets = getAllWallets();
 * console.log(wallets.length); // 100+
 *
 * // Look up a wallet
 * const mm = getWalletById('metamask');
 *
 * // Filter by chain family
 * const evmWallets = filterWallets({ chainFamily: 'evm' });
 *
 * // Search by name
 * const results = searchWallets('phantom');
 * ```
 */

// Types
export type {
  WalletRegistryEntry,
  WalletPlatform,
  WalletChainFamily,
  WalletFilter,
  WalletSort,
} from "./types.js";

// Registry data
export { WALLET_REGISTRY, WALLET_COUNT } from "./registry.js";

// Query API
export {
  getAllWallets,
  getWalletById,
  getWalletIds,
  searchWallets,
  filterWallets,
  sortWallets,
  getWalletsForChainFamily,
  getWalletsForChain,
  getWcV2Wallets,
  getEIP6963Wallets,
  getRecommendedWalletOrder,
  getWalletsByPlatform,
  getWalletsByType,
  getChainFamilyCounts,
  getPlatformCounts,
} from "./api.js";
