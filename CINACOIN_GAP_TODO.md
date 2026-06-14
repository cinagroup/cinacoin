# Cinacoin — Production Gap TODO (vs Cinacoin / AppKit)

> Generated 2026-06-06. Method: cataloged the full Cinacoin/AppKit feature surface from
> docs.cinacoin.com (llms.txt index + relay, smart-accounts, blockchain-api, payments pages),
> then audited all ~90 packages and 13 apps in this monorepo for FULL / PARTIAL / MISSING
> against that surface, with file-path evidence. Each gap below cites the exact file and an
> acceptance criterion.

---

## TL;DR

Cinacoin is **substantially feature-complete** versus Cinacoin. The protocol core, crypto,
relay, framework SDKs (web + all native), auth (SIWE/SIWX/passkey/social/embedded),
account-abstraction stack, payments (swap/onramp/deposit/pay), blockchain API, notifications,
and registries are **real, production-grade implementations** — not stubs. Crypto is correct
(`@noble/ciphers` X25519 + ChaCha20-Poly1305 + SHA-256 on TS, `x25519-dalek` +
`chacha20poly1305` + `sha2` on Rust). No placeholder/XOR/AES-fallback crypto found anywhere.

The remaining gaps are **narrow and concentrated**, mostly in **customer-facing dashboards
showing mock/random data** rather than wiring to the (already-built) backends. There are also
two real technical correctness bugs (Starknet hash, Sui tx assembly) and a handful of
documented "coming soon" items.

**Gap count: 3 × P0, 4 × P1, 6 × P2.**

---

## Implementation status (2026-06-06 pass)

| Item | Status | Notes |
|------|--------|-------|
| P0-1 Cloud usage stats | ✅ Done | `getUsageStats` now calls `/api/usage/:id/summary`; ProjectDetailClient + chart wired; no `Math.random`. |
| P0-2 API-key persistence | ✅ Done | `ApiKeyManager` + `api.ts` use real `project-registry-api` key routes (hashed, list/create/revoke); route paths corrected. |
| P0-3 Analytics KPIs | ✅ Done | New `GET /v1/overview` on analytics-server (D1 aggregation); dashboard fetches it; "DEMO DATA" + hardcoded arrays removed; honest zero-state. |
| P1-1 Starknet Pedersen | ✅ Done | Real `calculateContractAddressFromHash` + `sn_keccak` selectors (invoke + call); `@noble/hashes` dep; tests w/ known vectors. |
| P1-2 Sui TransactionBlock | ✅ Done | `transferSui` uses real `buildSuiTransferTx`/`executeTransfer` + serialize; `setConnector` stores connector; core-sdk sui `-1` placeholder replaced with real input registration (P2-4). |
| P1-3 Compiled artifacts | ✅ Done | Purged ~1,255 committed `.js`/`.js.map`/`.d.ts`(+map) from `src/`; kept authored router `.js` + ambient `.d.ts`; added `.gitignore` rules. The artifacts were actively breaking builds (esbuild/tsup prefer a stale `.js` over the `.ts`, e.g. `ens.js` importing `"./types.js.js"`). Also fixed genuinely-broken sources the purge surfaced (`@cinacoin/analytics` missing functional exports + wrong import path) and missing `@types/react` in 5 react-using packages. |
| P1-4 Migration docs/codemods | ✅ Done | Docs corrected (`appkit-to-cinacoin`, removed "coming soon"); ConnectKit/RainbowKit codemods already shipped + tested. |
| P2-3 Cosmos broadcast comment | ✅ Done | Clarified wallet-driven broadcast path; carries protobuf body/authInfo bytes; points to `adapter-cosmos` for SDK-side broadcast. |
| P2-4 Sui core-sdk placeholder | ✅ Done | See P1-2 row. |
| P2-6 React stale `.js` TODOs | ✅ Done | Resolved by the P1-3 artifact purge (the stale `OnChainUXProvider.js` etc. are gone). |
| P2-1 AA gas convenience | ⏳ Deferred | Current behavior documented & correct-by-contract; convenience wrapper needs cross-package bundler wiring. |
| P2-2 Dashboard latency metric | ⏳ Deferred | Needs server-side latency percentile tracking (shows "—" until then, not fabricated). |
| P2-5 Go RPC-proxy Prometheus | ⏳ Deferred | Real counters needed in the Go variant (TS variant already full). |

---

## P0 — Ship blockers (mock data shown to users / correctness bugs)

### P0-1 — Cloud dashboard usage stats are `Math.random()`, not real
- **Cinacoin parity:** Cloud Dashboard shows real per-project request/error/latency analytics.
- **Cinacoin state:** PARTIAL. Project CRUD is real (`project-registry-api` D1 backend), but
  usage charts are fabricated client-side.
