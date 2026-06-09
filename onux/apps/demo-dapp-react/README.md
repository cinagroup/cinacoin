# Cinacoin React Demo dApp

A comprehensive demo application showcasing the full Cinacoin SDK integration with React/Next.js.

## Features

This demo covers the complete wallet lifecycle across **8 components**:

| Component | Feature | SDK Hooks / Components Used |
|---|---|---|
| `DemoHeader` | App branding + connection status | `useCinaCoinContext` |
| `DemoConnectSection` | Connect button, modal, programmatic connect | `ConnectButton`, `ConnectModal`, `useConnect`, `useDisconnect` |
| `DemoChainSwitcher` | Chain switching + current chain info | `ChainSwitcher`, `useSwitchChain` |
| `DemoBalance` | Real-time native token balance | `useBalance` |
| `DemoSignMessage` | Sign arbitrary messages | `useSignMessage` |
| `DemoSendTransaction` | ETH transfer with gas estimation | `useSendTransaction` |
| `DemoBatchTransactions` | Atomic batch via EIP-5792 | `useSendCalls`, `useCallsStatus` |
| `DemoNFTGallery` | Multi-chain NFT display | `@cinacoin/nft-display` |

## Setup

### 1. Install dependencies

From the repo root:

```bash
pnpm install
```

### 2. Environment variables

```bash
cp apps/demo-dapp-react/.env.example apps/demo-dapp-react/.env.local
```

Edit `.env.local` and set your project ID:

```env
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
```

### 3. Run the dev server

```bash
cd apps/demo-dapp-react
pnpm dev
```

Or from the repo root:

```bash
pnpm dev --filter=@cinacoin/demo-dapp-react
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
apps/demo-dapp-react/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # CinacoinProvider wrapping
│   │   └── page.tsx            # Main demo page integrating all components
│   └── components/
│       ├── DemoHeader.tsx           # Header with connection status
│       ├── DemoConnectSection.tsx   # Connect UI patterns
│       ├── DemoChainSwitcher.tsx    # Chain switching
│       ├── DemoBalance.tsx          # Balance display
│       ├── DemoSignMessage.tsx      # Message signing
│       ├── DemoSendTransaction.tsx  # ETH transfer
│       ├── DemoBatchTransactions.tsx # EIP-5792 batch tx
│       └── DemoNFTGallery.tsx       # NFT collection view
├── .env.example
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## SDK Packages Used

- `@cinacoin/react` — React provider, components, and hooks
- `@cinacoin/core-sdk` — Core SDK types and EIP-5792 functions
- `@cinacoin/nft-display` — NFT fetching and display utilities

## Supported Chains (Demo Config)

- **Sepolia** (11155111) — Testnet
- **Amoy** (80002) — Polygon Testnet
- **Ethereum Mainnet** (1)

## License

MIT
