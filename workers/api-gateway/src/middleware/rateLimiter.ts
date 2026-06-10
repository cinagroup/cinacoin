/**
 * Enhanced Rate Limiter with Per-User, Per-IP, and Per-Endpoint Limiting
 * Implements sliding window algorithm with Redis/KV storage
 */
import { Context, Next } from 'hono';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Rate limit configurations
export const RATE_LIMITS = {
  // Global limits
  global: {
    perIP: { limit: 1000, windowMs: 3600000 },      // 1000/hour per IP
    perUser: { limit: 5000, windowMs: 3600000 },    // 5000/hour per user
  },

  // Authentication endpoints (strict)
  auth: {
    perIP: { limit: 10, windowMs: 60000 },          // 10/minute per IP
    perUser: { limit: 20, windowMs: 60000 },        // 20/minute per user
  },

  // API endpoints (moderate)
  api: {
    perIP: { limit: 300, windowMs: 60000 },         // 300/minute per IP
    perUser: { limit: 1000, windowMs: 60000 },      // 1000/minute per user
  },

  // Transaction endpoints (very strict)
  transaction: {
    perIP: { limit: 30, windowMs: 60000 },          // 30/minute per IP
    perUser: { limit: 50, windowMs: 60000 },        // 50/minute per user
  },

  // WebSocket connections
  websocket: {
    perIP: { limit: 50, windowMs: 60000 },          // 50 connections/minute per IP
    perUser: { limit: 100, windowMs: 60000 },       // 100 connections/minute per user
  },
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

  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

/**
 * Get user ID from request (JWT, session, API key)
 */
export function getUserId(c: Context): string | null {
  // Try Authorization header (Bearer token)
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // In production, decode JWT and extract user ID
    // For now, use token hash as identifier
    return `user:${authHeader.slice(7, 27)}`;
  }

  // Try API key
  const apiKey = c.req.header('X-API-Key');
  if (apiKey) {
    return `apikey:${apiKey.slice(0, 16)}`;
  }

  // Try session cookie
  const session = c.req.header('Cookie')?.match(/session=([^;]+)/);
  if (session) {
    return `session:${session[1].slice(0, 16)}`;
  }

  return null;
}

/**
 * Sliding window rate limit algorithm using KV storage
 */
async function slidingWindowLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing timestamps in window
  const existing = await kv.get(key, 'json');
  const timestamps: number[] = existing ? (existing as number[]) : [];

  // Filter to only timestamps within window
  const validTimestamps = timestamps.filter((ts) => ts > windowStart);

  const current = validTimestamps.length;
  const allowed = current < config.limit;

  if (allowed) {
    validTimestamps.push(now);
    await kv.put(key, JSON.stringify(validTimestamps), {
      expirationTtl: Math.ceil(config.windowMs / 1000) + 60,
    });
  }

  const remaining = Math.max(0, config.limit - validTimestamps.length);
  const reset = Math.ceil((now + config.windowMs) / 1000);

  return {
    allowed,
    limit: config.limit,
    remaining,
    reset,
    retryAfter: !allowed ? Math.ceil(config.windowMs / 1000) : undefined,
  };
}

/**
 * Apply rate limit headers to response
 */
function applyRateLimitHeaders(
  c: Context,
  result: RateLimitResult,
  prefix: string = 'X-RateLimit'
) {
  c.header(`${prefix}-Limit`, result.limit.toString());
  c.header(`${prefix}-Remaining`, result.remaining.toString());
  c.header(`${prefix}-Reset`, result.reset.toString());

  if (!result.allowed && result.retryAfter) {
    c.header('Retry-After', result.retryAfter.toString());
  }
}

/**
 * Per-IP rate limiting middleware
 */
