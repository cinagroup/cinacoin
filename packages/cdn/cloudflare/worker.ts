/**
 * CDN Analytics Worker — Cloudflare Workers implementation
 *
 * Tracks download counts and usage statistics for CDN assets.
 * Integrates with Cloudflare Analytics Engine for usage metrics.
 *
 * Routes:
 *   POST /v1/track/download  — Record a download event
 *   GET  /v1/stats/:asset    — Get stats for an asset
 *   GET  /health             — Health check
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Env {
  /** KV namespace for download counters */
  CDN_STATS: KVNamespace;
  /** Analytics Engine binding (optional) */
  CDN_ANALYTICS?: AnalyticsEngineDataset;
  /** Rate limit KV */
  RATELIMIT_KV?: KVNamespace;
  /** CORS origins */
  CORS_ORIGINS?: string;
}

interface DownloadEvent {
  asset: string;
  version?: string;
  timestamp: number;
  userAgent?: string;
  referer?: string;
  country?: string;
  ip?: string;
}

interface AssetStats {
  asset: string;
  totalDownloads: number;
  downloadsToday: number;
  downloadsThisWeek: number;
  downloadsThisMonth: number;
  versions: Record<string, number>;
  lastDownloaded: number;
  topCountries: Record<string, number>;
}

interface MetricsData {
  requestsTotal: number;
  trackRequests: number;
  statsRequests: number;
  errors: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_SECONDS = 86400;
const WEEK_SECONDS = 604800;
const MONTH_SECONDS = 2592000; // 30 days

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
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

function getCountry(request: Request): string {
  return request.headers.get('CF-IPCountry') || 'unknown';
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

async function getMetrics(env: Env): Promise<MetricsData> {
  const raw = await env.CDN_STATS.get('metrics:global', 'json');
  return (raw as MetricsData) || {
    requestsTotal: 0,
    trackRequests: 0,
    statsRequests: 0,
    errors: 0,
  };
}

async function incrementMetric(env: Env, field: keyof MetricsData): Promise<void> {
  const metrics = await getMetrics(env);
  (metrics as any)[field]++;
  metrics.requestsTotal++;
  await env.CDN_STATS.put('metrics:global', JSON.stringify(metrics));
}

// ─── Analytics Engine Integration ────────────────────────────────────────────

/**
 * Write a data point to Cloudflare Analytics Engine.
 * This allows querying usage patterns via the Analytics Engine API.
 */
function writeToAnalyticsEngine(
  env: Env,
  event: DownloadEvent
): void {
  if (!env.CDN_ANALYTICS) return;

  try {
    const blob = new TextEncoder().encode(
      JSON.stringify({
        asset: event.asset,
        version: event.version || 'latest',
        country: event.country || 'unknown',
      })
    );

    env.CDN_ANALYTICS.writeDataPoint({
      indexes: [event.asset],
      blobs: [event.userAgent || '', event.referer || '', event.version || 'latest'],
      doubles: [1], // count
    });
  } catch (err) {
    console.error('Analytics Engine write failed:', err);
  }
}

// ─── Stats Management ────────────────────────────────────────────────────────

async function getAssetStats(env: Env, asset: string): Promise<AssetStats> {
  const key = `stats:${asset}`;
  const raw = await env.CDN_STATS.get(key, 'json');

  if (raw) {
    return raw as AssetStats;
  }

  return {
    asset,
    totalDownloads: 0,
    downloadsToday: 0,
    downloadsThisWeek: 0,
    downloadsThisMonth: 0,
    versions: {},
    lastDownloaded: 0,
    topCountries: {},
  };
}

async function recordDownload(env: Env, event: DownloadEvent): Promise<void> {
  const stats = await getAssetStats(env, event.asset);
  const now = Math.floor(Date.now() / 1000);

  // Update counters
  stats.totalDownloads++;
  stats.lastDownloaded = now;

  // Time-windowed downloads (approximate — reset on read if expired)
  const dayKey = `daily:${event.asset}:${Math.floor(now / DAY_SECONDS)}`;
  const weekKey = `weekly:${event.asset}:${Math.floor(now / WEEK_SECONDS)}`;
  const monthKey = `monthly:${event.asset}:${Math.floor(now / MONTH_SECONDS)}`;

  // Increment time-windowed counters
  const dayCount = parseInt((await env.CDN_STATS.get(dayKey)) || '0', 10) + 1;
  await env.CDN_STATS.put(dayKey, String(dayCount), { expirationTtl: DAY_SECONDS * 2 });
  stats.downloadsToday = dayCount;

  const weekCount = parseInt((await env.CDN_STATS.get(weekKey)) || '0', 10) + 1;
  await env.CDN_STATS.put(weekKey, String(weekCount), { expirationTtl: WEEK_SECONDS * 2 });
  stats.downloadsThisWeek = weekCount;

  const monthCount = parseInt((await env.CDN_STATS.get(monthKey)) || '0', 10) + 1;
  await env.CDN_STATS.put(monthKey, String(monthCount), { expirationTtl: MONTH_SECONDS * 2 });
  stats.downloadsThisMonth = monthCount;

  // Version tracking
  const version = event.version || 'latest';
  stats.versions[version] = (stats.versions[version] || 0) + 1;

  // Country tracking (top 10)
  const country = event.country || 'unknown';
  stats.topCountries[country] = (stats.topCountries[country] || 0) + 1;

  // Trim to top 10 countries
  const sortedCountries = Object.entries(stats.topCountries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  stats.topCountries = Object.fromEntries(sortedCountries);

  // Save stats
  await env.CDN_STATS.put(`stats:${event.asset}`, JSON.stringify(stats));

  // Write to Analytics Engine
  writeToAnalyticsEngine(env, event);
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleHealth(): Promise<Response> {
  return jsonResponse({
    status: 'ok',
    service: 'cdn-analytics',
    platform: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  });
}

async function handleTrackDownload(
  request: Request,
  env: Env
): Promise<Response> {
  let body: { asset?: string; version?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'bad_request', message: 'Invalid JSON body' }, 400);
  }

  if (!body.asset) {
    return jsonResponse({ error: 'bad_request', message: 'Missing required field: asset' }, 400);
  }

  const event: DownloadEvent = {
    asset: body.asset,
    version: body.version,
    timestamp: Date.now(),
    userAgent: request.headers.get('User-Agent') || undefined,
    referer: request.headers.get('Referer') || undefined,
    country: getCountry(request),
    ip: getClientIp(request),
  };

  await recordDownload(env, event);
  await incrementMetric(env, 'trackRequests');

  return jsonResponse({
    success: true,
    asset: event.asset,
    timestamp: event.timestamp,
  }, 201);
}

async function handleGetStats(
  request: Request,
  env: Env,
  asset: string
): Promise<Response> {
  await incrementMetric(env, 'statsRequests');

  const stats = await getAssetStats(env, asset);

  return jsonResponse(stats, 200, {
    'Cache-Control': 'public, max-age=60',
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

    let response: Response;

    try {
      if (path === '/health' && method === 'GET') {
        response = await handleHealth();
      } else if (path === '/v1/track/download' && method === 'POST') {
        response = await handleTrackDownload(request, env);
      } else if (path.match(/^\/v1\/stats\/.+$/) && method === 'GET') {
        const asset = decodeURIComponent(path.replace('/v1/stats/', ''));
        response = await handleGetStats(request, env, asset);
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

    // Add CORS headers
    const finalHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders)) {
      finalHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      headers: finalHeaders,
    });
  },
};
