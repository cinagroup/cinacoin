# Cinacoin 下一阶段实施计划

> **制定日期**: 2026-06-08 14:35 UTC  
> **计划周期**: 12 周 (Phase 0-2)  
> **目标**: 从设计阶段过渡到可运行的最小可行产品

---

## 一、计划目标

### 1.1 核心目标

在 12 周内完成：
1. ✅ Auth Service 核心功能可运行（注册/登录/JWT）
2. ✅ PostgreSQL + Redis 生产环境部署
3. ✅ 至少 2 个应用接入统一认证
4. ✅ 核心 UI 组件库完成（Button/Input/Select/Table）
5. ✅ CI/CD 流水线支持新服务部署

### 1.2 成功指标

| 指标 | 目标值 | 验证方式 |
|------|--------|----------|
| Auth Service API 可用性 | 99.9% | 健康检查端点 |
| 注册→登录→Token 验证 | < 500ms P95 | 性能测试 |
| 前端应用认证集成 | ≥ 2 个 | 功能测试 |
| 核心 UI 组件测试覆盖率 | ≥ 80% | Vitest 报告 |
| 构建成功率 | 100% | CI 流水线 |

---

## 二、实施路线图

### Phase 0: 基础设施搭建 (Week 1-2)

**目标**: 搭建开发环境、数据库、基础工具链

#### Week 1: 数据库与环境

| 任务 | 负责 | 估时 | 依赖 | 交付物 |
|------|------|------|------|--------|
| 部署 PostgreSQL 16 (dev + prod) | DevOps | 4h | — | 可连接的 DB 实例 |
| 部署 Redis 7 (dev + prod) | DevOps | 2h | — | 可连接的 Redis 实例 |
| 执行 auth-schema.sql | Backend | 2h | DB 部署 | Schema 创建完成 |
| 配置 Drizzle ORM | Backend | 4h | Schema | drizzle.config.ts |
| 创建初始 migration | Backend | 2h | Drizzle | migrations/0000_init.sql |
| 设置环境变量管理 | DevOps | 2h | — | .env.example + Vault |

**Week 1 验收标准**:
```bash
# 数据库可连接
psql -h localhost -U cinacoin -d cinacoin_auth -c "SELECT 1"

# Redis 可连接
redis-cli ping

# Schema 已创建
psql -d cinacoin_auth -c "\dt" | grep -E "users|sessions|roles"
```

#### Week 2: Auth Service 骨架

| 任务 | 负责 | 估时 | 依赖 | 交付物 |
|------|------|------|------|--------|
| 创建 apps/auth-service/ | Backend | 1h | — | 目录结构 |
| 初始化 Fastify + TypeScript | Backend | 4h | — | package.json + tsconfig |
| 配置 ESLint/Prettier | Backend | 1h | — | .eslintrc + .prettierrc |
| 设置 Pino 日志 | Backend | 2h | — | src/lib/logger.ts |
| 创建基础路由结构 | Backend | 4h | Fastify | src/routes/ |
| 配置 Vitest 测试 | Backend | 2h | — | vitest.config.ts |
| 添加健康检查端点 | Backend | 1h | 路由 | GET /health |

**Week 2 验收标准**:
```bash
cd apps/auth-service
pnpm install
pnpm dev  # 服务启动在 http://localhost:3000
curl http://localhost:3000/health  # {"status":"ok"}
pnpm test  # 所有测试通过
```

**Phase 0 交付物清单**:
- [ ] PostgreSQL 实例 (dev + prod)
- [ ] Redis 实例 (dev + prod)
- [ ] auth-schema.sql 执行完成
- [ ] Drizzle ORM 配置
- [ ] apps/auth-service/ 骨架
- [ ] 健康检查端点可用
- [ ] CI 流水线支持 auth-service 构建

---

### Phase 1: 核心认证功能 (Week 3-6)

**目标**: 实现注册/登录/JWT Token 管理

