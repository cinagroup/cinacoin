# Cinacoin React/Next.js Quickstart Guide

This guide will help you integrate Cinacoin into your React/Next.js application in under 5 minutes. Cinacoin is a self-hosted wallet connection toolkit that provides a white-label UI for connecting, managing, and interacting with crypto wallets across multiple chains.

## Overview

Cinacoin provides:
- **React components** for wallet connection, chain switching, and account management
- **React hooks** for accessing wallet state and performing blockchain operations
- **Multi-chain support** with built-in EVM, Cosmos, Solana, and other chain adapters
- **White-label UI** that can be fully customized to match your brand
- **EIP-5792 support** for advanced wallet capabilities like atomic batch transactions

## Environment Setup

Before starting, ensure you have the following prerequisites:

- **Node.js**: Version 18 or higher (v18.17.0+ recommended)
- **Package Manager**: pnpm (recommended), npm, or yarn
- **TypeScript**: Version 5.0 or higher

```bash
# Verify your Node.js version
node --version
# Should output: v18.x.x or higher

# Install pnpm if you don't have it
npm install -g pnpm
```

## 5-Minute Quick Start

### Step 1: Create a Next.js Project

Create a new Next.js project with TypeScript support:

```bash
pnpm create next-app@latest my-cinacoin-app --use-pnpm --typescript
cd my-cinacoin-app
```

### Step 2: Install Cinacoin Dependencies

Install the Cinacoin React adapter and core SDK:

```bash
pnpm add @cinacoin/react @cinacoin/core-sdk
```

### Step 3: Basic Configuration

Create a configuration object with your project settings. You'll need:

- **Project ID**: Your unique identifier (use "demo_project_id" for testing)
- **Chains**: Array of supported blockchain networks
- **Theme**: UI appearance settings

### Step 4: ConnectButton Component Usage

The `ConnectButton` component provides a ready-to-use wallet connection button with full customization options.

### Step 5: useAccount and useDisconnect Hooks

Use these hooks to access account information and manage wallet disconnection.

## Complete Example

Here's a complete working example for a Next.js App Router project:

### App Layout (`app/layout.tsx`)

```tsx
'use client';

import React from 'react';
import type { CinacoinConfig } from '@cinacoin/react';
import { CinacoinProvider } from '@cinacoin/react';

// Replace with your actual project ID
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID ?? 'demo_project_id';

const config: CinacoinConfig = {
  projectId,
  metadata: {
    name: 'My dApp',
    description: 'My awesome decentralized application',
    url: 'https://mydapp.com',
    icons: ['https://mydapp.com/icon.png'],
  },
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: 'https://cloudflare-eth.com',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://etherscan.io',
    },
    {
      id: 137,
      name: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      blockExplorerUrl: 'https://polygonscan.com',
    },
    {
      id: 11155111,
      name: 'Sepolia',
      rpcUrl: 'https://rpc.sepolia.org',
      nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://sepolia.etherscan.io',
      testnet: true,
    },
  ],
  theme: {
    mode: 'dark',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CinacoinProvider config={config}>
          {children}
        </CinacoinProvider>
      </body>
    </html>
  );
}
```

### Home Page (`app/page.tsx`)

```tsx
'use client';

import React from 'react';
import { ConnectButton, useAccount, useDisconnect } from '@cinacoin/react';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Cinacoin Quickstart Demo</h1>
      
      {/* Connect Button */}
      <ConnectButton 
        label="Connect Wallet"
        variant="primary"
        size="md"
        showAvatar
        showNetwork
      />
      
      {/* Account Info */}
      {isConnected && address && (
        <div style={{ marginTop: '1rem' }}>
          <p>Connected: {address}</p>
          <button 
            onClick={() => disconnect()}
            style={{ 
              background: '#dc2626', 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
```

## Project Structure

A typical Cinacoin-integrated Next.js project structure looks like this:

```
my-cinacoin-app/
├── app/
│   ├── layout.tsx          # Root layout with CinacoinProvider
│   ├── page.tsx            # Main page with ConnectButton
│   └── components/         # Custom components using Cinacoin hooks
├── public/
├── .env.local             # Environment variables (NEXT_PUBLIC_PROJECT_ID)
├── package.json
└── tsconfig.json
```

## Multi-Chain Configuration

Cinacoin supports multiple chains out of the box. Add any EVM-compatible chain to your configuration:

