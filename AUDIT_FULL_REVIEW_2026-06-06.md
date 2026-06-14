# Cinacoin — Full-Stack Audit & Optimization Report

**Date:** 2026-06-06
**Scope:** Security, functionality, UI/branding, and interaction across the source code and the 8 deployed sites.
**Mode:** Audit + code fixes committed to git (no production deploys performed).

---

## 1. Executive Summary

A full pass was run across the monorepo (89 packages, 13 apps) and all 8 live subdomains. Findings were triaged P0 (exploitable / blocking), P1 (serious), P2 (polish). **All P0 and the high-value P1 items below have been fixed in source and committed.** Remaining items are listed as recommendations.

### Site availability snapshot

| Domain | App | HTTP | Notes |
|---|---|---|---|
| cinacoin.com | apps/website | 200 | Dashboard links pointed to wrong domain (fixed) |
| cloud.cinacoin.com | apps/cloud-dashboard | 200 | Dead Save/Delete buttons, placeholder identity (fixed) |
| demo.cinacoin.com | apps/demo | 200 | Mock-data TODOs (noted) |
| react.cinacoin.com | apps/demo-react | 200 | "CinaConnect" brand, dead Swap, bad project ID (fixed) |
| dash.cinacoin.com | apps/backend-dashboard | 200 | Dark theme default vs brand light (fixed) |
| status.cinacoin.com | apps/health-status | 200 | Mixed-language incident copy (noted) |
| analytics.cinacoin.com | apps/analytics-dashboard | **404** | No route binding + no CI workflow (fixed in config) |
| wallet.cinacoin.com | apps/wallet-explorer | 200 | 104 broken logos, bad "Back" link (fixed) |

---

## 2. Security Findings

### P0 — Authentication bypass in notify-server
**File:** `packages/notify-server/src/middleware/auth.rs`
The auth middleware only checked for the *presence* of an `Authorization` header — any non-empty header passed. Worse, it was wired as `.layer(AuthLayer::new())` where `AuthLayer` is an empty struct that does not implement a Tower `Layer`, so it was not enforcing anything.
**Fix:** Implemented real HS256 JWT verification (signature, expiry, issuer) modeled on the keys-server validator, plus a Redis-backed revocation check. Re-wired with `axum::middleware::from_fn`. Added `jsonwebtoken` dependency and an async `is_token_revoked` helper to `redis.rs`.

### P0 — push-server endpoints unauthenticated
**File:** `packages/push-server/src/router.rs`, `main.rs`
`/v1/push`, `/v1/push/batch`, and `/v1/register` had **no auth middleware at all** — anyone could send pushes or register devices.
**Fix:** Added `packages/push-server/src/auth.rs` (HS256 JWT verification, health/metrics allow-listed), wired via `from_fn_with_state`, and added a required `JWT_SECRET` (min 16 chars) to the push-server config.

### P2 — Permissive CORS on keys-server
**File:** `packages/keys-server/src/main.rs`
`CorsLayer::permissive()` (wildcard origin) on a server that performs key generation, rotation, and message signing.
**Fix:** Added `allowed_origins` config (`KEYS_ALLOWED_ORIGINS`) and a `build_cors()` helper that allow-lists explicit origins, restricts methods/headers, and never falls back to a wildcard.

### Verified-good (no action needed)
- **Crypto** (`core-sdk/src/crypto`): real X25519 (`@noble/curves`) + ChaCha20-Poly1305 (`@noble/ciphers`) + SHA-256. No XOR/`Math.random`/placeholder crypto.
- **keys-server**: mandatory `JWT_SECRET` (no default, ≥16 chars), HKDF-SHA256 key derivation, ChaCha20-Poly1305 encryption of private keys, `zeroize()` after use, Redis blacklist.
- **relay-server** (Rust): topic validation (64 hex), connection rate limiting, max frame size.
- **rpc-proxy**: body size limits, rate limiting, caching.
- **SIWE/SIWX**: ABNF validation, domain match, nonce ≥8, expiry/not-before checks.

