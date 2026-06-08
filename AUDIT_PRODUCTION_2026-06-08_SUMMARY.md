# Cinacoin (ONUX) 生产级代码审计综合报告

**审计日期:** 2026-06-08  
**审计规模:** 1,575 文件 / 306,474 行代码  
**审计团队:** 5 个并行子 Agent  
**审计维度:** 安全、前端、配置/DevOps、后端/基础设施、SDK/核心包

---

## 📊 问题统计总览

| 审计维度 | Critical | High | Medium | Low | 总计 |
|----------|----------|------|--------|-----|------|
| 🔒 安全审计 | 3 | 7 | 3 | - | 13 |
| 🖥️ 前端审计 | 3 | 8 | 4 | 7 | 22 |
| ⚙️ 配置/DevOps | 3 | 8 | 10 | 7 | 28 |
| 🔧 后端/基础设施 | 4 | 7 | 9 | 6 | 26 |
| 📦 SDK/核心包 | 5 | 7 | 7 | 7 | 26 |
| **总计** | **18** | **37** | **33** | **27** | **115** |

---

## 🚨 严重问题 (Critical) — 必须立即修复

### 1. 资金安全风险

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| **S-002** | 密钥服务 fallback 到公开开发密钥 | `packages/keys-server/src/KeyManager.ts` | 生产环境未配置 `ENCRYPTION_KEY` 时，所有用户私钥用 `default-dev-key-do-not-use-in-production` 加密，攻击者可直接解密 |
| **K-001~K-003** | 跨链使用非密码学哈希 (djb2) | `packages/cross-chain-sync/src/` | HTLC hash lock 使用 djb2，整个跨链安全模型可被攻破 |
| **B-001** | Bundler JSON-RPC 完全无认证 | `apps/bundler/` | 任何人可提交 UserOp，可能导致资金损失 |
| **B-010** | Paymaster 零哈希签名 | `apps/paymaster/` | 重放攻击风险 |

### 2. 敏感数据泄露

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| **S-001** | .env 包含真实 Cloudflare API Token | `.env` | API Token 明文存储在磁盘，需立即撤销轮换 |
| **C-001** | .env 包含明文 Cloudflare Token | 同上 | 同 S-001 |
| **C-002** | Helm secrets.yaml 弱默认凭据 | `infra/helm/secrets.yaml` | base64 编码的已知弱密码（`master-key`、`redis-password`） |

### 3. 认证/签名缺陷

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| **S-003** | 社交登录钱包派生使用 SHA-256 非标准实现 | `packages/social-login/src/wallet-derivation.ts` | 生成的钱包无法签名交易 |
| **K-004** | WalletConnect EIP-191 签名格式错误 | `packages/walletconnect-v2/` | 与所有标准钱包不兼容 |
| **F-001** | 认证 Session 存储在 localStorage | `apps/demo/src/lib/authSession.ts` | XSS 可窃取完整认证凭据 |
| **F-005** | SIWE 签名验证仅在客户端 | `apps/demo/src/lib/siwe.ts` | 无密码学签名恢复，可伪造认证 |

### 4. 注入/XSS 风险

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| **K-005** | QR Code 组件使用 innerHTML | `packages/qrcode/` | XSS 注入风险 |
| **F-009** | i18n 使用 dangerouslySetInnerHTML | `apps/website/` 多处 | 17 处，若翻译来源被篡改可注入脚本 |

### 5. 访问控制

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| **B-002** | Push Server CORS 反射配置 | `apps/push-server/` | Origin 不匹配时返回首个允许源，可被利用 |
| **B-003** | Bundler Config 暴露 Beneficiary | `apps/bundler/` | 无认证即可获取收款地址 |
| **B-004** | Wallet Explorer API 通配符 CORS | `apps/wallet-explorer/` | 任何域名可跨域访问 |

---

## 🟠 高危问题 (High) — 本周修复

### 密钥/加密
- **H-001~H-003:** 密钥服务/钱包/备份使用硬编码盐值（`onux-salt`、`cinacoin-wallet-salt`、`cinacoin-wallet-backup`）
- **H-004~H-005:** 默认 session/JWT 密钥为 `change-me` 占位符

