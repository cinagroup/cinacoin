# Cinacoin

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Node.js-≥18-brightgreen?style=for-the-badge" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge" alt="TypeScript" />
  <img src="https://img.shields.io/badge/pnpm-9.15-orange?style=for-the-badge" alt="pnpm" />
  <img src="https://img.shields.io/badge/Packages-75-purple?style=for-the-badge" alt="Packages" />
</p>

<p align="center">
  <strong>Onchain Access, Simplified</strong>
</p>

<p align="center">
  A full-stack, white-label Web3 SDK — wallet connections, multi-chain auth,<br/>
  smart accounts, and payments across web, mobile, and game engines.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#supported-chains">Supported Chains</a> ·
  <a href="#sdk-comparison">SDK Comparison</a> ·
  <a href="https://docs.cinacoin.io">Documentation</a> ·
  <a href="https://github.com/cinagroup/Cinacoin/tree/main/apps/demo">Demo App</a> ·
  <a href="https://github.com/cinagroup/Cinacoin/discussions">Discussions</a>
</p>

<p align="center">
  <strong>Built by <a href="https://github.com/cinagroup">CinaGroup</a></strong>
</p>

---

## 🎯 Why Cinacoin?

Cinacoin is an **open-source, self-hosted replacement for Reown AppKit** (formerly WalletConnect/Web3Modal). Connect 600+ wallets, authenticate across 11 chains, execute batch transactions, and build on-chain experiences — all with one SDK.

**Self-hosted.** No vendor lock-in. No per-MAU fees. Full control over your relay infrastructure.

---

## ✨ Features

