# AppKit.

Universal wallet connection kit. 300+ wallets, 50+ chains.

## Overview.

CinaCoin AppKit provides a seamless wallet connection experience across EVM, Solana, Bitcoin, Cosmos, and more. It's the UI layer that powers CinaCoin's ConnectButton, ConnectModal, and ChainSwitcher components, backed by the Core SDK's multi-chain adapter system.

**Key capabilities:**

- Drop-in React components for wallet connection
- Unified hooks for account, balance, transactions, ENS
- EIP-5792 atomic batch transaction support
- Theme customization and dark mode
- Built-in error boundaries

## Installation.

```bash
npm install @cinacoin/appkit @cinacoin/react
```

## Quick start.

### React provider setup.

```tsx
import { CinaCoinProvider } from '@cinacoin/react'
import { mainnet, polygon, arbitrum } from '@cinacoin/core-sdk'

function App() {
  return (
    <CinaCoinProvider
      projectId="your-project-id"
      networks={[mainnet, polygon, arbitrum]}
      theme="dark"
    >
      <YourApp />
    </CinaCoinProvider>
  )
}
```

### Connect button.

```tsx
import { ConnectButton } from '@cinacoin/react'

function Header() {
  return (
    <header>
      <ConnectButton
        label="Connect Wallet"
        showBalance={true}
        showNetwork={true}
      />
    </header>
  )
}
```

### Using hooks.

```tsx
import { useAccount, useBalance, useSendTransaction } from '@cinacoin/react'

function Dashboard() {
  const { address, chainId } = useAccount()
  const { balance, isLoading } = useBalance()
  const { sendTransaction, isPending, txHash } = useSendTransaction()

  if (!address) return <p>Connect a wallet</p>

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {isLoading ? 'Loading...' : balance} ETH</p>
    </div>
  )
}
```

## Components.

| Component | Description |
|---|---|
| `CinaCoinProvider` | React context provider — wraps your app, manages wallet state |
| `ConnectButton` | Smart button that shows connect/disconnect/account states |
| `ConnectModal` | Full wallet selection modal with 300+ wallets |
| `ChainSwitcher` | Network switching dropdown |
| `ErrorBoundary` | Catches and displays SDK errors gracefully |

### CinaCoinProvider props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `projectId` | `string` | — | Your CinaCoin project ID |
| `networks` | `Chain[]` | `[mainnet]` | Supported chains |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Theme mode |
| `metadata` | `AppMetadata` | — | App metadata (name, description, icons) |
| `relayUrl` | `string` | `wss://relay.cinacoin.com/v1` | Custom relay URL |
| `enableEmbeddedWallet` | `boolean` | `false` | Enable email/social wallet creation |
| `enableSocialLogin` | `boolean` | `false` | Enable Google/Apple/X login |

### ConnectButton props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `'Connect Wallet'` | Button text when disconnected |
| `showBalance` | `boolean` | `false` | Show balance in button |
| `showNetwork` | `boolean` | `false` | Show current network name |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Visual variant |

### ChainSwitcher props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `chains` | `Chain[]` | — | Networks to display |
| `showIcon` | `boolean` | `true` | Show chain icons |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Dropdown direction |

## React hooks.

### Core hooks.

| Hook | Returns | Description |
|---|---|---|
| `useCinaCoin()` | `CinaCoinContextValue` | Full context: connect, disconnect, account, status |
| `useAccount()` | `{ address, balance, chainSymbol, chainId }` | Current account info |
| `useChainId()` | `number \| null` | Active chain ID |
| `useConnect()` | `{ connect, status, isSwitchingChain }` | Wallet connection |
| `useDisconnect()` | `{ disconnect }` | Disconnect from wallet |
| `useSwitchChain()` | `{ switchChain, isSwitching, error }` | Chain switching with error handling |

### Transaction hooks.

| Hook | Returns | Description |
|---|---|---|
| `useBalance(address?, chainId?)` | `{ balance, isLoading, error, refetch }` | Native token balance |
| `useSendTransaction()` | `{ sendTransaction, isPending, error, txHash }` | Send a transaction |
| `useSignMessage()` | `{ signMessage, isPending, error, signature }` | Sign a message |

### ENS hooks.

| Hook | Returns | Description |
|---|---|---|
| `useEnsName(address)` | `{ ensName, isLoading, error, refetch }` | Resolve address → ENS name |
| `useEnsAddress(name)` | `{ address, isLoading, error, refetch }` | Resolve ENS name → address |

### EIP-5792 hooks.

| Hook | Returns | Description |
|---|---|---|
| `useWalletCapabilities()` | Wallet capabilities for current chain | Query `wallet_getCapabilities` |
| `useSendCalls()` | `{ sendCalls, isPending, error, callsId }` | Send atomic batch of calls |
| `useAtomicBatch()` | `{ executeBatch, isPending, error }` | Execute atomic batch transactions |
| `useCallsStatus()` | `{ status, receipt, isLoading }` | Poll batch execution status |

## Advanced usage.

### Custom theme.

```tsx
<CinaCoinProvider
  projectId="your-project-id"
  theme={{
    '--w3m-accent': '#6366f1',
    '--w3m-color-mix': '#6366f1',
    '--w3m-border-radius-master': '12px',
  }}
>
```

### Conditional wallet display.

```tsx
import { ConnectModal } from '@cinacoin/react'

function CustomConnect() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Wallet List</button>
      <ConnectModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        includeWalletIds={['metamask', 'rainbow', 'coinbase']}
      />
    </>
  )
}
```

### Batch transactions (EIP-5792).

```tsx
import { useAtomicBatch } from '@cinacoin/react'

function BatchSwap() {
  const { executeBatch, isPending, error } = useAtomicBatch()

  const handleSwap = async () => {
    await executeBatch([
      { to: tokenA, data: approveCalldata },
      { to: router, data: swapCalldata },
    ])
  }

  return (
    <button onClick={handleSwap} disabled={isPending}>
      {isPending ? 'Swapping...' : 'Swap'}
    </button>
  )
}
```

## Related.

- [Core SDK](/api/core-sdk) — Foundation SDK
- [React SDK](/api/react) — React adapter details
- [Quick Start](/guide/quick-start)
- [Custom Connectors](/api/custom-connectors)
