# @cinacoin/chain-registry

EVM chain registry with 100+ chains — CAIP-2 compatible, auto-generated from chainlist.org.

## Installation

```bash
npm install @cinacoin/chain-registry
```

## Usage

```typescript
import { getChain, getAllChains } from "@cinacoin/chain-registry";

const eth = getChain("eip155:1");
const all = getAllChains();
```

## License

MIT
