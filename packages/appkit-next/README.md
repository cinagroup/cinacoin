# @cinacoin/appkit-next

Next.js App Router adapter for [Cinacoin AppKit](../appkit/).

Handles the SSR/CSR boundary automatically — all interactive components are marked `'use client'` and dynamic-import helpers are provided for embedding in Server Components.

## Installation

```bash
npm install @cinacoin/appkit-next @cinacoin/appkit
```

## Quick Start (Client Component)

```tsx
// app/providers.tsx
'use client';

import { CinacoinProvider } from '@cinacoin/appkit-next';

export function Providers({ children, config }) {
  return <CinacoinProvider config={config}>{children}</CinacoinProvider>;
}
```

```tsx
// app/page.tsx
import { Providers } from './providers';
import { ConnectButton } from '@cinacoin/appkit-next';

export default function Page() {
  return (
    <Providers config={config}>
      <ConnectButton />
    </Providers>
  );
}
```

## Quick Start (Server Component — dynamic import)

```tsx
// app/layout.tsx
import { DynamicCinacoinProvider } from '@cinacoin/appkit-next/dynamic';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DynamicCinacoinProvider config={config}>
          {children}
        </DynamicCinacoinProvider>
      </body>
    </html>
  );
}
```

## Exports

| Export                       | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| `CinacoinProvider`           | Client-side context provider                      |
| `ConnectButton`              | Ready-to-use connect button                       |
| `CinacoinModal`              | Imperative modal controller                       |
| `useCinacoinAppKit()`        | Access AppKit instance from any client component  |
| `useCinacoinModal()`         | Imperative open/close hooks                       |
| `DynamicCinacoinProvider`    | SSR-safe dynamic-imported provider                |
| `DynamicConnectButton`       | SSR-safe dynamic-imported button                  |

## License

MIT
