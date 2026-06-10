import { createServer, type Server, IncomingMessage, ServerResponse } from 'http';
import { Agent } from 'http';
import { logger } from '@cinacoin/logger';

export interface RpcProxyConfig {
  port: number;
  host?: string;
  /** Map of chain name → RPC URL */
  chains: Record<string, string>;
  /** Default chain for requests without chain routing */
  defaultChain?: string;
  /** Cache TTL in milliseconds (0 = disabled) */
  cacheTtlMs?: number;
  /** Max requests per IP per minute (0 = disabled) */
  rateLimitPerMinute?: number;
  /** Maximum request body size in bytes (default 1 MB) */
  maxBodySize?: number;
  /** Allowed request origin patterns (empty = all allowed) */
  allowedOrigins?: string[] | RegExp;
  /** Enable request batching (default: true) */
  enableBatching?: boolean;
  /** Maximum batch size (default: 20) */
  maxBatchSize?: number;
  /** Connection pool max sockets per host (default: 10) */
  maxSocketsPerHost?: number;
  /** Connection pool max total sockets (default: 50) */
  maxTotalSockets?: number;
  /** Enable request deduplication (default: true) */
  enableDeduplication?: boolean;
}

interface CacheEntry {
  response: unknown;
  timestamp: number;
  accessCount: number;
}

interface RateEntry {
  count: number;
  resetAt: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/** Check whether the given Origin header matches the allowed patterns. */
function isOriginAllowed(origin: string | undefined, allowed: string[] | RegExp): boolean {
  if (!origin) return false;
  if (Array.isArray(allowed)) {
    return allowed.some((pattern) => {
      if (pattern.startsWith('*')) {
        const suffix = pattern.slice(1);
        return origin.endsWith(suffix);
      }
      return origin === pattern;
    });
  }
  return allowed.test(origin);
}

/** All started rpc-proxy instances (for signal handling). */
const allInstances: RpcProxy[] = [];

/**
 * RpcProxy — Multi-chain RPC proxy with routing, caching, connection pooling,
 * request batching, and rate limiting.
 * Forwards JSON-RPC requests to the appropriate chain backend.
 */
export class RpcProxy {
  private server: Server | null = null;
  /** When true, reject new requests during shutdown. */
  private shuttingDown = false;
  /** Map of in-flight request resolvers for drain tracking. */
  private inFlight: Set<Promise<unknown>> = new Set();
  
  // LRU Cache with access tracking
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize = 1000;
  
  private rateLimits: Map<string, RateEntry> = new Map();
  private startTime: number = Date.now();
  
  // Connection pooling
  private connectionPools: Map<string, Agent> = new Map();
  
  // Request deduplication
  private pendingRequests: Map<string, PendingRequest> = new Map();
  
  // Performance metrics
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    requestsDeduplicated: 0,
    batchesProcessed: 0,
    totalRequests: 0,
  };
  
  private readonly config: Required<Omit<RpcProxyConfig, 'allowedOrigins'>> &
    Pick<RpcProxyConfig, 'allowedOrigins'>;

  constructor(config: RpcProxyConfig) {
    this.config = {
      port: config.port,
      host: config.host ?? '0.0.0.0',
      chains: config.chains,
      defaultChain: config.defaultChain ?? Object.keys(config.chains)[0] ?? 'mainnet',
      cacheTtlMs: config.cacheTtlMs ?? 30000, // 30s default
      rateLimitPerMinute: config.rateLimitPerMinute ?? 100,
      maxBodySize: config.maxBodySize ?? 1_048_576, // 1 MB
      allowedOrigins: config.allowedOrigins,
      enableBatching: config.enableBatching ?? true,
      maxBatchSize: config.maxBatchSize ?? 20,
      maxSocketsPerHost: config.maxSocketsPerHost ?? 10,
      maxTotalSockets: config.maxTotalSockets ?? 50,
      enableDeduplication: config.enableDeduplication ?? true,
    };
    
    // Initialize connection pools for each chain
    this.initializeConnectionPools();
  }
  
  private initializeConnectionPools(): void {
    for (const [chainName, rpcUrl] of Object.entries(this.config.chains)) {
      try {
        const url = new URL(rpcUrl);
        const agent = new Agent({
          keepAlive: true,
          keepAliveMsecs: 30000,
          maxSockets: this.config.maxSocketsPerHost,
          maxTotalSockets: this.config.maxTotalSockets,
          maxFreeSockets: 5,
          timeout: 30000,
        });
        this.connectionPools.set(chainName, agent);
      } catch (err) {
        logger.error(`Failed to create connection pool for ${chainName}:`, err);
      }
    }
  }

