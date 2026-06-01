# AppKit

Universal wallet connection kit. 300+ wallets, 50+ chains.

## Overview

Cinacoin AppKit provides a seamless wallet connection experience across EVM, Solana, Bitcoin, Cosmos, and more.

## Quick Start

```bash
npm install @cinacoin/appkit
```

```tsx
import { createAppKit } from '@cinacoin/appkit'

const appKit = createAppKit({
  projectId: 'your-project-id',
  networks: [mainnet, polygon, arbitrum],
})
```

## Features

- 300+ wallet integrations
- 50+ chain support
- Social login (Google, Apple, X)
- Email wallet creation
- Embedded wallet
- Account abstraction support

## Documentation

- [Core SDK](/api/core-sdk)
- [React SDK](/api/react)
- [Quick Start](/guide/quick-start)
