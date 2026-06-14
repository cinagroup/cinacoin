# NEAR Adapter API

> `@cinacoin/adapter-near` — NEAR 链适配器。

## Installation

```bash
npm install @cinacoin/adapter-near
```

## Usage

```typescript
import { NearChainAdapter, NEAR_CHAINS, NEAR_WALLETS } from '@cinacoin/adapter-near'
import { NearCinacoinor } from '@cinacoin/adapter-near'

const adapter = new NearChainAdapter()
adapter.registerChains(NEAR_CHAINS)

// Connect
const result = await adapter.connect()

// Function call
const tx = await adapter.executeFunctionCall({
  contractId: 'contract.near',
  methodName: 'transfer',
  args: { receiver_id: 'receiver.near', amount: '1000000000000000000000000' },
  deposit: '0',
})
```

## Connectors

| Connector | Wallet |
|-----------|--------|
| `NearCinacoinor` | NEAR Wallet |
| `HereCinacoinor` | Here Wallet (Mobile) |

## Features

- NEP-413 message signing
- FT/NFT interaction via NEAR wallet connectors

## See Also

- [Core SDK](./core-sdk.md)
