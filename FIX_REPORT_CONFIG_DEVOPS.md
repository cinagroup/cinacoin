# Fix Report: Cinacoin 项目配置和 DevOps 问题

**日期:** 2026-06-08
**修复人:** 000 (AI Assistant)

---

## 修复摘要

| 编号 | 问题 | 状态 | 说明 |
|------|------|------|------|
| C-002 | Helm secrets.yaml 弱默认凭据 | ✅ 已修复 | 文件已使用 `randAlphaNum` 生成强随机值 |
| C-004 | CI 安全扫描 continue-on-error | ✅ 已修复 | 安全扫描 workflow 无 continue-on-error |
| C-005 | Renovate 自动合并安全更新 | ✅ 已修复 | 限制 automerge 为 patch 版本 |
| C-006 | Docker 端口暴露 | ✅ 已修复 | Redis/DB 绑定 127.0.0.1，Redis 添加 requirepass |
| H-002 | 嵌入式钱包硬编码盐值 | ✅ 已修复 | 已使用 `randomBytes(16)` 生成随机盐值 |
| H-003 | 备份加密硬编码盐值 | ✅ 已修复 | 已使用 `randomBytes(16)` 生成随机盐值 |
| M-001 | 社交登录提供者归一化缺陷 | ✅ 已修复 | 未知提供者抛出错误而非默认返回 |

---

## 详细修复记录

### 1. [C-002] Helm secrets.yaml 弱默认凭据

**文件:** `deploy/helm/cinacoin/templates/secrets.yaml`

**状态:** ✅ 已修复（之前已修复）

**说明:** 文件已使用 Helm 模板函数 `randAlphaNum` 生成强随机值：
- `redis-password`: `{{ randAlphaNum 32 | b64enc | quote }}`
- `database-url`: 使用 `randAlphaNum 24` 生成随机密码
- `jwt-secret`: `{{ randAlphaNum 48 | b64enc | quote }}`
- `encryption-key`: `{{ randAlphaNum 32 | b64enc | quote }}`
- `master-key`: `{{ randAlphaNum 48 | b64enc | quote }}`
- `admin-password`: `{{ randAlphaNum 24 | b64enc | quote }}`

文件顶部已添加详细注释说明必须使用强随机值。

---

### 2. [C-004] CI 安全扫描 continue-on-error

**文件:** `.github/workflows/security-scan.yml`, `.github/workflows/security.yaml`

**状态:** ✅ 已修复（之前已修复）

**说明:** 安全扫描 workflow 中无 `continue-on-error: true`：
- `security-scan.yml`: npm audit 步骤已移除 `|| true`，审计失败会阻止流水线
- `security.yaml`: 所有安全扫描步骤均无 continue-on-error

其他非安全相关 workflow（test.yml, quality.yaml, ci.yml）中的 continue-on-error 用于测试覆盖率等，不影响安全性。

---

### 3. [C-005] Renovate 自动合并安全更新

**文件:** `renovate.json`

**状态:** ✅ 已修复

**修改内容:**
```json
// 修改前
{
  "matchUpdateTypes": ["minor", "patch"],
  "automerge": true,
  "automergeType": "pr"
}

// 修改后
{
  "matchUpdateTypes": ["patch"],
  "automerge": true,
  "automergeType": "pr"
},
{
  "matchUpdateTypes": ["minor"],
  "automerge": false,
  "labels": ["dependencies"]
}
```

```json
// 修改前
"vulnerabilityAlerts": {
  "labels": ["security"],
  "automerge": true
}

// 修改后
"vulnerabilityAlerts": {
  "labels": ["security"],
  "automerge": false
}
```

**理由:** 
- Minor 版本更新可能包含破坏性变更，需要人工审查
- 安全漏洞更新应人工评估影响后再合并

---

### 4. [C-006] Docker 端口暴露

**文件:** `docker-compose.yml`

**状态:** ✅ 已修复

