# Cinacoin Auth API Specification

> **Version**: 1.0.0  
> **Date**: 2026-06-08  
> **Base URL**: `https://auth.cinacoin.com`  
> **API Style**: REST + OAuth 2.0

---

## 目录

1. [通用规范](#1-通用规范)
2. [认证端点 (Auth)](#2-认证端点-auth)
3. [OAuth 2.0 / OIDC 端点](#3-oauth-20--oidc-端点)
4. [用户管理端点](#4-用户管理端点)
5. [MFA 端点](#5-mfa-端点)
6. [Session 管理端点](#6-session-管理端点)
7. [组织管理端点](#7-组织管理端点)
8. [团队管理端点](#8-团队管理端点)
9. [项目管理端点](#9-项目管理端点)
10. [API Key 管理端点](#10-api-key-管理端点)
11. [管理后台端点 (Admin)](#11-管理后台端点-admin)
12. [Webhook 端点](#12-webhook-端点)
13. [错误响应格式](#13-错误响应格式)
14. [Rate Limiting Headers](#14-rate-limiting-headers)

---

## 1. 通用规范

### 1.1 认证方式

所有需要认证的端点使用 Bearer Token：

```http
Authorization: Bearer <access_token>
```

### 1.2 请求格式

- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **字符编码**: UTF-8

### 1.3 响应格式

**成功响应**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-06-08T14:00:00Z"
  }
}
```

**分页响应**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-06-08T14:00:00Z"
  }
}
```

**错误响应**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_002",
    "message": "Invalid email or password",
    "details": { ... }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-06-08T14:00:00Z"
  }
}
```

### 1.4 通用请求头

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | 条件 | Bearer token (认证端点必需) |
| `Content-Type` | POST/PUT/PATCH | `application/json` |
| `X-Request-ID` | 可选 | 客户端请求追踪 ID |
| `X-Client-Version` | 可选 | 客户端版本号 |
| `Accept-Language` | 可选 | 响应语言偏好 |

### 1.5 通用查询参数

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | 页码 |
| `per_page` | int | 20 | 每页数量 (max: 100) |
| `sort` | string | `created_at` | 排序字段 |
| `order` | string | `desc` | 排序方向 (asc/desc) |
| `fields` | string | all | 返回字段（逗号分隔） |

---

## 2. 认证端点 (Auth)

### 2.1 注册

**POST** `/v1/auth/register`

创建新用户账户。

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd123",
  "display_name": "John Doe",
  "locale": "zh-CN",
  "timezone": "Asia/Shanghai",
  "referral_code": "ref_abc123",
  "captcha_token": "captcha_token_xxx"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | ✅ | Valid email, max 255 |
| password | string | ✅ | Min 12 chars, 3/4 complexity |
| display_name | string | ❌ | 1-100 chars |
| locale | string | ❌ | ISO 639-1 |
| timezone | string | ❌ | IANA timezone |
| referral_code | string | ❌ | Valid referral code |
| captcha_token | string | 条件 | Required if captcha enabled |

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_a1b2c3d4e5f6",
      "email": "user@example.com",
      "display_name": "John Doe",
      "status": "pending",
      "email_verified": false,
      "created_at": "2026-06-08T14:00:00Z"
    },
    "session": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
      "token_type": "Bearer",
      "expires_in": 900
    }
  }
}
```

**Errors**
| Code | Status | Description |
|------|--------|-------------|
| AUTH_001 | 400 | Invalid request parameters |
| AUTH_010 | 409 | Email already registered |
| AUTH_011 | 429 | Registration rate limit exceeded |

---

### 2.2 登录 (邮箱/密码)

**POST** `/v1/auth/login`

使用邮箱和密码登录。

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd123",
  "mfa_code": "123456",
  "remember_device": true,
  "device_info": {
    "name": "MacBook Pro",
    "type": "desktop",
    "os": "macOS 15.0",
    "browser": "Chrome 120"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | ✅ | User email |
| password | string | ✅ | User password |
| mfa_code | string | 条件 | Required if MFA enabled |
| remember_device | boolean | ❌ | Trust this device (30 days) |
| device_info | object | ❌ | Device metadata |

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_a1b2c3d4e5f6",
      "email": "user@example.com",
      "display_name": "John Doe",
      "avatar_url": "https://cdn.cinacoin.com/avatars/usr_a1b2c3d4.png",
      "global_role": "user",
      "mfa_enabled": true,
      "email_verified": true,
      "organizations": [
        {
          "id": "org_personal_abc",
          "name": "John's Workspace",
          "role": "owner",
          "is_personal": true
        }
      ]
    },
    "session": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
      "token_type": "Bearer",
      "expires_in": 900,
      "scope": "openid profile email"
    },
    "mfa_required": false
  }
}
```

**MFA Required Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "mfa_required": true,
    "mfa_token": "mfa_temp_token_xyz",
    "mfa_methods": ["totp", "webauthn"],
    "session": null
  }
}
```

**Errors**
| Code | Status | Description |
|------|--------|-------------|
| AUTH_001 | 400 | Invalid request format |
| AUTH_002 | 401 | Invalid email or password |
| AUTH_007 | 403 | Account is disabled |
| AUTH_008 | 403 | Email not verified |
| AUTH_012 | 429 | Too many login attempts |
| MFA_001 | 400 | Invalid MFA code |

---

### 2.3 MFA 验证

**POST** `/v1/auth/mfa/verify`

验证 MFA 代码完成登录。

**Request Body**
```json
{
  "mfa_token": "mfa_temp_token_xyz",
  "method": "totp",
  "code": "123456",
  "remember_device": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mfa_token | string | ✅ | Temp token from login response |
| method | string | ✅ | `totp`, `webauthn`, `email_otp`, `recovery_code` |
| code | string | ✅ | MFA verification code |
| remember_device | boolean | ❌ | Trust this device |

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": {
      "access_token": "...",
      "refresh_token": "...",
      "token_type": "Bearer",
      "expires_in": 900
    }
  }
}
```

---

### 2.4 Token 刷新

**POST** `/v1/auth/refresh`

使用 refresh token 获取新的 access token。

**Request Body**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "bmV3X3JlZnJlc2hfdG9r...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

> ⚠️ **Refresh Token Rotation**: 每次刷新都会颁发新的 refresh token，旧的立即失效。

**Errors**
| Code | Status | Description |
|------|--------|-------------|
| AUTH_003 | 401 | Refresh token expired |
| AUTH_004 | 401 | Invalid refresh token |
| AUTH_005 | 401 | Refresh token revoked |

---

### 2.5 登出

**POST** `/v1/auth/logout`

撤销当前 session。

**Request Body**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "all_sessions": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refresh_token | string | 条件 | Required if `all_sessions` is false |
| all_sessions | boolean | ❌ | Revoke all user sessions |

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "revoked_sessions": 1
  }
}
```

---

### 2.6 邮箱验证

**POST** `/v1/auth/verify-email`

验证用户邮箱。

**Request Body**
```json
{
  "token": "verification_token_xxx"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "verified": true
  }
}
```

---

### 2.7 重新发送验证邮件

**POST** `/v1/auth/verify-email/resend`

**Request Body**
```json
{
  "email": "user@example.com"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "sent": true,
    "cooldown_seconds": 60
  }
}
```

---

### 2.8 密码重置请求

**POST** `/v1/auth/password-reset/request`

**Request Body**
```json
{
  "email": "user@example.com",
  "captcha_token": "captcha_xxx"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "sent": true,
    "expires_in": 900
  }
}
```

> ⚠️ 无论邮箱是否存在，都返回成功（防止邮箱枚举）。

---

### 2.9 密码重置确认

**POST** `/v1/auth/password-reset/confirm`

**Request Body**
```json
{
  "token": "reset_token_xxx",
  "new_password": "NewSecureP@ss456"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "password_changed": true,
    "sessions_revoked": 3
  }
}
```

---

### 2.10 Magic Link 登录

**POST** `/v1/auth/magic-link/request`

请求无密码登录链接。

**Request Body**
```json
{
  "email": "user@example.com",
  "redirect_uri": "https://cloud.cinacoin.com/auth/callback"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "sent": true,
    "expires_in": 900
  }
}
```

---

**POST** `/v1/auth/magic-link/verify`

验证 magic link token。

**Request Body**
```json
{
  "token": "magic_link_token_xxx"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

---

### 2.11 Web3 钱包登录 (SIWE)

**GET** `/v1/auth/web3/nonce`

获取 SIWE 签名 nonce。

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "nonce": "a1b2c3d4e5f6...",
    "message_template": "cinacoin.com wants you to sign in with your Ethereum account:\n{address}\n\nSign in to Cinacoin\n\nURI: https://auth.cinacoin.com\nVersion: 1\nChain ID: 1\nNonce: {nonce}\nIssued At: {timestamp}",
    "expires_in": 300
  }
}
```

---

**POST** `/v1/auth/web3/verify`

验证 SIWE 签名。

**Request Body**
```json
{
  "message": "cinacoin.com wants you to sign in...",
  "signature": "0x...",
  "chain": "ethereum",
  "chain_id": 1
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... },
    "wallet": {
      "address": "0x1234...5678",
      "chain": "ethereum",
      "is_new": false
    }
  }
}
```

---

## 3. OAuth 2.0 / OIDC 端点

### 3.1 Authorization Endpoint

**GET** `/oauth/authorize`

OAuth 2.0 授权端点。

**Query Parameters**
| Parameter | Required | Description |
|-----------|----------|-------------|
| client_id | ✅ | Registered client ID |
| redirect_uri | ✅ | Must match registered URI |
| response_type | ✅ | `code` |
| scope | ✅ | Space-separated scopes |
| state | ✅ | CSRF protection random string |
| code_challenge | ✅ | PKCE code challenge (S256) |
| code_challenge_method | ✅ | Must be `S256` |
| prompt | ❌ | `login`, `consent`, `none` |
| login_hint | ❌ | Pre-fill email |
| max_age | ❌ | Max authentication age (seconds) |

**Response**: Redirect to `redirect_uri`

成功:
```
HTTP/1.1 302 Found
Location: https://app.cinacoin.com/callback?code=auth_code_xxx&state=random_state
```

失败:
```
HTTP/1.1 302 Found
Location: https://app.cinacoin.com/callback?error=access_denied&error_description=User+denied+consent&state=random_state
```

---

### 3.2 Token Endpoint

**POST** `/oauth/token`

OAuth 2.0 Token 端点。

**Request** (application/x-www-form-urlencoded)
```
grant_type=authorization_code
&code=auth_code_xxx
&redirect_uri=https://app.cinacoin.com/callback
&client_id=cinacoin_cloud
&client_secret=client_secret_xxx
&code_verifier=code_verifier_xxx
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| grant_type | ✅ | `authorization_code`, `refresh_token` |
| code | 条件 | Authorization code (for auth_code grant) |
| redirect_uri | 条件 | Must match original |
| client_id | ✅ | Client identifier |
| client_secret | 条件 | Required for confidential clients |
| code_verifier | ✅ | PKCE code verifier |
| refresh_token | 条件 | Required for refresh_token grant |

