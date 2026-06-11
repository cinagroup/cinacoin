# Next.js.

> `@cinacoin/next` — Next.js adapter for CinaCoin with App Router support.

## Installation.

```bash
npm install @cinacoin/next @cinacoin/core-sdk
```

## Usage.

```tsx
// app/providers.tsx
'use client'
import { CinaCoinProvider } from '@cinacoin/next'

export function Providers({ children }) {
  return <CinaCoinProvider>{children}</CinaCoinProvider>
}
```

## Features.

- App Router support
- Server component compatible
- SSR-safe initialization

## Related.

- [React](/api/react) — React adapter
- [Nuxt](/api/nuxt) — Nuxt adapter