#### Week 3-4: 用户注册与登录

| 任务 | 负责 | 估时 | 依赖 | 交付物 |
|------|------|------|------|--------|
| 实现密码哈希 (argon2) | Backend | 4h | DB | src/lib/password.ts |
| 实现注册 API | Backend | 8h | 密码哈希 | POST /auth/register |
| 实现邮箱验证 | Backend | 6h | 注册 | POST /auth/verify-email |
| 实现登录 API | Backend | 6h | 注册 | POST /auth/login |
| 生成 RS256 密钥对 | Backend | 2h | — | keys/jwt.{pub,pri} |
| 实现 JWT 签发 | Backend | 6h | 密钥 | src/lib/jwt.ts |
| 实现 Token 刷新 | Backend | 4h | JWT | POST /auth/token/refresh |
| 实现登出 | Backend | 2h | Session | POST /auth/logout |
| 编写单元测试 | Backend | 8h | API | tests/auth.test.ts |

**Week 3-4 验收标准**:
```bash
# 注册
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
# {"userId":"...","message":"Verification email sent"}

# 登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
# {"accessToken":"eyJ...","refreshToken":"..."}

# Token 刷新
curl -X POST http://localhost:3000/auth/token/refresh \
  -H "Authorization: Bearer eyJ..."
# {"accessToken":"eyJ..."}
```

#### Week 5-6: Auth SDK + 第一个应用集成

| 任务 | 负责 | 估时 | 依赖 | 交付物 |
|------|------|------|------|--------|
| 创建 packages/auth-types/ | Frontend | 4h | — | TypeScript 类型定义 |
| 创建 packages/auth-sdk/ | Frontend | 8h | auth-types | SDK 核心逻辑 |
| 实现 AuthProvider | Frontend | 6h | auth-sdk | React Context |
| 实现 useAuth Hook | Frontend | 4h | AuthProvider | useAuth() |
| 实现自动 Token 刷新 | Frontend | 4h | auth-sdk | 拦截器 |
| 集成到 Backend Dashboard | Frontend | 8h | AuthProvider | 登录页面 |
| 实现登录 UI 组件 | Frontend | 6h | UI 库 | LoginForm.tsx |
| 实现注册 UI 组件 | Frontend | 6h | UI 库 | RegisterForm.tsx |
| E2E 测试 | Frontend | 6h | 集成 | Playwright 测试 |

**Week 5-6 验收标准**:
```bash
# Auth SDK 可导入
import { AuthProvider, useAuth } from '@cinacoin/auth-sdk'

# Backend Dashboard 登录流程
1. 访问 https://dash.cinacoin.com/login
2. 输入邮箱密码
3. 成功跳转到 /dashboard
4. Token 自动刷新工作
5. 登出后跳转回 /login
```

**Phase 1 交付物清单**:
- [ ] POST /auth/register 可用
- [ ] POST /auth/login 可用
- [ ] POST /auth/token/refresh 可用
- [ ] JWT RS256 签名验证
- [ ] packages/auth-types/ 发布
- [ ] packages/auth-sdk/ 发布
- [ ] Backend Dashboard 集成统一认证
- [ ] 登录/注册 UI 组件
- [ ] E2E 测试通过

---

### Phase 2: 核心 UI 组件库 (Week 7-10)

**目标**: 完成 P0 基础组件，支撑 Dashboard 统一

#### Week 7-8: 基础组件

| 任务 | 负责 | 估时 | 依赖 | 交付物 |
|------|------|------|------|--------|
| Button 组件 (所有变体) | Frontend | 4d | — | Button.tsx |
| Input 组件 | Frontend | 3d | — | Input.tsx |
| Textarea 组件 | Frontend | 2d | Input | Textarea.tsx |
| Select 组件 (Radix) | Frontend | 3d | — | Select.tsx |
| Checkbox 组件 | Frontend | 2d | — | Checkbox.tsx |
| Radio 组件 | Frontend | 2d | Checkbox | Radio.tsx |
| Switch 组件 | Frontend | 1.5d | — | Switch.tsx |
| Label 组件 | Frontend | 1d | — | Label.tsx |
| 组件文档 (Storybook) | Frontend | 4d | 组件 | Storybook stories |
| 单元测试 | Frontend | 4d | 组件 | ≥80% 覆盖率 |