---

## 3. Branding & UI Findings

### P0 — Wrong "Dashboard" destination (website)
`apps/website/src/components/Navbar.tsx` (desktop + mobile) and `apps/website/src/app/pricing/PricingContent.tsx` (both CTAs) pointed the developer **Dashboard** to `https://dash.cinacoin.com` (the backend admin/cluster manager) instead of the developer portal `https://cloud.cinacoin.com`.
**Fix:** All four links repointed to `cloud.cinacoin.com`; updated the matching preconnect hint in `layout.tsx`.

### P1 — "CinaConnect" brand instead of "Cinacoin" (react demo)
`apps/demo-react/src/pages/HomePage.tsx:66` rendered `Cina<span>Connect</span>`.
**Fix:** Changed to `Cina<span>coin</span>`. (Note: the *live* react.cinacoin.com still shows "CinaConnect" because it serves a stale build — see §6 deploy recommendation.)

### P1 — backend-dashboard defaults to dark theme
`apps/backend-dashboard/src/providers/ThemeProvider.tsx` defaulted to `'dark'` (context default, initial state, and system-preference fallback), violating the brand light theme.
**Fix:** Default is now `'light'`; users can still opt into dark via the toggle, and a stored preference is respected.

### P2 — Placeholder identity in cloud-dashboard settings
`apps/cloud-dashboard/src/app/settings/page.tsx` shipped `十三先生` and `user@cinacoin.dev` as default field values.
**Fix:** Replaced with controlled, empty inputs and neutral placeholders.

---

## 4. Functional / Interaction Findings

### P0 — Dead "Swap" button (react demo)
`apps/demo-react/src/pages/SwapPage.tsx:161` had no `onClick` — clicking did nothing.
**Fix:** Added a `handleSwap` demo simulation with `swapStatus` state (Swap → Swapping… → ✓ complete) and proper disabled handling.

### P1 — Broken Cinacoin init (react demo)
`apps/demo-react/src/contexts/WalletContext.tsx:207` used a hardcoded fake project ID `c8e4e0f2…` fallback, causing live `403 Forbidden` on Cinacoin API calls. Metadata URL was a stale `cinacoin-demo.pages.dev`.
**Fix:** Throw a clear configuration error when `VITE_WC_PROJECT_ID` is missing (no broken fallback); metadata URL → `https://react.cinacoin.com`. Also fixed the SIWE message domain in `AuthPage.tsx`.

### P1 — API key never appears after generation (cloud-dashboard)
`apps/cloud-dashboard/src/components/ApiKeyManager.tsx` generated a key but never appended it to the list.
**Fix:** New keys are now prepended to the active-keys list; removed the redundant write-only state.

### P1 — Dead Save / Delete buttons (cloud-dashboard settings)
"Save Changes" and "Delete Account" had no handlers.
**Fix:** Profile wrapped in a `<form>` with a working save + confirmation; Delete Account now shows a confirm dialog.

### P1 — 104 broken wallet logos (wallet-explorer)
Logos are loaded from `https://registry.walletconnect.com/api/v2/logo/md/<id>` (a competitor host that returns `ERR_CONNECTION_REFUSED`); the old `onError` just hid the image, leaving empty grey boxes. Source data: `packages/wallet-registry/src/registry.ts`.
**Fix:** Card now degrades gracefully to a branded first-letter avatar on image error (state-driven), with lazy loading. **Recommendation:** self-host the logos at `assets.cinacoin.com` and update the registry, both for resilience and to match the "self-hosted Cinacoin replacement" narrative.

### P1 — "Back to Cinacoin" loops on itself (wallet-explorer)
`apps/wallet-explorer/src/app/page.tsx:476` used `href="/"`, which stays on `wallet.cinacoin.com`.
**Fix:** Absolute `https://cinacoin.com`.

---

## 5. analytics.cinacoin.com 404 — Root Cause & Fix