  /** Start the proxy server */
  async start(): Promise<void> {
    this.server = createServer(this.handleRequest.bind(this));
    const hostname = this.config.host;
    return new Promise<void>((resolve, reject) => {
      this.server!.listen(this.config.port, hostname, () => resolve());
      this.server!.on('error', reject);
    }).then(() => {
      allInstances.push(this);
    });
  }

  /** Stop the proxy server */
  async stop(): Promise<void> {
    // Destroy all connection pools
    for (const agent of this.connectionPools.values()) {
      agent.destroy();
    }
    this.connectionPools.clear();
    
    return new Promise((resolve, reject) => {
      this.server?.close((err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Graceful shutdown handler:
   * 1. Logs "Shutting down..."
   * 2. Stops accepting new connections
   * 3. Waits for in-flight requests (up to 10 s timeout)
   * 4. Closes server / connections
   * 5. Exits with code 0
   */
  async gracefulShutdown(): Promise<void> {
    logger.info('Shutting down...');
    this.shuttingDown = true;

    // Stop accepting new connections
    this.server?.closeAllConnections?.();

    // Wait up to 10 s for in-flight requests to complete
    const deadline = Date.now() + 10_000;
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (this.inFlight.size === 0 || Date.now() >= deadline) resolve();
        else setTimeout(tick, 50);
      };
      tick();
    });

    await this.stop();
    process.exit(0);
  }

  /** Get configured chains */
  getChains(): Record<string, string> {
    return { ...this.config.chains };
  }
  
  /** Get performance metrics */
  getMetrics(): Record<string, number> {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheHitRate: this.metrics.totalRequests > 0 
        ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
        : 0,
      pendingRequests: this.pendingRequests.size,
      uptime: Date.now() - this.startTime,
    };
  }

  /** Forward a JSON-RPC request to a specific chain */
  async forwardRpc(chain: string, body: unknown): Promise<unknown> {
    this.metrics.totalRequests++;
    
    const rpcUrl = this.config.chains[chain];
    if (!rpcUrl) {
      throw new Error(`Unknown chain: ${chain}`);
    }

    const bodyStr = JSON.stringify(body);
    const cacheKey = `${chain}:${bodyStr}`;

    // Check cache for read-only methods
    if (this.config.cacheTtlMs > 0 && this.isReadOnly(body)) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTtlMs) {
        this.metrics.cacheHits++;
        cached.accessCount++;
        return cached.response;
      }
      this.metrics.cacheMisses++;
    }
    
    // Request deduplication for in-flight requests
    if (this.config.enableDeduplication && this.isReadOnly(body)) {
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        this.metrics.requestsDeduplicated++;
        return new Promise((resolve, reject) => {
          // Chain this request to the pending one
          pending.resolve = resolve;
          pending.reject = reject;
        });
      }
      
