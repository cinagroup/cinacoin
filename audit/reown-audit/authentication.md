# Authentication Audit: Cinacoin vs Reown

> **审计日期**: 2026-06-09
> **审计范围**: `/workers/auth-service/src/` 全部认证相关代码
> **审计人**: 000 (Web3 基础设施安全审计)
> **对标**: Reown/AppKit Authentication System

---

## 一、功能对比矩阵

| # | 功能 | Reown | Cinacoin | 差距 | 优先级 |
|---|------|-------|----------|------|--------|
| 1 | Email/Password 登录 | ✅ (Email Magic Link) | ✅ PBKDF2-SHA256 | 中等 — 缺 Magic Link | P2 |
| 2 | Social Login — Google | ✅ | ✅ | 无 | — |
| 3 | Social Login — GitHub | ✅ | ✅ | 无 | — |
| 4 | Social Login — Discord | ✅ | ✅ | 无 | — |
| 5 | Social Login — X (Twitter) | ✅ | ❌ 缺失 | 严重 | P1 |
| 6 | Social Login — Apple | ✅ | ❌ 缺失 | 严重 | P1 |
| 7 | Social Login — Facebook | ✅ | ❌ 缺失 | 中等 | P2 |
| 8 | Social Login — Farcaster | ✅ | ❌ 缺失 | 严重 (Web3 项目) | P0 |
| 9 | SIWE (EIP-4361) | ✅ | ❌ 仅类型定义，无实现 | 严重 | P0 |
| 10 | SIWX (跨链认证) | ✅ | ❌ 缺失 | 严重 | P1 |
| 11 | Smart Account Auth (Passkey) | ✅ Passkey + EOA | ❌ 仅类型定义，无实现 | 严重 | P0 |
| 12 | Multiwallet Linking | ✅ | ❌ 缺失 | 中等 | P1 |
| 13 | Session Management | ✅ 自动续期 + 多设备 | ⚠️ 部分 — Token Rotation + Reuse Detection，无多设备管理 API | 中等 | P1 |
| 14 | Transaction Screening | ✅ | ❌ 缺失 | 中等 | P2 |
| 15 | Domain Verification | ✅ | ❌ 缺失 | 中等 | P2 |
| 16 | MFA (TOTP) | ❌ (Reown 不含) | ✅ 完整实现 | **Cinacoin 领先** | — |
| 17 | Recovery Codes | ❌ (Reown 不含) | ✅ 10 码生成 | **Cinacoin 领先** | — |
| 18 | Password Reset | ✅ (Email) | ❌ 无路由 | 严重 | P0 |
| 19 | Email Verification | ✅ | ❌ 字段存在但无流程 | 严重 | P0 |

---

## 二、安全差距分析

### 🔴 严重 (Critical)

#### S1. OAuth PKCE 使用 `plain` 而非 `S256`
- **位置**: `routes/oauth/index.ts` 第 53 行
- **问题**: `code_challenge_method=plain` 直接传递 code_verifier，攻击者截获 authorization code 即可推导 code_verifier
- **影响**: OAuth 授权码拦截攻击
- **修复**: 改用 `S256`，即 `code_challenge = BASE64URL(SHA256(code_verifier))`
```typescript
// 当前（不安全）
&code_challenge=${encodeURIComponent(codeVerifier)}
&code_challenge_method=plain

// 应改为
const challenge = base64url(sha256(codeVerifier));
&code_challenge=${challenge}
&code_challenge_method=S256
```

#### S2. JWT 密钥使用环境变量，无 KMS 集成
- **位置**: `lib/jwt.ts`，`Env.JWT_SECRET` / `Env.JWT_REFRESH_SECRET`
- **问题**: HS256 对称密钥直接存于环境变量，无密钥轮换机制，泄露即全面失守
- **影响**: 密钥管理不符合 SOC2/ISO27001 要求
- **修复**: 迁移至 Cloudflare KMS 或使用 JWT 非对称签名 (RS256/ES256)，支持密钥轮换

#### S3. Logout 无服务端 Token 撤销
- **位置**: `routes/auth/logout.ts`
- **问题**: Logout 仅返回 success，不撤销 token。Access token 在过期前（15min）持续有效
- **影响**: 设备丢失/被盗时无法立即登出
- **修复**: 实现 KV-based token blacklist 或切换到短生命周期 access token + 服务端 session 校验

