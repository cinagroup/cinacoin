# RPC Proxy

Unified RPC endpoint with automatic routing.

## Overview

Single endpoint for all chains with rate limiting, failover, and intelligent routing. The Cinacoin RPC Proxy is a lightweight HTTP proxy that forwards JSON-RPC requests to the appropriate chain backend, with built-in response caching for read-only methods, IP-based rate limiting, origin-based access control, and graceful shutdown handling.

**Key capabilities:**

- Multi-chain routing — configure once, access all chains
- Response caching for read-only RPC methods (with configurable TTL)
- IP-based rate limiting (requests per minute)
- Origin-based CORS/access control
- Maximum request body size enforcement
- Graceful shutdown with in-flight request draining

## Quick Start

### Direct Endpoint Usage

```
https://rpc.cinacoin.com/v1/{project-id}
```

No SDK needed — just send standard JSON-RPC requests:

```bash
curl -X POST https://rpc.cinacoin.com/v1/your-project-id \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Self-Hosted Proxy Server

```bash
cd packages/rpc-proxy
npm install
```

```typescript
import { RpcProxy } from '@cinacoin/rpc-proxy'

const proxy = new RpcProxy({
  port: 8545,
  host: '0.0.0.0',
  chains: {
    mainnet: 'https://eth-mainnet.infura.io/v3/YOUR_KEY',
    polygon: 'https://polygon-rpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
  },
  defaultChain: 'mainnet',
  cacheTtlMs: 5_000,          // 5 second cache for read-only methods
  rateLimitPerMinute: 100,     // 100 req/min per IP
  maxBodySize: 1_048_576,      // 1 MB max request body
  allowedOrigins: ['https://myapp.com'],
})

await proxy.start()
console.log('RPC proxy running on http://localhost:8545')
```

### Client-Side Usage

```typescript
import { createRpcProxy } from '@cinacoin/rpc'

const rpc = createRpcProxy({
  projectId: 'your-project-id',
})

// Send any JSON-RPC method
const blockNumber = await rpc.request('eth_blockNumber')
const balance = await rpc.request('eth_getBalance', [
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  'latest',
])

// Chain-specific request
const result = await rpc.request('eth_call', callParams, { chain: 'polygon' })
```

## API Reference

### RpcProxyConfig

| Property | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | — | Server port |
| `host` | `string` | `'0.0.0.0'` | Bind address |
| `chains` | `Record<string, string>` | — | Map of chain name → RPC URL |
| `defaultChain` | `string` | First chain in config | Default chain for unrouted requests |
| `cacheTtlMs` | `number` | `0` (disabled) | Cache TTL for read-only methods (ms) |
| `rateLimitPerMinute` | `number` | `100` | Max requests per IP per minute (0 = disabled) |
| `maxBodySize` | `number` | `1048576` | Max request body size in bytes (1 MB) |
| `allowedOrigins` | `string[] \| RegExp` | — | Allowed request origins (empty = all) |

### RpcProxy Methods

| Method | Description |
|---|---|
| `start()` | Start the HTTP proxy server |
| `stop()` | Stop the proxy server |
| `forwardRpc(chain, body)` | Forward a JSON-RPC request to a specific chain |
| `getChains()` | Get all configured chains |
| `gracefulShutdown()` | Graceful shutdown — drain in-flight requests, then exit |

### Client API (`@cinacoin/rpc`)

| Method | Description |
|---|---|
| `request(method, params?, options?)` | Send a JSON-RPC request |
| `setChain(chain)` | Switch the default chain |
| `getChain()` | Get the current default chain |

## Supported Methods

### Read-Only Methods (Cached)

The following methods are eligible for response caching when `cacheTtlMs` is configured:

- `eth_blockNumber`
- `eth_getBalance`
- `eth_getTransactionCount`
- `eth_getBlockByNumber`
- `eth_getBlockByHash`
- `eth_call`
- `eth_getCode`
- `eth_getLogs`
- `eth_getStorageAt`
- `eth_estimateGas`
- `net_version`
- `eth_chainId`

### Write Methods (Not Cached)

- `eth_sendRawTransaction`
- `eth_sendTransaction`
- All other methods

## Caching Behavior

```
Request arrives → Is method read-only? → Check cache key (chain + request body)
                                                    ↓
                                         Cache hit & not expired?
                                                    ↓
                                          Yes → Return cached response
                                          No → Forward to chain RPC
                                                    ↓
                                         Store in cache (if TTL > 0)
                                                    ↓
                                          Return response
```

Cache keys are computed as `chain:JSON.stringify(body)` to ensure identical requests return identical cached responses.

## Rate Limiting

Rate limiting is per-IP using a sliding window:

```
┌───────────────────────────────────┐
│  IP: 192.168.1.1                  │
│  Window: 60 seconds               │
│  Max requests: 100                │
│  Count: 45/100                    │
│  Reset at: 2025-01-01T12:01:00Z  │
└───────────────────────────────────┘
```

When a request exceeds the rate limit, a `429 Too Many Requests` response is returned.

## Advanced Usage

### Multi-Chain with Fallback

```typescript
const proxy = new RpcProxy({
  port: 8545,
  chains: {
    // Primary providers
    mainnet: 'https://eth-mainnet.infura.io/v3/KEY1',
    polygon: 'https://polygon-rpc.com',
    // Fallback providers (configured in your load balancer or via chain aliases)
    'mainnet-fallback': 'https://eth-mainnet.alchemyapi.io/v2/KEY2',
    'polygon-fallback': 'https://rpc.ankr.com/polygon',
  },
})
```

### Graceful Shutdown

```typescript
import { RpcProxy } from '@cinacoin/rpc-proxy'

const proxy = new RpcProxy({ port: 8545, chains: { mainnet: '...' } })

// Handle SIGTERM/SIGINT for graceful shutdown
process.on('SIGTERM', () => proxy.gracefulShutdown())
process.on('SIGINT', () => proxy.gracefulShutdown())

await proxy.start()
```

The graceful shutdown process:
1. Logs "Shutting down..."
2. Stops accepting new connections
3. Waits for in-flight requests (up to 10s timeout)
4. Closes the server
5. Exits with code 0

### Origin-Based Access Control

```typescript
// Allow specific domains
const proxy = new RpcProxy({
  port: 8545,
  chains: { mainnet: '...' },
  allowedOrigins: [
    'https://myapp.com',
    'https://app.myapp.com',
    'https://*.myapp.com',  // Wildcard subdomains
  ],
})

// Allow all origins (development)
const devProxy = new RpcProxy({
  port: 8545,
  chains: { mainnet: '...' },
  allowedOrigins: [],  // Empty = all allowed
})

// Regex pattern
const regexProxy = new RpcProxy({
  port: 8545,
  chains: { mainnet: '...' },
  allowedOrigins: /^https:\/\/.*\.myapp\.com$/,
})
```

### Cache Configuration

```typescript
// Enable caching with 30-second TTL
const cachedProxy = new RpcProxy({
  port: 8545,
  chains: { mainnet: '...' },
  cacheTtlMs: 30_000,  // 30 seconds
})

// Disable caching (default)
const noCacheProxy = new RpcProxy({
  port: 8545,
  chains: { mainnet: '...' },
  cacheTtlMs: 0,
})
```

## Related

- [RPC Proxy Server](/api/rpc-proxy) — Self-hosted RPC proxy details
- [Blockchain API](/api/blockchain-api) — Blockchain data API
- [Core SDK](/api/core-sdk) — Foundation SDK
