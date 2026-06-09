# Cinacoin Code Quality Audit Report

**审计日期:** 2026-06-09  
**审计范围:** `api-gateway/src/`, `auth-service/src/`, `user-service/src/`  
**审计人:** 代码质量审计专家 (AI Subagent)  
**代码行数:** ~2,500 行（不含 node_modules）  
**框架:** Hono on Cloudflare Workers (D1 + KV)

---

## 总览

| 维度 | 评分 (0-100) | 状态 |
|------|:---:|------|
| TypeScript 类型安全 | 62 | 🟡 需改进 |
| 错误处理 | 72 | 🟢 良好 |
| 代码规范 | 78 | 🟢 良好 |
| 重复代码 | 65 | 🟡 需改进 |
| 模块设计 | 82 | 🟢 良好 |
| 测试覆盖 | 0 | 🔴 缺失 |
| 文档完整性 | 45 | 🟠 不足 |
| 依赖管理 | 55 | 🟡 需改进 |

### 🏆 综合评分：**57 / 100**

---

## 1. TypeScript 类型安全

### 🔴 Critical

#### 1.1 大量使用 `any` 类型 — 类型安全严重受损

| 文件 | 行号 | 代码 |
|------|------|------|
| `auth-service/src/routes/mfa/index.ts` | L283 | `c: any` |
| `auth-service/src/routes/auth/refresh.ts` | L96 | `catch (error: any)` |
| `auth-service/src/routes/oauth/index.ts` | L115 | `let tokenResponse: any` |
| `auth-service/src/routes/oauth/index.ts` | L198 | `(e: any) => e.primary` |
| `auth-service/src/routes/oauth/index.ts` | L299 | `(acc: any) => ({...})` |
| `user-service/src/db/queries.ts` | L210, L212 | `.all<any>()` + `(row: any)` |
| `user-service/src/middleware/rbac.ts` | L132 | `(c: any) => Promise<string \| null>` |
| `user-service/src/index.ts` | L83 | `catch (err: any)` |

**共发现 10 处 `any` 使用**，其中 3 处在关键安全路径上。

**改进建议：**

```typescript
// ❌ mfa/index.ts L283
async function handleMfaLoginVerification(c: any, ...)

// ✅ 替换为
import type { Context } from 'hono';
async function handleMfaLoginVerification(
  c: Context<{ Bindings: Env; Variables: { user: TokenPayload } }>,
  sessionToken: string,
  code: string,
  method?: string
)

// ❌ refresh.ts L96
} catch (error: any) {
  if (error.code === 'TOKEN_NOT_FOUND')

// ✅ 使用自定义类型守卫
interface TokenRotationError extends Error {
  code?: string;
  userId?: string;
  familyId?: string;
}
} catch (error: unknown) {
  const err = error as TokenRotationError;
  if (err.code === 'TOKEN_NOT_FOUND')
```

### 🟠 High

#### 1.2 OAuth 回调缺少响应类型定义

`auth-service/src/routes/oauth/index.ts` L115-180

`tokenResponse` 和 `profile` 变量均无类型约束，fetch 返回值未校验。

```typescript
// ❌ 当前
let tokenResponse: any;
// ...
const tokenData = await tokenResponse.json();

// ✅ 建议
interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}
interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
}
```

#### 1.3 `getTeamMembers` 查询返回类型不安全

`user-service/src/db/queries.ts` L210

```typescript
// ❌ 使用 any 做 JOIN 结果映射
.all<any>();
return results.map((row: any) => ({...}));

// ✅ 定义 JOIN 结果接口
interface TeamMemberWithUserRow {
  team_id: string;
  user_id: string;
  role: string;
  joined_at: number;
  u_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  auth_type: string;
  status: string;
  u_created_at: number;
  u_updated_at: number;
}
.all<TeamMemberWithUserRow>();
```

### 🟡 Medium

#### 1.4 `Variables` 类型在 user-service 中重复定义

每个路由文件 (`users.ts`, `teams.ts`, `permissions.ts`, `api-keys.ts`) 都重复定义了相同的 `Variables` 类型：

```typescript
type Variables = AuthVariables & {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
};
```

**建议：** 导出到 `middleware/auth.ts` 中统一使用。

```typescript
// middleware/auth.ts
export type AuthedVariables = AuthVariables & {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
};
```

#### 1.5 `AuthType` 类型在两个服务间不一致

