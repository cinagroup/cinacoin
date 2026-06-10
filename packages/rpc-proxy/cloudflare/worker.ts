import { logger } from '@cinacoin/logger';
// Cinacoin RPC Proxy — Cloudflare Worker
// Routes: POST /rpc/:chainId, GET /health, GET /metrics
// Caches read-only JSON-RPC calls in KV with configurable TTL.

// --- Inlined from @cinacoin/config ---
function createLogger(serviceName: string) {
  return {
    debug: (msg: string, ctx?: Record<string, unknown>) => console.debug(`[${serviceName}] ${msg}`, JSON.stringify(ctx)),
    info: (msg: string, ctx?: Record<string, unknown>) => logger.info(`[${serviceName}] ${msg}`, JSON.stringify(ctx)),
    warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(`[${serviceName}] ${msg}`, JSON.stringify(ctx)),
    error: (msg: string, ctx?: Record<string, unknown>) => logger.error(`[${serviceName}] ${msg}`, JSON.stringify(ctx)),
  };
}
function extractRequestId(request: Request): string {
  return request.headers.get('x-request-id')
    || request.headers.get('x-correlation-id')
    || request.headers.get('cf-ray')
    || crypto.randomUUID();
}
// ------------------------------------

const logger = createLogger('rpc-proxy');

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

interface RateEntry { count: number; resetAt: number }
const rateLimits = new Map<string, RateEntry>();

function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown';
}

