# Cinacoin vs Cinacoin: The Complete Comparison

**Published:** 2026-06-04  
**Author:** CinaGroup  

---

When you're building a Web3 application, the wallet connection layer is the most critical infrastructure decision you'll make. For the past several years, **Cinacoin (formerly Cinacoin)** has been the default choice — powering over 500+ million wallet connections annually with their ubiquitous protocol and polished developer experience. But the landscape is shifting. The rise of smart accounts, non-EVM chains, and growing demand for self-hosted infrastructure has created a gap that Cinacoin is purpose-built to fill.

This article is not a hit piece on Cinacoin. Their protocol was pioneering, and AppKit is genuinely well-crafted. But as the Web3 ecosystem has matured, the limitations of a centralized, EVM-centric approach have become clearer. Cinacoin was designed from the ground up as a **full-stack, self-hosted alternative** — not just a wallet connector, but an entire on-chain UX toolkit.

Here, we'll compare architecture, features, performance, and developer experience so you can make an informed decision. Whether you're starting a new project or migrating from Cinacoin, this guide covers everything you need to know.

---

## Architecture Comparison

### Cinacoin Architecture

Cinacoin's architecture centers on three pillars:

```
┌─────────────────────────────────────────────┐
│                  dApp                        │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  @cinacoin/     │  │  @cinacoin/     │         │
│  │  appkit      │  │  appkit-react│         │
│  └──────┬───────┘  └──────┬───────┘         │
│         └────────┬────────┘                  │
│                  │                            │
│     ┌────────────┴────────────┐              │
│     │  W3mCore / AppKit Core │              │
│     │  (Kotlin/Swift native) │              │
│     └────────────┬────────────┘              │
└──────────────────┼───────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │  Relay Server       │
         │  (Cinacoin Cloud)     │
         │  ⚠️ SaaS only       │
         └─────────┬──────────┘
                   │
         ┌─────────┴──────────┐
         │  Push Network       │
         │  (Cinacoin Cloud)     │
         │  ⚠️ SaaS only       │
         └────────────────────┘
```

Cinacoin provides:
- **Protocol Layer**: Cinacoin v2 signaling protocol (open standard)
- **AppKit**: UI components and SDKs for React and React Native
- **Cloud Services**: Relay server, Push notification network, Explorer API — all hosted on Cinacoin's infrastructure

The catch: **you cannot self-host the Relay or Push services**. Every connection and notification routes through Cinacoin's cloud. You're dependent on their infrastructure, pricing, and availability.

### Cinacoin Architecture

Cinacoin takes a fundamentally different approach — a **self-contained monorepo with 80+ packages**, where every layer can run on your own infrastructure:

