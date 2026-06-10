/**
 * Cinacoin Analytics Ingestion Server
 * Cloudflare Worker for collecting analytics events
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { EventValidator, type AnalyticsEvent } from "./validator.js";
import { RateLimiter } from "./rate-limiter.js";
import { GdprAnonymizer } from "./anonymizer.js";
import { EventDeduplicator } from "./deduplicator.js";
import { EventBatcher } from "./batcher.js";
import { PrometheusMetrics } from "./metrics.js";
import { logger } from '@cinacoin/logger';

export interface Env {
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  DEDUP_KV: KVNamespace;
  API_KEY: string;
  RATE_LIMIT?: string;
  RATE_WINDOW?: string;
  BATCH_SIZE?: string;
  GDPR_ANONYMIZE?: string;
}

// Hono app
const app = new Hono<{ Bindings: Env }>();
app.use("/*", cors({
  origin: ["https://cinacoin.com", "https://dash.cinacoin.com", "https://demo.cinacoin.com", "https://docs.cinacoin.com", "https://status.cinacoin.com", "https://analytics.cinacoin.com"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  maxAge: 86400,
}));

const metrics = new PrometheusMetrics();

/**
 * POST /v1/events — Batch event ingestion
 */
app.post("/v1/events", async (c) => {
  const startTime = Date.now();

  // Auth check
  const apiKey = c.req.header("X-API-Key") || c.req.header("Authorization")?.replace("Bearer ", "");
  if (c.env.API_KEY && apiKey !== c.env.API_KEY) {
    metrics.recordAuthFailure();
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Parse body
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Normalize to array
  const events = Array.isArray(body) ? body : (body && typeof body === "object" && "events" in body ? (body as { events: unknown[] }).events : [body]);

  if (!Array.isArray(events) || events.length === 0) {
    return c.json({ error: "Expected array of events" }, 400);
  }

  // Rate limiting per app_id
  const rateLimit = parseInt(c.env.RATE_LIMIT ?? "1000", 10);
  const rateWindow = parseInt(c.env.RATE_WINDOW ?? "3600", 10);
  const rateLimiter = new RateLimiter(c.env.RATE_LIMIT_KV, rateLimit, rateWindow);

  const appIds = new Set(events.map((e: { appId?: string }) => e?.appId ?? "default"));
  for (const appId of appIds) {
    const limited = await rateLimiter.isLimited(appId);
    if (limited) {
      metrics.recordRateLimit();
      return c.json({ error: "Rate limit exceeded", retryAfter: rateWindow }, 429);
    }
  }

  // Validate events
  const validEvents: AnalyticsEvent[] = [];
  const validationErrors: string[] = [];
  for (const event of events) {
    const result = EventValidator.validate(event);
    if (result.valid && result.event) {
      validEvents.push(result.event);
    } else {
      validationErrors.push(result.error!);
    }
  }

  if (validEvents.length === 0) {
    return c.json({ error: "No valid events", details: validationErrors }, 400);
  }

  // Deduplicate
  const deduplicator = new EventDeduplicator(c.env.DEDUP_KV);
  const deduped = await deduplicator.filterDuplicates(validEvents);
  metrics.recordDeduplication(validEvents.length, deduped.length);

  // GDPR Anonymization
  const anonymize = c.env.GDPR_ANONYMIZE !== "false";
  const processedEvents = anonymize
    ? deduped.map((e) => GdprAnonymizer.anonymize(e, c))
    : deduped;

  // Batch insert to D1
  const batchSize = parseInt(c.env.BATCH_SIZE ?? "100", 10);
  const batcher = new EventBatcher(c.env.DB, batchSize);
  const inserted = await batcher.insert(processedEvents);

  const duration = Date.now() - startTime;
  metrics.recordEventIngestion(inserted, duration);

  return c.json({
    accepted: inserted,
    rejected: events.length - inserted,
    duplicates: validEvents.length - deduped.length,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
  }, 202);
});

/**
 * GET /v1/overview — Dashboard overview aggregation (read API)
 *
 * Aggregates the D1 `events` table into the KPIs the analytics dashboard
 * renders: active wallets, transactions, on-chain volume, conversion rate,
 * a daily transaction series, and a per-chain breakdown. All numbers come
 * from real ingested events; an empty database returns zeros.
 *
 * Query params: ?days=30 (default 30, max 90), ?appId=<optional filter>
 */
app.get("/v1/overview", async (c) => {
  const days = Math.min(parseInt(c.req.query("days") ?? "30", 10) || 30, 90);
  const appId = c.req.query("appId");
  const windowMs = days * 86_400_000;
  const now = Date.now();
  const since = now - windowMs;
  const prevSince = since - windowMs;

  const appFilter = appId ? " AND app_id = ?" : "";
  const bind = (extra: (string | number)[]) =>
    appId ? [...extra, appId] : extra;

  try {
    // Period + previous period counts for delta computation.
    const periodStats = async (from: number, to: number) => {
      const row = await c.env.DB.prepare(
        `SELECT
           COUNT(DISTINCT user_id) AS active_wallets,
           SUM(CASE WHEN event_type = 'transaction_confirmed' THEN 1 ELSE 0 END) AS txs_confirmed,
           SUM(CASE WHEN event_type = 'transaction_attempted' THEN 1 ELSE 0 END) AS txs_attempted,
           SUM(CASE WHEN event_type = 'transaction_failed' THEN 1 ELSE 0 END) AS txs_failed
         FROM events
         WHERE timestamp >= ? AND timestamp < ?${appFilter}`
      )
        .bind(...bind([from, to]))
        .first<{
          active_wallets: number;
          txs_confirmed: number;
          txs_attempted: number;
          txs_failed: number;
        }>();
      return {
        activeWallets: row?.active_wallets ?? 0,
        txsConfirmed: row?.txs_confirmed ?? 0,
        txsAttempted: row?.txs_attempted ?? 0,
        txsFailed: row?.txs_failed ?? 0,
      };
    };

    const cur = await periodStats(since, now);
    const prev = await periodStats(prevSince, since);

    // Daily transaction series (confirmed) across the window.
    const { results: dailyRows } = await c.env.DB.prepare(
      `SELECT
         strftime('%Y-%m-%d', datetime(timestamp / 1000, 'unixepoch')) AS day,
         COUNT(*) AS count
       FROM events
       WHERE event_type = 'transaction_confirmed' AND timestamp >= ?${appFilter}
       GROUP BY day
       ORDER BY day ASC`
    )
      .bind(...bind([since]))
      .all<{ day: string; count: number }>();

    const byDay = new Map<string, number>();
    for (const r of dailyRows ?? []) byDay.set(r.day, r.count);
    const daily = Array.from({ length: days }, (_, i) => {
      const d = new Date(now - (days - 1 - i) * 86_400_000)
        .toISOString()
        .slice(0, 10);
      return { date: d, count: byDay.get(d) ?? 0 };
    });

    // Per-chain breakdown by chainId (stored in properties JSON).
    const { results: chainRows } = await c.env.DB.prepare(
      `SELECT
         json_extract(properties, '$.chainId') AS chain_id,
         COUNT(*) AS count
       FROM events
       WHERE timestamp >= ? AND json_extract(properties, '$.chainId') IS NOT NULL${appFilter}
       GROUP BY chain_id
       ORDER BY count DESC
       LIMIT 8`
    )
      .bind(...bind([since]))
      .all<{ chain_id: string | number; count: number }>();

    const pctDelta = (a: number, b: number) =>
      b > 0 ? ((a - b) / b) * 100 : a > 0 ? 100 : 0;

    const curConversion =
      cur.txsAttempted > 0 ? (cur.txsConfirmed / cur.txsAttempted) * 100 : 0;
    const prevConversion =
      prev.txsAttempted > 0 ? (prev.txsConfirmed / prev.txsAttempted) * 100 : 0;

    return c.json({
      period: { days, from: since, to: now },
      kpis: {
        activeWallets: {
          value: cur.activeWallets,
          deltaPct: pctDelta(cur.activeWallets, prev.activeWallets),
        },
        transactions: {
          value: cur.txsConfirmed,
          deltaPct: pctDelta(cur.txsConfirmed, prev.txsConfirmed),
        },
        conversionRate: {
          value: parseFloat(curConversion.toFixed(1)),
          deltaPct: pctDelta(curConversion, prevConversion),
        },
      },
      dailyTransactions: daily,
      chains: (chainRows ?? []).map((r) => ({
        chainId: String(r.chain_id),
        count: r.count,
      })),
    });
  } catch {
    // DB not configured yet — return an empty, honest shape.
    const daily = Array.from({ length: days }, (_, i) => ({
      date: new Date(now - (days - 1 - i) * 86_400_000)
        .toISOString()
        .slice(0, 10),
      count: 0,
    }));
    return c.json({
      period: { days, from: since, to: now },
      kpis: {
        activeWallets: { value: 0, deltaPct: 0 },
        transactions: { value: 0, deltaPct: 0 },
        conversionRate: { value: 0, deltaPct: 0 },
      },
      dailyTransactions: daily,
      chains: [],
    });
  }
});

/**
 * GET /v1/health — Health check
 */
app.get("/v1/health", async (c) => {
  const start = Date.now();
  let dbOk = false;
  try {
    await c.env.DB.prepare("SELECT 1").run();
    dbOk = true;
  } catch {
    // DB not yet configured
  }

  const latency = Date.now() - start;

  return c.json({
    status: "ok",
    timestamp: Date.now(),
    latency: `${latency}ms`,
    database: dbOk ? "connected" : "not_configured",
    version: "0.1.0",
    uptime: metrics.uptime(),
  });
});

/**
 * GET /v1/metrics — Prometheus metrics
 */
app.get("/v1/metrics", async (c) => {
  const text = metrics.render();
  c.header("Content-Type", "text/plain; version=0.0.4");
  return c.body(text);
});

/**
 * Default route
 */
app.get("/", (c) =>
  c.json({
    service: "cinacoin-analytics",
    version: "0.1.0",
    endpoints: {
      "POST /v1/events": "Batch event ingestion",
      "GET /v1/health": "Health check",
      "GET /v1/metrics": "Prometheus metrics",
    },
  })
);

export default app;

// ---- Process signal handling (Node.js / local dev runtime) ----
// Cloudflare Workers manage lifecycle via the platform; these handlers
// apply when the app is run locally via `hono/node-server` or similar.
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  let shuttingDown = false;
  let inFlight = 0;

  // Middleware to track in-flight requests for graceful drain
  app.use('/*', async (c, next) => {
    if (shuttingDown) return c.json({ error: 'Server is shutting down' }, 503);
    inFlight++;
    try {
      await next();
    } finally {
      inFlight--;
    }
  });

  const gracefulShutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Shutting down...');

    // Wait up to 10 s for in-flight requests to drain
    const deadline = Date.now() + 10_000;
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (inFlight === 0 || Date.now() >= deadline) resolve();
        else setTimeout(tick, 50);
      };
      tick();
    });

    // Let the host process exit gracefully
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}