function checkRate(ip: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

const DEFAULT_RATE_LIMIT = 100; // requests per minute

// ---------------------------------------------------------------------------
// Chain Configuration
// Each entry: primary URL, optional fallback, and chain-specific read-only methods.
// ---------------------------------------------------------------------------

interface ChainConfig {
  url: string;
  fallback?: string;
  readOnlyMethods?: Set<string>;  // chain-specific (union with EVM set for EVM chains)
}

const CHAIN_RPC_URLS: Record<string, string> = {
  "1": "https://rpc.ankr.com/eth",
  "42161": "https://arb1.arbitrum.io/rpc",
  "8453": "https://mainnet.base.org",
  "137": "https://polygon-bor.publicnode.com",
  "10": "https://mainnet.optimism.io",
  "56": "https://bsc-dataseed1.binance.org",
};

const CHAIN_CONFIG: Record<string, ChainConfig> = {
  // --- EVM chains (reuse READ_ONLY_METHODS) ---
  "1":      { url: "https://ethereum.publicnode.com",    fallback: "https://rpc.mevblocker.io" },
  "42161":  { url: "https://arb1.arbitrum.io/rpc",        fallback: "https://arbitrum-one.publicnode.com" },
  "8453":   { url: "https://mainnet.base.org",            fallback: "https://base.publicnode.com" },
  "137":    { url: "https://polygon-bor.publicnode.com",             fallback: "https://polygon-mainnet.public.blastapi.io" },
  "10":     { url: "https://mainnet.optimism.io",         fallback: "https://optimism-mainnet.public.blastapi.io" },
  "56":     { url: "https://bsc-dataseed1.binance.org",   fallback: "https://bsc-dataseed2.binance.org" },

  // --- Solana ---
  "solana": {
    url: "https://api.mainnet-beta.solana.com",
    fallback: "https://solana-rpc.publicnode.com",
    readOnlyMethods: new Set([
      "getAccountInfo", "getBalance", "getBlockHeight", "getBlockProduction",
      "getBlockCommitment", "getBlocks", "getBlocksWithLimit", "getBlockTime",
      "getClusterNodes", "getEpochInfo", "getEpochSchedule", "getFeeForMessage",
      "getFirstAvailableBlock", "getGenesisHash", "getHealth", "getHighestSnapshotSlot",
      "getIdentity", "getInflationGovernor", "getInflationRate", "getInflationReward",
      "getLargestAccounts", "getLatestBlockhash", "getLeaderSchedule", "getMaxRetransmitSlot",
      "getMaxShredInsertSlot", "getMinimumBalanceForRentExemption", "getMultipleAccounts",
      "getProgramAccounts", "getRecentPerformanceSamples", "getRecentPrioritizationFees",
      "getSignaturesForAddress", "getSignatureStatuses", "getSlot", "getSlotLeader",
      "getSlotLeaders", "getStakeActivation", "getStakeMinimumDelegation", "getSupply",
      "getTokenAccountBalance", "getTokenAccountsByDelegate", "getTokenAccountsByOwner",
      "getTokenLargestAccounts", "getTokenSupply", "getTransaction", "getTransactionCount",
      "getVersion", "getVoteAccounts", "isBlockhashValid", "minimumLedgerSlot",
      "requestAirdrop", "simulateTransaction",
    ]),
  },

  // --- TRON ---
  "tron": {
    url: "https://api.trongrid.io",
    fallback: "https://tron-rpc.publicnode.com",
    readOnlyMethods: new Set([
      "wallet/getaccount", "wallet/getbalance", "wallet/getblock",
      "wallet/getblockbyid", "wallet/getblockbylimitnext", "wallet/getblockbylatestnum",
      "wallet/getnowblock", "wallet/gettransactionbyid", "wallet/gettransactioninfobyid",
      "wallet/getcontract", "wallet/triggerconstantcontract",
      "wallet/gettransactioncountbyblocknum", "wallet/listnodes",
      "wallet/getchainparameters", "wallet/getaccountnet", "wallet/getaccountresource",
      "wallet/getdelegatedresource", "wallet/getdelegatedresourceaccountindex",
      "wallet/getblockbalance", "wallet/getbandwidthprices",
    ]),
  },

  // --- TON ---
  "ton": {
    url: "https://toncenter.com/api/v2/jsonRPC",
    fallback: "https://ton.api.onfinality.io/public",
    readOnlyMethods: new Set([
      "getAddressBalance", "getTransactions", "getAddressInformation",
      "getExtendedAddressInformation", "getWalletInformation", "getAddressBook",
      "getMasterchainInfo", "getMasterchainBlockSignatures", "getShardBlockProof",
      "getShardBlockInfo", "getBlockHeader", "getBlockShards", "getShards",
      "getValidatorStats", "tryLocateResultTx", "tryLocateSourceTx",
      "getTokenData", "getWalletTransactions", "estimateFee",
    ]),
  },

  // --- Sui ---
  "sui": {
    url: "https://fullnode.mainnet.sui.io",
    fallback: "https://sui-mainnet.public.blastapi.io",
    readOnlyMethods: new Set([
      "suix_getBalance", "suix_getAllBalances", "suix_getCoinMetadata",
      "suix_getCoins", "suix_getAllCoins", "suix_getTotalSupply",
      "suix_getOwnedObjects", "suix_getDynamicFields", "suix_getDynamicFieldObject",
      "suix_getObject", "suix_multiGetObjects", "suix_getTransactionsBatch",
      "suix_queryTransactionBlocks", "suix_queryEvents", "suix_resolveNameServiceNames",
      "suix_resolveNameServiceAddress", "suix_getNormalizedMoveModulesByPackage",
      "sui_getTransactionBlock", "sui_multiGetTransactionBlocks", "sui_getObject",
      "sui_multiGetObjects", "sui_getReferenceGasPrice", "sui_getLatestCheckpointSequenceNumber",
      "sui_getCheckpoint", "sui_getCommitteeInfo", "sui_getNetworkIdentifier",
      "sui_getChainIdentifier", "sui_getTotalTransactionBlocks",
      "sui_xsuix_getOwnedObjects",  // legacy
    ]),
  },

  // --- Cosmos (REST API) ---
  "cosmos": {
    url: "https://rest.cosmos.directory/cosmoshub",
    fallback: "https://cosmos-rest.publicnode.com",
    // Cosmos uses REST endpoints; for proxy compatibility we pass through
    // The proxy will forward GET requests and POST with JSON-RPC-like bodies
    readOnlyMethods: new Set(["_all_readonly"]), // all Cosmos queries are read-only
  },

  // --- NEAR ---
  "near": {
    url: "https://rpc.mainnet.near.org",
    fallback: "https://near.lava.build",
    readOnlyMethods: new Set([
      "query", "block", "chunk", "gas_price", "status", "health",
      "network_info", "validators", "block_by_id", "light_client_proof",
      "next_light_client_block_proof", "broadcast_tx_async",
    ]),
  },
};

const READ_ONLY_METHODS = new Set([
  "eth_call",
  "eth_getBalance",
  "eth_blockNumber",
  "eth_getBlockByHash",
  "eth_getBlockByNumber",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getTransactionCount",
  "eth_getCode",
  "eth_getLogs",
  "eth_getStorageAt",
  "eth_chainId",
  "eth_gasPrice",
  "eth_estimateGas",
  "eth_feeHistory",
  "net_version",
  "web3_clientVersion",
]);

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown[];
  id: string | number | null;
}

