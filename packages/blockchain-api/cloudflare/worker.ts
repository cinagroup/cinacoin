/**
 * Blockchain API — Cloudflare Workers implementation
 *
 * Provides cached access to blockchain data (balances, token metadata, etc.)
 * using KV for high-performance edge caching with 60s TTL.
 *
 * Routes:
 *   GET  /v1/balance/:address/:chainId
 *   GET  /v1/token/:address/:chainId
 *   GET  /v1/tokens/:chainId
 *   GET  /health
 *   GET  /metrics
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Env {
  /** KV namespace for caching blockchain data */
  BLOCKCHAIN_CACHE: KVNamespace;
  /** RPC endpoint for blockchain queries */
  RPC_URL?: string;
  /** Rate limit KV */
  RATELIMIT_KV?: KVNamespace;
  /** CORS origins */
  CORS_ORIGINS?: string;
  /** Rate limit max requests per window */
  RATE_LIMIT_MAX?: string;
  /** Rate limit window in seconds */
  RATE_LIMIT_WINDOW?: string;
}

interface BalanceResponse {
  address: string;
  chainId: string;
  balance: string;
  nativeBalance?: string;
  timestamp: number;
}

interface TokenMetadata {
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  timestamp: number;
}

interface MetricsData {
  requestsTotal: number;
  cacheHits: number;
  cacheMisses: number;
  balanceRequests: number;
  tokenRequests: number;
  errors: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_TTL = 60; // 60 seconds
const RATE_LIMIT_DEFAULT = 100;
const RATE_LIMIT_WINDOW_DEFAULT = 60;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(body: object, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function getCorsHeaders(env: Env, origin?: string | null): Record<string, string> {
  const allowedOrigins = env.CORS_ORIGINS || '*';
  let allowOrigin = '*';

  if (allowedOrigins !== '*' && origin) {
    const origins = allowedOrigins.split(',').map((o) => o.trim());
    if (origins.includes(origin)) {
      allowOrigin = origin;
    } else {
      allowOrigin = origins[0] || 'none';
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

async function checkRateLimit(
  env: Env,
  ip: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!env.RATELIMIT_KV) {
    return { allowed: true, remaining: RATE_LIMIT_DEFAULT, resetAt: Date.now() + RATE_LIMIT_WINDOW_DEFAULT * 1000 };
  }

  const maxRequests = parseInt(env.RATE_LIMIT_MAX || String(RATE_LIMIT_DEFAULT), 10);
  const windowSecs = parseInt(env.RATE_LIMIT_WINDOW || String(RATE_LIMIT_WINDOW_DEFAULT), 10);
  const now = Math.floor(Date.now() / 1000);
  const key = `ratelimit:${ip}`;

  const raw = await env.RATELIMIT_KV.get(key, 'json');
  const entry = raw as RateLimitEntry | null;

  if (!entry || now - entry.windowStart >= windowSecs) {
    const newEntry: RateLimitEntry = { count: 1, windowStart: now };
    await env.RATELIMIT_KV.put(key, JSON.stringify(newEntry), {
      expirationTtl: windowSecs + 10,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSecs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowSecs };
  }

  entry.count++;
  await env.RATELIMIT_KV.put(key, JSON.stringify(entry), {
    expirationTtl: windowSecs + 10,
  });
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.windowStart + windowSecs };
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

async function getMetrics(env: Env): Promise<MetricsData> {
  const raw = await env.BLOCKCHAIN_CACHE.get('metrics:global', 'json');
  return (raw as MetricsData) || {
    requestsTotal: 0,
    cacheHits: 0,
    cacheMisses: 0,
    balanceRequests: 0,
    tokenRequests: 0,
    errors: 0,
  };
}

async function incrementMetric(env: Env, field: keyof MetricsData): Promise<void> {
  const metrics = await getMetrics(env);
  (metrics as any)[field]++;
  metrics.requestsTotal++;
  await env.BLOCKCHAIN_CACHE.put('metrics:global', JSON.stringify(metrics));
}

// ─── RPC Client ──────────────────────────────────────────────────────────────

/**
 * Fetch balance for an address from the blockchain via RPC.
 * This is a simplified implementation - in production, you'd use viem or ethers.
 */
async function fetchBalanceFromRpc(
  rpcUrl: string,
  address: string,
  chainId: string
): Promise<BalanceResponse | null> {
  try {
    // Example: Ethereum JSON-RPC eth_getBalance
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    if (!response.ok) {
      console.error('RPC request failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.error('RPC error:', data.error);
      return null;
    }

    return {
      address,
      chainId,
      balance: data.result || '0x0',
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error('Failed to fetch balance from RPC:', err);
    return null;
  }
}

/**
 * Fetch token metadata from the blockchain via RPC.
 * Simplified implementation - would use contract calls in production.
 */
async function fetchTokenMetadataFromRpc(
  rpcUrl: string,
  tokenAddress: string,
  chainId: string
): Promise<TokenMetadata | null> {
  try {
    // In production, you'd call ERC20 contract methods: name(), symbol(), decimals()
    // For now, return a placeholder
    return {
      address: tokenAddress,
      chainId,
      name: 'Unknown Token',
      symbol: '???',
      decimals: 18,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error('Failed to fetch token metadata from RPC:', err);
    return null;
  }
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleHealth(env: Env): Promise<Response> {
  return jsonResponse({
    status: 'ok',
    service: 'blockchain-api',
    platform: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  });
}

async function handleMetrics(env: Env): Promise<Response> {
  const metrics = await getMetrics(env);
  return jsonResponse(metrics);
}

async function handleGetBalance(
  request: Request,
  env: Env,
  address: string,
  chainId: string
): Promise<Response> {
  await incrementMetric(env, 'balanceRequests');

  const cacheKey = `balance:${chainId}:${address.toLowerCase()}`;

  // Try cache first
  const cached = await env.BLOCKCHAIN_CACHE.get(cacheKey, 'json');
  if (cached) {
    await incrementMetric(env, 'cacheHits');
    return jsonResponse(cached, 200, {
      'X-Cache': 'HIT',
      'X-Cache-TTL': String(CACHE_TTL),
    });
  }

  await incrementMetric(env, 'cacheMisses');

  // Fetch from RPC
  const rpcUrl = env.RPC_URL || 'https://cloudflare-eth.com';
  const balance = await fetchBalanceFromRpc(rpcUrl, address, chainId);

  if (!balance) {
    await incrementMetric(env, 'errors');
    return jsonResponse(
      { error: 'rpc_error', message: 'Failed to fetch balance from blockchain' },
      502
    );
  }

  // Cache the result
  await env.BLOCKCHAIN_CACHE.put(cacheKey, JSON.stringify(balance), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(balance, 200, {
    'X-Cache': 'MISS',
    'X-Cache-TTL': String(CACHE_TTL),
  });
}

async function handleGetToken(
  request: Request,
  env: Env,
  tokenAddress: string,
  chainId: string
): Promise<Response> {
  await incrementMetric(env, 'tokenRequests');

  const cacheKey = `token:${chainId}:${tokenAddress.toLowerCase()}`;

  // Try cache first
  const cached = await env.BLOCKCHAIN_CACHE.get(cacheKey, 'json');
  if (cached) {
    await incrementMetric(env, 'cacheHits');
    return jsonResponse(cached, 200, {
      'X-Cache': 'HIT',
      'X-Cache-TTL': String(CACHE_TTL),
    });
  }

  await incrementMetric(env, 'cacheMisses');

  // Fetch from RPC
  const rpcUrl = env.RPC_URL || 'https://cloudflare-eth.com';
  const metadata = await fetchTokenMetadataFromRpc(rpcUrl, tokenAddress, chainId);

  if (!metadata) {
    await incrementMetric(env, 'errors');
    return jsonResponse(
      { error: 'rpc_error', message: 'Failed to fetch token metadata from blockchain' },
      502
    );
  }

  // Cache the result
  await env.BLOCKCHAIN_CACHE.put(cacheKey, JSON.stringify(metadata), {
    expirationTtl: CACHE_TTL,
  });

  return jsonResponse(metadata, 200, {
    'X-Cache': 'MISS',
    'X-Cache-TTL': String(CACHE_TTL),
  });
}

async function handleGetTokens(
  request: Request,
  env: Env,
  chainId: string
): Promise<Response> {
  const cacheKey = `tokens:list:${chainId}`;

  // Try cache first
  const cached = await env.BLOCKCHAIN_CACHE.get(cacheKey, 'json');
  if (cached) {
    await incrementMetric(env, 'cacheHits');
    return jsonResponse(cached, 200, {
      'X-Cache': 'HIT',
      'X-Cache-TTL': String(CACHE_TTL),
    });
  }

  await incrementMetric(env, 'cacheMisses');

  // Return a placeholder list - in production, you'd query a token registry
  const tokens = {
    chainId,
    tokens: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
      { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    ],
    timestamp: Date.now(),
  };

  // Cache the result
  await env.BLOCKCHAIN_CACHE.put(cacheKey, JSON.stringify(tokens), {
    expirationTtl: CACHE_TTL * 10, // 10 minutes for token list
  });

  return jsonResponse(tokens, 200, {
    'X-Cache': 'MISS',
    'X-Cache-TTL': String(CACHE_TTL * 10),
  });
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin');
    const corsHeaders = getCorsHeaders(env, origin);

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(env, clientIp);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.resetAt - Math.floor(Date.now() / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.resetAt - Math.floor(Date.now() / 1000)),
            'X-RateLimit-Limit': env.RATE_LIMIT_MAX || String(RATE_LIMIT_DEFAULT),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
            ...corsHeaders,
          },
        }
      );
    }

    // Route matching
    let response: Response;

    try {
      // Public routes
      if (path === '/health' || path === '/v1/health') {
        response = await handleHealth(env);
      } else if (path === '/metrics') {
        if (method !== 'GET') {
          response = jsonResponse({ error: 'method_not_allowed' }, 405);
        } else {
          response = await handleMetrics(env);
        }
      }
      // Balance route: GET /v1/balance/:address/:chainId
      else if (path.match(/^\/v1\/balance\/0x[a-fA-F0-9]{40}\/\d+$/) && method === 'GET') {
        const parts = path.split('/');
        const address = parts[3];
        const chainId = parts[4];
        response = await handleGetBalance(request, env, address, chainId);
      }
      // Token metadata route: GET /v1/token/:address/:chainId
      else if (path.match(/^\/v1\/token\/0x[a-fA-F0-9]{40}\/\d+$/) && method === 'GET') {
        const parts = path.split('/');
        const tokenAddress = parts[3];
        const chainId = parts[4];
        response = await handleGetToken(request, env, tokenAddress, chainId);
      }
      // Token list route: GET /v1/tokens/:chainId
      else if (path.match(/^\/v1\/tokens\/\d+$/) && method === 'GET') {
        const chainId = path.split('/')[3];
        response = await handleGetTokens(request, env, chainId);
      } else {
        response = jsonResponse({ error: 'not_found', message: 'Route not found' }, 404);
      }
    } catch (err: any) {
      console.error('Handler error:', err);
      await incrementMetric(env, 'errors');
      response = jsonResponse(
        { error: 'internal_error', message: err.message || 'Internal server error' },
        500
      );
    }

    // Add standard headers
    const finalHeaders = new Headers(response.headers);
    finalHeaders.set('X-RateLimit-Limit', env.RATE_LIMIT_MAX || String(RATE_LIMIT_DEFAULT));
    finalHeaders.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    finalHeaders.set('X-RateLimit-Reset', String(rateLimit.resetAt));
    for (const [k, v] of Object.entries(corsHeaders)) {
      finalHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      headers: finalHeaders,
    });
  },
};
