# @cinacoin/verify-sdk

**Contract safety scoring and phishing detection SDK** — inspired by Reown Verify.

Protect users by scanning smart contracts for dangerous patterns, scoring risk, and detecting phishing websites.

## Features

- **Contract Scanner** — on-chain analysis with 12 risk flags
- **Domain Verifier** — phishing detection, typosquatting checks, SSL validation
- **Known dApp Registry** — 55+ verified projects across 6 categories
- **Risk Scoring** — 0–100 scale with human-readable summaries
- **Batch Scanning** — parallel contract scanning with progress events
- **Caching** — configurable TTL for scan results

## Risk Flags (12)

| Flag | Description |
|---|---|
| `honeypot` | Buy allowed but sell blocked or extremely taxed |
| `rug_pull_risk` | High owner privileges enabling a rug pull |
| `proxy_without_source` | Proxy contract with unverified implementation |
| `unlimited_allowance` | ERC-20 approve() has no upper bound |
| `blacklist_function` | Contract can blacklist addresses |
| `mint_function` | Unlimited or very high mint capability |
| `pause_function` | Contract can be paused |
| `self_destruct` | Contract contains selfdestruct |
| `phishing_domain` | Contract references a known phishing site |
| `clone_contract` | Contract is a clone of a known scam |
| `unverified_source` | Source code not verified on any explorer |

## Risk Levels

| Score | Level | Meaning |
|---|---|---|
| 0–25 | ✅ Safe | No significant risk detected |
| 26–50 | ⚠️ Warning | Some flags present, proceed with caution |
| 51–75 | 🚨 Danger | Multiple risk factors detected |
| 76–100 | 🔴 Critical | High-risk contract, avoid |

## Installation

```bash
npm install @cinacoin/verify-sdk
```

## Usage

### Basic Contract Scan

```ts
import { VerifySDK } from '@cinacoin/verify-sdk';

const sdk = new VerifySDK();

const report = await sdk.verifyContract('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 1);
console.log(sdk.getRiskSummary(report));
```

### Domain Verification

```ts
const domainReport = await sdk.verifyDomain('app.uniswap.org');
console.log('Phishing?', domainReport.isPhishing);
console.log('Known dApp?', domainReport.isKnownDApp);
```

### Batch Scanning

```ts
const result = await sdk.batchVerify([
  { address: '0x...', chainId: 1 },
  { address: '0x...', chainId: 137 },
]);

console.log(`Scanned ${Object.keys(result.reports).length} contracts in ${result.durationMs}ms`);
```

### Progress Events

```ts
sdk.on('progress', (event) => {
  console.log(`Progress: ${event.completed}/${event.total}`);
});
```

### Quick Safety Check

```ts
const report = await sdk.verifyContract('0x...', 1);
if (!sdk.isSafe(report)) {
  console.warn('⚠️ This contract may be risky!');
}
```

### Registry Lookup

```ts
import { KnownDAppRegistry } from '@cinacoin/verify-sdk';

// Search dApps
const dexApps = KnownDAppRegistry.getDAppsByCategory('dex');
const uniswap = KnownDAppRegistry.getDAppByDomain('app.uniswap.org');
const allLending = KnownDAppRegistry.searchDApps('', { category: 'lending' });
```

## Configuration

```ts
const sdk = new VerifySDK({
  explorerApiUrls: {
    1: 'https://api.etherscan.io/api',
    137: 'https://api.polygonscan.com/api',
  },
  explorerApiKeys: {
    1: process.env.ETHERSCAN_API_KEY,
  },
  cacheTtlMs: 5 * 60 * 1_000,    // 5 minutes
  maxConcurrency: 10,              // parallel scans
  safeThreshold: 25,               // isSafe() cutoff
});
```

## Known dApp Registry

55+ verified projects across categories:

- **DEX** (10): Uniswap, PancakeSwap, SushiSwap, Curve, GMX, etc.
- **Lending** (10): Aave, Compound, MakerDAO, Liquity, etc.
- **NFT** (9): OpenSea, Blur, Rarible, Foundation, etc.
- **Bridge** (9): Hop, Across, Synapse, Wormhole, LayerZero, etc.
- **DAO** (9): Snapshot, Aragon, Lido, Yearn, etc.
- **Game** (6): Axie Infinity, The Sandbox, Decentraland, etc.

## License

MIT