interface JsonRpcResponse {
  jsonrpc: string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  id: string | number | null;
}

interface Metrics {
  requestCount: number;
  errorCount: number;
  cacheHits: number;
  cacheMisses: number;
  chainUsage: Record<string, number>;
  startTime: number;
}

// Global metrics storage (shared across requests within the same worker instance)
let metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  chainUsage: {},
  startTime: Date.now(),
};

interface Env {
  RPC_CACHE: KVNamespace;
  CACHE_TTL?: string | number;
  API_KEY?: string;
  RATE_LIMIT_RPM?: number;  // requests per minute
}

// ---------------------------------------------------------------------------
// Security Configuration
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
  'https://docs.cinacoin.com',
  'https://status.cinacoin.com',
  // 'http://localhost:3000', // dev only
  // 'http://localhost:5173', // dev only
];

const WRITE_METHODS = new Set([
  'eth_sendRawTransaction',
  'eth_sendTransaction',
  'eth_sign',
  'eth_signTransaction',
  'personal_sign',
  'personal_sendTransaction',
  'eth_accounts',
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

function makeCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  };
}

function cacheKey(chainId: string, body: JsonRpcRequest): string {
  const payload = JSON.stringify({ chainId, method: body.method, params: body.params ?? [] });
  const hash: ArrayBuffer | null = null;
  return `rpc:${btoa(unescape(encodeURIComponent(payload)))}`;
}

function handleMetrics(origin: string | null): Response {
  const uptime = Date.now() - metrics.startTime;
  const errorRate = metrics.requestCount > 0
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2)
    : "0.00";
  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0
    ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2)
    : "0.00";

  const jsonBody = {
    service: "cinacoin-rpc-proxy",
    uptime_ms: uptime,
    uptime_readable: formatUptime(uptime),
    request_count: metrics.requestCount,
    error_count: metrics.errorCount,
    error_rate_percent: parseFloat(errorRate),
    cache_hits: metrics.cacheHits,
    cache_misses: metrics.cacheMisses,
    cache_hit_rate_percent: parseFloat(cacheHitRate),
    chain_usage: metrics.chainUsage,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(jsonBody), {
    headers: { "Content-Type": "application/json", ...makeCorsHeaders(origin), "X-Frame-Options": "DENY" },
  });
}

