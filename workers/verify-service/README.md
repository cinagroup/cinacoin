# CINAcoin Verify API Service

Anti-phishing domain verification service for CINAcoin Web3 ecosystem. Protects users from malicious dApps by verifying domain ownership through DNS TXT records.

## Overview

The Verify API provides a mechanism for:
- **dApp developers** to register and prove ownership of their domains
- **Wallets** to verify that a connecting dApp is legitimate
- **Users** to see visual confirmation that a dApp is verified

Similar to Cinacoin (Cinacoin) Verify API, but self-hosted on Cloudflare Workers for the CINAcoin ecosystem.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CINAcoin Verify API                       │
│                   verify.cinacoin.com                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   /verify/   │  │   /verify/   │  │    /verify/      │  │
│  │  register    │  │   check      │  │    domain        │  │
│  │  (POST)      │  │   (GET)      │  │    (GET)         │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                    │            │
│         └──────────────────┼────────────────────┘            │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │   KV Storage    │                       │
│                   │  (Domain Cache) │                       │
│                   └────────┬────────┘                       │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │  DNS-over-HTTPS │                       │
│                   │  (Cloudflare)   │                       │
│                   └─────────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### `POST /verify/register`

Register a new domain for verification. Requires admin API key.

**Headers:**
```
X-API-Key: <your-admin-api-key>
Content-Type: application/json
```

**Body:**
```json
{
  "domain": "my-dapp.com",
  "appName": "My Awesome dApp",
  "contactEmail": "admin@my-dapp.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "domain": "my-dapp.com",
  "token": "cinacoin-verify-a1b2c3d4e5f6...",
  "message": "Domain registered. Please add a DNS TXT record:",
  "instructions": {
    "recordType": "TXT",
    "host": "_cinacoin-verify.my-dapp.com",
    "value": "cinacoin-verify-a1b2c3d4e5f6..."
  }
}
```

### `GET /verify/check?domain=example.com`

Perform a full verification check with live DNS lookup.

**Response (200):**
```json
{
  "domain": "my-dapp.com",
  "status": "verified",
  "verified": true,
  "appName": "My Awesome dApp",
  "lastVerifiedAt": "2026-06-09T05:00:00Z",
  "expiresAt": "2026-06-10T05:00:00Z",
  "message": "Domain is verified"
}
```

### `GET /verify/domain?domain=example.com`

Lightweight domain status check (cached, no live DNS lookup). Ideal for wallet connection flows.

**Response (200):**
```json
{
  "domain": "my-dapp.com",
  "verified": true,
  "status": "verified",
  "appName": "My Awesome dApp",
  "lastVerifiedAt": "2026-06-09T05:00:00Z",
  "expiresAt": "2026-06-10T05:00:00Z"
}
```

## Verification Flow

### For dApp Developers

1. **Register your domain:**
   ```bash
   curl -X POST https://verify.cinacoin.com/verify/register \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"domain": "my-dapp.com", "appName": "My dApp"}'
   ```

2. **Add DNS TXT record:**
   - Type: `TXT`
   - Host: `_cinacoin-verify.my-dapp.com`
   - Value: `cinacoin-verify-a1b2c3d4e5f6...` (the token from step 1)

3. **Wait for DNS propagation** (usually 1-5 minutes)

4. **Verify your domain:**
   ```bash
   curl "https://verify.cinacoin.com/verify/check?domain=my-dapp.com"
   ```

### For Wallet Integration

When a user connects their wallet to a dApp, verify the domain:

```typescript
import { CINAcoinVerifyClient } from '@cinacoin/verify-sdk';

const client = new CINAcoinVerifyClient();

async function onCinacoin(dappDomain: string) {
  const result = await client.checkDomain(dappDomain);
  
  if (result.verified) {
    // Show green checkmark, proceed with connection
    showVerifiedBadge(result.appName);
  } else {
    // Show warning to user
    showWarning('This dApp is not verified. Proceed with caution.');
  }
}
```

### React Hook (for React-based wallets)

```tsx
import { createUseDomainVerification } from '@cinacoin/verify-sdk';
import React from 'react';

const useDomainVerification = createUseDomainVerification(React);

function CinacoinModal({ dappDomain }: { dappDomain: string }) {
  const { verified, status, appName, loading } = useDomainVerification(dappDomain);

  return (
    <div className="connect-modal">
      {loading ? (
        <p>Verifying domain...</p>
      ) : verified ? (
        <div className="verified-badge">
          ✅ {appName || dappDomain} is verified
        </div>
      ) : (
        <div className="warning-badge">
          ⚠️ Domain not verified. Proceed with caution.
        </div>
      )}
      <button>Connect Wallet</button>
    </div>
  );
}
```

## Deployment

### Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Domain `cinacoin.com` managed in Cloudflare DNS

### Setup

1. **Install dependencies:**
   ```bash
   cd workers/verify-service
   npm install
   ```

2. **Create KV namespace:**
   ```bash
   wrangler kv:namespace create VERIFY_KV
   # Note the ID and update wrangler.toml
   ```

3. **Set secrets:**
   ```bash
   wrangler secret put ADMIN_API_KEY
   # Enter a strong random key (min 32 chars)
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

### Local Development

```bash
# Copy example env
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your local secrets

# Start dev server
npm run dev
```

## Configuration

Environment variables (set in `wrangler.toml` or via `wrangler secret put`):

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_API_KEY` | Secret key for `/verify/register` | (required) |
| `DNS_OVER_HTTPS_PROVIDER` | DNS provider: `cloudflare` or `google` | `cloudflare` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://cinacoin.com` |
| `DNS_TXT_PREFIX` | DNS TXT record prefix | `_cinacoin-verify` |
| `CACHE_TTL_SECONDS` | KV cache TTL | `3600` |
| `MAX_REGISTERED_DOMAINS` | Max domains allowed | `10000` |

## Security Considerations

- **Admin API Key**: The `/verify/register` endpoint requires authentication. Keep this key secure.
- **DNS Verification**: Only the domain owner can add TXT records, proving ownership.
- **Cache Expiry**: Verified domains expire after 24 hours, requiring re-verification.
- **Rate Limiting**: Consider adding rate limiting for high-traffic endpoints (future enhancement).
- **Fail-Safe**: If DNS lookup fails, the system returns cached status (fail-open for UX, but logs errors).

## Testing

```bash
# Run unit tests
npm test

# Manual testing
curl "http://localhost:8787/verify/domain?domain=example.com"
curl "http://localhost:8787/verify/check?domain=example.com"
```

## Future Enhancements

- [ ] Admin dashboard for managing registered domains
- [ ] Automated DNS re-verification cron job
- [ ] Webhook notifications when domain status changes
- [ ] Rate limiting per IP/API key
- [ ] Bulk domain registration
- [ ] Domain ownership transfer
- [ ] Integration with CINAcoin wallet SDK

## License

Proprietary - CINAcoin Project
