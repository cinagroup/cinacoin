# Cinacoin

> The Future of Decentralized Finance — A comprehensive Web3 infrastructure platform providing multi-chain wallet connectivity, cloud services, and DeFi tools.

[![Quality Gate](https://github.com/cinagroup/cinacoin/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/cinagroup/cinacoin/actions/workflows/quality-gate.yml)
[![Coverage](https://img.shields.io/badge/coverage-68%25-brightgreen)](./AUDIT_REPORT.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6)](https://www.typescriptlang.org/)

---

## 🌟 Overview

Cinacoin is a monorepo containing 99 packages spanning SDKs, adapters, UI components, applications, and infrastructure. It provides everything needed to build, deploy, and manage Web3 applications across 14+ blockchain networks.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATIONS LAYER                            │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Website  │   Demo   │ Dashboard│ Explorer │  Cloud   │   Health    │
│ (Next.js)│ (React)  │(Backend) │(Wallet)  │ Console  │   Status    │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬──────┘
     │          │          │          │          │           │
┌────▼──────────▼──────────▼──────────▼──────────▼───────────▼──────┐
│                        SDK LAYER                                   │
├────────────┬────────────┬────────────┬────────────┬───────────────┤
│ core-sdk   │   react    │    vue     │  angular   │   svelte      │
│            │  provider  │ composable │  module    │   store       │
└────┬───────┴────┬───────┴────┬───────┴────┬───────┴───────┬───────┘
     │            │            │            │               │
┌────▼────────────▼────────────▼────────────▼───────────────▼───────┐
│                      ADAPTER LAYER                                 │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬───────┤
│ MetaMask│WalletCt │Coinbase │ Phantom │ Solana  │ Bitcoin │  ...  │
│         │         │         │         │         │         │ +14   │
└────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴───┬───┘
     │         │         │         │         │         │        │
┌────▼─────────▼─────────▼─────────▼─────────▼─────────▼────────▼───┐
│                     INFRASTRUCTURE LAYER                           │
├──────────┬──────────┬──────────┬──────────┬──────────┬────────────┤
│   API    │  Auth    │  Relay   │  Bundler │  Keys    │   Push     │
│ Gateway  │ Service  │ Server   │ (Rust)   │ Server   │  Server    │
│ (Hono)   │ (JWT)    │ (Rust)   │          │ (Rust)   │  (Rust)    │
└──────────┴──────────┴──────────┴──────────┴──────────┴────────────┘
     │          │          │          │          │
┌────▼──────────▼──────────▼──────────▼──────────▼──────────────────┐
│                    CLOUDFLARE EDGE LAYER                           │
├──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│ Workers  │   D1     │   KV     │   R2     │   Pages              │
│ (300+    │(SQLite)  │ (Cache)  │(Storage) │  (CDN)               │
│  edges)  │          │          │          │                      │
└──────────┴──────────┴──────────┴──────────┴──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ ([download](https://nodejs.org/))
- **pnpm** 9+ (`corepack enable`)
- **Git** 2.30+

### Installation

```bash
# Clone the repository
git clone https://github.com/cinagroup/cinacoin.git
cd cinacoin

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development server (demo app)
pnpm dev
```

### Run Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Run benchmarks
npx tsx scripts/run-benchmarks.ts
```

### Development Workflow

```bash
# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Format code
pnpm format

# Build a specific package
cd packages/core-sdk && pnpm build
```

## 📦 Packages

### Core SDK

| Package | Description | Version |
|---------|-------------|---------|
| [`@cinacoin/core-sdk`](./packages/core-sdk) | Core wallet connection toolkit | 0.2.0 |
| [`@cinacoin/react`](./packages/react) | React hooks & providers | 0.2.0 |
| [`@cinacoin/vue`](./packages/vue) | Vue composables | 0.2.0 |
| [`@cinacoin/angular`](./packages/angular) | Angular module | 0.2.0 |
| [`@cinacoin/svelte`](./packages/svelte) | Svelte store | 0.2.0 |

### Chain Adapters

| Package | Chain | Version |
|---------|-------|---------|
| [`@cinacoin/adapters`](./packages/adapters) | Unified adapter package | 0.2.0 |
| [`@cinacoin/adapter-solana`](./packages/adapter-solana) | Solana | 0.2.0 |
| [`@cinacoin/adapter-bitcoin`](./packages/adapter-bitcoin) | Bitcoin | 0.2.0 |
| [`@cinacoin/adapter-ton`](./packages/adapter-ton) | TON | 0.2.0 |
| [`@cinacoin/adapter-tron`](./packages/adapter-tron) | Tron | 0.2.0 |
| [`@cinacoin/adapter-near`](./packages/adapter-near) | NEAR | 0.2.0 |
| [`@cinacoin/adapter-cosmos`](./packages/adapter-cosmos) | Cosmos | 0.2.0 |
| [`@cinacoin/adapter-sui`](./packages/adapter-sui) | Sui | 0.2.0 |
| [`@cinacoin/adapter-starknet`](./packages/adapter-starknet) | Starknet | 0.2.0 |
| [`@cinacoin/adapter-hedera`](./packages/adapter-hedera) | Hedera | 0.2.0 |
| [`@cinacoin/adapter-xrpl`](./packages/adapter-xrpl) | XRP Ledger | 0.2.0 |

### UI & Design

| Package | Description | Version |
|---------|-------------|---------|
| [`@cinacoin/ui`](./packages/ui) | Shared React components | 0.1.0 |
| [`@cinacoin/core-ui`](./packages/core-ui) | Core UI primitives | 0.1.0 |
| [`@cinacoin/design-system`](./packages/design-system) | Design tokens & themes | 0.1.0 |
| [`@cinacoin/design-tokens`](./packages/design-tokens) | CSS/Tailwind tokens | 0.1.0 |

### Infrastructure (Rust)

| Package | Description |
|---------|-------------|
| [`push-server`](./packages/push-server) | Push notification server |
| [`keys-server`](./packages/keys-server) | Key management service |
| [`relay-server`](./packages/relay-server) | Message relay server |
| [`bundler`](./packages/bundler) | ERC-4337 bundler |
| [`erc6492`](./packages/erc6492) | ERC-6492 signature verification |

### Applications

| App | Description | Stack |
|-----|-------------|-------|
| [`website`](./apps/website) | cinacoin.com | Next.js 15 |
| [`demo`](./apps/demo) | Full-featured demo | Next.js 15 |
| [`demo-react`](./apps/demo-react) | React demo | Vite |
| [`demo-vue`](./apps/demo-vue) | Vue demo | Vite |
| [`backend-dashboard`](./apps/backend-dashboard) | Admin panel | Next.js 15 |
| [`analytics-dashboard`](./apps/analytics-dashboard) | Analytics | Next.js 15 |
| [`wallet-explorer`](./apps/wallet-explorer) | Block explorer | Next.js 15 |
| [`health-status`](./apps/health-status) | Service status | Next.js 15 |

### Developer Tools

| Package | Description |
|---------|-------------|
| [`@cinacoin/cli`](./packages/cli) | Command-line interface |
| [`@cinacoin/codemod`](./packages/codemod) | Code migration tools |
| [`@cinacoin/testing`](./packages/testing) | Test utilities & mocks |

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15, React 19, Vue 3
- **Language:** TypeScript 5.7
- **Styling:** Tailwind CSS 3, CSS Modules
- **State:** Zustand, React Query
- **Testing:** Vitest, Playwright, Testing Library

### Backend
- **Runtime:** Node.js 22, Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV
- **Storage:** Cloudflare R2
- **Auth:** JWT (jose), Web Crypto API

### Infrastructure
- **Rust Services:** push-server, keys-server, relay-server, bundler
- **Go Services:** rpc-proxy
- **CI/CD:** GitHub Actions
- **Deployment:** Cloudflare Pages + Workers
- **Monitoring:** Custom health checks

## 📊 Performance

All benchmarks run on every PR. Current targets:

| Operation | P50 Target | Current P50 | Status |
|-----------|-----------:|------------:|--------|
| SDK Cold Init | <100ms | 12.4ms | ✅ |
| SDK Warm Init | <50ms | 3.2ms | ✅ |
| Sign Message | <50ms | 18.6ms | ✅ |
| Send Transaction | <200ms | 42.8ms | ✅ |
| Connect Wallet | <1000ms | 128.5ms | ✅ |

See [`benchmarks/README.md`](./benchmarks/README.md) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

### Quick Guide

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes with tests
4. **Run** quality checks:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   npx tsx scripts/run-benchmarks.ts
   ```
5. **Commit** with conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. **Push** to your fork (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Code Standards

- **TypeScript** strict mode
- **ESLint** + Prettier formatting
- **Vitest** for unit tests (min 60% coverage)
- **Changesets** for version management
- **Conventional Commits** for PR titles

### Adding a New Chain Adapter

1. Create package: `packages/adapter-<chain>`
2. Implement the `Adapter` interface from `@cinacoin/adapters`
3. Add tests (min 80% coverage)
4. Add benchmarks
5. Update `packages/adapters/src/index.ts`
6. Add changeset: `pnpm changeset`

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md) — System design & data flow
- [API Reference](./docs/api.md) — REST API documentation
- [Developer Guide](./docs/developer.md) — Local development setup
- [Deployment Guide](./docs/deployment.md) — Production deployment
- [Security](./SECURITY.md) — Security policies & reporting
- [Audit Report](./AUDIT_REPORT.md) — Latest quality assessment
- [Changelog](./CHANGELOG.md) — Version history

## 🔐 Security

- JWT authentication with refresh tokens
- 2FA support (TOTP)
- Rate limiting on all endpoints
- CSRF protection
- Session revocation
- Automated dependency scanning
- No hardcoded secrets (GitGuardian + Gitleaks)

**Reporting:** See [SECURITY.md](./SECURITY.md) for vulnerability disclosure.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

## 🌐 Services

| Service | URL | Status |
|---------|-----|--------|
| Website | https://cinacoin.com | ✅ |
| API | https://api.cinacoin.com | ✅ |
| Auth | https://auth.cinacoin.com | ✅ |
| Backend | https://backend.cinacoin.com | ✅ |
| Cloud | https://cloud.cinacoin.com | ✅ |
| Wallet Explorer | https://wallet.cinacoin.com | ✅ |
| Status | https://status.cinacoin.com | ✅ |

## 📞 Contact

- **Website:** https://cinacoin.com
- **Email:** contact@cinacoin.com
- **Twitter:** [@cinacoin](https://twitter.com/cinacoin)
- **GitHub:** https://github.com/cinagroup/cinacoin
- **Discord:** https://discord.gg/cinacoin

---

<p align="center">
  Built with ❤️ by the Cinacoin Team
</p>
