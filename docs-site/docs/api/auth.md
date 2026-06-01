# Auth

Sign-In With Ethereum (SIWE) authentication with session management.

## Overview

Authenticate users with their crypto wallet. No passwords, no accounts — just a signature.

## Quick Start

```bash
npm install @cinacoin/auth
```

```tsx
import { createAuth } from '@cinacoin/auth'

const auth = createAuth({
  projectId: 'your-project-id',
  domain: 'yourdomain.com',
})

const { address, session } = await auth.signIn()
```

## Features

- EIP-4361 compliant SIWE
- Session management
- Wallet verification
- SIWX support

## Related

- [SIWE Guide](/api/siwe)
- [Social Login](/api/social-login)
