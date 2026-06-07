# React

> `@cinacoin/react` — React hooks, provider, and UI components for Cinacoin.

::: info Note
This page is also available at [API → React](/api/react).
:::

## Installation

```bash
npm install @cinacoin/react @cinacoin/core-sdk
```

## CinacoinProvider

Wrap your app with `CinacoinProvider` to give all child components access to the Cinacoin context.

```tsx
import { CinacoinProvider } from '@cinacoin/react'
import { EvmAdapter } from '@cinacoin/core-sdk'

function App() {
  return (
    <CinacoinProvider
      adapter={new EvmAdapter({
        projectId: 'your-project-id',
        relayUrl: 'wss://relay.cinacoin.com/v1',
      })}
    >
      {children}
    </CinacoinProvider>
  )
}
```

## useCinacoin

Access the Cinacoin context in any child component:

```tsx
import { useCinacoin } from '@cinacoin/react'

function MyComponent() {
  const { connection, connect, disconnect } = useCinacoin()

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

## Connect Button

Use the pre-built `ConnectButton` component for a quick integration:

```tsx
import { ConnectButton } from '@cinacoin/react'

function App() {
  return <ConnectButton />
}
```

## Other Framework Adapters

Cinacoin also provides adapters for other frameworks:

- [Vue](/api/vue)
- [Svelte](/api/svelte)
- [Next.js](/api/next)
- [Nuxt](/api/nuxt)
- [Angular](/api/angular)
- [React Native](/api/react-native)
