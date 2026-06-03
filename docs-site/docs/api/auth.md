# Auth

Sign-In With Ethereum (SIWE) authentication with session management.

## Overview

Authenticate users with their crypto wallet. No passwords, no accounts — just a signature. The Auth package provides EIP-4361 compliant SIWE flows, session management, wallet verification, and SIWX (Sign-In With X) extensibility for multi-chain authentication.

## Installation

```bash
npm install @cinacoin/auth
```

### With SIWE package

```bash
npm install @cinacoin/auth @cinacoin/siwe
```

## Quick Start

### Basic SIWE Sign-In

```typescript
import { createAuth } from '@cinacoin/auth'

const auth = createAuth({
  projectId: 'your-project-id',
  domain: 'yourdomain.com',
})

const { address, session } = await auth.signIn()
```

### Using SIWEAuth from Core SDK

```typescript
import { SIWEAuth, Connector } from '@cinacoin/core-sdk'

const siwe = new SIWEAuth(connector, {
  domain: 'https://myapp.com',
  uri: 'https://myapp.com/login',
  statement: 'Sign in to MyApp',
  chainId: 1,
  expirationSeconds: 86400, // 24 hours
})

// Sign in — prompts user to sign SIWE message
const result = await siwe.signIn()
console.log('Address:', result.address)
console.log('Verified:', result.verified)
console.log('Session token:', result.sessionToken)

// Sign out
await siwe.signOut()
```

## SIWE Message Generation

### Generate a SIWE Message

```typescript
import { generateMessage, generateNonce } from '@cinacoin/siwe'

const message = generateMessage({
  domain: 'https://myapp.com',
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  uri: 'https://myapp.com/login',
  chainId: 1,
  nonce: generateNonce(),
  statement: 'Sign in to MyApp',
  expirationTime: '2025-12-31T23:59:59.000Z',
  resources: [
    'https://myapp.com/terms',
    'https://myapp.com/privacy',
  ],
})

// message is a string per EIP-4361 format
```

### Parse a SIWE Message

```typescript
import { parseMessage } from '@cinacoin/siwe'

const parsed = parseMessage(siwemessage)
console.log(parsed.domain)    // 'https://myapp.com'
console.log(parsed.address)   // '0xd8dA...'
console.log(parsed.chainId)   // 1
console.log(parsed.nonce)     // random nonce
```

### Verify a SIWE Signature

```typescript
import { verifyMessage } from '@cinacoin/siwe'

const result = await verifyMessage(
  message,
  signature,
  provider // viem, ethers, or EIP-1193 provider
)

console.log(result.valid)  // true or false
console.log(result.data)   // ParsedSIWE
```

## API Reference

### SIWEAuth Class

| Method | Description |
|---|---|
| `signIn()` | Generate SIWE message, prompt for signature, verify, and establish session |
| `signOut()` | Clear session and terminate |
| `getSession()` | Get current session state |
| `isAuthenticated()` | Check if user is currently authenticated |

### SIWEAuthConfig

| Property | Type | Default | Description |
|---|---|---|---|
| `domain` | `string` | — | RFC 3986 URI of requesting domain |
| `uri` | `string` | — | URI of the resource being authenticated |
| `statement` | `string` | — | Human-readable message shown to user |
| `chainId` | `number` | `1` | EIP-155 chain ID |
| `expirationSeconds` | `number` | `86400` | Session TTL in seconds (24h default) |
| `generateNonce` | `() => string` | crypto random | Custom nonce generator |

### SIWESignInResult

| Property | Type | Description |
|---|---|---|
| `address` | `string` | Ethereum address that signed |
| `message` | `string` | The SIWE message that was signed |
| `signature` | `string` | Signature (hex string) |
| `verified` | `boolean` | Whether the signature was verified |
| `data` | `ParsedSIWE` | Parsed SIWE message fields |
| `sessionToken` | `string?` | Session token for authenticated requests |
| `expiresAt` | `number?` | Session expiration timestamp |

### SIWE Core Functions (`@cinacoin/siwe`)

| Function | Description |
|---|---|
| `generateMessage(params)` | Generate EIP-4361 formatted SIWE message |
| `parseMessage(message)` | Parse a SIWE message into structured data |
| `verifyMessage(message, sig, provider)` | Verify signature against message |
| `generateNonce()` | Generate cryptographically random nonce |
| `generateTimestamp()` | Generate ISO 8601 timestamp |

### Validation Functions

| Function | Description |
|---|---|
| `validateSIWEParams(params)` | Validate all SIWE parameters |
| `validateTemporalConstraints(params)` | Check expiration/notBefore times |
| `validateDomainMatch(params)` | Verify domain matches |
| `fullValidation(params)` | Run all validations |

### Utility Functions

| Function | Description |
|---|---|
| `isValidEthereumAddress(address)` | Validate EIP-55 checksummed address |
| `isValidUri(uri)` | Validate RFC 3986 URI |
| `normalizeAddress(address)` | Normalize address to lowercase |
| `getOrigin(url)` | Extract origin from URL |

## Advanced Usage

### Custom SIWE Statement

```typescript
const siwe = new SIWEAuth(connector, {
  domain: 'https://myapp.com',
  uri: 'https://myapp.com/login',
  statement: `Sign in to MyApp on ${new Date().toLocaleDateString()}`,
})
```

### SIWE with Resources

```typescript
const siwe = new SIWEAuth(connector, {
  domain: 'https://myapp.com',
  uri: 'https://myapp.com/login',
})

// The signIn flow generates a message with resources
const result = await siwe.signIn()

// Parse and validate the message
const parsed = parseMessage(result.message)
console.log(parsed.resources)
```

### Server-Side Verification

```typescript
import { verifyMessage, parseMessage } from '@cinacoin/siwe'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// On your backend server:
async function verifySignIn(message: string, signature: string) {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(),
  })

  const result = await verifyMessage(message, signature, client)

  if (!result.valid) {
    throw new Error('Invalid SIWE signature')
  }

  // Create session for the user
  const parsed = parseMessage(message)
  return {
    address: parsed.address,
    chainId: parsed.chainId,
    domain: parsed.domain,
  }
}
```

## Related

- [SIWE Guide](/api/siwe) — Full SIWE implementation details
- [Social Login](/api/social-login) — Google/Apple/X authentication
- [Core SDK](/api/core-sdk) — Foundation SDK with SIWEAuth class
