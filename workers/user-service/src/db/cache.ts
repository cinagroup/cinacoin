/**
 * KV-backed Query Cache
 *
 * Reduces D1 read latency by caching hot query results in Workers KV.
 * Cache entries have configurable TTL and are invalidated on writes.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Unix ms
}

// Default TTLs (seconds)
const TTL = {
  SHORT: 30,      // Volatile data (permissions, team membership)
  MEDIUM: 300,    // Semi-volatile (user profiles)
  LONG: 3600,     // Stable data (API key lookups by hash)
} as const;

// Cache key prefixes
const PREFIX = {
  USER_ID: 'u:id:',
  USER_EMAIL: 'u:em:',
  USER_USERNAME: 'u:un:',
  API_KEY_HASH: 'ak:h:',
  PERMISSION_CHECK: 'perm:',
  TEAM_ID: 't:id:',
  TEAM_MEMBERS: 't:m:',
} as const;

/**
 * Get a cached value, or null if not found / expired.
 */
export async function cacheGet<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  try {
    const raw = await kv.get(key, 'text');
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      // Expired — delete async (don't await)
      kv.delete(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Set a cache value with TTL in seconds.
 */
export async function cacheSet<T>(
  kv: KVNamespace,
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };
    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: ttlSeconds,
    });
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Invalidate one or more cache keys.
 */
export async function cacheInvalidate(
  kv: KVNamespace,
  ...keys: string[]
): Promise<void> {
  try {
    await Promise.all(keys.map((k) => kv.delete(k)));
  } catch {
    // Non-fatal
  }
}

/**
 * Invalidate all cache entries related to a user.
 */
export async function invalidateUser(
  kv: KVNamespace,
  userId: string,
  email?: string,
  username?: string
): Promise<void> {
  const keys = [`${PREFIX.USER_ID}${userId}`];
  if (email) keys.push(`${PREFIX.USER_EMAIL}${email}`);
  if (username) keys.push(`${PREFIX.USER_USERNAME}${username}`);
  await cacheInvalidate(kv, ...keys);
}

/**
 * Invalidate team-related cache entries.
 */
export async function invalidateTeam(
  kv: KVNamespace,
  teamId: string
): Promise<void> {
  await cacheInvalidate(kv, `${PREFIX.TEAM_ID}${teamId}`, `${PREFIX.TEAM_MEMBERS}${teamId}`);
}

/**
 * Invalidate permission check cache for a user.
 */
export async function invalidatePermissions(
  kv: KVNamespace,
  userId: string
): Promise<void> {
  // Use list to find all permission cache keys for this user
  // Since we can't do prefix scan efficiently for invalidation,
  // we use a simple approach: delete with known patterns
  // In practice, the short TTL handles stale permission checks
  try {
    const listed = await kv.list({ prefix: `${PREFIX.PERMISSION_CHECK}${userId}:` });
    await Promise.all(listed.keys.map((k) => kv.delete(k.name)));
  } catch {
    // Non-fatal — TTL will handle it
  }
}

// Export TTL constants and prefix constants for use in other modules
export { TTL, PREFIX };
