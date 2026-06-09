/**
 * Rate limiting middleware for Next.js API routes
 * Applies rate limits based on IP address and/or user ID
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  slidingWindowLimit,
  checkRateLimitWithPenalty,
  incrementFailureCount,
  getFailureCount,
  resetFailureCount,
  RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitType,
} from '@/lib/rate-limiter.js';

/** IP whitelist - internal services that bypass rate limiting */
const IP_WHITELIST = new Set(
  (process.env.RATE_LIMIT_WHITELIST_IPS || '').split(',').filter(Boolean)
);

/** API keys that bypass rate limiting */
const API_KEY_WHITELIST = new Set(
  (process.env.RATE_LIMIT_WHITELIST_API_KEYS || '').split(',').filter(Boolean)
);

/**
 * Extract client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return request.headers.get('host') || 'unknown';
}

/**
 * Check if request should bypass rate limiting
 */
function shouldBypass(request: NextRequest, clientIp: string): boolean {
  // Check IP whitelist
  if (IP_WHITELIST.has(clientIp)) {
    return true;
  }

  // Check API key whitelist
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && API_KEY_WHITELIST.has(apiKey)) {
    return true;
  }

  return false;
}

/**
 * Apply rate limit headers to response
 */
function applyRateLimitHeaders(
  response: NextResponse,
  result: { limit: number; remaining: number; reset: number; retryAfter?: number }
): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }
}

/**
 * Create rate limit middleware for a specific route type
 */
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  limitType: RateLimitType,
  options?: {
    useProgressivePenalty?: boolean;
    keyPrefix?: string;
  }
) {
  const config: RateLimitConfig = RATE_LIMITS[limitType];

  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const clientIp = getClientIp(req);

    // Check whitelist bypass
    if (shouldBypass(req, clientIp)) {
      return handler(req, context);
    }

    // Build rate limit key
    const keyPrefix = options?.keyPrefix || `auth:${limitType}`;
    let rateLimitKey = `${keyPrefix}:ip:${clientIp}`;

    // If user is authenticated, also rate limit by user ID
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const [scheme, token] = authHeader.split(' ');
      if (scheme === 'Bearer' && token) {
        rateLimitKey = `${keyPrefix}:user:${token.substring(0, 16)}`;
      }
    }

    // Check rate limit
    let result;
    if (options?.useProgressivePenalty) {
      const failureCount = await getFailureCount(rateLimitKey);
      result = await checkRateLimitWithPenalty(rateLimitKey, config, failureCount);
    } else {
      result = await slidingWindowLimit(rateLimitKey, config);
    }

    // Create response
    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
        },
        { status: 429 }
      );
      applyRateLimitHeaders(response, result);
      return response;
    }

    // Execute handler
    const response = await handler(req, context);
    applyRateLimitHeaders(response, result);
    return response;
  };
}

/**
 * Helper to record a failed authentication attempt
 */
export async function recordAuthFailure(
  request: NextRequest,
  limitType: RateLimitType
): Promise<number> {
  const clientIp = getClientIp(request);
  const key = `auth:${limitType}:ip:${clientIp}`;
  return incrementFailureCount(key);
}

/**
 * Helper to reset failure count on successful auth
 */
export async function recordAuthSuccess(
  request: NextRequest,
  limitType: RateLimitType
): Promise<void> {
  const clientIp = getClientIp(request);
  const key = `auth:${limitType}:ip:${clientIp}`;
  return resetFailureCount(key);
}

/**
 * Standalone rate limit check (for use in route handlers directly)
 */
export async function checkRateLimit(
  request: NextRequest,
  limitType: RateLimitType
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const clientIp = getClientIp(request);

  if (shouldBypass(request, clientIp)) {
    return {
      allowed: true,
      headers: {},
    };
  }

  const key = `auth:${limitType}:ip:${clientIp}`;
  const config = RATE_LIMITS[limitType];
  const result = await slidingWindowLimit(key, config);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return {
    allowed: result.allowed,
    headers,
  };
}
