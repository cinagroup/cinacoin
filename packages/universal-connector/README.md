# @cinacoin/universal-connector

Universal multi-chain connector — unified interface for connecting to any blockchain supported by Cinacoin.

## Installation

```bash
npm install @cinacoin/universal-connector
```

## Usage

```typescript
import { UniversalConnector } from "@cinacoin/universal-connector";

const connector = new UniversalConnector({
  chains: ["eip155:1", "solana:mainnet"],
});

const account = await connector.connect();
```

## License

MIT