**Diagnosis:** DNS for `analytics.cinacoin.com` resolves to Cloudflare (explicit record, not wildcard), and the response is `HTTP 404, Content-Length: 0, Server: cloudflare`. The app (`apps/analytics-dashboard`) is a Next.js 15 worker built with OpenNext, but:
1. `wrangler.toml` defined the worker `cinacoin-analytics` with **no route / custom-domain binding** → Cloudflare proxies the host but no worker handles it → empty 404.
2. There was **no GitHub Actions workflow** to build/deploy it.

**Fix (config only — deploy still required):**
- Added a `routes = [{ pattern = "analytics.cinacoin.com", custom_domain = true }]` binding to `apps/analytics-dashboard/wrangler.toml`.
- Added `.github/workflows/deploy-analytics.yml` (OpenNext build → `wrangler deploy`), matching the existing deploy-workflow conventions and using the existing `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets.

Once merged to `main`, the workflow (or a manual `pnpm --filter analytics-dashboard deploy:cf`) will publish the worker and bind the domain, resolving the 404.

---

## 6. Recommendations (not changed in this pass)

1. **Redeploy the affected apps.** Several fixes (CinaConnect brand, dead Swap, etc.) only take effect after a rebuild/redeploy. The live `react.cinacoin.com` is currently a stale build.
2. **Add missing CI/CD + wrangler configs** for `cloud-dashboard`, `demo-react`, and `wallet-explorer` (they are live but have no committed deploy config — deploys appear to be manual and non-reproducible). I did not fabricate these to avoid guessing existing Cloudflare project names; provide the project names and I will add them.
3. **Self-host wallet logos** (see §4) instead of depending on `registry.walletconnect.com`.
4. **Replace demo mock data** flagged as `TODO` in `apps/demo` (`aa-demo`, `profile`, `tokens` pages) with real price/gas APIs, or label clearly as demo.
5. **Localize status-page incident copy** (`apps/health-status/public/incidents.json`) — currently mixes English UI with Chinese incident text.
6. **Compile/typecheck verification:** Rust (`cargo`) and a full `pnpm install` were not available in this environment, so the Rust and TS changes were not locally compiled. They follow patterns already proven in the codebase (e.g. keys-server auth/CORS). Run CI / `cargo check` + `pnpm -r typecheck` before deploying.

---

## 7. Files Changed

**Backend (Rust):**
- `packages/notify-server/src/middleware/auth.rs` — real JWT auth
- `packages/notify-server/src/main.rs` — middleware wiring + brand
- `packages/notify-server/src/redis.rs` — `is_token_revoked`
- `packages/notify-server/Cargo.toml` — `jsonwebtoken`
- `packages/push-server/src/auth.rs` — new JWT auth (new file)
- `packages/push-server/src/main.rs` — wire auth + `mod auth`
- `packages/push-server/src/config.rs` — required `JWT_SECRET`
- `packages/keys-server/src/main.rs` — restricted CORS
- `packages/keys-server/src/config.rs` — `allowed_origins`

**Frontend (TS/React):**
- `apps/website/src/components/Navbar.tsx`, `app/pricing/PricingContent.tsx`, `app/layout.tsx` — dashboard links
- `apps/demo-react/src/pages/HomePage.tsx` — brand
- `apps/demo-react/src/pages/SwapPage.tsx` — working swap
- `apps/demo-react/src/pages/AuthPage.tsx`, `MultiChainPage.tsx` — domain/placeholder
- `apps/demo-react/src/contexts/WalletContext.tsx` — project ID handling
- `apps/cloud-dashboard/src/app/settings/page.tsx` — working forms, no placeholder identity
- `apps/cloud-dashboard/src/components/ApiKeyManager.tsx` — key list state fix
- `apps/backend-dashboard/src/providers/ThemeProvider.tsx` — light default
- `apps/wallet-explorer/src/app/page.tsx` — logo fallback + Back link

**Deploy/config:**
- `apps/analytics-dashboard/wrangler.toml` — custom-domain route
- `.github/workflows/deploy-analytics.yml` — deploy workflow (new file)
