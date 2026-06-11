# Relay.

Cross-chain message relay infrastructure.

## Overview.

The CinaCoin Relay is a self-hosted WebSocket message relay that enables real-time communication between wallets and dApps. It replaces centralized relay infrastructure with a fully controllable, open-source alternative. The relay supports topic-based subscriptions, message encryption, heartbeats, and automatic reconnection.

**Key capabilities:**

- Topic-based message routing over WebSocket
- ChaCha20-Poly1305 AEAD encryption for message payloads
- Automatic reconnection with exponential backoff
- Heartbeat/keepalive mechanism
- Message validation and sanitization
- Rate limiting per IP
- Origin-based access control
- SSL/TLS support

## Installation.

### Client SDK (already included in Core SDK).

```bash
npm install @cinacoin/core-sdk
```

### Self-hosted relay server.

```bash
# The relay server is bundled with the CinaCoin infrastructure packages.
cd packages/relay-server
npm install
```

## Quick start.

### Client: RelayTransport.

```typescript
import { RelayTransport } from '@cinacoin/core-sdk'

const transport = new RelayTransport({
  url: 'wss://relay.cinacoin.com/v1',
  connectionTimeout: 10_000,
  heartbeatInterval: 30_000,
  maxReconnectAttempts: 5,
})

// Connect
await transport.connect()

// Subscribe to a topic
transport.subscribe('topic-id', (message) => {
  console.log('Received:', message)
})

// Send a message
await transport.publish('topic-id', JSON.stringify({ action: 'connect' }))

// Disconnect
transport.disconnect()
```

### Server: RelayServer.

```typescript
import { RelayServer } from '@cinacoin/relay-server'

const server = new RelayServer({
  port: 5000,
  host: '0.0.0.0',
  maxConnections: 1000,
  rateLimitPerMinute: 60,
  allowedOrigins: ['https://myapp.com', 'https://*.myapp.com'],
  maxMessageSize: 1_048_576, // 1 MB
  idleTimeoutMs: 300_000,    // 5 minutes
})

await server.start()
console.log('Relay server running on ws://localhost:5000')
```

## API reference.

### RelayTransport (client).

| Method | Description |
|---|---|
| `connect()` | Establish WebSocket connection to relay server |
| `disconnect()` | Close the WebSocket connection |
| `subscribe(topic, callback)` | Subscribe to a topic and receive messages |
| `unsubscribe(topic)` | Remove a topic subscription |
| `publish(topic, payload)` | Send an encrypted message to a topic |
| `isConnected()` | Check if currently connected |

### RelayTransportConfig.

| Property | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | — | WebSocket endpoint (wss://) |
| `connectionTimeout` | `number` | `10000` | Connection timeout (ms) |
| `heartbeatInterval` | `number` | `30000` | Heartbeat interval (ms) |
| `maxReconnectAttempts` | `number` | `5` | Max reconnection attempts |

### RelayServer (server).

| Method | Description |
|---|---|
| `start()` | Start the relay WebSocket server |
| `stop()` | Stop the server gracefully |
| `getStats()` | Get current connection and message stats |
| `getActiveTopics()` | List all active subscription topics |

### RelayServerConfig.

| Property | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | — | Server port |
| `host` | `string` | `'0.0.0.0'` | Bind address |
| `ssl` | `{ key, cert }` | — | SSL/TLS configuration |
| `maxConnections` | `number` | — | Max concurrent connections |
| `rateLimitPerMinute` | `number` | — | Max messages per IP per minute (0 = disabled) |
| `allowedOrigins` | `string[] \| RegExp` | — | Allowed WebSocket origins |
| `maxMessageSize` | `number` | `1048576` | Max message size in bytes (1 MB) |
| `idleTimeoutMs` | `number` | `300000` | Idle connection timeout (5 min, 0 = disabled) |

### RelayMessage.

| Field | Type | Description |
|---|---|---|
| `type` | `'message' \| 'ping' \| 'pong' \| 'close'` | Message type discriminator |
| `topic` | `string` | Subscription topic (sanitized, max 128 chars) |
| `data` | `string` | Message payload (encrypted or plaintext) |
| `timestamp` | `number` | Message timestamp (Unix ms) |

### RelayStats.

| Field | Type | Description |
|---|---|---|
| `activeConnections` | `number` | Current WebSocket connections |
| `activeTopics` | `number` | Number of unique topics |
| `messagesSent` | `number` | Total messages sent since start |
| `messagesReceived` | `number` | Total messages received since start |
| `uptimeMs` | `number` | Server uptime in milliseconds |

## Advanced usage.

### Encryption with relay messages.

```typescript
import { RelayTransport } from '@cinacoin/core-sdk'
import { sharedSecret, encrypt, decrypt, generateKeypair } from '@cinacoin/core-sdk'

// Generate keypair for E2E encryption
const keypair = generateKeypair()

// Compute shared secret with peer
const secret = sharedSecret(keypair.privateKey, peerPublicKey)

// Encrypt message
const encrypted = encrypt(secret, new TextEncoder().encode('hello'))

// Send over relay
transport.publish('topic-id', encrypted)
```

### Self-hosted relay with SSL.

```typescript
import { RelayServer } from '@cinacoin/relay-server'
import { readFileSync } from 'fs'

const server = new RelayServer({
  port: 443,
  host: '0.0.0.0',
  ssl: {
    key: readFileSync('/etc/ssl/private/relay.key', 'utf-8'),
    cert: readFileSync('/etc/ssl/certs/relay.crt', 'utf-8'),
  },
  maxConnections: 5000,
  rateLimitPerMinute: 120,
  allowedOrigins: [/^https:\/\/.*\.myapp\.com$/],
})

await server.start()
console.log('Secure relay running on wss://relay.myapp.com')
```

### Custom message validation.

The relay server validates all incoming messages:
- Must be a JSON object with `type`, `topic`, and `data` fields
- `type` must be one of: `message`, `ping`, `pong`, `close`
- `topic` is sanitized (alphanumeric + hyphens only, max 128 chars)
- `data` must be a string
- Invalid messages are rejected with an error response

### Heartbeat protocol.

```typescript
// Client sends ping
transport.subscribe('heartbeat', (msg) => {
  if (msg.type === 'pong') {
    console.log('Connection alive')
  }
})

// Server automatically responds to pings with pongs
// Idle connections are closed after idleTimeoutMs
```

## Architecture.

```
┌──────────────┐       WebSocket       ┌──────────────┐
│   dApp        │ ◄──────────────────► │  RelayServer  │
│  (browser)    │   wss://relay...     │  (Node.js)    │
└──────────────┘                       └──────────────┘
       │                                      │
       │   Topic: wc_1234...                  │   Topic: wc_1234..
       │   (encrypted payload)                │   (routes to subscriber)
       │                                      │
       ▼                                      ▼
┌──────────────┐                       ┌──────────────┐
│  Wallet       │ ◄──────────────────► │  RelayServer  │
│  (mobile)     │   wss://relay...     │  (Node.js)    │
└──────────────┘                       └──────────────┘
```

Messages are routed by topic. Each topic represents a communication channel between a dApp and a wallet. Messages are encrypted end-to-end using X25519 + ChaCha20-Poly1305.

## Related.

- [Cross-Chain Sync](/api/cross-chain-sync) — Cross-chain state synchronization
- [Bundler](/api/bundler) — Transaction bundling
- [Core SDK](/api/core-sdk) — Foundation SDK with RelayTransport
- [Relay Server](/api/relay-server) — Self-hosted relay server details