**Week 7-8 验收标准**:
```bash
cd packages/ui
pnpm build  # 构建成功
pnpm test  # 所有测试通过，覆盖率 ≥80%
pnpm storybook  # Storybook 可访问
```

#### Week 9-10: 高级组件 + 布局系统

| 任务 | 负责 | 估时 | 依赖 | 交付物 |
|------|------|------|------|--------|
| Dialog/Modal 组件 | Frontend | 3d | — | Dialog.tsx |
| Table 组件 | Frontend | 4d | — | Table.tsx |
| Tabs 组件 | Frontend | 2d | — | Tabs.tsx |
| Toast/Notification | Frontend | 3d | — | Toast.tsx |
| Dropdown Menu | Frontend | 2d | — | DropdownMenu.tsx |
| Avatar 组件 | Frontend | 1.5d | — | Avatar.tsx |
| Badge 组件 | Frontend | 1d | — | Badge.tsx |
| AppShell 布局 | Frontend | 4d | 组件 | AppShell.tsx |
| Sidebar 组件 | Frontend | 3d | AppShell | Sidebar.tsx |
| TopNav 组件 | Frontend | 3d | AppShell | TopNav.tsx |
| 集成到 Cloud Dashboard | Frontend | 4d | 布局 | 统一布局 |

**Week 9-10 验收标准**:
```bash
# 所有组件可导入
import { Button, Input, Table, AppShell } from '@cinacoin/ui'

# Cloud Dashboard 使用统一布局
- 侧边栏导航正常
- 顶部导航正常
- 响应式布局工作
- 暗色模式切换正常
```

**Phase 2 交付物清单**:
- [ ] 15+ 基础 UI 组件
- [ ] Storybook 文档站
- [ ] 测试覆盖率 ≥80%
- [ ] AppShell 布局系统
- [ ] Cloud Dashboard 集成统一布局

---

## 三、资源需求

### 3.1 人员配置

| 角色 | 人数 | 技能要求 | 投入度 |
|------|------|----------|--------|
| Backend Engineer | 1-2 | Fastify, PostgreSQL, JWT, OAuth | 100% |
| Frontend Engineer | 1-2 | React, TypeScript, Radix UI | 100% |
| DevOps Engineer | 0.5 | PostgreSQL, Redis, CI/CD | 50% |
| Tech Lead | 0.5 | 架构审查、代码审查 | 50% |

**总计**: 3-4 人全职 + 1 人兼职

### 3.2 基础设施成本

| 资源 | 规格 | 月成本 (USD) | 用途 |
|------|------|--------------|------|
| PostgreSQL (dev) | 2 vCPU, 4GB RAM | $40 | 开发环境 |
| PostgreSQL (prod) | 4 vCPU, 8GB RAM, HA | $120 | 生产环境 |
| Redis (dev) | 1 vCPU, 2GB RAM | $20 | 开发环境 |
| Redis (prod) | 2 vCPU, 4GB RAM, HA | $60 | 生产环境 |
| **总计** | — | **$240/月** | — |

### 3.3 工具与服务

| 工具 | 用途 | 成本 |
|------|------|------|
| GitHub Actions | CI/CD | 已有 |
| Cloudflare Workers | 部署 | 已有 |
| Vercel | 前端部署 | 已有 |
| Storybook | 组件文档 | 开源免费 |
| Vitest | 单元测试 | 开源免费 |
| Playwright | E2E 测试 | 开源免费 |

---

