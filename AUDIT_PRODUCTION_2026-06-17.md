# Cinacoin 生产级审计报告 — 2026-06-17

> **审计人**: 000 (AI Agent)
> **审计范围**: 安全、代码质量、架构、测试覆盖、基础设施、生产就绪度
> **审计方法**: 静态分析 + 代码审查 + 配置验证
> **对比基线**: 2026-06-03 审计报告 (4.0/5.0)

---

## 📊 总览评分卡

| 维度 | 上次评分 | 本次评分 | 变化 | 说明 |
|------|---------|---------|------|------|
| 架构设计 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | — | God File 拆分完成，无循环依赖 |
| 代码质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | — | strict mode 全开，38 处 `as any`，16 处空 catch |
| **安全性** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⬇️ | **发现 3 个 P0 安全漏洞** |
| 测试覆盖 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⬆️ | 92.5% 包有测试 (74/80)，覆盖率阈值 70% |
| 文档 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | — | 合约审计准备文档齐全 |
| 基础设施 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⬇️ | CI 多处 `continue-on-error` 削弱门禁 |
| 生产就绪 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | — | 28 个工作流 + Helm + 灾备自动化 |

**综合: 3.9 / 5.0** — 架构成熟，但安全漏洞需立即修复后方可上线。

---

## 🔴 P0 — 必须立即修复 (24h)

### P0-1: JWT 无算法限制 — 算法混淆攻击风险
- **文件**: `apps/auth-service/worker/src/lib/jwt.ts:34,47`
- **问题**: `jwtVerify(token, key)` 未指定 `{ algorithms: ['HS256'] }`，无 issuer/audience 校验
- **风险**: 攻击者可伪造 `alg: none` 的 JWT 绕过认证
- **修复**: 添加 `{ algorithms: ['HS256'], issuer: 'cinacoin', audience: 'cinacoin' }`
- **备注**: `workers/auth-service` 版已正确实现，建议统一使用此版本

### P0-2: OAuth redirect_uri 未验证 — 开放重定向漏洞
- **文件**: `apps/auth-service/worker/src/index.ts:351,366`
- **问题**: `redirect_uri` 直接来自用户输入 (`c.req.query('redirect_uri')`)，未与 allowlist 比对
- **风险**: 攻击者构造恶意 redirect_uri，OAuth provider 将 authorization code 发送到钓鱼站点
- **修复**: 将允许的 redirect_uri 列表存入环境变量/数据库，严格匹配

### P0-3: Token 在 API 响应中泄露
- **文件**: `apps/auth-service/worker/src/index.ts:876-881, 958-963`
- **问题**: 邮件发送失败时，verification token 和 reset token + URL 直接返回给客户端
- **风险**: 攻击者触发"邮件发送失败"场景即可获取有效 token
- **修复**: 移除 fallback 逻辑，邮件发送失败时仅返回通用成功消息 + 记录运维日志

---

## 🟠 P1 — 一周内修复

| # | 问题 | 文件 | 修复建议 |
|---|------|------|---------|
| P1-1 | Dev-only JWT secret fallback 可被生产误用 | `apps/auth-service/src/middleware.ts:30` | 无 JWT_SECRET 直接 fail-closed，删除 fallback |
| P1-2 | apps/ auth-service 无 JWT secret 长度校验 | `apps/auth-service/worker/src/lib/jwt.ts:33` | 添加 ≥32 字节校验或统一使用 workers/ 版本 |
| P1-3 | 两套 auth-service 实现并存，apps/ 版安全性全面弱于 workers/ 版 | — | **废弃 apps/auth-service/worker，统一使用 workers/auth-service** |
| P1-4 | OAuth 回调无 Zod schema 验证 | `apps/auth-service/worker/src/index.ts:449` | 添加 `z.object({ provider, code, state, ... })` |
| P1-5 | Admin settings 端点无 Zod 验证 | `apps/auth-service/worker/src/index.ts:746` | value 添加长度/类型限制 |
| P1-6 | 内部错误信息泄露给客户端 | `apps/auth-service/worker/src/index.ts:157,183` | 统一返回通用错误消息 |
| P1-7 | Next.js 14.2.29 可能有已知 CVE | `apps/website/package.json` | 评估升级到 15.x |
| P1-8 | `quality.yaml` YAML 缩进错误可能导致 CI 解析失败 | `.github/workflows/quality.yaml` | 修复缩进 |

---

## 🟡 P2 — 一月内修复