**Response** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "scope": "openid profile email"
}
```

---

### 3.3 UserInfo Endpoint

**GET** `/oauth/userinfo`

OIDC UserInfo 端点。

**Request**
```http
GET /oauth/userinfo HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

**Response** `200 OK`
```json
{
  "sub": "usr_a1b2c3d4e5f6",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "user@example.com",
  "email_verified": true,
  "picture": "https://cdn.cinacoin.com/avatars/usr_a1b2c3d4.png",
  "locale": "zh-CN",
  "updated_at": 1717858800
}
```

---

### 3.4 JWKS Endpoint

**GET** `/.well-known/jwks.json`

JSON Web Key Set for token verification.

**Response** `200 OK`
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key_2026_06",
      "alg": "RS256",
      "n": "xyz...",
      "e": "AQAB"
    }
  ]
}
```

---

### 3.5 OpenID Configuration

**GET** `/.well-known/openid-configuration`

**Response** `200 OK`
```json
{
  "issuer": "https://auth.cinacoin.com",
  "authorization_endpoint": "https://auth.cinacoin.com/oauth/authorize",
  "token_endpoint": "https://auth.cinacoin.com/oauth/token",
  "userinfo_endpoint": "https://auth.cinacoin.com/oauth/userinfo",
  "jwks_uri": "https://auth.cinacoin.com/.well-known/jwks.json",
  "registration_endpoint": "https://auth.cinacoin.com/oauth/register",
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "none"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

---

### 3.6 Dynamic Client Registration

**POST** `/oauth/register`

注册新的 OAuth 客户端。

**Request Body**
```json
{
  "client_name": "My App",
  "redirect_uris": ["https://myapp.com/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_post",
  "contacts": ["admin@myapp.com"],
  "logo_uri": "https://myapp.com/logo.png",
  "policy_uri": "https://myapp.com/privacy"
}
```

**Response** `201 Created`
```json
{
  "client_id": "generated_client_id",
  "client_secret": "generated_client_secret",
  "client_id_issued_at": 1717858800,
  "client_secret_expires_at": 0
}
```

---

## 4. 用户管理端点

### 4.1 获取当前用户

**GET** `/v1/users/me`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "usr_a1b2c3d4e5f6",
    "external_id": "usr_a1b2c3d4e5f6",
    "email": "user@example.com",
    "email_verified": true,
    "display_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://cdn.cinacoin.com/avatars/usr_a1b2c3d4.png",
    "locale": "zh-CN",
    "timezone": "Asia/Shanghai",
    "status": "active",
    "global_role": "user",
    "mfa_enabled": true,
    "mfa_methods": ["totp", "webauthn"],
    "oauth_providers": ["google", "github"],
    "web3_wallets": [
      {
        "address": "0x1234...5678",
        "chain": "ethereum",
        "is_primary": true
      }
    ],
    "organizations": [
      {
        "id": "org_abc",
        "name": "Acme Corp",
        "slug": "acme",
        "role": "admin",
        "is_personal": false
      }
    ],
    "last_login_at": "2026-06-08T10:00:00Z",
    "created_at": "2026-01-15T08:00:00Z"
  }
}
```

---

### 4.2 更新当前用户

**PATCH** `/v1/users/me`

**Request Body**
```json
{
  "display_name": "Johnny D",
  "first_name": "Johnny",
  "last_name": "Doe",
  "avatar_url": "https://cdn.cinacoin.com/avatars/new.png",
  "locale": "en",
  "timezone": "America/New_York"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 4.3 修改邮箱

**PUT** `/v1/users/me/email`

**Request Body**
```json
{
  "new_email": "newemail@example.com",
  "password": "SecureP@ssw0rd123"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "email_change_pending": true,
    "verification_sent_to": "newemail@example.com",
    "expires_in": 900
  }
}
```

---

### 4.4 修改密码

**PUT** `/v1/users/me/password`

**Request Body**
```json
{
  "current_password": "SecureP@ssw0rd123",
  "new_password": "NewSecureP@ss456"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "password_changed": true,
    "sessions_revoked": 2
  }
}
```

---

### 4.5 删除账户

**DELETE** `/v1/users/me`

**Request Body**
```json
{
  "password": "SecureP@ssw0rd123",
  "reason": "No longer needed",
  "confirm_text": "DELETE"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "delete_requested": true,
    "delete_scheduled_at": "2026-07-08T14:00:00Z",
    "grace_period_days": 30,
    "restore_url": "https://auth.cinacoin.com/restore?token=xxx"
  }
}
```

---

### 4.6 恢复已删除账户

**POST** `/v1/users/me/restore`

**Request Body**
```json
{
  "token": "restore_token_xxx"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "restored": true,
    "user": { ... }
  }
}
```

---

### 4.7 导出数据 (GDPR)

**POST** `/v1/users/me/export`

**Response** `202 Accepted`
```json
{
  "success": true,
  "data": {
    "export_id": "exp_abc123",
    "status": "processing",
    "estimated_completion": "2026-06-08T14:30:00Z"
  }
}
```

**GET** `/v1/users/me/export/:export_id`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "export_id": "exp_abc123",
    "status": "completed",
    "download_url": "https://auth.cinacoin.com/exports/exp_abc123.zip",
    "expires_at": "2026-06-09T14:00:00Z",
    "size_bytes": 1024000
  }
}
```

---

## 5. MFA 端点

### 5.1 获取 MFA 状态

**GET** `/v1/mfa/status`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "mfa_enabled": true,
    "mfa_required": false,
    "methods": [
      {
        "id": "mfa_totp_1",
        "type": "totp",
        "name": "Google Authenticator",
        "is_primary": true,
        "created_at": "2026-01-15T08:00:00Z"
      },
      {
        "id": "mfa_webauthn_1",
        "type": "webauthn",
        "name": "YubiKey 5",
        "is_primary": false,
        "created_at": "2026-02-01T10:00:00Z"
      }
    ],
    "recovery_codes_remaining": 8
  }
}
```

