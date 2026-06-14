# Cinacoin Roadmap

> **Last Updated:** 2026-05-18  
> **Status Legend:**  
> - ✅ **Complete** — built (dist/ exists; 1 package published to npm: core-sdk)  
> - 🚧 **In Progress** — built + **deployed & live** (Cloudflare Workers)  
> - ⬜ **Planned** — scaffolding only  
> - 🔌 **SDK Layer** — type definitions/interfaces only; **requires external API key or service** to function  

---

## Phase 1: Core Infrastructure

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/core-sdk` | ✅ | **Built & published** — SignClient, Pairing API, Universal Provider |
| `@cinacoin/walletconnect-v2` | ✅ | Built — adapters commented out in core-sdk exports |
| `@cinacoin/chains` | ✅ | Built — Chain definition registry |
| `@cinacoin/core-ui` | ✅ | Built — Lit-based web components (modal & widgets) |
| `@cinacoin/rpc-proxy` | 🚧 | Built + **deployed on Cloudflare Workers** |
| `@cinacoin/keys-server` | 🚧 | Built + **deployed on Cloudflare Workers** |

---

## Phase 2: Chain Adapters — All ✅ Built

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/adapter-ethereum` | ✅ | Built — EVM adapter (Wagmi / Ethers) |
| `@cinacoin/adapter-solana` | ✅ | Built — Solana SVM adapter |
| `@cinacoin/adapter-bitcoin` | ✅ | Built — Bitcoin BIP-122 adapter |
| `@cinacoin/adapter-ton` | ✅ | Built — TON adapter |
| `@cinacoin/adapter-tron` | ✅ | Built — TRON adapter |
| `@cinacoin/adapter-cosmos` | ✅ | Built — Cosmos adapter |
| `@cinacoin/adapter-sui` | ✅ | Built — Sui adapter |
| `@cinacoin/adapter-starknet` | ✅ | Built — Starknet adapter |
| `@cinacoin/adapter-near` | ✅ | Built — NEAR adapter |
| `@cinacoin/adapter-hedera` | ✅ | Built — Hedera adapter |
| `@cinacoin/adapter-xrpl` | ✅ | Built — XRPL adapter |

---

## Phase 3: Framework SDKs

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/react` | ✅ | Built — React hooks & components **+ EIP-5792 hooks** (`useWalletCapabilities`, `useSendCalls`, `useAtomicBatch`, `useCallsStatus`) |
| `@cinacoin/next` | ✅ | Built — Next.js App Router support |
| `@cinacoin/vue` | ✅ | Built — Vue 3 plugin & composables |
| `@cinacoin/svelte` | ✅ | Built — Svelte 4/5 store & components |
| `@cinacoin/angular` | ✅ | Built — Angular support |
| `@cinacoin/nuxt` | ✅ | Built — Nuxt support |
| `@cinacoin/react-native` | ✅ 🔌 | Built — type definitions, native implementation needed |
| `@cinacoin/flutter-dart` | ✅ 🔌 | Built — type definitions, native implementation needed |
| `@cinacoin/android-kotlin` | ✅ | Built |
| `@cinacoin/ios-swift` | ✅ | Built |
| `@cinacoin/unity-csharp` | ✅ | Built — **21 C# files** (Editor, Runtime, UI, Tests) |
| `@cinacoin/dotnet` | ✅ | **Source written** — 22 C# files: `CinacoinClient.cs`, Services (RelayClient, CryptoUtils, WalletService), Models (20 types), Example app, NuGet config |

---

## Phase 4: Authentication — All ✅ Built

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/siwe` | ✅ | Built — Sign-In With Ethereum (EIP-4361) |
| `@cinacoin/siwx` | ✅ | Built — Sign-In With X (CAIP-122, multi-chain) |
| `@cinacoin/social-login` | ✅ | Built — Email & social login (Magic.link) |
| `@cinacoin/passkey-auth` | ✅ | Built — Passkey / biometric authentication (WebAuthn) |

---

## Phase 5: Smart Accounts (Account Abstraction) — All ✅ Built

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/aa-sdk` | ✅ | Built — ERC-4337 Account Abstraction SDK |
| `@cinacoin/bundler` | ✅ | Built — ERC-4337 Bundler |
| `@cinacoin/paymaster` | ✅ | Built — ERC-7677 Paymaster |
| `@cinacoin/erc6492` | ✅ | Built — ERC-6492 signature verification |
| `@cinacoin/session-keys` | ✅ | Built — Ephemeral session keys |
| `@cinacoin/ens-resolver` | ✅ | Built — ENS / readable account names |

---

## Phase 6: Payments ⚠️ SDK Layer

> These packages provide SDK interfaces and UI wrappers. **They require external API keys/services** to function. All are **built**.

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/swap-sdk` | ✅ 🔌 | Built — **SDK interface only**; requires your own DEX aggregator API key (1inch, 0x, etc.) |
| `@cinacoin/onramp-sdk` | ✅ 🔌 | Built — **SDK + iframe embed only**; requires Meld/Coinbase Pay API key |
| `@cinacoin/pay-ui` | ✅ | Built — Payment UI components |
| `@cinacoin/batch-transaction` | ✅ | Built — Batch transaction support |
| `@cinacoin/deposit` | ✅ | Built — Deposit utilities |

