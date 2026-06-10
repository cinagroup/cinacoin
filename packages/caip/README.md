# @cinacoin/caip

CAIP-2 / CAIP-10 / CAIP-19 utilities for Cinacoin — Chain Agnostic Improvement Proposals parsing and validation.

## Installation

```bash
npm install @cinacoin/caip
```

## Usage

```typescript
import { parseCAIP2, parseCAIP10 } from "@cinacoin/caip";

const chain = parseCAIP2("eip155:1");
const account = parseCAIP10("eip155:1:0x1234...");
```

## License

MIT
