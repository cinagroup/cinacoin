# Cinacoin Unified Authentication Service — Phase 2 Implementation Plan

> **Version:** 2.0.0  
> **Created:** 2026-06-08  
> **Status:** Planning  
> **Duration:** 8 weeks  
> **Phase 1 Status:** ✅ Complete (email/password, JWT, basic RBAC)

---

## 1. Executive Summary

Phase 2 extends the Cinacoin Auth Service from basic email/password authentication to a comprehensive identity platform supporting social login, Web3 wallets, passkeys, MFA, team-based permissions, and enterprise-grade security controls.

### Phase 1 Recap (Current State)
- **Stack:** Next.js 15 API Routes, PostgreSQL, Argon2id, JWT (RS256-like dual-secret)
- **Endpoints:** register, login, refresh, me, change-password
- **RBAC:** Basic role enum (`user` | `admin` | `service`)
- **Security:** Argon2id hashing, Zod validation, Bearer token middleware

### Phase 2 Goals
1. Support 5+ authentication methods (OAuth, Web3, Passkey, Magic Link, TOTP MFA)
2. Advanced RBAC with teams, resource-level permissions, and temporal grants
3. Enterprise security (rate limiting, session management, audit logging, password policies)
4. User-facing management UI components

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│  (Web DApp, Mobile, Desktop, CLI)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    API Gateway / Rate Limiter                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Rate Limiter │  │ CORS Handler │  │ Request ID Injection   │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Auth Service (Next.js 15)                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Authentication Strategies                       │ │
│  │  ┌──────────┐ ┌───────┐ ┌──────┐ ┌───────────┐ ┌───────┐ │ │
│  │  │ Email/   │ │OAuth/ │ │Web3/ │ │ Passkey/  │ │ Magic │ │ │
│  │  │ Password │ │ OIDC  │ │SIWE  │ │ WebAuthn  │ │ Link  │ │ │
│  │  └──────────┘ └───────┘ └──────┘ └───────────┘ └───────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Token & Session Layer                            │ │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐│ │
│  │  │ JWT Mgr  │ │ Session Store│ │ TOTP / MFA Validator     ││ │
│  │  └──────────┘ └──────────────┘ └──────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Authorization Layer                              │ │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐│ │
│  │  │ RBAC v2  │ │ Team Manager │ │ Permission Evaluator     ││ │
│  │  └──────────┘ └──────────────┘ └──────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Security & Audit                                 │ │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐│ │
│  │  │ Audit    │ │ Password     │ │ Anomaly                   ││ │
│  │  │ Logger   │ │ Policy Engine│ │ Detector                  ││ │
│  │  └──────────┘ └──────────────┘ └──────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     Data Layer (PostgreSQL)                       │
│  users │ sessions │ oauth_accounts │ web3_wallets │ passkeys    │
│  teams │ team_members │ permissions │ role_permissions           │
│  audit_logs │ totp_secrets │ api_keys │ magic_link_tokens        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Work Breakdown Structure

### Sprint 1 (Weeks 1–2): Foundation & OAuth 2.0

**Goal:** Lay the database groundwork and implement OAuth 2.0 / OIDC social login.

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Database migration: `oauth_accounts`, `sessions` tables | P0 | 2d | — |
| OAuth 2.0 provider abstraction layer | P0 | 3d | DB migration |
| Google OIDC integration | P0 | 2d | Abstraction layer |
| GitHub OAuth integration | P1 | 1d | Abstraction layer |
| Discord OAuth integration | P2 | 1d | Abstraction layer |
| Account linking (connect multiple providers) | P0 | 2d | OAuth providers |
| Unit + integration tests for OAuth flows | P0 | 2d | All above |

**Deliverables:**
- Working social login for Google, GitHub, Discord
- `oauth_accounts` table with provider abstraction
- Account linking API

### Sprint 2 (Weeks 3–4): Web3 & Passkey Authentication

**Goal:** Add blockchain wallet sign-in and FIDO2 passkey support.

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Database migration: `web3_wallets`, `passkeys` tables | P0 | 1d | — |
| SIWE (Sign-In with Ethereum) implementation | P0 | 3d | DB migration |
| MetaMask / WalletConnect integration guide | P1 | 2d | SIWE |
| WebAuthn/FIDO2 registration flow | P0 | 3d | DB migration |
| WebAuthn/FIDO2 authentication flow | P0 | 2d | Registration |
| EIP-4361 message format compliance | P1 | 1d | SIWE |
| Tests for Web3 + Passkey flows | P0 | 2d | All above |