```tsx
const config: CinacoinConfig = {
  // ... other config
  chains: [
    // Ethereum Mainnet
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: 'https://cloudflare-eth.com',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://etherscan.io',
    },
    // Polygon
    {
      id: 137,
      name: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      blockExplorerUrl: 'https://polygonscan.com',
    },
    // Arbitrum
    {
      id: 42161,
      name: 'Arbitrum',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      nativeCurrency: { name: 'Arbitrum ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://arbiscan.io',
    },
    // Optimism
    {
      id: 10,
      name: 'Optimism',
      rpcUrl: 'https://mainnet.optimism.io',
      nativeCurrency: { name: 'Optimism ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://optimistic.etherscan.io',
    },
  ],
};
```

## Wallet Customization

You can customize which wallets appear in the connection modal by specifying `recommendedWallets`:

```tsx
const config: CinacoinConfig = {
  // ... other config
  recommendedWallets: ['metamask', 'walletconnect', 'coinbase', 'rabby'],
};
```

Available wallet IDs:
- `metamask` - MetaMask
- `walletconnect` - Cinacoin
- `coinbase` - Coinbase Wallet
- `rabby` - Rabby Wallet
- `email` - Email-based authentication

## Theme Customization

Cinacoin supports three theme modes:

```tsx
const config: CinacoinConfig = {
  // ... other config
  theme: {
    mode: 'dark', // 'dark' | 'light' | 'minimal'
  },
};
```

For advanced theming, you can override CSS variables:

```tsx
const config: CinacoinConfig = {
  // ... other config
  theme: {
    mode: 'dark',
    variables: {
      '--ocx-primary': '#6366f1',
      '--ocx-primary-hover': '#4f46e5',
      '--ocx-border-radius': '8px',
    },
  },
};
```

## Internationalization (i18n)

Cinacoin supports multiple languages through the `@cinacoin/cinacoin-i18n` package:

```bash
pnpm add @cinacoin/cinacoin-i18n
```

```tsx
import { loadLocale } from '@cinacoin/cinacoin-i18n';

// Load Spanish locale
await loadLocale('es');

const config: CinacoinConfig = {
  // ... other config
};
```

Available locales: `en`, `es`, `fr`, `de`, `zh`, `ja`, `ko`, `ru`, `pt`, `it`

## Common Error Troubleshooting

### "useCinacoinContext must be used within <CinacoinProvider>"

**Cause**: You're using Cinacoin hooks outside the provider context.

**Solution**: Ensure your component is wrapped with `<CinacoinProvider>` in your layout.

### "No wallet provider available — connect a wallet first"

**Cause**: You're trying to make a blockchain request before connecting a wallet.

**Solution**: Check the connection status before making requests:

```tsx
const { status, request } = useCinacoin();

if (status === 'connected') {
  await request('eth_getBalance', [address, 'latest']);
}
```

### "Window is not defined" (SSR errors)

**Cause**: Cinacoin tries to access browser APIs during server-side rendering.

**Solution**: Use the `'use client'` directive at the top of your files and ensure provider is only used in client components.

### Wallet connection fails silently

**Cause**: Missing or incorrect RPC URLs in chain configuration.

**Solution**: Verify your RPC URLs are correct and accessible:

```tsx
// Test RPC URL
const response = await fetch('YOUR_RPC_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
    id: 1
  })
});
```

## Next Steps

Once you have the basic integration working, explore these advanced features:

### Swap Integration
Use `@cinacoin/swap-sdk` for token swaps:

```bash
pnpm add @cinacoin/swap-sdk
```

### On-Ramp Integration
Add fiat on-ramp functionality with `@cinacoin/onramp-sdk`:

```bash
pnpm add @cinacoin/onramp-sdk
```

### Account Abstraction (AA)
Enable smart contract wallets with `@cinacoin/aa-sdk`:

```bash
pnpm add @cinacoin/aa-sdk
```

### SIWE/SIWX Authentication
Implement Sign-In with Ethereum/Ethereum-compatible chains:

```bash
pnpm add @cinacoin/siwe
```

### Advanced Hooks
Explore additional hooks for advanced functionality:

- `useBalance()` - Get account balance
- `useSendTransaction()` - Send transactions
- `useSignMessage()` - Sign messages
- `useSwitchChain()` - Switch between chains
- `useWalletCapabilities()` - Check EIP-5792 capabilities
- `useSendCalls()` - Send atomic batch transactions

## Support

For questions and support, visit:
- [GitHub Repository](https://github.com/cinagroup/Cinacoin)
- [Documentation](https://docs.cinacoin.dev)
- [Discord Community](https://discord.gg/cinacoin)

Happy building! 🚀