#### S4. 无密码重置流程
- **问题**: 无 `POST /auth/forgot-password` 或 `POST /auth/reset-password` 路由
- **影响**: 用户无法自助恢复账户，增加客服压力和社会工程攻击面
- **修复**: 实现基于 email token 的密码重置（带速率限制和 TTL）

#### S5. 无 Email 验证流程
- **问题**: `email_verified_at` 字段存在但从未写入，无验证邮件发送
- **影响**: 任意邮箱注册，无法用于信任链（如密码重置）
- **修复**: 注册后发送验证邮件，验证前限制账户权限

#### S6. CORS 配置允许 `*` + `credentials: true`
- **位置**: `index.ts` 第 28 行
- **问题**: `CORS_ORIGIN` 默认为 `*`，同时设置 `credentials: true`。浏览器会拒绝此组合，但如果配置为具体域名则安全。代码逻辑允许环境变量注入任意 origin
- **影响**: 若配置不当可导致跨域凭证泄露
- **修复**: 强制 CORS_ORIGIN 为具体域名列表，禁止通配符 + credentials 组合

### 🟡 中等 (Medium)

#### S7. Rate Limiting 基于可伪造的 IP 头
- **位置**: `middleware/rate-limit.ts` `getClientIp()`
- **问题**: 依赖 `x-forwarded-for` / `x-real-ip`，Cloudflare 环境下应使用 `CF-Connecting-IP`
- **影响**: 攻击者可伪造 IP 绕过速率限制
- **修复**: 优先读取 `CF-Connecting-IP`，或使用 Cloudflare Turnstile

#### S8. OAuth Access Token 明文存储
- **位置**: `routes/oauth/index.ts` 第 156 行
- **问题**: Provider access_token 以明文存入 `oauth_accounts` 表
- **影响**: 数据库泄露即暴露第三方 token
- **修复**: 加密存储（使用 KV 或 D1 加密列）

#### S9. 密码哈希迭代次数受 Workers 限制
- **位置**: `lib/password.ts`
- **问题**: PBKDF2 迭代 100,000 次（OWASP 推荐 SHA-256 需 600,000+），受 Cloudflare Workers 上限限制
- **影响**: 密码哈希强度低于行业标准
- **缓解**: 代码注释已说明限制原因。可考虑 Workers 支持更高迭代后升级，或改用 scrypt

#### S10. 无 CSRF 防护（非 OAuth 端点）
- **问题**: API 使用 Bearer token 认证（非 cookie），天然免疫 CSRF。但若未来引入 cookie session 则需 CSRF token
- **当前风险**: 低（Bearer-only）

#### S11. 注册后自动发放 Token（无 Email 验证门控）
- **位置**: `routes/auth/register.ts`
- **问题**: 注册成功直接返回 access/refresh token，无需验证邮箱
- **影响**: 可批量注册账户

#### S12. 无账户锁定机制
- **问题**: 登录失败 5 次/15min 速率限制是 IP 级别，非账户级别。攻击者可从不同 IP 暴力破解同一账户
- **修复**: 增加账户级别失败计数 + 渐进式延迟

### 🟢 轻微 (Low)

#### S13. MFA Disable 可无 TOTP 验证
- **位置**: `routes/mfa/index.ts` `/disable` 路由
- **问题**: `code` 参数可选，若不提供则直接禁用 MFA（只需 `confirmDisable: true`）
- **影响**: 攻击者获取 access token 后可关闭 MFA
- **修复**: 强制要求 TOTP code 或 recovery code 才能禁用

#### S14. OAuth `return_url` 参数未验证
- **位置**: `routes/oauth/index.ts` callback 路由
- **问题**: `return_url` query 参数直接拼接到 redirect URL，可被利用做 open redirect
- **修复**: 白名单校验 return_url 域名

#### S15. 安全事件日志仅存 D1，无告警
- **问题**: `logSecurityEvent()` 写入数据库但无实时告警（如 token reuse）
- **修复**: 接入告警系统（Webhook / email / Sentry）