- `auth-service`: `'password' | 'oauth' | 'web3' | 'passkey'`
- `user-service`: `'password' | 'oauth' | 'api_key' | 'sso'`

如果两个服务共享用户数据，这会导致类型冲突。建议提取为共享类型包。

---

## 2. 错误处理

### 🟢 优点

- 所有路由都有 try/catch 包裹
- 全局 `app.onError()` 处理器存在
- 用户友好的错误消息（不泄露内部细节）
- 生产环境隐藏错误详情 (`user-service/src/index.ts`)

### 🟠 High

#### 2.1 API Gateway 错误处理泄露内部信息

`api-gateway/src/index.ts` L107

```typescript
// ❌ 生产环境不应暴露 err.message
app.onError((err, c) => {
  console.error('API Gateway Error:', err)
  return c.json({ error: 'Internal Server Error', message: err.message }, 500)
})

// ✅ 按环境区分
app.onError((err, c) => {
  console.error('API Gateway Error:', err)
  return c.json({
    error: 'Internal Server Error',
    message: c.env.ENVIRONMENT === 'production'
      ? 'An unexpected error occurred'
      : err.message
  }, 500)
})
```

#### 2.2 `catch` 块仅 `console.error` 无结构化日志

所有 `catch` 块都使用 `console.error('xxx error:', error)` 模式。在生产环境中：
- 无结构化日志格式
- 无 request ID 关联
- 无错误追踪

**建议：** 引入结构化日志：

```typescript
function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: 'error',
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...extra,
    timestamp: new Date().toISOString(),
  }));
}
```

### 🟡 Medium

#### 2.3 OAuth 回调中 fetch 失败无网络错误处理

`auth-service/src/routes/oauth/index.ts` L120-180

外部 HTTP 请求（Google/GitHub/Discord API）无 `try/catch`，网络超时或 DNS 失败会导致未捕获异常。

```typescript
// ✅ 建议
try {
  tokenResponse = await fetch('https://oauth2.googleapis.com/token', { ... });
  if (!tokenResponse.ok) {
    return c.json({ error: 'OAuth error', message: 'Token exchange failed' }, 502);
  }
} catch (networkError) {
  console.error('OAuth token fetch failed:', networkError);
  return c.json({ error: 'OAuth error', message: 'Provider unreachable' }, 502);
}
```

#### 2.4 `handleMfaLoginVerification` 无 try/catch

`auth-service/src/routes/mfa/index.ts` L283-335

这个内部辅助函数没有错误处理，异常会冒泡到调用者的 catch 中，但错误上下文会丢失。

---

## 3. 代码规范

### 🟢 优点

- 文件命名一致（kebab-case）
- 函数命名清晰（动词开头：`create`, `find`, `update`, `delete`）
- 每个文件有 JSDoc 文件头注释
- 路由文件结构一致（创建 Hono 实例 → 定义路由 → 导出）
- SQL 查询使用参数化绑定（防注入）

### 🟡 Medium

#### 3.1 混合使用分号

`api-gateway/src/index.ts` 不使用分号，而 `auth-service` 和 `user-service` 使用分号。

**建议：** 统一 ESLint/Prettier 配置，全项目一致。

#### 3.2 `user-service` 路由缺少输入验证库

`auth-service` 使用 Zod 进行输入验证，但 `user-service` 使用手动验证：

```typescript
// user-service/src/routes/users.ts — 手动验证
if (!body.email || typeof body.email !== 'string') {
  return c.json({ error: 'email is required' }, 400);
}

// auth-service 使用 Zod — 更规范
const validation = validate(registerSchema, body);
```

**建议：** `user-service` 也引入 Zod 验证。

#### 3.3 魔法数字散落各处

| 文件 | 行号 | 值 | 含义 |
|------|------|------|------|
| `auth-service/src/routes/mfa/index.ts` | L148 | `300` | MFA token 过期（秒）|
| `auth-service/src/lib/token-rotation.ts` | L11 | `7 * 24 * 60 * 60 * 1000` | Refresh token TTL |
| `auth-service/src/lib/password.ts` | L10 | `100_000` | PBKDF2 迭代次数 |
| `api-gateway/src/index.ts` | L50 | `100` / `200` | Rate limit 最大值 |

**建议：** 提取为命名常量。

---

## 4. 重复代码 (DRY)

### 🟠 High

