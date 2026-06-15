import { handleRpcRequest } from './rpc/handler';
import { MempoolDO } from './services/mempool';
import type { Env } from './types';

export { MempoolDO };

// ============================================================
// DEFI-08 FIX: Rate Limiter using Cloudflare cf-connecting-ip
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

/**
 * DEFI-08 FIX: Extract client IP safely.
 * Uses cf-connecting-ip (set by Cloudflare) instead of X-Forwarded-For
 * which can be spoofed by clients.
 */
function getClientIp(request: Request): string {
  // Cloudflare sets this header and it cannot be spoofed by clients
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Fallback: use a fixed identifier when no trusted proxy header is present
  // This is safe because without a trusted proxy header, we treat all requests
  // as coming from the same source (conservative approach)
  return 'unknown-proxy';
}

/**
 * DEFI-08 FIX: Simple in-memory rate limiter.
 * Returns true if the request should be allowed, false if rate-limited.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================
// DEFI-06 FIX: Authentication (production-hardened)
// ============================================================

/**
 * DEFI-06 FIX: Verify API key from request headers.
 * 
 * PRODUCTION HARDENING:
 * - BUNDLER_SKIP_AUTH is COMPLETELY DISABLED in production (NODE_ENV=production)
 * - No environment variable or header can bypass authentication in production
 * - If no API keys are configured, ALL requests are rejected (fail-secure)
 */
function verifyApiKey(request: Request, env: Env): boolean {
  const nodeEnv = env.NODE_ENV || 'production';

  // DEFI-06: In production, SKIP_AUTH is FORBIDDEN regardless of any config
  // No BUNDLER_SKIP_AUTH env var, no X-Bundler-Skip-Auth header — nothing bypasses auth
  if (nodeEnv === 'production') {
    // Production: strict API key validation only, no exceptions
    return validateApiKey(request, env);
  }

  // Non-production: allow skip only if explicitly configured and no keys are set
  if (nodeEnv !== 'production') {
    const skipAuth = request.headers.get('X-Bundler-Skip-Auth');
    if (skipAuth === 'true' && !env.BUNDLER_API_KEYS) {
      return true;
    }
  }

  return validateApiKey(request, env);
}

/**
 * Validate API key against configured allowed keys.
 * Fail-secure: if no keys configured, reject all requests.
 */
function validateApiKey(request: Request, env: Env): boolean {
  const apiKeysEnv = env.BUNDLER_API_KEYS;
  if (!apiKeysEnv) {
    // No keys configured = reject all (fail secure)
    return false;
  }

  const allowedKeys = apiKeysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);
  if (allowedKeys.length === 0) {
    return false;
  }

  // Check Authorization: Bearer <key>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7).trim();
    if (allowedKeys.includes(key)) {
      return true;
    }
  }

  // Check X-API-Key: <key>
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    const key = apiKeyHeader.trim();
    if (allowedKeys.includes(key)) {
      return true;
    }
  }

  return false;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // DEFI-08: Rate limiting before authentication
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32005,
            message: 'Rate limit exceeded. Please try again later.',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Retry-After': '60',
          },
        }
      );
    }

    // DEFI-06: Verify API key before processing request
    if (!verifyApiKey(request, env)) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000,
            message: 'Unauthorized: Invalid or missing API key',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    try {
      const body = await request.json();
      const result = await handleRpcRequest(body, env);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal error';
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
