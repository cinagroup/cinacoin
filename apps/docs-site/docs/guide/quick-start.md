# Quick start.

> Get started with CinaCoin in 5 minutes.

## Prerequisites.

- Node.js 18+
- A project ID (self-hosted Relay Server)

## Installation.

```bash
npm install @cinacoin/core-sdk @cinacoin/react
```

## Basic setup.

```tsx
import { CinaCoinProvider, ConnectButton } from '@cinacoin/react'
import { EvmAdapter } from '@cinacoin/core-sdk'

function App() {
  return (
    <CinaCoinProvider
      adapter={new EvmAdapter({
        projectId: 'your-project-id',
        relayUrl: 'wss://relay.cinacoin.com/v1',
      })}
    >
      <ConnectButton />
    </CinaCoinProvider>
  )
}
```

## Next steps.

- [Installation Guide](/guide/installation) — Detailed installation for all frameworks
- [Configuration](/guide/configuration) — Full configuration options
- [Core SDK API](/api/core-sdk) — Core SDK reference
- [React API](/api/react) — React adapter reference