function handlePrometheusMetrics(): Response {
  const uptime = Date.now() - metrics.startTime;
  const errorRate = metrics.requestCount > 0
    ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2)
    : "0.00";
  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0
    ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2)
    : "0.00";

  const lines: string[] = [
    '# HELP rpc_proxy_request_count_total Total requests processed',
    '# TYPE rpc_proxy_request_count_total counter',
    `rpc_proxy_request_count_total ${metrics.requestCount}`,
    '',
    '# HELP rpc_proxy_error_count_total Total errors',
    '# TYPE rpc_proxy_error_count_total counter',
    `rpc_proxy_error_count_total ${metrics.errorCount}`,
    '',
    '# HELP rpc_proxy_error_rate Error rate as percentage',
    '# TYPE rpc_proxy_error_rate gauge',
    `rpc_proxy_error_rate ${errorRate}`,
    '',
    '# HELP rpc_proxy_cache_hits_total Cache hits',
    '# TYPE rpc_proxy_cache_hits_total counter',
    `rpc_proxy_cache_hits_total ${metrics.cacheHits}`,
    '',
    '# HELP rpc_proxy_cache_misses_total Cache misses',
    '# TYPE rpc_proxy_cache_misses_total counter',
    `rpc_proxy_cache_misses_total ${metrics.cacheMisses}`,
    '',
    '# HELP rpc_proxy_cache_hit_rate Cache hit rate as percentage',
    '# TYPE rpc_proxy_cache_hit_rate gauge',
    `rpc_proxy_cache_hit_rate ${cacheHitRate}`,
    '',
    '# HELP rpc_proxy_uptime_ms Uptime in milliseconds',
    '# TYPE rpc_proxy_uptime_ms gauge',
    `rpc_proxy_uptime_ms ${uptime}`,
    '',
    '# HELP rpc_proxy_up Whether the service is alive',
    '# TYPE rpc_proxy_up gauge',
    'rpc_proxy_up 1',
  ];

  for (const [chain, count] of Object.entries(metrics.chainUsage)) {
    if (lines[lines.length - 1] !== '') lines.push('');
    lines.push(`rpc_proxy_chain_requests_total{chain="${chain}"} ${count}`);
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' },
  });
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getChainConfig(chainId: string): { config: ChainConfig | undefined; isReadOnly(method: string): boolean } {
  const config = CHAIN_CONFIG[chainId] ?? CHAIN_CONFIG[chainId.toLowerCase()];
  const isReadOnly = (method: string): boolean => {
    if (!config) return READ_ONLY_METHODS.has(method);
    if (config.readOnlyMethods?.has(method)) return true;
    if (!config.readOnlyMethods) return READ_ONLY_METHODS.has(method);
    return false;
  };
  return { config, isReadOnly };
}

async function forwardToUpstream(
  rpcUrl: string,
  body: JsonRpcRequest,
): Promise<{ ok: boolean; status: number; text: string }> {
  const upstream = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: upstream.ok, status: upstream.status, text: await upstream.text() };
}

