# Cinacoin Minimal Template

Bare minimum setup to connect a wallet with Cinacoin.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## What's Included

- `package.json` — Complete dependencies (@cinacoin/core-sdk, @cinacoin/react, @cinacoin/ui, React 18)
- `src/App.tsx` — Minimal wallet connection demo with ConnectButton
- `src/main.tsx` — Entry point with CinacoinProvider
- `index.html` — Vite HTML template
- `vite.config.ts` — Vite configuration
- `tsconfig.json` — TypeScript configuration

## Features

- Single `CinacoinProvider` wrapping the app
- `ConnectButton` component for wallet connection
- `useAccount` hook to read connection state
- Ethereum mainnet pre-configured

## Build

```bash
pnpm build
pnpm preview
```

## Deploy

```bash
npx @cinacoin/cli deploy
```

That's it — no boilerplate, no extras.
