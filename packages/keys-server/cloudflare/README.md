# Keys Server — Cloudflare Workers

Cloudflare Workers migration of the keys-server, using KV for storage and Web Crypto API for encryption.

## Architecture

- **Runtime:** Cloudflare Workers (V8 isolates)
- **Storage:** KV Namespaces (keys + rate-limit counters)
- **Encryption:** AES-256-GCM via Web Crypto API
- **Key Derivation:** PBKDF2 (Workers-native, replaces scrypt)
- **Auth:** JWT (HS256) — compatible with existing token format

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/keys` | Generate a new key |
| `GET` | `/keys/:id` | Retrieve key metadata |
| `DELETE` | `/keys/:id` | Delete a key |
| `POST` | `/keys/:id/rotate` | Rotate (re-encrypt) a key |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Metrics (counters) |

## Setup

```bash
# Install dependencies
npm install

# Create KV namespaces
wrangler kv:namespace create KEYS_KV
wrangler kv:namespace create RATELIMIT_KV

# Update wrangler.toml with the namespace IDs

# Set secrets
wrangler secret put ENCRYPTION_KEY
wrangler secret put JWT_SECRET

# Deploy
wrangler deploy
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | ✅ | Min 64 hex chars (32 bytes). Used for AES-256-GCM encryption |
| `JWT_SECRET` | ✅ | Min 32 chars. Used for JWT HS256 validation |
| `CORS_ORIGINS` | ❌ | Comma-separated origins. Default: `*` |
| `RATE_LIMIT_MAX` | ❌ | Max requests per window. Default: `100` |
| `RATE_LIMIT_WINDOW` | ❌ | Window in seconds. Default: `60` |

## Differences from Node.js/Rust Implementation

| Feature | Original | Cloudflare Workers |
|---------|----------|-------------------|
| Key derivation | scrypt | PBKDF2 (100k iterations) |
| Runtime | Node.js / Axum (Rust) | V8 isolates |
| Storage | Redis / in-memory | KV Namespace |
| Crypto | Node.js `crypto` | Web Crypto API |
| Rate limiting | Not implemented | KV-backed per-IP |

## KV Key Schema

- `key:{uuid}` — StoredKey JSON
- `ratelimit:{ip}` — RateLimitEntry JSON
- `metrics:global` — MetricsData JSON
