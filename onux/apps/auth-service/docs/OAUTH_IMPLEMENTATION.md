# OAuth 2.0 Social Login - Implementation Documentation

> **Phase 2 - Sprint 1** | Status: ✅ Complete | Date: 2026-06-08

---

## Overview

This implementation adds OAuth 2.0 / OIDC social login support to the Cinacoin Auth Service, enabling users to register and authenticate via **Google**, **GitHub**, and **Discord**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser/App)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ 1. GET /api/auth/oauth/:provider
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Auth Service (Next.js API Routes)               │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/auth/oauth/[provider]/route.ts                  │  │
│  │  - Validates provider                                 │  │
│  │  - Generates CSRF state + PKCE verifier               │  │
│  │  - Stores state in DB                                 │  │
│  │  - Redirects to provider auth URL                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/auth/oauth/[provider]/callback/route.ts         │  │
│  │  - Validates state (CSRF protection)                  │  │
│  │  - Exchanges code for tokens                          │  │
│  │  - Fetches user profile from provider                 │  │
│  │  - Creates/links user account                         │  │
│  │  - Generates JWT tokens                               │  │
│  │  - Redirects or returns JSON                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/auth/oauth/accounts/route.ts                    │  │
│  │  - GET: List linked accounts                          │  │
│  │  - DELETE: Unlink account                             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ Google  │  │  GitHub  │  │ Discord  │
   │  OIDC   │  │  OAuth   │  │  OAuth   │
   └─────────┘  └──────────┘  └──────────┘
```

---

## File Structure

```
apps/auth-service/
├── migrations/
│   └── 002_oauth_accounts.sql          # DB schema for OAuth
├── src/
│   ├── app/api/auth/oauth/
│   │   ├── [provider]/
│   │   │   ├── route.ts                # Initiate OAuth flow
│   │   │   └── callback/
│   │   │       └── route.ts            # Handle provider callback
│   │   └── accounts/
│   │       └── route.ts                # List/unlink accounts
│   ├── components/
│   │   └── SocialLoginButtons.tsx      # React UI components
│   ├── db/
│   │   └── oauth-accounts.ts           # OAuth data access layer
│   └── lib/
│       └── oauth/
│           ├── index.ts                # Module exports
│           ├── providers.ts            # Provider config + profile fetching
│           └── state.ts                # CSRF state management
└── test/
    └── oauth.test.ts                   # Test suite
```

---

## API Endpoints

### 1. Initiate OAuth Flow

```
GET /api/auth/oauth/:provider
```

**Parameters:**
- `provider` (path): `google` | `github` | `discord`
- `redirect_uri` (query, optional): API callback URL
- `return_url` (query, optional): Frontend URL to redirect after auth

**Response:** `302 Redirect` to provider's authorization page

**Example:**
```
GET /api/auth/oauth/google?return_url=https://app.cinacoin.com/auth/callback
→ Redirects to https://accounts.google.com/o/oauth2/v2/auth?...
```

---

### 2. OAuth Callback

```
GET /api/auth/oauth/:provider/callback
```

**Parameters (from provider):**
- `code`: Authorization code
- `state`: CSRF state parameter

**Response (JSON):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "role": "user",
      "status": "active",
      "emailVerified": true
    },
    "oauth": {
      "provider": "google",
      "isNewUser": false,
      "isAccountLink": true
    }
  }
}
```

**Response (Redirect):** If `return_url` was provided, redirects with tokens in URL params.

---

### 3. List Linked Accounts

```
GET /api/auth/oauth/accounts
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid",
        "provider": "google",
        "providerUserId": "123456",
        "providerEmail": "user@gmail.com",
        "scope": "openid profile email",
        "createdAt": "2026-06-08T10:00:00Z"
      }
    ],
    "hasPassword": true,
    "totalAccounts": 2
  }
}
```

---

### 4. Unlink Account

```
DELETE /api/auth/oauth/accounts?id=<account_id>
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "OAuth account unlinked successfully"
}
```

**Safety:** Prevents unlinking the last login method (requires password or another OAuth account).

---

## Database Schema

### New Tables

| Table | Purpose |
|-------|---------|
| `oauth_accounts` | Linked social provider accounts |
| `sessions` | Active session tracking |
| `oauth_states` | CSRF state storage (short-lived) |
| `audit_logs` | Security audit trail |

### Modified Tables

