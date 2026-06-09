/**
 * Dynamic Wallet Registry Fetcher.
 *
 * Fetches wallet data from the WalletConnect public registry API,
 * caches results in localStorage with a configurable TTL, and
 * falls back to hardcoded wallets when the fetch fails.
 *
 * Registry API: https://registry.walletconnect.com/api/v2/wallets
 */

import type { WalletRegistryEntry } from './types.js';

// ─── Constants ──────────────────────────────────────────────────

/** Base URL of the WalletConnect public registry. */
const REGISTRY_BASE_URL = 'https://registry.walletconnect.com/api/v2';

/** Endpoint for listing all wallets. */
const WALLETS_ENDPOINT = `${REGISTRY_BASE_URL}/wallets`;

/** localStorage key for cached wallet data. */
const CACHE_KEY = 'cinacoin:wallet-registry-cache';

/** Default cache TTL: 1 hour in milliseconds. */
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;

// ─── Types ──────────────────────────────────────────────────────

/** Shape of a single wallet entry from the registry API. */
interface RegistryWallet {
  id: string;
  name: string;
  homepage?: string;
  image_id?: string;
  app?: {
    browser?: string;
    ios?: string;
    android?: string;
    mac?: string;
    windows?: string;
    linux?: string;
    chrome?: string;
    firefox?: string;
    safari?: string;
  };
  mobile?: {
    native?: string;
    universal?: string;
  };
  desktop?: {
    native?: string;
    universal?: string;
  };
  metadata?: {
    shortName?: string;
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
  chains?: string[];
  injected?: {
    namespace?: string;
    injected_id?: string;
  }[];
}

/** Cached data shape stored in localStorage. */
interface CacheData {
  /** ISO timestamp when the cache was last refreshed. */
  timestamp: number;
  /** Cached wallet entries. */
  wallets: WalletRegistryEntry[];
}

// ─── Cache Management ───────────────────────────────────────────

/**
 * Check if the localStorage cache is still valid.
 */
function isCacheValid(ttlMs: number = DEFAULT_CACHE_TTL_MS): boolean {
  if (typeof localStorage === 'undefined') return false;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;

    const data: CacheData = JSON.parse(raw);
    const age = Date.now() - data.timestamp;
    return age < ttlMs;
  } catch {
    return false;
  }
}

/**
 * Read wallet entries from the localStorage cache.
 */
function readCache(): WalletRegistryEntry[] | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data: CacheData = JSON.parse(raw);
    return data.wallets;
  } catch {
    return null;
  }
}

/**
 * Write wallet entries to the localStorage cache with current timestamp.
 */
function writeCache(wallets: WalletRegistryEntry[]): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const data: CacheData = {
      timestamp: Date.now(),
      wallets,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * Invalidate the cached wallet data.
 */
export function invalidateCache(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

// ─── API Fetch ──────────────────────────────────────────────────

/**
 * Map a registry API wallet entry to our WalletRegistryEntry type.
 */
function mapRegistryEntry(raw: RegistryWallet): WalletRegistryEntry {
  const imageUrl = raw.image_id
    ? `https://registry.walletconnect.com/api/v2/logo/md/${raw.image_id}`
    : undefined;

  return {
    id: raw.id,
    name: raw.name,
    homepage: raw.homepage ?? '',
    deepLink: raw.mobile?.native ?? '',
    universalLink: raw.mobile?.universal ?? raw.app?.ios,
    appStoreUrl: raw.app?.ios,
    playStoreUrl: raw.app?.android,
    imageUrl,
    supportsWcV2: true,
    chains: raw.chains ?? [],
    rdns: raw.injected?.[0]?.injected_id,
  };
}

/**
 * Fetch wallets from the WalletConnect registry API.
 *
 * Returns an array of WalletRegistryEntry objects.
 * Throws on network errors — caller should handle fallback.
 */
async function fetchFromRegistry(): Promise<WalletRegistryEntry[]> {
  const response = await fetch(WALLETS_ENDPOINT);

  if (!response.ok) {
    throw new Error(
      `Wallet registry fetch failed: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const data: RegistryWallet[] = await response.json();

  return data
    .filter((w) => w.name && w.id)
    .map(mapRegistryEntry);
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Options for fetching wallets.
 */
export interface FetchWalletsOptions {
  /** Cache TTL in milliseconds (default: 1 hour). */
  cacheTtlMs?: number;
  /** Force a fresh fetch, bypassing the cache. */
  forceRefresh?: boolean;
  /** Filter results by chain (CAIP-2). If omitted, returns all wallets. */
  chainFilter?: string;
  /** Only return wallets supporting WalletConnect v2 (always true for registry). */
  wcV2Only?: boolean;
}

/**
 * Get wallet entries, using cache + remote fetch with fallback.
 *
 * Strategy:
 * 1. If cache is valid and not forcing refresh → return cached data
 * 2. Otherwise, fetch from registry API
 * 3. If fetch succeeds → cache and return
 * 4. If fetch fails → return cached data (even if stale)
 * 5. If no cache available → caller should provide hardcoded fallback
 *
 * Returns null only when both fetch and cache are unavailable.
 */
export async function fetchWallets(
  options: FetchWalletsOptions = {},
): Promise<WalletRegistryEntry[] | null> {
  const { cacheTtlMs = DEFAULT_CACHE_TTL_MS, forceRefresh = false, chainFilter, wcV2Only } = options;

  // Step 1: Try cache
  if (!forceRefresh && isCacheValid(cacheTtlMs)) {
    let wallets = readCache();
    if (wallets) {
      wallets = applyFilters(wallets, { chainFilter, wcV2Only });
      return wallets;
    }
  }

  // Step 2: Fetch from registry
  try {
    const wallets = await fetchFromRegistry();
    const filtered = applyFilters(wallets, { chainFilter, wcV2Only });
    writeCache(wallets); // cache the full set, not the filtered subset
    return filtered;
  } catch (err) {
    console.warn('[wallet-registry] Registry fetch failed, trying cache:', err);
  }

  // Step 3: Fall back to stale cache
  const staleWallets = readCache();
  if (staleWallets) {
    return applyFilters(staleWallets, { chainFilter, wcV2Only });
  }

  return null;
}

/**
 * Apply chain and WC v2 filters to a wallet list.
 */
function applyFilters(
  wallets: WalletRegistryEntry[],
  filters: { chainFilter?: string; wcV2Only?: boolean },
): WalletRegistryEntry[] {
  let result = wallets;

  if (filters.chainFilter) {
    result = result.filter(
      (w) => w.chains?.includes(filters.chainFilter!) ?? false,
    );
  }

  if (filters.wcV2Only) {
    result = result.filter((w) => w.supportsWcV2);
  }

  return result;
}
