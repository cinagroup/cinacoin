# @cinacoin/appkit-vue

Vue 3 adapter for [Cinacoin AppKit](../appkit/).

Provides a composable, provider component, and ready-to-use components for integrating Cinacoin wallet connection into Vue 3 applications.

## Installation

```bash
npm install @cinacoin/appkit-vue @cinacoin/appkit
```

## Quick Start

```vue
<script setup>
import { CinacoinProvider, ConnectButton } from '@cinacoin/appkit-vue';

const config = {
  projectId: 'your-walletconnect-project-id',
  chains: [
    { id: 1, name: 'Ethereum', ticker: 'ETH', rpcUrl: 'https://eth.llamarpc.com' },
  ],
  metadata: {
    name: 'My DApp',
    description: 'A decentralized application',
    url: 'https://myapp.com',
    icons: ['https://myapp.com/icon.png'],
  },
};
</script>

<template>
  <CinacoinProvider :config="config">
    <ConnectButton />
  </CinacoinProvider>
</template>
```

## API

### `<CinacoinProvider>`

Top-level provider component. Wraps your app and provides the AppKit instance to descendants.

| Prop     | Type                    | Description                          |
| -------- | ----------------------- | ------------------------------------ |
| `config` | `CinacoinAppKitConfig`  | AppKit configuration (required)      |

### `useCinacoinAppKit()`

Composable to access the AppKit instance and reactive connection state.

```vue
<script setup>
import { useCinacoinAppKit } from '@cinacoin/appkit-vue';

const { open, close, status, account } = useCinacoinAppKit();
</script>

<template>
  <button @click="open">
    {{ status === 'connected' ? account?.address : 'Connect' }}
  </button>
</template>
```

**Return value:**
- `appkit` — The AppKit instance
- `state` — Reactive `ConnectionState` ref
- `isOpen` — Whether the modal is open
- `status` — Current connection status (`'disconnected' | 'connecting' | 'connected' | 'error'`)
- `account` — Connected account (null if disconnected)
- `open()` — Open the modal
- `close()` — Close the modal
- `connect(walletId)` — Connect to a specific wallet
- `disconnect()` — Disconnect the current wallet
- `switchChain(chainId)` — Switch to a different chain

### `<ConnectButton>`

Ready-to-use button component.

| Prop        | Type     | Default            | Description                          |
| ----------- | -------- | ------------------ | ------------------------------------ |
| `label`     | `string` | `"Connect Wallet"` | Label when disconnected              |
| `className` | `string` | `""`               | Custom CSS class                     |

**Slots:**
- `#connected="{ address, chainId }"` — Custom rendering for connected state
- `#disconnected` — Custom rendering for disconnected state

```vue
<ConnectButton>
  <template #connected="{ address }">
    🟢 {{ shortenAddress(address) }}
  </template>
  <template #disconnected>
    🔌 Sign In
  </template>
</ConnectButton>
```

## License

MIT
