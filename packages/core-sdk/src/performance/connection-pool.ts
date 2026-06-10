/**
 * Cinacoin Core SDK — Connection Pool & Transport Optimizations
 *
 * Provides HTTP connection pooling, request deduplication,
 * and transport-level performance optimizations.
 */

import { ResultCache, RequestBatcher, type CacheOptions } from './optimization.js';

// ─── Connection Pool ─────────────────────────────────────────────────

export interface ConnectionPoolConfig {
  /** Maximum concurrent connections per host. Default: 6. */
  maxConnectionsPerHost?: number;
  /** Maximum total concurrent connections. Default: 20. */
  maxTotalConnections?: number;
  /** Connection timeout in ms. Default: 10000. */
  connectionTimeout?: number;
  /** Request timeout in ms. Default: 30000. */
  requestTimeout?: number;
  /** Enable keep-alive. Default: true. */
  keepAlive?: boolean;
  /** Keep-alive timeout in ms. Default: 60000. */
  keepAliveTimeout?: number;
  /** Enable request deduplication. Default: true. */
  deduplicate?: boolean;
  /** Cache options for response caching. */
  cache?: CacheOptions;
}

interface PoolEntry {
  active: number;
  queue: Array<() => void>;
}

/**
 * HTTP Connection Pool with request deduplication and response caching.
 *
 * Usage:
 * ```ts
 * const pool = new ConnectionPool({
 *   maxConnectionsPerHost: 6,
 *   maxTotalConnections: 20,
 *   deduplicate: true,
 *   cache: { ttl: 5000, maxSize: 100 },
 * });
 *
 * const response = await pool.fetch('https://rpc.cinacoin.com', {
 *   method: 'POST',
 *   body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber' }),
 * });
 * ```
 */
export class ConnectionPool {
  private _config: Required<ConnectionPoolConfig>;
  private _pools = new Map<string, PoolEntry>();
  private _totalActive = 0;
  private _cache: ResultCache<string, Response>;
  private _inflight = new Map<string, Promise<Response>>();
  private _batcher: RequestBatcher<string, Response> | null = null;

  constructor(config: ConnectionPoolConfig = {}) {
    this._config = {
      maxConnectionsPerHost: config.maxConnectionsPerHost ?? 6,
      maxTotalConnections: config.maxTotalConnections ?? 20,
      connectionTimeout: config.connectionTimeout ?? 10000,
      requestTimeout: config.requestTimeout ?? 30000,
      keepAlive: config.keepAlive ?? true,
      keepAliveTimeout: config.keepAliveTimeout ?? 60000,
      deduplicate: config.deduplicate ?? true,
      cache: config.cache ?? { ttl: 5000, maxSize: 100 },
    };

    this._cache = new ResultCache<string, Response>(this._config.cache);
  }

  /**
   * Make a fetch request through the connection pool.
   */
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const cacheKey = this._getCacheKey(url, init);

    // Check cache first (only for GET requests)
    if (!init?.method || init.method === 'GET') {
      const cached = this._cache.get(cacheKey);
      if (cached) {
        return cached.clone();
      }
    }

    // Request deduplication
    if (this._config.deduplicate) {
      const inflight = this._inflight.get(cacheKey);
      if (inflight) {
        return inflight.then((r) => r.clone());
      }
    }

    // Execute through pool
    const host = new URL(url).host;
    const promise = this._executeWithPool(host, async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this._config.requestTimeout);

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        // Cache successful GET responses
        if ((!init?.method || init.method === 'GET') && response.ok) {
          this._cache.set(cacheKey, response.clone());
        }

