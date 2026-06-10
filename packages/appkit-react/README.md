# @cinacoin/appkit-react

React adapter for [Cinacoin AppKit](../appkit/) — drop-in wallet connection UI for React 18+ applications.

## Installation

```bash
npm install @cinacoin/appkit-react @cinacoin/appkit
```

## Quick Start

```tsx
import { CinacoinProvider, ConnectButton } from '@cinacoin/appkit-react';

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

function App() {
  return (
    <CinacoinProvider config={config}>
      <ConnectButton />
    </CinacoinProvider>
  );
}
```

## API

### `<CinacoinProvider>`

Top-level context provider. Mounts the AppKit modal into the React tree.

| Prop     | Type                    | Description                          |
| -------- | ----------------------- | ------------------------------------ |
| `config` | `CinacoinAppKitConfig`  | AppKit configuration (required)      |
| `children` | `ReactNode`           | Child components                     |

### `useCinacoinAppKit()`

Hook to access the underlying `CinacoinAppKitInstance`.

```tsx
const appkit = useCinacoinAppKit();
appkit.open();
appkit.subscribe((state) => console.log(state));
```

### `<ConnectButton>`

Ready-to-use button that shows "Connect Wallet" or the connected address.

| Prop               | Type                              | Default            |
| ------------------ | --------------------------------- | ------------------ |
| `label`            | `string`                          | `"Connect Wallet"` |
| `className`        | `string`                          | —                  |
| `style`            | `CSSProperties`                   | —                  |
| `renderConnected`  | `(account) => ReactNode`          | Address shorthand  |
| `renderDisconnected` | `() => ReactNode`               | Label text         |
| `onClick`          | `() => void`                      | —                  |

### `<CinacoinModal>` / `useCinacoinModal()`

Imperative modal control via ref or hook.

```tsx
const { open, close } = useCinacoinModal();
```

## License

MIT
