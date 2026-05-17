# Security Best Practices

> Protect your users' assets and data when building with CinaConnect.

---

## Content Security Policy (CSP)

### Recommended CSP Headers

Configure strict CSP headers to prevent XSS attacks and unauthorized script execution:

**Nginx:**

```nginx
server {
  # ...
  add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://*.cinaconnect.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    connect-src 'self' wss://relay.cinaconnect.com https://*.cinaconnect.com https://*.magic.link;
    frame-src 'self' https://*.magic.link https://pay.cinaconnect.com;
    worker-src 'self' blob:;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  " always;
}
```

**Express.js:**

```typescript
import helmet from 'helmet'

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", 'https://*.cinaconnect.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'wss://relay.cinaconnect.com',
        'https://*.cinaconnect.com',
        'https://*.magic.link',
      ],
      frameSrc: ["'self'", 'https://*.magic.link', 'https://pay.cinaconnect.com'],
      workerSrc: ["'self'", 'blob:'],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  })
)
```

**Next.js (next.config.ts):**

```typescript
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://*.cinaconnect.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' wss://relay.cinaconnect.com https://*.cinaconnect.com https://*.magic.link",
  "frame-src 'self' https://*.magic.link https://pay.cinaconnect.com",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

---

## WebSocket Security

### wss:// Only — Never ws://

All WebSocket connections **must** use TLS (`wss://`). Plain WebSocket (`ws://`) exposes relay traffic to interception.

```typescript
// ✅ Correct
const relayUrl = 'wss://relay.cinaconnect.com/v1'

// ❌ Never do this
const relayUrl = 'ws://relay.cinaconnect.com/v1'
```

### Verify WebSocket Connection

```typescript
function validateRelayUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'wss:') {
      console.error('Relay URL must use wss:// protocol')
      return false
    }
    return true
  } catch {
    return false
  }
}
```

### TLS Configuration (Nginx)

```nginx
server {
  listen 443 ssl http2;
  server_name relay.cinaconnect.com;

  ssl_certificate /etc/letsencrypt/live/relay.cinaconnect.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/relay.cinaconnect.com/privkey.pem;

  # TLS 1.3 only
  ssl_protocols TLSv1.3;
  ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;
  ssl_prefer_server_ciphers off;

  # WebSocket proxy
  location /v1 {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
  }
}
```

---

## Session Encryption (ChaCha20-Poly1305)

### How It Works

All messages between dApp and wallet are encrypted end-to-end:

```
┌──────┐              ┌────────┐              ┌───────┐
│ dApp │──encrypted──►│ Relay  │──encrypted──►│ Wallet│
│      │◄─encrypted───│        │◄─encrypted───│       │
└──────┘              └────────┘              └───────┘

Key: X25519 ECDH (never touches relay)
Cipher: ChaCha20-Poly1305 AEAD
```

**Critical facts:**
- Relay server **cannot** decrypt messages — it only routes by topic
- Keys are negotiated via X25519 Diffie-Hellman between dApp and wallet
- Each pairing generates a fresh key pair
- Session keys are ephemeral and destroyed on disconnect

### Implementation Reference

```typescript
import { generateKeyPair, deriveSharedSecret, encrypt, decrypt } from '@cinaconnect/core/crypto'

// 1. Generate ephemeral key pair
const keyPair = generateKeyPair()
// { publicKey: Uint8Array, privateKey: Uint8Array }

// 2. Exchange public keys with peer (via relay)
//    Send your publicKey, receive their publicKey

// 3. Derive shared secret (ECDH)
const sharedSecret = deriveSharedSecret(keyPair.privateKey, peerPublicKey)

// 4. Encrypt messages
const ciphertext = encrypt(sharedSecret, JSON.stringify({ method: 'eth_sendTransaction', params: [...] }))

// 5. Decrypt received messages
const plaintext = decrypt(sharedSecret, receivedCiphertext)
```

---

## Key Management Best Practices

### What Never to Do

| ❌ Anti-Pattern | Risk |
|-----------------|------|
| Hardcode private keys in frontend code | Keys visible in bundle, git history, browser DevTools |
| Store private keys in localStorage | Accessible to XSS attacks |
| Transmit private keys over WebSocket/HTTP | Intercepted in transit |
| Log private keys or seed phrases | Exposed in log aggregators |
| Use the same key for multiple users | Single point of failure |

### What to Do

| ✅ Practice | Description |
|------------|-------------|
| Hardware wallets | Use Ledger/Trezor for high-value operations |
| Multi-sig | Require 2-of-3 or 3-of-5 for project treasury |
| Session keys | Use restricted, expiring keys for dApp interactions |
| Key rotation | Rotate operational keys on a schedule |
| Social recovery | Implement ERC-4337 social recovery for smart accounts |

