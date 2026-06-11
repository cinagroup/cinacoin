/**
 * Rate limiting middleware using Workers KV
 * Implements sliding window algorithm
 */
import { Context, Next } from 'hono';
import type { Env } from '../lib/types.js';

export interface RateLimitConfig {
  max: number;
  windowMs: number;
  keyType: 'ip' | 'user';
}

export const RATE_LIMITS = {
  register:      { max: 5,  windowMs: 60 * 60 * 1000, keyType: 'ip'   as const }, // 5/hour/IP
  login:         { max: 10, windowMs: 15 * 60 * 1000, keyType: 'ip'   as const }, // 10/15min/IP
  refresh:       { max: 30, windowMs: 60 * 60 * 1000, keyType: 'user' as const }, // 30/hour/user
  passwordReset: { max: 3,  windowMs: 60 * 60 * 1000, keyType: 'ip'   as const }, // 3/hour/IP
  mfaVerify:     { max: 5,  windowMs: 15 * 60 * 1000, keyType: 'user' as const }, // 5/15min/user
  oauth:         { max: 10, windowMs: 15 * 60 * 1000, keyType: 'ip'   as const }, // 10/15min/IP
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get client IP address from request
 */
export function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = c.req.header('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Sliding window rate limit using KV
 */
async function slidingWindowLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing requests in window
  const existing = await kv.get(key, 'json');
  const timestamps: number[] = existing ? (existing as number[]) : [];

  // Filter to only timestamps within window
  const validTimestamps = timestamps.filter((ts) => ts > windowStart);

  const current = validTimestamps.length;
  const allowed = current < config.max;

  if (allowed) {
    validTimestamps.push(now);
    // Store with TTL slightly longer than window
    await kv.put(key, JSON.stringify(validTimestamps), {
      expirationTtl: Math.ceil(config.windowMs / 1000) + 60,
    });
  }

  const remaining = Math.max(0, config.max - validTimestamps.length);
  const reset = Math.ceil((now + config.windowMs) / 1000);

  return {
    allowed,
    limit: config.max,
    remaining,
    reset,
    retryAfter: !allowed ? Math.ceil(config.windowMs / 1000) : undefined,
  };
}

/**
 * Rate limiting middleware factory
 */
export function withRateLimit(limitType: RateLimitType) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const config = RATE_LIMITS[limitType];
    const keyPart = config.keyType === 'user'
      ? (c.req.header('x-user-id') ?? getClientIp(c))
      : getClientIp(c);
    const key = `ratelimit:${limitType}:${config.keyType}:${keyPart}`;

    const result = await slidingWindowLimit(c.env.KV, key, config);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', result.reset.toString());

    if (!result.allowed) {
      c.header('Retry-After', result.retryAfter!.toString());
      return c.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
        },
        429
      );
    }

    await next();
  };
}