#### 4.1 OAuth provider switch 语句重复

`auth-service/src/routes/oauth/index.ts` — 三个几乎相同的 `switch(provider)` 块（L65-100, L120-165, L170-210），每个处理 Google/GitHub/Discord。

**建议：** 使用策略模式：

```typescript
const oauthProviders: Record<OAuthProvider, OAuthProviderConfig> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    buildAuthUrl: (clientId, redirectUri, state) => `...`,
    extractProfile: (data) => ({ id: data.id, email: data.email, name: data.name }),
  },
  // ...
};
```

#### 4.2 Token 签发后记录逻辑重复

`login.ts` 和 `mfa/index.ts` 的 verify-login 中都有类似的 token 签发 + 记录逻辑。

#### 4.3 `Variables` 类型重复定义

如 1.4 所述，4 个路由文件重复定义相同的 `Variables` 类型。

#### 4.4 IP 地址提取重复

多处重复 `c.req.header('x-forwarded-for') || c.req.header('x-real-ip')`：
- `auth-service/src/routes/auth/login.ts`
- `auth-service/src/routes/auth/refresh.ts` (×4)
- `auth-service/src/routes/mfa/index.ts`

`rate-limit.ts` 已有 `getClientIp()` 函数，应在其他地方复用。

### 🟡 Medium

#### 4.5 `sha256` 函数重复实现

- `auth-service/src/lib/utils.ts` — `sha256()`
- `user-service/src/middleware/auth.ts` — `sha256()`

两处完全相同的实现。

---

## 5. 模块设计

### 🟢 优点

- **单一职责：** 每个路由文件处理一个资源域
- **关注点分离：** DB 查询 / 业务逻辑 / 路由处理 分层清晰
- **中间件模式：** 认证、授权、限流均通过中间件实现
- **依赖注入：** 通过 `c.env` 注入 D1/KV 绑定，易于测试

### 🟠 High

#### 5.1 两个服务间无共享包

`auth-service` 和 `user-service` 各自独立实现：
- 用户类型定义（不兼容）
- `sha256` 工具函数
- 认证中间件（逻辑不同但名称相同）

**建议：** 创建 `packages/shared` 或 monorepo 共享包。

#### 5.2 `handleMfaLoginVerification` 与 `/verify-login` 路由功能重复

`auth-service/src/routes/mfa/index.ts`:
- `POST /verify-login` (L163-230) 处理 MFA 登录验证
- `POST /verify` (L75-138) 中如果传入 `sessionToken`，调用 `handleMfaLoginVerification`
- `handleMfaLoginVerification` (L283-335) 几乎复制了 `/verify-login` 的逻辑

这是设计混乱——两个入口做同一件事。

### 🟡 Medium

#### 5.3 API Gateway 路由硬编码

`api-gateway/src/index.ts` 中路由映射是硬编码的。如果增加新服务，需要手动修改 gateway。

**建议：** 使用配置驱动：

```typescript
const serviceRoutes = [
  { prefix: '/auth', service: 'AUTH_SERVICE', pathTransform: (p) => p },
  { prefix: '/users', service: 'USER_SERVICE', pathTransform: (p) => '/api' + p },
  { prefix: '/teams', service: 'USER_SERVICE', pathTransform: (p) => '/api' + p },
];
```

---

## 6. 测试覆盖

### 🔴 Critical

#### 6.1 零测试文件

**整个项目无任何测试文件**（`.test.ts` / `.spec.ts`）。

对于处理认证、密码、令牌轮换、OAuth 的安全关键系统，这是不可接受的。

**最低要求测试清单：**

| 优先级 | 测试目标 | 类型 |
|--------|----------|------|
| P0 | `verifyPassword` / `hashPassword` | 单元 |
| P0 | `generateAccessToken` / `verifyAccessToken` | 单元 |
| P0 | Token rotation reuse detection | 单元 |
| P0 | `requireAuth` middleware | 单元 |
| P0 | Login flow (with/without MFA) | 集成 |
| P1 | Rate limiting accuracy | 单元 |
| P1 | RBAC scope checks | 单元 |
| P1 | OAuth callback user creation | 集成 |
| P2 | API key CRUD | 集成 |
| P2 | Team member management | 集成 |

**建议：** 使用 Vitest + Miniflare 进行 Workers 环境测试。

---

## 7. 文档完整性

### 🔴 Critical

