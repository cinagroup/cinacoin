# Relay

Cross-chain message relay infrastructure.

## Overview

Relay enables seamless cross-chain transactions without manual bridge interactions.

## Quick Start

```bash
npm install @cinacoin/relay
```

```tsx
import { createRelay } from '@cinacoin/relay'

const relay = createRelay({
  projectId: 'your-project-id',
})

await relay.execute({
  fromChain: 'ethereum',
  toChain: 'polygon',
  message: encodedData,
})
```

## Features

- Cross-chain messaging
- Automatic routing
- Status tracking
- Multi-chain atomic operations

## Related

- [Cross-Chain Sync](/api/cross-chain-sync)
- [Bundler](/api/bundler)
