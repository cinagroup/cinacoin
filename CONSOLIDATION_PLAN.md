# Cinacoin Systematic Consolidation Plan

**Goal:** Consolidate Cinacoin's fragmented multi-subdomain product into one cohesive, Vercel-style developer platform on a single root domain — unified IA, shared design system, shared header/footer, and one auth session.

**Reference model:** vercel.com (single-domain subpath consolidation).

**Date:** 2026-06-06

---

## 1. Current state (the problem)

Cinacoin today is scattered across **9+ production subdomains** plus internal demos, each a separate app with its own (drifting) design, nav, and deploy:

| Surface | App | Domain | Pages |
|---|---|---|---|
| Marketing | `apps/website` | cinacoin.com | 8 |
| Developer console | `apps/cloud-dashboard` | cloud.cinacoin.com | 5 |
| Admin/infra console | `apps/backend-dashboard` | dash.cinacoin.com | 11 |
| Interactive demo | `apps/demo` | demo.cinacoin.com | 12 |
| React SPA demo | `apps/demo-react` | react.cinacoin.com | 4 |
| Wallet directory | `apps/wallet-explorer` | wallet.cinacoin.com | 1 |
| Status page | `apps/health-status` | status.cinacoin.com | 1 |
| Analytics | `apps/analytics-dashboard` | analytics.cinacoin.com | 1 |
| Docs (VitePress) | `docs/` + `docs-site/` | docs.cinacoin.com | many |
| APIs | `wallet-explorer-api`, `project-registry-api` | *-api.cinacoin.com | — |

