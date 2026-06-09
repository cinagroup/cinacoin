# Cinacoin 安全审计报告

**审计日期**: 2026-06-09  
**审计范围**: api-gateway, auth-service, user-service  
**审计人员**: 000 Security Auditor  
**框架版本**: Hono on Cloudflare Workers  

---

## 执行摘要

本次审计对 Cinacoin 项目的三个核心服务进行了系统性安全评估。整体架构设计合理，采用了现代安全实践（JWT rotation、MFA、parameterized queries），但存在若干需要修复的安全问题。

**总体安全评分: 68/100** 🟡

| 等级 | 数量 |
|------|------|
| 🔴 Critical | 3 |
| 🟠 High | 5 |
| 🟡 Medium | 7 |
| 🔵 Low | 4 |

---

## 1. 认证与授权 (Authentication & Authorization)

### 🟠 [H-01] Logout 未实现 Token 吊销
**文件**: `auth-service/src/routes/auth/logout.ts:23-34`  
**描述**: Logout 端点仅返回成功响应，未实际吊销 access token。注释中提到了 blacklist 实现但被注释掉。攻击者获取 token 后可持续使用直至过期（15分钟）。  
**影响**: 被盗 token 无法立即失效  
**修复建议**:
```typescript
// 启用 token blacklist
const token = c.req.header('authorization')?.split(' ')[1];
if (token) {
  const tokenHash = await sha256(token);
  await c.env.KV.put(`blacklist:${tokenHash}`, '1', { 
    expirationTtl: parseInt(c.env.JWT_EXPIRES_IN) || 900 
  });
}
```
同时在 `requireAuth` 中间件中添加 blacklist 检查。

---

### 🟡 [M-01] Admin API Key 存在时序攻击风险
**文件**: `user-service/src/middleware/auth.ts:34-37`  
**描述**: Admin API key 使用 `!==` 进行字符串比较，存在时序攻击（timing attack）风险。  
**影响**: 理论上可通过响应时间差异逐字节猜测 admin key  
**修复建议**:
```typescript
// 使用常量时间比较
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}
```

---

### 🟡 [M-02] Access Token 无吊销机制
**文件**: `auth-service/src/lib/jwt.ts`  
**描述**: Access token 为无状态 JWT，无法在用户被禁用或密码更改后立即失效。  
**影响**: 被禁用的用户在 token 过期前仍可访问系统  
**修复建议**: 
1. 实现 token blacklist（见 H-01）
2. 或缩短 access token 有效期至 5 分钟
3. 在 `requireAuth` 中检查用户状态

---

### 🔵 [L-01] Token 类型验证可被绕过
**文件**: `auth-service/src/lib/jwt.ts:69-73, 87-91`  
**描述**: Token 类型验证依赖 payload 中的 `type` 字段，该字段由 `SignJWT` 设置但也在 payload 中可被读取。  
**影响**: 低风险，jose 库实现正确  
**修复建议**: 当前实现可接受，无需修改。

---

## 2. 输入验证 (Input Validation)

### ✅ 正面发现
- 使用 Zod 进行 schema 验证
- 所有数据库查询使用参数化查询（防 SQL 注入）
- 密码复杂度要求（大小写+数字）
- Email 标准化（小写+trim）
- 用户名白名单正则

### 🟡 [M-03] User Service 缺少严格输入验证
**文件**: `user-service/src/routes/users.ts:55-70, 89-100`  
**描述**: User service 的创建/更新端点仅检查字段存在性，未使用 Zod 进行严格验证。  
**影响**: 可能接受格式不正确的数据  
**修复建议**:
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  display_name: z.string().max(100).optional(),
  auth_type: z.enum(['password', 'oauth', 'api_key', 'sso']),
});
```

---

### 🟡 [M-04] 缺少 XSS 防护 Headers
**文件**: 全局  
**描述**: 未设置 Content-Security-Policy、X-Content-Type-Options 等安全头。  
**影响**: 增加 XSS 攻击面  
**修复建议**:
```typescript
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '0'); // 现代最佳实践
});
```

---

### 🔵 [L-02] 分页参数未限制上限
**文件**: `user-service/src/routes/users.ts:44-45`, `user-service/src/routes/teams.ts:49-50`  
**描述**: `limit` 参数未设置最大值，攻击者可请求极大值导致性能问题。  
**修复建议**: `const limit = Math.min(Number(c.req.query('limit') ?? 50), 100);`

---

## 3. 密码安全 (Password Security)

### ✅ 正面发现
- PBKDF2-SHA256 哈希算法
- 16 字节随机盐
- 常量时间比较（防时序攻击）
- 密码长度限制 8-128 字符
- 支持 rehash 检测

### 🟡 [M-05] PBKDF2 迭代次数偏低
**文件**: `auth-service/src/lib/password.ts:11`  
**描述**: 使用 100,000 次迭代，OWASP 建议 SHA-256 使用 600,000+ 次。代码注释说明 Cloudflare Workers 限制为 100,000。  
**影响**: 相比推荐值，暴力破解难度降低约 6 倍  
**修复建议**: 
1. 监控 Cloudflare Workers PBKDF2 限制变化
2. 考虑使用 Argon2id（如 Workers 支持）
3. 作为补偿控制，增加密码复杂度要求

---

## 4. 密钥管理 (Secrets Management)

### 🔴 [C-01] CORS 配置过于宽松
**文件**: `user-service/src/index.ts:36-38`, `auth-service/src/index.ts:29`  
**描述**: 
- User Service: `origin: ['*']` 且带有 TODO 注释
- Auth Service: `origin: c.env.CORS_ORIGIN || '*'` 默认允许所有  
**影响**: 任意网站可发起跨域请求，结合凭证泄露可导致账户接管  
**修复建议**:
```typescript
// 明确列出允许的源
const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://website.cinacoin.com'
];

cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : null,
  // ...
})
```

---

### 🟡 [M-06] OAuth Provider Secrets 存储
**文件**: `auth-service/src/lib/types.ts:20-25`  
**描述**: OAuth client secrets 通过环境变量传入，需确保 Workers secrets 正确配置。  
**影响**: 如 secrets 泄露，攻击者可冒充应用  
**修复建议**: 
1. 使用 Cloudflare Workers Secrets（非普通环境变量）
2. 定期轮换 secrets
3. 监控 secrets 使用情况

---

### 🔵 [L-03] JWT Secret 轮换机制缺失
**文件**: `auth-service/src/lib/jwt.ts`  
**描述**: 未实现 JWT secret 轮换机制。  
**修复建议**: 实现 secret 轮换，同时接受新旧 secret 验证。

---

## 5. 限流与防滥用 (Rate Limiting)

### ✅ 正面发现
- 实现了滑动窗口限流算法
- 针对不同端点设置不同限制
- 返回标准限流头

### 🟠 [H-02] IP 地址可被伪造
**文件**: `auth-service/src/middleware/rate-limit.ts:26-34`  
**描述**: 依赖 `X-Forwarded-For` 和 `X-Real-IP` 头获取客户端 IP，这些头可被客户端伪造。  
**影响**: 攻击者可绕过限流，进行暴力破解  
**修复建议**:
```typescript
export function getClientIp(c: Context): string {
  // Cloudflare Workers 应使用 cf-connecting-ip
  const cfIp = c.req.header('cf-connecting-ip');
  if (cfIp) return cfIp;
  
  // 仅在信任的代理后使用 forwarded
  // ...
  return 'unknown';
}
```
注意：API Gateway 已正确使用 `cf-connecting-ip`，但 auth-service 中间件未使用。

---

### 🟡 [M-07] API Gateway 使用固定窗口限流
**文件**: `api-gateway/src/index.ts:24-33`  
**描述**: Gateway 使用固定窗口算法，在窗口边界可能出现 2x 突发流量。  
**影响**: 限流精度不如滑动窗口  
**修复建议**: 统一使用滑动窗口算法，或接受当前实现（已有 auth-service 的更严格限流作为补充）。

---

### 🔵 [L-04] 缺少全局限流
**描述**: 未设置全局 IP 限流，攻击者可分散请求到不同端点。  
**修复建议**: 添加全局 IP 限流（如 1000 req/min/IP）。

---

## 6. CORS 与网络安全 (CORS & Network Security)

### 🔴 [C-02] User Service CORS 完全开放
**文件**: `user-service/src/index.ts:37`  
**描述**: `origin: ['*']` 允许任意来源的跨域请求，且配置了 `credentials` 相关头。  
**影响**: 恶意网站可读取用户数据  
**修复建议**: 立即限制为已知域名列表。

---

### 🟠 [H-03] 缺少 HSTS Header
**文件**: 全局  
**描述**: 未设置 Strict-Transport-Security header。  
**影响**: 用户可能被降级到 HTTP 连接  
**修复建议**:
```typescript
c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
```

---

## 7. OAuth 安全 (OAuth Security)

### 🔴 [C-03] PKCE 使用 plain 方法而非 S256
**文件**: `auth-service/src/routes/oauth/index.ts:52-53`  
**描述**: Google OAuth 使用 `code_challenge_method=plain`，将 code_verifier 直接作为 code_challenge。  
**影响**: PKCE 保护被削弱，授权码拦截攻击风险增加  
**修复建议**:
```typescript
// 使用 S256 方法
const codeVerifier = generateNonce(); // 已有的随机生成函数
const codeChallenge = await base64urlEncode(await sha256(codeVerifier));

