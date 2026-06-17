# P0 安全修复记录 — 2026-06-17

## 修复完成

### P0-1: JWT 无算法限制 ✅
**文件**: `apps/auth-service/worker/src/lib/jwt.ts`

**修复内容**:
1. 添加 `algorithms: ['HS256']` 到 `jwtVerify()` — 防止 alg:none / alg confusion 攻击
2. 添加 `issuer` / `audience` 校验 — 防止跨系统 token 滥用
3. 添加 `validateSecretKey()` — 强制 JWT secret ≥ 32 字节 (256-bit)
4. 添加 token type 校验 — access token 只能用作 access，refresh 只能用作 refresh
5. 在 `createAccessToken()` / `createRefreshToken()` 中设置 issuer/audience

**修复前**:
```ts
const { payload } = await jwtVerify(token, key);
// 无算法限制、无 issuer/audience、无 secret 长度校验
```

**修复后**:
```ts
validateSecretKey(secret, 'JWT_SECRET');
const { payload } = await jwtVerify(token, key, {
  algorithms: ['HS256'],
  issuer: 'cinacoin',
  audience: 'cinacoin',
});
if ((payload as any).type !== 'access') return null;
```

---

### P0-2: OAuth redirect_uri 未验证 ✅
**文件**: `apps/auth-service/worker/src/index.ts:347-395`

**修复内容**:
1. 从 `system_settings` 读取 `oauth_allowed_redirect_uris` 白名单
2. 用户提供的 `redirect_uri` 必须精确匹配白名单中的 URI
3. 未提供时使用白名单第一个作为默认值
4. 拒绝不在白名单中的 redirect_uri（返回 400）

**修复前**:
```ts
const redirectUri = c.req.query('redirect_uri') || '';
// 直接使用，无验证 → 开放重定向漏洞
```

**修复后**:
```ts
const redirectUri = c.req.query('redirect_uri') || '';
const allowedRedirectUris = (await getSystemSetting(db, 'oauth_allowed_redirect_uris')) ||
  'https://cinacoin.com,https://app.cinacoin.com,https://cinacoin-auth.pages.dev';
const allowedList = allowedRedirectUris.split(',').map(uri => uri.trim());

if (redirectUri && !allowedList.includes(redirectUri)) {
  return c.json({ error: 'Invalid redirect_uri' }, 400);
}
const safeRedirectUri = redirectUri || allowedList[0];
```

**运维注意**: 需要在 DB 的 `system_settings` 表中添加 `oauth_allowed_redirect_uris` 配置项。

---

### P0-3: Token 在 API 响应中泄露 ✅
**文件**: `apps/auth-service/worker/src/index.ts:888-898, 975-984`

**修复内容**:
1. Email 验证端点：移除 `token` 和 `verifyUrl` 的 fallback 返回
2. 密码重置端点：移除 `token` 和 `resetUrl` 的 fallback 返回
3. 邮件发送失败时仅记录运维日志，不向客户端暴露 token
4. 统一返回通用成功消息

**修复前**:
```ts
return c.json({
  success: true,
  message: emailSent ? 'Verification email sent' : 'Email service unavailable. Token generated.',
  token: emailSent ? undefined : token,        // 泄露!
  verifyUrl: emailSent ? undefined : verifyUrl, // 泄露!
});
```

**修复后**:
```ts
if (!emailSent) {
  console.error('Email verification send failed for user:', user.id);
}
return c.json({
  success: true,
  message: 'Verification email sent. Please check your inbox.',
});
```

---

### P1-1: Dev-only JWT secret fallback 可被生产误用 ✅
**文件**: `apps/auth-service/src/middleware.ts:12-30`

**修复内容**:
1. 反转逻辑：只在 NODE_ENV 明确为 `development` 或 `test` 时才允许 fallback
2. 其他所有环境（production, staging, 空值等）一律 fail-closed

**修复前**:
```ts
if (nodeEnv === 'production') {
  throw new Error(...);
}
// 其他所有值（包括 staging, 空字符串等）都走 fallback
return new TextEncoder().encode('dev-only-insecure-secret...');
```

**修复后**:
```ts
if (nodeEnv === 'development' || nodeEnv === 'test') {
  console.warn('...');
  return new TextEncoder().encode('dev-only-insecure-secret...');
}
// 所有其他环境 — fail closed
throw new Error('JWT_SECRET environment variable is required...');
```

---

### P1-6: 内部错误信息泄露给客户端 ✅
**文件**: `apps/auth-service/worker/src/index.ts:157, 183`

**修复内容**:
1. Logout 错误：移除 `error.message` 拼接
2. Refresh 错误：移除 `error.message` 拼接
3. 统一返回通用错误消息

**修复前**:
```ts
return c.json({ error: `Logout failed: ${error instanceof Error ? error.message : 'unknown'}` }, 500);
return c.json({ error: `Refresh failed: ${error instanceof Error ? error.message : 'unknown'}` }, 500);
```

**修复后**:
```ts
return c.json({ error: 'Logout failed' }, 500);
return c.json({ error: 'Refresh failed' }, 500);
```

---

## 影响范围

| 文件 | 修改行数 | 风险级别 |
|------|---------|---------|
| `apps/auth-service/worker/src/lib/jwt.ts` | 全文重写 | 高（认证核心）|
| `apps/auth-service/worker/src/index.ts` | ~20 行 | 中（OAuth + 邮件）|
| `apps/auth-service/src/middleware.ts` | ~10 行 | 中（JWT 启动逻辑）|

## 后续动作

1. **运维**: 在 DB `system_settings` 表添加 `oauth_allowed_redirect_uris` 配置
2. **测试**: 验证新的 JWT 校验逻辑不影响现有 token（新 token 需带 issuer/audience）
3. **迁移**: 现有 token 无 issuer/audience，会校验失败 → 用户需重新登录
4. **P2 跟进**: 统一使用 `workers/auth-service` 版本，废弃 `apps/auth-service/worker`

## 上线判定

- ✅ P0 全部修复
- ⚠️ 需要数据迁移（OAuth redirect_uris 配置）
- ⚠️ 用户 session 会失效（JWT issuer/audience 变更）
- **建议**: 配合版本发布，提前通知用户重新登录

---

*修复完成 — 2026-06-17 — 审计员 000*