export function perIPRateLimit(limitType: RateLimitType = 'global') {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const config = RATE_LIMITS[limitType].perIP;
    const clientIp = getClientIp(c);
    const key = `ratelimit:${limitType}:ip:${clientIp}`;

    const result = await slidingWindowLimit(c.env.RATE_LIMIT_KV, key, config);
    applyRateLimitHeaders(c, result, 'X-RateLimit-IP');

    if (!result.allowed) {
      return c.json(
        {
          error: 'Too Many Requests',
          message: `IP rate limit exceeded for ${limitType}. Please try again later.`,
          retryAfter: result.retryAfter,
        },
        429
      );
    }

    await next();
  };
}

/**
 * Per-user rate limiting middleware
 */
export function perUserRateLimit(limitType: RateLimitType = 'global') {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const userId = getUserId(c);
    if (!userId) {
      // Skip user rate limiting if no user identified
      await next();
      return;
    }

    const config = RATE_LIMITS[limitType].perUser;
    const key = `ratelimit:${limitType}:user:${userId}`;

    const result = await slidingWindowLimit(c.env.RATE_LIMIT_KV, key, config);
    applyRateLimitHeaders(c, result, 'X-RateLimit-User');

    if (!result.allowed) {
      return c.json(
        {
          error: 'Too Many Requests',
          message: `User rate limit exceeded for ${limitType}. Please try again later.`,
          retryAfter: result.retryAfter,
        },
        429
      );
    }

    await next();
  };
}

/**
 * Per-endpoint rate limiting middleware
 */
export function perEndpointRateLimit(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const endpoint = c.req.path;
    const clientIp = getClientIp(c);
    const key = `ratelimit:endpoint:${endpoint}:${clientIp}`;

    const result = await slidingWindowLimit(c.env.RATE_LIMIT_KV, key, config);
    applyRateLimitHeaders(c, result, 'X-RateLimit-Endpoint');

    if (!result.allowed) {
      return c.json(
        {
          error: 'Too Many Requests',
          message: `Endpoint rate limit exceeded. Please try again later.`,
          retryAfter: result.retryAfter,
        },
        429
      );
    }

    await next();
  };
}

/**
 * Combined rate limiter (IP + User)
 */
export function combinedRateLimit(limitType: RateLimitType = 'global') {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const clientIp = getClientIp(c);
    const userId = getUserId(c);

    // Check IP limit first
    const ipConfig = RATE_LIMITS[limitType].perIP;
    const ipKey = `ratelimit:${limitType}:ip:${clientIp}`;
    const ipResult = await slidingWindowLimit(c.env.RATE_LIMIT_KV, ipKey, ipConfig);
    applyRateLimitHeaders(c, ipResult, 'X-RateLimit-IP');

    if (!ipResult.allowed) {
      return c.json(
        {
          error: 'Too Many Requests',
          message: `IP rate limit exceeded. Please try again later.`,
          retryAfter: ipResult.retryAfter,
        },
        429
      );
    }

    // Check user limit if authenticated
    if (userId) {
      const userConfig = RATE_LIMITS[limitType].perUser;
      const userKey = `ratelimit:${limitType}:user:${userId}`;
      const userResult = await slidingWindowLimit(c.env.RATE_LIMIT_KV, userKey, userConfig);
      applyRateLimitHeaders(c, userResult, 'X-RateLimit-User');

      if (!userResult.allowed) {
        return c.json(
          {
            error: 'Too Many Requests',
            message: `User rate limit exceeded. Please try again later.`,
            retryAfter: userResult.retryAfter,
          },
          429
        );
      }
    }

    await next();
  };
}

/**
 * Global rate limiting middleware (applied to all requests)
 */
export function globalRateLimit() {
  return combinedRateLimit('global');
}

/**
 * Endpoint-specific rate limiters
 */
export const authRateLimit = combinedRateLimit('auth');
export const apiRateLimit = combinedRateLimit('api');
export const transactionRateLimit = combinedRateLimit('transaction');
export const websocketRateLimit = combinedRateLimit('websocket');

/**
 * Legacy compatibility - withRateLimit for existing code
 */
export function withRateLimit(limitType: Exclude<RateLimitType, 'global'>) {
  return combinedRateLimit(limitType);
}
