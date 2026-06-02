/**
 * Wallet Explorer API — Hono + Cloudflare Workers
 *
 * REST API for querying the Cinacoin Wallet Registry.
 *
 * Routes:
 *   GET /api/wallets                  — list all wallets
 *   GET /api/wallets/:id              — single wallet detail
 *   GET /api/wallets/search?q=        — search wallets by name/id
 *   GET /api/wallets/filter?chain=    — filter wallets
 *   GET /api/health                   — health check
 *
 * Features:
 *   - CORS support
 *   - Rate limiting
 *   - Pagination (limit/offset)
 *   - Type-safe responses
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getAllWallets,
  getWalletById,
  filterWallets,
  searchWallets,
  sortWallets,
  WALLET_COUNT,
} from "@cinacoin/wallet-registry";
import type { WalletRegistryEntry, WalletPlatform, WalletChainFamily } from "@cinacoin/wallet-registry";

// ============================================================
// App Setup
// ============================================================

const app = new Hono<{ Bindings: { CORS_ORIGIN?: string } }>();

// CORS middleware
app.use("*", cors({
  origin: (origin) => origin,
  allowMethods: ["GET", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
}));

// ============================================================
// Rate Limiter (in-memory, per-IP)
// ============================================================

interface RateEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute
const rateMap = new Map<string, RateEntry>();

function getRateEntry(key: string): RateEntry {
  const now = Date.now();
  const existing = rateMap.get(key);
  if (!existing || now > existing.resetAt) {
    const fresh: RateEntry = { count: 1, resetAt: now + RATE_WINDOW_MS };
    rateMap.set(key, fresh);
    return fresh;
  }
  existing.count += 1;
  return existing;
}

app.use("/api/*", async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
  const entry = getRateEntry(ip);

  c.header("X-RateLimit-Limit", String(RATE_LIMIT));
  c.header("X-RateLimit-Remaining", String(Math.max(0, RATE_LIMIT - entry.count)));
  c.header("X-RateLimit-Reset", String(entry.resetAt));

  if (entry.count > RATE_LIMIT) {
    return c.json({ error: "Too Many Requests", retryAfter: Math.ceil((entry.resetAt - Date.now()) / 1000) }, 429);
  }

  await next();
});

// ============================================================
// Health Check
// ============================================================

app.get("/api/health", (c) =>
  c.json({ status: "ok", wallets: WALLET_COUNT, timestamp: Date.now() })
);

// ============================================================
// GET /api/wallets — List all wallets
// ============================================================

app.get("/api/wallets", (c) => {
  const limit = parseInt(c.req.query("limit") ?? "50");
  const offset = parseInt(c.req.query("offset") ?? "0");
  const sortField = c.req.query("sort") as "popularity" | "name" | undefined;
  const sortDir = (c.req.query("order") ?? "desc") as "asc" | "desc";

  let wallets: WalletRegistryEntry[] = [...getAllWallets()];

  if (sortField) {
    wallets = sortWallets(wallets, { field: sortField, direction: sortDir });
  } else {
    wallets = sortWallets(wallets, { field: "popularity", direction: "desc" });
  }

  const total = wallets.length;
  const page = wallets.slice(offset, offset + limit);

  return c.json({
    data: page,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

// ============================================================
// GET /api/wallets/:id — Single wallet
// ============================================================

app.get("/api/wallets/:id", (c) => {
  const id = c.req.param("id");
  const wallet = getWalletById(id);

  if (!wallet) {
    return c.json({ error: "Wallet not found", id }, 404);
  }

  return c.json({ data: wallet });
});

// ============================================================
// GET /api/wallets/search?q= — Search wallets
// ============================================================

app.get("/api/wallets/search", (c) => {
  const query = c.req.query("q");

  if (!query || query.trim().length === 0) {
    return c.json({ error: "Query parameter 'q' is required" }, 400);
  }

  const results = searchWallets(query.trim());
  const limit = parseInt(c.req.query("limit") ?? "20");

  return c.json({
    data: results.slice(0, limit),
    meta: {
      total: results.length,
      query,
      limit,
    },
  });
});

// ============================================================
// GET /api/wallets/filter — Filter wallets
// ============================================================

app.get("/api/wallets/filter", (c) => {
  const params = c.req.query();
  const limit = parseInt(params.limit ?? "50");

  const filter: Parameters<typeof filterWallets>[0] = {};

  if (params.chainFamily) filter.chainFamily = params.chainFamily as WalletChainFamily;
  if (params.chain) filter.chain = params.chain;
  if (params.platform) filter.platform = params.platform as WalletPlatform;
  if (params.walletType) filter.walletType = params.walletType as WalletRegistryEntry["walletType"];
  if (params.walletConnectV2) filter.walletConnectV2 = params.walletConnectV2 === "true";
  if (params.eip6963) filter.eip6963 = params.eip6963 === "true";
  if (params.accountAbstraction) filter.accountAbstraction = params.accountAbstraction === "true";
  if (params.openSource) filter.openSource = params.openSource === "true";
  if (params.developer) filter.developer = params.developer;
  if (params.search) filter.search = params.search;

  const results = filterWallets(filter);
  const sorted = sortWallets(results, {
    field: (params.sort as "popularity" | "name") ?? "popularity",
    direction: (params.order as "asc" | "desc") ?? "desc",
  });

  return c.json({
    data: sorted.slice(0, limit),
    meta: {
      total: sorted.length,
      filters: Object.fromEntries(Object.entries(params).filter(([k]) => !["limit", "sort", "order"].includes(k))),
    },
  });
});

// ============================================================
// 404 fallback
// ============================================================

app.notFound((c) => c.json({ error: "Not Found" }, 404));

// ============================================================
// Export
// ============================================================

export default app;
