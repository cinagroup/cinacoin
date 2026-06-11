# Vue.

> `@cinacoin/vue` — Vue 3 composition API adapter for CinaCoin.

## Installation.

```bash
npm install @cinacoin/vue @cinacoin/core-sdk
```

## Usage.

```vue
<script setup>
import { useCinaCoin } from '@cinacoin/vue'

const { connect, disconnect, account } = useCinaCoin()
</script>

<template>
  <button @click="connect">Connect</button>
  <p>Account: {{ account }}</p>
</template>
```

## Composables.

- `useCinaCoin()` — Core SDK instance
- `useAccount()` — Current account
- `useConnect()` — Connect helper
- `useDisconnect()` — Disconnect helper
- `useSwitchChain()` — Chain switching

## Related.

- [React](/api/react) — React adapter
- [Svelte](/api/svelte) — Svelte adapter
