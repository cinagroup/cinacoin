# @onchainux/cli

Command-line interface for the **OnChainUX** self-hosted wallet connection toolkit.

## Installation

```bash
npm install -g @onchainux/cli
# or
npx @onchainux/cli <command>
```

## Commands

### `init` — Scaffold a new OnChainUX project

```bash
onchainux init my-app
onchainux init my-app --template react
onchainux init my-app --template next --package-manager pnpm
onchainux init my-app --dry-run
```

| Option | Description | Default |
|---|---|---|
| `--template` | Template to use (`web`, `react`, `vue`, `next`) | `web` |
| `--package-manager` | Package manager (`npm`, `yarn`, `pnpm`) | `pnpm` |
| `--dry-run` | Show what would be created without writing | `false` |

### `add` — Add adapters, plugins, or components

```bash
onchainux add @onchainux/react
onchainux add @onchainux/swap-sdk --dev
onchainux list   # List all available addons
```

| Option | Description | Default |
|---|---|---|
| `--dev` | Add as devDependency | `false` |

**Available addons:**

| Addon | Description |
|---|---|
| `@onchainux/evm` | EVM chain adapter |
| `@onchainux/solana` | Solana chain adapter |
| `@onchainux/bitcoin` | Bitcoin chain adapter |
| `@onchainux/react` | React UI components |
| `@onchainux/vue` | Vue UI components |
| `@onchainux/react-native` | React Native components |
| `@onchainux/swap-sdk` | DEX swap aggregator |
| `@onchainux/siwe` | Sign-In With Ethereum |
| `@onchainux/onramp-sdk` | Fiat on-ramp aggregator |
| `@onchainux/walletconnect-v2` | WalletConnect v2 integration |
| `@onchainux/session-keys` | ERC-4337 session keys |
| `@onchainux/social-login` | Social login providers |

### `build` — Build SDK packages

```bash
onchainux build
onchainux build --scope @onchainux/core
onchainux build --force
```

| Option | Description | Default |
|---|---|---|
| `--scope` | Build a specific package only | all packages |
| `--force` | Force rebuild (clean dist first) | `false` |

### `test` — Run tests

```bash
onchainux test              # Run all tests
onchainux test --unit       # Unit tests only
onchainux test --e2e        # E2E tests only
onchainux test --coverage   # With coverage
onchainux test --watch      # Watch mode
onchainux test --ui         # Playwright UI mode
onchainux test --project chromium
```

| Option | Description | Default |
|---|---|---|
| `--unit` | Run unit tests only (vitest) | — |
| `--e2e` | Run E2E tests only (playwright) | — |
| `--coverage` | Generate coverage report | `false` |
| `--watch` | Watch mode (unit tests only) | `false` |
| `--project` | Playwright project name | all |
| `--ui` | Playwright UI mode | `false` |

## Programmatic Usage

```ts
import { program } from '@onchainux/cli';

program.parse(['node', 'cli', 'init', 'my-app', '--template', 'react']);
```

## Architecture

```
packages/cli/
├── src/
│   ├── index.ts              # CLI entry (commander setup)
│   ├── commands/
│   │   ├── init.ts           # ocx init — scaffold projects
│   │   ├── add.ts            # ocx add — add dependencies
│   │   ├── build.ts          # ocx build — turbo builds
│   │   └── test.ts           # ocx test — run vitest + playwright
│   └── utils/
│       ├── fs.ts             # File system utilities
│       └── logger.ts         # Colored logger + spinner
├── package.json
└── README.md
```

## License

MIT