---

## 三、缺失功能优先级排序

| 优先级 | 功能 | 理由 |
|--------|------|------|
| **P0** | SIWE 签名登录 | Web3 项目核心功能，无此功能 Web3 用户无法认证 |
| **P0** | Passkey 认证 | 无密钥认证是行业趋势，类型已预留说明设计意图 |
| **P0** | 密码重置流程 | 基本用户自助功能缺失 |
| **P0** | Email 验证 | 信任链基础，影响密码重置和反滥用 |
| **P0** | OAuth PKCE S256 | 当前实现有已知安全漏洞 |
| **P1** | Farcaster 登录 | Web3 社交身份，对 Crypto 用户群体关键 |
| **P1** | X/Twitter + Apple 登录 | 用户增长关键渠道 |
| **P1** | SIWX 跨链认证 | 多链钱包用户体验 |
| **P1** | 多设备 Session 管理 API | 用户需能查看/撤销活跃会话 |
| **P1** | Multiwallet Linking | 一个账户绑定多个链钱包 |
| **P2** | Facebook 登录 | 覆盖用户群 |
| **P2** | Email Magic Link | 无密码登录选项 |
| **P2** | Transaction Screening | 安全增强 |
| **P2** | Domain Verification | 防钓鱼 |

---

## 四、实施路线图

### Phase 1: 安全加固 + 核心缺失 (1-2 周)

**目标**: 修复严重安全漏洞，补齐基本认证闭环

| 任务 | 文件 | 工作量 |
|------|------|--------|
| 修复 OAuth PKCE → S256 | `routes/oauth/index.ts` | 2h |
| 实现密码重置流程 (forgot + reset) | 新建 `routes/auth/forgot-password.ts`, `routes/auth/reset-password.ts` | 4h |
| 实现 Email 验证流程 | 新建 `routes/auth/verify-email.ts` + 邮件发送 | 6h |
| 实现 Logout 服务端 token 撤销 | `routes/auth/logout.ts` + KV blacklist | 3h |
| 修复 CORS 配置，禁止 `*` + credentials | `index.ts` | 1h |
| Rate limit 改用 `CF-Connecting-IP` | `middleware/rate-limit.ts` | 1h |
| 账户级别登录失败锁定 | `routes/auth/login.ts` | 3h |
| 修复 MFA disable 强制验证 | `routes/mfa/index.ts` | 1h |
| OAuth return_url 白名单 | `routes/oauth/index.ts` | 1h |
| 加密 OAuth token 存储 | `routes/oauth/index.ts` | 2h |

### Phase 2: Web3 认证核心 (3-4 周)

**目标**: 实现 Web3 原生认证能力

| 任务 | 说明 | 工作量 |
|------|------|--------|
| SIWE (EIP-4361) 登录 | 新建 `routes/auth/web3/siwe.ts`：生成 nonce → 前端签名 → 后端验签（viem/ethers） | 8h |
| Passkey (WebAuthn) 注册/认证 | 新建 `routes/auth/passkey/`：registration options → verify → authentication options → verify。使用 `@simplewebauthn/server` | 16h |
| Farcaster Sign In | 新建 `routes/auth/web3/farcaster.ts`：基于 Farcaster Auth SDK 验证签名 | 6h |
| 多设备 Session 管理 API | 新建 `GET /auth/sessions`, `DELETE /auth/sessions/:id`，查询/撤销活跃会话 | 6h |
| JWT 密钥轮换机制 | 支持多密钥并存，`kid` header 标识，定期轮换 | 6h |

### Phase 3: 生态扩展 (1-2 月)

**目标**: 补齐 Social Login 生态，实现高级功能

| 任务 | 说明 | 工作量 |
|------|------|--------|
| X/Twitter OAuth 2.0 登录 | 新增 provider，复用 OAuth 框架 | 4h |
| Apple Sign In | 需处理 Apple 特殊要求（name 仅首次返回、private email relay） | 6h |
| Facebook Login | Graph API 集成 | 4h |
| SIWX 跨链认证框架 | 抽象 SIWE 为 generic chain-agnostic 签名验证（Solana, Cosmos 等） | 12h |
| Multiwallet Linking | `POST /auth/wallets/link`, `DELETE /auth/wallets/:id`，一个用户关联多链多钱包 | 8h |
| Transaction Screening | 集成 Blockaid / GoPlus 等交易安全 API | 8h |
| Domain Verification | 类似 Reown 的域名所有权验证，防钓鱼 | 6h |
| Email Magic Link | 无密码登录选项 | 4h |
| 安全事件实时告警 | Token reuse / 异常登录 → Webhook/Email 通知 | 4h |