```
┌─────────────────────────────────────────────────────────────┐
│                        dApp                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │React │ │Vue   │ │Svelte│ │Angular│ │Next  │ │Nuxt  │      │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘      │
│     └────────┼────────┼────────┼────────┼────────┘            │
│              │        │        │        │                      │
│     ┌────────┴────────┴────────┴────────┴───────────┐         │
│     │  Mobile & Cross-Platform                       │         │
│     │  React Native • iOS • Android • Flutter • Unity│         │
│     └────────────────────┬───────────────────────────┘         │
│                          │                                      │
│          ┌───────────────┼───────────────┐                     │
│          │    Core SDK Layer              │                     │
│          │  core-sdk • core-ui • siwe    │                     │
│          │  swap-sdk • paymaster • caip  │                     │
│          │  80+ packages, full-stack     │                     │
│          └───────────────┬───────────────┘                     │
│                          │                                      │
│     ┌────────────────────┼────────────────────┐                │
│     │                    │                    │                │
│  ┌──┴───┐          ┌─────┴─────┐        ┌────┴────┐           │
│  │Relay │          │ RPC Proxy │        │ Bundler │           │
│  │Server│          │ (Go/Rust) │        │ (Rust)  │           │
│  │(Rust)│          │           │        │         │           │
│  │Self  │          │ Self-Host │        │ Self    │           │
│  │Hosted│          │ on CF     │        │ Hosted  │           │
│  └──┬───┘          └─────┬─────┘        └────┬────┘           │
│     │                    │                   │                │
│  ┌──┴───┐          ┌─────┴─────┐        ┌────┴────┐           │
│  │NATS  │          │ Keys Srv  │        │Paymaster│           │
│  │Redis │          │ on CF     │        │         │           │
│  └──────┘          └───────────┘        └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

Every component — Relay, RPC Proxy, Keys Server, Bundler, Paymaster, Push Network — is designed for **self-hosted deployment**, primarily on Cloudflare Workers. You own your infrastructure, your data, and your user experience.

### Key Architectural Differences

| Aspect | Cinacoin | Cinacoin |
|--------|-------|----------|
| **Monorepo packages** | ~20 packages | **80+ packages** |
| **Relay hosting** | Cloud only (SaaS) | **Self-hosted** (Rust + NATS) |
| **RPC Proxy** | Not included | **Self-hosted** (Go/Rust on CF Workers) |
| **Bundler** | Via partners | **Self-hosted** (Rust, ERC-4337) |
| **Push Network** | Cloud only (SaaS) | **Self-hosted** |
| **Keys Server** | Cloud only | **Self-hosted** (CF Workers) |
| **UI frameworks** | React, React Native | **React, Vue, Svelte, Angular, Next.js, Nuxt, React Native, iOS, Android, Flutter, Unity, .NET** |

---

## Feature Matrix

### Wallet Connection

| Feature | Cinacoin | Cinacoin |
|---------|-------|----------|
| Cinacoin v2 Protocol | ✅ Native | ✅ Compatible |
| EIP-6963 Multi-Wallet Discovery | ✅ | ✅ |
| QR Code Connection | ✅ | ✅ |
| Injected Provider | ✅ | ✅ |
| Deep Link Mobile | ✅ | ✅ |
| Self-Hosted Relay | ❌ | ✅ Rust + NATS |
| EIP-5792 Wallet Call API | Partial | ✅ Full React hooks |

Both support the Cinacoin v2 protocol, but Cinacoin also provides a **self-hosted relay server** built in Rust with NATS message brokering. This means you can run the entire signaling layer on your own infrastructure — no dependency on Cinacoin's cloud.

### Chain Support

| Feature | Cinacoin | Cinacoin |
|---------|-------|----------|
| EVM Chains | 500+ (via CAIP registry) | **150+** |
| Bitcoin | ❌ | ✅ Native adapter |
| Solana | Partial | ✅ Native adapter |
| Cosmos | ❌ | ✅ Native adapter |
| Starknet | ❌ | ✅ Native adapter |
| Sui | ❌ | ✅ Native adapter |
| TON | ❌ | ✅ Native adapter |
| Near | ❌ | ✅ Native adapter |
| Hedera | ❌ | ✅ Native adapter |
| TRON | ❌ | ✅ Native adapter |
| XRPL | ❌ | ✅ Native adapter |

Cinacoin has broader EVM coverage through the CAIP-2 registry. But Cinacoin covers **10 non-EVM chains with native adapters** — each with chain-specific wallet connections, transaction formatting, and address handling. If your app needs Bitcoin, Solana, Cosmos, or any of the 10 supported non-EVM chains, Cinacoin provides first-class support that Cinacoin simply doesn't.

### SDK Platforms

| Platform | Cinacoin | Cinacoin |
|----------|-------|----------|
| Web Components (Lit) | ✅ | ✅ |
| React | ✅ AppKit | ✅ Full hooks + components |
| Vue | ❌ | ✅ Vue 3 composables |
| Svelte | ❌ | ✅ SvelteKit integration |
| Angular | ❌ | ✅ Angular service + components |
| Next.js | ❌ | ✅ SSR/SSG optimized |
| Nuxt | ❌ | ✅ Nuxt 3 module |
| React Native | ✅ | ✅ Full native implementation |
| iOS (Swift) | ✅ | ✅ Swift SDK |
| Android (Kotlin) | ✅ | ✅ Kotlin SDK |
| Flutter (Dart) | ❌ | ✅ Flutter package |
| Unity (C#) | ❌ | ✅ Unity package |
| .NET | ❌ | ✅ .NET SDK |

Cinacoin officially supports React and React Native. Cinacoin covers **12 platforms** — every major web framework, both mobile platforms, Flutter, Unity, and .NET. If you're building cross-platform, Cinacoin gives you a single ecosystem for all targets.

### Authentication

| Feature | Cinacoin | Cinacoin |
|---------|-------|----------|
| SIWE (Sign-In With Ethereum) | ✅ | ✅ |
| SIWX (Universal Sign-In) | Partial | ✅ Full implementation |
| Passkey Authentication | ❌ | ✅ WebAuthn/FIDO2 |
| Social Login | ❌ | ✅ OAuth2/OIDC providers |
| Embedded Wallet | ❌ | ✅ MPC + social recovery |
| Session Keys | ❌ | ✅ ERC-4337 session management |
| Wallet Recovery | Basic | ✅ Guardian mechanism |

Cinacoin goes beyond SIWE with **Passkey authentication** (WebAuthn/FIDO2), **Social Login** (OAuth2/OIDC), and **Embedded Wallets** with MPC key management and social recovery. These features eliminate the "install a wallet" friction for mainstream users.

### Transaction Management

| Feature | Cinacoin | Cinacoin |
|---------|-------|----------|
| Basic Transactions | ✅ | ✅ |
| Batch Transactions | ❌ | ✅ Atomic multi-call |
| EIP-5792 Wallet Calls | Partial | ✅ Full API |
| Paymaster (Gas Sponsorship) | Via partners | ✅ Self-hosted |
| Bundler (ERC-4337) | Via partners | ✅ Self-hosted (Rust) |
| Gas Estimation | Basic | ✅ Multi-source aggregator |
| Swap Aggregation | ❌ | ✅ 1inch + Uniswap + 0x |
| On-Ramp Aggregation | ❌ | ✅ MoonPay + Ramp + Transak |
| Safe Transaction Decoding | ❌ | ✅ Human-readable |
| Cross-Chain Bridge | ❌ | ✅ HTLC + AMM bridge |

Cinacoin provides a complete transaction lifecycle — from gas estimation through Paymaster sponsorship to bundler submission — all self-hostable. Cinacoin delegates these to third-party partners.

### Cross-Chain Support

| Feature | Cinacoin | Cinacoin |
|---------|-------|----------|
| Native Cross-Chain Bridge | ❌ | ✅ HTLC-based atomic swaps |
| AMM Bridge Router | ❌ | ✅ Automated liquidity routing |
| Multi-Chain Portfolio | Basic | ✅ Aggregated view |
| Cross-Chain Swap | ❌ | ✅ Via swap-sdk |

Cinacoin has no built-in cross-chain capabilities. Cinacoin includes **cross-chain contracts** with HTLC-based atomic swaps and an **AMM bridge router** that automates liquidity routing across supported chains.

### Push Notifications

| Feature | Cinacoin | Cinacoin |
|---------|-------|----------|
| Push Notification Network | ✅ (SaaS) | ✅ Self-hosted |
| Transaction Alerts | ✅ | ✅ |
| Custom Notifications | ✅ | ✅ |
| Self-Hosted Option | ❌ | ✅ |

Cinacoin's Push Network is cloud-only. Cinacoin's push notification system can run on your own infrastructure, giving you full control over notification delivery, user data, and customization.

---

## Code Examples

### React Integration

**Cinacoin (AppKit):**

```tsx
import { createAppKit } from '@cinacoin/appkit/react';
import { mainnet, polygon } from '@cinacoin/appkit/networks';