---

### 5.2 启用 TOTP

**POST** `/v1/mfa/totp/setup`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code_url": "data:image/png;base64,...",
    "otpauth_url": "otpauth://totp/Cinacoin:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Cinacoin",
    "setup_token": "setup_token_xxx"
  }
}
```

---

**POST** `/v1/mfa/totp/verify`

**Request Body**
```json
{
  "setup_token": "setup_token_xxx",
  "code": "123456",
  "name": "Google Authenticator"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "method_id": "mfa_totp_1",
    "type": "totp",
    "enabled": true,
    "recovery_codes": [
      "abcd-1234-efgh",
      "ijkl-5678-mnop",
      "..."
    ]
  }
}
```

---

### 5.3 禁用 TOTP

**DELETE** `/v1/mfa/totp/:method_id`

**Request Body**
```json
{
  "password": "SecureP@ssw0rd123"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "method_id": "mfa_totp_1",
    "disabled": true
  }
}
```

---

### 5.4 WebAuthn/Passkey 注册

**POST** `/v1/mfa/webauthn/register/begin`

**Request Body**
```json
{
  "name": "My YubiKey",
  "authenticator_attachment": "cross-platform"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "options": {
      "challenge": "xxx",
      "rp": { "name": "Cinacoin", "id": "cinacoin.com" },
      "user": { "id": "usr_a1b2c3d4", "name": "user@example.com" },
      "pubKeyCredParams": [
        { "type": "public-key", "alg": -7 },
        { "type": "public-key", "alg": -257 }
      ],
      "timeout": 60000,
      "attestation": "none"
    },
    "session_id": "webauthn_session_xxx"
  }
}
```

---

**POST** `/v1/mfa/webauthn/register/complete`

**Request Body**
```json
{
  "session_id": "webauthn_session_xxx",
  "credential": {
    "id": "credential_id_base64",
    "rawId": "...",
    "type": "public-key",
    "response": {
      "attestationObject": "...",
      "clientDataJSON": "..."
    }
  }
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "method_id": "mfa_webauthn_1",
    "type": "webauthn",
    "name": "My YubiKey",
    "enabled": true
  }
}
```

---

### 5.5 WebAuthn 认证

**POST** `/v1/mfa/webauthn/authenticate/begin`

**Request Body**
```json
{
  "mfa_token": "mfa_temp_token_xyz"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "options": {
      "challenge": "xxx",
      "rpId": "cinacoin.com",
      "allowCredentials": [
        { "type": "public-key", "id": "credential_id_base64" }
      ],
      "timeout": 60000,
      "userVerification": "preferred"
    },
    "session_id": "webauthn_auth_xxx"
  }
}
```

---

**POST** `/v1/mfa/webauthn/authenticate/complete`

**Request Body**
```json
{
  "session_id": "webauthn_auth_xxx",
  "credential": {
    "id": "credential_id_base64",
    "rawId": "...",
    "type": "public-key",
    "response": {
      "authenticatorData": "...",
      "clientDataJSON": "...",
      "signature": "..."
    }
  }
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

---

### 5.6 重新生成恢复码

**POST** `/v1/mfa/recovery-codes/regenerate`

**Request Body**
```json
{
  "password": "SecureP@ssw0rd123"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "recovery_codes": [
      "abcd-1234-efgh",
      "ijkl-5678-mnop",
      "qrst-9012-uvwx",
      "yzab-3456-cdef",
      "ghij-7890-klmn",
      "opqr-1234-stuv",
      "wxyz-5678-abcd",
      "efgh-9012-ijkl",
      "mnop-3456-qrst",
      "uvwx-7890-yzab"
    ],
    "remaining": 10
  }
}
```

---

## 6. Session 管理端点

### 6.1 获取活跃 Sessions

**GET** `/v1/sessions`

**Response** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "sess_abc123",
      "auth_method": "password",
      "ip_address": "1.2.3.4",
      "country_code": "US",
      "device_name": "MacBook Pro",
      "device_type": "desktop",
      "os_name": "macOS 15.0",
      "browser_name": "Chrome 120",
      "is_current": true,
      "last_active_at": "2026-06-08T14:00:00Z",
      "created_at": "2026-06-08T10:00:00Z",
      "expires_at": "2026-07-08T10:00:00Z"
    },
    {
      "id": "sess_def456",
      "auth_method": "oauth",
      "ip_address": "5.6.7.8",
      "country_code": "CN",
      "device_name": "iPhone 16",
      "device_type": "mobile",
      "os_name": "iOS 19",
      "browser_name": "Safari",
      "is_current": false,
      "last_active_at": "2026-06-07T20:00:00Z",
      "created_at": "2026-06-01T08:00:00Z",
      "expires_at": "2026-07-01T08:00:00Z"
    }
  ]
}
```

---

### 6.2 撤销 Session

**DELETE** `/v1/sessions/:session_id`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "session_id": "sess_def456",
    "revoked": true
  }
}
```

