# RPC Proxy

Unified RPC endpoint with automatic routing.

## Overview

Single endpoint for all chains with rate limiting, failover, and intelligent routing.

## Quick Start

```
https://rpc.cinacoin.com/v1/{project-id}
```

```tsx
import { createRpcProxy } from '@cinacoin/rpc'

const rpc = createRpcProxy({
  projectId: 'your-project-id',
})

const result = await rpc.request('eth_blockNumber')
```

## Features

- Multi-chain routing
- Automatic failover
- Rate limiting
- Request caching

## Related

- [RPC Proxy Server](/api/rpc-proxy)
- [Blockchain API](/api/blockchain-api)
