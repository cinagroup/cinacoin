# Cinacoin Architecture Audit Report

**Date:** 2026-06-09  
**Auditor:** Architecture Audit Expert (Subagent)  
**Scope:** `workers/api-gateway/`, `workers/auth-service/`, `workers/user-service/`  
**Stack:** Cloudflare Workers · Hono · D1 · KV · TypeScript

---

## Executive Summary

The Cinacoin backend is a three-service microservice architecture running on Cloudflare Workers. The code quality is generally high — good use of Hono framework, proper input validation with Zod, refresh token rotation, and rate limiting. However, there are **critical data duplication issues**, **inconsistent schemas across services**, and **missing cross-cutting concerns** that will cause operational pain at scale.

**Overall Architecture Score: 58 / 100**

| Dimension | Score | Rating |
|-----------|-------|--------|
| Service Splitting | 55/100 | 🟠 Needs Work |
| API Design | 62/100 | 🟡 Acceptable |
| Data Architecture | 40/100 | 🔴 Critical Issues |
| Communication Patterns | 70/100 | 🟡 Good |
| Scalability | 60/100 | 🟡 Moderate |
| Deployment Architecture | 50/100 | 🟠 Needs Work |
| Storage Strategy | 65/100 | 🟡 Good |
| Dependency Management | 55/100 | 🟠 Needs Work |

---

## 1. Service Splitting

### Current Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  API Gateway     │────▶│  Auth Service    │     │  User Service    │
│  (cinacoin-api)  │     │  (cinacoin-auth) │     │  (cinacoin-users)│
│  api.cinacoin.com│────▶│  auth.cinacoin   │     │  users.cinacoin  │
│                  │     │     .com         │     │     .com         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
    [RATE_LIMIT_KV]          [D1 + KV]                [D1]