### 认证/会话
- **H-006:** OTP 会话使用内存 Map（分布式环境不可用）
- **H-007:** 社交恢复会话使用内存 Map
- **F-006:** 钱包地址/余额存储在 localStorage
- **F-007:** Passkey 凭据 ID 存储在 localStorage

### API 安全
- **F-008:** Contact Form API 无速率限制/CSRF/CAPTCHA
- **F-009:** Cloud Dashboard API 无认证（仅传 ownerId）
- **F-010:** ownerId 存储在 localStorage 用于 API 鉴权
- **F-012:** Analytics Dashboard API 无认证

### DevOps/基础设施
- **C-004:** CI 安全扫描 `continue-on-error: true`（漏洞不阻断流水线）
- **C-005:** Renovate 自动合并安全更新
- **C-006:** Docker Redis/Postgres 端口暴露到宿主机，Redis 无认证

### 安全头
- **F-004:** 8/9 应用缺少安全响应头（CSP/HSTS/X-Frame-Options）

### 第三方集成
- **F-002:** 硬编码 MoonPay API Key fallback (`pk_test_demo_key`)
- **F-003:** iframe 嵌入第三方 Widget 无 sandbox 属性

---

## 🟡 中等问题 (Medium) — Sprint 内修复

| 类别 | 问题数 |
|------|--------|
| API 输入验证不足 | 4 |
| 内存泄漏风险 (setInterval/setTimeout) | 2 |
| SSL 检查仅为表面检查 | 1 |
| 缓存无 TTL 清理 | 1 |
| 依赖漏洞 (CVE) | 多个 |
| Docker/配置问题 | 多个 |
| 社交登录提供者归一化缺陷 | 1 |
| RPC Endpoint 输入无验证 | 1 |

---

## 📁 详细报告位置

```
/home/cina/.openclaw/workspace/onux/
├── AUDIT_SECURITY_2026-06-08.md         # 安全审计 (13 问题)
├── AUDIT_FRONTEND_2026-06-08.md         # 前端审计 (22 问题)
├── AUDIT_CONFIG_DEVOPS_2026-06-08.md    # 配置/DevOps 审计 (28 问题)
├── audit-backend-infrastructure.md       # 后端/基础设施审计 (26 问题)
├── SDK_AUDIT_REPORT.md                   # SDK/核心包审计 (26 问题)
└── AUDIT_PRODUCTION_2026-06-08_SUMMARY.md  # 本综合报告
```

---

## ✅ 正面发现

- ✅ Rust/Go 服务使用 distroless/scratch 镜像
- ✅ Helm 模板有完善 securityContext
- ✅ NetworkPolicy 默认拒绝
- ✅ 金丝雀部署含自动回滚
- ✅ `backend-dashboard` 有完善安全头配置
- ✅ SIWE 实现遵循标准流程
- ✅ Passkey/WebAuthn 使用标准 API

---

## 🔒 立即行动项

1. **立即 (24h 内):**
   - [ ] 撤销并轮换 Cloudflare API Token (S-001)
   - [ ] 删除硬编码开发密钥，强制要求生产配置 (S-002)
   - [ ] 为 Bundler 添加认证 (B-001)
   - [ ] 修复 Paymaster 零哈希签名 (B-010)
   - [ ] 切换认证 Session 到安全存储 (F-001)

2. **本周:**
   - [ ] 修复跨链哈希函数为 SHA-256/keccak256 (K-001~K-003)
   - [ ] 修正 WalletConnect EIP-191 签名格式 (K-004)
   - [ ] 为所有应用添加安全响应头 (F-004)
   - [ ] 将 SIWE 验证移至服务端 (F-005)
   - [ ] 修复 Helm secrets.yaml 弱凭据 (C-002)

3. **Sprint:**
   - [ ] 修复所有硬编码盐值
   - [ ] 添加 API 认证
   - [ ] 修复 CORS 配置
   - [ ] 添加速率限制

---

**报告生成时间:** 2026-06-08 07:40 UTC  
**审计执行:** OpenClaw 5 并行子 Agent
