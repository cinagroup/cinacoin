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
import { z } from "zod";
import { createLogger } from '@cinacoin/logger';
import {
  getAllWallets,
  getWalletById,
  filterWallets,
  searchWallets,
  sortWallets,
  WALLET_COUNT,
} from "@cinacoin/wallet-registry";
import type { WalletRegistryEntry, WalletPlatform, WalletChainFamily } from "@cinacoin/wallet-registry";

const logger = createLogger({ name: 'wallet-explorer-api', level: 'info' });

// ─── Zod Query Schemas ─────────────────────────────────────────────────────

const walletsListQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).default("50"),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).default("0"),
  sort: z.enum(["popularity", "name"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const walletsSearchQuerySchema = z.object({
  q: z.string().min(1, "Query parameter 'q' is required").max(200),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).default("20"),
});

const walletsFilterQuerySchema = z.object({
  chainFamily: z.string().max(50).optional(),
  chain: z.string().max(50).optional(),
  platform: z.string().max(50).optional(),
  walletType: z.string().max(50).optional(),
  walletConnectV2: z.string().optional(),
  eip6963: z.string().optional(),
  accountAbstraction: z.string().optional(),
  openSource: z.string().optional(),
  developer: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).default("50"),
  sort: z.enum(["popularity", "name"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================
// App Setup
// ============================================================

const app = new Hono<{ Bindings: { CORS_ORIGIN?: string; ALLOWED_ORIGINS?: string } }>();

// Allowed origins for CORS (strict whitelist)
const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
  'https://wallet.cinacoin.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

// CORS middleware - strict origin validation (no wildcard)
app.use("*", cors({
  origin: (origin) => {
    // Only allow requests from explicitly whitelisted origins
    if (!origin) return null;
    if (ALLOWED_ORIGINS.includes(origin)) {
      return origin;
    }
    return null; // Reject non-allowed origins — do NOT set Access-Control-Allow-Origin
  },
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
  const parsed = walletsListQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { limit, offset, sort: sortField, order: sortDir } = parsed.data;

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
  const parsed = walletsSearchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const { q, limit } = parsed.data;

  const results = searchWallets(q.trim());

  return c.json({
    data: results.slice(0, limit),
    meta: {
      total: results.length,
      query: q,
      limit,
    },
  });
});

// ============================================================
// GET /api/wallets/filter — Filter wallets
// ============================================================

app.get("/api/wallets/filter", (c) => {
  const parsed = walletsFilterQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }
  const params = parsed.data;
  const { limit } = params;

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
    field: params.sort ?? "popularity",
    direction: params.order,
  });

  return c.json({
    data: sorted.slice(0, limit),
    meta: {
      total: sorted.length,
      filters: Object.fromEntries(Object.entries(c.req.query()).filter(([k]) => !["limit", "sort", "order"].includes(k))),
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