---

## 五、各缺失功能实现建议

### 5.1 SIWE (Sign In With Ethereum)

```
POST /auth/web3/siwe/nonce    → 返回 { nonce }
POST /auth/web3/siwe/verify   → 提交 { message, signature, chainId }
                                → 后端用 viem recoverAddress() 验签
                                → 匹配 message 中的 address + nonce + domain
                                → 返回 JWT tokens
```

**依赖**: `viem` (Workers-compatible) 或 `@noble/curves`
**数据库**: `wallets` 表 (address, user_id, chain_id, is_primary)

### 5.2 Passkey (WebAuthn)

```
POST /auth/passkey/register/options     → { challenge, rp, user, pubKeyCredParams }
POST /auth/passkey/register/verify      → { credential } → 验证 attestation
POST /auth/passkey/authenticate/options → { challenge, allowCredentials }
POST /auth/passkey/authenticate/verify  → { credential } → 验证 assertion → JWT
```

**依赖**: `@simplewebauthn/server` + `@simplewebauthn/browser`
**数据库**: `passkeys` 表 (credential_id, public_key, counter, user_id)

### 5.3 Farcaster Sign In

```
GET  /auth/farcaster/challenge  → { siweUri, domain, nonce }
POST /auth/farcaster/verify     → { message, signature, fid }
                                → Farcaster Hub API 验证 fid
                                → 验签 → JWT
```

**依赖**: `@farcaster/auth-kit` 或自建 SIWE + Hub API

### 5.4 密码重置

```
POST /auth/forgot-password  → { email } → 发送 reset token (15min TTL)
POST /auth/reset-password   → { token, newPassword } → 更新密码
```

### 5.5 Email 验证

```
POST /auth/verify-email/resend  → 重新发送验证邮件
GET  /auth/verify-email?token=  → 验证邮箱
```

注册后 `email_verified_at = null`，验证前限制 API 访问权限。

### 5.6 多设备 Session 管理

```
GET    /auth/sessions          → 列出活跃会话 (IP, UA, 创建时间, 最后活跃)
DELETE /auth/sessions/:id      → 撤销指定会话
DELETE /auth/sessions          → 撤销所有其他会话
```

**数据源**: 已有 `sessions` 表，需增加 `last_active_at` 字段和客户端查询 API。

---

## 六、总结

### Cinacoin 认证系统现状评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 传统认证 (Email/Password) | 7/10 | 核心完整，缺密码重置和邮箱验证 |
| Social Login | 5/10 | 3/8 providers，缺主流 (Apple, X) |
| Web3 认证 | 1/10 | 仅类型定义，零实现 |
| MFA | 9/10 | TOTP + Recovery Codes，完整且安全 |
| Token 安全 | 7/10 | Rotation + Reuse Detection 优秀，PKCE 有漏洞 |
| Session 管理 | 5/10 | 后端 rotation 好，但无多设备管理 API |
| 整体安全 | 6/10 | 多处中等漏洞需修复 |

### 与 Reown 差距总结

- **功能覆盖率**: ~35%（Reown 15 项核心功能中 Cinacoin 完整实现约 5 项）
- **最大差距**: Web3 认证完全缺失（SIWE / Passkey / Farcaster / SIWX）
- **最大优势**: MFA 系统比 Reown 更完整（Reown 不含 TOTP/Recovery）
- **安全隐患**: 6 个严重/中等问题需优先修复

### 建议

1. **立即执行 Phase 1**（安全加固），预计 1-2 周
2. **Phase 2 与业务并行**：SIWE 和 Passkey 是 Web3 产品核心竞争力
3. **Phase 3 按用户数据驱动**：根据用户反馈决定 Social Login 优先级