**Consequences (the same problems Vercel's model solves):**
- **Fragmented brand/UX** — each app drifted (dark vs light theme, missing logos, system fonts vs Inter, different nav/footer). Confirmed in prior audits.
- **Split SEO authority** — docs, blog, marketing each on separate hosts dilute domain authority.
- **No shared session** — cross-subdomain cookies create login friction between marketing → console → docs.
- **Operational sprawl** — 9 deploy pipelines, 9 Cloudflare projects, 9 DNS records, 9 places for things to break (e.g. the analytics 404, the dark-theme dash).
- **Design tokens exist but aren't used** — `packages/design-tokens`, `packages/ui-theme` are scaffolds; apps hand-roll CSS.

---

## 2. Target architecture (the Vercel model, applied)

### 2.1 Single root domain, subpath consolidation

Move every **human-facing** surface onto `cinacoin.com` subpaths. Keep machine APIs and outage-critical / isolation-required surfaces as separate properties (exactly how Vercel keeps `vercel-status.com` and `*-sdk.dev` separate).

```
                         cinacoin.com  (ONE site)
   ┌──────────────────────────────┬──────────────────────────────┐
   │   Marketing + Content zone    │      App / Console zone        │
   │   (static / ISR)              │      (auth-gated, dynamic)     │
   ├──────────────────────────────┼──────────────────────────────┤
   │  /                 home       │  /login        wallet+OAuth    │
   │  /products/*       product    │  /dashboard    dev console     │
   │  /solutions/*      use cases  │  /[team]       team scope      │
   │  /pricing                     │  /[team]/[project]             │
   │  /docs/*           reference  │  /[team]/[project]/keys        │
   │  /guides/*         tutorials  │  /[team]/[project]/analytics   │
   │  /blog/*                      │  /[team]/[project]/settings    │
   │  /changelog                   │  /admin/*      infra console   │
   │  /wallets          explorer   │                                │
   │  /demo             playground │                                │
   │  /templates                   │                                │
   └──────────────────────────────┴──────────────────────────────┘

  Stays separate (by design):
   • status.cinacoin.com      → outage isolation (must survive main-domain downtime)
   • *-api.cinacoin.com       → machine APIs (wallet-explorer-api, project-registry-api, relay, rpc-proxy, keys-server)
   • npm / GitHub             → SDK distribution
```

### 2.2 Domain → path mapping (migration table)

| Today | Tomorrow | Notes |
|---|---|---|
| cinacoin.com | cinacoin.com/ | unchanged root |
| docs.cinacoin.com | cinacoin.com/docs | biggest SEO win; 301 redirect old host |
| cloud.cinacoin.com | cinacoin.com/dashboard | dev console, auth-gated |
| dash.cinacoin.com | cinacoin.com/admin | internal infra console, role-gated |
| demo.cinacoin.com | cinacoin.com/demo | playground |
| react.cinacoin.com | cinacoin.com/demo/react *(or retire)* | example, not a product surface |
| wallet.cinacoin.com | cinacoin.com/wallets | content directory |
| analytics.cinacoin.com | cinacoin.com/dashboard/.../analytics | fold into console (kills the standalone 404) |
| status.cinacoin.com | status.cinacoin.com | **keep separate** (resilience) |
| *blog (in docs/)* | cinacoin.com/blog | promote to first-class |
| *changelog (in website)* | cinacoin.com/changelog | already exists, keep |

**Every retired subdomain gets a permanent 301** to its new path to preserve links + SEO.

---

## 3. How to implement: Next.js Multi-Zones

You do **not** need to merge 9 codebases into one repo overnight. Vercel itself serves marketing, docs, and dashboard as **separate Next.js apps stitched under one domain** via **Multi-Zones** + `rewrites`. This is the lowest-risk path and fits the existing pnpm+Turborepo monorepo.

### 3.1 Pattern

One "router" app (the marketing site) owns the root domain and rewrites path prefixes to the other apps:

```js
// apps/website/next.config.js  (the root zone)
async rewrites() {
  return [
    { source: '/docs',           destination: `${DOCS_URL}/docs` },
    { source: '/docs/:path*',    destination: `${DOCS_URL}/docs/:path*` },
    { source: '/dashboard/:path*', destination: `${CONSOLE_URL}/dashboard/:path*` },
    { source: '/admin/:path*',   destination: `${ADMIN_URL}/admin/:path*` },
    { source: '/wallets/:path*', destination: `${WALLETS_URL}/wallets/:path*` },
    { source: '/demo/:path*',    destination: `${DEMO_URL}/demo/:path*` },
  ];
}
```

Each downstream app sets `basePath` + `assetPrefix` to its prefix so assets resolve correctly:

```js
// apps/cloud-dashboard/next.config.js
const nextConfig = { basePath: '/dashboard', assetPrefix: '/dashboard' };
```

**Result:** a user browses `cinacoin.com/docs`, `cinacoin.com/dashboard`, `cinacoin.com/wallets` with no visible app boundaries, shared cookies, and one nav/footer.

### 3.2 Why Multi-Zones over a single monolith
- Keeps independent build/deploy per zone (fast CI, isolated failures).
- Lets the Vite `demo-react` and VitePress docs keep their toolchains (wrap them as zones too).
- Incremental: migrate one prefix at a time behind the rewrite.

### 3.3 Cloudflare specifics
- Today each app is a separate Cloudflare Pages project. With Multi-Zones, the **root zone** (website) holds the rewrites; downstream zones stay as Pages projects but are addressed internally.
- Alternative on Cloudflare: a single **Worker** in front (`cinacoin.com`) that routes prefixes to the right Pages project (`fetch` proxy by path). This avoids Next rewrites if zones use mixed frameworks.
- **Prerequisite (already blocking deploys today):** fix the `CF_API_TOKEN` scope (Pages + Workers + Routes + DNS edit). Consolidation deploys will fail until this is resolved.

---

## 4. Information architecture (modeled on vercel.com)

### 4.1 Global navigation

```
[◐ Cinacoin]  Products ▾   Solutions ▾   Developers ▾   Pricing   Enterprise        Docs   Log in   [Get started]
```

**Products ▾** (grouped, like Vercel's Products dropdown)
- *Connect* — Core SDK · Wallet button · Sign-In (SIWE/SIWX) · Passkeys · Social login
- *Transact* — Swaps · On-ramp · Account Abstraction (ERC-4337) · Gas sponsorship · Batch (EIP-5792)
- *Infrastructure* — Relay server · RPC proxy · Keys server · Notify/Push · Bundler · Paymaster

**Solutions ▾**
- *Use cases* — GameFi · DeFi · SocialFi · Wallets · RWA
- *Chains* — EVM · Solana · Bitcoin · Cosmos · the 10 non-EVM adapters
- *Tools* — Wallet Explorer · Templates · CLI · Migration (AppKit → Cinacoin codemod)

**Developers ▾** (Vercel's "Resources" + "Learn")
- *Learn* — Docs · Guides · API reference · Changelog
- *Build* — Templates · Demo playground · SDKs (React/Vue/Svelte/Angular/Next/RN/Flutter/Unity/.NET)
- *Community* — GitHub · Blog · Status

**Direct links:** Pricing, Enterprise, Docs.
**Right side:** `Log in` (text) + `Get started` (ink-black pill) — exactly Vercel's pattern.

### 4.2 Page archetypes to standardize (8, like Vercel)

1. **Marketing home** (`/`) — hero, interactive product tabs, logo wall, dual CTA.
2. **Product page** (`/products/connect`, `/products/swaps`, …) — technical, code samples with copy, framework logos.
3. **Solutions page** (`/solutions/gamefi`, `/solutions/evm`, …) — outcome/ROI framing, diagrams.
4. **Pricing** (`/pricing`) — tier cards (Self-hosted / Cloud / Enterprise) + usage matrix accordion.
5. **Docs** (`/docs/...`) — left tree nav, ⌘K search, right anchor rail, "Ask AI", feedback.
6. **Content directory** (`/wallets`, `/templates`) — searchable card grid.
7. **Console** (`/dashboard`, `/[team]/[project]/...`) — dense utility layout, scoped tab bar.
8. **Auth** (`/login`) — stripped chrome (logo only), wallet + OAuth stack.

### 4.3 URL conventions (Vercel-style, readable hierarchy)
- `/products/<slug>` · `/solutions/<slug>` · `/docs/<category>/<page>` · `/guides/<slug>`
- `/templates/<framework>` · `/blog/<slug>` · `/changelog`
- Console: `/[team]` · `/[team]/[project]` · `/[team]/[project]/{keys,analytics,settings}`

---

## 5. Unified design system (the visual glue)

This is where prior audits found the most drift. Vercel's consistency comes from a strict shared system. Make `packages/design-tokens` + a shared UI package the **enforced** single source of truth (today they're unused scaffolds).

### 5.1 Tokens (already drafted in `apps/website/globals.css` — promote to a package)
- **Theme:** ink-on-near-white light default everywhere. `--cc-canvas #fff`, `--cc-canvas-soft #fafafa`, `--cc-ink #171717`, `--cc-body #4d4d4d`, `--cc-hairline #ebebeb`, `--cc-primary #171717`, `--cc-link #0070f3`.
- **Type:** Geist (or Inter as the sanctioned fallback) + JetBrains Mono for code/eyebrows/footer headings. 600-weight sentence-case display with negative tracking.
- **Shape:** small radii (cards rounded-md/lg, marketing CTAs = 100px pill), 1px hairline borders, stacked shadows (level1–5), faint blueprint grid on heroes only.

### 5.2 Make it shared (action)
1. Move the canonical `globals.css` token block + `.cc-*` component primitives into **`packages/design-system`** (supersedes the unused `design-tokens`/`ui-theme`/`cinacoin-ui-theme` — consolidate those three).
2. Publish a Tailwind preset (`packages/config/tailwind-preset` already exists — wire all apps to it) so utilities + tokens match.
3. Every app imports `@cinacoin/design-system/globals.css` instead of hand-rolling. One file changes the whole platform.
4. Ship a shared **`packages/ui`**: `<SiteHeader>`, `<SiteFooter>`, `<Brand>` (28px logo + "Cinacoin" wordmark), `Button`, `Card`, `Badge`, `Input`, `CodeBlock`. Every zone renders the *same* header/footer component.

### 5.3 Global header/footer (rendered identically in every zone)
- **Header:** sticky, 64px, white, hairline bottom; Brand left; the IA dropdowns center; `Log in` + `Get started` right. Auth pages render the stripped variant (logo only).
- **Footer:** Vercel-style multi-column grid with **mono uppercase** headings: Products · Solutions · Developers · SDKs · Resources · Company. Plus status link + social + © line.

---

## 6. Auth & session unification

Because everything is on `cinacoin.com`, use **one root-domain HTTP-only secure cookie** (no cross-subdomain handoff).

- `/login` is the single entry: **wallet auth (SIWE/SIWX, MetaMask, Cinacoin)** as the primary CTA + **GitHub/Google OAuth** + **Passkey** (you already have `packages/siwe`, `siwx`, `passkey-auth`, `social-login`).
- Any unauthenticated hit to `/dashboard` or `/admin` → 302 to `/login?next=...` (Vercel's exact behavior).
- Role-gate `/admin` (the infra console) separately from `/dashboard` (dev console).
- **Payoff** (Vercel's trick): a logged-in dev reading `/docs` can see their real API keys inlined in code samples, and "Deploy this template" from `/templates` provisions a project in their session with no redirect loop.

---

## 7. Codebase / monorepo consolidation

You already have solid bones: **pnpm workspaces + Turborepo**. Tighten, don't rebuild.

### 7.1 Apps: keep, merge, or retire
| App | Action | Rationale |
|---|---|---|
| website | **Keep** as the root zone (owns rewrites + global layout) | already the marketing surface |
| cloud-dashboard | **Keep** → mount at `/dashboard` (basePath) | the dev console |
| backend-dashboard | **Keep** → mount at `/admin`, role-gated | internal infra mgmt |
| analytics-dashboard | **Merge** into cloud-dashboard as a project tab | removes a whole subdomain + its 404 |
| demo | **Keep** → mount at `/demo` | the real playground |
| demo-react / demo-vue / demo-dapp-react | **Demote to `examples/`** (not deployed subdomains) | they're SDK examples, not product surfaces; link from docs |
| wallet-explorer | **Keep** → mount at `/wallets` | content/SEO surface |
| health-status | **Keep separate** (status.cinacoin.com) | outage isolation |
| docs-site (VitePress) | **Keep** → mount at `/docs` as a zone; **fold `/blog`** out of docs into its own route | SEO + content |
| wallet-explorer-api, project-registry-api | **Keep** as `*-api` workers | machine APIs |

Net: **~9 deployed web surfaces → 1 user-facing domain** (website root zone) + a handful of internal zones + status + APIs.

### 7.2 Packages: 89 → ~3 published SDK families + internal
The 89 packages are mostly fine but unwieldy to publish/maintain. Group and consolidate:
- **`@cinacoin/sdk`** (umbrella) — re-exports core-sdk + framework bindings + common features.
- **Framework adapters** stay individual (`@cinacoin/react`, `/vue`, …) — that's correct.
- **Chain adapters** stay individual but documented as one matrix.
- **Consolidate the 3 overlapping UI/theme packages** (`design-tokens` + `ui-theme` + `cinacoin-ui-theme`) → **one `@cinacoin/design-system`** (used by every app, see §5.2).
- **Audit for dead weight**: prior cleanup already removed stubs; continue retiring scaffold-only packages.

### 7.3 Shared tooling
- All apps consume `packages/config` (tsconfig, eslint) **and** the Tailwind preset — make this mandatory, not optional (today `@cinacoin/config` is listed but not imported).
- One Turborepo `build`/`lint`/`typecheck`/`test` pipeline already exists — add a `deploy` pipeline with per-zone filters.

---

## 8. Migration sequencing (incremental, low-risk)

**Phase 0 — Unblock & baseline (prereq)**
- Fix `CF_API_TOKEN` scope so deploys succeed (currently blocking everything).
- Land the shared `@cinacoin/design-system` package; wire `website` to it first.

**Phase 1 — Design unification (no IA change yet)**
- All apps import the shared design system + Tailwind preset; render shared `<SiteHeader>`/`<SiteFooter>`/`<Brand>`. Removes all the drift (dark dash, system fonts, missing logos) in one stroke. *(Much of this is already started.)*

**Phase 2 — Content consolidation (biggest SEO win)**
- Stand up Multi-Zone rewrites on the root: `/docs`, `/wallets`, `/blog`, `/demo`.
- 301 `docs.*`, `wallet.*`, `demo.*` → new paths.

**Phase 3 — App consolidation**
- Mount `cloud-dashboard` at `/dashboard`, `backend-dashboard` at `/admin`; fold `analytics-dashboard` into the console.
- 301 `cloud.*`, `dash.*`, `analytics.*`.

**Phase 4 — Auth unification**
- Single `/login`, root-domain cookie, gated `/dashboard` + `/admin`, inline-keys-in-docs.

**Phase 5 — Cleanup**
- Demote `demo-react`/`demo-vue`/`demo-dapp-react` to `examples/`.
- Consolidate the 3 UI/theme packages; retire dead packages; collapse redundant deploy workflows.

**Keep separate throughout:** `status.cinacoin.com`, `*-api.cinacoin.com`, npm/GitHub SDK distribution.

---

## 9. Success criteria

- **One domain, one nav, one footer, one theme** across home, docs, console, wallets, demo.
- Every retired subdomain 301s to its path (no broken links, SEO preserved/consolidated).
- One login → session valid across docs + console (keys visible in docs samples).
- `analytics.cinacoin.com` 404 eliminated (folded into the console).
- Deploy surfaces reduced from ~9 to ~3; CI green; consistent Cloudflare projects.
- `@cinacoin/design-system` is the single styling source imported by all apps.

---

## 10. Quick-win checklist (do these first)

1. [ ] Fix `CF_API_TOKEN` permissions (unblocks all deploys).
2. [ ] Create `packages/design-system` from the website's `globals.css` tokens + `.cc-*` primitives.
3. [ ] Create `packages/ui` with shared `SiteHeader`/`SiteFooter`/`Brand`/`Button`/`Card`.
4. [ ] Point every app at the shared design system + `tailwind-preset` (kills the drift).
5. [ ] Add Multi-Zone rewrites to `apps/website` for `/docs` and `/wallets` (first two paths).
6. [ ] 301 `docs.cinacoin.com` → `cinacoin.com/docs`.
7. [ ] Build the global nav dropdowns (§4.1) once, in `packages/ui`, reused everywhere.
8. [ ] Fold `analytics-dashboard` into `cloud-dashboard` as a project tab; retire the subdomain.
```
