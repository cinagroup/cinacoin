# Auth-Service 统一方案评估 — 2026-06-17

## 当前状态

### 两套实现并存

| 维度 | `workers/auth-service` (生产级) | `apps/auth-service/worker` (简化版) |
|------|-------------------------------|-------------------------------------|
| **名称** | `cinacoin-auth-workers` | `cinacoin-auth-worker` |
| **框架** | Hono 4.4 + jose 5.6 | Hono 4.0 + jose 5.2 |
| **加密库** | @noble/hashes 1.4 (PBKDF2) | bcryptjs 2.4 |
| **MFA** | otpauth 9.3 | otplib 12.0 |
| **JWT 安全** | ✅ 完整 (algorithms, issuer, audience, secret validation) | ✅ 已修复 (本次 P0-1) |
| **Token Rotation** | ✅ 实现 | ❌ 未实现 |
| **CSRF 保护** | ✅ KV-based | ❌ 无 |
| **Rate Limiting** | ✅ 滑动窗口 | ❌ 无 |
| **安全头部** | ✅ 完整 (HSTS, CSP, nosniff...) | ❌ 无 |
| **测试** | 有完整测试 | 无测试 |
| **部署** | wrangler.toml 配置完整 | wrangler.toml 配置简单 |

### 端点对比

**共有端点** (20+):
- `/api/auth/register`, `/login`, `/logout`, `/refresh`
- `/api/auth/mfa/*` (setup, verify, disable)
- `/api/auth/oauth/*` (start, callback)
- `/api/auth/email/*` (verify, confirm)
- `/api/auth/password/*` (reset, confirm)
- `/api/admin/*` (users, settings)

**`workers/` 独有**:
- CSRF token 端点
- Rate limit 中间件
- Session 管理 (token rotation)

**`apps/` 独有**:
- 部分 admin 端点的旧实现

## 统一方案评估

### 方案 A: 废弃 `apps/auth-service/worker`，统一使用 `workers/auth-service`

**优点**:
- ✅ 安全性最高 (已有完整防护)
- ✅ 单一代码库，维护成本低
- ✅ 测试覆盖完整

**缺点**:
- ⚠️ 需要迁移 `apps/` 独有的功能到 `workers/`
- ⚠️ 需要更新前端调用方 (如果有 API 差异)
- ⚠️ 需要数据迁移 (如果有 schema 差异)
- ⚠️ 需要更新部署配置 (Cloudflare Workers 路由)
- ⚠️ Token rotation 会导致现有 session 失效

**工作量估计**: 2-3 天 (含测试和部署)

### 方案 B: 将 `workers/` 的安全特性反向移植到 `apps/`

**优点**:
- ✅ 不需要迁移前端调用方
- ✅ 不需要数据迁移

**缺点**:
- ❌ 重复工作，维护两套代码
- ❌ 容易出现不一致
- ❌ 本次已完成大部分移植 (JWT, validation)

**工作量估计**: 已完成 80%，剩余 20% (CSRF, Rate Limiting, 安全头部)

### 方案 C: 保持现状，逐步淘汰

**策略**:
1. 新功能只在 `workers/` 开发
2. `apps/` 仅维护安全补丁
3. 6 个月后完成 `apps/` 的淘汰

**优点**:
- ✅ 低风险，渐进式迁移
- ✅ 不影响现有功能

**缺点**:
- ❌ 维护成本高 (6 个月双份维护)
- ❌ 安全隐患持续存在

## 建议

### 短期 (本周)
**采用方案 B**: 完成 `apps/` 的安全加固 (本次 P0/P1 已完成 90%)
- ✅ P0-1: JWT 加固
- ✅ P0-2: OAuth redirect_uri 验证
- ✅ P0-3: Token 泄露修复
- ✅ P1-1: Dev-only secret fallback
- ✅ P1-4/5: Zod 验证
- ⚠️ 剩余: CSRF, Rate Limiting, 安全头部 (约 0.5 天)

### 中期 (1-2 周)
**规划方案 A**: 制定详细的迁移计划
1. 对比两套实现的 API 差异
2. 评估前端调用方的影响
3. 制定数据迁移方案
4. 制定回滚计划
5. 灰度发布策略

### 长期 (1-2 月)
**执行方案 A**: 完成统一
1. 迁移缺失功能
2. 前端适配
3. 数据迁移
4. 灰度发布
5. 废弃 `apps/` 版本

## 风险矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|-------|------|---------|
| API 不兼容导致前端报错 | 中 | 高 | 保持 API 兼容层，灰度发布 |
| 数据迁移丢失用户数据 | 低 | 极高 | 完整备份，迁移前验证 |
| Token rotation 导致 session 失效 | 高 | 中 | 提前通知用户，支持平滑过渡 |
| 部署配置错误导致服务中断 | 中 | 高 | 蓝绿部署，快速回滚 |

## 结论

**当前建议**: 
1. **立即**: 完成 `apps/` 的安全加固 (CSRF + Rate Limiting + 安全头部)
2. **本周**: 制定统一迁移计划
3. **下周**: 执行统一迁移 (灰度发布)

**不建议立即执行统一**: 风险较高，需要先完成评估和规划。

---

*评估完成 — 2026-06-17 — 000*
