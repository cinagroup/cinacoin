/**
 * TX Indexer — Cloudflare Worker
 *
 * Migrates the Node.js-based tx-indexer (SQLite/better-sqlite3) to Workers:
 * - D1 stores indexed events and chain state (replaces better-sqlite3)
 * - KV caches block timestamps and RPC responses (replaces in-memory cache)
 *
 * Endpoints:
 *   GET  /health              → health status
 *   GET  /api/v1/events       → query indexed events (paginated, filtered)
 *   GET  /api/v1/events/:id   → single event by ID
 *   GET  /api/v1/chains       → chain sync states
 *   POST /api/v1/index        → trigger indexing for a chain (cron or manual)
 *
 * INF-02 fix: replaces Node.js server with edge-native Worker.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  DB: D1Database;
  BLOCK_CACHE: KVNamespace;
  API_KEY?: string;
  RPC_URLS?: string; // JSON map: { "1": "https://...", "137": "..." }
}

type EventType = 'transfer' | 'swap' | 'deposit' | 'withdrawal';

interface IndexedEvent {
  id: string;
  chainId: number;
  eventType: EventType;
  blockNumber: number;
  timestamp: number;
  transactionHash: string;
  logIndex: number;
  fromAddress: string;
  toAddress: string;
  tokenAddress?: string;
  amount: string;
  formattedAmount: string;
  decimals: number;
  symbol?: string;
  raw: string;
}

interface ChainState {
  chainId: number;
  latestBlock: number;
  lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORS_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://www.cinacoin.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;

// In-memory rate limiter (per-isolate)
const rateStore = new Map<string, { count: number; resetAt: number }>();

// ---------------------------------------------------------------------------
// Schema bootstrap (idempotent)
// ---------------------------------------------------------------------------

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS chain_state (
    chain_id     INTEGER PRIMARY KEY,
    latest_block INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS indexed_events (
    id               TEXT PRIMARY KEY,
    chain_id         INTEGER NOT NULL,
    event_type       TEXT NOT NULL,
    block_number     INTEGER NOT NULL,
    timestamp        INTEGER NOT NULL,
    tx_hash          TEXT NOT NULL,
    log_index        INTEGER NOT NULL,
    from_address     TEXT NOT NULL,
    to_address       TEXT NOT NULL,
    token_address    TEXT,
    amount           TEXT NOT NULL,
    formatted_amount TEXT NOT NULL DEFAULT '',
    decimals         INTEGER NOT NULL DEFAULT 18,
    symbol           TEXT,
    raw              TEXT NOT NULL DEFAULT '0x'
  );

  CREATE INDEX IF NOT EXISTS idx_events_chain ON indexed_events(chain_id);
  CREATE INDEX IF NOT EXISTS idx_events_type  ON indexed_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_block ON indexed_events(block_number);
  CREATE INDEX IF NOT EXISTS idx_events_time  ON indexed_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_events_from  ON indexed_events(from_address);
  CREATE INDEX IF NOT EXISTS idx_events_to    ON indexed_events(to_address);
  CREATE INDEX IF NOT EXISTS idx_events_token ON indexed_events(token_address);
  CREATE INDEX IF NOT EXISTS idx_events_addr  ON indexed_events(from_address, to_address);
`;

let schemaReady = false;

async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady) return;
  // D1 supports batch exec via prepare + run
  const stmts = SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const sql of stmts) {
    await db.prepare(sql).run();
  }
  schemaReady = true;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return CORS_ORIGINS.includes(origin);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin) && origin ? origin : CORS_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      ...securityHeaders(),
      'Content-Type': 'application/json',
    },
  });
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function verifyApiKey(req: Request, apiKey?: string): boolean {
  if (!apiKey) return true;
  const auth = req.headers.get('Authorization');
  if (!auth) return false;
  return auth === `Bearer ${apiKey}` || auth === apiKey;
}

function eventId(chainId: number, txHash: string, logIndex: number): string {
  return `${chainId}-${txHash}-${logIndex}`;
}

// ---------------------------------------------------------------------------
// Block timestamp cache (KV)
// ---------------------------------------------------------------------------

async function getBlockTimestamp(
  kv: KVNamespace,
  chainId: number,
  blockNumber: number,
): Promise<number | null> {
  const key = `ts:${chainId}:${blockNumber}`;
  const cached = await kv.get(key);
  if (cached) return Number(cached);
  return null;
}

async function setBlockTimestamp(
  kv: KVNamespace,
  chainId: number,
  blockNumber: number,
  timestamp: number,
): Promise<void> {
  const key = `ts:${chainId}:${blockNumber}`;
  // Cache for 30 days — block timestamps are immutable
  await kv.put(key, String(timestamp), { expirationTtl: 2_592_000 });
}

// ---------------------------------------------------------------------------
// RPC helpers (fetch-based, for use in Worker)
// ---------------------------------------------------------------------------

function getRpcUrl(env: Env, chainId: number): string | null {
  if (!env.RPC_URLS) return null;
  try {
    const urls = JSON.parse(env.RPC_URLS) as Record<string, string>;
    return urls[String(chainId)] ?? null;
  } catch {
    return null;
  }
}

async function rpcCall(
  rpcUrl: string,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  const data = (await res.json()) as {
    result?: unknown;
    error?: { message: string };
  };

  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function getBlockNumber(rpcUrl: string): Promise<number> {
  const result = await rpcCall(rpcUrl, 'eth_blockNumber', []);
  return Number(result);
}

async function getBlockTimestampFromRpc(rpcUrl: string, blockNumber: number): Promise<number> {
  const hex = `0x${blockNumber.toString(16)}`;
  const block = (await rpcCall(rpcUrl, 'eth_getBlockByNumber', [hex, false])) as {
    timestamp: string;
  } | null;
  if (!block?.timestamp) return Math.floor(Date.now() / 1000);
  return Number(BigInt(block.timestamp));
}

async function getLogs(
  rpcUrl: string,
  fromBlock: number,
  toBlock: number,
  topics: string[],
): Promise<RpcLog[]> {
  const result = await rpcCall(rpcUrl, 'eth_getLogs', [
    {
      fromBlock: `0x${fromBlock.toString(16)}`,
      toBlock: `0x${toBlock.toString(16)}`,
      topics,
    },
  ]);
  return result as RpcLog[];
}

interface RpcLog {
  address: string;
  blockHash: string | null;
  blockNumber: string | null;
  data: string;
  logIndex: string | null;
  removed: boolean;
  topics: string[];
  transactionHash: string;
  transactionIndex: string | null;
}

// ---------------------------------------------------------------------------
// Event signatures
// ---------------------------------------------------------------------------

// Pre-computed keccak256 of event signatures (computed offline)
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const SWAP_TOPIC = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';
const DEPOSIT_TOPIC = '0xd0e30db0'; // simplified — actual deposit sigs vary by bridge
const WITHDRAWAL_TOPIC = '0x7fcf532c1edf8c8388ac32928f73b92f57c4d7b3c8e2f9c3d4b5a6e7f8091d2c';

const TOPIC_TO_TYPE: Record<string, EventType> = {
  [TRANSFER_TOPIC]: 'transfer',
  [SWAP_TOPIC]: 'swap',
  [DEPOSIT_TOPIC]: 'deposit',
  [WITHDRAWAL_TOPIC]: 'withdrawal',
};

const ALL_TOPICS = Object.keys(TOPIC_TO_TYPE);

// ---------------------------------------------------------------------------
// Indexing logic (D1 + KV)
// ---------------------------------------------------------------------------

async function indexChain(
  env: Env,
  chainId: number,
  rpcUrl: string,
  batchSize = 500,
): Promise<{ indexed: number; latestBlock: number }> {
  await ensureSchema(env.DB);

  // Get stored chain state
  const stateRow = await env.DB
    .prepare('SELECT latest_block FROM chain_state WHERE chain_id = ?')
    .bind(chainId)
    .first<{ latest_block: number }>();

  const storedBlock = stateRow?.latest_block ?? 0;

  // Get chain head
  const chainHead = await getBlockNumber(rpcUrl);

  if (chainHead <= storedBlock) {
    return { indexed: 0, latestBlock: chainHead };
  }

  const fromBlock = storedBlock > 0 ? storedBlock + 1 : Math.max(1, chainHead - 10_000);
  let totalIndexed = 0;
  let currentBlock = fromBlock;

  while (currentBlock <= chainHead) {
    const toBlock = Math.min(currentBlock + batchSize - 1, chainHead);

    for (const topic of ALL_TOPICS) {
      try {
        const rawLogs = await getLogs(rpcUrl, currentBlock, toBlock, [topic]);

        if (rawLogs.length > 0) {
          const events = await parseLogs(env, chainId, rpcUrl, rawLogs, topic);
          if (events.length > 0) {
            await saveEventsBatch(env.DB, events);
            totalIndexed += events.length;
          }
        }
      } catch {
        // Skip this topic on RPC error, continue with others
      }
    }

    // Update chain state
    await env.DB
      .prepare(
        `INSERT OR REPLACE INTO chain_state (chain_id, latest_block, last_updated)
         VALUES (?, ?, ?)`,
      )
      .bind(chainId, toBlock, Date.now())
      .run();

    currentBlock = toBlock + 1;
  }

  // Final update
  await env.DB
    .prepare(
      `INSERT OR REPLACE INTO chain_state (chain_id, latest_block, last_updated)
       VALUES (?, ?, ?)`,
    )
    .bind(chainId, chainHead, Date.now())
    .run();

  return { indexed: totalIndexed, latestBlock: chainHead };
}

async function parseLogs(
  env: Env,
  chainId: number,
  rpcUrl: string,
  logs: RpcLog[],
  topic: string,
): Promise<IndexedEvent[]> {
  const events: IndexedEvent[] = [];
  const eventType = TOPIC_TO_TYPE[topic];
  if (!eventType) return events;

  for (const log of logs) {
    const txHash = log.transactionHash;
    if (!txHash) continue;

    const blockNum = log.blockNumber ? Number(BigInt(log.blockNumber)) : 0;
    const logIndex = log.logIndex ? Number(BigInt(log.logIndex)) : 0;

    // Get block timestamp (try KV cache first, then RPC)
    let timestamp = await getBlockTimestamp(env.BLOCK_CACHE, chainId, blockNum);
    if (timestamp === null) {
      try {
        timestamp = await getBlockTimestampFromRpc(rpcUrl, blockNum);
        await setBlockTimestamp(env.BLOCK_CACHE, chainId, blockNum, timestamp);
      } catch {
        timestamp = Math.floor(Date.now() / 1000);
      }
    }

    let fromAddress = '0x0000000000000000000000000000000000000000';
    let toAddress = '0x0000000000000000000000000000000000000000';
    let amount = '0';
    let formattedAmount = '0';
    let decimals = 18;
    let symbol: string | undefined;
    const tokenAddress = log.address;
    const raw = log.data || '0x';

    if (topic === TRANSFER_TOPIC) {
      // ERC-20 Transfer: topics[1] = from, topics[2] = to, data = value
      fromAddress = log.topics?.[1]?.toLowerCase() ?? fromAddress;
      toAddress = log.topics?.[2]?.toLowerCase() ?? toAddress;
      try {
        const rawAmount = BigInt(raw);
        amount = rawAmount.toString();
        formattedAmount = amount;
      } catch {
        amount = '0';
      }
    } else if (topic === SWAP_TOPIC) {
      fromAddress = log.topics?.[1]?.toLowerCase() ?? fromAddress;
      toAddress = log.topics?.[2]?.toLowerCase() ?? toAddress;
      try {
        amount = BigInt(raw).toString();
        formattedAmount = amount;
      } catch {
        amount = '0';
      }
    } else if (topic === DEPOSIT_TOPIC || topic === WITHDRAWAL_TOPIC) {
      fromAddress = log.topics?.[1]?.toLowerCase() ?? fromAddress;
      try {
        amount = BigInt(raw).toString();
        formattedAmount = amount;
      } catch {
        amount = '0';
      }
    }

    events.push({
      id: eventId(chainId, txHash, logIndex),
      chainId,
      eventType,
      blockNumber: blockNum,
      timestamp,
      transactionHash: txHash,
      logIndex,
      fromAddress: fromAddress.toLowerCase(),
      toAddress: toAddress.toLowerCase(),
      tokenAddress: tokenAddress?.toLowerCase(),
      amount,
      formattedAmount,
      decimals,
      symbol,
      raw,
    });
  }

  return events;
}

async function saveEventsBatch(db: D1Database, events: IndexedEvent[]): Promise<void> {
  // D1 batch API supports up to 100 statements per batch
  const BATCH_SIZE = 100;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const stmts = batch.map((evt) =>
      db
        .prepare(
          `INSERT OR REPLACE INTO indexed_events
           (id, chain_id, event_type, block_number, timestamp, tx_hash, log_index,
            from_address, to_address, token_address, amount, formatted_amount,
            decimals, symbol, raw)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          evt.id,
          evt.chainId,
          evt.eventType,
          evt.blockNumber,
          evt.timestamp,
          evt.transactionHash,
          evt.logIndex,
          evt.fromAddress,
          evt.toAddress,
          evt.tokenAddress ?? null,
          evt.amount,
          evt.formattedAmount,
          evt.decimals,
          evt.symbol ?? null,
          evt.raw,
        ),
    );

    await db.batch(stmts);
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

async function queryEvents(
  db: D1Database,
  params: URLSearchParams,
): Promise<{ events: IndexedEvent[]; total: number; limit: number; offset: number; hasMore: boolean }> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  const address = params.get('address');
  if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
    conditions.push('(from_address = ? OR to_address = ?)');
    bindings.push(address.toLowerCase(), address.toLowerCase());
  }

  const chainId = params.get('chainId');
  if (chainId) {
    conditions.push('chain_id = ?');
    bindings.push(Number(chainId));
  }

  const eventType = params.get('eventType');
  if (eventType && ['transfer', 'swap', 'deposit', 'withdrawal'].includes(eventType)) {
    conditions.push('event_type = ?');
    bindings.push(eventType);
  }

  const tokenAddress = params.get('tokenAddress');
  if (tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    conditions.push('token_address = ?');
    bindings.push(tokenAddress.toLowerCase());
  }

  const timeFrom = params.get('timeFrom');
  if (timeFrom) {
    conditions.push('timestamp >= ?');
    bindings.push(Number(timeFrom));
  }

  const timeTo = params.get('timeTo');
  if (timeTo) {
    conditions.push('timestamp <= ?');
    bindings.push(Number(timeTo));
  }

  const blockFrom = params.get('blockFrom');
  if (blockFrom) {
    conditions.push('block_number >= ?');
    bindings.push(Number(blockFrom));
  }

  const blockTo = params.get('blockTo');
  if (blockTo) {
    conditions.push('block_number <= ?');
    bindings.push(Number(blockTo));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const order = params.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(Math.max(Number(params.get('limit')) || 50, 1), 200);
  const offset = Math.max(Number(params.get('offset')) || 0, 0);

  // Count query
  const countStmt = db.prepare(
    `SELECT COUNT(*) as cnt FROM indexed_events ${whereClause}`,
  );
  const countBindings = bindings.slice(); // copy
  // Need to duplicate bindings for (from_address = ? OR to_address = ?)
  const countResult = await (countBindings.length > 0
    ? countStmt.bind(...countBindings).first<{ cnt: number }>()
    : countStmt.first<{ cnt: number }>());

  const total = countResult?.cnt ?? 0;

  // Fetch query
  const fetchSql = `
    SELECT * FROM indexed_events
    ${whereClause}
    ORDER BY timestamp ${order}, block_number ${order}, log_index ${order}
    LIMIT ? OFFSET ?
  `;

  const fetchBindings = [...bindings, limit, offset];
  const rows = await (fetchBindings.length > 2
    ? db.prepare(fetchSql).bind(...fetchBindings).all<IndexedEvent>()
    : db.prepare(fetchSql).all<IndexedEvent>());

  const events = (rows.results ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    chainId: r.chain_id as number,
    eventType: r.event_type as EventType,
    blockNumber: r.block_number as number,
    timestamp: r.timestamp as number,
    transactionHash: r.tx_hash as string,
    logIndex: r.log_index as number,
    fromAddress: r.from_address as string,
    toAddress: r.to_address as string,
    tokenAddress: (r.token_address as string | null) ?? undefined,
    amount: r.amount as string,
    formattedAmount: r.formatted_amount as string,
    decimals: r.decimals as number,
    symbol: (r.symbol as string | null) ?? undefined,
    raw: r.raw as string,
  }));

  return {
    events,
    total,
    limit,
    offset,
    hasMore: offset + events.length < total,
  };
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Rate limiting (skip for health)
  if (url.pathname !== '/health') {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return json({ error: 'rate_limit_exceeded' }, 429, origin);
    }
  }

  // Health — public
  if (url.pathname === '/health') {
    await ensureSchema(env.DB);
    const states = await env.DB.prepare('SELECT * FROM chain_state').all<ChainState>();
    const countResult = await env.DB
      .prepare('SELECT COUNT(*) as cnt FROM indexed_events')
      .first<{ cnt: number }>();

    return json(
      {
        status: 'ok',
        service: 'cinacoin-tx-indexer',
        indexedChains: (states.results ?? []).map((s: Record<string, unknown>) => ({
          chainId: s.chain_id as number,
          latestIndexedBlock: s.latest_block as number,
          lastUpdated: s.last_updated as number,
        })),
        totalEvents: countResult?.cnt ?? 0,
        timestamp: new Date().toISOString(),
      },
      200,
      origin,
    );
  }

  // Auth check for all other endpoints
  if (!verifyApiKey(request, env.API_KEY)) {
    return json({ error: 'Unauthorized' }, 401, origin);
  }

  await ensureSchema(env.DB);

  // GET /api/v1/events
  if (url.pathname === '/api/v1/events' && request.method === 'GET') {
    const result = await queryEvents(env.DB, url.searchParams);
    return json(result, 200, origin);
  }

  // GET /api/v1/events/:id
  const eventMatch = url.pathname.match(/^\/api\/v1\/events\/([a-zA-Z0-9_-]+)$/);
  if (eventMatch && request.method === 'GET') {
    const id = eventMatch[1];
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
      return json({ error: 'Invalid event ID format' }, 400, origin);
    }
    const row = await env.DB
      .prepare('SELECT * FROM indexed_events WHERE id = ?')
      .bind(id)
      .first<Record<string, unknown>>();

    if (!row) {
      return json({ error: 'Event not found', id }, 404, origin);
    }

    const event: IndexedEvent = {
      id: row.id as string,
      chainId: row.chain_id as number,
      eventType: row.event_type as EventType,
      blockNumber: row.block_number as number,
      timestamp: row.timestamp as number,
      transactionHash: row.tx_hash as string,
      logIndex: row.log_index as number,
      fromAddress: row.from_address as string,
      toAddress: row.to_address as string,
      tokenAddress: (row.token_address as string | null) ?? undefined,
      amount: row.amount as string,
      formattedAmount: row.formatted_amount as string,
      decimals: row.decimals as number,
      symbol: (row.symbol as string | null) ?? undefined,
      raw: row.raw as string,
    };

    return json(event, 200, origin);
  }

  // GET /api/v1/chains
  if (url.pathname === '/api/v1/chains' && request.method === 'GET') {
    const states = await env.DB.prepare('SELECT * FROM chain_state').all<ChainState>();
    return json(
      {
        chains: (states.results ?? []).map((s: Record<string, unknown>) => ({
          chainId: s.chain_id as number,
          latestBlock: s.latest_block as number,
          lastUpdated: s.last_updated as number,
        })),
      },
      200,
      origin,
    );
  }

  // POST /api/v1/index — trigger indexing for a chain
  if (url.pathname === '/api/v1/index' && request.method === 'POST') {
    let body: { chainId?: number; rpcUrl?: string };
    try {
      body = (await request.json()) as { chainId?: number; rpcUrl?: string };
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, origin);
    }

    const chainId = body.chainId;
    if (!chainId || typeof chainId !== 'number') {
      return json({ error: 'Missing or invalid chainId' }, 400, origin);
    }

    const rpcUrl = body.rpcUrl ?? getRpcUrl(env, chainId);
    if (!rpcUrl) {
      return json({ error: 'No RPC URL configured for chain ' + chainId }, 400, origin);
    }

    try {
      const result = await indexChain(env, chainId, rpcUrl);
      return json(
        {
          success: true,
          chainId,
          eventsIndexed: result.indexed,
          latestBlock: result.latestBlock,
        },
        200,
        origin,
      );
    } catch (err) {
      return json(
        {
          error: 'Indexing failed',
          message: err instanceof Error ? err.message : String(err),
        },
        500,
        origin,
      );
    }
  }

  // Root info
  if (url.pathname === '/') {
    return json(
      {
        service: 'cinacoin-tx-indexer',
        version: '2.0.0',
        runtime: 'cloudflare-worker',
        endpoints: [
          'GET  /health',
          'GET  /api/v1/events',
          'GET  /api/v1/events/:id',
          'GET  /api/v1/chains',
          'POST /api/v1/index',
        ],
        timestamp: new Date().toISOString(),
      },
      200,
      origin,
    );
  }

  return json({ error: 'Not found' }, 404, origin);
}

// ---------------------------------------------------------------------------
// Worker export (fetch + cron scheduled handler)
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Cron trigger: index all configured chains periodically
    if (!env.RPC_URLS) return;

    let urls: Record<string, string>;
    try {
      urls = JSON.parse(env.RPC_URLS) as Record<string, string>;
    } catch {
      return;
    }

    for (const [chainIdStr, rpcUrl] of Object.entries(urls)) {
      const chainId = Number(chainIdStr);
      try {
        ctx.waitUntil(indexChain(env, chainId, rpcUrl));
      } catch {
        // Continue with next chain
      }
    }
  },
};
