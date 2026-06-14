# Cinacoin Vue SDK Demo

A comprehensive Vue 3 demo application showcasing the full Cinacoin Vue SDK capabilities.

## Features

This demo showcases six key components that demonstrate the complete wallet lifecycle:

| Component | Purpose | SDK APIs Used |
|-----------|---------|---------------|
| **AppHeader** | Branding + connection status indicator | `useCinacoin` (status, account) |
| **ConnectWallet** | Full wallet connection UI | `OcxConnectButton`, `ConnectModal`, EIP-6963 detection, `connect`/`disconnect` |
| **ChainInfo** | Current chain display + chain switching | `OcxChainSwitcher`, `switchChain`, `config.chains` |
| **AccountBalance** | Real-time balance with auto-refresh | `useBalance`, `useEnsName` |
| **SignMessage** | Arbitrary message signing | `useSignMessage` |
| **SendTransaction** | ETH transfer with gas estimation | `useSendTransaction`, `useBalance` |

## Tech Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vite** (fast HMR, optimized builds)
- **TypeScript** (strict mode)
- **@cinacoin/vue** (Cinacoin Vue SDK)

## Setup

### 1. Install dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Configure environment variables

Copy the example env file and add your Cinacoin Project ID:

```bash
cp .env.example .env
```

Edit `.env` and set `VITE_PROJECT_ID` with your [Cinacoin Cloud](https://cloud.walletconnect.com) project ID.

### 3. Run the dev server

```bash
pnpm --filter @cinacoin/demo-vue dev
```

The app opens at `http://localhost:3001`.

### 4. Build for production

```bash
pnpm --filter @cinacoin/demo-vue build
```

## Architecture

```
apps/demo-vue/
├── src/
│   ├── main.ts                    # App entry point
│   ├── App.vue                    # Root: CinacoinProvider + layout
│   ├── env.d.ts                   # Vite env type declarations
│   └── components/
│       ├── AppHeader.vue          # Header with status indicator
│       ├── ConnectWallet.vue      # Full wallet connection demo
│       ├── ChainInfo.vue          # Chain display & switching
│       ├── AccountBalance.vue     # Balance + ENS display
│       ├── SignMessage.vue        # Message signing demo
│       ├── SendTransaction.vue    # ETH transfer with gas estimation
│       └── ConnectedFeatures.vue  # Conditional feature group
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── README.md
```

## Component Details

### AppHeader (~80 lines)
Sticky header with Cinacoin branding and a live connection status indicator (green/yellow/red dot). Uses `useCinacoin()` to reactively track wallet status.

### ConnectWallet (~180 lines)
The most comprehensive component:
- **OcxConnectButton**: Web component wrapper with balance/avatar/network display
- **ConnectModal**: Programmatically opened modal with recommended wallet config
- **EIP-6963 Detection**: Lists all detected wallets with installed/not-installed badges
- **Connection State Grid**: Shows status, truncated address, chain ID, disconnect button

### ChainInfo (~140 lines)
- **Current Chain Display**: Shows chain name, ID, native currency, testnet badge
- **OcxChainSwitcher**: Web component for interactive chain switching
- **Manual Chain List**: Clickable list of all configured chains with active indicator
- **Switching State**: Spinner animation during chain switch

### AccountBalance (~110 lines)
- **useBalance Hook**: Reactive native token balance with auto-refresh on address change
- **Formatted Display**: 4 decimal precision with chain symbol
- **Manual Refresh**: Refetch button with loading state
- **ENS Lookup**: Resolves address → ENS name with `useEnsName`

### SignMessage (~150 lines)
- **Message Input**: Textarea with preset message buttons
- **useSignMessage**: Signs via `personal_sign` EIP-191
- **Signature Display**: Hex signature with copy-to-clipboard
- **Error Handling**: User-friendly error messages

### SendTransaction (~200 lines)
- **ETH Transfer Form**: Recipient address + amount inputs with MAX button
- **Gas Estimation**: Calls `eth_estimateGas` via provider
- **useSendTransaction**: Sends via `eth_sendTransaction` (EIP-1193)
- **Status Tracking**: Shows tx hash, confirmation status, and explorer link

## SDK API Coverage

| API Category | Composables/Components | Used In |
|-------------|----------------------|---------|
| Provider | `CinacoinProvider` | App.vue |
| Account | `useCinacoin`, `useAccount` | All components |
| Connection | `connect`, `disconnect` | ConnectWallet |
| Wallets | `OcxConnectButton`, `ConnectModal` | ConnectWallet |
| Chains | `OcxChainSwitcher`, `switchChain` | ChainInfo |
| Balance | `useBalance` | AccountBalance, SendTransaction |
| ENS | `useEnsName` | AccountBalance |
| Signing | `useSignMessage` | SignMessage |
| Transactions | `useSendTransaction` | SendTransaction |
