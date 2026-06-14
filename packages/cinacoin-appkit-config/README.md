# @cinacoin/appkit-config

Cinacoin brand configuration layer for Reown AppKit.

This package provides a unified configuration for integrating Reown AppKit with Cinacoin branding across all Cinacoin applications.

## Features

- 🎨 **Cinacoin Branding** — Pre-configured theme with Cinacoin colors and fonts
- 🔗 **Multi-Chain Support** — Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche
- 👛 **Recommended Wallets** — MetaMask, Rainbow, Trust Wallet, Coinbase Wallet, Phantom, OKX
- 🔐 **Social Login** — Google, X (Twitter), GitHub, Discord
- 📧 **Email Login** — Built-in email wallet support
- 💱 **Swaps & On-Ramp** — Token swaps and fiat on-ramp enabled

## Installation

```bash
pnpm add @cinacoin/appkit-config
```

## Usage

### Basic Setup

```typescript
import { createCinacoinAppKit } from '@cinacoin/appkit-config';

// Initialize AppKit with Cinacoin branding
const appKit = createCinacoinAppKit({
  projectId: 'YOUR_PROJECT_ID', // Get from Reown Cloud
  metadata: {
    name: 'My Cinacoin App',
    description: 'My awesome dApp',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png'],
  },
  themeMode: 'dark', // or 'light'
});
```

### React Integration

```tsx
import { useCinacoinWallet } from '@cinacoin/appkit-config/react';

function ConnectButton() {
  const { address, isConnected, openConnectModal } = useCinacoinWallet();

  if (isConnected) {
    return <div>Connected: {address}</div>;
  }

  return <button onClick={openConnectModal}>Connect Wallet</button>;
}
```

### Custom Configuration

```typescript
import { createCinacoinAppKit, mainnet, polygon } from '@cinacoin/appkit-config';

const appKit = createCinacoinAppKit({
  projectId: process.env.REOWN_PROJECT_ID!,
  themeMode: 'dark',
  enableAnalytics: true,
  enableEmail: true,
  enableSocials: true,
  chains: [mainnet, polygon], // Only support specific chains
});
```

## API Reference

### `createCinacoinAppKit(options)`

Creates a Cinacoin-branded AppKit instance.

**Options:**

- `projectId` (required): Your Reown Cloud project ID
- `metadata`: Application metadata (name, description, url, icons)
- `themeMode`: 'light' | 'dark' (default: 'dark')
- `enableAnalytics`: Enable analytics (default: true)
- `enableEmail`: Enable email login (default: true)
- `enableSocials`: Enable social logins (default: true)
- `chains`: Array of supported chains (default: all EVM chains)

### `useCinacoinWallet()`

React hook for wallet connection.

**Returns:**

- `address`: Connected wallet address
- `isConnected`: Connection status
- `chainId`: Current chain ID
- `openConnectModal`: Function to open connection modal
- `isOpen`: Modal open state

### Theme Configuration

```typescript
import { CINACOIN_COLORS, getThemeVariables } from '@cinacoin/appkit-config';

// Get Cinacoin brand colors
console.log(CINACOIN_COLORS.primary); // '#0066FF'

// Get theme variables for custom styling
const themeVars = getThemeVariables('dark');
```

### Chain Configuration

```typescript
import { EVM_CHAINS, CHAIN_METADATA, isChainSupported } from '@cinacoin/appkit-config';

// Check if chain is supported
if (isChainSupported('eip155:1')) {
  console.log('Ethereum is supported');
}

// Get chain metadata
const ethMetadata = CHAIN_METADATA['eip155:1'];
console.log(ethMetadata.name); // 'Ethereum'
```

## Architecture

This package is part of the Cinacoin hybrid architecture:

```
┌─────────────────────────────────────────────┐
│  Frontend Applications                      │
│  - apps/website                             │
│  - apps/demo-react                          │
│  - apps/docs-site                           │
├─────────────────────────────────────────────┤
│  @cinacoin/appkit-config ← This package     │
│  - Brand configuration                      │
│  - Theme customization                      │
│  - Chain/wallet presets                     │
├─────────────────────────────────────────────┤
│  @reown/appkit                              │
│  - Wallet connection UI                     │
│  - Social/email login                       │
│  - Swaps & on-ramp                          │
├─────────────────────────────────────────────┤
│  Self-hosted Infrastructure                 │
│  - workers/auth-service                     │
│  - infra/relay                              │
│  - packages/walletconnect-v2                │
└─────────────────────────────────────────────┘
```

## License

Apache-2.0

## Links

- [Reown Documentation](https://docs.reown.com)
- [Cinacoin Documentation](https://docs.cinacoin.com)
- [Reown Cloud](https://cloud.reown.com)
