# @cinacoin/wallet-registry

Cinacoin Wallet Registry — standardized wallet metadata for 100+ wallets with type-safe query APIs.

Sources: WalletConnect Registry, EIP-6963, official wallet documentation.

## Installation

```bash
npm install @cinacoin/wallet-registry
```

## Usage

### Get All Wallets

```ts
import { getAllWallets, WALLET_COUNT } from '@cinacoin/wallet-registry';

const wallets = getAllWallets();
console.log(`Registry contains ${WALLET_COUNT} wallets`);
```

### Look Up by ID

```ts
import { getWalletById } from '@cinacoin/wallet-registry';

const metamask = getWalletById('metamask');
console.log(metamask.name);        // "MetaMask"
console.log(metamask.popularity);  // 99
```

### Filter by Chain Family

```ts
import { filterWallets } from '@cinacoin/wallet-registry';

const evmWallets = filterWallets({ chainFamily: 'evm' });
const solanaWallets = filterWallets({ chainFamily: 'solana' });
const cosmosWallets = filterWallets({ chainFamily: 'cosmos' });
```

### Search by Name

```ts
import { searchWallets } from '@cinacoin/wallet-registry';

const results = searchWallets('phantom');
// Returns wallets whose name or ID matches "phantom"
```

### Get Wallets for a Specific Chain

```ts
import { getWalletsForChain } from '@cinacoin/wallet-registry';

const ethWallets = getWalletsForChain('eip155:1');
const solWallets = getWalletsForChain('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
```

### Get WalletConnect v2 Wallets

```ts
import { getWcV2Wallets } from '@cinacoin/wallet-registry';

const wc2Wallets = getWcV2Wallets();
```

### Get Wallets by Platform

```ts
import { getWalletsByPlatform } from '@cinacoin/wallet-registry';

const mobileWallets = getWalletsByPlatform('mobile');
const extensionWallets = getWalletsByPlatform('browser_extension');
```

### Sort and Recommended Order

```ts
import { sortWallets, getRecommendedWalletOrder } from '@cinacoin/wallet-registry';

// Sort by popularity (descending)
const sorted = sortWallets({ field: 'popularity', direction: 'desc' });

// Get recommended display order (tiered by popularity)
const recommended = getRecommendedWalletOrder();
```

### Statistics

```ts
import { getChainFamilyCounts, getPlatformCounts } from '@cinacoin/wallet-registry';

const familyCounts = getChainFamilyCounts();
// { evm: 85, solana: 20, bitcoin: 15, ... }

const platformCounts = getPlatformCounts();
// { mobile: 70, browser_extension: 60, desktop: 25, ... }
```

## API Reference

### Query Functions

| Function | Description |
|----------|-------------|
| `getAllWallets()` | Returns all wallet entries |
| `getWalletById(id)` | Look up a wallet by its ID |
| `getWalletIds()` | Returns all wallet IDs |
| `searchWallets(query)` | Search wallets by name/ID (case-insensitive) |
| `filterWallets(filter)` | Filter wallets by chain family, platform, type, etc. |
| `sortWallets(sort)` | Sort wallets by popularity, name, or year |
| `getWalletsForChainFamily(chainFamily)` | Get wallets supporting a chain family |
| `getWalletsForChain(chain)` | Get wallets supporting a specific CAIP-2 chain |
| `getWcV2Wallets()` | Get wallets with WalletConnect v2 support |
| `getEIP6963Wallets()` | Get wallets with EIP-6963 support |
| `getRecommendedWalletOrder()` | Get wallets in recommended display order |
| `getWalletsByPlatform(platform)` | Get wallets for a specific platform |
| `getWalletsByType(walletType)` | Get wallets by type (hot, cold, smart_contract, etc.) |
| `getChainFamilyCounts()` | Count wallets per chain family |
| `getPlatformCounts()` | Count wallets per platform |

### Subpath Exports

| Import | Description |
|--------|-------------|
| `@cinacoin/wallet-registry/registry` | Raw registry data (`WALLET_REGISTRY`, `WALLET_COUNT`) |
| `@cinacoin/wallet-registry/types` | TypeScript type definitions |

### Types

```ts
import type {
  WalletRegistryEntry,
  WalletPlatform,
  WalletChainFamily,
  WalletFilter,
  WalletSort,
} from '@cinacoin/wallet-registry';
```

### Wallet Entry Structure

Each `WalletRegistryEntry` includes:

- `id` — unique kebab-case identifier
- `name` — display name
- `logo` — icon/logo URL
- `homepage` — official website
- `supportedChainFamilies` — chain families (evm, solana, bitcoin, etc.)
- `supportedChains` — specific CAIP-2 chains
- `platforms` — browser_extension, mobile, desktop, hardware, web, cli
- `deepLink` / `universalLink` — mobile deep linking
- `appStoreUrl` / `playStoreUrl` / `extensionUrl` — store links
- `supportsWalletConnectV2` — WC v2 compatibility
- `supportsEIP6963` — EIP-6963 multi-provider discovery
- `rdns` — EIP-6963 reverse domain name identifier
- `openSource` — whether the wallet is open source
- `walletType` — hot, cold, smart_contract, custodial, social, embedded
- `supportsAccountAbstraction` — ERC-4337 support
- `popularity` — score 1-100
- `developer`, `yearFounded`, `social` — metadata

## License

MIT
