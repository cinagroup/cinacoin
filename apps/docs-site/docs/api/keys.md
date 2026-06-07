# Keys

Decentralized key management infrastructure.

## Overview

Secure key storage, rotation, and recovery for on-chain identity management. The Keys system provides AES-256-GCM encrypted key storage with scrypt-derived keys, session-based access control with TTL, and a REST API for remote key management.

**Key capabilities:**

- AES-256-GCM encryption at rest
- scrypt key derivation for encryption keys
- Session-based access with configurable TTL
- Key rotation and recovery workflows
- Metadata-only listing (key material never exposed in lists)
- Redis-backed distributed storage option

## Installation

### Client SDK

```bash
npm install @cinacoin/keys
```

### Keys Server

```bash
cd packages/keys-server
npm install
```

## Quick Start

### Basic Key Operations

```typescript
import { createKeys } from '@cinacoin/keys'

const keys = createKeys({
  projectId: 'your-project-id',
})

// Store a key
await keys.store({
  id: 'signing-key-1',
  label: 'Primary Signing Key',
  keyData: rawKeyBytes,
})

// Retrieve key metadata (not the key material)
const key = await keys.getKey('signing-key-1')
console.log('Label:', key.label)
console.log('Algorithm:', key.algorithm)

// List all keys (metadata only)
const allKeys = await keys.list()
```

### Key Rotation

```typescript
// Rotate to a new key
await keys.rotate({
  address,
  newKey: publicKey,
})

// The old key is marked as deprecated but retained for recovery
```

### Server: KeyManager

```typescript
import { KeyManager } from '@cinacoin/keys-server'

const keyManager = new KeyManager({
  encryptionKey: process.env.ENCRYPTION_KEY,
  storageUri: 'redis://localhost:6379',
  sessionTtlMs: 3_600_000, // 1 hour
})

// Store an encrypted key
const stored = await keyManager.storeKey(
  'signing-key-1',
  'Primary Signing Key',
  keyData
)

// Decrypt a key
const decrypted = keyManager.decryptKey(stored.encrypted)
```

## API Reference

### StoredKey

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique key identifier |
| `label` | `string` | Human-readable label |
| `encrypted` | `string` | Base64-encoded encrypted key data |
| `algorithm` | `string` | Encryption algorithm (`aes-256-gcm`) |
| `createdAt` | `number` | Storage timestamp (Unix ms) |

### Session

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Session token (hex, 32 chars) |
| `userId` | `string` | Associated user ID |
| `permissions` | `string[]` | Permission strings |
| `expiresAt` | `number` | Expiry timestamp (Unix ms) |

### DecryptResult

| Field | Type | Description |
|---|---|---|
| `key` | `Uint8Array` | Decrypted key bytes |
| `metadata` | `Record<string, string>` | Associated metadata |

### KeyManagerConfig

| Property | Type | Default | Description |
|---|---|---|---|
| `encryptionKey` | `string` | *(dev only)* | Master encryption key passphrase |
| `storageUri` | `string` | — | Storage backend URI (e.g., Redis) |
| `sessionTtlMs` | `number` | `3600000` | Session TTL (1 hour default) |

### KeyManager Methods

| Method | Description |
|---|---|
| `storeKey(id, label, keyData)` | Encrypt and store a key. Returns StoredKey metadata. |
| `getKey(id)` | Retrieve StoredKey metadata (encrypted blob). |
| `decryptKey(encrypted)` | Decrypt a key blob. Returns raw key bytes. |
| `deleteKey(id)` | Remove a stored key. Returns boolean. |
| `listKeys()` | List all keys (metadata only, no encrypted data). |
| `createSession(userId, permissions)` | Create a new session with permissions. |
| `validateSession(sessionId)` | Validate a session token. Returns Session or null. |
| `revokeSession(sessionId)` | Revoke a session. Returns boolean. |

### Client Keys API

| Method | Description |
|---|---|
| `store(config)` | Store a new encrypted key |
| `getKey(id)` | Get key metadata |
| `list()` | List all keys (metadata only) |
| `rotate(config)` | Rotate to a new key pair |
| `recover(config)` | Recover a key from backup |

## Encryption Details

### How Keys Are Encrypted

1. **Key derivation**: The master `encryptionKey` passphrase is run through **scrypt** with a fixed salt to produce a 32-byte AES key.
2. **Encryption**: Each key is encrypted with **AES-256-GCM** using a random 16-byte IV.
3. **Storage format**: The stored blob is `base64(IV || authTag || ciphertext)`.

```
┌──────────────────────────────────────────────┐
│  Stored Key (base64)                          │
├──────────┬──────────┬────────────────────────┤
│ IV (16B) │ Tag (16B) │ Ciphertext (variable)  │
└──────────┴──────────┴────────────────────────┘
```

### Security Recommendations

- **Never use the default encryption key in production.** Always set `ENCRYPTION_KEY` via environment variable.
- **Use a strong passphrase** (256+ bits of entropy) for the master encryption key.
- **Rotate encryption keys periodically** — re-encrypt all stored keys with the new master key.
- **Use Redis with TLS** for distributed storage in production.
- **Implement audit logging** for all key access operations.

## Advanced Usage

### Session-Based Access

```typescript
// Create a session with specific permissions
const session = keyManager.createSession('user-123', [
  'keys:read',
  'keys:write',
])

console.log('Session token:', session.id)
console.log('Expires at:', new Date(session.expiresAt))

// Later — validate the session
const validSession = keyManager.validateSession(session.id)
if (!validSession) {
  throw new Error('Session expired or invalid')
}

// Revoke when done
keyManager.revokeSession(session.id)
```

### Key Recovery Workflow

```typescript
import { createKeys } from '@cinacoin/keys'

const keys = createKeys({ projectId: 'your-project-id' })

// Store key with recovery metadata
await keys.store({
  id: 'primary-key',
  label: 'Primary Key',
  keyData: keyBytes,
  metadata: {
    recoveryEmail: 'user@example.com',
    backupDate: new Date().toISOString(),
  },
})

// Recover key
const recovered = await keys.recover({
  id: 'primary-key',
  method: 'email',
  recoveryCode: 'CODE_FROM_EMAIL',
})
```

### REST API (Keys Server)

The keys server exposes a REST API:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/keys` | Store a new encrypted key |
| `GET` | `/keys/:id` | Get key metadata |
| `GET` | `/keys` | List all keys (metadata) |
| `DELETE` | `/keys/:id` | Delete a key |
| `POST` | `/sessions` | Create a session |
| `POST` | `/sessions/:id/validate` | Validate a session |
| `DELETE` | `/sessions/:id` | Revoke a session |
| `GET` | `/health` | Health check |

## Related

- [Keys Server](/api/keys-server) — Self-hosted keys server details
- [Session Keys](/api/session-keys) — Ephemeral session key management
- [Embedded Wallet](/api/embedded-wallet) — Embedded wallet key generation
