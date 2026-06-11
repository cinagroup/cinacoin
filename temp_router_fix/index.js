var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var CANONICAL_HOST = "cinacoin.com";
var ROUTES = {
  "/docs": {
    target: "https://cinacoin-docs.pages.dev",
    stripPrefix: true,
    label: "Documentation"
  },
  "/developer": {
    target: "https://cinacoin-developer-dashboard.pages.dev",
    stripPrefix: true,
    label: "Developer Portal"
  },
  "/learn": {
    target: "https://cinacoin-learn.pages.dev",
    stripPrefix: true,
    label: "Learn Platform"
  },
  "/demo": {
    target: "https://cinacoin-demo-react.pages.dev",
    stripPrefix: true,
    label: "Demo dApp"
  },
  "/telegram": {
    target: "https://cinacoin-telegram.pages.dev",
    stripPrefix: true,
    label: "Telegram Mini App"
  },
  "/farcaster": {
    target: "https://cinacoin-farcaster.pages.dev",
    stripPrefix: true,
    label: "Farcaster Frame"
  },
  "/analytics": {
    target: "https://cinacoin-analytics.pages.dev",
    stripPrefix: true,
    label: "Analytics Dashboard"
  },
  "/dashboard": {
    target: "https://cinacoin-cloud-dashboard.pages.dev",
    stripPrefix: true,
    label: "Cloud Dashboard"
  },
  "/wallets": {
    target: "https://cinacoin-wallet-explorer.pages.dev",
    stripPrefix: true,
    label: "Wallet Explorer"
  }
};
var FALLBACK_ORIGIN = "https://cinacoin-website.pages.dev";
var ANALYTICS_WS_ORIGIN = "wss://cinacoin-analytics.pages.dev";
var RETIRED_SUBDOMAINS = {
  // Keep subdomains that should be routed through Workers
  "docs.cinacoin.com": "/docs",
  "developer.cinacoin.com": "/developer",
  "learn.cinacoin.com": "/learn",
  "telegram.cinacoin.com": "/telegram",
  "farcaster.cinacoin.com": "/farcaster"
  // Removed: demo.cinacoin.com, wallet.cinacoin.com, cloud.cinacoin.com, analytics.cinacoin.com
};
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
};
function isPreflightRequest(request) {
  return request.method === "OPTIONS";
}
__name(isPreflightRequest, "isPreflightRequest");
function addCorsHeaders(headers) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
}
__name(addCorsHeaders, "addCorsHeaders");
function logRequest(entry) {
  const parts = [
    `[router]`,
    entry.method,
    entry.path,
    entry.target ? `\u2192 ${entry.target}` : "",
    entry.status ? `(${entry.status})` : "",
    entry.durationMs !== void 0 ? `${entry.durationMs.toFixed(1)}ms` : ""
  ].filter(Boolean);
  console.log(parts.join(" "));
}
__name(logRequest, "logRequest");
function matchRoute(pathname) {
  const sortedPrefixes = Object.keys(ROUTES).sort(
    (a, b) => b.length - a.length
  );
  for (const prefix of sortedPrefixes) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return { prefix, config: ROUTES[prefix] };
    }
  }
  return null;
}
__name(matchRoute, "matchRoute");
async function handleWebSocketUpgrade(request, url) {
  const analyticsWsPrefix = "/analytics/ws";
  if (!url.pathname.startsWith(analyticsWsPrefix)) {
    return new Response("WebSocket not supported on this path", { status: 400 });
  }
  const wsPath = url.pathname.slice("/analytics".length);
  const upstreamUrl = `${ANALYTICS_WS_ORIGIN}${wsPath}${url.search}`;
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set("Host", new URL(ANALYTICS_WS_ORIGIN).host);
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: upstreamHeaders
    });
    if (upstreamResponse.status !== 101) {
      return new Response("WebSocket upstream unavailable", { status: 502 });
    }
    return upstreamResponse;
  } catch (err) {
    console.error(`[router] WebSocket proxy error: ${err}`);
    return new Response("WebSocket proxy error", { status: 502 });
  }
}
__name(handleWebSocketUpgrade, "handleWebSocketUpgrade");
async function handleHealthCheck() {
  const checks = {};
  const entries = Object.entries(ROUTES);
  const results = await Promise.allSettled(
    entries.map(async ([prefix, config]) => {
      const start = Date.now();
      try {
        const resp = await fetch(`${config.target}/`, {
          method: "HEAD",
          cf: { cacheTtl: 0 }
          // bypass cache for health check
        });
        const latencyMs = Date.now() - start;
        return {
          prefix,
          label: config.label,
          status: resp.ok ? "healthy" : `unhealthy (${resp.status})`,
          latencyMs
        };
      } catch (err) {
        return {
          prefix,
          label: config.label,
          status: `error: ${err instanceof Error ? err.message : "unknown"}`,
          latencyMs: Date.now() - start
        };
      }
    })
  );
  for (const result of results) {
    if (result.status === "fulfilled") {
      const { prefix, ...data } = result.value;
      checks[prefix] = data;
    }
  }
  const allHealthy = Object.values(checks).every(
    (c) => c.status === "healthy"
  );
  return new Response(
    JSON.stringify(
      {
        status: allHealthy ? "healthy" : "degraded",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        backends: checks
      },
      null,
      2
    ),
    {
      status: allHealthy ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
__name(handleHealthCheck, "handleHealthCheck");
function handleRoutesDebug() {
  const routeTable = Object.entries(ROUTES).map(([prefix, config]) => ({
    prefix,
    target: config.target,
    label: config.label,
    stripPrefix: config.stripPrefix
  }));
  return new Response(
    JSON.stringify(
      {
        routes: routeTable,
        fallback: FALLBACK_ORIGIN,
        retiredSubdomains: RETIRED_SUBDOMAINS
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
__name(handleRoutesDebug, "handleRoutesDebug");
async function proxyWithFallback(request, targetUrl, origin) {
  const startTime = Date.now();
  const proxied = new Request(targetUrl, request);
  proxied.headers.set("Host", new URL(origin).host);
  proxied.headers.set("X-Forwarded-Host", new URL(request.url).host);
  proxied.headers.set("X-Forwarded-Proto", new URL(request.url).protocol.replace(":", ""));
  let resp = await fetch(proxied, { redirect: "manual" });
  if (resp.status === 404 && !isStaticAsset(targetUrl.pathname)) {
    const fallbackUrl = new URL("/index.html", origin);
    const fallbackReq = new Request(fallbackUrl, request);
    fallbackReq.headers.set("Host", new URL(origin).host);
    fallbackReq.headers.set("X-Forwarded-Host", new URL(request.url).host);
    fallbackReq.headers.set("X-Forwarded-Proto", new URL(request.url).protocol.replace(":", ""));
    resp = await fetch(fallbackReq, { redirect: "manual" });
  }
  const durationMs = Date.now() - startTime;
  logRequest({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    method: request.method,
    path: new URL(request.url).pathname,
    target: targetUrl.toString(),
    status: resp.status,
    durationMs
  });
  const newHeaders = new Headers(resp.headers);
  addCorsHeaders(newHeaders);
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders
  });
}
__name(proxyWithFallback, "proxyWithFallback");
function isStaticAsset(pathname) {
  const lastSegment = pathname.split("/").pop() || "";
  return lastSegment.includes(".") && !lastSegment.startsWith(".");
}
__name(isStaticAsset, "isStaticAsset");
function handleRetiredSubdomain(host, url) {
  const prefix = RETIRED_SUBDOMAINS[host];
  if (!prefix)
    return null;
  let rest = url.pathname;
  if (rest === prefix || rest.startsWith(prefix + "/")) {
    rest = rest.slice(prefix.length);
  }
  if (!rest.startsWith("/"))
    rest = "/" + rest;
  const tail = rest === "/" ? "/" : rest;
  return Response.redirect(
    `https://${CANONICAL_HOST}${prefix}${tail}${url.search}`,
    301
  );
}
__name(handleRetiredSubdomain, "handleRetiredSubdomain");
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;
    const pathname = url.pathname;
    if (isPreflightRequest(request)) {
      return new Response(null, {
        status: 204,
        headers: new Headers(CORS_HEADERS)
      });
    }
    if (pathname === "/_health") {
      const resp = await handleHealthCheck();
      addCorsHeaders(resp.headers);
      return resp;
    }
    if (pathname === "/_routes") {
      const resp = handleRoutesDebug();
      addCorsHeaders(resp.headers);
      return resp;
    }
    const redirectResp = handleRetiredSubdomain(host, url);
    if (redirectResp)
      return redirectResp;
    if (request.headers.get("Upgrade") === "websocket" && pathname.startsWith("/analytics/ws")) {
      return handleWebSocketUpgrade(request, url);
    }
    const matched = matchRoute(pathname);
    let origin;
    let targetPath;
    if (matched) {
      origin = matched.config.target;
      if (matched.config.stripPrefix) {
        targetPath = pathname.slice(matched.prefix.length) || "/";
      } else {
        targetPath = pathname;
      }
    } else {
      origin = FALLBACK_ORIGIN;
      targetPath = pathname;
    }
    const targetUrl = new URL(targetPath + url.search, origin);
    return proxyWithFallback(request, targetUrl, origin);
  }
};
export {
  src_default as default
};