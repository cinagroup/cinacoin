/**
 * Rate limiter with multiple strategies
 * Supports Fixed Window, Sliding Window, and Token Bucket algorithms
 */
import { getRedis } from './redis.js';
import crypto from 'crypto';

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },
  register: { max: 3, windowMs: 60 * 60 * 1000 },
  oauth: { max: 10, windowMs: 15 * 60 * 1000 },
  passwordReset: { max: 3, windowMs: 60 * 60 * 1000 },
  mfaVerify: { max: 5, windowMs: 15 * 60 * 1000 },
  api: { max: 100, windowMs: 60 * 1000 },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Fixed Window rate limiting
 * Simple counter that resets at the end of each window
 */
export async function fixedWindowLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  const windowKey = `${key}:fixed`;
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const windowEnd = windowStart + config.windowMs;

  const current = await redis.incr(windowKey);
  
  if (current === 1) {
    await redis.pexpire(windowKey, config.windowMs);
  }

  const remaining = Math.max(0, config.max - current);
  const reset = Math.ceil(windowEnd / 1000);

  return {
    allowed: current <= config.max,
    limit: config.max,
    remaining,
    reset,
    retryAfter: current > config.max ? Math.ceil((windowEnd - now) / 1000) : undefined,
  };
}

/**
 * Sliding Window rate limiting
 * More precise than fixed window, uses sorted sets
 */
export async function slidingWindowLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  const windowKey = `${key}:sliding`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const multi = redis.multi();
  multi.zremrangebyscore(windowKey, 0, windowStart);
  multi.zadd(windowKey, now, `${now}:${crypto.randomUUID()}`);
  multi.zcard(windowKey);
  multi.pexpire(windowKey, config.windowMs);

  const results = await multi.exec();
  const current = results?.[2]?.[1] as number;

  const remaining = Math.max(0, config.max - current);
  const reset = Math.ceil((now + config.windowMs) / 1000);

  return {
    allowed: current <= config.max,
    limit: config.max,
    remaining,
    reset,
    retryAfter: current > config.max ? Math.ceil(config.windowMs / 1000) : undefined,
  };
}

/**
 * Token Bucket rate limiting
 * Allows bursts up to bucket capacity, refills at steady rate
 */
export async function tokenBucketLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  const bucketKey = `${key}:bucket`;
  const now = Date.now();

  const tokensPerMs = config.max / config.windowMs;
  const lastRefillKey = `${bucketKey}:last`;

  const multi = redis.multi();
  multi.hget(bucketKey, 'tokens');
  multi.hget(lastRefillKey, 'time');
  const results = await multi.exec();

  let tokens = parseFloat(results?.[0]?.[1] as string) || config.max;
  const lastRefill = parseInt(results?.[1]?.[1] as string) || now;

  const elapsed = now - lastRefill;
  tokens = Math.min(config.max, tokens + elapsed * tokensPerMs);

  const allowed = tokens >= 1;
  if (allowed) {
    tokens -= 1;
  }

  await redis.hset(bucketKey, 'tokens', tokens.toString());
  await redis.hset(lastRefillKey, 'time', now.toString());
  await redis.pexpire(bucketKey, config.windowMs);
  await redis.pexpire(lastRefillKey, config.windowMs);

  const remaining = Math.floor(tokens);
  const reset = Math.ceil((now + config.windowMs) / 1000);

  return {
    allowed,
    limit: config.max,
    remaining,
    reset,
    retryAfter: !allowed ? Math.ceil((1 / tokensPerMs) / 1000) : undefined,
  };
}

/**
 * Check rate limit with progressive penalties for repeated failures
 */
export async function checkRateLimitWithPenalty(
  key: string,
  config: RateLimitConfig,
  failureCount: number
): Promise<RateLimitResult> {
  let penaltyMultiplier = 1;
  
  if (failureCount >= 10) {
    penaltyMultiplier = 4; // 1 hour lockout
  } else if (failureCount >= 5) {
    penaltyMultiplier = 3; // 15 minute lockout
  } else if (failureCount >= 3) {
    penaltyMultiplier = 2; // 5 minute lockout
  }

  const penalizedConfig = {
    ...config,
    windowMs: config.windowMs * penaltyMultiplier,
  };

  return slidingWindowLimit(key, penalizedConfig);
}

/**
 * Increment failure counter for progressive penalties
 */
export async function incrementFailureCount(key: string): Promise<number> {
  const redis = getRedis();
  const failureKey = `${key}:failures`;
  const count = await redis.incr(failureKey);
  
  if (count === 1) {
    await redis.expire(failureKey, 60 * 60); // 1 hour expiry
  }
  
  return count;
}

/**
 * Reset failure counter on successful authentication
 */
export async function resetFailureCount(key: string): Promise<void> {
  const redis = getRedis();
  const failureKey = `${key}:failures`;
  await redis.del(failureKey);
}

/**
 * Get current failure count
 */
export async function getFailureCount(key: string): Promise<number> {
  const redis = getRedis();
  const failureKey = `${key}:failures`;
  const count = await redis.get(failureKey);
  return count ? parseInt(count) : 0;
}
