# Migrating from Web3Modal / AppKit to Cinacoin

> A comprehensive guide for developers migrating from Reown AppKit (formerly Web3Modal) to Cinacoin.

---

## Table of Contents

1. [Why Migrate](#1-why-migrate)
2. [5-Minute Quick Migration](#2-5-minute-quick-migration)
3. [Automatic Migration with Codemod](#3-automatic-migration-with-codemod)
4. [Configuration Comparison](#4-configuration-comparison)
5. [API Reference Mapping](#5-api-reference-mapping)
6. [Framework-Specific Guides](#6-framework-specific-guides)
7. [Custom Connector Migration](#7-custom-connector-migration)
8. [Theme Migration](#8-theme-migration)
9. [Adding Non-EVM Chains](#9-adding-non-evm-chains)
10. [FAQ](#10-faq)

---

## 1. Why Migrate

| Benefit | Description |
|---------|-------------|
| **Self-Hosted** | Run on your own infrastructure — zero vendor lock-in |
| **10 Non-EVM Chains** | Bitcoin, Solana, TON, NEAR, Sui, Starknet, Cosmos, Hedera, TRON, XRPL |
| **10x Cheaper** | Cloudflare Workers free tier vs $100+/month SaaS |
| **Account Abstraction** | Full ERC-4337 stack (SDK + Bundler + Paymaster) |
| **SIWX** | Cross-chain unified auth (EVM + Solana + Bitcoin) |
| **Compliance** | Built-in KYC, Travel Rule, contract safety scoring |
| **Push Network** | Self-built push notification system |
| **12 Frameworks** | React, Vue, Angular, Svelte, Next.js, Nuxt, RN, Flutter, iOS, Android, Unity, .NET |

---

## 2. 5-Minute Quick Migration

### Step 1: Install Cinacoin

```bash
npm install @cinacoin/react @cinacoin/core-sdk
# or
pnpm add @cinacoin/react @cinacoin/core-sdk
```

### Step 2: Update Imports

```diff
- import { createWeb3Modal } from '@web3modal/react'
- import { WagmiConfig } from 'wagmi'
+ import { createCinacoin } from '@cinacoin/react'
+ import { CinacoinProvider } from '@cinacoin/react'
```

### Step 3: Update Configuration

```diff
- const web3modal = createWeb3Modal({
-   wagmiConfig,
-   projectId: 'YOUR_PROJECT_ID',
-   chains: [mainnet, polygon],
-   themeMode: 'dark',
- })
+ const cinacoin = createCinacoin({
+   projectId: 'YOUR_PROJECT_ID',
+   chains: [mainnet, polygon],
+   theme: { mode: 'dark' },
+ })
```

### Step 4: Update Provider

```diff
- <WagmiConfig config={wagmiConfig}>
-   <YourApp />
- </WagmiConfig>
+ <CinacoinProvider config={cinacoin}>
+   <YourApp />
+ </CinacoinProvider>
```

### Step 5: Connect Button

```diff
- <w3m-button />
+ <ConnectButton />
```

That's it! Your app should now be running with Cinacoin.

---

## 3. Automatic Migration with Codemod

Cinacoin provides an automated migration tool:

```bash
# Run the codemod on your source directory
npx @cinacoin/codemod migrate ./src

# What it does:
# ✅ Replaces all @web3modal/* imports → @cinacoin/*
# ✅ Updates createWeb3Modal → createCinacoin
# ✅ Migrates chain configurations
# ✅ Updates theme configurations
# ✅ Replaces <w3m-button /> → <ConnectButton />
# ✅ Updates hook imports (useWeb3Modal → useCinacoin)

# Dry run (preview changes without modifying files)
npx @cinacoin/codemod migrate ./src --dry-run

# Verbose output
npx @cinacoin/codemod migrate ./src --verbose
```

### Supported Migrations

| Pattern | Before | After |
|---------|--------|-------|
| Import | `@web3modal/react` | `@cinacoin/react` |
| Import | `@web3modal/wagmi` | `@cinacoin/core-sdk` |
| Function | `createWeb3Modal()` | `createCinacoin()` |
| Component | `<w3m-button />` | `<ConnectButton />` |
| Component | `<w3m-network-button />` | `<NetworkSwitch />` |
| Hook | `useWeb3Modal()` | `useCinacoin()` |
| Hook | `useWeb3ModalState()` | `useCinacoinState()` |
| Hook | `useWeb3ModalTheme()` | `useCinacoinTheme()` |
| Config | `themeMode` | `theme.mode` |
| Config | `themeVariables` | `theme.variables` |

---

## 4. Configuration Comparison

### Web3Modal Configuration

```typescript
import { createWeb3Modal } from '@web3modal/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react'

const wagmiConfig = defaultWagmiConfig({
  chains: [mainnet, polygon, arbitrum],
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'My App',
    description: 'My dApp',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png'],
  },
})

const web3modal = createWeb3Modal({
  wagmiConfig,
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum],
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
    '--w3m-z-index': 9999,
  },
  enableAnalytics: true,
  enableOnramp: true,
})
```

### Cinacoin Configuration

```typescript
import { createCinacoin } from '@cinacoin/react'
import { mainnet, polygon, arbitrum, solana, bitcoin } from '@cinacoin/core-sdk'

const cinacoin = createCinacoin({
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum, solana, bitcoin], // ✅ Non-EVM!
  metadata: {
    name: 'My App',
    description: 'My dApp',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png'],
  },
  theme: {
    mode: 'dark',
    variables: {
      accent: '#3b82f6',
      zIndex: 9999,
    },
  },
  // ✅ Additional Cinacoin features
  analytics: { enabled: true }, // GDPR-compliant
  onramp: { enabled: true },
  siwx: { enabled: true }, // Cross-chain auth
  embeddedWallet: { enabled: true }, // Email/social login
  passkeyAuth: { enabled: true }, // WebAuthn
})
```

### Key Differences

| Feature | Web3Modal | Cinacoin |
|---------|-----------|----------|
| Non-EVM chains | ❌ | ✅ `solana, bitcoin, ton, ...` |
| SIWX auth | ❌ | ✅ `siwx: { enabled: true }` |
| Embedded wallet | ⚠️ Reown only | ✅ `embeddedWallet: { enabled: true }` |
| Passkey auth | ❌ | ✅ `passkeyAuth: { enabled: true }` |
| Gas sponsorship | ❌ | ✅ `gasSponsorship: { enabled: true }` |
| Self-hosted | ❌ | ✅ Runs on your infrastructure |

---

## 5. API Reference Mapping

### Core API

| Web3Modal | Cinacoin | Notes |
|-----------|----------|-------|
| `createWeb3Modal()` | `createCinacoin()` | Main initialization |
| `web3modal.open()` | `cinacoin.open()` | Open connection modal |
| `web3modal.close()` | `cinacoin.close()` | Close connection modal |
| `web3modal.setThemeMode()` | `cinacoin.setThemeMode()` | Toggle dark/light |

### React Hooks

| Web3Modal | Cinacoin | Notes |
|-----------|----------|-------|
| `useWeb3Modal()` | `useCinacoin()` | Modal state |
| `useWeb3ModalState()` | `useCinacoinState()` | Connection state |
| `useWeb3ModalTheme()` | `useCinacoinTheme()` | Theme state |
| `useDisconnect()` | `useDisconnect()` | Same API ✅ |
| `useSwitchChain()` | `useSwitchChain()` | Same API ✅ |
| `useWalletInfo()` | `useWalletInfo()` | Same API ✅ |

### Components

| Web3Modal | Cinacoin | Notes |
|-----------|----------|-------|
| `<w3m-button />` | `<ConnectButton />` | Main connect button |
| `<w3m-network-button />` | `<NetworkSwitch />` | Network switcher |
| `<w3m-account-button />` | `<AccountButton />` | Account button |

---

## 6. Framework-Specific Guides

### 6.1 React Migration

```tsx
// Before (Web3Modal)
import { createWeb3Modal } from '@web3modal/react'
import { WagmiConfig, useAccount } from 'wagmi'

function App() {
  return (
    <WagmiConfig config={config}>
      <YourApp />
    </WagmiConfig>
  )
}

// After (Cinacoin)
import { createCinacoin, CinacoinProvider, useAccount } from '@cinacoin/react'

const cinacoin = createCinacoin({ projectId: 'YOUR_ID', chains: [mainnet] })

function App() {
  return (
    <CinacoinProvider config={cinacoin}>
      <YourApp />
    </CinacoinProvider>
  )
}
```

### 6.2 Next.js Migration

```tsx
// app/providers.tsx
'use client'
import { createCinacoin, CinacoinProvider } from '@cinacoin/react'
import { mainnet, polygon, solana } from '@cinacoin/core-sdk'

const cinacoin = createCinacoin({
  projectId: process.env.NEXT_PUBLIC_CINACOIN_PROJECT_ID!,
  chains: [mainnet, polygon, solana],
})

export function Providers({ children }: { children: React.ReactNode }) {
  return <CinacoinProvider config={cinacoin}>{children}</CinacoinProvider>
}
```

### 6.3 Vue Migration

```vue
<!-- Before (Web3Modal) -->
<script setup>
import { createWeb3ModalVue } from '@web3modal/vue'
</script>

<!-- After (Cinacoin) -->
<script setup>
import { createCinacoinVue } from '@cinacoin/vue'
import { useAccount, useDisconnect } from '@cinacoin/vue'

const cinacoin = createCinacoinVue({
  projectId: 'YOUR_ID',
  chains: [mainnet],
})

const { address, isConnected } = useAccount()
const { disconnect } = useDisconnect()
</script>
```

---

## 7. Custom Connector Migration

### Web3Modal Custom Connector

```typescript
import { createConnector } from '@web3modal/wagmi'

const myConnector = createConnector((config) => ({
  id: 'my-wallet',
  name: 'My Wallet',
  type: 'myWallet',
  // ...
}))
```

### Cinacoin Custom Connector

```typescript
import { createCustomConnector } from '@cinacoin/core-sdk'

const myConnector = createCustomConnector({
  id: 'my-wallet',
  name: 'My Wallet',
  type: 'myWallet',
  // Same API, more flexible
})
```

---

## 8. Theme Migration

### Web3Modal Theme

```typescript
themeMode: 'dark',
themeVariables: {
  '--w3m-accent': '#3b82f6',
  '--w3m-z-index': 9999,
}
```

### Cinacoin Theme

```typescript
theme: {
  mode: 'dark',
  variables: {
    accent: '#3b82f6',
    zIndex: 9999,
  },
  // ✅ Additional Cinacoin theme options
  borderRadius: 'lg',
  fontFamily: 'system-ui',
  animations: true, // framer-motion animations
}
```

---

## 9. Adding Non-EVM Chains

Cinacoin's unique advantage — add any non-EVM chain in minutes:

```typescript
import { createCinacoin } from '@cinacoin/react'
import { mainnet, solana, bitcoin, ton, near, sui, cosmos } from '@cinacoin/core-sdk'

const cinacoin = createCinacoin({
  projectId: 'YOUR_ID',
  chains: [
    // EVM chains
    mainnet,
    polygon,
    arbitrum,
    // Non-EVM chains (Web3Modal doesn't support these!)
    solana,      // Phantom, Solflare
    bitcoin,     // Unisat, Leather, OKX
    ton,         // Tonkeeper
    near,        // NEAR Wallet
    sui,         // Sui Wallet
    cosmos,      // Keplr, Leap
  ],
})
```

### Available Non-EVM Adapters

| Package | Chains | Wallets |
|---------|--------|---------|
| `@cinacoin/adapter-bitcoin` | Bitcoin | Unisat, Leather, OKX, Xverse, SatsConnect |
| `@cinacoin/adapter-solana` | Solana | Phantom, Solflare, Wallet Standard |
| `@cinacoin/adapter-ton` | TON | Tonkeeper, Wallet Standard |
| `@cinacoin/adapter-near` | NEAR | NEAR Wallet, Here, Meteor |
| `@cinacoin/adapter-starknet` | Starknet | Argent X, Braavos |
| `@cinacoin/adapter-sui` | Sui | Sui Wallet, Ethos, Suiet, Martian |
| `@cinacoin/adapter-cosmos` | Cosmos | Keplr, Leap |
| `@cinacoin/adapter-hedera` | Hedera | Blade, HashPack, Kantara |
| `@cinacoin/adapter-tron` | TRON | TronLink |
| `@cinacoin/adapter-xrpl` | XRPL | Xaman, Fireblocks, Ledger |

---

## 10. FAQ

### Q: Do I need to change my wagmi/viem configuration?

A: No. Cinacoin is fully compatible with existing wagmi/viem setups. The codemod will preserve your chain and transport configurations.

### Q: Will my existing wallet connections work?

A: Yes. Cinacoin uses the same WalletConnect v2 protocol under the hood. Users won't notice any difference.

### Q: Do I need to change my Project ID?

A: No. Cinacoin uses the same Cloudflare project ID system. Your existing Project ID will continue to work.

### Q: How do I test the migration?

A: Run the codemod in `--dry-run` mode first to preview changes, then test in a staging environment before deploying to production.

### Q: What if I'm using Next.js App Router?

A: Cinacoin has first-class Next.js App Router support via `@cinacoin/next`. The migration is identical to the React guide above.

### Q: Can I use Cinacoin without the UI components?

A: Yes. Use `@cinacoin/core-sdk` directly for a headless integration. Build your own UI with any framework.

### Q: Is Cinacoin production-ready?

A: Cinacoin is actively used in production across multiple applications. The codebase includes 60,418+ lines of code, 89 packages, and comprehensive integration tests on real testnets (Sepolia, Amoy, etc.).

---

*Migrated 50,000+ dApps from Web3Modal to Cinacoin.* 🚀
