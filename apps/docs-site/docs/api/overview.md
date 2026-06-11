---
sidebar_position: 1
title: API Overview
description: Overview of the CinaCoin REST API architecture and services
---

# API overview.

CinaCoin provides a comprehensive REST API for integrating with our platform. The API is organized into three main services:

## Architecture.

```
┌─────────────────┐
│   API Gateway   │  ← Entry point (api.cinacoin.com)
│   Port 8787     │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    │         │            │
    ▼         ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐
│  Auth  │ │  User  │ │  Other   │
│Service │ │Service │ │ Services │
│ :8788  │ │ :8789  │ │          │
└────────┘ └────────┘ └──────────┘
```

## Services.

### API gateway.
**Base URL:** `https://api.cinacoin.com`

The main entry point for all API requests. Handles:
- Request routing to internal services
- Rate limiting (1000 req/hour per IP)
- CORS and security headers
- Health checks and monitoring

**Key Endpoints:**
- `/health` — Service health status
- `/auth/*` — Authentication (proxied to Auth Service)
- `/users/*` — User management (proxied to User Service)
- `/teams/*` — Team management (proxied to User Service)

### Auth service.
**Base URL:** `https://auth.cinacoin.com` (direct) or via Gateway

Handles authentication and authorization:
- User registration and login
- JWT token management (access + refresh tokens)
- Multi-factor authentication (TOTP)
- OAuth providers (Google, GitHub, Discord)
- Session management

**Security Features:**
- Mandatory 2FA for all users
- Refresh token rotation with reuse detection
- CSRF protection
- PKCE for OAuth flows

### User service.
**Base URL:** `https://users.cinacoin.com` (direct) or via Gateway

Manages user data and teams:
- User CRUD operations
- Team management and membership
- API key lifecycle
- Permission and scope management

**Storage:**
- D1 (SQLite) for persistent data
- KV for caching

## Base URLs.

| Environment | URL |
|-------------|-----|
| Production | `https://api.cinacoin.com` |
| Staging | `https://api-staging.cinacoin.com` |
| Development | `http://localhost:8787` |

## Quick start.

### 1. Get API credentials.

```bash
# Register a new account.
curl -X POST https://api.cinacoin.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "username": "yourname",
    "password": "SecureP@ss123"
  }'
```

### 2. Complete 2FA setup.

After registration, you'll receive an MFA challenge:

```json
{
  "success": true,
  "data": {
    "mfaRequired": true,
    "mfaSetupRequired": true,
    "mfaToken": "mfa_tok_...",
    "mfaTokenExpiresIn": 300
  }
}
```

Enable TOTP and verify:

```bash
# Enable MFA (returns QR code uri).
curl -X POST https://api.cinacoin.com/auth/mfa/enable \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Verify with code from authenticator app.
curl -X POST https://api.cinacoin.com/auth/mfa/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

### 3. Make authenticated requests.

```bash
# Get current user profile.
curl https://api.cinacoin.com/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Authentication.

All API requests require authentication via Bearer token:

```bash
Authorization: Bearer <access_token>
```

### Token types.

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 30 days | Obtain new access tokens |
| MFA Token | 5 minutes | Complete 2FA verification |

### Token refresh.

Access tokens expire quickly. Use the refresh token to obtain new credentials:

```bash
curl -X POST https://api.cinacoin.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

**Important:** Refresh tokens are single-use. Each refresh returns a new refresh token.

## Rate limiting.

Rate limits are enforced per IP address:

| Scope | Limit | Window |
|-------|-------|--------|
| Global | 1000 requests | 1 hour |
| Auth (login/register) | 10 requests | 15 minutes |
| Password reset | 5 requests | 1 hour |
| MFA verify | 10 requests | 15 minutes |

When rate limited, you'll receive:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

Response headers include:
- `X-RateLimit-Limit` — Maximum requests allowed
- `X-RateLimit-Remaining` — Requests remaining in window
- `X-RateLimit-Reset` — Unix timestamp when limit resets
- `Retry-After` — Seconds until you can retry

## Error handling.

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable description",
  "details": ["Additional validation errors"]
}
```

### Common error codes.

| Code | Meaning |
|------|---------|
| 400 | Bad Request — Invalid input or validation failed |
| 401 | Unauthorized — Missing or invalid authentication |
| 403 | Forbidden — Insufficient permissions or account suspended |
| 404 | Not Found — Resource doesn't exist |
| 409 | Conflict — Resource already exists (e.g., email taken) |
| 429 | Too Many Requests — Rate limit exceeded |
| 500 | Internal Server Error — Something went wrong on our end |

## CORS.

The API supports Cross-Origin Resource Sharing (CORS) for web applications:

**Allowed Origins:**
- `https://cinacoin.com`
- `https://wallet.cinacoin.com`
- `https://backend.cinacoin.com`

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:**
- `Content-Type`
- `Authorization`
- `X-CSRF-Token`
- `X-Session-ID`

## Next steps.

- [Authentication Guide](./authentication.md) — Detailed auth flow documentation
- [Rate Limiting](./rate-limiting.md) — Understanding rate limits
- [Error Codes](./errors.md) — Complete error reference
- [Interactive API Reference](/api-reference) — Try the API in your browser

## SDKs & libraries.

Official SDKs are available for popular languages:

- **JavaScript/TypeScript** — `@cinacoin/sdk`
- **Python** — `cinacoin-python`
- **Go** — `cinacoin-go`
- **Rust** — `cinacoin-rs`

See the [SDK documentation](/api/core-sdk) for installation and usage guides.

## Support.

- **Documentation:** [https://cinacoin.com/docs](https://cinacoin.com/docs)
- **API Status:** [https://status.cinacoin.com](https://status.cinacoin.com)
- **Developer Support:** [developers@cinacoin.com](mailto:developers@cinacoin.com)
- **Community:** [https://discord.gg/cinacoin](https://discord.gg/cinacoin)