---

### 6.3 撤销所有其他 Sessions

**DELETE** `/v1/sessions/others`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "revoked_count": 2
  }
}
```

---

## 7. 组织管理端点

### 7.1 创建组织

**POST** `/v1/organizations`

**Request Body**
```json
{
  "name": "Acme Corporation",
  "slug": "acme",
  "description": "We build amazing things",
  "plan": "pro"
}
```

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "org_new123",
    "external_id": "org_new123abc",
    "name": "Acme Corporation",
    "slug": "acme",
    "description": "We build amazing things",
    "owner_id": "usr_a1b2c3d4e5f6",
    "plan": "pro",
    "max_members": 50,
    "created_at": "2026-06-08T14:00:00Z"
  }
}
```

---

### 7.2 获取组织

**GET** `/v1/organizations/:org_id`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "org_abc",
    "name": "Acme Corporation",
    "slug": "acme",
    "description": "...",
    "avatar_url": "...",
    "owner": {
      "id": "usr_a1b2c3d4e5f6",
      "display_name": "John Doe",
      "email": "john@acme.com"
    },
    "plan": "pro",
    "max_members": 50,
    "member_count": 12,
    "settings": {
      "mfa_required": true,
      "sso_enabled": false
    },
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 7.3 更新组织

**PATCH** `/v1/organizations/:org_id`

