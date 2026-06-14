# @cinacoin/adapter-solana

Solana chain adapter for Cinacoin — Phantom, Solflare, and Wallet Standard connectors.

## Installation

```bash
npm install @cinacoin/adapter-solana
```

## Usage

```ts
import { SolanaChainAdapter, SOLANA_CHAINS, SOLANA_WALLETS } from '@cinacoin/adapter-solana';

const adapter = new SolanaChainAdapter();
adapter.registerChains(SOLANA_CHAINS);

// Connect to a specific wallet
const address = await adapter.connect('phantom');
console.log('Connected:', address);

// Query SOL balance
const balance = await adapter.getBalance(address);
console.log(`${balance} SOL`);

// Transfer SOL
const sig = await adapter.transferSOL('recipient...', 0.01);
console.log('Tx signature:', sig);

// Sign a message
const signature = await adapter.signMessage('Hello Solana');
console.log('Signature:', signature);

// Get recent block
const blockhash = await adapter.getRecentBlockhash();
console.log('Latest blockhash:', blockhash.blockhash);
```

## API Reference

### SolanaChainAdapter

| Method | Description |
|--------|-------------|
| `connect(walletId?)` | Connect to a Solana wallet (Phantom → Solflare → Wallet Standard fallback) |
| `disconnect()` | Disconnect from the current wallet |
| `isConnected()` | Check if a wallet is connected |
| `getBalance(address)` | Get SOL balance for an address (returns SOL as decimal string) |
| `sendTransaction(tx)` | Send a signed transaction |
| `signMessage(message)` | Sign an arbitrary message |
| `getRecentBlockhash()` | Get the latest blockhash for transaction building |
| `getNetwork()` | Get the current Solana network |
| `switchChain(chainId)` | Switch between mainnet / devnet / testnet |
| `transferSOL(to, amount)` | Transfer SOL to a recipient |
| `transferSPLToken(mint, to, amount)` | Transfer an SPL Token |
| `getTokenAccounts(owner)` | Get all token accounts owned by an address |
| `getTokenBalance(address, mint)` | Get SPL Token balance for a specific mint |
| `getAllTokenBalances(address)` | Get all token balances for an address |
| `getTransactionHistory(address, limit?)` | Get transaction history for an address |
| `createTransaction(instructions)` | Build a Solana transaction from instructions |
| `sendAndConfirmTransaction(tx)` | Send a transaction and wait for confirmation |
| `estimateFee(tx)` | Estimate transaction fee in lamports |
| `getAccountInfo(address)` | Get raw account info for an address |

### Connectors

| Export | Type | Description |
|--------|------|-------------|
| `PhantomCinacoinor` | class | Phantom wallet connector |
| `SolflareCinacoinor` | class | Solflare wallet connector |
| `WalletStandardConnector` | class | Wallet Standard auto-discovery connector |

### Constants

| Export | Type | Description |
|--------|------|-------------|
| `SOLANA_CHAINS` | const | Solana chain presets (mainnet, devnet, testnet) |
| `SOLANA_WALLETS` | const | Supported Solana wallet metadata |
| `SOLANA_PROGRAMS` | const | Common Solana program IDs (System, Token, ATA, etc.) |

### Utilities

| Export | Description |
|--------|-------------|
| `lamportsToSol(lamports)` | Convert lamports to SOL |
| `solToLamports(sol)` | Convert SOL to lamports |
| `isValidSolanaAddress(address)` | Validate a base58 Solana address |
| `base58Encode(bytes)` | Encode bytes to base58 |
| `base58Decode(encoded)` | Decode base58 to bytes |
| `deriveAssociatedTokenAddress(owner, mint)` | Derive an ATA address |

## Chain Presets

| Network | CAIP-2 ID | RPC URL |
|---------|-----------|---------|
| Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | `https://api.mainnet-beta.solana.com` |
| Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | `https://api.devnet.solana.com` |
| Testnet | `solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z` | `https://api.testnet.solana.com` |

## TypeScript

Full TypeScript support — all types are exported. See `types.ts` for the complete type surface:

```ts
import type {
  SolanaNetwork,
  SolanaChainPreset,
  SolanaAccount,
  SolanaTransaction,
  SolanaSignedTransaction,
  SolanaTokenAccount,
  SolanaTokenBalance,
  SolanaTransactionRecord,
  SolanaFeeEstimate,
  SolanaWalletProvider,
  SolanaConnector,
} from '@cinacoin/adapter-solana';
```

## Peer Dependencies

- `@cinacoin/core-sdk` — provides the `ChainAdapter` interface

## License

MIT
