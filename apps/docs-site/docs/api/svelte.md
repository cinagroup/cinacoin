# Svelte.

> `@cinacoin/svelte` — Svelte adapter for CinaCoin.

## Installation.

```bash
npm install @cinacoin/svelte @cinacoin/core-sdk
```

## Usage.

```svelte
<script>
import { useCinaCoin } from '@cinacoin/svelte'

const { connect, account } = useCinaCoin()
</script>

<button on:click={connect}>Connect</button>
<p>Account: {$account}</p>
```

## Related.

- [React](/api/react) — React adapter
- [Vue](/api/vue) — Vue adapter