**Request Body**
```json
{
  "name": "Acme Corp",
  "description": "Updated description",
  "avatar_url": "https://...",
  "settings": {
    "mfa_required": true,
    "ip_allowlist": ["10.0.0.0/8"]
  }
}
```

---

### 7.4 获取组织成员

**GET** `/v1/organizations/:org_id/members`

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| role | string | Filter by role |
| search | string | Search by name/email |

**Response** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "orgmem_1",
      "user": {
        "id": "usr_a1b2c3d4e5f6",
        "email": "john@acme.com",
        "display_name": "John Doe",
        "avatar_url": "..."
      },
      "role": "owner",
      "joined_at": "2026-01-01T00:00:00Z",
      "is_active": true
    }
  ],
  "pagination": { ... }
}
```

---

### 7.5 邀请成员

**POST** `/v1/organizations/:org_id/invitations`

**Request Body**
```json
{
  "email": "newmember@acme.com",
  "role": "member",
  "team_ids": ["team_abc"],
  "message": "Welcome to Acme!"
}
```

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "invitation_id": "inv_xyz",
    "email": "newmember@acme.com",
    "role": "member",
    "expires_at": "2026-06-15T14:00:00Z"
  }
}
```

---

### 7.6 更新成员角色

**PATCH** `/v1/organizations/:org_id/members/:user_id`

