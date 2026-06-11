/**
 * Cinacoin Router Worker
 *
 * Unified reverse-proxy that stitches all Cinacoin front-end apps under one
 * canonical origin (cinacoin.com). Each app lives at a subpath:
 *
 *   /docs/*        → cinacoin-docs.pages.dev
 *   /developer/*   → cinacoin-developer-dashboard.pages.dev
 *   /learn/*       → cinacoin-learn.pages.dev
 *   /demo/*        → cinacoin-demo-react.pages.dev
 *   /telegram/*    → cinacoin-telegram.pages.dev
 *   /farcaster/*   → cinacoin-farcaster.pages.dev
 *   /analytics/*   → cinacoin-analytics.pages.dev
 *   /dashboard/*   → cinacoin-cloud-dashboard.pages.dev
 *   /wallets/*     → cinacoin-wallet-explorer.pages.dev
 *
 * Also handles:
 *   - Retired subdomain 301 redirects (demo.cinacoin.com → cinacoin.com/demo, etc.)
 *   - CORS headers for cross-origin requests
 *   - WebSocket proxy for analytics real-time data
 *   - SPA fallback (unmatched paths → index.html of the matched zone)
 *   - Health check endpoints (/_health, /_routes)
 *   - Request logging
 */

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------

interface RouteConfig {
  /** Pages project origin (https://*.pages.dev) */
  target: string;
  /** Strip the zone prefix before proxying (default true) */
  stripPrefix: boolean;
  /** Human-readable label for health checks */
  label: string;
}

const CANONICAL_HOST = 'cinacoin.com';

const ROUTES: Record<string, RouteConfig> = {
  '/docs': {
    target: 'https://cinacoin-docs.pages.dev',
    stripPrefix: true,
    label: 'Documentation',
  },
  '/developer': {
    target: 'https://cinacoin-developer-dashboard.pages.dev',
    stripPrefix: true,
    label: 'Developer Portal',
  },
  '/learn': {
    target: 'https://cinacoin-learn.pages.dev',
    stripPrefix: true,
    label: 'Learn Platform',
  },
  '/demo': {
    target: 'https://cinacoin-demo-react.pages.dev',
    stripPrefix: true,
    label: 'Demo dApp',
  },
  '/telegram': {
    target: 'https://cinacoin-telegram.pages.dev',
    stripPrefix: true,
    label: 'Telegram Mini App',
  },
  '/farcaster': {
    target: 'https://cinacoin-farcaster.pages.dev',
    stripPrefix: true,
    label: 'Farcaster Frame',
  },
  '/analytics': {
    target: 'https://cinacoin-analytics.pages.dev',
    stripPrefix: true,
    label: 'Analytics Dashboard',
  },
  '/dashboard': {
    target: 'https://cinacoin-cloud-dashboard.pages.dev',
    stripPrefix: true,
    label: 'Cloud Dashboard',
  },
  '/wallets': {
    target: 'https://cinacoin-wallet-explorer.pages.dev',
    stripPrefix: true,
    label: 'Wallet Explorer',
  },
};

/** Fallback origin for unmatched paths on the canonical host. */
const FALLBACK_ORIGIN = 'https://cinacoin-website.pages.dev';

/** WebSocket upstream for analytics real-time data. */
const ANALYTICS_WS_ORIGIN = 'wss://cinacoin-analytics.pages.dev';

/** Retired subdomain → canonical subpath prefix mapping. */
const RETIRED_SUBDOMAINS: Record<string, string> = {
  'demo.cinacoin.com': '/demo',
  'wallet.cinacoin.com': '/wallets',
  'cloud.cinacoin.com': '/dashboard',
  // analytics.cinacoin.com is NOT retired — it's the analytics API origin.
  // API requests (/api/*) are proxied to the analytics-server Worker via
  // service binding; non-API requests are proxied to the Pages project.
  'docs.cinacoin.com': '/docs',
  'developer.cinacoin.com': '/developer',
  'learn.cinacoin.com': '/learn',
  'telegram.cinacoin.com': '/telegram',
  'farcaster.cinacoin.com': '/farcaster',
};

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function isPreflightRequest(request: Request): boolean {
  return request.method === 'OPTIONS';
}

function addCorsHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  target?: string;
  status?: number;
  durationMs?: number;
}

