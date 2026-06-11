# React.

> `@cinacoin/react` — React hooks, provider, and UI components for CinaCoin.

::: info Note
This page is also available at [API → React](/api/react).
:::

## Installation.

```bash
npm install @cinacoin/react @cinacoin/core-sdk
```

## CinaCoinProvider.

Wrap your app with `CinaCoinProvider` to give all child components access to the CinaCoin context.

```tsx
import { CinaCoinProvider } from '@cinacoin/react'
import { EvmAdapter } from '@cinacoin/core-sdk'

function App() {
  return (
    <CinaCoinProvider
      adapter={new EvmAdapter({
        projectId: 'your-project-id',
        relayUrl: 'wss://relay.cinacoin.com/v1',
      })}
    >
      {children}
    </CinaCoinProvider>
  )
}
```

## useCinaCoin.

Access the CinaCoin context in any child component:

```tsx
import { useCinaCoin } from '@cinacoin/react'

function MyComponent() {
  const { connection, connect, disconnect } = useCinaCoin()

  const handleConnect = async () => {
    const conn = await connect()
    console.log('Connected:', conn.address)
  }

  return (
    <button onClick={handleConnect}>
      {connection ? 'Connected' : 'Connect Wallet'}
    </button>
  )
}
```

## Connect button.

Use the pre-built `ConnectButton` component for a quick integration:

```tsx
import { ConnectButton } from '@cinacoin/react'

function App() {
  return <ConnectButton />
}
```

## Other framework adapters.

CinaCoin also provides adapters for other frameworks:

- [Vue](/api/vue)
- [Svelte](/api/svelte)
- [Next.js](/api/next)
- [Nuxt](/api/nuxt)
- [Angular](/api/angular)
- [React Native](/api/react-native)
