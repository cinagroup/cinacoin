/**
 * @cinacoin/wallet-registry — Query API
 *
 * Type-safe functions for searching, filtering, and sorting wallet registry data.
 */

import { WALLET_REGISTRY } from "./registry.js";
import type {
  WalletRegistryEntry,
  WalletFilter,
  WalletSort,
} from "./types.js";

// ============================================================
// Lookup
// ============================================================

/** Get all wallet entries. */
export function getAllWallets(): ReadonlyArray<WalletRegistryEntry> {
  return WALLET_REGISTRY;
}

/** Get a wallet by ID (case-insensitive). */
export function getWalletById(id: string): WalletRegistryEntry | undefined {
  return WALLET_REGISTRY.find((w) => w.id.toLowerCase() === id.toLowerCase());
}

/** Get wallet IDs as string array. */
export function getWalletIds(): string[] {
  return WALLET_REGISTRY.map((w) => w.id);
}

// ============================================================
// Search
// ============================================================

/** Search wallets by name or ID (case-insensitive substring). */
export function searchWallets(query: string): WalletRegistryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return WALLET_REGISTRY.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q) ||
      (w.description && w.description.toLowerCase().includes(q)) ||
      (w.developer && w.developer.toLowerCase().includes(q))
  );
}

// ============================================================
// Filter
// ============================================================

/** Filter wallets by one or more criteria. */
export function filterWallets(filter: WalletFilter): WalletRegistryEntry[] {
  let results = [...WALLET_REGISTRY];

  if (filter.chainFamily) {
    results = results.filter((w) => w.supportedChainFamilies.includes(filter.chainFamily!));
  }

  if (filter.chain) {
    results = results.filter(
      (w) =>
        w.supportedChains?.includes(filter.chain!) ?? false
    );
  }

  if (filter.platform) {
    results = results.filter((w) => w.platforms.includes(filter.platform!));
  }

  if (filter.walletType) {
    results = results.filter((w) => w.walletType === filter.walletType);
  }

  if (filter.walletConnectV2 !== undefined) {
    results = results.filter(
      (w) => (w.supportsWalletConnectV2 ?? false) === filter.walletConnectV2
    );
  }

  if (filter.eip6963 !== undefined) {
    results = results.filter(
      (w) => (w.supportsEIP6963 ?? false) === filter.eip6963
    );
  }

  if (filter.accountAbstraction !== undefined) {
    results = results.filter(
      (w) => (w.supportsAccountAbstraction ?? false) === filter.accountAbstraction
    );
  }

  if (filter.openSource !== undefined) {
    results = results.filter((w) => (w.openSource ?? false) === filter.openSource);
  }

  if (filter.developer) {
    results = results.filter(
      (w) => w.developer?.toLowerCase() === filter.developer!.toLowerCase()
    );
  }

  if (filter.search) {
    results = results.filter(
      (w) =>
        w.name.toLowerCase().includes(filter.search!.toLowerCase()) ||
        w.id.toLowerCase().includes(filter.search!.toLowerCase()) ||
        (w.description && w.description.toLowerCase().includes(filter.search!.toLowerCase()))
    );
  }

  return results;
}

// ============================================================
// Sort
// ============================================================

/** Sort wallets by a given criterion. */
export function sortWallets(
  wallets: ReadonlyArray<WalletRegistryEntry>,
  sort: WalletSort = { field: "popularity", direction: "desc" }
): WalletRegistryEntry[] {
  const sorted = [...wallets];
  const dir = sort.direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sort.field) {
      case "popularity":
        return ((a.popularity ?? 0) - (b.popularity ?? 0)) * dir;
      case "name":
        return a.name.localeCompare(b.name) * dir;
      case "yearFounded":
        return ((a.yearFounded ?? 0) - (b.yearFounded ?? 0)) * dir;
      case "chainCount":
        return ((a.supportedChains?.length ?? 0) - (b.supportedChains?.length ?? 0)) * dir;
      default:
        return 0;
    }
  });

  return sorted;
}

// ============================================================
// Chain-based queries
// ============================================================

/** Get wallets supporting a specific chain family. */
export function getWalletsForChainFamily(chainFamily: string): WalletRegistryEntry[] {
  return WALLET_REGISTRY.filter((w) =>
    w.supportedChainFamilies.includes(chainFamily as unknown)
  );
}

/** Get wallets supporting a specific CAIP-2 chain. */
export function getWalletsForChain(caip2: string): WalletRegistryEntry[] {
  return WALLET_REGISTRY.filter(
    (w) => w.supportedChains?.includes(caip2) ?? false
  );
}

/** Get wallets that support WalletConnect v2. */
export function getWcV2Wallets(): WalletRegistryEntry[] {
  return WALLET_REGISTRY.filter((w) => w.supportsWalletConnectV2 ?? false);
}

/** Get wallets that support EIP-6963. */
export function getEIP6963Wallets(): WalletRegistryEntry[] {
  return WALLET_REGISTRY.filter((w) => w.supportsEIP6963 ?? false);
}

/** Get recommended wallet order (WC v2, sorted by popularity desc). */
export function getRecommendedWalletOrder(): WalletRegistryEntry[] {
  return sortWallets(
    WALLET_REGISTRY.filter((w) => w.supportsWalletConnectV2 ?? false),
    { field: "popularity", direction: "desc" }
  );
}

/** Get wallets by platform. */
export function getWalletsByPlatform(platform: string): WalletRegistryEntry[] {
  return WALLET_REGISTRY.filter((w) => w.platforms.includes(platform as unknown));
}

/** Get wallets by type. */
export function getWalletsByType(walletType: string): WalletRegistryEntry[] {
  return WALLET_REGISTRY.filter((w) => w.walletType === walletType);
}

/** Count wallets per chain family. */
export function getChainFamilyCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const wallet of WALLET_REGISTRY) {
    for (const family of wallet.supportedChainFamilies) {
      counts[family] = (counts[family] ?? 0) + 1;
    }
  }
  return counts;
}

/** Count wallets per platform. */
export function getPlatformCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const wallet of WALLET_REGISTRY) {
    for (const platform of wallet.platforms) {
      counts[platform] = (counts[platform] ?? 0) + 1;
    }
  }
  return counts;
}
