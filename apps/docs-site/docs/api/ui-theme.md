# UI theme.

> `@cinacoin/ui-theme` — Theme system for CinaCoin UI components.

## Installation.

```bash
npm install @cinacoin/ui-theme
```

## Usage.

```typescript
import { createTheme } from '@cinacoin/ui-theme'

const theme = createTheme({
  colors: {
    primary: '#3B82F6',
    background: '#1a1a2e',
  },
  borderRadius: '12px',
  fontFamily: 'Inter, sans-serif',
})
```

## Related.

- [Core UI](/api/core-ui)
- [Design Tokens](/api/design-tokens)
- [CinaCoin UI Theme](/api/cinacoin-ui-theme)
