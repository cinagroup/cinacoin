# Cinacoin 项目运维审计报告

**审计日期：** 2026-06-09  
**审计范围：** `/home/cina/.openclaw/workspace/workers/`  
**审计对象：** api-gateway, auth-service, user-service  
**审计员：** 运维审计专家（自动化）

---

## 目录

1. [总体评估](#1-总体评估)
2. [监控与告警](#2-监控与告警)
3. [配置管理](#3-配置管理)
4. [部署流程](#4-部署流程)
5. [容灾恢复](#5-容灾恢复)
6. [安全运维](#6-安全运维)
7. [成本管理](#7-成本管理)
8. [文档与运维手册](#8-文档与运维手册)
9. [环境管理](#9-环境管理)
10. [运维成熟度评分](#10-运维成熟度评分)

---

## 1. 总体评估

### 架构概览

| 服务 | 运行时 | 框架 | 数据库 | 缓存/限流 |
|------|--------|------|--------|-----------|
| api-gateway | Cloudflare Workers | Hono | — | KV |
| auth-service | Cloudflare Workers | Hono | D1 (SQLite) | KV |
| user-service | Cloudflare Workers | Hono | D1 (SQLite) | — |

### 关键发现汇总

| 等级 | 数量 | 说明 |
|------|------|------|
| 🔴 Critical | 5 | 需立即修复 |
| 🟠 High | 8 | 需尽快处理 |
| 🟡 Medium | 10 | 计划改进 |
| 🔵 Low | 7 | 优化建议 |

---

## 2. 监控与告警

### 发现

#### 🔴 Critical — 缺少结构化日志和集中监控

**文件：** 所有服务 `src/index.ts`  
**行号：** api-gateway:1, auth-service:1, user-service:1

**问题描述：**
- 所有服务仅使用 `console.error()` 记录错误，无结构化日志格式
- 无日志聚合系统（如 Cloudflare Logpush → Datadog/ELK/Loki）
- 无 APM（应用性能监控）集成
- user-service 在生产环境完全禁用了日志（`user-service/src/index.ts:49-53`）

**影响：** 生产环境出现问题时无法有效排查，故障定位时间（MTTD）极长。

**改进建议：**
```typescript
// 建议添加结构化日志中间件
const structuredLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms: duration,
    requestId: c.get('requestId'),
    ip: c.req.header('cf-connecting-ip'),
    userAgent: c.req.header('user-agent'),
  };
  
  // 发送到日志系统
  console.log(JSON.stringify(logEntry));
};
```

---

#### 🔴 Critical — 无告警机制

**问题描述：**
- 未配置任何告警规则
- 无错误率阈值告警
- 无延迟监控告警
- 无 D1 数据库连接/查询异常告警
- 无 KV 操作失败告警

**改进建议：**
1. 配置 Cloudflare Workers Analytics Engine
2. 设置 Cloudflare Notifications（Slack/Email/PagerDuty）
3. 配置关键指标告警：
   - 5xx 错误率 > 1%
   - P99 延迟 > 1000ms
   - D1 查询失败率 > 0.1%
   - Rate limit 触发率异常

---

#### 🟠 High — 缺少健康检查聚合

**文件：** `api-gateway/src/index.ts:46-53`

**问题描述：**
- API Gateway 的 `/health` 端点不检查下游服务状态
- 无法通过单一端点判断整个系统健康状况

**改进建议：**
```typescript
app.get('/health', async (c) => {
  const checks: Record<string, any> = { gateway: 'ok' };
  let healthy = true;
  
  // 检查 Auth Service
  try {
    const authRes = await c.env.AUTH_SERVICE.fetch(new Request('http://internal/health'));
    checks.auth = authRes.ok ? 'ok' : 'degraded';
  } catch {
    checks.auth = 'error';
    healthy = false;
  }
  
  // 检查 User Service
  try {
    const userRes = await c.env.USER_SERVICE.fetch(new Request('http://internal/health'));
    checks.users = userRes.ok ? 'ok' : 'degraded';
  } catch {
    checks.users = 'error';
    healthy = false;
  }
  
  return c.json({ status: healthy ? 'healthy' : 'unhealthy', checks }, healthy ? 200 : 503);
});
```

---

#### 🟠 High — 无请求追踪（Distributed Tracing）

**文件：** `api-gateway/src/index.ts`, `auth-service/src/index.ts`, `user-service/src/index.ts`

**问题描述：**
- user-service 有 `requestId` 中间件，但未传递到其他服务
- 无跨服务请求追踪
- 无法追踪一个请求在多个服务间的完整链路

**改进建议：**
- 在 API Gateway 生成 request ID 并传递到下游服务
- 集成 Cloudflare Workers Trace 或 OpenTelemetry

---

#### 🟡 Medium — 缺少性能指标收集

**问题描述：**
- 无自定义指标（如登录成功率、注册转化率）
- 无 D1 查询延迟统计
- 无 KV 操作延迟统计

---

#### 🔵 Low — 日志级别不统一

**文件：** `user-service/src/index.ts:49-53`

**问题描述：**
- user-service 在生产环境完全关闭了 `hono/logger`
- auth-service 在所有环境都开启
- api-gateway 在所有环境都开启
- 日志策略不一致

---

## 3. 配置管理

### 发现

#### 🔴 Critical — Secrets 管理不规范

**文件：** `user-service/wrangler.toml:14-16`, `auth-service/wrangler.toml`

**问题描述：**
- `user-service/wrangler.toml:14-16` 注释中提到 `JWT_SECRET` 和 `ADMIN_API_KEY` 通过 `wrangler secret put` 设置，但无验证机制
- `auth-service/wrangler.toml` 中 `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 未在配置中声明，依赖隐式 secrets
- `.dev.vars.example` 包含弱开发密钥（`dev-jwt-secret-change-me`）

**影响：** Secrets 可能未正确设置，或使用弱密钥。

**改进建议：**
1. 添加启动时 secrets 验证：
```typescript
// 启动时检查必需 secrets
function validateSecrets(env: Env) {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }
  // 检查密钥强度
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}
```

---

#### 🟠 High — 环境变量配置不一致

**文件：** 
- `api-gateway/wrangler.toml:17-19`
- `auth-service/wrangler.toml:14-19`
- `user-service/wrangler.toml:10-11`

**问题描述：**
- `api-gateway` 的 `compatibility_date = "2024-01-01"` 较旧
- `auth-service` 的 `compatibility_date = "2024-12-01"` 较新
- `user-service` 的 `compatibility_date = "2024-01-01"` 较旧
- 三个服务的 compatibility_date 不统一

**改进建议：**
统一所有服务的 `compatibility_date` 到最新版本，定期更新。

---

#### 🟠 High — Staging 环境配置使用未解析的变量

**文件：** `auth-service/wrangler.toml:26-33`

**问题描述：**
```toml
[[env.staging.d1_databases]]
database_id = "${D1_STAGING_DATABASE_ID}"

[[env.staging.kv_namespaces]]
id = "${KV_STAGING_NAMESPACE_ID}"
```
- 使用 `${VAR}` 语法但 Wrangler 不支持变量插值
- 这会导致 staging 部署失败

**改进建议：**
使用实际的 staging 资源 ID，或使用 Wrangler 的环境特定配置。

---

#### 🟡 Medium — 缺少配置验证

**问题描述：**
- 无运行时配置验证
- 环境变量类型未校验（如 `JWT_EXPIRES_IN` 应为数字字符串）
- CORS_ORIGIN 配置可能为空或通配符

---

#### 🟡 Medium — KV 命名空间共享

**文件：** `api-gateway/wrangler.toml:11-13`, `auth-service/wrangler.toml:10-12`

**问题描述：**
- api-gateway 和 auth-service 共享同一个 KV 命名空间（`dceb86e5cb4c4a008013c8cf21d7181c`）
- 键名前缀虽不同（`auth:` vs `ratelimit:`），但存在冲突风险
- 一个服务的 KV 操作可能影响另一个服务

**改进建议：**
为每个服务分配独立的 KV 命名空间，或使用更严格的键名前缀隔离。

---

#### 🔵 Low — 硬编码的配置值

**文件：** `auth-service/src/lib/password.ts:10`

**问题描述：**
```typescript
const PBKDF2_ITERATIONS = 100_000;
```
- 迭代次数硬编码，无法动态调整
- 注释说 OWASP 推荐 600,000，但实际使用 100,000（Workers 限制）

---

## 4. 部署流程

### 发现

#### 🔴 Critical — 无 CI/CD 配置

**问题描述：**
- 未发现 `.github/workflows/`、`.gitlab-ci.yml`、`wrangler.toml` 中的 CI 配置
- 部署完全依赖手动 `wrangler deploy`
- 无自动化测试流程
- 无部署审批流程

**影响：** 手动部署容易出错，无回滚保障，无法追溯部署历史。

**改进建议：**
创建 GitHub Actions 工作流：
```yaml
# .github/workflows/deploy.yml
name: Deploy Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run typecheck
      - run: npm test

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: deploy --env staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production  # 需要审批
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: deploy
```

---

#### 🟠 High — 无回滚策略

**问题描述：**
- 无版本标签管理
- 无自动回滚机制
- 无部署后健康检查
- 无法快速回退到上一个稳定版本

**改进建议：**
1. 使用 Git tags 标记每次部署
2. 配置 Cloudflare Workers 版本管理
3. 添加部署后自动健康检查
4. 文档化回滚流程

---

#### 🟠 High — 数据库迁移无版本控制

**文件：** `auth-service/migrations/001_init.sql`, `user-service/migrations/0001_init.sql`

**问题描述：**
- 迁移文件命名不一致（`001_init.sql` vs `0001_init.sql`）
- 无迁移执行追踪机制
- 无回滚迁移脚本
- 手动执行 `wrangler d1 execute` 无审计记录

**改进建议：**
1. 统一迁移文件命名规范
2. 创建迁移追踪表：
```sql
CREATE TABLE _migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TEXT NOT NULL DEFAULT (datetime('now')),
  checksum TEXT NOT NULL
);
```
3. 编写迁移脚本包装器

---

#### 🟡 Medium — 无蓝绿部署/金丝雀发布

**问题描述：**
- 直接覆盖生产环境
- 无流量切换机制
- 无法进行 A/B 测试

**改进建议：**
利用 Cloudflare Workers 的 Versions 功能实现渐进式发布。

---

#### 🔵 Low — 缺少部署文档

**问题描述：**
- `auth-service/README.md` 有基础部署说明，但过时
- `api-gateway` 和 `user-service` 无部署文档
- 无运维手册

---

## 5. 容灾恢复

### 发现

#### 🟠 High — D1 数据库无备份策略

**问题描述：**
- 未配置 D1 数据库自动备份
- 无手动备份脚本
- 无跨区域数据复制
- 数据删除操作不可逆

**影响：** 数据丢失风险极高，RPO（恢复点目标）未定义。

**改进建议：**
1. 配置 D1 自动备份（Cloudflare Dashboard 或 API）
2. 创建定期备份脚本：
```bash
#!/bin/bash
# backup-d1.sh
DATE=$(date +%Y%m%d_%H%M%S)
wrangler d1 export cinacoin-auth --output=./backups/auth_$DATE.sql
wrangler d1 export cinacoin-users --output=./backups/users_$DATE.sql
# 上传到 R2 或 S3
aws s3 cp ./backups/ s3://cinacoin-backups/d1/ --recursive
```
3. 定义 RTO/RPO 目标

---

#### 🟠 High — 无灾难恢复计划

**问题描述：**
- 无 DR 文档
- 无故障转移流程
- 未测试过恢复流程
- 无关键联系人列表

**改进建议：**
创建灾难恢复手册，包括：
- 服务恢复优先级
- 数据恢复步骤
- 联系人清单
- 定期 DR 演练计划

---

#### 🟡 Medium — KV 数据无持久化保障

**问题描述：**
- KV 用于 rate limiting，数据丢失会导致限流失效
- 无 KV 数据备份
- OAuth state 等临时数据丢失会影响用户体验

---

#### 🔵 Low — 无 Chaos Engineering 实践

**问题描述：**
- 未进行过故障注入测试
- 未验证服务降级行为
- 未知悉各组件故障时的系统表现

---

## 6. 安全运维

### 发现

#### 🔴 Critical — OAuth PKCE 实现不安全

**文件：** `auth-service/src/routes/oauth/index.ts:46-48`

**问题描述：**
```typescript
const codeVerifier = uuidv4() + uuidv4(); // PKCE
// ...
&code_challenge=${encodeURIComponent(codeVerifier)}
&code_challenge_method=plain
```
- PKCE 使用 `plain` 方法而非 `S256`
- `code_verifier` 未正确生成（应为 43-128 字符的随机字符串）
- `code_challenge` 应为 `code_verifier` 的 SHA256 哈希

**影响：** OAuth 流程容易受到拦截攻击。

**修复建议：**
```typescript
// 生成正确的 PKCE
function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(new Uint8Array(hash));
}

// 使用 S256 方法
&code_challenge=${encodeURIComponent(codeChallenge)}
&code_challenge_method=S256
```

---

#### 🟠 High — Logout 未实际撤销 Token

**文件：** `auth-service/src/routes/auth/logout.ts:13-25`

**问题描述：**
```typescript
// In a stateless JWT system, logout is primarily client-side
// For enhanced security, you could implement token blacklisting in KV
```
- Logout 仅返回成功，未实际撤销 token
- Access token 在有效期内仍可使用
- Refresh token 未被标记为已撤销

**改进建议：**
实现 token 撤销机制：
```typescript
auth.post('/logout', requireAuth, async (c) => {
  const user = c.get('user');
  
  // 撤销当前 refresh token
  const refreshToken = c.get('refreshToken'); // 需要从请求中获取
  if (refreshToken) {
    await revokeRefreshToken(c.env.DB, refreshToken);
  }
  
  // 可选：将 access token 加入黑名单
  const authHeader = c.req.header('authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    await c.env.KV.put(`blacklist:${token}`, '1', { expirationTtl: 900 });
  }
  
  return c.json({ success: true });
});
```

---

#### 🟠 High — CORS 配置过于宽松

**文件：** `user-service/src/index.ts:38-40`

**问题描述：**
```typescript
cors({
  origin: ['*'], // TODO: restrict in production
```
- User service CORS 允许所有来源
- 注释承认需要限制但未实施
- 可能导致 CSRF 攻击

**修复建议：**
```typescript
const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://api.cinacoin.com',
];

cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : undefined,
  // ...
})
```

---

#### 🟠 High — Admin API Key 明文比较

**文件：** `user-service/src/middleware/auth.ts:37-40`

**问题描述：**
```typescript
if (adminKey !== c.env.ADMIN_API_KEY) {
```
- Admin API key 使用简单字符串比较
- 无时序攻击防护
- 密钥可能通过时序侧信道泄露

**修复建议：**
```typescript
// 使用常量时间比较
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}
```

---

#### 🟡 Medium — 安全事件日志未集中

**文件：** `auth-service/src/lib/token-rotation.ts:145-162`

**问题描述：**
- `logSecurityEvent` 函数存在但未在所有安全相关操作中使用
- 安全事件存储在 D1 中，无实时监控
- 无告警触发机制

---

#### 🟡 Medium — 缺少 WAF 规则

**问题描述：**
- 未配置 Cloudflare WAF 规则
- 无自定义防火墙规则
- 无 Bot 防护配置

---

#### 🔵 Low — 错误信息泄露内部细节

**文件：** `api-gateway/src/index.ts:96-99`

**问题描述：**
```typescript
app.onError((err, c) => {
  console.error('API Gateway Error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})
```
- 生产环境返回 `err.message` 可能泄露内部信息
- user-service 正确处理了此问题（区分 production/development）

---

## 7. 成本管理

### 发现

#### 🟡 Medium — 无资源使用监控

**问题描述：**
- 未监控 Workers 请求数
- 未监控 D1 读取/写入单位
- 未监控 KV 操作数
- 无法预测月度成本

**改进建议：**
1. 配置 Cloudflare Usage Analytics
2. 设置预算告警
3. 定期审查资源使用

---

#### 🟡 Medium — PBKDF2 计算成本较高

**文件：** `auth-service/src/lib/password.ts:10`

**问题描述：**
```typescript
const PBKDF2_ITERATIONS = 100_000;
```
- 每次登录/注册消耗 100,000 次 PBKDF2 迭代
- Workers CPU 时间计费，高迭代次数增加成本
- README 提到 600,000 次（OWASP 推荐），但 Workers 限制为 100,000

**优化建议：**
- 考虑使用更高效的哈希算法（如 Scrypt，如果 Workers 支持）
- 缓存常用用户的认证结果
- 实施登录频率限制减少计算次数

---

#### 🟡 Medium — Rate Limiting 使用 KV 而非专用服务

**文件：** `api-gateway/src/index.ts:24-36`

**问题描述：**
- 每次请求都需要 KV 读写操作
- KV 操作有成本和延迟
- 高并发时 KV 可能成为瓶颈

**优化建议：**
考虑使用 Cloudflare Rate Limiting 产品或 Workers Analytics Engine。

---

#### 🔵 Low — 无缓存策略

**问题描述：**
- 无 HTTP 缓存头配置
- 无响应缓存
- 重复请求增加计算成本

---

#### 🔵 Low — 日志成本未优化

**问题描述：**
- 所有请求都记录日志（除 user-service 生产环境）
- 高流量时日志存储成本显著
- 无日志采样策略

---

## 8. 文档与运维手册

### 发现

#### 🟠 High — 缺少运维文档

**问题描述：**
- 无运维手册（Runbook）
- 无故障排查指南
- 无标准操作流程（SOP）
- 无值班安排文档

**改进建议：**
创建以下文档：
1. **运维手册（Runbook.md）**
   - 服务启动/停止流程
   - 常见故障处理
   - 扩容/缩容步骤
   
2. **故障排查指南（Troubleshooting.md）**
   - 日志查看方法
   - 数据库连接问题
   - 性能问题诊断
   
3. **标准操作流程（SOP/）**
   - 部署流程
   - 数据库迁移
   - 密钥轮换
   - 应急响应

---

#### 🟡 Medium — API 文档不完整

**问题描述：**
- 无 OpenAPI/Swagger 文档
- README 中的端点列表可能过时
- 无 API 变更日志

---

#### 🟡 Medium — 架构文档缺失

**问题描述：**
- 无系统架构图
- 无服务间依赖关系图
- 无数据流图

---

#### 🔵 Low — 代码注释不足

**问题描述：**
- 部分复杂逻辑缺少注释
- 无 JSDoc/TSDoc 文档
- 配置项缺少说明

---

## 9. 环境管理

### 发现

#### 🟠 High — 环境隔离不完整

**文件：** `auth-service/wrangler.toml:23-34`

**问题描述：**
- 仅 auth-service 有 staging 环境配置
- api-gateway 和 user-service 无 staging 环境
- staging 配置使用未解析的变量（`${D1_STAGING_DATABASE_ID}`）
- 无测试环境

**改进建议：**
1. 为所有服务配置 staging 环境
2. 创建测试环境用于自动化测试
3. 确保环境间完全隔离（数据库、KV、Secrets）

---

#### 🟡 Medium — 本地开发配置不完善

**文件：** `user-service/.dev.vars.example`

**问题描述：**
- `.dev.vars.example` 存在但内容简单
- api-gateway 和 auth-service 无 `.dev.vars.example`
- 本地开发需要手动配置多个 secrets

**改进建议：**
为每个服务创建完整的 `.dev.vars.example`：
```env
# auth-service/.dev.vars.example
JWT_SECRET=dev-jwt-secret-min-32-chars-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-chars
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

---

#### 🟡 Medium — 无环境特定的测试

**问题描述：**
- 无环境特定的测试配置
- 测试可能使用生产数据库
- 无测试数据隔离

---

#### 🔵 Low — 配置差异未文档化

**问题描述：**
- 各环境配置差异未记录
- 无配置矩阵文档
- 环境间差异可能导致问题

---

## 10. 运维成熟度评分

### 评分维度

| 维度 | 权重 | 得分 | 加权得分 |
|------|------|------|----------|
| 监控与告警 | 20% | 15/100 | 3.0 |
| 配置管理 | 15% | 40/100 | 6.0 |
| 部署流程 | 20% | 20/100 | 4.0 |
| 容灾恢复 | 15% | 25/100 | 3.75 |
| 安全运维 | 15% | 50/100 | 7.5 |
| 成本管理 | 5% | 45/100 | 2.25 |
| 文档与运维手册 | 5% | 30/100 | 1.5 |
| 环境管理 | 5% | 35/100 | 1.75 |

### 总体评分

## **30 / 100** 🟠

**成熟度等级：初始级（Initial）**

### 评分说明

**优势（做得好的地方）：**
- ✅ 代码结构清晰，使用现代框架（Hono）
- ✅ 基本的安全实践（JWT、Rate Limiting、MFA）
- ✅ 使用 Cloudflare Workers 的边缘计算优势
- ✅ Token rotation 和 reuse detection 实现
- ✅ 基本的 RBAC 权限控制

**主要改进领域：**
- 🔴 缺少 CI/CD 自动化
- 🔴 无监控和告警系统
- 🔴 无灾难恢复计划
- 🔴 安全配置存在漏洞（OAuth PKCE、CORS）
- 🟠 环境管理不完整
- 🟠 运维文档严重缺失

### 改进优先级建议

**第一阶段（1-2 周）— 紧急修复：**
1. 修复 OAuth PKCE 实现
2. 修复 CORS 配置
3. 实现 Token 撤销机制
4. 配置基本监控（Cloudflare Analytics）

**第二阶段（2-4 周）— 基础建设：**
1. 建立 CI/CD 流程
2. 配置告警系统
3. 实现数据库备份
4. 完善环境隔离

**第三阶段（1-2 月）— 运维成熟：**
1. 编写运维文档
2. 实现结构化日志
3. 配置 WAF 规则
4. 建立灾难恢复计划

**第四阶段（持续）— 优化改进：**
1. 性能优化
2. 成本优化
3. 安全审计定期化
4. Chaos Engineering 实践

---

## 附录

### A. 文件清单

```
workers/
├── api-gateway/
│   ├── src/index.ts                    # 主入口
│   ├── wrangler.toml                   # 配置
│   └── package.json                    # 依赖
├── auth-service/
│   ├── src/
│   │   ├── index.ts                    # 主入口
│   │   ├── routes/auth/                # 认证路由
│   │   ├── routes/mfa/                 # MFA 路由
│   │   ├── routes/oauth/               # OAuth 路由
│   │   ├── middleware/                 # 中间件
│   │   ├── lib/                        # 工具库
│   │   └── db/                         # 数据库操作
│   ├── migrations/001_init.sql         # 数据库迁移
│   ├── wrangler.toml                   # 配置
│   └── package.json                    # 依赖
└── user-service/
    ├── src/
    │   ├── index.ts                    # 主入口
    │   ├── routes/                     # 路由
    │   ├── middleware/                 # 中间件
    │   └── db/                         # 数据库操作
    ├── migrations/0001_init.sql        # 数据库迁移
    ├── wrangler.toml                   # 配置
    └── package.json                    # 依赖
```

### B. 技术栈

- **运行时：** Cloudflare Workers
- **框架：** Hono v4.x
- **数据库：** Cloudflare D1 (SQLite)
- **缓存：** Cloudflare KV
- **认证：** JWT (jose library)
- **密码哈希：** PBKDF2-SHA256
- **验证：** Zod
- **语言：** TypeScript

### C. 参考资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Hono 文档](https://hono.dev/)
- [OWASP 认证速查表](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**报告结束**

*本报告由自动化运维审计工具生成，建议定期（每季度）进行审计以持续改进运维成熟度。*
