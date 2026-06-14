# @cinacoin/walletconnect-v2

Cinacoin v2 adapter for Cinacoin.

## Installation

```bash
npm install @cinacoin/walletconnect-v2
```

## Usage

```ts
import { WalletConnectAdapter } from '@cinacoin/walletconnect-v2';

const adapter = new CinacoinAdapter({
  projectId: 'YOUR_PROJECT_ID',
});
```

## API Reference

| Export | Type | Description |
|--------|------|-------------|
| `CinacoinAdapter` | class | WC v2 adapter |
| `CinacoinConnector` | class | WC connector class |
| `createWCSession` | function | Create WC session |
| `WCConfig` | type | Configuration type |
| `WCSessionData` | type | Session data type |
