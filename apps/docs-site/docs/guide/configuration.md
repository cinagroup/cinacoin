# Configuration.

> Full configuration options for CinaCoin.

## Core configuration.

```typescript
import { CinaCoin } from '@cinacoin/core-sdk'

const cinacoin = new CinaCoin({
  // Required
  projectId: 'your-project-id',
  relayUrl: 'wss://relay.cinacoin.com/v1',
  chains: [mainnet, polygon],

  // Optional
  metadata: {
    name: 'My dApp',
    description: 'My awesome dApp',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/logo.png'],
  },
  theme: 'dark',
  locale: 'en',
})
```

## Relay server configuration.

```yaml
# docker-compose.yml.
services:
  relay-server:
    image: cinacoin/relay-server:latest
    environment:
      - NATS_URL=nats://nats:4222
      - REDIS_URL=redis://redis:6379
      - PORT=443
    ports:
      - "443:443"
```

## RPC proxy configuration.

```yaml
services:
  rpc-proxy:
    image: cinacoin/rpc-proxy:latest
    environment:
      - PROVIDERS=alchemy,infura,quicknode
      - CACHE_TTL=60
      - RATE_LIMIT=1000
```

## Next steps.

- [Quick Start](/guide/quick-start)
- [Migration Guide](/guide/migrate-from-reown)
