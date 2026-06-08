# Critical Security Vulnerabilities - Fix Report

**Date:** 2026-06-08  
**Status:** ✅ All Critical Issues Resolved

## Summary

Fixed 5 critical security vulnerabilities that posed immediate risks to production systems.

---

## Fixes Applied

### 1. [S-002] 密钥服务 fallback 到公开开发密钥 ✅

**文件:** `packages/keys-server/src/KeyManager.ts`  
**风险等级:** Critical  
**问题:** 生产环境在缺少 `ENCRYPTION_KEY` 时会 fallback 到硬编码的开发密钥 `default-dev-key-do-not-use-in-production`

**修复内容:**
- 生产环境 (`NODE_ENV=production`) 启动时如果 `encryptionKey` 未设置，直接抛出错误并拒绝启动
- 移除了 `decryptKey()` 方法中对 `LEGACY_DEV_KEY` 的 fallback
- 移除了 `migrateLegacyKey()` 方法中对 `LEGACY_DEV_KEY` 的 fallback
- 开发环境保留 fallback 但输出明确的安全警告

**影响:** 生产环境现在强制要求配置 `ENCRYPTION_KEY`，防止使用已知的弱密钥。

---

### 2. [H-001] 密钥服务使用硬编码盐值 ✅

**文件:** `packages/keys-server/src/KeyManager.ts`  
**风险等级:** High  
**问题:** 使用硬编码的盐值 `onux-salt` 进行密钥派生，导致所有实例使用相同的加密密钥

**修复内容:**
- 构造函数默认使用 `randomBytes(16)` 生成随机 16 字节盐值
- 支持通过 `config.salt` 传入自定义盐值（hex 编码）
- 盐值与加密数据一起存储在 `StoredKey.salt` 字段
- `decryptKey()` 方法支持传入 `saltHex` 参数以解密使用不同盐值的数据
- 提供 `migrateLegacyKey()` 方法用于迁移旧数据到新盐值方案

**影响:** 每个 KeyManager 实例现在使用独立的随机盐值，大幅提升加密安全性。

---

### 3. [H-004] 默认会话密钥不安全 ✅

**文件:** `packages/core-sdk/src/session.ts`  
**风险等级:** High  
**问题:** 生产环境可能使用默认或空的会话密钥

**修复内容:**
- 在模块加载时检查 `NODE_ENV === 'production'`
- 生产环境强制要求配置 `SESSION_SECRET` 环境变量
- 未配置时抛出明确的错误信息，提供生成安全密钥的命令

**影响:** 生产环境现在强制使用强会话密钥，防止会话劫持和伪造。

---

### 4. [H-005] 默认 JWT 密钥不安全 ✅

**文件:** `packages/keys-server/src/index.ts`  
**风险等级:** High  
**问题:** 生产环境可能使用默认或空的 JWT 密钥

**修复内容:**
- 在模块导出前检查 `NODE_ENV === 'production'`
- 生产环境强制要求配置 `JWT_SECRET` 环境变量
- 未配置时抛出错误并拒绝启动，提供详细的修复指南

**影响:** 生产环境现在强制使用强 JWT 密钥，防止攻击者伪造有效的认证令牌。

---

### 5. [S-001] .env 文件中的 API Token ✅

**文件:** `.env`  
**风险等级:** Critical  
**问题:** `.env` 文件中包含真实的 Cloudflare API Token

**修复内容:**
- 移除真实的 API Token: `cfut_[REDACTED]`
- 替换为占位符: `your_cloudflare_api_token_here`

**影响:** 防止敏感凭证意外提交到版本控制系统。

**建议:** 
- 立即撤销已泄露的 API Token
- 在 Cloudflare 控制台生成新的 Token
- 将真实 Token 存储在安全的密钥管理服务中（如 AWS Secrets Manager、HashiCorp Vault）

---

## 部署注意事项

### 环境变量配置

生产环境部署前，必须配置以下环境变量：

```bash
# 加密密钥（用于密钥存储加密）
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# 会话密钥（用于会话签名）
export SESSION_SECRET=$(openssl rand -hex 32)

# JWT 密钥（用于 JWT 令牌签名）
export JWT_SECRET=$(openssl rand -base64 32)

# Cloudflare API Token（从安全渠道获取）
export CF_API_TOKEN="your_actual_token_here"
```

### 数据迁移

如果存在使用旧版硬编码盐值加密的数据，需要执行迁移：

```typescript
const keyManager = new KeyManager({ encryptionKey: process.env.ENCRYPTION_KEY });

// 迁移旧数据
await keyManager.migrateLegacyKey(
  'key-id',
  'key-label',
  legacyEncryptedData
);
```

### 安全检查清单

- [ ] 所有生产环境已配置 `ENCRYPTION_KEY`
- [ ] 所有生产环境已配置 `SESSION_SECRET`
- [ ] 所有生产环境已配置 `JWT_SECRET`
- [ ] 已撤销并替换泄露的 Cloudflare API Token
- [ ] 已迁移使用旧版盐值加密的数据
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 生产环境日志中无安全警告

---

## 测试验证

所有修复已通过以下场景验证：

1. ✅ 生产环境缺少必需密钥时正确抛出错误
2. ✅ 开发环境可以正常使用默认值（带警告）
3. ✅ 随机盐值正确生成和存储
4. ✅ 使用不同盐值的数据可以正确解密
5. ✅ `.env` 文件中无真实凭证

---

## 后续建议

1. **密钥轮换策略:** 建立定期轮换加密密钥的流程
2. **密钥管理服务:** 迁移到专业的密钥管理服务（KMS）
3. **安全审计:** 定期进行安全审计和渗透测试
4. **监控告警:** 配置安全事件监控和告警
5. **文档更新:** 更新部署文档，明确环境变量要求

---

**报告生成:** OpenClaw Security Audit System  
**审计人员:** AI Security Assistant  
**审核状态:** 待人工审核
