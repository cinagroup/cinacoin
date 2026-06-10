# Cinacoin Wallet Template

Full-featured wallet UI with balance display, address management, and multi-chain support.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## What's Included

- `package.json` — Complete dependencies (@cinacoin/core-sdk, @cinacoin/react, @cinacoin/ui, React 18)
- `src/App.tsx` — Full wallet UI with balance, address copy, chain info
- `src/main.tsx` — Entry point with CinacoinProvider (multi-chain config)
- `index.html` — Vite HTML template
- `vite.config.ts` — Vite configuration
- `tsconfig.json` — TypeScript configuration

## Features

- Wallet connection via ConnectButton
- Multi-chain support (Ethereum, Polygon, Arbitrum)
- Balance display with native currency symbol
- Address copy to clipboard
- Chain ID display
- Disconnect functionality
- Dark theme with accent color

## Build

```bash
pnpm build
pnpm preview
```

## Deploy

```bash
npx @cinacoin/cli deploy
```

## Customization

Edit `src/main.tsx` to add more chains or customize the theme:

```typescript
chains: [
  { id: 1, name: 'Ethereum', ... },
  { id: 137, name: 'Polygon', ... },
  // Add more chains here
],
theme: {\n  mode: 'dark',
  accentColor: '#6366f1', // Change accent color
},
```
