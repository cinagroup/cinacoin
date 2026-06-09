import { createMiddleware } from 'hono/factory';
import type { Env, RequestContext, RateLimitConfig } from '../lib/types';
import { RateLimitError } from '../lib/errors';

/**
 * Rate limiting middleware using KV storage
 * Implements sliding window rate limiting
 */
export const rateLimiter = (config: RateLimitConfig) => {
  return createMiddleware<{
    Bindings: Env;
    Variables: { context: RequestContext };
  }>(async (c, next) => {
    const context = c.get('context');
    const key = `${config.keyPrefix || 'rate_limit'}:${context.clientIp}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current window data from KV
    const windowData = await c.env.RATE_LIMIT_KV.get(key, 'json');
    const requests: number[] = windowData?.requests || [];

    // Filter out old requests outside the window
    const validRequests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if rate limit exceeded
    if (validRequests.length >= config.limit) {
      const retryAfter = Math.ceil((validRequests[0] + config.windowMs - now) / 1000);
      
      c.header('X-RateLimit-Limit', String(config.limit));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(Math.ceil((validRequests[0] + config.windowMs) / 1000)));
      c.header('Retry-After', String(retryAfter));

      throw new RateLimitError('Rate limit exceeded', {
        limit: config.limit,
        window: `${config.windowMs / 1000}s`,
        retryAfter,
      });
    }

    // Add current request timestamp
    validRequests.push(now);

    // Store updated window data with expiration
    await c.env.RATE_LIMIT_KV.put(
      key,
      JSON.stringify({ requests: validRequests }),
      { expirationTtl: Math.ceil(config.windowMs / 1000) }
    );

    // Set rate limit headers
    const remaining = Math.max(0, config.limit - validRequests.length);
    c.header('X-RateLimit-Limit', String(config.limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil((now + config.windowMs) / 1000)));

    await next();
  });
};

/**
 * Tiered rate limiter
 * Applies different limits based on authentication status
 */
export const tieredRateLimiter = createMiddleware<{
  Bindings: Env;
  Variables: { context: RequestContext };
}>(async (c, next) => {
  const context = c.get('context');
  
  // Determine rate limit based on authentication
  let config: RateLimitConfig;
  
  if (context.apiKeyId || context.projectId) {
    // Authenticated request
    config = {
      windowMs: 60_000,
      limit: 500,
      keyPrefix: 'rate_limit_auth',
    };
  } else {
    // Unauthenticated request
    config = {
      windowMs: 60_000,
      limit: 100,
      keyPrefix: 'rate_limit_anon',
    };
  }

  // Apply the rate limiter
  const limiter = rateLimiter(config);
  return limiter(c, next);
});