- **Evidence:** `apps/cloud-dashboard/src/lib/api.ts:124-138` — `getUsageStats()` returns
  `Math.floor(Math.random() * 5000)` per day, `Math.random()*100` errors, hardcoded
  `avgLatency: 45`. Also `apps/cloud-dashboard/src/app/projects/[id]/ProjectDetailClient.tsx:33`
  "Generate mock usage data".
- **Scope:** Add a stats endpoint to `analytics-server` (it already ingests events into D1 +
  KV) keyed by projectId; replace `getUsageStats()` with a real `fetchApi('/api/usage?projectId=…')`
  call; aggregate requests/errors/latency from the D1 events table over a date range.
- **Acceptance:** Charts reflect real ingested traffic; with zero traffic a new project shows
  zeros (not random); no `Math.random` remains in `cloud-dashboard/src/lib/api.ts`.

### P0-2 — Cloud dashboard API-key manager is React-state only (keys not persisted)
- **Cinacoin parity:** API keys/projectIds are persisted server-side and enforced by the relay/RPC.
- **Cinacoin state:** PARTIAL. Keys are generated and mutated only in component state; they are
  lost on reload and never written to the backend.
- **Evidence:** `apps/cloud-dashboard/src/components/ApiKeyManager.tsx:14-21` (local random
  array in state). Backend already supports keys: `apps/project-registry-api/src/middleware/apiKeyAuth.ts`.
- **Scope:** Wire `ApiKeyManager` create/list/revoke to the real `project-registry-api`
  endpoints (`createApiKey`/`revokeApiKey` stubs already exist at `api.ts:113-122`); persist to
  D1; show key once on creation, store only a hash.
- **Acceptance:** Created keys survive reload, are stored hashed in D1, and the relay/RPC-proxy
  reject requests with unknown/revoked keys (verify against `rpc-proxy` origin/key check).

### P0-3 — Analytics dashboard front page shows hardcoded demo KPIs/series
- **Cinacoin parity:** Analytics surfaces real on-ramp volume, active wallets, tx counts, conversion.
- **Cinacoin state:** PARTIAL. The ingestion server (`analytics-server`) and query route exist
  and are real, but the dashboard home renders static constants and is labelled "DEMO DATA".
- **Evidence:** `apps/analytics-dashboard/src/app/page.tsx:5-25` (`KPIS`, `VOLUME` constants),
  `:45` eyebrow `OVERVIEW · DEMO DATA`; in-memory store noted at
  `apps/analytics-dashboard/src/lib/analytics.ts:5-6` ("replace … with a database-backed implementation").
- **Scope:** Point the page at the existing `src/app/api/analytics/query/route.ts`; back
  `lib/analytics.ts` with D1 (reuse `analytics-server` schema) instead of in-memory; remove the
  "DEMO DATA" label once live.
- **Acceptance:** KPIs/charts come from queried events; empty environment renders zero-states;
  no `DEMO DATA` label and no hardcoded `KPIS`/`VOLUME` arrays remain.

---

## P1 — Correctness & integration gaps (functional but wrong/incomplete)

### P1-1 — Starknet adapter uses a fake hash instead of Pedersen
- **Cinacoin parity:** Starknet support computes correct Pedersen-based addresses/hashes.
- **Cinacoin state:** PARTIAL — connects to Argent-X/Braavos but address/tx hashing is a toy
  ASCII-sum, so derived addresses and hashes are wrong on mainnet.
- **Evidence:** `packages/adapter-starknet/src/services/starknet-ops.ts:328` —
  `// Simple hash for demonstration — replace with actual Pedersen` (`hash = hash*31n + charCode`).
- **Scope:** Replace with real Pedersen hash + correct contract-address derivation using
  `starknet.js` (`hash.computePedersenHash` / `calculateContractAddressFromHash`).
- **Acceptance:** Derived Starknet addresses match Argent-X/Braavos for the same pubkey; a known
  test vector matches `starknet.js`; demonstration comment removed.

### P1-2 — Sui adapter delegates tx assembly to wallet instead of building TransactionBlock
- **Cinacoin parity:** Native Sui transaction construction (Move calls, coin splits) under SDK control.
- **Cinacoin state:** PARTIAL — works via wallet `signAndExecuteTransaction`, but the SDK does
  not build a proper Mysten `TransactionBlock`, limiting programmable/sponsored flows; a deprecated
  shim is a no-op.