#### 7.1 `api-gateway` 和 `user-service` 无 README

仅 `auth-service` 有 README.md。

### 🟠 High

#### 7.2 无 API 文档

没有 OpenAPI/Swagger 规范。外部开发者无法了解 API 接口。

**建议：** 至少在每个路由文件顶部用 JSDoc 描述端点：

```typescript
/**
 * @route POST /auth/login
 * @summary Authenticate user and return tokens
 * @body {email: string, password: string}
 * @returns 200 {accessToken, refreshToken, expiresIn, user}
 * @returns 401 {error: 'Unauthorized'}
 * @returns 429 {error: 'Rate limit exceeded'}
 */
```

#### 7.3 关键函数缺少 JSDoc

以下公开函数缺少参数/返回值文档：
- `user-service/src/db/queries.ts` — 大部分函数无 JSDoc
- `user-service/src/routes/api-keys.ts` — `generateApiKey()` 无 JSDoc
- `api-gateway/src/index.ts` — `rateLimit()` 函数无 JSDoc

### 🟡 Medium

#### 7.4 无架构文档

缺少系统架构图、服务间通信说明、部署流程文档。

---

## 8. 依赖管理

### 🔴 Critical

#### 8.1 无 `package.json`（api-gateway, user-service）

仅 `auth-service` 有 `package.json`。`api-gateway` 和 `user-service` 缺少依赖声明文件。

### 🟠 High

#### 8.2 OAuth PKCE 实现不安全

`auth-service/src/routes/oauth/index.ts` L57

```typescript
const codeVerifier = uuidv4() + uuidv4(); // PKCE
// ...
&code_challenge=${encodeURIComponent(codeVerifier)}
&code_challenge_method=plain
```

问题：
1. `code_challenge_method=plain` 不安全，应使用 `S256`
2. `codeVerifier` 不是真正的 PKCE（未做 SHA-256 变换）
3. GitHub OAuth 不支持 PKCE

**建议：** 对支持 PKCE 的 provider 使用 S256 方法。

#### 8.3 CORS 配置过于宽松

`user-service/src/index.ts` L41

```typescript
origin: ['*'], // TODO: restrict in production
```

生产环境使用 `*` 允许任意来源。

### 🟡 Medium

#### 8.4 `auth-service` 无 `package-lock.json` / `pnpm-lock.yaml`

无法确保依赖版本可重现构建。

#### 8.5 未使用 tree-shaking 友好的导入

`auth-service/src/routes/mfa/index.ts` L95

```typescript
// ❌ 动态 import 在 Workers 中不必要
const { verifyAccessToken } = await import('../../lib/jwt.js');

// ✅ 使用顶层静态导入
import { verifyAccessToken } from '../../lib/jwt.js';
```

---

## 安全专项发现

### 🔴 Critical

| # | 发现 | 文件 | 行号 |
|---|------|------|------|
| S1 | OAuth PKCE 使用 `plain` 方法 | `oauth/index.ts` | L60 |
| S2 | CORS `origin: ['*']` 在 user-service | `user-service/index.ts` | L41 |
| S3 | OAuth 回调将 token 通过 URL 参数传递 | `oauth/index.ts` | L263 |
| S4 | Logout 未实现服务端 token 撤销 | `auth/logout.ts` | L18-25 |

### 🟠 High

| # | 发现 | 文件 | 行号 |
|---|------|------|------|
| S5 | `requireOwnership` 使用 `any` 类型参数 | `rbac.ts` | L132 |
| S6 | MFA disable 时 TOTP code 为可选 | `mfa/index.ts` | L248 |
| S7 | OAuth state 仅存 KV 无绑定用户会话 | `oauth/index.ts` | L53 |
| S8 | 注册后自动登录但未记录 token issuance | `register.ts` | L55-65 |

### 安全改进建议

**S3 — OAuth token 通过 URL 传递：**
```typescript
// ❌ 当前 — token 在 URL 中，可能被记录在浏览器历史/服务器日志
return c.redirect(`${returnUrl}?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`);

// ✅ 建议 — 使用 HTTP-only cookie 或 POST message (popup flow)
// 方案 A: HTTP-only cookie
c.header('Set-Cookie', `access_token=${tokens.accessToken}; HttpOnly; Secure; SameSite=Lax; Path=/`, { append: true });
return c.redirect(returnUrl);

// 方案 B: 中间页面 + postMessage
return c.html(`<script>window.opener.postMessage({type:'oauth_callback'}, '${origin}');</script>`);
```