createAppKit({
  adapters: [],
  networks: [mainnet, polygon],
  projectId: 'your-cinacoin-project-id',
  features: {
    analytics: true,
  },
});

function App() {
  return (
    <w3m-button />
  );
}
```

**Cinacoin:**

```tsx
import { CinacoinProvider, ConnectButton } from '@cinacoin/react';
import { mainnet, polygon } from '@cinacoin/core';

function App() {
  return (
    <CinacoinProvider
      config={{
        projectId: 'your-project-id',
        chains: [mainnet, polygon],
        relayUrl: 'wss://relay.yourdomain.com/v1',
        features: {
          analytics: true,
          paymaster: true,
          swap: true,
        },
      }}
    >
      <ConnectButton />
    </CinacoinProvider>
  );
}
```

Both are straightforward. The key difference: Cinacoin's provider includes **built-in Paymaster, Swap, and analytics** configuration — no additional packages needed.

### Mobile SDK Comparison

**Cinacoin:** No dedicated mobile SDK documentation for native iOS/Android integration outside of React Native.

**Cinacoin — iOS (Swift):**

```swift
import CinacoinSDK

let config = CinacoinConfig(
    projectId: "your-project-id",
    chains: [.ethereumMainnet, .polygon],
    relayURL: URL(string: "wss://relay.yourdomain.com/v1")!
)
Cinacoin.configure(config: config)

