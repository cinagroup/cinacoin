# Cinacoin Auth Service - Cloudflare Workers

Authentication service migrated from Next.js to Cloudflare Workers with Hono framework.

## Architecture

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight, fast)
- **Database**: Cloudflare D1 (SQLite)
- **Cache/Rate Limiting**: Cloudflare KV
- **Password Hashing**: PBKDF2-SHA256 (Web Crypto API)
- **JWT**: jose library (Web Crypto compatible)
- **TOTP**: otpauth library

## Features

- ✅ Email/password authentication
- ✅ JWT access + refresh tokens with rotation
- ✅ Multi-factor authentication (TOTP)
- ✅ Recovery codes
- ✅ OAuth 2.0 (Google, GitHub, Discord)
- ✅ Rate limiting (KV-based sliding window)
- ✅ Token reuse detection
- ✅ Security event logging

## Project Structure

```
workers/auth-service/
├── src/
│   ├── index.ts              # Worker entry point
│   ├── routes/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts
│   │   │   ├── refresh.ts
│   │   │   ├── me.ts
│   │   │   └── change-password.ts
│   │   ├── mfa/
│   │   │   └── index.ts      # MFA routes (enable, verify, disable, status)
│   │   └── oauth/
│   │       └── index.ts      # OAuth routes
│   ├── lib/
│   │   ├── types.ts          # Type definitions
│   │   ├── jwt.ts            # JWT generation/verification
│   │   ├── password.ts       # Password hashing (PBKDF2)
│   │   ├── totp.ts           # TOTP implementation
│   │   ├── validation.ts     # Zod schemas
│   │   ├── token-rotation.ts # Refresh token rotation
│   │   └── utils.ts          # Utility functions
│   ├── db/
│   │   ├── users.ts          # User queries
│   │   └── mfa.ts            # MFA queries
│   └── middleware/
│       ├── auth.ts           # JWT authentication
│       └── rate-limit.ts     # Rate limiting
├── migrations/
│   └── 001_init.sql          # D1 schema
├── wrangler.toml             # Workers configuration
├── package.json
└── tsconfig.json
```

## Migration Changes

### Database: PostgreSQL → D1 (SQLite)

- `$1, $2` → `?` placeholders
- `NOW()` → `datetime('now')`
- `INTERVAL '5 minutes'` → manual timestamp calculation
- `RETURNING *` → separate SELECT after INSERT
- `SERIAL` → `INTEGER PRIMARY KEY AUTOINCREMENT`
- `BOOLEAN` → `INTEGER` (0/1)
- `JSONB` → `TEXT` (JSON.stringify/parse)

### Password Hashing: Argon2id → PBKDF2-SHA256

- Argon2 requires native bindings (not available in Workers)
- PBKDF2 with 600,000 iterations (OWASP recommended)
- Uses Web Crypto API (native to Workers)
- Format: `$pbkdf2-sha256$iterations$salt$hash`

### JWT: jsonwebtoken → jose

- `jsonwebtoken` uses Node.js crypto (not available in Workers)
- `jose` is Web Crypto compatible
- Async API (all operations return Promises)

### Rate Limiting: Redis → Workers KV

- Sliding window algorithm using KV arrays
- TTL-based expiration
- Per-IP and per-user limits

### OAuth: arctic → Manual implementation

- `arctic` requires Node.js crypto
- Direct fetch() calls to OAuth providers
- PKCE support for Google

## Deployment

### Prerequisites

```bash
npm install -g wrangler
wrangler login
```

### Setup

1. Create D1 database:
```bash
wrangler d1 create cinacoin-auth
```

2. Update `wrangler.toml` with database ID

3. Create KV namespace:
```bash
wrangler kv:namespace create KV
```

4. Update `wrangler.toml` with KV namespace ID

5. Set secrets:
```bash
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put DISCORD_CLIENT_ID
wrangler secret put DISCORD_CLIENT_SECRET
```

6. Run migrations:
```bash
wrangler d1 execute cinacoin-auth --file=./migrations/001_init.sql
```

### Deploy

```bash
npm run deploy
```

### Local Development

```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register new user
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `POST /auth/change-password` - Change password

### MFA
- `POST /auth/mfa/enable` - Start TOTP setup
- `POST /auth/mfa/verify` - Verify TOTP code
- `POST /auth/mfa/verify-login` - Verify MFA during login
- `POST /auth/mfa/disable` - Disable MFA
- `GET /auth/mfa/status` - Get MFA status

### OAuth
- `GET /auth/oauth/:provider` - Start OAuth flow
- `GET /auth/oauth/:provider/callback` - OAuth callback
- `GET /auth/oauth/accounts` - Get linked accounts

## Security Features

- ✅ Password hashing with PBKDF2-SHA256 (600k iterations)
- ✅ JWT with RS256-like separation (access/refresh secrets)
- ✅ Refresh token rotation with reuse detection
- ✅ Rate limiting (5 login attempts per 15 min)
- ✅ MFA with TOTP and recovery codes
- ✅ CORS configuration
- ✅ Security event logging
- ✅ Token blacklisting ready (KV)

## Performance Notes

- Workers CPU time limit: 10ms (free) / 30s (paid)
- PBKDF2 600k iterations: ~50-100ms (consider reducing to 300k for free tier)
- D1 queries: ~1-5ms typical
- KV operations: ~1-3ms typical
- JWT operations: <1ms

## Limitations

- No WebAuthn/Passkeys (requires @simplewebauthn/server, not Workers-compatible)
- No Web3/SIWE (requires viem, not Workers-compatible)
- PBKDF2 slower than Argon2 (but Workers-compatible)
- KV rate limiting less precise than Redis

## Testing

```bash
npm test
```

## License

MIT