```

### Findings

| # | Severity | File | Finding |
|---|----------|------|---------|
| 1.1 | 🔴 Critical | `auth-service/src/db/users.ts` + `user-service/src/db/schema.ts` | **Dual User Tables**: Both services maintain independent `users` tables with **incompatible schemas**. Auth uses TEXT timestamps (`created_at TEXT`), User Service uses INTEGER timestamps (`created_at INTEGER`). This creates a data synchronization nightmare. |
| 1.2 | 🟠 High | `auth-service/migrations/001_init.sql:5-20` vs `user-service/migrations/0001_init.sql:5-16` | **Schema Divergence**: Auth users table has `password_hash, role, mfa_enabled, mfa_required, oauth_providers, email_verified_at, last_login_at`. User-service users table has `avatar_url` but lacks `role, password_hash, mfa_enabled`. No clear "source of truth" for user identity. |
| 1.3 | 🟡 Medium | `api-gateway/src/index.ts:55-85` | **User Service handles teams + permissions + api-keys**: These are distinct domain concerns bundled into one service. As the system grows, this will become a monolith-within-microservice. |
| 1.4 | 🔵 Low | All services | **No shared library/package**: Common utilities (uuid, sha256, types) are duplicated across services with different implementations. |

### Recommendations

1. **Establish User Data Ownership**: Designate ONE service as the authoritative user data store. Recommended: Auth Service owns identity (email, password, MFA), User Service owns profile (display_name, avatar, teams). Use event-driven sync or direct service calls.

2. **Split User Service further** as the domain grows:
   ```
   Proposed:
   ├── auth-service    (identity, auth, MFA, OAuth)
   ├── user-service    (profiles, preferences)
   ├── team-service    (teams, members, roles)
   ├── permission-service (RBAC, API keys)
   ```

3. **Create a shared package** (`@cinacoin/shared`) for common types, utilities, and validation schemas.

---

## 2. API Design

### Current Route Map

```
API Gateway (api.cinacoin.com)
├── GET  /health
├── GET  /
├── ALL  /auth/*        → Auth Service /auth/*
├── ALL  /users/*       → User Service /api/users/*
├── ALL  /teams/*       → User Service /api/teams/*
└── (404 handler)

Auth Service
├── POST /auth/login
├── POST /auth/register
├── POST /auth/logout
├── POST /auth/refresh
├── GET  /auth/me
├── POST /auth/change-password
├── POST /auth/mfa/enable
├── POST /auth/mfa/verify
├── POST /auth/mfa/verify-login
├── POST /auth/mfa/disable
├── GET  /auth/mfa/status
├── GET  /auth/oauth/:provider
├── GET  /auth/oauth/:provider/callback
└── GET  /auth/oauth/accounts

User Service
├── GET    /api/users
├── GET    /api/users/:id
├── POST   /api/users
├── PATCH  /api/users/:id
├── DELETE /api/users/:id
├── GET    /api/teams
├── GET    /api/teams/:teamId
├── POST   /api/teams
├── PATCH  /api/teams/:teamId
├── DELETE /api/teams/:teamId
├── GET    /api/teams/:teamId/members
├── POST   /api/teams/:teamId/members
├── PATCH  /api/teams/:teamId/members/:userId
├── DELETE /api/teams/:teamId/members/:userId
├── GET    /api/permissions
├── GET    /api/permissions/check
├── POST   /api/permissions
├── DELETE /api/permissions/:id
├── GET    /api/api-keys
├── POST   /api/api-keys
└── DELETE /api/api-keys/:id
```

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 2.1 | 🟠 High | `api-gateway/src/index.ts` | **No API Versioning**: No `/v1/` prefix in any route. Once breaking changes are needed, there's no migration path. |
| 2.2 | 🟡 Medium | `api-gateway/src/index.ts:65-75` | **Inconsistent Path Mapping**: Auth routes pass through as-is (`/auth/*` → `/auth/*`), but user/teams routes get `/api` prepended (`/users/*` → `/api/users/*`). This inconsistency makes the gateway routing logic fragile. |
| 2.3 | 🟡 Medium | `auth-service/src/routes/oauth/index.ts:175` | **Tokens in URL**: OAuth callback redirects with `?access_token=...&refresh_token=...` in the URL. Tokens in URLs are logged by browsers, proxies, and analytics. |
| 2.4 | 🟡 Medium | `user-service/src/routes/users.ts:41-50` | **No input validation library**: User service does manual validation (`if (!body.email ...)`), while auth service uses Zod. Inconsistent validation approach. |
| 2.5 | 🔵 Low | `auth-service/src/routes/mfa/index.ts:44-48` | **Dynamic import in route handler**: `await import('../../lib/jwt.js')` inside a handler — unnecessary code splitting in a Worker context. |
| 2.6 | 🟡 Medium | `user-service/src/routes/permissions.ts:37-55` | **Route ordering issue**: `/api/permissions/check` is defined AFTER `/api/permissions/:id` pattern could match it. Hono handles this correctly, but it's a maintenance risk. |

### Recommendations

1. **Add API versioning**: `/v1/auth/*`, `/v1/users/*`, `/v1/teams/*`
2. **Standardize path mapping**: Either all services use `/api/` prefix or none do
3. **Fix OAuth token delivery**: Use POST message (popup flow) or HTTP-only cookies instead of URL params
4. **Adopt Zod in user-service**: Share validation schemas from a common package
5. **Add OpenAPI/Swagger spec**: Auto-generate from Hono routes using `@hono/zod-openapi`

---

## 3. Data Architecture

### Auth Service D1 Schema (13 tables)

```
users ─┬── mfa_methods (1:N)
       ├── oauth_accounts (1:N)
       ├── token_families (1:N) ── sessions (1:N)
       ├── security_events (1:N)
       ├── auth_audit_log (1:N)
       ├── mfa_sessions (1:N)
       ├── mfa_challenges (1:N)
       ├── passkeys (1:N)
       ├── web3_wallets (1:N)
       └── webauthn_challenges
```

### User Service D1 Schema (5 tables)

```
users ─┬── team_members (N:M) ── teams (1:N)
       ├── permissions (1:N)
       └── api_keys (1:N)
```

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 3.1 | 🔴 Critical | `auth-service/migrations/001_init.sql:5` vs `user-service/migrations/0001_init.sql:6` | **Incompatible User Schemas**: Auth uses `created_at TEXT NOT NULL DEFAULT (datetime('now'))`, User Service uses `created_at INTEGER NOT NULL`. Same entity, different databases, incompatible types. No sync mechanism exists. |
| 3.2 | 🔴 Critical | `auth-service/src/db/users.ts` + `user-service/src/db/queries.ts` | **No User Sync Mechanism**: When a user registers via auth-service, there's no code that creates a corresponding record in user-service's database. The two user tables will diverge immediately. |
| 3.3 | 🟠 High | `auth-service/migrations/001_init.sql:109-118` | **Sessions table has redundant columns**: Both `token_hash` and `refresh_token_hash` are set to the same value in `token-rotation.ts:72-73`. The INSERT uses both columns but binds the same `newTokenHash` to both. |
| 3.4 | 🟠 High | `auth-service/migrations/001_init.sql:109` | **Missing `refresh_token_hash` column in migration**: The sessions INSERT in `token-rotation.ts:68` references `refresh_token_hash` column, but the migration DDL at line 109 doesn't define it. This will cause a runtime error. |
| 3.5 | 🟠 High | `auth-service/migrations/001_init.sql` | **No indexes on sessions.expires_at**: Sessions are queried by token_hash but also need cleanup by expires_at. Missing index will cause full table scans as data grows. |
| 3.6 | 🟡 Medium | `user-service/migrations/0001_init.sql:39` | **No composite index on permissions(resource, action, user_id)**: The `checkPermission` query filters by all three but only has `idx_permissions_resource_action` and `idx_permissions_user` separately. |
| 3.7 | 🟡 Medium | `auth-service/migrations/001_init.sql:48-55` | **MFA sessions use AUTOINCREMENT integer PK**: Inconsistent with other tables using TEXT UUIDs. Minor but creates inconsistency in the data layer. |
| 3.8 | 🟡 Medium | `auth-service/src/db/mfa.ts:111-115` | **Recovery codes stored as JSON in TEXT column**: `recovery_codes_hash` stores a JSON array of hashes. This is fine for small counts but makes individual code lookup/updates O(n) in application code. |
| 3.9 | 🔵 Low | `user-service/src/db/queries.ts:11` | **ID generation inconsistency**: Uses `crypto.randomUUID()` while auth-service uses a custom `uuidv4()` function. Both produce v4 UUIDs but the implementations differ. |

### Recommendations

1. **🔴 URGENT: Fix the sessions table migration** — add the missing `refresh_token_hash` column or remove it from the INSERT statement
2. **Implement user sync**: When auth-service creates a user, it should call user-service (via service binding) to create the corresponding profile record
3. **Standardize timestamp formats**: Choose either ISO strings or Unix timestamps and use consistently
4. **Add missing indexes**: `sessions(expires_at)`, `permissions(resource, action, user_id)`
5. **Consider a shared migration tool**: Both services should use the same migration naming convention (`001_` vs `0001_`)

---

## 4. Communication Patterns

### Current Pattern: Synchronous Service Bindings

```typescript
// api-gateway/src/index.ts:55-65
app.all('/auth/*', async (c) => {
  const url = new URL(c.req.url)
  const request = new Request(url.toString(), c.req.raw)
  return c.env.AUTH_SERVICE.fetch(request)
})
```

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 4.1 | 🟠 High | `api-gateway/src/index.ts:55-85` | **No circuit breaker or timeout**: If auth-service or user-service is slow/down, the gateway will hang until Cloudflare's default timeout. No fallback or degraded response. |
| 4.2 | 🟠 High | `api-gateway/src/index.ts:60` | **Request body not forwarded correctly for all methods**: Creating `new Request(url.toString(), c.req.raw)` should work, but URL manipulation + raw request cloning can cause issues with certain content types and streaming. |
| 4.3 | 🟡 Medium | All services | **No async communication**: All inter-service communication is synchronous request/response. No use of Cloudflare Queues for eventual consistency (e.g., user creation events, security event publishing). |
| 4.4 | 🟡 Medium | `auth-service/src/routes/auth/login.ts:67-71` | **No correlation/request ID propagation**: The gateway doesn't inject a request ID that flows through to downstream services, making distributed tracing impossible. |
| 4.5 | 🔵 Low | `api-gateway/wrangler.toml:14-20` | **Service bindings are correct**: Uses Cloudflare's native service-to-service bindings (no HTTP overhead). Good architectural choice. |

### Recommendations

1. **Add request ID propagation**: Gateway generates X-Request-Id, passes to downstream services
2. **Implement circuit breaker pattern**: Use KV to track service health, short-circuit failing services
3. **Add Cloudflare Queues** for:
   - User creation events (auth → user service sync)
   - Security event logging (async, non-blocking)
   - Audit trail publishing
4. **Add timeouts**: Set explicit fetch timeouts on service binding calls

---

## 5. Scalability

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 5.1 | 🟠 High | `auth-service/src/lib/password.ts:8` | **PBKDF2 iterations capped at 100,000**: Comment says "Cloudflare Workers limits PBKDF2 to 100,000 iterations max" but OWASP recommends 600,000+. This is a security compromise. The README mentions 600k but code uses 100k. |
| 5.2 | 🟡 Medium | `auth-service/src/middleware/rate-limit.ts:50-70` | **Rate limiting stores arrays in KV**: Each rate limit key stores a JSON array of timestamps. For high-traffic endpoints, these arrays grow and approach KV's 25MB value limit. Also, KV reads/writes add latency to every request. |
| 5.3 | 🟡 Medium | `api-gateway/src/index.ts:25-35` | **Gateway rate limiting is separate from service rate limiting**: Gateway has its own KV-based fixed-window rate limiter, and auth-service has a sliding-window limiter. Double rate limiting adds latency without clear benefit. |
| 5.4 | 🟡 Medium | `auth-service/src/db/users.ts` | **No connection pooling concerns**: D1 handles this automatically, but each query is a separate round-trip. Login flow does 4+ sequential queries (find user → check MFA → update last login → record token). |
| 5.5 | 🔵 Low | All services | **Stateless design ✓**: Workers are inherently stateless. No in-memory sessions. Good for horizontal scaling. |
| 5.6 | 🟡 Medium | `auth-service/src/lib/token-rotation.ts` | **Token rotation does 4+ DB writes per refresh**: Revoke old → insert new → log event → (potentially revoke all). This is correct for security but adds latency on every token refresh. |

### Recommendations

1. **Batch D1 queries**: Use `db.batch()` for login flow (find user + check MFA can be parallel)
2. **Consolidate rate limiting**: Use only gateway-level OR service-level, not both
3. **Consider D1 prepared statement caching**: Pre-prepare frequently used statements
4. **Evaluate PBKDF2 limitation**: Research if Workers' limit has been raised, or consider a KDF that works within CPU limits

---

## 6. Deployment Architecture

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 6.1 | 🔴 Critical | `auth-service/wrangler.toml:31-40` | **Staging uses unresolved template variables**: `${D1_STAGING_DATABASE_ID}` and `${KV_STAGING_NAMESPACE_ID}` are not valid wrangler.toml syntax. Wrangler doesn't support env var interpolation in TOML. This staging config will fail to deploy. |
| 6.2 | 🟠 High | `user-service/wrangler.toml` | **No staging environment for user-service**: Only auth-service has a staging config. User-service and api-gateway have no environment separation. |
| 6.3 | 🟠 High | `api-gateway/wrangler.toml` | **No staging environment for api-gateway**: Service bindings point to production service names. No way to test gateway routing against staging backends. |
| 6.4 | 🟠 High | All `wrangler.toml` | **Inconsistent compatibility dates**: api-gateway uses `2024-01-01`, auth-service uses `2024-12-01`. This can cause subtle behavioral differences in the Workers runtime. |
| 6.5 | 🟡 Medium | All services | **No CI/CD configuration**: No GitHub Actions, no deploy scripts, no preview deployments. |
| 6.6 | 🟡 Medium | `user-service/wrangler.toml:12-13` | **Secrets referenced in comments only**: `JWT_SECRET` and `ADMIN_API_KEY` are mentioned in comments but there's no `.dev.vars.example` for auth-service (user-service has one). |
| 6.7 | 🟡 Medium | `api-gateway/wrangler.toml:9-11` | **Custom domain and routes both defined**: Having both `[[routes]]` and potentially a custom domain can cause routing conflicts. |
| 6.8 | 🔵 Low | `user-service/.gitignore` | **Good**: `.dev.vars` is properly gitignored. |

### Recommendations

1. **🔴 Fix staging config**: Use wrangler's `[env.staging]` properly — actual IDs must be hardcoded or use `wrangler deploy --env staging` with separate config
2. **Add staging for all services**: Create `env.staging` sections in user-service and api-gateway
3. **Standardize compatibility_date**: Use the same date across all services
4. **Add CI/CD**: GitHub Actions workflow with:
   - `wrangler deploy --env staging` on PR
   - `wrangler deploy` on main merge
   - Preview deployments for PRs
5. **Add `.dev.vars.example`** to auth-service

---

## 7. Storage Strategy

### Current Usage

| Storage | Service | Use Case | Assessment |
|---------|---------|----------|------------|
| D1 | auth-service | Users, sessions, MFA, OAuth, security events | ✅ Appropriate |
| D1 | user-service | Users, teams, permissions, API keys | ✅ Appropriate |
| KV | api-gateway | Rate limiting (fixed window) | ✅ Appropriate |
| KV | auth-service | Rate limiting (sliding window), OAuth state | ⚠️ Overlapping use |
| R2 | (none) | Not used | 🔵 Could use for avatars |

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 7.1 | 🟠 High | `api-gateway/wrangler.toml:17` + `auth-service/wrangler.toml:21` | **Same KV namespace shared**: Both gateway and auth-service bind to KV namespace ID `dceb86e5cb4c4a008013c8cf21d7181c`. This means they share the same keyspace — rate limit keys could collide, and there's no isolation. |
| 7.2 | 🟡 Medium | `auth-service/src/routes/oauth/index.ts:45-48` | **OAuth state in KV with 10-min TTL**: Correct approach, but no cleanup mechanism for abandoned flows. KV's TTL handles this, but monitoring would be wise. |
| 7.3 | 🟡 Medium | `auth-service/src/db/mfa.ts:107-115` | **Recovery codes in D1 as JSON**: Acceptable for now, but if recovery codes need to be audited individually, a separate table would be better. |
| 7.4 | 🔵 Low | `user-service/src/db/schema.ts:12` | **avatar_url stored but no R2**: User service has `avatar_url` field but no R2 bucket configured for uploads. Currently relies on external URLs. |
| 7.5 | 🟡 Medium | `auth-service/migrations/001_init.sql:89` | **OAuth access_token stored in plaintext**: `access_token TEXT` in oauth_accounts. Should be encrypted at minimum. |

### Recommendations

1. **Separate KV namespaces**: Give gateway and auth-service their own KV bindings
2. **Encrypt OAuth tokens**: Use encryption before storing provider access tokens
3. **Consider R2 for avatars**: When implementing avatar uploads, use R2 with signed URLs
4. **Add KV monitoring**: Track KV operation counts and sizes for cost management

---

## 8. Dependency Management

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 8.1 | 🔴 Critical | `auth-service/src/lib/token-rotation.ts:68` + `auth-service/migrations/001_init.sql:109` | **Schema/code mismatch — `refresh_token_hash` column**: The INSERT statement references a `refresh_token_hash` column that doesn't exist in the migration. **This will crash at runtime** when rotating tokens. |
| 8.2 | 🟠 High | `auth-service/src/lib/types.ts` + `user-service/src/db/schema.ts` | **Duplicate type definitions**: `UserRecord` (auth) vs `User` (user-service) represent the same entity with different fields and types. Changes to one won't propagate to the other. |
| 8.3 | 🟠 High | `auth-service/src/lib/utils.ts:8-20` vs `user-service/src/db/queries.ts:11` | **Duplicated UUID generation**: Auth has custom `uuidv4()`, user-service uses `crypto.randomUUID()`. Both work but create maintenance burden. |
| 8.4 | 🟠 High | `auth-service/src/middleware/auth.ts` vs `user-service/src/middleware/auth.ts` | **Completely different auth mechanisms**: Auth-service uses JWT verification, user-service uses API key hashing. This is architecturally valid (different auth strategies for different consumers) but the middleware interfaces are incompatible — no shared auth contract. |
| 8.5 | 🟡 Medium | `auth-service/package.json` + `user-service/package.json` | **Different Hono versions**: Auth uses `^4.4.0`, gateway uses `^4.0.0`. Minor but could cause behavioral differences. |
| 8.6 | 🟡 Medium | `auth-service/src/lib/password.ts:8` vs README | **Documentation mismatch**: README claims "PBKDF2 with 600,000 iterations" but code uses 100,000. |
| 8.7 | 🔵 Low | `user-service/package.json:11` | **nanoid dependency declared but not used**: `nanoid` is in dependencies but `queries.ts` uses `crypto.randomUUID()` instead. |

### Recommendations

1. **🔴 URGENT: Fix the `refresh_token_hash` column mismatch** — either add it to the migration or remove it from the INSERT
2. **Create `@cinacoin/shared` package** with:
   - Common types (User, Token, etc.)
   - Utility functions (uuid, sha256, timestamps)
   - Validation schemas (Zod)
   - Auth middleware interfaces
3. **Align Hono versions** across all services
4. **Remove unused dependencies** (nanoid in user-service)
5. **Fix documentation** to match actual PBKDF2 iteration count

---

## Security Audit Summary

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| S.1 | 🔴 | `refresh_token_hash` column missing from migration — token rotation will crash | `migrations/001_init.sql:109` |
| S.2 | 🟠 | OAuth tokens in redirect URL (logged by browsers/proxies) | `oauth/index.ts:175` |
| S.3 | 🟠 | OAuth access_token stored plaintext in D1 | `migrations/001_init.sql:89` |
| S.4 | 🟠 | Logout doesn't actually invalidate tokens (commented-out blacklist) | `auth/logout.ts:22-26` |
| S.5 | 🟠 | MFA disable endpoint accepts disable without valid TOTP code if `confirmDisable: true` | `mfa/index.ts:173-183` |
| S.6 | 🟡 | PBKDF2 at 100k iterations (below OWASP recommendation) | `password.ts:8` |
| S.7 | 🟡 | User-service CORS allows `*` in production (TODO comment) | `user-service/index.ts:34` |
| S.8 | 🟡 | Admin API key comparison is not constant-time | `user-service/middleware/auth.ts:32` |
| S.9 | 🔵 | No CSRF protection on OAuth flows (state parameter helps but PKCE uses `plain`) | `oauth/index.ts:51` |

---

## Architecture Diagram (Current State)

```
                              ┌──────────────────────────────────────────┐
                              │          Cloudflare Edge                  │
                              │                                          │
  Client ────────────────────▶│  api.cinacoin.com (API Gateway)          │
   (Web/App)                  │  ┌─────────────────────────────────┐     │
                              │  │ • CORS                          │     │
                              │  │ • Fixed-window rate limit (KV)  │     │
                              │  │ • Route proxying                │     │
                              │  └──────┬──────────┬───────────────┘     │
                              │         │          │                     │
                              │    /auth/*     /users/*, /teams/*        │
                              │         │          │                     │
                              │         ▼          ▼                     │
                              │  ┌──────────┐  ┌──────────────┐         │
                              │  │  Auth     │  │   User       │         │
                              │  │  Service  │  │   Service    │         │
                              │  │           │  │              │         │
                              │  │ ┌───────┐ │  │ ┌──────────┐ │         │
                              │  │ │D1 Auth│ │  │ │D1 Users  │ │         │
                              │  │ │  DB   │ │  │ │   DB     │ │         │
                              │  │ └───────┘ │  │ └──────────┘ │         │
                              │  │ ┌───────┐ │  │              │         │
                              │  │ │Shared │ │  │              │         │
                              │  │ │  KV   │ │  │              │         │
                              │  │ └───────┘ │  │              │         │
                              │  └──────────┘  └──────────────┘         │
                              └──────────────────────────────────────────┘

  ⚠️ PROBLEMS:
  ────────────
  1. Two separate "users" tables with incompatible schemas
  2. No sync mechanism between auth-DB users and user-DB users
  3. Shared KV namespace (no isolation)
  4. No staging environment for gateway/user-service
  5. Missing DB column will crash token rotation
```

---

## Proposed Target Architecture

```
                              ┌──────────────────────────────────────────┐
                              │          Cloudflare Edge                  │
                              │                                          │
  Client ────────────────────▶│  api.cinacoin.com/v1/* (API Gateway)     │
                              │  ┌─────────────────────────────────┐     │
                              │  │ • CORS (restricted origins)     │     │
                              │  │ • Rate limiting (own KV)        │     │
                              │  │ • Request ID injection          │     │
                              │  │ • API versioning                │     │
                              │  │ • Circuit breaker               │     │
                              │  └──┬────────┬────────┬────────────┘     │
                              │     │        │        │                  │
                              │  /v1/auth  /v1/users  /v1/teams          │
                              │     │        │        │                  │
                              │     ▼        ▼        ▼                  │
                              │  ┌──────┐ ┌──────┐ ┌──────┐             │
                              │  │ Auth │ │ User │ │ Team │             │
                              │  │      │ │      │ │      │             │
                              │  │[D1]  │ │[D1]  │ │[D1]  │             │
                              │  │[KV]  │ │      │ │      │             │
                              │  └──┬───┘ └──────┘ └──────┘             │
                              │     │                                    │
                              │     │ (Queue: user.created)             │
                              │     └──────────▶ User Service           │
                              │                  (sync profile)         │
                              │                                          │
                              │  ┌─────────────────────────────────┐    │
                              │  │  @cinacoin/shared (npm package) │    │
                              │  │  • Types • Validation • Utils   │    │
                              │  └─────────────────────────────────┘    │
                              └──────────────────────────────────────────┘
```

---

## Priority Action Items

### 🔴 Immediate (Blocks Production)

1. **Fix `refresh_token_hash` column mismatch** in auth-service migration
   - File: `auth-service/migrations/001_init.sql` line 109
   - Add: `refresh_token_hash TEXT` column to sessions table
   - Or remove from INSERT in `token-rotation.ts:68`

2. **Implement user sync** between auth-service and user-service
   - Without this, the two user tables diverge from first registration

3. **Fix staging configuration** template variables
   - File: `auth-service/wrangler.toml` lines 35-36

### 🟠 Short-term (Within 2 weeks)

4. Separate KV namespaces for gateway and auth-service
5. Add staging environments for user-service and api-gateway
6. Standardize compatibility_date across all services
7. Fix OAuth token delivery (no tokens in URLs)
8. Encrypt OAuth access_tokens at rest
9. Add request ID propagation
10. Fix user-service CORS (remove `*` in production)

### 🟡 Medium-term (Within 1 month)

11. Create `@cinacoin/shared` package
12. Add API versioning (`/v1/`)
13. Implement Cloudflare Queues for async events
14. Add CI/CD pipeline
15. Consolidate rate limiting (single layer)
16. Add Zod validation to user-service
17. Add circuit breaker to gateway

### 🔵 Long-term (Within 3 months)

18. Split user-service into team-service and permission-service
19. Add R2 for avatar storage
20. Implement distributed tracing
21. Add comprehensive monitoring/alerting
22. Load testing and performance optimization

---

## Conclusion

The Cinacoin architecture demonstrates solid fundamentals — proper use of Cloudflare Workers primitives, good security practices (token rotation, rate limiting, MFA), and clean code organization within each service. However, the **dual user table problem** is a critical architectural flaw that will cause data inconsistency from day one. The **missing database column** will crash token rotation in production.

The most impactful improvements would be:
1. Fix the immediate bugs (schema mismatch, staging config)
2. Establish clear data ownership boundaries
3. Create shared packages to reduce duplication
4. Add proper environment separation

With these fixes, the architecture would score significantly higher (estimated 75-80/100).

---

*Report generated: 2026-06-09T02:34:00Z*  
*Files analyzed: 32 source files across 3 services*  
*Total lines of code: ~3,500 (excluding node_modules)*