| Category | Capabilities |
|----------|-------------|
| 🔗 **Wallet Connection** | 600+ wallets via WalletConnect Network · EIP-6963 multi-wallet discovery · EIP-5792 Wallet Call API with batch calls & atomic transactions |
| 📱 **Cross-Platform** | React, Vue, Svelte, Angular, Next.js, Nuxt, React Native, Flutter, Android (Kotlin), iOS (Swift), Unity (C#), .NET, Telegram Mini Apps, Farcaster |
| 🔐 **Authentication** | SIWE (EIP-4361) · SIWX (CAIP-122, chain-agnostic) · Passkey & biometric auth · Email & social login (Google, X, GitHub, Discord, Apple, Facebook, Farcaster) |
| 💳 **Payments** | Token swaps (DEX aggregators) · Fiat on-ramp (Meld/Coinbase Pay) · Self-custodial payments across 6 chains · Cross-chain session sync |
| 🏦 **Smart Accounts** | ERC-4337 Account Abstraction · Gasless transactions · Session keys · Batch calls · ERC-4337 Bundler (Rust) · ERC-7677 Paymaster |
| 🌐 **Infrastructure** | Self-hosted RPC Proxy · WebSocket Relay Server · Key Management Server · Push Notifications · CDN Asset Delivery · All deployable on Cloudflare Workers |
| 🛡️ **Security** | 8.0/10 audit score · API Key auth on all workers · CORS + input validation · Request size limits · Security headers · 3 audit rounds completed |
| ⚡ **Developer Experience** | Turborepo monorepo · TypeDoc API docs · Storybook components · 321 test files · 17 CI/CD workflows · CLI scaffolding tool · Codemod from Reown/AppKit |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Your Application                            │
│   ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────────┐ │
│   │ ConnectBtn │ │WalletList│ │ChainSwitch│ │ PaymentWidgets  │ │
│   └─────┬──────┘ └────┬─────┘ └─────┬─────┘ └───────┬─────────┘ │
├───────┴───────────────┴─────────────┴───────────────┴───────────┤
│                   Framework SDK Layer                             │
│  @cinacoin/react │ @cinacoin/next │ @cinacoin/vue │ @cinacoin/svelte│
│  @cinacoin/angular │ @cinacoin/nuxt │ @cinacoin/react-native      │
├───────────────────────────────────────────────────────────────────┤
│                   Core SDK Layer                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  @cinacoin/core-sdk                                          │ │
│  │  SignClient │ Pairing API │ Universal Provider │ EIP-5792    │ │
│  └─────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────────┤
│                   Chain Adapter Layer (11 Adapters)               │
│  EVM │ Solana │ Bitcoin │ TON │ TRON │ Cosmos │ Sui │ Starknet  │
│  NEAR │ Hedera │ XRPL                                            │
├───────────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                            │
│  ┌───────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │RPC Proxy  │ │Keys Server │ │Relay Svr │ │Notify / Push Svr │ │
│  │(CF Worker)│ │(CF+D1/KV)  │ │(CF Worker│ │ (CF Workers)     │ │
│  └───────────┘ └────────────┘ └──────────┘ └──────────────────┘ │
├───────────────────────────────────────────────────────────────────┤
│                   External Services                               │
│  Blockchain Nodes │ WalletConnect Network │ DEX APIs │ On-Ramp   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Installation

```bash
npm install @cinacoin/react @cinacoin/adapter-ethereum
# or
yarn add @cinacoin/react @cinacoin/adapter-ethereum
# or
pnpm add @cinacoin/react @cinacoin/adapter-ethereum
```

### React

```tsx
import { OnuxProvider, useOnuxAccount, useOnuxNetwork } from '@cinacoin/react';
import { mainnet, arbitrum, base } from '@cinacoin/chains';

function App() {
  return (
    <OnuxProvider
      projectId="YOUR_PROJECT_ID"
      networks={[mainnet, arbitrum, base]}
      metadata={{ name: 'My Dapp', description: 'A decentralized application', url: 'https://mydapp.com', icons: ['https://mydapp.com/icon.png'] }}
    >
      <Main />
    </OnuxProvider>
  );
}

function Main() {
  const { open } = useOnux();
  const { address, isConnected } = useOnuxAccount();

  return (
    <div>
      {isConnected ? <p>Connected: {address}</p> : <button onClick={() => open()}>Connect Wallet</button>}
    </div>
  );
}
```

### Vue 3

```vue
<script setup>
import { useOnux, useOnuxAccount } from '@cinacoin/vue'
import { mainnet, base } from '@cinacoin/chains'

const { open } = useOnux()
const { address, isConnected } = useOnuxAccount()
</script>

<template>
  <OnuxProvider :project-id="'YOUR_PROJECT_ID'" :networks="[mainnet, base]">
    <button v-if="!isConnected" @click="open()">Connect Wallet</button>
    <p v-else>Connected: {{ address }}</p>
  </OnuxProvider>
</template>
```

### Android (Kotlin)

```kotlin
val cinacoin = Cinacoin.initialize(
    projectId = "YOUR_PROJECT_ID",
    application = this,
    metadata = PairingMetadata(
        name = "My App",
        description = "A decentralized application",
        url = "https://mydapp.com",
        icons = listOf("https://mydapp.com/icon.png")
    )
)

// Connect wallet
cinacoin.connect { result ->
    when (result) {
        is Result.Success -> showAddress(result.address)
        is Result.Error -> showError(result.message)
    }
}
```

### iOS (Swift)

```swift
import Cinacoin

let metadata = PairingMetadata(
    name: "My App",
    description: "A decentralized application",
    url: "https://mydapp.com",
    icons: ["https://mydapp.com/icon.png"]
)

Cinacoin.configure(projectId: "YOUR_PROJECT_ID", metadata: metadata)

// Connect wallet
Cinacoin.connect { result in
    switch result {
    case .success(let address):
        self.showAddress(address)
    case .failure(let error):
        self.showError(error.localizedDescription)
    }
}
```

---

## 🌍 Supported Chains

| Chain | Adapter | Type | Status |
|-------|---------|------|--------|
| Ethereum | `adapter-ethereum` | EVM | ✅ |
| Polygon | `adapter-ethereum` | EVM | ✅ |
| Arbitrum | `adapter-ethereum` | EVM (L2) | ✅ |
| Optimism | `adapter-ethereum` | EVM (L2) | ✅ |
| Base | `adapter-ethereum` | EVM (L2) | ✅ |
| BNB Chain | `adapter-ethereum` | EVM | ✅ |
| Avalanche | `adapter-ethereum` | EVM | ✅ |
| Solana | `adapter-solana` | SVM | ✅ |
| Bitcoin | `adapter-bitcoin` | UTXO | ✅ |
| TON | `adapter-ton` | TON | ✅ |
| TRON | `adapter-tron` | TRON | ✅ |
| Cosmos | `adapter-cosmos` | Cosmos SDK | ✅ |
| Sui | `adapter-sui` | Sui | ✅ |
| Starknet | `adapter-starknet` | ZK Rollup | ✅ |
| NEAR | `adapter-near` | NEAR | ✅ |
| Hedera | `adapter-hedera` | Hedera | ✅ |
| XRPL | `adapter-xrpl` | XRPL | ✅ |

> **300+ chains** available via `@cinacoin/chains` registry.

---

## 📊 SDK Comparison: Cinacoin vs Reown/WalletConnect

| Feature | Cinacoin | Reown AppKit | RainbowKit | web3modal |
|---------|----------|-------------|------------|-----------|
| **Self-Hosted** | ✅ Full | ❌ SaaS | ❌ SaaS | ❌ SaaS |
| **No MAU Fees** | ✅ | ❌ | ✅ | ✅ |
| **Open Source** | ✅ MIT | ✅ | ✅ | ✅ |
| **React** | ✅ | ✅ | ✅ | ✅ |
| **Vue** | ✅ | ❌ | ❌ | ❌ |
| **Svelte** | ✅ | ❌ | ❌ | ❌ |
| **Angular** | ✅ | ❌ | ❌ | ❌ |
| **React Native** | ✅ | ✅ | ❌ | ❌ |
| **Flutter** | ✅ | ❌ | ❌ | ❌ |
| **Android (Kotlin)** | ✅ | ❌ | ❌ | ❌ |
| **iOS (Swift)** | ✅ | ❌ | ❌ | ❌ |
| **Unity** | ✅ | ❌ | ❌ | ❌ |
| **.NET** | ✅ | ❌ | ❌ | ❌ |
| **EIP-6963** | ✅ | ✅ | ✅ | ✅ |
| **EIP-5792** | ✅ | ❌ | ❌ | ❌ |
| **Account Abstraction** | ✅ ERC-4337 | ❌ | ❌ | ❌ |
| **SIWX (Multi-chain)** | ✅ CAIP-122 | ❌ | ❌ | ❌ |
| **Passkey Auth** | ✅ | ❌ | ❌ | ❌ |
| **11 Chain Adapters** | ✅ | ~3 | ~3 | ~3 |
| **Smart Accounts** | ✅ Gasless + Session Keys | ❌ | ❌ | ❌ |
| **Rust Bundler** | ✅ | ❌ | ❌ | ❌ |
| **Telegram Mini Apps** | ✅ | ❌ | ❌ | ❌ |
| **Farcaster Mini Apps** | ✅ | ❌ | ❌ | ❌ |
| **CLI Scaffolding** | ✅ | ❌ | ❌ | ❌ |
| **Reown Migration** | ✅ Codemod | N/A | ❌ | N/A |

---

## 📦 Monorepo Structure

```
cinacoin/
├── apps/                          # Deployable applications (3)
│   ├── demo/                      # Next.js demo (6 pages)
│   ├── demo-react/                # React demo
│   └── backend-dashboard/         # Admin dashboard
├── packages/                      # Libraries and services (75)
│   ├── core-sdk/                  # Core SDK — SignClient, Pairing API
│   ├── adapter-*/                 # 11 chain adapters
│   ├── react/ next/ vue/ svelte/  # Framework SDKs
│   ├── android-kotlin/ ios-swift/ # Mobile SDKs
│   ├── unity-csharp/ dotnet/      # Game engine SDKs
│   ├── aa-sdk/ bundler/ paymaster/# Smart accounts
│   ├── relay-server/ rpc-proxy/   # Infrastructure
│   └── cli/ codemod/ testing/     # Dev tools
├── e2e/                           # Playwright & Cypress tests
├── docs/                          # VitePress documentation
└── .github/workflows/             # 17 CI/CD workflows
```

---

## 📖 Documentation

| Resource | Link |
|----------|------|
| 📖 Full Docs | [docs.cinacoin.io](https://docs.cinacoin.io) |
| 🚀 Quick Start | [Quick Start Guide](./docs/guide/quick-start.md) |
| 📦 Installation | [Installation Guide](./docs/guide/installation.md) |
| 🔄 Migrate from Reown | [Migration Guide](./docs/guide/migrate-from-reown.md) |
| 🔒 Security | [Security Policy](./SECURITY.md) |
| 🛠️ Development | [Developer Guide](./DEVELOPMENT.md) |
| 📋 Contributing | [Contributing Guide](./CONTRIBUTING.md) |
| 🗺️ Roadmap | [Roadmap](./ROADMAP.md) |

---

## 🧪 Project Stats

- **75 packages** across 13 categories
- **69+ built** with `dist/` output
- **321 test files** (Vitest + Playwright)
- **17 CI/CD workflows** (build, test, deploy, release, security)
- **1 package published** to npm (`@cinacoin/core-sdk`)
- **2 Cloudflare Workers** deployed & live (RPC Proxy, Keys Server)
- **Demo app** with 6 pages and real MetaMask connection
- **Security: 8.0/10** (3 audit rounds completed)
- **Overall completion: ~91-94%**

---

## 🌐 Community

Join the Cinacoin community for support, discussions, and updates:

| Platform | Purpose | Link |
|----------|---------|------|
| 💬 **Discord** | Real-time chat, dev discussions, support | [Join Discord](https://discord.gg/YOUR_INVITE_CODE) |
| 📱 **Telegram** | Announcements, quick updates | [Join Telegram](https://t.me/YOUR_GROUP_LINK) |
| 🗨️ **GitHub Discussions** | Feature proposals, RFCs, Q&A | [Discussions](https://github.com/cinagroup/Cinacoin/discussions) |

See [Community Guidelines](./docs/community/README.md) for conduct expectations and channel usage.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/cinacoin.git && cd cinacoin

# 2. Install and build
pnpm install && pnpm run build

# 3. Run the full CI pipeline
pnpm run ci

# 4. Start the demo app
pnpm run dev --filter=demo
```

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <strong>Cinacoin</strong> — by <a href="https://github.com/cinagroup">CinaGroup</a><br/>
  <em>Onchain Access, Simplified</em>
</p>
