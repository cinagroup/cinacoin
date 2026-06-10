# Cinacoin Farcaster Mini App

A complete Farcaster Frame v2 application built with Next.js and deployed to Cloudflare Pages.

## Features

- 🔗 **Wallet Connection** — Connect wallet via Farcaster Mini App SDK
- 💸 **Token Transfer** — Send CINA tokens to any Ethereum address
- ✍️ **Message Signing** — Sign messages with your connected wallet
- 👤 **Profile** — View Farcaster identity and wallet connections

## Architecture

```
apps/farcaster-app/
├── src/
│   ├── app/                    # Next.js App Router (static export)
│   │   ├── page.tsx           # Home page with Frame metadata
│   │   ├── layout.tsx         # Root layout
│   │   └── frame/
│   │       ├── wallet/        # Wallet Frame page
│   │       ├── transfer/      # Transfer Frame page
│   │       ├── sign/          # Sign Frame page
│   │       └── profile/       # Profile Frame page
│   ├── components/            # React components
│   │   ├── FrameRenderer.tsx  # Frame preview renderer
│   │   ├── FarcasterConnect.tsx # SIWF button
│   │   ├── ProfileCard.tsx    # User profile card
│   │   └── ActionButtons.tsx  # Frame action buttons
│   └── lib/
│       └── frame-utils.ts     # Frame v2 protocol utilities
├── functions/                 # Cloudflare Pages Functions (dynamic POST)
│   └── frame/
│       ├── [[path]].ts        # Root frame handler
│       ├── wallet/[[path]].ts
│       ├── transfer/[[path]].ts
│       ├── sign/[[path]].ts
│       └── profile/[[path]].ts
├── next.config.js             # Static export config
├── wrangler.toml              # Cloudflare Pages config
└── package.json
```

## Frame Protocol

This app implements [Farcaster Frame v2](https://docs.farcaster.xyz/reference/frames/spec):

- **Static pages** serve initial Frame metadata (og:image, fc:frame tags)
- **Cloudflare Pages Functions** handle POST requests for button interactions
- Supports 1-4 buttons per frame, text input, and post/post_redirect/link actions

## Development

```bash
# Install dependencies
pnpm install

# Build the SDK first
pnpm --filter @cinacoin/farcaster-miniapp build

# Run dev server
pnpm --filter cinacoin-farcaster-app dev

# Build for production
pnpm --filter cinacoin-farcaster-app build
```

## Deployment

Deploys to Cloudflare Pages via GitHub Actions:

```bash
# Manual deploy
pnpm --filter cinacoin-farcaster-app deploy:cf
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App base URL | `https://cinacoin-farcaster-app.pages.dev` |
| `NEXT_PUBLIC_APP_NAME` | Display name | `Cinacoin Farcaster App` |

## Dependencies

- `@cinacoin/farcaster-miniapp` — Internal SDK for Farcaster auth & provider
- `next` — React framework (static export mode)
- `react` / `react-dom` — UI library
- Cloudflare Pages Functions — Dynamic POST handling