## 四、风险管理

### 4.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| PostgreSQL 性能瓶颈 | 低 | 高 | 提前做负载测试，准备读写分离 |
| JWT 密钥泄露 | 低 | 极高 | 使用 Vault/KMS，定期轮换 |
| Auth SDK 兼容性问题 | 中 | 中 | 提前在 2 个应用测试，收集反馈 |
| UI 组件破坏现有样式 | 中 | 中 | 渐进式迁移，保留旧组件 |
| 数据库 migration 失败 | 低 | 高 | 备份策略，回滚脚本 |

### 4.2 进度风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 人员不足 | 中 | 高 | 优先保证 Backend，Frontend 可延期 |
| 技术债阻碍 | 中 | 中 | 每周预留 20% 时间处理技术债 |
| 需求变更 | 高 | 中 | 严格变更控制，冻结 Phase 0-2 范围 |
| 第三方依赖问题 | 低 | 中 | 锁定版本，准备替代方案 |

### 4.3 回滚策略

**每个 Phase 都有明确的回滚点**:

- **Phase 0 回滚**: 删除 DB 实例，清理 auth-service 目录
- **Phase 1 回滚**: 应用切换回旧认证（如有），禁用 Auth SDK
- **Phase 2 回滚**: 保留旧布局，新组件作为可选

---

## 五、质量保障

### 5.1 测试策略

| 测试类型 | 覆盖范围 | 工具 | 目标覆盖率 |
|----------|----------|------|------------|
| 单元测试 | Auth Service, UI 组件 | Vitest | ≥80% |
| 集成测试 | API 端点, DB 交互 | Vitest + TestContainers | ≥70% |
| E2E 测试 | 登录/注册流程 | Playwright | 关键路径 100% |
| 性能测试 | API 响应时间 | k6 | P95 < 500ms |
| 安全测试 | OWASP Top 10 | OWASP ZAP | 无高危漏洞 |

### 5.2 代码质量

| 实践 | 工具 | 执行方式 |
|------|------|----------|
| 代码格式化 | Prettier | Pre-commit hook |
| 静态分析 | ESLint | CI 检查 |
| 类型安全 | TypeScript strict | 编译时检查 |
| 代码审查 | GitHub PR | 至少 1 人批准 |
| 文档更新 | Changeset | 每次 PR 必须 |

### 5.3 验收标准

**每个 Phase 结束前必须通过**:

1. ✅ 所有单元测试通过
2. ✅ E2E 测试通过（关键路径）
3. ✅ 代码审查完成
4. ✅ 文档更新
5. ✅ 性能指标达标
6. ✅ 安全扫描无高危

---

## 六、沟通与协作

### 6.1 会议节奏

| 会议 | 频率 | 时长 | 参与者 | 目的 |
|------|------|------|--------|------|
| 站会 | 每日 | 15min | 全团队 | 同步进度、阻塞 |
| 周会 | 每周一 | 1h | 全团队 | 计划、回顾 |
| 代码审查 | 持续 | — | Backend/Frontend | 质量保证 |
| 架构评审 | 按需 | 1h | Tech Lead + 相关 | 技术决策 |

### 6.2 文档要求

| 文档类型 | 更新频率 | 负责人 | 存储位置 |
|----------|----------|--------|----------|
| API 文档 | 每次变更 | Backend | OpenAPI spec |
| 组件文档 | 每次变更 | Frontend | Storybook |
| 架构决策记录 | 按需 | Tech Lead | docs/adr/ |
| 进度报告 | 每周 | Tech Lead | 飞书文档 |

---

## 七、Phase 3+ 展望 (Week 11-12+)

**Phase 2 完成后，后续工作包括**:

### Week 11-12: OAuth 2.0 + MFA

- OAuth 2.0 Authorization Server
- Social Login (Google, GitHub)
- TOTP MFA (Google Authenticator)
- WebAuthn/Passkey 支持