**Deliverables:**
- SIWE nonce generation and signature verification
- WebAuthn registration and authentication endpoints
- Passkey credential management

### Sprint 3 (Week 5): Magic Link & TOTP MFA

**Goal:** Complete all authentication methods.

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Database migration: `magic_link_tokens`, `totp_secrets` | P0 | 1d | — |
| Magic Link generation and email dispatch | P0 | 2d | DB migration |
| Magic Link verification and session creation | P0 | 1d | Generation |
| TOTP secret generation (RFC 4226/6238) | P0 | 2d | DB migration |
| TOTP enrollment flow (QR code provisioning) | P0 | 1d | TOTP generation |
| TOTP verification middleware | P0 | 1d | TOTP enrollment |
| MFA challenge-response in login flow | P0 | 2d | TOTP verification |
| Backup codes generation | P1 | 1d | TOTP enrollment |
| Tests for Magic Link + MFA | P0 | 1d | All above |

**Deliverables:**
- Passwordless email login
- Google Authenticator-compatible TOTP MFA
- MFA enforcement middleware

### Sprint 4 (Week 6): Advanced RBAC & Teams

**Goal:** Implement team-based permissions and resource-level access control.

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Database migration: `teams`, `team_members`, `permissions`, `role_permissions` | P0 | 2d | — |
| Team CRUD operations | P0 | 2d | DB migration |
| Team invitation system (email-based) | P1 | 2d | Team CRUD |
| Resource-level permission model (`resource:action:qualifier`) | P0 | 3d | DB migration |
| Permission inheritance engine | P0 | 2d | Permission model |
| Temporal permission grants (TTL-based) | P1 | 2d | Permission model |
| Updated auth middleware with permission checks | P0 | 1d | Permission engine |
| Tests for RBAC v2 | P0 | 1d | All above |

**Deliverables:**
- Full team lifecycle (create, invite, join, leave, remove)
- Resource-level permission evaluator
- Time-limited permission grants

### Sprint 5 (Week 7): Security Enhancements

**Goal:** Harden the system with rate limiting, session management, audit logging, and password policies.

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Rate limiting middleware (tiered by endpoint) | P0 | 2d | — |
| Database migration: `audit_logs`, enhanced `sessions` | P0 | 1d | — |
| Session management (list, revoke, multi-device) | P0 | 2d | Sessions table |
| Anomalous session detection | P2 | 2d | Session management |
| Audit log writer (all auth/permission events) | P0 | 2d | DB migration |
| Audit log query API (admin) | P1 | 1d | Audit writer |
| Password policy engine (HIBP, history, complexity) | P0 | 2d | — |
| API key management (create, revoke, scope) | P1 | 2d | — |
| Tests for security features | P0 | 1d | All above |

**Deliverables:**
- Rate limiting with Redis/token-bucket
- Full session lifecycle management
- Immutable audit trail
- HIBP password breach checking

### Sprint 6 (Week 8): UI Components & Integration Testing

**Goal:** Build user-facing management components and perform end-to-end testing.

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Profile management page (avatar, email, password) | P1 | 2d | — |
| Security settings page (MFA, sessions, API keys) | P1 | 2d | MFA + Sessions |
| Team management page (members, roles, invites) | P1 | 2d | Teams RBAC |
| Admin console (users, roles, system settings) | P1 | 2d | Audit + RBAC |
| End-to-end integration tests | P0 | 2d | All features |
| Load testing and performance benchmarks | P1 | 1d | All features |
| Documentation and API reference update | P0 | 1d | All features |
| Security audit and penetration testing | P0 | 2d | All features |

**Deliverables:**
- React component library for auth UI
- Comprehensive test suite
- Updated API documentation
- Security audit report

---

## 4. Database Schema Changes

### New Tables (Phase 2)

