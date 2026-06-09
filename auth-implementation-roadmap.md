# Cinacoin 统一身份验证系统 - 实施路线图

> **Version**: 1.0.0  
> **Date**: 2026-06-08  
> **Estimated Duration**: 12 weeks  
> **Team Size**: 3-4 engineers

---

## 目录

1. [概览](#1-概览)
2. [阶段划分](#2-阶段划分)
3. [Phase 0: 基础设施搭建 (Week 1-2)](#3-phase-0-基础设施搭建-week-1-2)
4. [Phase 1: 核心认证服务 (Week 3-5)](#4-phase-1-核心认证服务-week-3-5)
5. [Phase 2: OAuth 2.0 + 用户管理 (Week 6-7)](#5-phase-2-oauth-20--用户管理-week-6-7)
6. [Phase 3: MFA + 高级功能 (Week 8-9)](#6-phase-3-mfa--高级功能-week-8-9)
7. [Phase 4: 应用集成 (Week 10-11)](#7-phase-4-应用集成-week-10-11)
8. [Phase 5: 上线与迁移 (Week 12)](#8-phase-5-上线与迁移-week-12)
9. [里程碑与交付物](#9-里程碑与交付物)
10. [风险与缓解](#10-风险与缓解)
11. [资源需求](#11-资源需求)
12. [成功指标](#12-成功指标)

---

## 1. 概览

### 1.1 项目目标

为 Cinacoin 7 个应用构建统一身份验证系统，实现：
- 单点登录 (SSO)
- 统一用户管理
- RBAC 权限控制
- MFA 安全增强
- OAuth 2.0 / OIDC 标准协议

### 1.2 时间线总览

```
Week 1-2   ████████░░░░░░░░░░░░░░░░░░░░  Phase 0: 基础设施
Week 3-5   ░░░░░░████████████░░░░░░░░░░  Phase 1: 核心认证
Week 6-7   ░░░░░░░░░░░░░░░░████████░░░░  Phase 2: OAuth + 用户
Week 8-9   ░░░░░░░░░░░░░░░░░░░░░░██████  Phase 3: MFA + 高级
Week 10-11 ░░░░░░░░░░░░░░░░░░░░░░░░░░██  Phase 4: 集成
Week 12    ░░░░░░░░░░░░░░░░░░░░░░░░░░░█  Phase 5: 上线
```

### 1.3 依赖关系

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3
                                  └──→ Phase 4 ──→ Phase 5
```

---

## 2. 阶段划分

| Phase | 名称 | 时长 | 关键交付物 | 验收标准 |
|-------|------|------|------------|----------|
| 0 | 基础设施 | 2 weeks | Dev 环境、DB Schema、CI/CD | 服务可启动，DB 可连接 |
| 1 | 核心认证 | 3 weeks | 注册/登录/Token 管理 | 邮箱密码流程完整 |
| 2 | OAuth + 用户 | 2 weeks | OAuth Provider、用户 API | 第三方应用可接入 |
| 3 | MFA + 高级 | 2 weeks | TOTP/WebAuthn、组织管理 | MFA 可用，RBAC 生效 |
| 4 | 应用集成 | 2 weeks | SDK、各应用接入 | 至少 2 个应用切换 |
| 5 | 上线迁移 | 1 week | 生产部署、数据迁移 | 全量上线，旧系统下线 |

---

## 3. Phase 0: 基础设施搭建 (Week 1-2)

### 3.1 目标

搭建开发环境、数据库、CI/CD 流水线，确保团队可以开始开发。

### 3.2 任务清单

#### Week 1

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 0.1 | 创建 `apps/auth-service` 目录结构 | Backend | 2h | P0 |
| 0.2 | 初始化 Fastify + TypeScript 项目 | Backend | 4h | P0 |
| 0.3 | 配置 ESLint, Prettier, Husky | Backend | 2h | P0 |
| 0.4 | 设置 PostgreSQL 本地开发环境 | Backend | 2h | P0 |
| 0.5 | 执行数据库 schema (auth-schema.sql) | Backend | 4h | P0 |
| 0.6 | 配置 Redis 本地实例 | Backend | 1h | P0 |
| 0.7 | 设置数据库 migration 工具 (Knex/Drizzle) | Backend | 4h | P0 |
| 0.8 | 创建 `packages/auth-sdk` 骨架 | Frontend | 2h | P1 |
| 0.9 | 创建 `packages/auth-types` 共享类型 | Backend | 2h | P1 |

#### Week 2

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 0.10 | 配置 CI/CD pipeline (GitHub Actions) | DevOps | 4h | P0 |
| 0.11 | 设置 staging 环境 (DB + Redis + Service) | DevOps | 4h | P0 |
| 0.12 | 配置 JWT 密钥管理 (生成 RS256 密钥对) | Backend | 2h | P0 |
| 0.13 | 设置日志框架 (Pino + 结构化日志) | Backend | 2h | P1 |
| 0.14 | 配置健康检查端点 | Backend | 2h | P1 |
| 0.15 | 设置测试框架 (Vitest) + 集成测试基础设施 | Backend | 4h | P1 |
| 0.16 | 创建 Docker Compose 开发环境 | DevOps | 3h | P1 |
| 0.17 | 配置环境变量管理 (.env 模板) | Backend | 1h | P0 |

### 3.3 交付物

- [ ] `apps/auth-service` 可运行骨架
- [ ] PostgreSQL schema 已创建（含 seed data）
- [ ] Redis 连接正常
- [ ] CI/CD pipeline 通过（lint + test + build）
- [ ] Staging 环境可访问
- [ ] Docker Compose 一键启动开发环境

### 3.4 验收标准

```bash
# 本地启动
docker-compose up -d
cd apps/auth-service && npm run dev

# 健康检查
curl http://localhost:3001/health
# => {"status":"ok","version":"1.0.0-dev","database":"connected","redis":"connected"}

# CI 通过
npm run lint && npm run test && npm run build
```

---

## 4. Phase 1: 核心认证服务 (Week 3-5)

### 4.1 目标

实现邮箱/密码注册、登录、Token 管理核心流程。

### 4.2 任务清单

#### Week 3: 注册 + 邮箱验证

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 1.1 | 实现用户注册 API (POST /v1/auth/register) | Backend | 8h | P0 |
| 1.2 | 密码哈希 (Argon2id) + 强度验证 | Backend | 4h | P0 |
| 1.3 | 邮箱验证 token 生成 + 发送 | Backend | 4h | P0 |
| 1.4 | 邮件模板 (Resend/SendGrid) | Backend | 4h | P0 |
| 1.5 | 邮箱验证确认 API (POST /v1/auth/verify-email) | Backend | 2h | P0 |
| 1.6 | 重复注册防护 + 速率限制 | Backend | 2h | P0 |
| 1.7 | 单元测试: 注册流程 | Backend | 4h | P1 |

#### Week 4: 登录 + Token 管理

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 1.8 | 实现登录 API (POST /v1/auth/login) | Backend | 6h | P0 |
| 1.9 | JWT 签发 (RS256) + JWKS 端点 | Backend | 6h | P0 |
| 1.10 | Refresh token 管理 + Rotation | Backend | 6h | P0 |
| 1.11 | Token 刷新 API (POST /v1/auth/refresh) | Backend | 4h | P0 |
| 1.12 | 登出 API (POST /v1/auth/logout) | Backend | 2h | P0 |
| 1.13 | Session 管理 (创建/查询/撤销) | Backend | 4h | P0 |
| 1.14 | 登录失败计数 + 账户锁定 | Backend | 3h | P0 |
| 1.15 | 单元测试: 登录 + Token 流程 | Backend | 4h | P1 |

#### Week 5: 密码重置 + 边缘验证

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 1.16 | 密码重置请求 API | Backend | 3h | P0 |
| 1.17 | 密码重置确认 API | Backend | 3h | P0 |
| 1.18 | 密码重置邮件模板 | Backend | 2h | P0 |
| 1.19 | Cloudflare Worker: auth-gateway | Backend | 8h | P0 |
| 1.20 | 边缘 JWT 验证 (JWKS 缓存) | Backend | 4h | P0 |
| 1.21 | Rate limiting 实现 (Redis) | Backend | 4h | P0 |
| 1.22 | 集成测试: 完整认证流程 | Backend | 6h | P1 |
| 1.23 | API 文档 (OpenAPI/Swagger) | Backend | 4h | P1 |

### 4.3 交付物

- [ ] 用户注册 + 邮箱验证完整流程
- [ ] 邮箱/密码登录 + JWT 签发
- [ ] Token 刷新 + Rotation
- [ ] 密码重置流程
- [ ] Session 管理
- [ ] Cloudflare Worker 边缘验证
- [ ] Rate limiting 生效
- [ ] API 文档自动生成

### 4.4 验收标准

```bash
# 注册
curl -X POST https://auth-staging.cinacoin.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss12345"}'
# => 201 Created, verification email sent

# 登录
curl -X POST https://auth-staging.cinacoin.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss12345"}'
# => 200 OK, {access_token, refresh_token}

# Token 验证 (边缘)
curl https://cloud-staging.cinacoin.com/api/test \
  -H "Authorization: Bearer <access_token>"
# => 200 OK (verified at edge)
```

---

## 5. Phase 2: OAuth 2.0 + 用户管理 (Week 6-7)

### 5.1 目标

实现 OAuth 2.0 Authorization Server、社交登录、用户管理 API。

### 5.2 任务清单

#### Week 6: OAuth 2.0 Provider

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 2.1 | OAuth authorize 端点 | Backend | 8h | P0 |
| 2.2 | OAuth token 端点 | Backend | 6h | P0 |
| 2.3 | PKCE 验证 (S256) | Backend | 3h | P0 |
| 2.4 | Consent screen (授权确认页) | Frontend | 6h | P0 |
| 2.5 | OAuth client 管理 API | Backend | 4h | P0 |
| 2.6 | UserInfo 端点 | Backend | 2h | P0 |
| 2.7 | OIDC Discovery + JWKS | Backend | 3h | P0 |
| 2.8 | 单元测试: OAuth 流程 | Backend | 4h | P1 |

#### Week 7: 社交登录 + 用户管理

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 2.9 | Google OAuth 集成 | Backend | 4h | P0 |
| 2.10 | GitHub OAuth 集成 | Backend | 3h | P0 |
| 2.11 | Discord OAuth 集成 | Backend | 3h | P1 |
| 2.12 | 用户资料 API (GET/PATCH /v1/users/me) | Backend | 4h | P0 |
| 2.13 | 邮箱修改 + 验证 | Backend | 4h | P0 |
| 2.14 | 密码修改 API | Backend | 2h | P0 |
| 2.15 | 账户删除 + 冷静期 | Backend | 4h | P0 |
| 2.16 | 数据导出 (GDPR) | Backend | 6h | P1 |
| 2.17 | 客户端 SDK 基础版 | Frontend | 8h | P0 |

### 5.3 交付物

- [ ] OAuth 2.0 Authorization Server (PKCE)
- [ ] OIDC Discovery 文档
- [ ] Google/GitHub/Discord 社交登录
- [ ] 用户资料管理 API
- [ ] 账户删除 + GDPR 导出
- [ ] `@cinacoin/auth-sdk` 基础版

### 5.4 验收标准

```bash
# OAuth 流程
curl "https://auth-staging.cinacoin.com/oauth/authorize?\
client_id=cinacoin_cloud&\
redirect_uri=https://cloud-staging.cinacoin.com/callback&\
response_type=code&\
scope=openid+profile+email&\
state=random123&\
code_challenge=xxx&\
code_challenge_method=S256"
# => 302 redirect to login/consent

# 社交登录
curl "https://auth-staging.cinacoin.com/v1/auth/oauth/google"
# => 302 redirect to Google consent screen

# SDK 使用
npm install @cinacoin/auth-sdk
# => TypeScript types, loginWithRedirect(), getUser(), etc.
```

---

## 6. Phase 3: MFA + 高级功能 (Week 8-9)

### 6.1 目标

实现多因素认证、组织/团队管理、RBAC 权限系统。

### 6.2 任务清单

#### Week 8: MFA

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 3.1 | TOTP 设置 + 验证 | Backend | 6h | P0 |
| 3.2 | TOTP QR code 生成 | Backend | 2h | P0 |
| 3.3 | MFA 登录流程集成 | Backend | 4h | P0 |
| 3.4 | WebAuthn/Passkey 注册 | Backend | 8h | P0 |
| 3.5 | WebAuthn 认证 | Backend | 6h | P0 |
| 3.6 | Email OTP 备用方式 | Backend | 4h | P1 |
| 3.7 | 恢复码生成 + 使用 | Backend | 3h | P0 |
| 3.8 | MFA 管理 API | Backend | 4h | P0 |
| 3.9 | 前端 MFA 设置页 | Frontend | 6h | P0 |

#### Week 9: 组织 + RBAC

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 3.10 | 组织 CRUD API | Backend | 6h | P0 |
| 3.11 | 组织成员管理 | Backend | 4h | P0 |
| 3.12 | 邀请系统 (邮件邀请) | Backend | 6h | P0 |
| 3.13 | 团队 CRUD API | Backend | 4h | P1 |
| 3.14 | RBAC 权限检查中间件 | Backend | 6h | P0 |
| 3.15 | 权限继承 + 覆盖逻辑 | Backend | 4h | P0 |
| 3.16 | 审计日志记录 | Backend | 4h | P0 |
| 3.17 | 管理后台 API (用户列表/暂停/角色) | Backend | 6h | P0 |
| 3.18 | 前端组织管理页 | Frontend | 8h | P1 |

### 6.3 交付物

- [ ] TOTP MFA (Google Authenticator 兼容)
- [ ] WebAuthn/Passkey 支持
- [ ] 恢复码机制
- [ ] 组织/团队管理完整 API
- [ ] 邀请系统
- [ ] RBAC 权限检查
- [ ] 审计日志
- [ ] 管理后台 API

### 6.4 验收标准

```bash
# MFA 设置
curl -X POST https://auth-staging.cinacoin.com/v1/mfa/totp/setup
# => {secret, qr_code_url}

# 权限检查
curl https://cloud-staging.cinacoin.com/api/admin/users \
  -H "Authorization: Bearer <admin_token>"
# => 200 OK

curl https://cloud-staging.cinacoin.com/api/admin/users \
  -H "Authorization: Bearer <user_token>"
# => 403 Forbidden

# 审计日志
curl https://auth-staging.cinacoin.com/v1/admin/audit-logs?action=user.login
# => [{user_id, ip, timestamp, success}, ...]
```

---

## 7. Phase 4: 应用集成 (Week 10-11)

### 7.1 目标

将 Auth Service 集成到现有 Cinacoin 应用，完成 SDK 完善。

### 7.2 任务清单

#### Week 10: SDK + Cloud Dashboard

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 4.1 | SDK: 自动 Token 刷新 | Frontend | 4h | P0 |
| 4.2 | SDK: React hooks (useAuth, usePermission) | Frontend | 6h | P0 |
| 4.3 | SDK: 登录 UI 组件 (可选) | Frontend | 8h | P1 |
| 4.4 | SDK: 服务端中间件 (Fastify/Express) | Backend | 4h | P0 |
| 4.5 | Cloud Dashboard: 集成 Auth SDK | Frontend | 8h | P0 |
| 4.6 | Cloud Dashboard: 登录/登出页 | Frontend | 6h | P0 |
| 4.7 | Cloud Dashboard: 权限控制 | Frontend | 4h | P0 |
| 4.8 | Cloud Dashboard: 组织切换 | Frontend | 4h | P1 |

#### Week 11: 其他应用集成

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 4.9 | Backend Dashboard: 集成 Auth | Frontend | 6h | P0 |
| 4.10 | Backend Dashboard: Admin 功能 | Frontend | 4h | P0 |
| 4.11 | Analytics Dashboard: 集成 Auth | Frontend | 4h | P1 |
| 4.12 | Health Status: Admin 集成 | Frontend | 3h | P1 |
| 4.13 | Wallet Explorer: 可选登录 | Frontend | 4h | P2 |
| 4.14 | Website: 登录入口 + 状态 | Frontend | 3h | P2 |
| 4.15 | Demo: SIWE 保持现状 | Frontend | 1h | P3 |
| 4.16 | 跨应用 SSO 测试 | QA | 4h | P0 |
| 4.17 | 性能测试 (P99 < 50ms) | QA | 4h | P0 |

### 7.3 交付物

- [ ] `@cinacoin/auth-sdk` 完整版 (Browser + Server)
- [ ] React hooks + 组件
- [ ] Cloud Dashboard 完整集成
- [ ] Backend Dashboard 完整集成
- [ ] Analytics + Health Status 集成
- [ ] Wallet Explorer + Website 可选登录
- [ ] 跨应用 SSO 验证通过
- [ ] 性能基准测试报告

### 7.4 验收标准

```typescript
// Cloud Dashboard 集成示例
import { useAuth, usePermission } from '@cinacoin/auth-sdk/react';

function Dashboard() {
  const { user, logout } = useAuth();
  const canEdit = usePermission('project:write');
  
  if (!user) return <LoginPage />;
  
  return (
    <div>
      <h1>Welcome, {user.display_name}</h1>
      {canEdit && <EditButton />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

```bash
# SSO 测试
# 1. 登录 Cloud Dashboard
# 2. 访问 Backend Dashboard (无需重新登录)
# 3. 访问 Analytics (无需重新登录)
# => 所有应用共享 session
```

---

## 8. Phase 5: 上线与迁移 (Week 12)

### 8.1 目标

生产环境部署、数据迁移、旧系统下线。

### 8.2 任务清单

#### Week 12: 上线

| # | 任务 | 负责人 | 估时 | 优先级 |
|---|------|--------|------|--------|
| 5.1 | 生产环境部署 (DB + Redis + Service) | DevOps | 4h | P0 |
| 5.2 | 域名配置 (auth.cinacoin.com) | DevOps | 2h | P0 |
| 5.3 | SSL 证书 + CDN 配置 | DevOps | 2h | P0 |
| 5.4 | 数据迁移脚本 (现有用户) | Backend | 8h | P0 |
| 5.5 | 数据迁移执行 + 验证 | Backend | 4h | P0 |
| 5.6 | Feature flag 切换 (新认证系统) | Backend | 2h | P0 |
| 5.7 | 生产环境监控配置 | DevOps | 4h | P0 |
| 5.8 | 告警规则设置 | DevOps | 3h | P0 |
| 5.9 | 回滚演练 | DevOps | 2h | P0 |
| 5.10 | 旧认证系统下线 | Backend | 4h | P1 |
| 5.11 | 文档更新 (用户指南) | Backend | 4h | P1 |
| 5.12 | 团队培训 | Backend | 2h | P1 |

### 8.3 数据迁移策略

```
┌─────────────────────────────────────────────────────────────┐
│                    数据迁移流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 导出旧系统用户数据                                       │
│     └─> users.json (email, password_hash, profile)          │
│                                                              │
│  2. 数据转换脚本                                             │
│     └─> 映射字段、转换密码哈希格式                           │
│                                                              │
│  3. 导入新系统                                               │
│     └─> 批量 INSERT，保留原始 password_hash                 │
│         (Argon2id 重新哈希在首次登录时)                      │
│                                                              │
│  4. 验证                                                     │
│     └─> 抽样测试登录、检查数据完整性                        │
│                                                              │
│  5. 切换流量                                                 │
│     └─> Feature flag → 新系统优先                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 回滚计划

```
如果出现问题:
1. 切换 Feature flag 回旧系统 (立即生效)
2. 用户 session 在旧系统仍然有效
3. 排查问题
4. 修复后重新切换
5. 数据差异通过同步脚本补齐
```

### 8.5 交付物

- [ ] 生产环境部署完成
- [ ] 所有用户数据迁移完成
- [ ] 所有应用切换到新认证系统
- [ ] 监控 + 告警配置完成
- [ ] 回滚演练通过
- [ ] 旧系统下线
- [ ] 文档 + 培训完成

### 8.6 上线检查清单

```markdown
## 上线前检查

### 基础设施
- [ ] PostgreSQL 主从复制正常
- [ ] Redis Sentinel 配置完成
- [ ] 备份策略已设置 (每日自动备份)
- [ ] SSL 证书有效

### 服务
- [ ] 所有服务健康检查通过
- [ ] Rate limiting 配置正确
- [ ] CORS 配置正确
- [ ] 日志级别设置正确 (production)

### 安全
- [ ] JWT 密钥安全存储
- [ ] 数据库密码安全存储
- [ ] API 密钥加密存储
- [ ] HTTPS 强制

### 监控
- [ ] 关键指标监控 (登录成功/失败率)
- [ ] 异常告警 (登录失败激增)
- [ ] 性能监控 (P99 延迟)
- [ ] 审计日志收集

### 业务
- [ ] 所有应用集成测试通过
- [ ] SSO 流程验证通过
- [ ] MFA 流程验证通过
- [ ] 回滚演练通过
```

---

## 9. 里程碑与交付物

| 里程碑 | 日期 | 交付物 | 验收人 |
|--------|------|--------|--------|
| M0: 基础设施就绪 | Week 2 结束 | Dev/Staging 环境可用 | Tech Lead |
| M1: 核心认证完成 | Week 5 结束 | 注册/登录/Token 可用 | Product + QA |
| M2: OAuth + 用户完成 | Week 7 结束 | OAuth 流程 + 用户 API | Tech Lead |
| M3: MFA + RBAC 完成 | Week 9 结束 | MFA + 组织 + 权限 | Product + Security |
| M4: 应用集成完成 | Week 11 结束 | 所有应用接入 SDK | Product + QA |
| M5: 生产上线 | Week 12 结束 | 全量上线 | Stakeholders |

---

## 10. 风险与缓解

### 10.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 数据库性能瓶颈 | 中 | 高 | 提前做负载测试，准备读写分离 |
| JWT 密钥泄露 | 低 | 极高 | HSM 或 KMS 存储，定期轮换 |
| 邮件发送失败 | 中 | 中 | 多 provider 备份 (Resend + SendGrid) |
| OAuth 兼容性问题 | 中 | 中 | 严格遵循 RFC，充分测试 |
| 边缘 Worker 延迟 | 低 | 中 | JWKS 缓存优化，就近验证 |

### 10.2 项目风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 工期延误 | 中 | 中 | 每周进度 review，及时调整 |
| 人员变动 | 低 | 高 | 充分文档，知识共享 |
| 需求变更 | 中 | 中 | 明确 MVP 范围，变更走流程 |
| 数据迁移问题 | 中 | 高 | 充分测试，保留回滚能力 |

### 10.3 安全风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 暴力破解 | 高 | 中 | Rate limiting + 账户锁定 |
| Token 泄露 | 中 | 高 | 短有效期 + Rotation + 黑名单 |
| XSS/CSRF | 低 | 高 | httpOnly cookie + SameSite + CSP |
| SQL 注入 | 低 | 极高 | Parameterized queries + ORM |
| 中间人攻击 | 低 | 极高 | HTTPS 强制 + HSTS |

---

## 11. 资源需求

### 11.1 团队配置

| 角色 | 人数 | 职责 |
|------|------|------|
| Backend Engineer (Senior) | 1 | 核心认证、OAuth、安全 |
| Backend Engineer (Mid) | 1 | 用户管理、组织、API |
| Frontend Engineer | 1 | SDK、UI 组件、应用集成 |
| DevOps (Part-time) | 0.5 | 基础设施、CI/CD、部署 |
| QA (Part-time) | 0.5 | 测试计划、自动化测试 |
| Product (Part-time) | 0.25 | 需求确认、验收 |

### 11.2 基础设施成本

| 资源 | 规格 | 月成本 (估) |
|------|------|-------------|
| PostgreSQL (RDS) | db.t3.medium, 100GB | $150 |
| Redis (ElastiCache) | cache.t3.small | $50 |
| Cloudflare Workers | 10M requests/month | $50 |
| Email (Resend) | 50K emails/month | $20 |
| Monitoring (Datadog) | Basic plan | $15 |
| **Total** | | **~$285/month** |

### 11.3 第三方服务

| 服务 | 用途 | 成本 |
|------|------|------|
| Resend / SendGrid | 邮件发送 | 按量 |
| Twilio | SMS OTP (备选) | 按量 |
| Have I Been Pwned | 密码泄露检查 | 免费 (k-anonymity) |

---

## 12. 成功指标

### 12.1 技术指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 登录 API P99 延迟 | < 200ms | APM |
| Token 验证 P99 延迟 | < 50ms (边缘) | CF Analytics |
| 服务可用性 | > 99.9% | Uptime monitor |
| 错误率 | < 0.1% | Error tracking |
| 数据库查询 P95 | < 50ms | DB monitoring |

### 12.2 业务指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 登录成功率 | > 98% | Auth analytics |
| MFA 启用率 | > 50% (3个月内) | User settings |
| SSO 成功率 | > 99% | OAuth analytics |
| 用户满意度 | > 4.5/5 | Survey |
| 支持工单减少 | > 30% | Support system |

### 12.3 安全指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 暴力破解拦截率 | 100% | Rate limit logs |
| 异常登录检测 | > 90% | Security alerts |
| 密码泄露检查覆盖 | 100% | Registration flow |
| 审计日志完整性 | 100% | Audit log review |
| 安全漏洞 | 0 Critical | Security scan |

---

## 附录 A: 每周会议安排

| 会议 | 频率 | 时长 | 参与者 | 目的 |
|------|------|------|--------|------|
| Daily Standup | 每日 | 15min | 全团队 | 进度同步 |
| Sprint Review | 每两周 | 1h | 全团队 + Stakeholders | 演示交付物 |
| Tech Review | 每周 | 30min | 工程团队 | 技术方案评审 |
| Security Review | Phase 3, 5 | 1h | + Security | 安全评审 |

## 附录 B: 沟通渠道

| 渠道 | 用途 |
|------|------|
| Slack #auth-project | 日常沟通 |
| GitHub Project Board | 任务跟踪 |
| Notion | 文档协作 |
| Figma | UI 设计 |

## 附录 C: 关键联系人

| 角色 | 姓名 | 联系方式 |
|------|------|----------|
| Tech Lead | TBD | - |
| Product Owner | 十三先生 | Feishu |
| Security Advisor | TBD | - |

---

**文档版本**: 1.0.0  
**最后更新**: 2026-06-08  
**下次评审**: Week 1 结束时
