# CinaConnect

> **Connect Everything On-Chain** — A full-stack, white-label Web3 SDK by CinaGroup.

CinaConnect is an open-source, all-in-one SDK for building seamless on-chain experiences. It provides wallet connections, multi-chain authentication, payments, smart accounts, and developer tools across web, mobile, and game engines.

---

## Features

### 🔗 Wallet Connection
- **600+ wallets** via WalletConnect Network (EVM, Solana, Bitcoin, TON, TRON)
- **EIP-6963** multi-wallet discovery
- **Email & social login** — Google, X, GitHub, Discord, Apple, Facebook, Farcaster
- **Smart Accounts** (ERC-4337) — gasless transactions, session keys, batch calls

### 💳 Payments
- **Swaps** — in-app token exchange via DEX aggregators
- **On-Ramp** — fiat-to-crypto purchase (Meld, Coinbase Pay)
- **Pay** — self-custodial wallet payments across 6 chains (USDC, USDT, SOL)

### 🔐 Authentication
- **SIWE** (Sign-In With Ethereum, EIP-4361)
- **SIWX** (Sign-In With X, CAIP-122) — chain-agnostic multi-chain auth
- **Passkey / biometric** authentication

### 📱 Cross-Platform SDKs

| Platform | Package | Status |
|----------|---------|--------|
| Web (Vanilla JS) | `@cinaconnect/core` | ✅ |
| React / Next.js | `@cinaconnect/react`, `@cinaconnect/next` | ✅ |
| Vue 3 / Nuxt | `@cinaconnect/vue` | ✅ |
| Svelte / SvelteKit | `@cinaconnect/svelte` | ✅ |
| React Native | `@cinaconnect/react-native` | ✅ |
| Flutter / Dart | `@cinaconnect/flutter` | ✅ |
| Android (Kotlin) | `@cinaconnect/android` | ✅ |
| iOS (Swift) | `@cinaconnect/ios` | ✅ |
| Unity (C#) | `@cinaconnect/unity` | ✅ |
| Telegram Mini Apps | `@cinaconnect/telegram` | ✅ |
| Farcaster Mini Apps | `@cinaconnect/farcaster` | ✅ |

---

## Quick Start

### Install

```bash
# npm
npm install @cinaconnect/react @cinaconnect/adapter-ethereum

# yarn
yarn add @cinaconnect/react @cinaconnect/adapter-ethereum

# pnpm
pnpm add @cinaconnect/react @cinaconnect/adapter-ethereum
```

### Usage (React)

```tsx
import { OnuxProvider, useOnuxAccount, useOnuxNetwork } from '@cinaconnect/react';
import { mainnet, arbitrum, base } from '@cinaconnect/chains';

function App() {
  return (
    <OnuxProvider
      projectId="YOUR_PROJECT_ID"
      networks={[mainnet, arbitrum, base]}
      metadata={{
        name: 'My Dapp',
        description: 'A decentralized application',
        url: 'https://mydapp.com',
        icons: ['https://mydapp.com/icon.png'],
      }}
    >
      <Main />
    </OnuxProvider>
  );
}

function Main() {
  const { open, close } = useOnux();
  const { address, isConnected, status } = useOnuxAccount();
  const { chain, switchNetwork } = useOnuxNetwork();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected: {address}</p>
          <p>Network: {chain?.name}</p>
          <button onClick={() => open()}>Open Wallet Modal</button>
          <button onClick={() => close()}>Close</button>
        </>
      ) : (
        <button onClick={() => open()}>Connect Wallet</button>
      )}
    </div>
  );
}
```

---

## Package Index

### Core
| Package | Description |
|---------|-------------|
| `@cinaconnect/core-sdk` | Core SDK — SignClient, Pairing API, Universal Provider |
| `@cinaconnect/walletconnect-v2` | WalletConnect v2 protocol integration |
| `@cinaconnect/chains` | Chain definition registry (300+ chains) |

### Adapters
| Package | Description |
|---------|-------------|
| `@cinaconnect/adapter-ethereum` | EVM chain adapter (Wagmi / Ethers) |
| `@cinaconnect/adapter-solana` | Solana SVM chain adapter |
| `@cinaconnect/adapter-bitcoin` | Bitcoin BIP-122 chain adapter |
| `@cinaconnect/adapter-ton` | TON chain adapter |
| `@cinaconnect/adapter-tron` | TRON chain adapter |

### UI & Frameworks
| Package | Description |
|---------|-------------|
| `@cinaconnect/core-ui` | Web Components (Lit-based modal & widgets) |
| `@cinaconnect/react` | React hooks & components |
| `@cinaconnect/next` | Next.js App Router support |
| `@cinaconnect/vue` | Vue 3 plugin & composables |
| `@cinaconnect/svelte` | Svelte 4/5 store & components |
| `@cinaconnect/react-native` | React Native SDK |
| `@cinaconnect/flutter` | Flutter SDK (Dart) |
| `@cinaconnect/android` | Android SDK (Kotlin) |
| `@cinaconnect/ios` | iOS SDK (Swift) |
| `@cinaconnect/unity` | Unity SDK (C#) |

### Authentication
| Package | Description |
|---------|-------------|
| `@cinaconnect/siwe` | Sign-In With Ethereum (EIP-4361) |
| `@cinaconnect/siwx` | Sign-In With X (CAIP-122, multi-chain) |
| `@cinaconnect/social-login` | Email & social login (Magic.link) |
| `@cinaconnect/passkey-auth` | Passkey / biometric authentication |

### Smart Accounts
| Package | Description |
|---------|-------------|
| `@cinaconnect/aa-sdk` | Account Abstraction SDK (ERC-4337) |
| `@cinaconnect/bundler` | ERC-4337 Bundler (Rust) |
| `@cinaconnect/paymaster` | ERC-7677 Paymaster |
| `@cinaconnect/erc6492` | ERC-6492 signature verification (Rust) |
| `@cinaconnect/session-keys` | Ephemeral session keys |
| `@cinaconnect/ens-resolver` | ENS / readable account names |

### Payments
| Package | Description |
|---------|-------------|
| `@cinaconnect/swap-sdk` | Token swap via DEX aggregators |
| `@cinaconnect/onramp-sdk` | Fiat-to-crypto on-ramp |
| `@cinaconnect/pay-ui` | Payment UI components |

### Infrastructure
| Package | Description |
|---------|-------------|
| `@cinaconnect/relay-server` | WebSocket relay server (Rust) |
| `@cinaconnect/rpc-proxy` | RPC proxy server (Rust) |
| `@cinaconnect/keys-server` | Key management server (Rust) |
| `@cinaconnect/notify-server` | Notification server (Rust) |
| `@cinaconnect/push-server` | Push notification server (Rust) |
| `@cinaconnect/cdn` | CDN asset delivery |

### Developer Tools
| Package | Description |
|---------|-------------|
| `@cinaconnect/cli` | CLI tool for project scaffolding |
| `@cinaconnect/testing` | Mock providers & test utilities |
| `@cinaconnect/codemod` | Migration tool from Reown/AppKit |
| `@cinaconnect/wallet-recommender` | Intelligent wallet recommendation engine |
| `@cinaconnect/gas-estimator` | Gas estimation utilities |
| `@cinaconnect/token-list` | Curated token registry |
| `@cinaconnect/analytics` | Connection event analytics |

### Platform Integrations
| Package | Description |
|---------|-------------|
| `@cinaconnect/telegram-miniapp` | Telegram Mini Apps integration |
| `@cinaconnect/farcaster-miniapp` | Farcaster Mini Apps integration |

### Design & Utilities
| Package | Description |
|---------|-------------|
| `@cinaconnect/design-tokens` | CSS design tokens (colors, spacing, typography) |
| `@cinaconnect/cross-chain-sync` | Cross-chain state synchronization |
| `@cinaconnect/safe-decoder` | Safe transaction decoder (Rust) |
| `@cinaconnect/travel-rule-demo` | Travel Rule compliance demo |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Your Application                      │
├──────────────────────────────────────────────────────────┤
│  @cinaconnect/react │ @cinaconnect/next │ @cinaconnect/vue│
├──────────────────────────────────────────────────────────┤
│                    @cinaconnect/core-ui                    │
│               (Web Components / Modal UI)                  │
├──────────────────────────────────────────────────────────┤
│                 @cinaconnect/core-sdk                      │
│   SignClient  │  Pairing API  │  Universal Provider       │
├──────────────────────────────────────────────────────────┤
│  @cinaconnect/adapter-* (EVM, Solana, BTC, TON, TRON)     │
├──────────────────────────────────────────────────────────┤
│              WalletConnect Network (Relay)                 │
│          wss://relay.walletconnect.com (or self-hosted)    │
└──────────────────────────────────────────────────────────┘
```

---

## Documentation

| Resource | Link |
|----------|------|
| 📖 Full Docs | [docs.cinaconnect.io](https://docs.cinaconnect.io) |
| 🚀 Quick Start | [Quick Start Guide](./docs/guide/quick-start.md) |
| 📦 Installation | [Installation Guide](./docs/guide/installation.md) |
| 🔧 Configuration | [Configuration Guide](./docs/guide/configuration.md) |
| 🔄 Migrate from Reown | [Migration Guide](./docs/guide/migrate-from-reown.md) |
| ❓ FAQ | [FAQ](./docs/faq.md) |
| 🔒 Security | [Security Best Practices](./docs/security/best-practices.md) |
| 📱 Android Example | [Android Example](./docs/examples/android.md) |
| 🍎 iOS Example | [iOS Example](./docs/examples/ios.md) |
| 📱 React Native Example | [React Native Example](./docs/examples/react-native.md) |

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see [LICENSE.md](./LICENSE.md) for details.

---

**CinaConnect** — by [CinaGroup](https://github.com/cinagroup)  
*Connect Everything On-Chain*