**Request Body**
```json
{
  "role": "admin"
}
```

---

### 7.7 移除成员

**DELETE** `/v1/organizations/:org_id/members/:user_id`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "removed": true,
    "user_id": "usr_def456"
  }
}
```

---

## 8. 团队管理端点

### 8.1 创建团队

**POST** `/v1/organizations/:org_id/teams`

**Request Body**
```json
{
  "name": "Engineering",
  "slug": "engineering",
  "description": "Core engineering team"
}
```

---

### 8.2 获取团队列表

**GET** `/v1/organizations/:org_id/teams`

---

### 8.3 获取团队

**GET** `/v1/organizations/:org_id/teams/:team_id`

---

### 8.4 更新团队

**PATCH** `/v1/organizations/:org_id/teams/:team_id`

---

### 8.5 删除团队

**DELETE** `/v1/organizations/:org_id/teams/:team_id`

---

### 8.6 添加团队成员

**POST** `/v1/organizations/:org_id/teams/:team_id/members`

**Request Body**
```json
{
  "user_id": "usr_abc123",
  "role": "member"
}
```

---

### 8.7 移除团队成员

**DELETE** `/v1/organizations/:org_id/teams/:team_id/members/:user_id`

---

## 9. 项目管理端点

### 9.1 创建项目

**POST** `/v1/organizations/:org_id/projects`

**Request Body**
```json
{
  "name": "My Project",
  "slug": "my-project",
  "description": "A new project"
}
```

---

### 9.2 获取项目列表

**GET** `/v1/organizations/:org_id/projects`

---

### 9.3 获取项目

**GET** `/v1/projects/:project_id`

---

### 9.4 更新项目

**PATCH** `/v1/projects/:project_id`

---

### 9.5 删除项目

**DELETE** `/v1/projects/:project_id`

---

### 9.6 获取项目成员

**GET** `/v1/projects/:project_id/members`

---

### 9.7 添加项目成员

**POST** `/v1/projects/:project_id/members`

---

### 9.8 移除项目成员

**DELETE** `/v1/projects/:project_id/members/:user_id`

---

## 10. API Key 管理端点

### 10.1 创建 API Key

**POST** `/v1/api-keys`

**Request Body**
```json
{
  "name": "Production API Key",
  "description": "Used by production backend",
  "org_id": "org_abc",
  "scopes": ["project:read", "project:write"],
  "expires_in_days": 90,
  "ip_allowlist": ["10.0.0.0/8"],
  "rate_limit": 1000
}
```

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "key_abc123",
    "name": "Production API Key",
    "key": "ck_live_abcdef1234567890...",
    "key_prefix": "ck_live_abcd",
    "scopes": ["project:read", "project:write"],
    "expires_at": "2026-09-06T14:00:00Z",
    "created_at": "2026-06-08T14:00:00Z"
  }
}
```

