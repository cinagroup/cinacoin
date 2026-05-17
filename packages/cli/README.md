# @cinaconnect/cli

Command-line interface for the **CinaConnect** self-hosted wallet connection toolkit.

## Installation

```bash
npm install -g @cinaconnect/cli
# or
npx @cinaconnect/cli <command>
```

## Commands

### `init` — Scaffold a new CinaConnect project

```bash
cinaconnect init my-app
cinaconnect init my-app --template react
cinaconnect init my-app --template next --package-manager pnpm
cinaconnect init my-app --dry-run
```

| Option | Description | Default |
|---|---|---|
| `--template` | Template to use (`web`, `react`, `vue`, `next`) | `web` |
| `--package-manager` | Package manager (`npm`, `yarn`, `pnpm`) | `pnpm` |
| `--dry-run` | Show what would be created without writing | `false` |

### `add` — Add adapters, plugins, or components

```bash
cinaconnect add @cinaconnect/react
cinaconnect add @cinaconnect/swap-sdk --dev
cinaconnect list   # List all available addons
```

| Option | Description | Default |
|---|---|---|
| `--dev` | Add as devDependency | `false` |

**Available addons:**

| Addon | Description |
|---|---|
| `@cinaconnect/evm` | EVM chain adapter |
| `@cinaconnect/solana` | Solana chain adapter |
| `@cinaconnect/bitcoin` | Bitcoin chain adapter |
| `@cinaconnect/react` | React UI components |
| `@cinaconnect/vue` | Vue UI components |
| `@cinaconnect/react-native` | React Native components |
| `@cinaconnect/swap-sdk` | DEX swap aggregator |
| `@cinaconnect/siwe` | Sign-In With Ethereum |
| `@cinaconnect/onramp-sdk` | Fiat on-ramp aggregator |
| `@cinaconnect/walletconnect-v2` | WalletConnect v2 integration |
| `@cinaconnect/session-keys` | ERC-4337 session keys |
| `@cinaconnect/social-login` | Social login providers |

### `build` — Build SDK packages

```bash
cinaconnect build
cinaconnect build --scope @cinaconnect/core
cinaconnect build --force
```

| Option | Description | Default |
|---|---|---|
| `--scope` | Build a specific package only | all packages |
| `--force` | Force rebuild (clean dist first) | `false` |

### `test` — Run tests

```bash
cinaconnect test              # Run all tests
cinaconnect test --unit       # Unit tests only
cinaconnect test --e2e        # E2E tests only
cinaconnect test --coverage   # With coverage
cinaconnect test --watch      # Watch mode
cinaconnect test --ui         # Playwright UI mode
cinaconnect test --project chromium
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
import { program } from '@cinaconnect/cli';

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
