# Cinacoin Bundler Service

ERC-4337 Account Abstraction bundler running on Cloudflare Workers.

## Prerequisites

- Node.js >= 18
- pnpm
- Cloudflare account with Wrangler CLI (`npm i -g wrangler`)
- Wrangler authenticated (`wrangler login` or `wrangler whoami`)

## Local Development

```bash
pnpm install
pnpm dev
```

Test locally:

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_supportedEntryPoints","params":[]}'
```

## Deployment

### 1. Create D1 Database

```bash
wrangler d1 create cinacoin-bundler-db
```

Copy the `database_id` from the output and update it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "BUNDLER_DB"
database_name = "cinacoin-bundler-db"
database_id = "<paste-id-here>"
```

### 2. Run Migrations

```bash
wrangler d1 execute cinacoin-bundler-db --file=./migrations/001_init.sql
```

Or use the setup script:

```bash
bash scripts/setup-db.sh
```

### 3. Set Secrets

```bash
wrangler secret put BUNDLER_PK
# Enter the bundler's private key (hex string without 0x prefix)
```

### 4. Deploy

```bash
pnpm deploy
# or equivalently:
wrangler deploy
```

## RPC Methods

| Method                         | Description                               |
| ------------------------------ | ----------------------------------------- |
| `eth_sendUserOperation`        | Submit a UserOperation to the mempool     |
| `eth_estimateUserOperationGas` | Estimate gas for a UserOperation          |
| `eth_getUserOperationReceipt`  | Get receipt for a submitted UserOperation |
| `eth_supportedEntryPoints`     | List supported entry points               |
| `eth_chainId`                  | Get chain ID                              |

## Architecture

- **Worker** (`src/index.ts`) — RPC endpoint entry point
- **RPC Handler** (`src/rpc/`) — JSON-RPC method routing
- **Bundler** (`src/services/bundler.ts`) — UserOp validation and batching
- **Gas Estimator** (`src/services/gasEstimator.ts`) — Gas price estimation
- **Mempool** (`src/services/mempool.ts`) — Durable Object for pending ops
- **D1 Database** — Persistent storage for UserOps, paymaster deposits, gas prices