**S6 — MFA disable 应强制验证：**
```typescript
// ❌ 当前 — code 可选，攻击者获取 auth token 即可关闭 MFA
if (code) { /* 验证 */ }
await disableMfa(c.env.DB, user.sub);

// ✅ 建议 — 必须提供有效 TOTP code 或 recovery code
if (!code) {
  return c.json({ error: 'TOTP code required to disable MFA' }, 400);
}
// ... 验证 code ...
```

**S8 — 注册后应记录 token issuance：**
```typescript
// register.ts — 在 generateTokenPair 后添加：
await recordTokenIssuance(c.env.DB, user.id, tokens.refreshToken, {
  ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
  userAgent: c.req.header('user-agent'),
});
```

---

## 改进优先级路线图

### Phase 1 — 紧急 (1-2 周)

1. ✅ 修复 CORS 配置 (S2)
2. ✅ 修复 OAuth PKCE (S1) 或移除 plain 方法
3. ✅ 修复 OAuth token 传递方式 (S3)
4. ✅ MFA disable 强制验证 (S6)
5. ✅ 注册后记录 token issuance (S8)
6. ✅ 为 api-gateway 和 user-service 添加 package.json

### Phase 2 — 高优先级 (2-4 周)

1. 消除所有 `any` 类型使用
2. 引入输入验证 (Zod) 到 user-service
3. 添加核心单元测试（密码、JWT、token rotation）
4. 修复 API Gateway 错误信息泄露
5. 添加结构化日志
6. 创建共享类型包

### Phase 3 — 中期 (1-2 月)

1. 编写 API 文档 (OpenAPI)
2. 补充集成测试（覆盖所有路由）
3. 重构 OAuth provider 为策略模式
4. 统一两个服务的认证模型
5. 实现服务端 logout (token blacklist)
6. 添加 CI/CD pipeline 中的类型检查 + lint + test

### Phase 4 — 长期

1. 提取共享工具包 (`@cinacoin/shared`)
2. 引入 API 版本管理策略
3. 添加 OpenTelemetry 追踪
4. 性能基准测试
5. 安全渗透测试

---

## 附录：文件清单

| 服务 | 文件 | 行数 (估) |
|------|------|:---:|
| api-gateway | `src/index.ts` | ~110 |
| auth-service | `src/index.ts` | ~55 |
| auth-service | `src/lib/types.ts` | ~95 |
| auth-service | `src/lib/jwt.ts` | ~100 |
| auth-service | `src/lib/password.ts` | ~120 |
| auth-service | `src/lib/validation.ts` | ~95 |
| auth-service | `src/lib/totp.ts` | ~80 |
| auth-service | `src/lib/utils.ts` | ~60 |
| auth-service | `src/lib/token-rotation.ts` | ~175 |
| auth-service | `src/db/users.ts` | ~90 |
| auth-service | `src/db/mfa.ts` | ~200 |
| auth-service | `src/middleware/auth.ts` | ~65 |
| auth-service | `src/middleware/rate-limit.ts` | ~120 |
| auth-service | `src/routes/auth/login.ts` | ~90 |
| auth-service | `src/routes/auth/register.ts` | ~65 |
| auth-service | `src/routes/auth/refresh.ts` | ~145 |
| auth-service | `src/routes/auth/me.ts` | ~30 |
| auth-service | `src/routes/auth/change-password.ts` | ~60 |
| auth-service | `src/routes/auth/logout.ts` | ~30 |
| auth-service | `src/routes/mfa/index.ts` | ~335 |
| auth-service | `src/routes/oauth/index.ts` | ~310 |
| user-service | `src/index.ts` | ~115 |
| user-service | `src/db/schema.ts` | ~100 |
| user-service | `src/db/queries.ts` | ~310 |
| user-service | `src/middleware/auth.ts` | ~95 |
| user-service | `src/middleware/rbac.ts` | ~150 |
| user-service | `src/routes/users.ts` | ~120 |
| user-service | `src/routes/teams.ts` | ~215 |
| user-service | `src/routes/permissions.ts` | ~100 |
| user-service | `src/routes/api-keys.ts` | ~120 |

---

*报告结束 — 生成时间: 2026-06-09T02:33:00Z*