// URL 中使用
`&code_challenge=${encodeURIComponent(codeChallenge)}` +
`&code_challenge_method=S256`
```

---

### 🟠 [H-04] OAuth 回调存在开放重定向
**文件**: `auth-service/src/routes/oauth/index.ts:157`  
**描述**: `return_url` 参数未经验证直接用于重定向。  
**影响**: 攻击者可构造恶意 return_url 进行钓鱼攻击  
**修复建议**:
```typescript
const returnUrl = c.req.query('return_url') || '/';
const allowedReturnUrls = ['/', '/dashboard', '/settings'];
const safeReturnUrl = allowedReturnUrls.includes(returnUrl) ? returnUrl : '/';
```

---

### 🟠 [H-05] Token 通过 URL 查询参数传递
**文件**: `auth-service/src/routes/oauth/index.ts:160-162`  
**描述**: OAuth 完成后，access_token 和 refresh_token 通过 URL 查询参数传递。  
**影响**: 
- Token 可能被记录在浏览器历史
- 可能被记录在服务器访问日志
- Referer header 可能泄露 token  
**修复建议**:
1. 使用 URL fragment（#）而非查询参数（?）
2. 或使用 POST 方式传递
3. 最佳实践：使用一次性 code 交换 token

```typescript
// 方案1: 使用 fragment
return c.redirect(`${returnUrl}#access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`);

// 方案2: 存储到 KV，返回 code
const code = uuidv4();
await c.env.KV.put(`oauth:code:${code}`, JSON.stringify(tokens), { expirationTtl: 60 });
return c.redirect(`${returnUrl}?code=${code}`);
```

---

### 🟡 [M-08] OAuth Access Token 明文存储
**文件**: `auth-service/src/routes/oauth/index.ts:168-177`  
**描述**: OAuth provider 的 access_token 以明文存储在数据库中。  
**影响**: 数据库泄露会导致第三方平台 token 泄露  
**修复建议**: 
1. 加密存储 OAuth tokens
2. 或仅存储必要信息，不存储 access_token

---

## 8. 数据保护 (Data Protection)

### 🟠 [H-06] TOTP Secret 明文存储
**文件**: `auth-service/src/db/mfa.ts:41-50`  
**描述**: TOTP secret 以明文存储在 `mfa_methods.totp_secret` 字段。  
**影响**: 数据库泄露会导致所有用户 MFA 被绕过  
**修复建议**:
```typescript
// 使用加密存储
const encryptedSecret = await encryptSecret(secret, env.ENCRYPTION_KEY);
// 数据库中存储 encryptedSecret
```

---

### 🟡 [M-09] 错误信息泄露内部细节
**文件**: `user-service/src/index.ts:94-98`  
**描述**: 非生产环境下错误响应包含完整错误消息。  
**影响**: 可能泄露数据库结构、内部路径等信息  
**修复建议**: 确保生产环境始终返回通用错误消息（当前实现已部分处理）。

---

## 安全评分详情

| 维度 | 得分 | 说明 |
|------|------|------|
| 认证与授权 | 75/100 | Token rotation 实现良好，但 logout 未吊销 token |
| 输入验证 | 80/100 | Auth service 验证严格，user service 需加强 |
| 密码安全 | 70/100 | 实现正确但迭代次数受限 |
| 密钥管理 | 60/100 | CORS 配置问题严重 |
| 限流与防滥用 | 75/100 | 基本实现完善，IP 获取需修正 |
| CORS 与网络安全 | 50/100 | 多处 CORS 配置过于宽松 |
| OAuth 安全 | 45/100 | PKCE 实现错误，token 传递方式不安全 |
| 数据保护 | 65/100 | TOTP secret 明文存储是主要问题 |

**总体评分: 68/100** 🟡

---

## 优先修复清单

### 立即修复 (Critical - 24小时内)
1. ✅ [C-01] 修复 User Service CORS 配置
2. ✅ [C-02] 修复 Auth Service CORS 回退值
3. ✅ [C-03] OAuth PKCE 改用 S256 方法

### 高优先级 (High - 1周内)
4. ✅ [H-01] 实现 logout token 吊销
5. ✅ [H-02] 修正 IP 地址获取逻辑
6. ✅ [H-03] 添加 HSTS header
7. ✅ [H-04] 修复 OAuth 开放重定向
8. ✅ [H-05] 改用安全方式传递 OAuth token
9. ✅ [H-06] 加密存储 TOTP secret

### 中优先级 (Medium - 1月内)
10. ✅ [M-01] 实现常量时间 admin key 比较
11. ✅ [M-02] 实现 access token 吊销机制
12. ✅ [M-03] User service 添加 Zod 验证
13. ✅ [M-04] 添加安全响应头
14. ✅ [M-05] 评估更强的密码哈希方案
15. ✅ [M-06] 审计 OAuth secrets 配置
16. ✅ [M-07] 统一限流算法

---

## 总结

Cinacoin 项目整体安全架构设计合理，采用了现代安全实践。主要问题集中在：
1. **配置层面**: CORS 过于宽松（已标记 TODO）
2. **OAuth 实现**: PKCE 和 token 传递方式需要改进
3. **敏感数据**: TOTP secret 和 OAuth token 需要加密存储

建议按优先级逐步修复上述问题，并在修复后进行回归测试。

---

*报告生成时间: 2026-06-09 02:33 UTC*  
*审计工具: 手动代码审查*