```sql
-- OAuth provider accounts
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,          -- 'google', 'github', 'discord'
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Web3 wallet connections
CREATE TABLE web3_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(42) NOT NULL,           -- 0x... Ethereum address
  chain_id INTEGER NOT NULL DEFAULT 1,
  wallet_type VARCHAR(50) NOT NULL,       -- 'metamask', 'walletconnect', 'coinbase'
  is_primary BOOLEAN DEFAULT FALSE,
  last_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(address, chain_id)
);

-- Passkey/FIDO2 credentials
CREATE TABLE passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id BYTEA NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type VARCHAR(50),                -- 'single_device', 'multi_device'
  backup_status VARCHAR(20),              -- 'backed_up', 'not_backed_up'
  transport VARCHAR(50)[] DEFAULT '{}',   -- 'usb', 'nfc', 'ble', 'internal'
  display_name VARCHAR(100),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL,       -- SHA-256 of refresh token
  device_info JSONB,                       -- { userAgent, os, browser, ip }
  ip_address INET,
  country_code VARCHAR(2),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TOTP MFA secrets
CREATE TABLE totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret BYTEA NOT NULL,                  -- Encrypted TOTP secret
  is_enabled BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[] DEFAULT '{}',       -- Hashed backup codes
  backup_codes_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Magic link tokens
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team memberships
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',  -- 'owner', 'admin', 'member', 'viewer'
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invitations
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permission definitions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,         -- 'project', 'document', 'wallet'
  action VARCHAR(50) NOT NULL,            -- 'create', 'read', 'update', 'delete', 'admin'
  qualifier VARCHAR(255),                 -- Specific resource ID or '*' for all
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource, action, qualifier)
);

-- Role-permission mappings
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,              -- 'user', 'admin', 'team_admin', etc.
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  scope VARCHAR(50) DEFAULT 'global',     -- 'global', 'team', 'personal'
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,  -- NULL for global
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,                 -- NULL = permanent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, permission_id, scope, team_id)
);

-- User-level permission grants (overrides/additions)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id, team_id)
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,                          -- NULL for system events
  actor_type VARCHAR(50) NOT NULL,        -- 'user', 'system', 'api_key'
  action VARCHAR(100) NOT NULL,           -- 'user.login', 'permission.grant', etc.
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success',  -- 'success', 'failure'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);

-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(128) NOT NULL UNIQUE,  -- SHA-256 of API key
  key_prefix VARCHAR(10) NOT NULL,        -- First 8 chars for identification
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password history (for preventing reuse)
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_history_user ON password_history(user_id, created_at DESC);
```

### Schema Migration Files

```
migrations/
  001_initial_schema.sql          ← Phase 1 (existing)
  002_oauth_accounts.sql          ← Phase 2 Sprint 1
  003_sessions_enhanced.sql       ← Phase 2 Sprint 1
  004_web3_wallets.sql            ← Phase 2 Sprint 2
  005_passkeys.sql                ← Phase 2 Sprint 2
  006_totp_secrets.sql            ← Phase 2 Sprint 3
  007_magic_link_tokens.sql       ← Phase 2 Sprint 3
  008_teams_and_members.sql       ← Phase 2 Sprint 4
  009_permissions.sql             ← Phase 2 Sprint 4
  010_audit_logs.sql              ← Phase 2 Sprint 5
  011_api_keys.sql                ← Phase 2 Sprint 5
  012_password_history.sql        ← Phase 2 Sprint 5
```

---

## 5. New Dependencies

```json
{
  "dependencies": {
    "arctic": "^3.0.0",
    "oslo": "^1.0.0",
    "otpauth": "^9.3.0",
    "qrcode": "^1.5.4",
    "@simplewebauthn/server": "^11.0.0",
    "@simplewebauthn/browser": "^11.0.0",
    "ethers": "^6.13.0",
    "siwe": "^2.3.0",
    "nodemailer": "^6.9.0",
    "hibp": "^14.1.0",
    "ua-parser-js": "^1.0.0",
    "express-rate-limit": "^7.4.0",
    "ioredis": "^5.4.0"
  }
}
```