      // Mark this request as pending
      const pendingRequest: PendingRequest = {
        resolve: () => {},
        reject: () => {},
        timestamp: Date.now(),
      };
      this.pendingRequests.set(cacheKey, pendingRequest);
    }

    try {
      const response = await this.fetchWithPool(chain, rpcUrl, bodyStr);

      if (!response.ok) {
        throw new Error(`RPC error from ${chain}: ${response.status}`);
      }

      const result = await response.json();

      // Cache read-only responses
      if (this.config.cacheTtlMs > 0 && this.isReadOnly(body)) {
        this.setCacheEntry(cacheKey, result);
      }
      
      // Resolve any pending deduplicated requests
      if (this.config.enableDeduplication && this.isReadOnly(body)) {
        const pending = this.pendingRequests.get(cacheKey);
        if (pending) {
          pending.resolve(result);
          this.pendingRequests.delete(cacheKey);
        }
      }

      return result;
    } catch (error) {
      // Reject pending deduplicated requests
      if (this.config.enableDeduplication && this.isReadOnly(body)) {
        const pending = this.pendingRequests.get(cacheKey);
        if (pending) {
          pending.reject(error as Error);
          this.pendingRequests.delete(cacheKey);
        }
      }
      throw error;
    }
  }
  
  /** Fetch with connection pooling */
  private async fetchWithPool(chain: string, url: string, body: string): Promise<Response> {
    const agent = this.connectionPools.get(chain);
    
    return fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body,
      // @ts-ignore - Node.js fetch supports agent
      agent: agent || undefined,
    });
  }
  
  /** Set cache entry with LRU eviction */
  private setCacheEntry(key: string, value: unknown): void {
    // Evict least recently used if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      response: value,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }
  
  /** Evict least recently used cache entries */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    // Remove bottom 10%
    const toRemove = Math.ceil(this.maxCacheSize * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private isReadOnly(body: unknown): boolean {
    if (typeof body !== 'object' || body === null) return false;
    
    // Handle batch requests
    if (Array.isArray(body)) {
      return body.every(item => this.isSingleRequestReadOnly(item));
    }
    
    return this.isSingleRequestReadOnly(body);
  }
  
  private isSingleRequestReadOnly(body: Record<string, unknown>): boolean {
    const method = body.method;
    if (typeof method !== 'string') return false;
    // Cache eth_call, eth_blockNumber, eth_getBalance, etc.
    return method.startsWith('eth_get') || 
           method === 'eth_call' || 
           method === 'eth_blockNumber' ||
           method === 'eth_chainId' ||
           method === 'net_version';
  }

  private pruneCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.cacheTtlMs) {
        this.cache.delete(key);
      }
    }
  }

  private checkRateLimit(ip: string): boolean {
    if (this.config.rateLimitPerMinute === 0) return true;
    const entry = this.rateLimits.get(ip);
    const now = Date.now();
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (entry.count >= this.config.rateLimitPerMinute) return false;
    entry.count++;
    return true;
  }

  /** Send a JSON error response */
  private sendError(res: ServerResponse, status: number, message: string, id: unknown = null): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message }, id }));
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    if (this.shuttingDown) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server is shutting down' }));
      return;
    }
    // Security headers
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'no-referrer');

    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
      const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        uptime: uptimeSec,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }));
      return;
    }
    
    // Metrics endpoint
    if (req.method === 'GET' && req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getMetrics()));
      return;
    }

    // Origin validation (CORS preflight + regular requests)
    const allowed = this.config.allowedOrigins;
    const origin = req.headers.origin;
    if (allowed && !isOriginAllowed(origin, allowed)) {
      this.sendError(res, 403, 'Forbidden: origin not allowed');
      return;
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Chain-Id');
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end('Method Not Allowed');
      return;
    }

    const ip = req.socket.remoteAddress ?? 'unknown';
    if (!this.checkRateLimit(ip)) {
      this.sendError(res, 429, 'Rate limit exceeded');
      return;
    }

    let bodyBytes = 0;
    let body = '';

    req.on('data', (chunk: Buffer) => {
      bodyBytes += chunk.byteLength;
      if (bodyBytes > this.config.maxBodySize) {
        req.destroy();
        this.sendError(res, 413, 'Request body too large');
        return;
      }
      body += chunk;
    });

    req.on('end', async () => {
      if (res.writableEnded) return; // already errored

      // Track in-flight request for graceful drain
      const task = (async () => {
        try {
          const chain = this.resolveChain(req);
          const parsed = JSON.parse(body);
          
          // Handle batch requests
          if (this.config.enableBatching && Array.isArray(parsed)) {
            this.metrics.batchesProcessed++;
            
            if (parsed.length > this.config.maxBatchSize) {
              this.sendError(res, 400, `Batch size exceeds maximum of ${this.config.maxBatchSize}`);
              return;
            }
            
            const results = await Promise.all(
              parsed.map(item => this.forwardRpc(chain, item))
            );
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (origin && allowed) {
              res.setHeader('Access-Control-Allow-Origin', origin);
            }
            res.end(JSON.stringify(results));
          } else {
            const result = await this.forwardRpc(chain, parsed);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (origin && allowed) {
              res.setHeader('Access-Control-Allow-Origin', origin);
            }
            res.end(JSON.stringify(result));
          }
        } catch (err) {
          const errMsg = (err as Error).message;
          const isJsonErr = errMsg.startsWith('Unexpected token') || errMsg.startsWith('Unexpected end');
          if (isJsonErr || errMsg.includes('JSON')) {
            this.sendError(res, 400, 'Invalid JSON');
          } else {
            this.sendError(res, 502, errMsg);
          }
        }
      })();
      this.inFlight.add(task);
      void task.finally(() => this.inFlight.delete(task));
    });

    req.on('error', () => {
      // Connection error — nothing to respond
    });
  }

  private resolveChain(req: IncomingMessage): string {
    // Try X-Chain-Id header first, then fall back to default
    const chainHeader = req.headers['x-chain-id'];
    if (chainHeader && this.config.chains[chainHeader as string]) {
      return chainHeader as string;
    }
    return this.config.defaultChain;
  }
}

// ---- Process signal handling ----
let globalShuttingDown = false;

const handleShutdown = async () => {
  if (globalShuttingDown) return;
  globalShuttingDown = true;

  for (const srv of allInstances) {
    await srv.gracefulShutdown();
  }
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