> ⚠️ **重要**: `key` 只在创建时返回一次，请立即保存。

---

### 10.2 获取 API Keys 列表

**GET** `/v1/api-keys`

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| org_id | string | Filter by organization |
| include_revoked | boolean | Include revoked keys |

---

### 10.3 撤销 API Key

**DELETE** `/v1/api-keys/:key_id`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "key_abc123",
    "revoked": true,
    "revoked_at": "2026-06-08T14:00:00Z"
  }
}
```

---

## 11. 管理后台端点 (Admin)

> 需要 `super_admin` 或 `admin` 角色

### 11.1 获取用户列表

**GET** `/v1/admin/users`

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by email/name |
| status | string | Filter by status |
| role | string | Filter by global_role |
| mfa_enabled | boolean | Filter by MFA status |
| created_after | ISO8601 | Registration date filter |

---

### 11.2 获取用户详情 (Admin)

**GET** `/v1/admin/users/:user_id`

---

### 11.3 暂停用户

**POST** `/v1/admin/users/:user_id/suspend`

**Request Body**
```json
{
  "reason": "Terms of service violation",
  "duration_hours": 168
}
```

---

### 11.4 解除暂停

**POST** `/v1/admin/users/:user_id/unsuspend`

---

### 11.5 修改用户角色

**PUT** `/v1/admin/users/:user_id/role`

**Request Body**
```json
{
  "global_role": "admin"
}
```

---

### 11.6 模拟用户 (Impersonate)

**POST** `/v1/admin/users/:user_id/impersonate`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "...",
      "is_impersonation": true,
      "impersonated_by": "usr_admin_123"
    }
  }
}
```

---

### 11.7 获取审计日志

**GET** `/v1/admin/audit-logs`

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | string | Filter by user |
| action | string | Filter by action |
| org_id | string | Filter by organization |
| start_date | ISO8601 | Start of range |
| end_date | ISO8601 | End of range |
| ip_address | string | Filter by IP |

---

### 11.8 系统统计