        return response;
      } finally {
        clearTimeout(timeout);
      }
    });

    // Track inflight requests for deduplication
    if (this._config.deduplicate) {
      this._inflight.set(cacheKey, promise);
      promise.finally(() => this._inflight.delete(cacheKey));
    }

    return promise;
  }

  /**
   * Execute a function within pool constraints.
   */
  private async _executeWithPool<T>(host: string, fn: () => Promise<T>): Promise<T> {
    // Get or create pool entry for this host
    let pool = this._pools.get(host);
    if (!pool) {
      pool = { active: 0, queue: [] };
      this._pools.set(host, pool);
    }

    // Wait if at capacity
    if (
      pool.active >= this._config.maxConnectionsPerHost ||
      this._totalActive >= this._config.maxTotalConnections
    ) {
      await new Promise<void>((resolve) => {
        pool!.queue.push(resolve);
      });
    }

    pool.active++;
    this._totalActive++;

    try {
      return await fn();
    } finally {
      pool.active--;
      this._totalActive--;

      // Process queued requests
      if (pool.queue.length > 0) {
        const next = pool.queue.shift();
        next?.();
      }
    }
  }

  /**
   * Generate a cache key for request deduplication.
   */
  private _getCacheKey(url: string, init?: RequestInit): string {
    const method = init?.method || 'GET';
    const body = init?.body ? String(init.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Clear the response cache.
   */
  clearCache(): void {
    this._cache.clear();
  }

  /**
   * Get pool statistics.
   */
  getStats(): {
    totalActive: number;
    hosts: number;
    cacheSize: number;
    inflightRequests: number;
  } {
    return {
      totalActive: this._totalActive,
      hosts: this._pools.size,
      cacheSize: this._cache.size,
      inflightRequests: this._inflight.size,
    };
  }

  /**
   * Destroy the pool, rejecting all queued requests.
   */
  destroy(): void {
    for (const pool of this._pools.values()) {
      for (const resolve of pool.queue) {
        resolve();
      }
      pool.queue = [];
    }
    this._pools.clear();
    this._cache.clear();
    this._inflight.clear();
  }
}

// ─── Request Interceptor ─────────────────────────────────────────────

export interface RequestInterceptor {
  /** Called before each request. Return modified init or undefined. */
  onRequest?: (url: string, init: RequestInit) => RequestInit | Promise<RequestInit>;
  /** Called after each response. Return modified response or undefined. */
  onResponse?: (response: Response) => Response | Promise<Response>;
  /** Called on request error. */
  onError?: (error: Error, url: string) => void;
}

/**
 * Create a fetch wrapper with interceptor support.
 */
export function createInterceptedFetch(
  baseFetch: typeof fetch,
  interceptors: RequestInterceptor[]
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    let requestInit = init || {};

    // Apply request interceptors
    for (const interceptor of interceptors) {
      if (interceptor.onRequest) {
        requestInit = await interceptor.onRequest(url, requestInit);
      }
    }

    try {
      let response = await baseFetch(url, requestInit);

      // Apply response interceptors
      for (const interceptor of interceptors) {
        if (interceptor.onResponse) {
          response = await interceptor.onResponse(response);
        }
      }

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      for (const interceptor of interceptors) {
        if (interceptor.onError) {
          interceptor.onError(err, url);
        }
      }
      throw err;
    }
  };
}

// ─── Retry Logic ─────────────────────────────────────────────────────

export interface RetryConfig {
  /** Maximum number of retries. Default: 3. */
  maxRetries?: number;
  /** Base delay in ms. Default: 100. */
  baseDelay?: number;
  /** Maximum delay in ms. Default: 5000. */
  maxDelay?: number;
  /** HTTP status codes to retry. Default: [408, 429, 500, 502, 503, 504]. */
  retryStatuses?: number[];
  /** Whether to use exponential backoff. Default: true. */
  exponentialBackoff?: boolean;
}

/**
 * Create a fetch wrapper with automatic retry logic.
 */
export function createRetryFetch(
  baseFetch: typeof fetch,
  config: RetryConfig = {}
): typeof fetch {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 5000,
    retryStatuses = [408, 429, 500, 502, 503, 504],
    exponentialBackoff = true,
  } = config;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await baseFetch(input, init);

        // Don't retry successful responses
        if (response.ok || !retryStatuses.includes(response.status)) {
          return response;
        }

        // Check for Retry-After header (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const delay = parseInt(retryAfter, 10) * 1000;
            if (!isNaN(delay) && delay > 0) {
              await sleep(Math.min(delay, maxDelay));
              continue;
            }
          }
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= maxRetries) {
          return response;
        }

        // Calculate delay with exponential backoff + jitter
        const delay = exponentialBackoff
          ? Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 100, maxDelay)
          : baseDelay;

        await sleep(delay);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if we've exhausted attempts
        if (attempt >= maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff + jitter
        const delay = exponentialBackoff
          ? Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 100, maxDelay)
          : baseDelay;

        await sleep(delay);
      }
    }

    throw lastError || new Error('Retry failed');
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Exports ─────────────────────────────────────────────────────────

export type { CacheOptions } from './optimization.js';
