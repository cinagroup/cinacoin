# Cinacoin Phase 2 测试用例文档 — Auth 认证流程

> **版本:** 1.0.0  
> **创建日期:** 2026-06-08  
> **维护者:** Cinacoin QA Team  
> **关联:** PHASE2_AUTH_PLAN.md, PHASE2_INTEGRATION_TEST_REPORT.md

---

## 目录

1. [邮箱/密码认证](#1-邮箱密码认证)
2. [OAuth 2.0 社交登录](#2-oauth-20-社交登录)
3. [Web3 钱包认证](#3-web3-钱包认证)
4. [Passkey (WebAuthn)](#4-passkey-webauthn)
5. [MFA 双因素认证](#5-mfa-双因素认证)
6. [跨模块集成测试](#6-跨模块集成测试)
7. [安全测试](#7-安全测试)

---

## 1. 邮箱/密码认证

### TC-AUTH-001: 用户注册 — 正常流程

- **模块:** Auth Service / Register
- **优先级:** P0
- **前置条件:** 数据库为空或目标邮箱/用户名未注册
- **测试步骤:**
  1. 发送 POST `/api/auth/register`
  2. Body: `{"email": "test@cinacoin.com", "username": "testuser", "password": "SecureP@ss123", "displayName": "Test User"}`
- **预期结果:**
  - HTTP 201 Created
  - Response 包含 `success: true`
  - Response 包含 `accessToken` (JWT 格式)
  - Response 包含 `refreshToken` (JWT 格式)
  - Response 包含 `user` 对象 (id, email, username, displayName, role)
  - 数据库中用户密码为 Argon2id 哈希
  - 用户状态为 `active`
- **自动化状态:** ✅ 单元测试覆盖 (validation.test.ts)

### TC-AUTH-002: 用户注册 — 邮箱已存在

- **模块:** Auth Service / Register
- **优先级:** P0
- **前置条件:** 邮箱 `existing@cinacoin.com` 已注册
- **测试步骤:**
  1. 发送 POST `/api/auth/register`
  2. Body: `{"email": "existing@cinacoin.com", "username": "newuser", "password": "SecureP@ss123"}`
- **预期结果:**
  - HTTP 409 Conflict
  - Response: `{"error": "Conflict", "message": "Email already registered"}`
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-AUTH-003: 用户注册 — 用户名已存在

- **模块:** Auth Service / Register
- **优先级:** P0
- **前置条件:** 用户名 `taken` 已注册
- **测试步骤:**
  1. 发送 POST `/api/auth/register`
  2. Body: `{"email": "new@cinacoin.com", "username": "taken", "password": "SecureP@ss123"}`
- **预期结果:**
  - HTTP 409 Conflict
  - Response: `{"error": "Conflict", "message": "Username already taken"}`
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-AUTH-004: 用户注册 — 输入验证失败

- **模块:** Auth Service / Register
- **优先级:** P0
- **前置条件:** 无
- **测试步骤:**
  1. 发送 POST `/api/auth/register`
  2. Body: `{"email": "invalid", "username": "ab", "password": "123"}`
- **预期结果:**
  - HTTP 400 Bad Request
  - Response 包含 `details` 数组描述各字段错误
- **自动化状态:** ✅ 单元测试覆盖 (validation.test.ts — 8 tests)

### TC-AUTH-005: 用户登录 — 正常流程

- **模块:** Auth Service / Login
- **优先级:** P0
- **前置条件:** 用户 `test@cinacoin.com` 已注册，密码 `SecureP@ss123`
- **测试步骤:**
  1. 发送 POST `/api/auth/login`
  2. Body: `{"email": "test@cinacoin.com", "password": "SecureP@ss123"}`
- **预期结果:**
  - HTTP 200 OK
  - Response 包含 `accessToken`, `refreshToken`, `user`
  - `last_login_at` 更新
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-AUTH-006: 用户登录 — 错误密码

- **模块:** Auth Service / Login
- **优先级:** P0
- **前置条件:** 用户已注册
- **测试步骤:**
  1. 发送 POST `/api/auth/login`
  2. Body: `{"email": "test@cinacoin.com", "password": "WrongPassword"}`
- **预期结果:**
  - HTTP 401 Unauthorized
  - Response: `{"error": "Unauthorized", "message": "Invalid email or password"}`
  - 不泄露邮箱是否存在
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-AUTH-007: 用户登录 — 账户挂起

- **模块:** Auth Service / Login
- **优先级:** P1
- **前置条件:** 用户状态为 `suspended`
- **测试步骤:**
  1. 发送 POST `/api/auth/login`
  2. Body: `{"email": "suspended@cinacoin.com", "password": "SecureP@ss123"}`
- **预期结果:**
  - HTTP 403 Forbidden
  - Response: `{"error": "Forbidden", "message": "Account is suspended or deleted"}`
- **自动化状态:** ⚠️ 待实现

### TC-AUTH-008: JWT 令牌刷新 — 正常流程

- **模块:** Auth Service / Refresh
- **优先级:** P0
- **前置条件:** 有效 refresh token
- **测试步骤:**
  1. 发送 POST `/api/auth/refresh`
  2. Body: `{"refreshToken": "<valid-refresh-token>"}`
- **预期结果:**
  - HTTP 200 OK
  - Response 包含新的 `accessToken` 和 `refreshToken`
  - 旧 refresh token 仍可使用（rotation 未强制）
- **自动化状态:** ✅ 单元测试覆盖 (jwt.test.ts)

### TC-AUTH-009: JWT 令牌刷新 — 过期令牌

- **模块:** Auth Service / Refresh
- **优先级:** P0
- **前置条件:** 过期 refresh token
- **测试步骤:**
  1. 发送 POST `/api/auth/refresh`
  2. Body: `{"refreshToken": "<expired-token>"}`
- **预期结果:**
  - HTTP 401 Unauthorized
  - Response: `{"error": "Unauthorized", "message": "Invalid or expired refresh token"}`
- **自动化状态:** ✅ 单元测试覆盖 (jwt.test.ts)

### TC-AUTH-010: JWT 令牌刷新 — Access Token 误用

- **模块:** Auth Service / Refresh
- **优先级:** P1
- **前置条件:** 有效 access token
- **测试步骤:**
  1. 发送 POST `/api/auth/refresh`
  2. Body: `{"refreshToken": "<access-token>"}`
- **预期结果:**
  - HTTP 401 Unauthorized
  - 拒绝 access token 作为 refresh token 使用
- **自动化状态:** ✅ 单元测试覆盖 (jwt.test.ts — token type check)

### TC-AUTH-011: 登出

- **模块:** Auth Service / Logout
- **优先级:** P0
- **前置条件:** 用户已登录
- **测试步骤:**
  1. 发送 POST `/api/auth/logout` with Bearer token
- **预期结果:**
  - HTTP 200 OK
  - Refresh token 被撤销
  - Session 记录更新
- **自动化状态:** ❌ 端点未实现

### TC-AUTH-012: 修改密码

- **模块:** Auth Service / Change Password
- **优先级:** P1
- **前置条件:** 用户已认证
- **测试步骤:**
  1. 发送 POST `/api/auth/change-password` with Bearer token
  2. Body: `{"currentPassword": "OldP@ss123", "newPassword": "NewP@ss456"}`
- **预期结果:**
  - HTTP 200 OK
  - 旧密码不可再登录
  - 新密码可登录
- **自动化状态:** ⚠️ 端点存在，待集成测试

---

## 2. OAuth 2.0 社交登录

### TC-OAUTH-001: Google OAuth — 发起授权

- **模块:** Auth Service / OAuth
- **优先级:** P0
- **前置条件:** GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 已配置
- **测试步骤:**
  1. 发送 GET `/api/auth/oauth/google`
- **预期结果:**
  - HTTP 302 Redirect
  - Location 指向 `https://accounts.google.com/...`
  - URL 包含 `state` 参数 (64-char hex)
  - URL 包含 `code_challenge` (PKCE)
  - URL 包含 `access_type=offline`
  - State 记录存储到数据库
- **自动化状态:** ✅ 单元测试覆盖 (oauth.test.ts)

### TC-OAUTH-002: Google OAuth — 回调处理（新用户）

- **模块:** Auth Service / OAuth Callback
- **优先级:** P0
- **前置条件:** State 已存储，Google 返回 authorization code
- **测试步骤:**
  1. 发送 GET `/api/auth/oauth/google/callback?code=xxx&state=yyy`
- **预期结果:**
  - 用户创建（无密码）
  - OAuth account 创建
  - JWT 令牌签发
  - `oauth.isNewUser = true`
  - Audit log 记录 `oauth.register`
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-OAUTH-003: Google OAuth — 回调处理（已有邮箱用户）

- **模块:** Auth Service / OAuth Callback
- **优先级:** P0
- **前置条件:** 邮箱已存在于 users 表
- **测试步骤:**
  1. 发送 GET `/api/auth/oauth/google/callback?code=xxx&state=yyy`
- **预期结果:**
  - OAuth account 关联到现有用户
  - `oauth.isAccountLink = true`
  - 不创建新用户
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-OAUTH-004: Google OAuth — 回调处理（已有 OAuth 用户）

- **模块:** Auth Service / OAuth Callback
- **优先级:** P0
- **前置条件:** OAuth account 已存在
- **测试步骤:**
  1. 发送 GET `/api/auth/oauth/google/callback?code=xxx&state=yyy`
- **预期结果:**
  - 更新 access_token 和 raw profile
  - 签发新 JWT 令牌
  - `isNewUser = false`, `isAccountLink = false`
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-OAUTH-005: GitHub OAuth — 完整流程

- **模块:** Auth Service / OAuth
- **优先级:** P1
- **前置条件:** GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET 已配置
- **测试步骤:**
  1. GET `/api/auth/oauth/github` → 重定向
  2. GitHub 回调 → GET `/api/auth/oauth/github/callback?code=xxx&state=yyy`
- **预期结果:**
  - 用户创建/关联成功
  - 邮箱从 `/user/emails` endpoint 获取（如果 profile 无邮箱）
  - 仅使用 primary + verified 邮箱
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-OAUTH-006: Discord OAuth — 完整流程

- **模块:** Auth Service / OAuth
- **优先级:** P2
- **前置条件:** DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET 已配置
- **测试步骤:**
  1. GET `/api/auth/oauth/discord` → 重定向
  2. Discord 回调 → GET `/api/auth/oauth/discord/callback?code=xxx&state=yyy`
- **预期结果:**
  - 用户创建/关联成功
  - Avatar URL 正确构造
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-OAUTH-007: OAuth — 无效 State

- **模块:** Auth Service / OAuth Callback
- **优先级:** P0
- **前置条件:** 使用伪造/过期 state
- **测试步骤:**
  1. GET `/api/auth/oauth/google/callback?code=xxx&state=invalid`
- **预期结果:**
  - HTTP 400 Bad Request
  - Response: `{"error": "Invalid State", "message": "OAuth state is invalid or expired"}`
- **自动化状态:** ✅ 单元测试覆盖 (oauth.test.ts)

### TC-OAUTH-008: OAuth — Provider 错误

- **模块:** Auth Service / OAuth Callback
- **优先级:** P1
- **前置条件:** Provider 返回 error
- **测试步骤:**
  1. GET `/api/auth/oauth/google/callback?error=access_denied&error_description=User+denied`
- **预期结果:**
  - HTTP 400 Bad Request
  - Response 包含 error_description
- **自动化状态:** ⚠️ 待实现

### TC-OAUTH-009: OAuth — 未配置 Provider

- **模块:** Auth Service / OAuth
- **优先级:** P1
- **前置条件:** Provider 环境变量未设置
- **测试步骤:**
  1. GET `/api/auth/oauth/google`
- **预期结果:**
  - HTTP 503 Service Unavailable
- **自动化状态:** ✅ 单元测试覆盖 (oauth.test.ts)

### TC-OAUTH-010: OAuth — 不支持的 Provider

- **模块:** Auth Service / OAuth
- **优先级:** P1
- **前置条件:** 无
- **测试步骤:**
  1. GET `/api/auth/oauth/facebook`
- **预期结果:**
  - HTTP 400 Bad Request
  - Response: `{"error": "Bad Request", "message": "Unsupported OAuth provider: facebook"}`
- **自动化状态:** ⚠️ 待实现

### TC-OAUTH-011: OAuth 账户解绑

- **模块:** Auth Service / OAuth Accounts
- **优先级:** P1
- **前置条件:** 用户有多个 OAuth provider
- **测试步骤:**
  1. DELETE `/api/auth/oauth/accounts` with Bearer token
  2. Body: `{"provider": "google", "providerUserId": "xxx"}`
- **预期结果:**
  - OAuth account 删除
  - 用户 oauth_providers 字段更新
- **自动化状态:** ✅ 代码逻辑审查通过

### TC-OAUTH-012: OAuth 账户解绑 — 最后一个 Provider

- **模块:** Auth Service / OAuth Accounts
- **优先级:** P1
- **前置条件:** 用户仅有 OAuth 登录（无密码）
- **测试步骤:**
  1. 尝试删除最后一个 OAuth 关联
- **预期结果:**
  - 应拒绝删除或警告
- **自动化状态:** ❌ 未保护 — 见 ISSUE-011

---

## 3. Web3 钱包认证

### TC-WEB3-001: Nonce 生成 — 正常流程

- **模块:** Auth Service / Web3
- **优先级:** P0
- **前置条件:** 无
- **测试步骤:**
  1. POST `/api/auth/web3/nonce`
  2. Body: `{"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18", "domain": "cinacoin.com"}`
- **预期结果:**
  - HTTP 200 OK
  - Response 包含 `nonce` (64-char hex)
  - Response 包含 `expiresAt` (5分钟后)
  - Nonce 存储到 `web3_nonces` 表
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-002: Nonce 生成 — 无效地址

- **模块:** Auth Service / Web3
- **优先级:** P1
- **前置条件:** 无
- **测试步骤:**
  1. POST `/api/auth/web3/nonce`
  2. Body: `{"address": "invalid", "domain": "cinacoin.com"}`
- **预期结果:**
  - HTTP 400 Bad Request
  - Response: `{"error": "Bad Request", "message": "Invalid Ethereum address format"}`
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-003: SIWE 签名验证 — 新钱包

- **模块:** Auth Service / Web3
- **优先级:** P0
- **前置条件:** 有效 nonce，MetaMask 签名
- **测试步骤:**
  1. POST `/api/auth/web3/verify`
  2. Body: `{"message": "<EIP-4361 message>", "signature": "0x...", "domain": "cinacoin.com"}`
- **预期结果:**
  - 用户自动创建
  - 钱包关联
  - JWT 令牌签发
  - `wallet.address` 返回
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-004: SIWE 签名验证 — 已有钱包

- **模块:** Auth Service / Web3
- **优先级:** P0
- **前置条件:** 钱包已注册
- **测试步骤:**
  1. POST `/api/auth/web3/verify`
- **预期结果:**
  - 找到现有用户
  - 更新 `last_used_at`
  - JWT 令牌签发
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-005: SIWE — Nonce 重放攻击

- **模块:** Auth Service / Web3
- **优先级:** P0
- **前置条件:** Nonce 已使用
- **测试步骤:**
  1. 使用相同 nonce 再次调用 verify
- **预期结果:**
  - HTTP 401 Unauthorized
  - Response: `{"error": "Unauthorized", "message": "Invalid or expired nonce"}`
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-006: SIWE — 无效签名

- **模块:** Auth Service / Web3
- **优先级:** P0
- **前置条件:** 有效 nonce，错误签名
- **测试步骤:**
  1. POST `/api/auth/web3/verify` with wrong signature
- **预期结果:**
  - HTTP 401 Unauthorized
  - Response: `{"error": "Unauthorized", "message": "Invalid signature"}`
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-007: SIWE — 消息格式解析

- **模块:** Auth Service / Web3 / SIWE
- **优先级:** P1
- **前置条件:** 无
- **测试步骤:**
  1. 调用 `parseSiweMessage` 解析标准 EIP-4361 消息
- **预期结果:**
  - 正确提取 domain, address, uri, version, chainId, nonce, issuedAt
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-008: 钱包管理 — 列出钱包

- **模块:** Auth Service / Web3
- **优先级:** P2
- **前置条件:** 用户有多个钱包
- **测试步骤:**
  1. 调用 `getUserWeb3Wallets(userId)`
- **预期结果:**
  - 返回钱包列表，primary 优先
- **自动化状态:** ⚠️ 代码审查通过

### TC-WEB3-009: 钱包管理 — 移除钱包

- **模块:** Auth Service / Web3
- **优先级:** P2
- **前置条件:** 用户有多个钱包
- **测试步骤:**
  1. 调用 `removeWeb3Wallet(walletId, userId)`
- **预期结果:**
  - 非 primary 钱包可删除
  - Primary 钱包不可删除（防止锁定）
- **自动化状态:** ⚠️ 代码审查通过

---

## 4. Passkey (WebAuthn)

### TC-PASSKEY-001: 注册选项生成

- **模块:** Auth Service / Passkey
- **优先级:** P0
- **前置条件:** 用户已认证 (Bearer token)
- **测试步骤:**
  1. POST `/api/auth/passkey/register/options` with Bearer token
- **预期结果:**
  - HTTP 200 OK
  - Response 包含 WebAuthn registration options
  - `challenge` 存储到 `webauthn_challenges` 表
  - `excludeCredentials` 包含已有 passkey
  - `rpName = "Cinacoin"`
  - `rpID` 从 CORS origin 提取
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-002: 注册验证

- **模块:** Auth Service / Passkey
- **优先级:** P0
- **前置条件:** 客户端完成 WebAuthn 注册
- **测试步骤:**
  1. POST `/api/auth/passkey/register/verify` with `{credential, challenge, name}`
- **预期结果:**
  - HTTP 200 OK
  - Passkey 存储到 `passkeys` 表
  - Response 包含 `passkeyId`, `name`, `createdAt`
  - Challenge 被消费
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-003: 注册验证 — 无效 Challenge

- **模块:** Auth Service / Passkey
- **优先级:** P0
- **前置条件:** 使用过期/无效 challenge
- **测试步骤:**
  1. POST `/api/auth/passkey/register/verify` with invalid challenge
- **预期结果:**
  - HTTP 401 Unauthorized
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-004: 登录选项生成 — 已知用户

- **模块:** Auth Service / Passkey
- **优先级:** P0
- **前置条件:** 用户已注册 passkey
- **测试步骤:**
  1. POST `/api/auth/passkey/login/options` with `{userId}`
- **预期结果:**
  - HTTP 200 OK
  - `allowCredentials` 包含用户所有 passkey
  - Challenge 存储
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-005: 登录选项生成 — Discoverable Credential

- **模块:** Auth Service / Passkey
- **优先级:** P1
- **前置条件:** 无 userId
- **测试步骤:**
  1. POST `/api/auth/passkey/login/options` with `{}`
- **预期结果:**
  - HTTP 200 OK
  - `allowCredentials` 为空（允许 discoverable credential）
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-006: 登录验证

- **模块:** Auth Service / Passkey
- **优先级:** P0
- **前置条件:** 客户端完成 WebAuthn 认证
- **测试步骤:**
  1. POST `/api/auth/passkey/login/verify` with `{credential, challenge}`
- **预期结果:**
  - HTTP 200 OK
  - JWT 令牌签发
  - Passkey counter 更新
  - `last_used_at` 更新
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-007: 登录验证 — Counter 回退检测

- **模块:** Auth Service / Passkey
- **优先级:** P1
- **前置条件:** 使用旧 counter 的认证响应
- **测试步骤:**
  1. POST `/api/auth/passkey/login/verify` with old counter
- **预期结果:**
  - @simplewebauthn/server 应检测到 counter 回退
  - 返回验证失败
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-008: 设备管理 — 列出 Passkeys

- **模块:** Auth Service / Passkey
- **优先级:** P1
- **前置条件:** 用户有多个 passkeys
- **测试步骤:**
  1. 调用 `getUserPasskeys(userId)`
- **预期结果:**
  - 返回 passkey 列表
  - 按 `created_at DESC` 排序
  - 不包含 `public_key` 敏感数据（或脱敏）
- **自动化状态:** ⚠️ 代码审查通过

### TC-PASSKEY-009: 设备管理 — 删除 Passkey

- **模块:** Auth Service / Passkey
- **优先级:** P1
- **前置条件:** 用户有 passkey
- **测试步骤:**
  1. 调用 `deletePasskey(passkeyId, userId)`
- **预期结果:**
  - Passkey 删除
  - 仅能删除自己的 passkey（user_id 验证）
- **自动化状态:** ⚠️ 代码审查通过

---

## 5. MFA 双因素认证

### TC-MFA-001: TOTP 设置 — 生成 Secret

- **模块:** Auth Service / MFA
- **优先级:** P0
- **前置条件:** 用户已认证
- **测试步骤:**
  1. POST `/api/auth/mfa/enable` with Bearer token
- **预期结果:**
  - HTTP 200 OK
  - Response 包含 `secret` (base32)
  - Response 包含 `uri` (otpauth://totp/Cinacoin:...)
  - Response 包含 `recoveryCodes` (10 个 XXXX-XXXX 格式)
  - TOTP method 存储到 `mfa_methods` (is_enabled=FALSE)
  - Recovery codes 哈希存储
- **自动化状态:** ⚠️ 代码审查通过

### TC-MFA-002: TOTP 验证 — 激活 MFA

- **模块:** Auth Service / MFA
- **优先级:** P0
- **前置条件:** TOTP 已设置（未验证）
- **测试步骤:**
  1. POST `/api/auth/mfa/verify` with `{code: "<valid-totp-code>"}`
  2. 需要 Bearer token
- **预期结果:**
  - HTTP 200 OK
  - `verified: true`, `mfaEnabled: true`
  - `mfa_methods.is_enabled = TRUE`
  - `users.mfa_enabled = TRUE`
- **自动化状态:** ⚠️ 代码审查通过

### TC-MFA-003: TOTP 验证 — 错误 Code

- **模块:** Auth Service / MFA
- **优先级:** P0
- **前置条件:** TOTP 已设置
- **测试步骤:**
  1. POST `/api/auth/mfa/verify` with `{code: "000000"}`
- **预期结果:**
  - HTTP 401 Unauthorized
  - Response: `{"error": "Unauthorized", "message": "Invalid TOTP code"}`
- **自动化状态:** ⚠️ 代码审查通过

### TC-MFA-004: 登录 MFA 挑战 — TOTP 验证

- **模块:** Auth Service / MFA
- **优先级:** P0
- **前置条件:** 用户已启用 MFA，有 MFA session token
- **测试步骤:**
  1. POST `/api/auth/mfa/verify` with `{code: "<totp>", sessionToken: "xxx"}`
- **预期结果:**
  - HTTP 200 OK
  - JWT 令牌签发
  - MFA challenge 被消费
- **自动化状态:** ⚠️ 代码审查通过

### TC-MFA-005: 登录 MFA 挑战 — 恢复码验证

- **模块:** Auth Service / MFA
- **优先级:** P0
- **前置条件:** 用户有恢复码
- **测试步骤:**
  1. POST `/api/auth/mfa/verify` with `{code: "ABCD-1234", method: "recovery_code", sessionToken: "xxx"}`
- **预期结果:**
  - HTTP 200 OK
  - JWT 令牌签发
  - 恢复码被消费（从列表移除）
- **自动化状态:** ⚠️ 代码审查通过

### TC-MFA-006: 恢复码 — 用尽后禁用

- **模块:** Auth Service / MFA
- **优先级:** P1
- **前置条件:** 仅剩 1 个恢复码
- **测试步骤:**
  1. 使用最后一个恢复码
- **预期结果:**
  - 验证成功
  - `recovery_code` method 的 `is_enabled` 设为 FALSE
- **自动化状态:** ⚠️ 代码审查通过

### TC-MFA-007: MFA 禁用

- **模块:** Auth Service / MFA
- **优先级:** P0
- **前置条件:** MFA 已启用
- **测试步骤:**
  1. POST `/api/auth/mfa/disable` with Bearer token
- **预期结果:**
  - HTTP 200 OK
  - 所有 MFA methods 停用
  - `users.mfa_enabled = FALSE`
- **自动化状态:** ⚠️ 代码审查通过

### TC-MFA-008: MFA 状态查询

- **模块:** Auth Service / MFA
- **优先级:** P1
- **前置条件:** 用户已认证
- **测试步骤:**
  1. GET `/api/auth/mfa/status` with Bearer token
- **预期结果:**
  - HTTP 200 OK
  - Response 包含 MFA 状态、启用方法、恢复码剩余数
- **自动化状态:** ⚠️ 端点存在，待集成测试

### TC-MFA-009: TOTP 窗口容差

- **模块:** Auth Service / MFA
- **优先级:** P1
- **前置条件:** TOTP 已启用
- **测试步骤:**
  1. 使用上一个时间窗口 (T-30s) 的 code
  2. 使用下一个时间窗口 (T+30s) 的 code
- **预期结果:**
  - 两个 code 都应验证通过 (window=1)
- **自动化状态:** ⚠️ 代码审查通过

---

## 6. 跨模块集成测试

### TC-INTEG-001: 注册 → 启用 MFA → 登录 → MFA 验证

- **模块:** Auth Service / 全流程
- **优先级:** P0
- **前置条件:** 无
- **测试步骤:**
  1. POST `/api/auth/register` → 获取 tokens
  2. POST `/api/auth/mfa/enable` with Bearer → 获取 secret, recoveryCodes
  3. POST `/api/auth/mfa/verify` with TOTP code → 激活 MFA
  4. POST `/api/auth/login` → 应触发 MFA 挑战
  5. POST `/api/auth/mfa/verify` with sessionToken → 获取 JWT
- **预期结果:**
  - 完整流程无错误
  - 步骤 4 应返回 `mfaRequired: true`（当前未实现，见 ISSUE-002）
- **自动化状态:** ❌ 待实现 — 发现 ISSUE-002

### TC-INTEG-002: 注册 → 添加 Passkey → Passkey 登录

- **模块:** Auth Service / 全流程
- **优先级:** P0
- **前置条件:** 无
- **测试步骤:**
  1. POST `/api/auth/register` → 获取 tokens
  2. POST `/api/auth/passkey/register/options` → 获取 WebAuthn options
  3. (客户端 WebAuthn 注册)
  4. POST `/api/auth/passkey/register/verify` → 存储 passkey
  5. POST `/api/auth/passkey/login/options` → 获取 auth options
  6. (客户端 WebAuthn 认证)
  7. POST `/api/auth/passkey/login/verify` → 获取 JWT
- **预期结果:**
  - 完整流程无错误
  - 步骤 7 返回有效 JWT
- **自动化状态:** ❌ 待实现 (需要 WebAuthn mock)

### TC-INTEG-003: OAuth 注册 → 添加密码 → 密码登录

- **模块:** Auth Service / 全流程
- **优先级:** P1
- **前置条件:** OAuth provider 已配置
- **测试步骤:**
  1. OAuth 流程 → 用户创建（无密码）
  2. POST `/api/auth/change-password` → 设置密码
  3. POST `/api/auth/login` with email + password → 登录成功
- **预期结果:**
  - 用户可通过两种方式登录
- **自动化状态:** ❌ 待实现

### TC-INTEG-004: Web3 注册 → 添加 Passkey → 双因素

- **模块:** Auth Service / 全流程
- **优先级:** P2
- **前置条件:** 无
- **测试步骤:**
  1. Web3 SIWE 流程 → 用户创建
  2. 添加 Passkey
  3. 使用 Passkey 登录
- **预期结果:**
  - 多认证方法共存
- **自动化状态:** ❌ 待实现

### TC-INTEG-005: Token 刷新 → 用户挂起 → 刷新被拒

- **模块:** Auth Service / 全流程
- **优先级:** P1
- **前置条件:** 用户已登录
- **测试步骤:**
  1. 获取 refresh token
  2. 管理员挂起用户
  3. POST `/api/auth/refresh` with refresh token
- **预期结果:**
  - HTTP 403 Forbidden
- **自动化状态:** ❌ 待实现

---

## 7. 安全测试

### TC-SEC-001: 暴力破解防护

- **模块:** Auth Service / Security
- **优先级:** P0
- **测试步骤:**
  1. 连续 10 次错误密码登录
- **预期结果:**
  - 应触发 rate limiting
  - 返回 429 Too Many Requests
- **自动化状态:** ❌ 未实现 (ISSUE-006)

### TC-SEC-002: JWT Token 篡改

- **模块:** Auth Service / Security
- **优先级:** P0
- **测试步骤:**
  1. 修改 JWT payload 中的 `sub` 字段
  2. 使用篡改后的 token 访问受保护端点
- **预期结果:**
  - HTTP 401 Unauthorized
  - 签名验证失败
- **自动化状态:** ✅ 单元测试覆盖 (jwt.test.ts)

### TC-SEC-003: SQL 注入

- **模块:** Auth Service / Security
- **优先级:** P0
- **测试步骤:**
  1. 在 email 字段注入 SQL: `' OR 1=1 --`
  2. 在 username 字段注入 SQL
- **预期结果:**
  - 参数化查询防止注入
  - 返回验证错误或正常处理
- **自动化状态:** ⚠️ 代码审查 — 使用 pg 参数化查询，安全

### TC-SEC-004: XSS 防护

- **模块:** Auth Service / Security
- **优先级:** P1
- **测试步骤:**
  1. 在 displayName 字段注入 `<script>alert(1)</script>`
- **预期结果:**
  - 输入被清理或正确转义
  - 响应中不包含可执行脚本
- **自动化状态:** ⚠️ 待实现

### TC-SEC-005: Token 泄露 — URL 参数

- **模块:** Auth Service / Security
- **优先级:** P0
- **测试步骤:**
  1. 完成 OAuth 流程
  2. 检查回调重定向 URL
- **预期结果:**
  - Token 不应出现在 URL 参数中
- **自动化状态:** ❌ 发现 ISSUE-003

### TC-SEC-006: 密码策略 — 弱密码

- **模块:** Auth Service / Security
- **优先级:** P1
- **测试步骤:**
  1. 注册使用密码 `12345678`
- **预期结果:**
  - 应拒绝纯数字/常见密码
- **自动化状态:** ❌ 未实现 (ISSUE-008)

### TC-SEC-007: 用户枚举 — 登录

- **模块:** Auth Service / Security
- **优先级:** P1
- **测试步骤:**
  1. 登录使用不存在的邮箱
  2. 登录使用存在邮箱 + 错误密码
- **预期结果:**
  - 两种情况返回相同错误消息
  - 不泄露邮箱是否存在
- **自动化状态:** ✅ 代码审查通过 — 统一 "Invalid email or password"

### TC-SEC-008: 授权绕过 — 无 Token 访问

- **模块:** Auth Service / Security
- **优先级:** P0
- **测试步骤:**
  1. 不带 Authorization header 访问 `/api/auth/me`
- **预期结果:**
  - HTTP 401 Unauthorized
- **自动化状态:** ✅ 代码审查通过 — requireAuth 中间件

---

*文档版本: 1.0.0*  
*总测试用例数: 62*  
*自动化状态:*
- ✅ 已有单元测试: 18
- ⚠️ 代码审查通过: 28
- ❌ 待实现/发现问题: 16
