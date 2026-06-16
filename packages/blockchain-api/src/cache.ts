/**
 * Transaction history cache module.
 *
 * In-memory cache for transaction history results with TTL-based expiration.
 * Extracted from client.ts to reduce file size and improve modularity.
 */

import type { Transaction, TransactionCacheEntry } from './types.js';

// ---------------------------------------------------------------------------
// Cache state
// ---------------------------------------------------------------------------

/** In-memory cache for transaction history results. */
const _txHistoryCache = new Map<string, TransactionCacheEntry>();
const _TX_CACHE_TTL_MS = 30_000; // 30 seconds — transactions are relatively static

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Generate a cache key from query parameters. */
export function txCacheKey(
  address: string,
  chainId: number,
  cursor?: string,
  type?: string,
  timeFrom?: number,
  timeTo?: number
): string {
  return `${address}:${chainId}:${cursor || ""}:${type || ""}:${timeFrom || 0}:${timeTo || 0}`;
}

/** Get a cached transaction history result. Returns null if expired or missing. */
export function getTxCached(key: string): TransactionCacheEntry | null {
  const entry = _txHistoryCache.get(key);
  if (entry && Date.now() - entry.cachedAt < _TX_CACHE_TTL_MS) {
    return entry;
  }
  if (entry) {
    _txHistoryCache.delete(key);
  }
  return null;
}

/** Cache a transaction history result. */
export function setTxCached(
  key: string,
  transactions: Transaction[],
  nextCursor?: string,
  hasMore: boolean = false
): void {
  _txHistoryCache.set(key, {
    transactions,
    cachedAt: Date.now(),
    nextCursor,
    hasMore,
  });
}

/** Clear the transaction history cache. */
export function clearTxCached(): void {
  _txHistoryCache.clear();
}