| Package | Purpose |
|---------|---------|
| `arctic` | OAuth 2.0 provider abstraction (Google, GitHub, Discord) |
| `oslo` | Crypto utilities (OAuth state, code verifier) |
| `otpauth` | TOTP generation and verification (RFC 6238) |
| `qrcode` | QR code generation for TOTP enrollment |
| `@simplewebauthn/*` | WebAuthn/FIDO2 server + browser utilities |
| `ethers` + `siwe` | Ethereum signature verification (EIP-4361) |
| `nodemailer` | Email dispatch (magic links, invitations) |
| `hibp` | Have I Been Pwned breach checking |
| `ua-parser-js` | User-agent parsing for session tracking |
| `express-rate-limit` + `ioredis` | Distributed rate limiting |

---

## 6. Environment Variables (New)

```bash
# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
OAUTH_REDIRECT_BASE_URL=https://auth.cinacoin.com/api/auth/oauth/callback

# Web3
SIWE_DOMAIN=cinacoin.com
SIWE_SUPPORTED_CHAINS=1,137,8453

# WebAuthn
WEBAUTHN_RP_NAME=Cinacoin
WEBAUTHN_RP_ID=cinacoin.com
WEBAUTHN_ORIGIN=https://cinacoin.com

# Email (Magic Link + Invitations)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=noreply@cinacoin.com

# Redis (Rate Limiting + Session Cache)
REDIS_URL=redis://localhost:6379

# Security
HIBP_API_KEY=
RATE_LIMIT_REDIS=true
SESSION_MAX_PER_USER=10
MFA_BACKUP_CODE_COUNT=10

# Temporal Permissions
PERMISSION_GRACE_PERIOD_HOURS=24
```

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OAuth provider API changes | Medium | Medium | Use `arctic` abstraction layer; pin versions |
| WebAuthn browser compatibility | Low | High | `@simplewebauthn` handles cross-browser; fallback to TOTP |
| SIWE phishing via domain mismatch | Medium | High | Strict EIP-4361 domain binding; nonce expiry |
| TOTP secret leakage | Low | Critical | Encrypt at rest; rotate on suspicion |
| Rate limiter bypass (distributed IPs) | Medium | Medium | Redis-backed sliding window; CAPTCHA on threshold |
| Team permission escalation | Medium | Critical | Comprehensive test suite; admin audit review |
| Migration failures on production DB | Low | High | Dry-run migrations; rollback scripts per migration |
| Email deliverability for magic links | Medium | Medium | Use transactional email service (SES/Postmark); retry queue |

---

## 8. Milestones & Acceptance Criteria

| Week | Milestone | Acceptance Criteria |
|------|-----------|-------------------|
| 2 | OAuth Social Login | User can register/login via Google, GitHub, Discord; account linking works |
| 4 | Web3 + Passkey | User can sign in with MetaMask; register and authenticate with passkey |
| 5 | Magic Link + MFA | Passwordless email login works; TOTP MFA enroll/verify with Google Auth |
| 6 | Teams + RBAC v2 | Create team, invite member, assign resource-level permissions, temporal grants expire |
| 7 | Security Hardening | Rate limiting active; sessions manageable; audit logs capture all events; HIBP blocks breached passwords |
| 8 | UI + E2E | All management pages functional; E2E tests pass; security audit clean |

---

## 9. Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit | Vitest | 90%+ on lib/ modules |
| Integration | Vitest + testcontainers | All API routes with real PostgreSQL |
| E2E | Playwright | Critical auth flows (register → MFA → team) |
| Security | Manual + OWASP ZAP | OWASP Top 10 coverage |
| Load | k6 | 1000 concurrent auth requests; <200ms p95 |

---

## 10. Rollout Plan

1. **Feature flags** for each auth method (env-driven)
2. **Backward compatible** — Phase 1 email/password remains primary
3. **Progressive disclosure** — new auth methods opt-in by user
4. **Database migrations** are additive (no breaking changes to existing tables)
5. **Canary deployment** — 5% traffic → 25% → 100% over 1 week post-launch

---

## 11. Success Metrics

| Metric | Baseline (Phase 1) | Target (Phase 2) |
|--------|-------------------|-----------------|
| Auth methods supported | 1 | 6 |
| Login success rate | ~95% | >99% |
| Median login latency | ~300ms | <250ms |
| Account takeover incidents | N/A | 0 |
| MFA adoption rate | 0% | >30% (6 months) |
| API p95 latency | ~200ms | <300ms |
| Test coverage | ~80% | >90% |

---

*This plan is a living document. Update as implementation progresses.*