### Week 13-16: 更多应用集成

- Cloud Dashboard 接入统一认证
- Analytics Dashboard 接入
- Wallet Explorer 接入
- 跨应用 SSO 验证

### Week 17-20: API Gateway + 微服务

- 部署 Kong API Gateway
- 迁移现有 Workers 到 Gateway 后
- 实现 Rate Limiting, Circuit Breaking
- 服务网格配置

### Week 21+: 高级功能

- RBAC 权限控制
- 组织管理
- API Key 管理
- 审计日志
- 高级监控 (Prometheus + Grafana)

---

## 八、立即行动项

### 本周必须完成 (Week 1 Day 1-3)

| # | 行动项 | 负责人 | 截止时间 | 状态 |
|---|--------|--------|----------|------|
| 1 | 确认团队人员分配 | Tech Lead | Day 1 | ⏳ 待开始 |
| 2 | 部署 PostgreSQL dev 实例 | DevOps | Day 1 | ⏳ 待开始 |
| 3 | 部署 Redis dev 实例 | DevOps | Day 1 | ⏳ 待开始 |
| 4 | 创建 apps/auth-service/ 目录 | Backend | Day 2 | ⏳ 待开始 |
| 5 | 初始化 Fastify 项目 | Backend | Day 2 | ⏳ 待开始 |
| 6 | 执行 auth-schema.sql | Backend | Day 3 | ⏳ 待开始 |

### 本周必须完成 (Week 1 Day 4-5)

| # | 行动项 | 负责人 | 截止时间 | 状态 |
|---|--------|--------|----------|------|
| 7 | 配置 Drizzle ORM | Backend | Day 4 | ⏳ 待开始 |
| 8 | 创建初始 migration | Backend | Day 4 | ⏳ 待开始 |
| 9 | 设置环境变量管理 | DevOps | Day 5 | ⏳ 待开始 |
| 10 | 健康检查端点 | Backend | Day 5 | ⏳ 待开始 |
| 11 | CI 流水线配置 | DevOps | Day 5 | ⏳ 待开始 |

---

## 九、成功标准总结

**12 周后，我们应该能够演示**:

1. ✅ 用户可以在 Backend Dashboard 注册/登录
2. ✅ JWT Token 自动刷新工作正常
3. ✅ Cloud Dashboard 使用统一布局
4. ✅ 所有核心 UI 组件在 Storybook 可预览
5. ✅ CI/CD 流水线自动部署 Auth Service
6. ✅ 所有测试通过，覆盖率达标

---

## 十、附录

### A. 关键联系人

| 角色 | 姓名 | 联系方式 |
|------|------|----------|
| Tech Lead | TBD | — |
| Backend Lead | TBD | — |
| Frontend Lead | TBD | — |
| DevOps | TBD | — |

### B. 相关链接

| 资源 | 链接 |
|------|------|
| Auth 架构设计 | /CINACOIN_AUTH_ARCHITECTURE.md |
| Auth 实施路线图 | /auth-implementation-roadmap.md |
| 前端实施计划 | /frontend-implementation-plan.md |
| 后端实施计划 | /backend-implementation-plan.md |
| DevOps 设计 | /devops-pipeline-design.md |
| 协调报告 | /IMPLEMENTATION_COORDINATION_REPORT.md |
| 集成测试结果 | /INTEGRATION_TEST_RESULTS.md |

### C. 术语表

| 术语 | 说明 |
|------|------|
| Auth Service | 统一认证服务 (Fastify + TypeScript) |
| Auth SDK | 前端认证 SDK (React) |
| AppShell | 统一应用布局组件 |
| JWT | JSON Web Token (RS256 签名) |
| RBAC | 基于角色的访问控制 |
| MFA | 多因素认证 |

---

*计划制定完成 — 2026-06-08 14:35 UTC*  
**下一步**: 等待团队确认，启动 Week 1 Day 1 任务
