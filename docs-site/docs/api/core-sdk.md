# Core SDK

> `@cinacoin/core-sdk` — Cinacoin 核心 SDK 参考。

## Overview

The Core SDK is the foundation of the Cinacoin ecosystem. It provides a complete, self-hosted wallet connection toolkit — a drop-in replacement for Reown/WalletConnect infrastructure — with unified chain adapter interfaces, session management, event handling, EIP-6963 wallet discovery, deep linking, EIP-5792 atomic batch transactions, and first-class adapters for 14+ chains.

**Key capabilities:**

- **Connector abstraction** — uniform API across injected, QR, relay/WalletConnect wallets
- **Session management** — state machine with persistence, expiry, and integrity checks
- **Multi-chain adapters** — viem, wagmi, ethers v5/v6, Solana, Bitcoin, TON, TRON, Polkadot, Cosmos, Hedera, Sui, Starknet, NEAR, XRPL
- **EIP-5792 Wallet Call API** — atomic batch transactions, capability detection
- **EIP-6963 wallet discovery** — multi-injected provider detection
- **Deep linking** — platform-aware redirects with universal link fallback

## Installation

```bash
npm install @cinacoin/core-sdk
```

### Peer Dependencies (optional)

Depending on which adapters you need:

```bash
npm install viem         # for ViemChainAdapter
npm install wagmi viem   # for WagmiConnector
npm install ethers@5     # for Ethers5Adapter
npm install ethers@6     # for Ethers6Adapter
```

## Quick Start

### Basic Initialization

```typescript
import { Cinacoin } from '@cinacoin/core-sdk'

const cinacoin = new Cinacoin({
  projectId: 'your-project-id',
  relayUrl: 'wss://relay.cinacoin.com/v1',
  chains: [mainnet, polygon],
})
```

### Connect to a Wallet

```typescript
import { Connector, SessionManager } from '@cinacoin/core-sdk'

const session = new SessionManager()
const connector = /* injected, QR, or relay connector */

// Listen for state changes
session.subscribe((state) => {
  console.log('Session state:', state.status)
})

// Initiate connection
await session.initiate(connector, { chainId: 1 })
```

### Dynamic Adapter Creation

```typescript
import { createAdapter } from '@cinacoin/core-sdk'

// Create any chain adapter dynamically
const tonAdapter = await createAdapter({
  type: 'ton',
  chains: TON_CHAINS,
})

const solanaAdapter = await createAdapter({
  type: 'solana',
})
```

## API Reference

### Classes

| Export | Description |
|---|---|
| `Connector` | Abstract base class for all wallet connection methods (injected, QR, relay, walletconnect) |
| `SessionManager` | Lifecycle state machine with persistence, expiry (24h TTL), and integrity validation |
| `RedirectHandler` | Platform-aware deep link handler with smart redirect fallback |
| `EventEmitter` | Internal event system for pub/sub patterns |

### Types

| Export | Description |
|---|---|
| `Chain`, `ChainNamespace`, `ChainReference` | Chain identification and grouping |
| `ConnectParams`, `ConnectionResult` | Connection input/output shapes |
| `SessionState` | Discriminated union: `'disconnected' \| 'connecting' \| 'connected' \| 'error'` |
| `CinacoinState`, `ConnectionStatus` | State management types |
| `ChainAdapter`, `ChainAdapterMethods` | Unified adapter interface |
| `EIP6963ProviderInfo`, `EIP1193Provider` | EIP-6963 multi-injected provider types |

### Chain Adapters