**GET** `/v1/admin/stats`

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 15000,
      "active": 12000,
      "pending": 500,
      "suspended": 50,
      "new_today": 25,
      "new_this_week": 150
    },
    "sessions": {
      "active": 8500,
      "created_today": 1200
    },
    "organizations": {
      "total": 500,
      "active": 450
    },
    "auth_methods": {
      "password": 10000,
      "oauth": 4000,
      "web3": 800,
      "passkey": 200
    },
    "mfa": {
      "enabled_users": 6000,
      "required_users": 50
    }
  }
}
```

---

## 12. Webhook 端点

### 12.1 注册 Webhook

**POST** `/v1/webhooks`

**Request Body**
```json
{
  "url": "https://myapp.com/webhooks/cinacoin",
  "events": ["user.created", "user.deleted", "org.member_added"],
  "secret": "webhook_secret_xxx"
}
```

### 12.2 Webhook 事件类型

| Event | Description |
|-------|-------------|
| `user.created` | New user registered |
| `user.verified` | Email verified |
| `user.updated` | Profile updated |
| `user.deleted` | Account deleted |
| `user.suspended` | Account suspended |
| `session.created` | New session |
| `session.revoked` | Session revoked |
| `mfa.enabled` | MFA turned on |
| `mfa.disabled` | MFA turned off |
| `org.created` | Organization created |
| `org.member_added` | Member joined |
| `org.member_removed` | Member left |
| `org.member_role_changed` | Role changed |

### 12.3 Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "user.created",
  "created_at": "2026-06-08T14:00:00Z",
  "data": {
    "user": { ... }
  }
}
```

**Headers**
```
X-Cinacoin-Signature: sha256=xxx
X-Cinacoin-Event: user.created
X-Cinacoin-Delivery: delivery_id_xxx
```

---

## 13. 错误响应格式

### 13.1 标准错误结构

```json
{
  "success": false,
  "error": {
    "code": "AUTH_002",
    "message": "Invalid email or password",
    "type": "authentication_error",
    "details": {
      "field": "password",
      "remaining_attempts": 3
    },
    "doc_url": "https://docs.cinacoin.com/errors/AUTH_002"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-06-08T14:00:00Z"
  }
}
```

### 13.2 验证错误

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Validation failed",
    "type": "validation_error",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "Invalid email format"
        },
        {
          "field": "password",
          "message": "Password must be at least 12 characters"
        }
      ]
    }
  }
}
```

---

## 14. Rate Limiting Headers

所有 API 响应包含 rate limiting 信息：

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1717858860
X-RateLimit-Policy: 100;w=60
```

当触发限流时：

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1717858890
```

```json
{
  "success": false,
  "error": {
    "code": "AUTH_011",
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "details": {
      "limit": 5,
      "window_seconds": 60,
      "retry_after_seconds": 30
    }
  }
}
```

---

## 附录 A: SDK 代码示例

### TypeScript (Browser)

```typescript
import { CinacoinAuth } from '@cinacoin/auth-sdk';

const auth = new CinacoinAuth({
  clientId: 'cinacoin_cloud',
  redirectUri: 'https://cloud.cinacoin.com/callback',
});

// Login with redirect
await auth.loginWithRedirect();

// Handle callback
const { user, session } = await auth.handleCallback();

// Get access token (auto-refresh)
const token = await auth.getAccessToken();

// Check permissions
const canEdit = auth.hasPermission('project:write');

// Logout
await auth.logout();
```

### TypeScript (Server)

```typescript
import { createAuthMiddleware } from '@cinacoin/auth-sdk/server';

const requireAuth = createAuthMiddleware({
  audience: 'https://cloud.cinacoin.com',
});

const requirePermission = (perm: string) => createAuthMiddleware({
  audience: 'https://cloud.cinacoin.com',
  requiredPermission: perm,
});

app.get('/api/projects', requireAuth, async (req, res) => {
  const projects = await db.projects.findByOrg(req.user.org_id);
  res.json({ data: projects });
});

app.delete('/api/projects/:id', requirePermission('project:delete'), async (req, res) => {
  await db.projects.delete(req.params.id);
  res.json({ success: true });
});
```

### Python

```python
from cinacoin_auth import CinacoinAuth

auth = CinacoinAuth(
    client_id="cinacoin_cloud",
    client_secret="***",
    redirect_uri="https://myapp.com/callback"
)

# Get authorization URL
url = auth.get_authorization_url(state="random_state")

# Exchange code for tokens
tokens = auth.exchange_code(code="auth_code_xxx", code_verifier="verifier")

# Verify token
user = auth.verify_token(tokens["access_token"])

# Refresh token
new_tokens = auth.refresh_token(tokens["refresh_token"])
```

---

## 附录 B: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-08 | Initial release |