async function handleRpc(
  request: Request,
  env: Env,
  chainId: string
): Promise<Response> {
  const origin = request.headers.get("Origin");
  const headers = { "Content-Type": "application/json", ...makeCorsHeaders(origin) };

  // Update metrics
  metrics.requestCount++;
  if (!metrics.chainUsage[chainId]) {
    metrics.chainUsage[chainId] = 0;
  }
  metrics.chainUsage[chainId]++;

  const { config, isReadOnly } = getChainConfig(chainId);
  if (!config) {
    metrics.errorCount++;
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32601, message: `Unsupported chain: ${chainId}` }, id: null } as JsonRpcResponse),
      { status: 400, headers }
    );
  }

  let body: JsonRpcRequest;
  try {
    body = await request.json<JsonRpcRequest>();
  } catch {
    metrics.errorCount++;
    const requestId = extractRequestId(request);
    logger.warn('Invalid JSON in RPC request', { requestId });
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Invalid JSON" }, id: null } as JsonRpcResponse),
      { status: 400, headers }
    );
  }

  if (!body.method || body.jsonrpc !== "2.0") {
    metrics.errorCount++;
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid request" }, id: body.id ?? null } as JsonRpcResponse),
      { status: 400, headers }
    );
  }

  // Block write methods entirely (EVM-specific; non-EVM chains don't use these)
  if (WRITE_METHODS.has(body.method)) {
    metrics.errorCount++;
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Write methods not supported on this proxy" }, id: body.id ?? null } as JsonRpcResponse),
      { status: 403, headers }
    );
  }

  const readOnly = isReadOnly(body.method);
  const ttl = Number(env.CACHE_TTL) || 300;

  // Try cache for read-only methods
  if (readOnly && env.RPC_CACHE) {
    const key = cacheKey(chainId, body);
    const cached = await env.RPC_CACHE.get(key);
    if (cached) {
      metrics.cacheHits++;
      return new Response(cached, { headers });
    }
    metrics.cacheMisses++;
  }

  // Forward to upstream with fallback support
  const urls = [config.url];
  if (config.fallback) urls.push(config.fallback);

  for (let i = 0; i < urls.length; i++) {
    const rpcUrl = urls[i];
    try {
      const result = await forwardToUpstream(rpcUrl, body);

      // Cache successful read-only responses
      if (readOnly && env.RPC_CACHE && result.ok) {
        const key = cacheKey(chainId, body);
        await env.RPC_CACHE.put(key, result.text, { expirationTtl: ttl });
      }

      return new Response(result.text, {
        status: result.status,
        headers,
      });
    } catch (err) {
      const requestId = extractRequestId(request);
      logger.warn('Upstream failed, trying fallback', { requestId, chainId, method: body.method, url: rpcUrl, error: String(err) });
      if (i === urls.length - 1) {
        metrics.errorCount++;
        logger.error('All upstreams failed', { requestId, chainId, method: body.method });
        return new Response(
          JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Upstream request failed" }, id: body.id ?? null } as JsonRpcResponse),
          { status: 502, headers }
        );
      }
    }
  }

  metrics.errorCount++;
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Upstream request failed" }, id: body.id ?? null } as JsonRpcResponse),
    { status: 502, headers }
  );
}

function handleHealth(origin: string | null): Response {
  const supportedChains = Object.keys(CHAIN_CONFIG);
  return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString(), supported_chains: supportedChains }), {
    headers: { "Content-Type": "application/json", ...makeCorsHeaders(origin), "X-Frame-Options": "DENY" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // CORS preflight (before rate limiting)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Content-Length": "0", ...makeCorsHeaders(origin) },
      });
    }

    // Rate limiting (skip health check)
    if (url.pathname !== "/health") {
      const ip = getClientIp(request);
      if (!checkRate(ip, DEFAULT_RATE_LIMIT)) {
        return new Response(JSON.stringify({ error: "rate_limit_exceeded" }), {
          status: 429,
          headers: { "Content-Type": "application/json", ...makeCorsHeaders(origin) },
        });
      }
    }

    // Health check
    if (url.pathname === "/health" && request.method === "GET") {
      return handleHealth(origin);
    }

    // Metrics endpoint
    if (url.pathname === "/metrics" && request.method === "GET") {
      const accept = request.headers.get("Accept") || "";
      if (accept.includes("text/plain") || accept.includes("application/openmetrics")) {
        return handlePrometheusMetrics();
      }
      return handleMetrics(origin);
    }

    // RPC proxy: POST /rpc/:chainId
    const rpcMatch = url.pathname.match(/^\/rpc\/([A-Za-z0-9-]+)$/);
    if (rpcMatch && request.method === "POST") {
      const chainId = rpcMatch[1];
      const resolved = CHAIN_CONFIG[chainId] ?? CHAIN_CONFIG[chainId.toLowerCase()];
      if (!resolved) {
        return new Response(
          JSON.stringify({ jsonrpc: "2.0", error: { code: -32601, message: `Unsupported chain: ${chainId}` }, id: null } as JsonRpcResponse),
          { status: 400, headers: { "Content-Type": "application/json", ...makeCorsHeaders(origin) } }
        );
      }
      return handleRpc(request, env, chainId);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...makeCorsHeaders(origin) },
    });
  },
};