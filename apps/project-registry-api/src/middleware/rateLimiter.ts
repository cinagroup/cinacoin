import { createMiddleware } from 'hono/factory';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for Cloudflare Workers
const g = globalThis as Record<string, unknown>;
const store: Record<string, RateLimitEntry> = (g._rateLimitStore as Record<string, RateLimitEntry>) || {};
g._rateLimitStore = store;

/**
 * Simple rate limiter middleware for Cloudflare Workers.
 * Limits requests per IP to the configured number per window.
 */
export function createRateLimiter(options: { windowMs: number; limit: number }) {
  return createMiddleware(async (c, next) => {
    const key = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = { count: 1, resetTime: now + options.windowMs };
    } else {
      store[key].count++;
    }

    const remaining = Math.max(0, options.limit - store[key].count);

    c.header('X-RateLimit-Limit', String(options.limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(store[key].resetTime));

    if (store[key].count > options.limit) {
      return c.json({ error: 'Rate limit exceeded. Try again later.' }, 429);
    }

    await next();
  });
}