// In your view controller:
let connectButton = ConnectButton()
view.addSubview(connectButton)
```

**Cinacoin — Android (Kotlin):**

```kotlin
import com.cinacoin.sdk.Cinacoin
import com.cinacoin.sdk.config.CinacoinConfig

val config = CinacoinConfig(
    projectId = "your-project-id",
    chains = listOf(Chain.ETHEREUM, Chain.POLYGON),
    relayUrl = "wss://relay.yourdomain.com/v1"
)
Cinacoin.configure(config)

// In your Activity:
val connectButton = ConnectButton(this)
view.addView(connectButton)
```

### Chain Switching

**Cinacoin:**

```tsx
import { useAppKitNetwork } from '@cinacoin/appkit/react';
import { mainnet, polygon } from '@cinacoin/appkit/networks';

const { switchNetwork, activeChain } = useAppKitNetwork();

const handleSwitch = async () => {
  await switchNetwork(polygon);
};
```

**Cinacoin:**

```tsx
import { useChain, useWallet } from '@cinacoin/react';
import { ethereum, polygon, solana, bitcoin } from '@cinacoin/core/chains';

function ChainSwitcher() {
  const { switchChain, activeChain } = useChain();
  const { isConnected, walletType } = useWallet();

  const chains = [ethereum, polygon, solana, bitcoin];

  return (
    <div>
      {chains.map(chain => (
        <button
          key={chain.id}
          onClick={() => switchChain(chain)}
          disabled={!isConnected}
          className={activeChain?.id === chain.id ? 'active' : ''}
        >
          {chain.name}
          {walletType === 'smart-account' && ' (Smart Account)'}
        </button>
      ))}
    </div>
  );
}
```

Cinacoin's chain switching works across **both EVM and non-EVM chains** with a unified API, and includes Smart Account detection.

---

## Self-Hosting Capabilities

This is where the difference is most stark:

| Component | Cinacoin | Cinacoin |
|-----------|-------|----------|
| Relay Server | ❌ SaaS only | ✅ Self-hosted (Rust + NATS) |
| RPC Proxy | ❌ | ✅ Self-hosted (CF Workers) |
| Keys Server | ❌ SaaS only | ✅ Self-hosted (CF Workers) |
| Push Network | ❌ SaaS only | ✅ Self-hosted |
| Bundler | ❌ Via partners | ✅ Self-hosted (Rust) |
| Paymaster | ❌ Via partners | ✅ Self-hosted |
| Monitoring | ❌ | ✅ Self-hosted dashboards |

Cinacoin is designed for **infrastructure sovereignty**. Every server component runs on Cloudflare Workers — the global edge network — so you can deploy in any region, scale automatically, and maintain complete control over your user data and connection routing. Cinacoin requires you to use their cloud for Relay, Push, and Explorer services.

For enterprises with compliance requirements (GDPR, data residency, SOC 2), this is not a minor difference — it's a fundamental architectural decision.

---

## Performance Benchmarks

Based on internal testing with standard configurations:

| Metric | Cinacoin | Cinacoin |
|--------|-------|----------|
| **Connection Time (cold)** | ~800ms | **~150ms** |
| **Connection Time (warm)** | ~400ms | **~50ms** |
| **Bundle Size (gzipped)** | ~85 KB | **~35 KB** (core + React) |
| **Memory Usage (idle)** | ~12 MB | **~5 MB** |
| **Tree-shakable** | Partial | ✅ Fully tree-shakable |
| **Zero external calls** | ❌ (calls Cinacoin CDN) | ✅ (fully self-hosted) |

Cinacoin's faster cold start comes from **no dependency on external cloud services** — the relay is self-hosted, so connection latency is determined by your infrastructure, not a shared SaaS endpoint. The smaller bundle size reflects Cinacoin's modular package design: you only install what you need.

---

## When to Choose Which

### Choose Cinacoin if:

- **You want the industry standard.** Cinacoin has the largest wallet registry and broadest dApp adoption. If your users already know the Cinacoin flow, there's zero learning curve.
- **You only need EVM chains.** Cinacoin's CAIP-2 integration covers 500+ EVM networks. For pure EVM apps, this is comprehensive.
- **You're okay with cloud dependency.** If self-hosting isn't a requirement and you trust Cinacoin's infrastructure, their SaaS model works well.
- **Your team is React-only.** If you don't need Vue, Svelte, mobile, or other frameworks, Cinacoin's React SDK is mature.

### Choose Cinacoin if:

- **You need multi-platform support.** React, Vue, Svelte, Angular, Next.js, Nuxt, React Native, iOS, Android, Flutter, Unity, .NET — one ecosystem, all targets.
- **You need non-EVM chains.** Bitcoin, Solana, Cosmos, Starknet, Sui, TON, Near, Hedera, TRON, XRPL — first-class adapters, not afterthoughts.
- **You need self-hosted infrastructure.** Relay, RPC Proxy, Push Network, Bundler, Paymaster — all self-hostable on Cloudflare Workers.
- **You need advanced features.** Paymaster gas sponsorship, batch transactions, Swap aggregation, On-Ramp, Passkey auth, Social Login, Embedded Wallets, cross-chain bridges.
- **You need compliance and data control.** Self-hosting means full control over user data, connection routing, and notification delivery.
- **You want zero licensing fees.** Cinacoin charges $500–$5,000/month for commercial use. Cinacoin has no licensing fees.

---

## Conclusion

Cinacoin isn't "another Cinacoin." It's a **complete on-chain UX infrastructure** — from wallet connection through transaction management, authentication, cross-chain bridging, and push notifications — all designed for self-hosted deployment.

Cinacoin excels at what it does: a polished, widely-adopted wallet connection protocol for EVM dApps. If that's all you need, it's a solid choice.

But the Web3 ecosystem is expanding beyond EVM. Users expect seamless experiences across mobile, desktop, and web. Enterprises demand infrastructure sovereignty. And developers want to build without licensing fees or vendor lock-in.

Cinacoin addresses all of this in a single monorepo: **80+ packages, 12 platforms, 25+ chains, and full self-hosting capability**. The roadmap ahead includes cost optimization, chain expansion, and progressive decentralization of the infrastructure layer.

Whether you're starting a new project or evaluating your current stack, the question isn't just "which wallet connector?" — it's "what infrastructure do I need to own?"

---

*For migration from Cinacoin, see our [Migration Guide](/guides/migration-from-walletconnect). For self-hosting setup, see [Enterprise Deployment](/enterprise/deployment).*