### Environment Variable Security

```bash
# .env.production (never commit this file)
CINA_PROJECT_ID=your-production-id
CINA_RELAY_URL=wss://relay.cinaconnect.com/v1
CINA_ANALYTICS_KEY=your-analytics-key
MAGIC_API_KEY=pk_live_xxxx
SENTRY_DSN=https://xxxx@yyyy.ingest.sentry.io/zzzz
```

```typescript
// Verify required env vars at startup
const required = ['CINA_PROJECT_ID', 'CINA_RELAY_URL']
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`)
  }
}
```

---

## Phishing Prevention

### Domain Verification (Verify API)

CinaConnect's Verify API helps users identify legitimate dApps:

```typescript
const config = {
  projectId: 'your-project-id',
  relayUrl: 'wss://relay.cinaconnect.com/v1',
  chains: [mainnet],
  metadata: {
    name: 'MyDeFi App',
    description: 'A trusted DeFi platform',
    url: 'https://mydefi.app',
    icons: ['https://mydefi.app/logo.png'],
    verifyUrl: 'https://verify.cinaconnect.com/v1',
  },
}
```

**How Verify works:**
1. CinaConnect scans registered domains and verifies metadata
2. Verified dApps show a green badge in the connect modal
3. Unverified or suspicious dApps show warnings to users

### Register Your dApp

```bash
# Register with Verify API
curl -X POST https://verify.cinaconnect.com/v1/register \
  -H "Authorization: Bearer $VERIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mydefi.app",
    "name": "MyDeFi App",
    "description": "A trusted DeFi platform",
    "iconUrl": "https://mydefi.app/logo.png",
    "ownerAddress": "0x1234...5678"
  }'
```

### User Education

Educate users to:
- ✅ Always check the domain in the wallet connection prompt
- ✅ Look for the verified badge (green checkmark)
- ✅ Never sign messages from unknown domains
- ✅ Bookmark your dApp URL to avoid typosquatting

---

## Additional Security Measures

### HTTP Security Headers

```nginx
# Add to your nginx server block
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "0" always;  # CSP handles XSS protection
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

### Subresource Integrity (SRI)

When loading external scripts, use SRI hashes:

```html
<script
  src="https://cdn.cinaconnect.com/sdk/v1.0.0/cinaconnect.min.js"
  integrity="sha384-xxxxxxx"
  crossorigin="anonymous"
></script>
```

Generate SRI hashes:

```bash
curl -s https://cdn.cinaconnect.com/sdk/v1.0.0/cinaconnect.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

### Input Validation

Validate all user inputs and external data:

```typescript
import { isAddress, parseUnits } from 'viem'

function validateTransferInput(input: any) {
  // Validate address format
  if (!isAddress(input.to)) {
    throw new Error('Invalid recipient address')
  }

  // Validate amount is positive and within limits
  const amount = parseUnits(input.amount, 6)
  if (amount <= 0n) {
    throw new Error('Amount must be positive')
  }
  if (amount > 1_000_000n * 10n ** 6n) {
    throw new Error('Amount exceeds maximum (1M USDC)')
  }

  return { to: input.to as `0x${string}`, amount }
}
```

### Rate Limiting

Protect your API endpoints:

```typescript
import rateLimit from 'express-rate-limit'

const siweLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  message: 'Too many authentication attempts, please try again later',
})

app.use('/api/auth/siwe', siweLimiter)
```

### Audit Trail

Log security-relevant events:

```typescript
cinaconnect.on('connect', (session) => {
  logger.info('wallet_connected', {
    timestamp: new Date().toISOString(),
    wallet: session.wallet.name,
    chain: session.chain.id,
    sessionId: session.topic,
  })
})

cinaconnect.on('disconnect', (session) => {
  logger.info('wallet_disconnected', {
    timestamp: new Date().toISOString(),
    sessionId: session.topic,
  })
})
```

---

## Security Checklist

| Item | Status |
|------|--------|
| CSP headers configured | ☐ |
| WebSocket uses wss:// only | ☐ |
| TLS 1.3 enforced | ☐ |
| Session encryption verified (ChaCha20-Poly1305) | ☐ |
| No private keys in code/storage/logs | ☐ |
| Domain registered with Verify API | ☐ |
| SIWE nonce replay protection | ☐ |
| Rate limiting on auth endpoints | ☐ |
| SRI hashes for external scripts | ☐ |
| Security audit completed | ☐ |
| Incident response plan documented | ☐ |
| Dependencies regularly updated | ☐ |

---

*Security Best Practices — CinaConnect Documentation*