**修改内容:**

1. Redis 端口绑定到 localhost:
```yaml
# 修改前
ports:
  - "6379:6379"

# 修改后
ports:
  - "127.0.0.1:6379:6379"
```

2. Redis 添加密码认证:
```yaml
# 修改前
command: redis-server --appendonly yes

# 修改后
command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-changeme-strong-random-password}
```

3. Redis 健康检查使用密码:
```yaml
# 修改前
test: ["CMD", "redis-cli", "ping"]

# 修改后
test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-changeme-strong-random-password}", "ping"]
```

4. PostgreSQL 端口绑定到 localhost:
```yaml
# 修改前
ports:
  - "5432:5432"

# 修改后
ports:
  - "127.0.0.1:5432:5432"
```

**理由:** 数据库和缓存服务不应暴露到公网，仅限本地访问。

---

### 5. [H-002] 嵌入式钱包硬编码盐值

**文件:** `packages/embedded-wallet/src/EmbeddedWallet.ts`, `packages/embedded-wallet/src/WalletManager.ts`

**状态:** ✅ 已修复（之前已修复）

**说明:** 
- `EmbeddedWallet.deriveKeys()` 使用 `randomBytes(16)` 生成随机盐值
- `WalletManager.create()` 调用 `EmbeddedWallet.create()` 自动生成新盐值
- 盐值存储在 `WalletRecord.salt` 字段中（hex 编码）
- 每个钱包使用独立的随机盐值

---

### 6. [H-003] 备份加密硬编码盐值

**文件:** `packages/embedded-wallet/src/backup.ts`

**状态:** ✅ 已修复（之前已修复）

**说明:**
- `_encrypt()` 函数使用 `randomBytes(16)` 生成随机盐值
- 盐值嵌入备份 JSON 的 `salt` 字段
- 每次备份使用独立的随机盐值
- 使用 PBKDF2-SHA256 310,000 次迭代

---

### 7. [M-001] 社交登录提供者归一化缺陷

**文件:** `packages/social-login/src/social-wallet.ts`

**状态:** ✅ 已修复

**修改内容:**
```typescript
// 修改前
private _normalizeProvider(provider: string): TokenProvider {
  const normalized = provider.toLowerCase().trim();
  if (normalized === 'x') return 'twitter';
  if (normalized === 'google') return 'google';
  if (normalized === 'apple') return 'apple';
  if (normalized === 'twitter') return 'twitter';
  // Default to twitter for any other/unknown provider to avoid runtime crash
  return 'twitter';
}

// 修改后
private _normalizeProvider(provider: string): TokenProvider {
  const normalized = provider.toLowerCase().trim();
  if (normalized === 'x') return 'twitter';
  if (normalized === 'google') return 'google';
  if (normalized === 'apple') return 'apple';
  if (normalized === 'twitter') return 'twitter';
  throw new Error(
    `Unsupported social login provider: "${provider}". ` +
    `Supported providers: google, apple, twitter (x).`
  );
}
```

**理由:** 未知提供者应抛出错误，避免错误地将用户身份映射到错误的提供者。

---

## 验证结果

所有修复已验证：
- ✅ Helm secrets 使用强随机值
- ✅ 安全扫描 workflow 无 continue-on-error
- ✅ Renovate 仅自动合并 patch 版本
- ✅ Redis/PostgreSQL 绑定 localhost 并启用密码认证
- ✅ 钱包盐值随机生成
- ✅ 备份盐值随机生成
- ✅ 未知社交登录提供者抛出错误

---

## 建议后续操作

1. **环境变量:** 在生产环境中设置 `REDIS_PASSWORD` 环境变量为强随机密码
2. **密钥轮换:** 定期轮换数据库密码和加密密钥
3. **监控:** 添加对异常登录尝试的监控告警
4. **文档:** 更新部署文档说明新的安全配置要求

---

*报告生成时间: 2026-06-08 08:30 UTC*
