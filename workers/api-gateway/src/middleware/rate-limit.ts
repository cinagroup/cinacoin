/**
 * Rate limiting middleware for API Gateway
 * Implements both endpoint-specific and global rate limits
 */
import { Context, Next } from 'hono';

// Env bindings needed for rate limiting
interface Env {
  RATE_LIMIT_KV: KVNamespace;
}

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  // Endpoint-specific limits
  auth: { max: 100, windowMs: 60 * 1000 },
  users: { max: 200, windowMs: 60 * 1000 },
  teams: { max: 200, windowMs: 60 * 1000 },
  // Global limit per IP
  global: { max: 1000, windowMs: 60 * 60 * 1000 }, // 1000/hour
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get client IP from request headers
 */
export function getClientIp(c: Context): string {
  const cfIp = c.req.header('cf-connecting-ip');
  if (cfIp) return cfIp;

  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

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

  // Get existing timestamps in window
  const existing = await kv.get(key, 'json');
  const timestamps: number[] = existing ? (existing as number[]) : [];

  // Filter to only timestamps within window
  const validTimestamps = timestamps.filter((ts) => ts > windowStart);

  const current = validTimestamps.length;
  const allowed = current < config.max;

  if (allowed) {
    validTimestamps.push(now);
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
 * Endpoint-specific rate limiting middleware
 */
export function withRateLimit(limitType: Exclude<RateLimitType, 'global'>) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const config = RATE_LIMITS[limitType];
    const clientIp = getClientIp(c);
    const key = `ratelimit:${limitType}:${clientIp}`;

    const result = await slidingWindowLimit(c.env.RATE_LIMIT_KV, key, config);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', result.reset.toString());

    if (!result.allowed) {
      c.header('Retry-After', result.retryAfter!.toString());
      return c.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded for ${limitType}. Please try again later.`,
          retryAfter: result.retryAfter,
        },
        429
      );
    }

    await next();
  };
}

/**
 * Global rate limiting middleware (applied to all requests)
 */
export function globalRateLimit() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const config = RATE_LIMITS.global;
    const clientIp = getClientIp(c);
    const key = `ratelimit:global:${clientIp}`;

    const result = await slidingWindowLimit(c.env.RATE_LIMIT_KV, key, config);

    // Set global rate limit headers
    c.header('X-Global-RateLimit-Limit', result.limit.toString());
    c.header('X-Global-RateLimit-Remaining', result.remaining.toString());
    c.header('X-Global-RateLimit-Reset', result.reset.toString());

    if (!result.allowed) {
      c.header('Retry-After', result.retryAfter!.toString());
      return c.json(
        {
          error: 'Too Many Requests',
          message: 'Global rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
        },
        429
      );
    }

    await next();
  };
}