function logRequest(entry: LogEntry): void {
  // Structured log line — visible in Cloudflare Workers logs / wrangler tail
  const parts = [
    `[router]`,
    entry.method,
    entry.path,
    entry.target ? `→ ${entry.target}` : '',
    entry.status ? `(${entry.status})` : '',
    entry.durationMs !== undefined ? `${entry.durationMs.toFixed(1)}ms` : '',
  ].filter(Boolean);
  console.log(parts.join(' '));
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

interface MatchedRoute {
  prefix: string;
  config: RouteConfig;
}

function matchRoute(pathname: string): MatchedRoute | null {
  // Sort prefixes longest-first so /analytics/ws matches before /analytics
  const sortedPrefixes = Object.keys(ROUTES).sort(
    (a, b) => b.length - a.length,
  );

  for (const prefix of sortedPrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return { prefix, config: ROUTES[prefix] };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// WebSocket proxy
// ---------------------------------------------------------------------------

async function handleWebSocketUpgrade(
  request: Request,
  url: URL,
): Promise<Response> {
  // Only proxy WebSocket upgrades for /analytics/ws/*
  const analyticsWsPrefix = '/analytics/ws';
  if (!url.pathname.startsWith(analyticsWsPrefix)) {
    return new Response('WebSocket not supported on this path', { status: 400 });
  }

  // Build the upstream WebSocket URL
  const wsPath = url.pathname.slice('/analytics'.length); // keep /ws/...
  const upstreamUrl = `${ANALYTICS_WS_ORIGIN}${wsPath}${url.search}`;

  // Create the upstream WebSocket connection
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('Host', new URL(ANALYTICS_WS_ORIGIN).host);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: upstreamHeaders,
    });

    // If the upstream doesn't support WebSocket, return its response
    if (upstreamResponse.status !== 101) {
      return new Response('WebSocket upstream unavailable', { status: 502 });
    }

    return upstreamResponse;
  } catch (err) {
    console.error(`[router] WebSocket proxy error: ${err}`);
    return new Response('WebSocket proxy error', { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Health check endpoints
// ---------------------------------------------------------------------------

async function handleHealthCheck(): Promise<Response> {
  const checks: Record<string, { label: string; status: string; latencyMs?: number }> = {};

  // Probe each route target with a HEAD request
  const entries = Object.entries(ROUTES);
  const results = await Promise.allSettled(
    entries.map(async ([prefix, config]) => {
      const start = Date.now();
      try {
        const resp = await fetch(`${config.target}/`, {
          method: 'HEAD',
          cf: { cacheTtl: 0 }, // bypass cache for health check
        });
        const latencyMs = Date.now() - start;
        return {
          prefix,
          label: config.label,
          status: resp.ok ? 'healthy' : `unhealthy (${resp.status})`,
          latencyMs,
        };
      } catch (err) {
        return {
          prefix,
          label: config.label,
          status: `error: ${err instanceof Error ? err.message : 'unknown'}`,
          latencyMs: Date.now() - start,
        };
      }
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { prefix, ...data } = result.value;
      checks[prefix] = data;
    }
  }

  const allHealthy = Object.values(checks).every(
    (c) => c.status === 'healthy',
  );

  return new Response(
    JSON.stringify(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        backends: checks,
      },
      null,
      2,
    ),
    {
      status: allHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
}

function handleRoutesDebug(): Response {
  const routeTable = Object.entries(ROUTES).map(([prefix, config]) => ({
    prefix,
    target: config.target,
    label: config.label,
    stripPrefix: config.stripPrefix,
  }));

  return new Response(
    JSON.stringify(
      {
        routes: routeTable,
        fallback: FALLBACK_ORIGIN,
        retiredSubdomains: RETIRED_SUBDOMAINS,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
}

// ---------------------------------------------------------------------------
// SPA fallback
// ---------------------------------------------------------------------------

async function proxyWithFallback(
  request: Request,
  targetUrl: URL,
  origin: string,
): Promise<Response> {
  const startTime = Date.now();

  const proxied = new Request(targetUrl, request);
  proxied.headers.set('Host', new URL(origin).host);
  proxied.headers.set('X-Forwarded-Host', new URL(request.url).host);
  proxied.headers.set('X-Forwarded-Proto', new URL(request.url).protocol.replace(':', ''));

  let resp = await fetch(proxied, { redirect: 'manual' });

  // SPA fallback: if the upstream returns 404 and the request was for an HTML
  // page (not a static asset), serve index.html instead.
  if (resp.status === 404 && !isStaticAsset(targetUrl.pathname)) {
    const fallbackUrl = new URL('/index.html', origin);
    const fallbackReq = new Request(fallbackUrl, request);
    fallbackReq.headers.set('Host', new URL(origin).host);
    fallbackReq.headers.set('X-Forwarded-Host', new URL(request.url).host);
    fallbackReq.headers.set('X-Forwarded-Proto', new URL(request.url).protocol.replace(':', ''));

    resp = await fetch(fallbackReq, { redirect: 'manual' });
  }

  const durationMs = Date.now() - startTime;
  logRequest({
    timestamp: new Date().toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    target: targetUrl.toString(),
    status: resp.status,
    durationMs,
  });

  // Clone response to add CORS headers (response from fetch is immutable)
  const newHeaders = new Headers(resp.headers);
  addCorsHeaders(newHeaders);

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
}

/** Check if a path looks like a static asset (has a file extension). */
function isStaticAsset(pathname: string): boolean {
  const lastSegment = pathname.split('/').pop() || '';
  return lastSegment.includes('.') && !lastSegment.startsWith('.');
}

// ---------------------------------------------------------------------------
// Retired subdomain redirect
// ---------------------------------------------------------------------------

function handleRetiredSubdomain(host: string, url: URL): Response | null {
  const prefix = RETIRED_SUBDOMAINS[host];
  if (!prefix) return null;

  let rest = url.pathname;
  // Drop a duplicated leading prefix (old demo.cinacoin.com/demo/x links).
  if (rest === prefix || rest.startsWith(prefix + '/')) {
    rest = rest.slice(prefix.length);
  }
  if (!rest.startsWith('/')) rest = '/' + rest;
  const tail = rest === '/' ? '/' : rest;

  return Response.redirect(
    `https://${CANONICAL_HOST}${prefix}${tail}${url.search}`,
    301,
  );
}

// ---------------------------------------------------------------------------
// Analytics API proxy
// ---------------------------------------------------------------------------

/**
 * Return the upstream path if the request targets the analytics API.
 * The analytics-server Worker registers routes at /v1/*, so we strip
 * the /api prefix before forwarding:
 *   /api/v1/events → /v1/events
 *   /api/v1/health → /v1/health
 *
 * Matches:
 *   - analytics.cinacoin.com/api/*  → /v1/*
 *   - cinacoin.com/analytics/api/*  → /v1/*
 */
function getAnalyticsApiPath(host: string, pathname: string): string | null {
  // Subdomain form: analytics.cinacoin.com/api/*
  if (host === 'analytics.cinacoin.com' && pathname.startsWith('/api')) {
    // Strip /api prefix so /api/v1/events → /v1/events
    return pathname.slice('/api'.length) || '/';
  }
  // Canonical form: cinacoin.com/analytics/api/*
  if (pathname.startsWith('/analytics/api')) {
    // /analytics/api/v1/events → /v1/events
    return pathname.slice('/analytics/api'.length) || '/';
  }
  return null;
}

/** Proxy a request to the analytics-server Worker via service binding. */
async function proxyAnalyticsApi(
  request: Request,
  binding: Fetcher,
  upstreamPath: string,
): Promise<Response> {
  const startTime = Date.now();

  // Rebuild the request so the URL matches the analytics-server route pattern
  const targetUrl = `https://analytics.internal${upstreamPath}`;
  const upstreamReq = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
  });

  try {
    const resp = await binding.fetch(upstreamReq);
    const durationMs = Date.now() - startTime;
    logRequest({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: new URL(request.url).pathname,
      target: `analytics-api:${upstreamPath}`,
      status: resp.status,
      durationMs,
    });

    // Forward response, ensuring CORS headers are present
    const newHeaders = new Headers(resp.headers);
    addCorsHeaders(newHeaders);
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    console.error(`[router] analytics API proxy error: ${err}`);
    return new Response('Analytics API unavailable', { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export interface Env {
  // Service binding to the analytics-server Worker for API proxying
  ANALYTICS_API?: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname;
    const pathname = url.pathname;

    // --- CORS preflight ---
    if (isPreflightRequest(request)) {
      return new Response(null, {
        status: 204,
        headers: new Headers(CORS_HEADERS),
      });
    }

    // --- Health check endpoints ---
    if (pathname === '/_health') {
      const resp = await handleHealthCheck();
      addCorsHeaders(resp.headers);
      return resp;
    }
    if (pathname === '/_routes') {
      const resp = handleRoutesDebug();
      addCorsHeaders(resp.headers);
      return resp;
    }

    // --- Analytics API proxy ---
    // analytics.cinacoin.com/api/* and cinacoin.com/analytics/api/* must be
    // proxied to the analytics-server Worker (not 301-redirected to Pages).
    // This MUST run before the retired-subdomain redirect so that POST
    // requests are preserved (301 converts POST → GET, breaking ingestion).
    const analyticsApiPath = getAnalyticsApiPath(host, pathname);
    if (analyticsApiPath !== null && env.ANALYTICS_API) {
      return proxyAnalyticsApi(request, env.ANALYTICS_API, analyticsApiPath);
    }

    // --- Analytics subdomain frontend proxy ---
    // Non-API requests to analytics.cinacoin.com (dashboard UI) are proxied
    // to the analytics Pages project (not 301-redirected).
    if (host === 'analytics.cinacoin.com') {
      const targetUrl = new URL(pathname + url.search, 'https://cinacoin-analytics.pages.dev');
      return proxyWithFallback(request, targetUrl, 'https://cinacoin-analytics.pages.dev');
    }

    // --- Retired subdomain redirects ---
    const redirectResp = handleRetiredSubdomain(host, url);
    if (redirectResp) return redirectResp;

    // --- WebSocket proxy (analytics) ---
    if (
      request.headers.get('Upgrade') === 'websocket' &&
      pathname.startsWith('/analytics/ws')
    ) {
      return handleWebSocketUpgrade(request, url);
    }

    // --- Canonical host: route to matching zone or fallback ---
    const matched = matchRoute(pathname);

    let origin: string;
    let targetPath: string;

    if (matched) {
      origin = matched.config.target;
      if (matched.config.stripPrefix) {
        targetPath = pathname.slice(matched.prefix.length) || '/';
      } else {
        targetPath = pathname;
      }
    } else {
      origin = FALLBACK_ORIGIN;
      targetPath = pathname;
    }

    const targetUrl = new URL(targetPath + url.search, origin);

    return proxyWithFallback(request, targetUrl, origin);
  },
};