| Table | Change |
|-------|--------|
| `users` | Added `oauth_providers JSONB` column |

---

## Environment Variables

```bash
# OAuth redirect base URL
OAUTH_REDIRECT_BASE_URL=https://auth.cinacoin.com/api/auth/oauth

# Google OAuth 2.0
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# Discord OAuth
DISCORD_CLIENT_ID=xxxxx
DISCORD_CLIENT_SECRET=xxxxx

# State expiry (minutes)
OAUTH_STATE_EXPIRY_MINUTES=10
```

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| **CSRF Protection** | Random state parameter stored in DB, validated on callback |
| **PKCE** | Code verifier/challenge for Google (prevents authorization code interception) |
| **State Expiry** | States expire after 10 minutes (configurable) |
| **One-time Use** | States are marked as used after validation |
| **Account Link Safety** | Cannot unlink last login method |
| **Audit Logging** | All OAuth events logged (login, register, link, unlink) |
| **Token Storage** | Access/refresh tokens stored encrypted in DB |

---

## User Flow

### New User (Registration via OAuth)

1. User clicks "Continue with Google"
2. Redirected to Google authorization page
3. User grants permission
4. Callback receives authorization code
5. Server exchanges code for tokens
6. Server fetches user profile from Google
7. No existing user found → creates new user account
8. Creates OAuth account link
9. Generates JWT tokens
10. Returns tokens to client

### Existing User (Login via OAuth)

1. User clicks "Continue with GitHub"
2. Redirected to GitHub authorization page
3. User grants permission
4. Callback receives authorization code
5. Server exchanges code for tokens
6. Server fetches user profile from GitHub
7. OAuth account found → updates tokens
8. Generates new JWT tokens
9. Returns tokens to client

### Account Linking

1. Logged-in user goes to account settings
2. Clicks "Link Discord Account"
3. Redirected to Discord authorization page
4. Callback receives authorization code
5. Server fetches profile from Discord
6. Discord account not linked to any user → links to current user
7. Updates `oauth_providers` JSON field
8. Returns success

---

## Frontend Integration

### React Components

```tsx
import {
  SocialLoginButton,
  SocialLoginButtonsGroup,
  LoginDivider,
} from '@/components/SocialLoginButtons';

// Single button
<SocialLoginButton
  provider="google"
  returnUrl="https://app.cinacoin.com/auth/callback"
/>

// All providers
<SocialLoginButtonsGroup
  providers={['google', 'github', 'discord']}
  returnUrl="/dashboard"
/>

// With divider
<form>
  {/* Email/password fields */}
  <button type="submit">Sign In</button>
</form>

<LoginDivider text="or continue with" />

<SocialLoginButtonsGroup />
```

### OAuth Callback Handler (Frontend)

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // Redirect to dashboard
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  return <div>Completing login...</div>;
}
```

---

## Testing

Run the OAuth test suite:

```bash
cd apps/auth-service
pnpm test oauth
```

**Test Coverage:**
- ✅ State generation and validation
- ✅ PKCE code verifier generation
- ✅ Provider configuration checks
- ✅ OAuth account CRUD operations
- ✅ Full OAuth flow integration test

---

## Provider Setup Guides

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `https://auth.cinacoin.com/api/auth/oauth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details
4. Authorization callback URL: `https://auth.cinacoin.com/api/auth/oauth/github/callback`
5. Generate a new client secret
6. Copy Client ID and Client Secret to `.env`

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Navigate to **OAuth2**
4. Add redirect: `https://auth.cinacoin.com/api/auth/oauth/discord/callback`
5. Copy Client ID and Client Secret to `.env`

---

## Migration

Run the database migration:

```bash
cd apps/auth-service
pnpm db:migrate
```

This will create:
- `oauth_accounts` table
- `sessions` table
- `oauth_states` table
- `audit_logs` table
- Add `oauth_providers` column to `users` table

---

## Next Steps (Phase 2 Sprint 2+)

- [ ] Web3 wallet authentication (SIWE)
- [ ] Passkey/WebAuthn support
- [ ] TOTP MFA integration
- [ ] Magic link authentication
- [ ] Advanced session management
- [ ] Team-based RBAC

---

## References

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Arctic OAuth Library](https://github.com/pilcrowonpaper/arctic)
- [Google Identity Platform](https://developers.google.com/identity)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Discord OAuth2 Docs](https://discord.com/developers/docs/topics/oauth2)