| # | 问题 | 文件 | 修复建议 |
|---|------|------|---------|
| P2-1 | Refresh token 未实现 rotation (apps/ 版) | `apps/auth-service/worker/src/index.ts:162-185` | 统一使用 workers/ 版 |
| P2-2 | OAuth token 明文存储 | `apps/auth-service/worker/src/index.ts:686` | 使用 AES-256-GCM 加密后存储 |
| P2-3 | Cookie sameSite=Lax，应为 Strict | 多个 auth 端点 | 改为 `SameSite=Strict` |
| P2-4 | 密码重置无完整密码策略 | `apps/auth-service/worker/src/index.ts:978` | 复用注册端点的 passwordSchema |
| P2-5 | User/Team service 手动验证代替 Zod | `workers/user-service/src/routes/users.ts:68` | 统一使用 Zod schema |
| P2-6 | Admin 用户列表 limit 无最大值限制 | `apps/auth-service/worker/src/index.ts:799` | 限制 `Math.min(limit, 100)` |
| P2-7 | CORS 包含 localhost:3000 | `apps/auth-service/worker/src/index.ts:13` | 生产环境移除 |
| P2-8 | ESLint 8.x (已 EOL) | `packages/social-login/package.json` | 升级到 9.x |
| P2-9 | `vitest.workspace.ts` 引用不存在的包 | `vitest.workspace.ts` | 清理 walletconnect-v2, adapter-* 引用 |
| P2-10 | `blockchain-api/src/client.ts` 仍需拆分 | `packages/blockchain-api/src/client.ts` | 继续 God File 拆分 |
| P2-11 | CI `continue-on-error: true` 削弱门禁 | `test.yml`, `quality-gate.yml`, `quality.yaml` | 移除或仅在主分支保留 |
| P2-12 | FRP 配置文件暴露内网拓扑 | `frpc*.ini`, `frps.ini` | 移入 `.gitignore` 或 `deploy/` |
| P2-13 | Branch protection 未代码化 | — | 添加 `.github/settings.yml` |
| P2-14 | `e2e/` 目录混杂编译产物 | `e2e/*.spec.js`, `*.d.ts` | 加入 `.gitignore` 并清理 |

---

## 🟢 P3 — 改进建议

| # | 问题 | 修复建议 |
|---|------|---------|
| P3-1 | PBKDF2 非 memory-hard | 评估 Argon2 WASM 方案 (Workers paid plan) |
| P3-2 | 38 处 `as any` | 逐步替换为精确类型 |
| P3-3 | 104 处 `: any` 类型标注 | 逐步收紧 |
| P3-4 | 560 处非空断言 `!` | 添加运行时检查替代 |
| P3-5 | 16 处空 catch 块 | 至少添加 `logger.error()` |
| P3-6 | 28 处 TODO/FIXME | 逐个处理或转为 issue |
| P3-7 | `release-tools/package.test.ts` 占位符测试 | 替换为有意义的断言 |
| P3-8 | 12 处运行时 stub 炸弹 (throw new Error('Not implemented')) | 逐步实现或用 feature flag 标记 |

---

## ✅ 做得好的（继续保持）

| 维度 | 状态 | 说明 |
|------|------|------|
| 无硬编码密钥泄漏 | ✅ | .gitignore 正确排除 .env，无 .env 被 git 追踪 |
| Secret scanning | ✅ | .gitguardian.yaml + .gitleaks.toml 已配置 |
| 密码哈希 | ✅ | PBKDF2 6×100k=600k 迭代，恒定时间比较，自动升级 |
| workers/auth-service 安全 | ✅ | 完整 JWT 校验 + CSRF + Rate Limiting + 安全头部 |
| XSS 防护 | ✅ | dangerouslySetInnerHTML 全部经 DOMPurify 处理 |
| SQL 注入防护 | ✅ | 参数化查询 (.bind())，动态列名均为硬编码字符串 |
| God File 拆分 | ✅ | paymaster + travel-rule 拆分完成，模块清晰 |
| 无循环依赖 | ✅ | core-sdk 不依赖外层包 |
| 测试覆盖率 | ✅ | 92.5% 包有测试，v8 覆盖率 70% 阈值 |
| CI/CD 完整性 | ✅ | 28 个工作流覆盖 TS/Rust/Go/E2E |
| 灾备自动化 | ✅ | RPO 1h / RTO 4h，自动备份恢复测试 |
| 合约审计准备 | ✅ | Phase 0-3 内部审计完成，审计请求文档齐全 |
| 安全头部 | ✅ | HSTS + CSP + nosniff + DENY frame + referrer policy |

---

## 📋 修复优先级路线

### 第一阶段 (24h) — P0 安全修复
1. 修复 JWT 算法限制 (P0-1)
2. 修复 OAuth redirect_uri 验证 (P0-2)
3. 移除 token 泄露 fallback (P0-3)

### 第二阶段 (1 周) — P1 统一与加固
4. 废弃 apps/auth-service/worker，统一使用 workers/auth-service (P1-3)
5. 所有端点添加 Zod 输入验证 (P1-4, P1-5)
6. 统一错误响应，不泄露内部信息 (P1-6)
7. 修复 quality.yaml YAML 语法 (P1-8)

### 第三阶段 (1 月) — P2 生产加固
8. OAuth token 加密存储 (P2-2)
9. 清理仓库中的 FRP 配置文件 (P2-12)
10. CI 门禁收紧 (P2-11)
11. Branch protection 代码化 (P2-13)
12. blockchain-api client.ts 继续拆分 (P2-10)

---

## 🏁 上线判定

| 条件 | 状态 |
|------|------|
| P0 漏洞全部修复 | ❌ **阻塞上线** |
| P1 漏洞全部修复 | ❌ 未完成 |
| 安全审计签字 | ❌ 未完成 |
| CI 全绿 | ⚠️ continue-on-error 掩盖失败 |
| 灾备演练通过 | ✅ 已完成 |

**结论**: **P0 修复前不建议上线。** 3 个 P0 漏洞均为认证/授权层面的实质风险，在有攻击者发现之前必须修复。`workers/auth-service` 版本已具备生产级安全实现，统一迁移是最优路径。

---

*审计完成 — 2026-06-17 — v2.0*
