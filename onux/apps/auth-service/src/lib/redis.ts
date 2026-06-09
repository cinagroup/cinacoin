/**
 * Redis client singleton for rate limiting and caching
 */
import Redis from 'ioredis';
import { getConfig } from './config.js';

let _redis: Redis | null = null;

/**
 * Get Redis client instance
 */
export function getRedis(): Redis {
  if (!_redis) {
    const config = getConfig();
    _redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    _redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }
  return _redis;
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}

/**
 * Check if Redis is available (for fallback to in-memory)
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const redis = getRedis();
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
