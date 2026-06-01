# Keys

Decentralized key management infrastructure.

## Overview

Secure key storage, rotation, and recovery for on-chain identity management.

## Quick Start

```bash
npm install @cinacoin/keys
```

```tsx
import { createKeys } from '@cinacoin/keys'

const keys = createKeys({
  projectId: 'your-project-id',
})

await keys.rotate({
  address,
  newKey: publicKey,
})
```

## Features

- Key rotation
- Secure storage
- Recovery workflows
- Session keys

## Related

- [Keys Server](/api/keys-server)
- [Session Keys](/api/session-keys)