| Adapter | Exported From | Key Features |
|---|---|---|
| `EvmAdapter` | `./adapters/evm.js` | Base EVM adapter |
| `ViemChainAdapter` | `./adapters/viem.js` | viem integration |
| `WagmiConnector` | `./adapters/wagmi.js` | wagmi multi-chain support |
| `Ethers5Adapter` | `./adapters/ethers5.js` | ethers.js v5 bridge |
| `Ethers6Adapter` | `./adapters/ethers6.js` | ethers.js v6 bridge |
| `SolanaChainAdapter` | `./adapters/solana.js` | Solana wallet support |
| `BitcoinChainAdapter` | `./adapters/bitcoin.js` | Bitcoin UTXO handling |
| `TONChainAdapter` | `./adapters/ton.js` | TON address parsing, Jetton transfers |
| `TRONChainAdapter` | `./adapters/tron.js` | TRON transactions, TRC20 |
| `PolkadotChainAdapter` | `./adapters/polkadot.js` | SS58 addresses, asset transfers |
| `CosmosChainAdapter` | `./adapters/cosmos.js` | Bech32, CosmWasm execution |
| `HederaChainAdapter` | `./adapters/hedera.js` | Hedera EVM, token/NFT handling |
| `SuiChainAdapter` | `./adapters/sui.js` | BCS encoding, transaction builder |
| `StarknetChainAdapter` | `./adapters/starknet.js` | Cairo calldata, STRK/ETH tokens |
| `NearChainAdapter` | `./adapters/near.js` | NEAR function calls, FT/NFT transfers |
| `XrplChainAdapter` | `./adapters/xrpl.js` | XRPL payments, offers, NFTs |

### Cryptography

| Export | Description |
|---|---|
| `generateKeypair`, `sharedSecret` | X25519 keypair generation and Diffie-Hellman |
| `encrypt`, `decrypt`, `deriveSymmetricKey` | Payload encryption utilities |
| `bytesToHex`, `hexToBytes` | Encoding helpers |

### EIP-5792 (Wallet Call API)

| Export | Description |
|---|---|
| `walletGetCapabilities` | Query wallet capabilities |
| `walletSendCalls` | Send atomic batch of calls |
| `walletGetCallsStatus` | Poll batch execution status |
| `supportsAtomicBatch` | Check batch transaction support |
| `buildAtomicBatch`, `executeAtomicBatch` | Build and execute atomic batches |
| `createEthTransferCall`, `createContractCall` | Individual call builders |

### EIP-6963 (Multi-Injected Provider)

| Export | Description |
|---|---|
| `discoverWallets`, `watchWallets` | Detect injected wallet providers |
| `findWalletByRdns` | Look up wallet by reverse DNS |

### Deep Linking

| Export | Description |
|---|---|
| `generateDeepLink` | Build deep link URL for a wallet |
| `smartRedirect` | Platform-aware redirect with fallback |
| `generateUniversalLink` | Universal link for mobile |
| `detectPlatform` | Detect current platform (iOS/Android/Web) |

## Advanced Usage

### Session Persistence & Security

SessionManager persists session state to `localStorage` with automatic expiry (24h) and integrity validation. For production:

```typescript
const session = new SessionManager()

// Restore previous session (validates expiry + integrity hash)
await session.restore()

// Subscribe to state changes
const unsubscribe = session.subscribe((state) => {
  if (state.status === 'connected') {
    console.log('Connected accounts:', state.accounts)
  }
})

// Clean up
unsubscribe()
```

### Custom Connector Implementation

```typescript
import { Connector } from '@cinacoin/core-sdk'

class MyWalletConnector extends Connector {
  readonly id = 'my-wallet'
  readonly name = 'My Wallet'
  readonly icon = 'https://mywallet.com/icon.png'
  readonly installed = true
  readonly type = 'injected'

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    // Your wallet connection logic
    return {
      accounts: ['0x...'],
      chainId: 1,
      sessionId: 'unique-session-id',
    }
  }

  async disconnect(): Promise<void> {
    // Cleanup
  }

  async getAccounts(): Promise<string[]> {
    return ['0x...']
  }

  async getChainId(): Promise<number> {
    return 1
  }

  async switchChain(chainId: number): Promise<void> {
    // Chain switching logic
  }

  async signMessage(message: string): Promise<string> {
    return '0x...'
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    return '0x...'
  }
}
```

## Related

- [React Adapter](/api/react) — React hooks and provider
- [SIWE](/api/siwe) — Sign-In with Ethereum
- [Swap SDK](/api/swap-sdk) — Swap aggregator
- [AA SDK](/api/aa-sdk) — Account Abstraction
