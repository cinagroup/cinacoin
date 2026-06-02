/**
 * Cinacoin WalletConnect Relay Worker
 *
 * Edge relay proxy for WalletConnect v2 that provides:
 * - WebSocket relay for WC v2 protocol
 * - Session state management via D1
 * - Hot session caching via KV
 * - Rate limiting per IP
 * - Health check endpoint
 * - Multi-region session affinity
 */

export interface Env {
  SESSION_DB: D1Database;
  SESSION_CACHE: KVNamespace;
  CORS_ORIGIN?: string;
  RATE_LIMIT_RPM?: number;
  REGION?: string;
}

// ============================================================
// Constants
// ============================================================

const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB max message
const DEFAULT_RATE_LIMIT_RPM = 120;
const CACHE_TTL = 3600; // 1 hour
const SESSION_TIMEOUT = 7 * 24 * 3600; // 7 days in seconds

// ============================================================
// D1 Schema
// ============================================================

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  project_id TEXT,
  peer_a TEXT,
  peer_b TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_active INTEGER DEFAULT (strftime('%s', 'now')),
  region TEXT,
  status TEXT DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_sessions_topic ON sessions(topic);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
`;

// ============================================================
// Rate Limiter
// ============================================================

async function checkRateLimit(
  env: Env,
  ip: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = parseInt(env.RATE_LIMIT_RPM || String(DEFAULT_RATE_LIMIT_RPM));
  const key = `rate:${ip}`;
  const now = Date.now();
  const window = 60_000; // 1 minute

  const current = await env.SESSION_CACHE.get(key);
  if (!current) {
    await env.SESSION_CACHE.put(key, JSON.stringify({ count: 1, window: now + window }), {
      expirationTtl: Math.ceil(window / 1000) + 60,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  const entry = JSON.parse(current) as { count: number; window: number };
  if (now > entry.window) {
    await env.SESSION_CACHE.put(key, JSON.stringify({ count: 1, window: now + window }), {
      expirationTtl: Math.ceil(window / 1000) + 60,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  await env.SESSION_CACHE.put(key, JSON.stringify(entry), {
    expirationTtl: Math.ceil((entry.window - now) / 1000) + 60,
  });

  return { allowed: true, remaining: limit - entry.count };
}

// ============================================================
// Session Management
// ============================================================

async function createSession(
  env: Env,
  topic: string,
  projectId: string,
  peerA: string,
  peerB: string,
  region: string,
): Promise<void> {
  await env.SESSION_DB.prepare(
    `INSERT OR REPLACE INTO sessions (id, topic, project_id, peer_a, peer_b, region, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`,
  )
    .bind(crypto.randomUUID(), topic, projectId, peerA, peerB, region)
    .run();

  // Cache for fast lookups
  await env.SESSION_CACHE.put(`session:${topic}`, JSON.stringify({
    topic,
    project_id: projectId,
    region,
    peer_a: peerA,
    peer_b: peerB,
  }), { expirationTtl: CACHE_TTL });
}

async function getSession(
  env: Env,
  topic: string,
): Promise<Record<string, string> | null> {
  // Try KV cache first
  const cached = await env.SESSION_CACHE.get(`session:${topic}`);
  if (cached) return JSON.parse(cached);

  // Fall back to D1
  const result = await env.SESSION_DB.prepare(
    `SELECT * FROM sessions WHERE topic = ? AND status = 'active'`,
  )
    .bind(topic)
    .first<Record<string, string>>();

  if (result) {
    await env.SESSION_CACHE.put(`session:${topic}`, JSON.stringify(result), {
      expirationTtl: CACHE_TTL,
    });
  }

  return result;
}

async function updateSessionActivity(
  env: Env,
  topic: string,
): Promise<void> {
  await env.SESSION_DB.prepare(
    `UPDATE sessions SET last_active = strftime('%s', 'now') WHERE topic = ?`,
  )
    .bind(topic)
    .run();
}

async function closeSession(
  env: Env,
  topic: string,
): Promise<void> {
  await env.SESSION_DB.prepare(
    `UPDATE sessions SET status = 'closed', last_active = strftime('%s', 'now') WHERE topic = ?`,
  )
    .bind(topic)
    .run();

  await env.SESSION_CACHE.delete(`session:${topic}`);
}

// ============================================================
// Initialize D1 Schema
// ============================================================

async function ensureSchema(env: Env): Promise<void> {
  await env.SESSION_DB.exec(SCHEMA);
}

// ============================================================
// HTTP Handler
// ============================================================

async function handleRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  // Rate limit
  const rate = await checkRateLimit(env, ip);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too Many Requests', retryAfter: 60 }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Ensure D1 schema exists
  await ensureSchema(env);

  // Health check
  if (url.pathname === '/health' || url.pathname === '/api/health') {
    const dbCheck = await env.SESSION_DB.prepare('SELECT 1').first();
    return new Response(
      JSON.stringify({
        status: 'ok',
        region: env.REGION || 'unknown',
        timestamp: Date.now(),
        db: dbCheck ? 'connected' : 'disconnected',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        },
      },
    );
  }

  // Register session
  if (url.pathname === '/api/sessions' && request.method === 'POST') {
    const body = (await request.json()) as {
      topic?: string;
      projectId?: string;
      peerA?: string;
      peerB?: string;
    };

    if (!body.topic) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: topic' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    await createSession(
      env,
      body.topic,
      body.projectId || 'unknown',
      body.peerA || '',
      body.peerB || '',
      env.REGION || 'unknown',
    );

    return new Response(
      JSON.stringify({ success: true, topic: body.topic, region: env.REGION }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        },
      },
    );
  }

  // Get session
  if (url.pathname.startsWith('/api/sessions/') && request.method === 'GET') {
    const topic = url.pathname.split('/').pop() || '';
    const session = await getSession(env, topic);

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found', topic }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ data: session }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        },
      },
    );
  }

  // Close session
  if (url.pathname.startsWith('/api/sessions/') && request.method === 'DELETE') {
    const topic = url.pathname.split('/').pop() || '';
    await closeSession(env, topic);

    return new Response(
      JSON.stringify({ success: true, topic }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        },
      },
    );
  }

  // Metrics endpoint
  if (url.pathname === '/api/metrics') {
    const stats = await env.SESSION_DB.prepare(
      `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'active' THEN 1 END) as active FROM sessions`,
    ).first<{ total: number; active: number }>();

    return new Response(
      JSON.stringify({
        totalSessions: stats?.total || 0,
        activeSessions: stats?.active || 0,
        region: env.REGION || 'unknown',
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        },
      },
    );
  }

  return new Response(
    JSON.stringify({ error: 'Not Found', path: url.pathname }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

// ============================================================
// Durable Object for WebSocket relay
// ============================================================

export class RelaySession implements DurableObject {
  private storage: DurableObjectStorage;
  private sessions = new Map<string, WebSocket>();

  constructor(state: DurableObjectState, env: Env) {
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for relay
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      server.accept();

      const topic = url.searchParams.get('topic') || crypto.randomUUID();

      server.addEventListener('message', async (event: MessageEvent) => {
        const data = event.data as string;

        // Size check
        if (data.length > MAX_MESSAGE_SIZE) {
          server.send(JSON.stringify({ error: 'Message too large', max: MAX_MESSAGE_SIZE }));
          return;
        }

        // Store last message
        await this.storage.put(`msg:${topic}:${Date.now()}`, {
          topic,
          data,
          timestamp: Date.now(),
        });

        // Broadcast to other clients on same topic
        this.sessions.forEach((ws, key) => {
          if (key !== topic && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ topic, message: data }));
          }
        });

        // Track on this session
        this.sessions.set(topic, server);
      });

      server.addEventListener('close', () => {
        this.sessions.delete(topic);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP fallback
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    return new Response(JSON.stringify({ message: 'Use WebSocket for relay', ...body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ============================================================
// Main Export
// ============================================================

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return handleRequest(request, env);
  },
};