- **Evidence:** `packages/adapter-sui/src/SuiAdapter.ts:516` ("For now, we delegate … In a full
  implementation, you'd use @mysten/sui.js TransactionBlock here"); `:236` `setConnector` "No-op for now".
- **Scope:** Build `TransactionBlock` via `@mysten/sui` for transfers/Move calls; remove or
  implement the deprecated `setConnector` shim.
- **Acceptance:** Transfers and a sample Move call execute through an SDK-built `TransactionBlock`
  on Sui testnet; no "for now"/no-op comments remain in the adapter's hot path.

### P1-3 — Blockchain-API stale compiled `.js` carries pre-integration TODOs
- **Cinacoin parity:** Blockchain API resolves balances/history/NFTs via indexers.
- **Cinacoin state:** FULL in TypeScript source (`client.ts` uses viem + Alchemy/Covalent +
  on-chain fallback + NFT scans), but **stale compiled artifacts** still contain old TODOs and
  can shadow fresh builds (a recurring bug class in this repo).
- **Evidence:** `packages/blockchain-api/src/client.js:186` `// TODO: Connect to an indexer API`
  and `:316` `// TODO: Connect to an NFT indexer` — these contradict the up-to-date `client.ts`.
- **Scope:** Delete committed build artifacts (`src/*.js`/`*.d.ts` sitting next to `.ts`) from
  this and any package; add them to `.gitignore`; ensure CI builds from source.
- **Acceptance:** No compiled `.js` next to `.ts` in `packages/*/src`; `git grep` for the two
  TODOs returns nothing; blockchain-api builds clean from source.

### P1-4 — Migration codemods advertised as "coming soon" in docs (ConnectKit/RainbowKit)
- **Cinacoin parity:** Documented migration paths from Web3Modal/W3M/RainbowKit/ConnectKit/Privy.
- **Cinacoin state:** PARTIAL/inconsistent — the `codemod` package *does* ship
  ConnectKit/RainbowKit transforms, but the docs still say "coming soon".
- **Evidence:** docs say coming soon at `docs-site/docs/guide/migrate-from-cinacoin.md:39-40`;
  actual codemods exist: `packages/codemod/src/codemods/connectkit-to-cinacoin.ts`,
  `…/appkit-to-onchainux.ts`.
- **Scope:** Either finish + verify the codemods end-to-end and update docs to "supported", or
  scope docs to what's shipped. Add a quick fixture test per codemod.
- **Acceptance:** Docs match reality; each advertised codemod has a passing input→output fixture test.

---

## P2 — Polish, depth, and parity nice-to-haves

### P2-1 — AA gas defaults: ensure callers always run real estimation
- **State:** By design — `buildUserOperation` ships placeholder gas and the JSDoc tells callers
  to call `BundlerClient.estimateUserOperationGas()` + paymaster first.
- **Evidence:** `packages/aa-sdk/src/smartAccount.ts:241-263` (documented placeholders).
- **Scope:** Add a guard/helper (`buildAndEstimateUserOperation`) that auto-fills gas via the
  bundler so downstream apps can't accidentally submit the static defaults.
- **Acceptance:** A convenience path returns a UserOp with bundler-estimated gas; docs/examples
  use it; raw placeholder values never reach `eth_sendUserOperation` in the demo.

### P2-2 — Cloud dashboard latency metric hardcoded
- **State:** `avgLatency: 45` is constant even after P0-1.
- **Evidence:** `apps/cloud-dashboard/src/lib/api.ts:135`.
- **Scope:** Compute p50/p95 latency from ingested timing events in the new usage endpoint.
- **Acceptance:** Latency reflects real percentiles; no hardcoded `45`.

### P2-3 — Cosmos adapter broadcast layer placeholder comment
- **State:** Note in core-sdk cosmos path about a placeholder broadcast layer.
- **Evidence:** `packages/core-sdk/src/adapters/cosmos.ts:1183` ("placeholder for the broadcast layer").
  (The standalone `packages/adapter-cosmos` is FULL via `@cosmjs/stargate`.)
- **Scope:** Confirm the core-sdk cosmos adapter routes broadcasts through `@cosmjs/stargate`
  like `adapter-cosmos`, or delegate to it; remove the comment.
- **Acceptance:** Cosmos tx broadcast verified on a testnet through one code path; comment removed.

### P2-4 — Sui core-sdk adapter `return -1; // placeholder`
- **Evidence:** `packages/core-sdk/src/adapters/sui.ts:1560`.
- **Scope:** Implement the real return value (likely a balance/index lookup) or remove dead code.
- **Acceptance:** No `placeholder` sentinel returns in the sui adapter; covered by a unit test.

### P2-5 — RPC-proxy Go Prometheus metrics are a placeholder endpoint
- **State:** TS RpcProxy is FULL; the Go variant exposes a placeholder `/metrics`.
- **Evidence:** `packages/rpc-proxy/internal/router/router.go:116`
  (`# (Prometheus metrics placeholder)`); simplified parser note at
  `internal/ratelimit/ratelimit.go:134`.
- **Scope:** Wire real Prometheus counters (requests, errors, rate-limited, upstream latency) in
  the Go proxy to match the TS/relay metrics; use a proper header parser.
- **Acceptance:** `/metrics` exposes real counters scrapeable by Prometheus; basic parser replaced.

### P2-6 — React fallback provider TODOs (`OnChainUXProvider.js`)
- **State:** Source `OnChainUXProvider.tsx` is FULL; a **stale compiled** `.js` mock path carries
  "TODO: implement actual connection logic".
- **Evidence:** `packages/react/src/OnChainUXProvider.js:46,73`.
- **Scope:** Same artifact-hygiene fix as P1-3 — remove committed compiled `.js` next to `.tsx`.
- **Acceptance:** No compiled `OnChainUXProvider.js` in source; the two TODOs are gone.

---

## Confirmed FULL (no action needed) — for reference

- **Protocol/core:** core-sdk (session lifecycle, pairing, JSON-RPC, events), core-ui (Lit
  components), caip, chain-registry, config, walletconnect-v2 (full propose/settle/update/ping/
  delete + multi-session), testing, integration-tests.
- **Crypto:** real X25519 + ChaCha20-Poly1305 + SHA-256 on both TS (`@noble/*`) and Rust
  (`x25519-dalek`/`chacha20poly1305`/`sha2`). No insecure fallbacks.
- **Infra:** relay-server (Rust, Redis pub/sub scaling, rate limiting, metrics), keys-server,
  rpc-proxy (TS + Go), verify-sdk (contract scanning), blockchain-api (viem + Alchemy/Covalent +
  on-chain + NFT scans), ens-resolver, token-list, nft-display, tx-indexer, monitoring.
- **Auth:** siwe (EIP-4361), siwx (EVM/Solana/Bitcoin/TON/TRON), passkey-auth (WebAuthn),
  social-login (Google/Apple/GitHub/Twitter/Discord + phone OTP via Twilio/Vonage/AWS),
  embedded-wallet (PBKDF2 secp256k1 + AES backup).
- **Framework SDKs:** react, vue, next (server actions/edge/CSRF), nuxt, svelte, angular,
  react-native, flutter-dart, ios-swift, android-kotlin, unity-csharp, dotnet — all real bindings.
- **AA / advanced:** aa-sdk (ERC-4337), bundler (TS + Rust), paymaster (verifying, EIP-712),
  gas-sponsorship (Pimlico/Alchemy/Candle + CoinGecko), gas-estimator, batch-transaction
  (EIP-5792 + Safe MultiSend), session-keys, erc6492, safe-decoder.
- **Payments:** swap-sdk (Uniswap/1inch/0x/Jupiter, real quotes), onramp-sdk (MoonPay/Ramp/
  Transak/Stripe/Coinbase), deposit (Binance/OKX/Bybit/KuCoin/Coinbase deep links), pay-ui,
  payment-flow, kyc (AES-GCM), travel-rule (FATF R16), cross-chain-contracts (HTLC/bridge),
  cross-chain-sync.
- **Chain adapters:** solana, bitcoin (UTXO/PSBT), sui*, ton, tron, near, cosmos, hedera, xrpl
  REAL; **starknet PARTIAL** (P1-1).
- **Notifications:** notify-server (JWT/Redis), push-server (FCM RS256 + APNs), push-network-sdk.
- **Ecosystem:** wallet-registry (100+ wallets), explorer, wallet-recommender, wallet-buttons,
  wallet-recovery (Shamir + XChaCha20), multiwallet, custom-connectors, codemod*, cli,
  release-tools, farcaster-miniapp, telegram-miniapp, i18n + cinacoin-i18n.
- **Apps:** website, demo, demo-react, wallet-explorer(+api), project-registry-api,
  health-status, backend-dashboard FULL; **cloud-dashboard** and **analytics-dashboard** PARTIAL
  (P0-1/2/3).

\* starred = has a P1/P2 item above.

---

## Suggested execution order

1. **P0-1, P0-2, P0-3** — kill all user-facing mock data (dashboards are the public face;
   highest credibility risk). All three reuse already-built backends, so these are wiring jobs.
2. **P1-1, P1-2** — Starknet Pedersen + Sui TransactionBlock (real on-chain correctness).
3. **P1-3, P2-6** — purge committed compiled artifacts repo-wide; add `.gitignore` rules (also
   prevents stale-build regressions seen previously).
4. **P1-4** — reconcile migration docs/codemods + fixture tests.
5. **P2-1…P2-5** — depth/polish.