---

## Phase 7: Infrastructure Services

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/relay-server` | ✅ | Built — WebSocket relay server |
| `@cinacoin/notify-server` | ✅ | Built — Notification server |
| `@cinacoin/push-server` | ✅ | Built — Push notification server |
| `@cinacoin/cdn` | ✅ | Built — CDN asset delivery |

---

## Phase 8: Developer Tools & Utilities — All ✅ Built

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/cli` | ✅ | Built — CLI scaffolding tool |
| `@cinacoin/testing` | ✅ | Built — Mock providers & test utilities |
| `@cinacoin/codemod` | ✅ | Built — Migration tool (Cinacoin/AppKit → Cinacoin) |
| `@cinacoin/wallet-recommender` | ✅ | Built — Wallet recommendation engine |
| `@cinacoin/gas-estimator` | ✅ | Built — Gas estimation utilities |
| `@cinacoin/token-list` | ✅ | Built — Curated token registry |
| `@cinacoin/analytics` | ✅ | Built — Connection event analytics |
| `@cinacoin/config` | ✅ | Built — Remote configuration manager |
| `@cinacoin/design-tokens` | ✅ | Built — CSS design tokens |
| `@cinacoin/explorer` | ✅ | Built — Blockchain explorer components |
| `@cinacoin/blockchain-api` | ✅ | Built — REST API layer |
| `@cinacoin/wallet-buttons` | ✅ | Built — Standalone wallet button components |
| `@cinacoin/custom-connectors` | ✅ | Built — Custom wallet connector framework |
| `@cinacoin/multiwallet` | ✅ | Built — Multi-wallet management |
| `@cinacoin/kyc` | ✅ | Built — KYC compliance screening |
| `@cinacoin/cross-chain-sync` | ✅ | Built — Cross-chain state synchronization |
| `@cinacoin/safe-decoder` | ✅ | Built — Safe transaction decoder |
| `@cinacoin/travel-rule-demo` | ✅ | Built — Travel Rule compliance demo |

---

## Phase 9: Platform Integrations — All ✅ Built

| Package | Status | Notes |
|---------|--------|-------|
| `@cinacoin/telegram-miniapp` | ✅ | Built — Telegram Mini Apps integration |
| `@cinacoin/farcaster-miniapp` | ✅ | Built — Farcaster Mini Apps integration |

---

## Demo App

> **Status:** Next.js demo app with **6 pages**, all wired to real wallet connection logic.

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with wallet connection entry point |
| Swap | `/swap` | Token swap interface |
| Multi-Chain | `/multi-chain` | Multi-chain wallet management |
| Auth | `/auth` | SIWE / multi-chain authentication |
| Batch | `/batch` | Batch transaction execution |

---

## Overall Progress Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total packages in ecosystem** | ~72 | 100% |
| **Built with dist/** | 64+ | 95%+ |
| **Published to npm** | 1 (core-sdk) | ~1.5% |
| **Test files** | 104+ | — |
| **Commits** | 53+ | — |
| **Deployed & live (Cloudflare)** | 2 (RPC Proxy + Keys Server) | — |
| **Demo app pages** | 6 | Real wallet connection logic (not mock) |

**Comprehensive build status:** See [HONEST_AUDIT_V3.md](./HONEST_AUDIT_V3.md) for the full honest assessment of what's built vs. planned.

**What this roadmap means:**  
- ✅ = **Built** — dist/ directory exists (1 package published to npm: `@cinacoin/core-sdk`)  
- 🚧 = Built + **deployed & live on Cloudflare Workers** (RPC Proxy, Keys Server)  
- ⬜ = scaffolding only, source needs to be written  
- 🔌 = SDK interface layer only — **requires external API key or service** to function  

---

## Priority Next Steps

1. **Publish packages to npm** — all 64+ built, only core-sdk published so far
2. **Enable adapter exports** — uncomment ethers5/6, wagmi, solana, viem, siwe, eip5792 in core-sdk
3. **Demo real connections** — verify WalletModal connects to real MetaMask on all 6 demo pages
4. **Add tests** — 104+ test files exist; expand coverage for core functionality
5. **Honest docs** — this file and README reflect current built status
