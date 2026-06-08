# 安全审计报告 — Cinacoin (ONUX)

**审计日期:** 2026-06-08
**审计范围:** 核心安全代码（密钥服务、钱包、认证、社交登录、RPC 代理）

---

## 严重问题 (Critical)

### [S-001] 生产环境 API 密钥硬编码在 .env 文件中
- **文件:** `.env` (L17)
- **描述:** Cloudflare API Token (`cfut_[REDACTED]`) 以明文形式硬编码在 `.env` 文件中。
- **风险:** 攻击者可通过 Git 历史或文件系统获取此 token，操控 Cloudflare 资源（DNS、Workers、Tunnel 等）。
- **修复建议:** 立即轮换 API token，使用密钥管理服务（如 AWS Secrets Manager），将 `.env` 加入 `.gitignore`。

### [S-002] 密钥服务使用硬编码开发密钥作为后备
- **文件:** `packages/keys-server/src/KeyManager.ts` (L51-57)
- **描述:** 当 `encryptionKey` 未配置时，回退到 `default-dev-key-do-not-use-in-production`。
- **风险:** 如果生产环境忘记配置 `ENCRYPTION_KEY`，所有用户私钥将使用公开已知的密钥加密。
- **修复建议:** 生产环境启动时，如果 `encryptionKey` 未设置，直接抛出错误并拒绝启动。

### [S-003] 社交登录钱包派生使用不安全的简化实现
- **文件:** `packages/social-login/src/wallet-derivation.ts` (L111-120)
- **描述:** `privateKeyToAddress` 使用 SHA-256 哈希生成地址，而非标准 secp256k1 椭圆曲线密码学。
- **风险:** 用户通过社交登录创建的钱包实际上无法使用，可能导致资金丢失。
- **修复建议:** 使用 `@noble/curves/secp256k1` 或 `ethers` 库进行正确的密钥派生。

---

## 高危问题 (High)

### [H-001] 密钥服务使用硬编码盐值
- **文件:** `packages/keys-server/src/KeyManager.ts` (L42)
- **描述:** Scrypt 使用硬编码盐值 `onux-salt`。
- **风险:** 相同密码在不同实例上生成相同加密密钥，降低安全性。
- **修复建议:** 初始化时生成随机 16 字节盐值，与加密数据一起存储。

### [H-002] 嵌入式钱包使用硬编码盐值进行密钥派生
- **文件:** `packages/embedded-wallet/src/WalletManager.ts` (L300)
- **描述:** PBKDF2 使用硬编码盐值 `cinacoin-wallet-salt`。
- **风险:** 所有使用相同密码的用户将生成相同的派生密钥。
- **修复建议:** 为每个钱包生成唯一随机盐值，与加密数据一起存储。

### [H-003] 备份加密使用硬编码盐值
- **文件:** `packages/embedded-wallet/src/backup.ts` (L323)
- **描述:** 备份加密的 PBKDF2 使用硬编码盐值 `cinacoin-wallet-backup`。
- **风险:** 所有备份使用相同盐值，易受批量攻击。
- **修复建议:** 生成随机盐值并嵌入备份 JSON 中。

### [H-004] 默认会话密钥不安全
- **文件:** `packages/core-sdk/src/session.ts` (L82)
- **描述:** 默认会话密钥 `cinacoin-session-secret-change-me`。
- **风险:** 攻击者可伪造会话令牌。
- **修复建议:** 生产环境强制要求配置密钥，否则拒绝启动。

### [H-005] 默认 JWT 密钥不安全
- **文件:** `packages/keys-server/src/index.ts` (L93)
- **描述:** 默认 JWT 密钥 `cinacoin-keys-server-dev-secret-change-me`。
- **风险:** 攻击者可伪造 JWT 令牌获取任意用户权限。
- **修复建议:** 生产环境强制配置，否则拒绝启动。

### [H-006] OTP 会话存储使用内存 Map（分布式系统不安全）
- **文件:** `packages/social-login/src/auth/phone-otp.ts` (L119)
- **描述:** Phone OTP 会话存储在进程内 `Map` 中。
- **风险:** 负载均衡场景下 OTP 验证失败；进程重启后待验证 OTP 丢失。
- **修复建议:** 使用 Redis 或数据库存储 OTP 会话。

### [H-007] 社交恢复会话使用内存 Map
- **文件:** `packages/session-keys/src/social-recovery.ts` (L30)
- **描述:** 恢复会话存储在进程内 `Map` 中。
- **风险:** 分布式环境不可用。
- **修复建议:** 使用持久化存储。

---

## 中等问题 (Medium)

### [M-001] 社交登录提供者归一化逻辑有缺陷
- **文件:** `packages/social-login/src/social-wallet.ts` (L397-404)
- **描述:** 未知提供者默认返回 `'twitter'`。
- **风险:** 身份混淆和钱包冲突。
- **修复建议:** 对未知提供者抛出错误。

### [M-002] 域名验证的 SSL 检查仅为表面检查
- **文件:** `packages/verify-sdk/src/domain-verify.ts` (L153-170)
- **描述:** `checkSSL` 仅尝试 HTTPS HEAD 请求，不检查证书有效性。
- **风险:** 自签名证书或过期证书也会通过检查。
- **修复建议:** 使用专业 SSL 检查库验证证书链。

### [M-003] RPC 代理缓存无 TTL 清理机制
- **文件:** `packages/rpc-proxy/src/cache.ts` (*)
- **描述:** 内存缓存无清理机制，可能内存泄漏。
- **风险:** 长时间运行后内存耗尽。
- **修复建议:** 添加 TTL 和定期清理。

---

## 总结

| 级别 | 数量 |
|------|------|
| Critical | 3 |
| High | 7 |
| Medium | 3 |
