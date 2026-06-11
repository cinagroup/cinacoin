# 后端代码质量审计报告

**审计日期**: 2026-06-11  
**审计范围**: Cinacoin 后端服务与 Workers  
**审计人**: 000 (AI Assistant)

---

## 执行摘要

本次审计覆盖了 12 个后端服务/SDK 包，包括 relay-server、rpc-proxy、bundler、push-server、analytics-server、keys-server、notify-server、social-login、passkey-auth、blockchain-api、cross-chain-sync、core-sdk。

**整体评估**: 代码质量中上。大部分服务具备基本的安全防护（输入验证、速率限制、CORS），但存在若干高危和中危问题需要修复。主要风险集中在：认证缺失（blockchain-api）、信息泄露（rpc-proxy 错误响应）、时序攻击（analytics-server API key 比较）、以及 passkey-auth 的签名验证绕过。

---

## 高危问题 🔴

### H-001: blockchain-api 缺少认证和速率限制
- **文件**: `packages/blockchain-api/src/server/index.ts`
- **描述**: 所有 API 端点（/api/balance、/api/history、/api/ens/resolve、/api/token/metadata）均无认证机制和速率限制。任何人均可无限制调用，可能导致 RPC 节点被滥用、费用激增。
- **风险等级**: 🔴 高危
- **修复建议**: 
  1. 添加 API key 或 JWT 认证中间件
  2. 实现 per-IP/per-user 速率限制
  3. 参考 push-server 的 `verifyApiKey` 实现（使用 constant-time compare）

### H-002: analytics-server API key 比较存在时序攻击漏洞
- **文件**: `packages/analytics-server/src/index.ts:62`
- **描述**: `apiKey !== c.env.API_KEY` 使用 JavaScript 的 `!==` 进行比较，该操作在第一个不匹配字符处即返回，攻击者可通过测量响应时间逐字符猜测 API key。
- **风险等级**: 🔴 高危
- **修复建议**: 
  ```typescript
  // 使用 crypto.timingSafeEqual 或 constant-time compare
  import { timingSafeEqual } from 'crypto';
  function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
  ```
  参考 push-server 中已有的 `constantTimeCompare` 实现。

### H-003: passkey-auth 回退认证绕过签名验证
- **文件**: `packages/passkey-auth/src/passkey.ts:88-101`
- **描述**: 当 `WebAuthnClient.isAvailable()` 返回 false 时（非浏览器环境），`authenticate()` 方法仅检查 credentialId 是否存在于存储中即返回成功，完全跳过签名验证。攻击者只需知道 credentialId 即可冒充用户。
- **风险等级**: 🔴 高危
- **修复建议**: 
  1. 服务端回退必须要求签名验证，不可仅凭 credentialId 放行
  2. 非浏览器环境应使用 challenge-response 机制验证持有私钥
  3. 明确标注此 fallback 仅适用于开发环境，生产环境禁用

### H-004: rpc-proxy 错误响应泄露上游信息
- **文件**: `packages/rpc-proxy/src/RpcProxy.ts:265-271`
- **描述**: 当上游 RPC 请求失败时，错误消息直接传递给客户端：`this.sendError(res, 502, errMsg)`。`errMsg` 可能包含上游 RPC URL、内部网络结构、节点版本等敏感信息。
- **风险等级**: 🔴 高危
- **修复建议**: 
  ```typescript
  // 对外返回通用错误，详细信息仅记录到日志
  logger.error(`[rpc-proxy] Upstream error for ${chain}:`, errMsg);
  this.sendError(res, 502, 'Upstream RPC error');
  ```

### H-005: bundler 无 HTTP 层速率限制和请求体大小限制
- **文件**: `packages/bundler/src/BundlerServer.ts:195-210`
- **描述**: JSON-RPC 端点无 HTTP 层速率限制（仅有 reputation 层面的 sender 级限制），且请求体无大小限制（`body += chunk` 无上限检查）。攻击者可发送超大请求体导致内存耗尽，或高频提交 UserOp 进行 DoS。
- **风险等级**: 🔴 高危
- **修复建议**: 
  1. 添加 per-IP 速率限制中间件
  2. 限制请求体大小（如 1MB）：
  ```typescript
  let body = '';
  for await (const chunk of req as Readable) {
    body += chunk;
    if (body.length > MAX_BODY_SIZE) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request body too large' }));
      return;
    }
  }
  ```

---

## 中危问题 🟡

### M-001: notify-server 缺少 HTTP 层和独立部署能力
- **文件**: `packages/notify-server/src/NotifyServer.ts`
- **描述**: NotifyServer 是一个纯内存的库类，没有 HTTP 服务器、没有认证、没有速率限制、没有持久化。如果直接暴露为服务使用，任何人都可以发送通知或查看订阅。
- **风险等级**: 🟡 中危
- **修复建议**: 
  1. 添加 HTTP 层（参考 push-server 的 Worker 模式）
  2. 添加 API key 认证
  3. 集成持久化存储（KV 或 D1）

### M-002: social-login 会话存储为进程内 Map，不支持分布式
- **文件**: `packages/social-login/src/session-manager.ts:67`
- **描述**: `ACTIVE_SESSIONS` 是模块级 `Map<string, SessionRecord>`，多实例部署时会话不共享。用户刷新 token 时可能命中不同实例导致会话失效。
- **风险等级**: 🟡 中危
- **修复建议**: 
  1. 使用 Redis/D1/KV 作为会话后端
  2. 或改用无状态 JWT（仅依赖签名验证，不查服务端状态）
  3. 如必须用内存存储，添加 sticky session 或广播失效机制

### M-003: relay-server 空 error handler 静默吞异常
- **文件**: `packages/relay-server/src/RelayServer.ts:369`
- **描述**: `ws.on('error', () => { // Error handler to prevent uncaught exceptions })` 完全静默处理 WebSocket 错误，不利于问题排查和监控。
- **风险等级**: 🟡 中危
- **修复建议**: 至少记录错误日志：
  ```typescript
  ws.on('error', (err) => {
    logger.warn(`[relay-server] WebSocket error for client ${clientId}:`, err.message);
  });
  ```

### M-004: keys-server 会话和密钥存储为纯内存 Map
- **文件**: `packages/keys-server/src/KeyManager.ts:38-39`
- **描述**: `store` 和 `sessions` 均为 `Map`，进程重启后所有数据丢失。对于密钥管理服务，这可能导致用户永久丢失加密密钥。
- **风险等级**: 🟡 中危
- **修复建议**: 
  1. 集成持久化存储（加密的数据库或 HSM）
  2. 至少提供可替换的存储后端接口
  3. 添加存储后端健康检查

### M-005: analytics-server 无请求体大小限制
- **文件**: `packages/analytics-server/src/index.ts:55-60`
- **描述**: `await c.req.json()` 直接解析请求体，无大小限制。Hono 在 Cloudflare Workers 上可能受平台限制，但在 Node.js 运行时可能被利用。
- **风险等级**: 🟡 中危
- **修复建议**: 添加请求体大小检查或使用 Hono 的 body limit middleware。

### M-006: blockchain-api 错误响应泄露内部错误详情
- **文件**: `packages/blockchain-api/src/server/index.ts:85-88`
- **描述**: catch 块中 `err.message` 直接返回给客户端，可能暴露 RPC URL、合约地址、内部堆栈等信息。
- **风险等级**: 🟡 中危
- **修复建议**: 
  ```typescript
  } catch (err: unknown) {
    logger.error('[blockchain-api] Balance error:', err);
    return errorResponse("Internal server error", 500);
  }
  ```

### M-007: rpc-proxy 缓存无认证隔离
- **文件**: `packages/rpc-proxy/src/RpcProxy.ts:150-160`
- **描述**: 缓存 key 仅包含 `chain:body`，不包含调用者身份。如果多租户共用 proxy，一个用户的缓存响应可能被另一个用户获取（对于非只读方法虽然已做 isReadOnly 检查，但只读数据也可能有隐私敏感性）。
- **风险等级**: 🟡 中危
- **修复建议**: 对于敏感链数据，考虑在缓存 key 中加入租户标识，或确保只缓存公共数据。

### M-008: push-server /send-batch 端点未执行速率限制
- **文件**: `packages/push-server/src/index.ts:155-195`
- **描述**: `handleSendBatch` 未调用 `limiter.check()`，直接遍历所有通知进行投递。攻击者可通过 batch 端点绕过 per-device/per-address 速率限制。
- **风险等级**: 🟡 中危
- **修复建议**: 在 `handleSendBatch` 的循环中加入与 `handleSend` 相同的速率限制检查。

---

## 低危问题 🟢

### L-001: relay-server allowedOrigins 为空时允许所有来源
- **文件**: `packages/relay-server/src/RelayServer.ts:240-243`
- **描述**: `if (!allowed) { cb(true); return; }` — 未配置 allowedOrigins 时允许所有 WebSocket 来源连接。
- **风险等级**: 🟢 低危（配置正确时不影响）
- **修复建议**: 生产环境强制要求配置 allowedOrigins，或在文档中明确警告。

### L-002: push-server APNs Authorization header 使用占位符
- **文件**: `packages/push-server/src/notification-delivery.ts:113`
- **描述**: `"Authorization": "bearer <jwt-token>"` 是占位符，实际 APNs 需要 ES256 签名的 JWT。
- **风险等级**: 🟢 低危（生产环境配置了 APNs 密钥时会走真实逻辑）
- **修复建议**: 实现完整的 APNs JWT 生成逻辑（使用 APNS_PRIVATE_KEY 签名）。

### L-003: analytics-server GDPR hashIp 使用弱哈希
- **文件**: `packages/analytics-server/src/anonymizer.ts:62-69`
- **描述**: `hashIp` 使用简单的字符码哈希（非加密安全），可能被逆向还原 IP 地址。
- **风险等级**: 🟢 低危
- **修复建议**: 使用 SHA-256（Workers 环境可用 `crypto.subtle.digest`）替代简单哈希。

### L-004: passkey-auth 默认存储为 localStorage（XSS 风险）
- **文件**: `packages/passkey-auth/src/storage.ts:34-50`
- **描述**: `BrowserStorage` 使用 localStorage 存储 passkey 凭证数据，如果应用存在 XSS 漏洞，攻击者可窃取凭证。
- **风险等级**: 🟢 低危（passkey 设计上不存储私钥，仅存 credential ID 和公钥）
- **修复建议**: 考虑使用 httpOnly cookie 或服务端存储。

### L-005: rpc-proxy 连接池 agent 传递方式可能不生效
- **文件**: `packages/rpc-proxy/src/RpcProxy.ts:180-189`
- **描述**: Node.js 原生 `fetch` (undici) 使用 `dispatcher` 而非 `agent` 选项。代码中 `...(agent ? { agent } : {})` 可能不生效，导致连接池配置无效。
- **风险等级**: 🟢 低危（功能不受影响，但性能优化未生效）
- **修复建议**: 使用 undici 的 `Agent` 和 `dispatcher` 选项：
  ```typescript
  import { Agent } from 'undici';
  // ...
  const dispatcher = new Agent({ connections: 10 });
  fetch(url, { ..., dispatcher } as RequestInit);
  ```

### L-006: bundler env 验证不强制必需字段
- **文件**: `packages/bundler/src/env.ts`
- **描述**: `BUNDLER_SIGNER_PRIVATE_KEY` 和 `BUNDLER_BENEFICIARY` 均为 optional，生产环境可能因遗漏配置导致 bundler 无法签名交易。
- **风险等级**: 🟢 低危
- **修复建议**: 在 production 模式下将关键字段标记为 required。

---

## 优化建议 💡

### 1. 统一认证中间件
当前各服务认证方式不一致（API key、Bearer token、无认证）。建议：
- 创建 `@cinacoin/auth-middleware` 共享包
- 统一使用 constant-time compare 进行密钥比较
- 支持 API key 和 JWT 两种模式

### 2. 统一错误处理框架
各服务错误处理方式各异，建议：
- 创建标准化的错误码体系
- 对外统一返回 `{ error: { code, message } }` 格式
- 内部错误仅记录日志，不暴露给客户端

### 3. 引入结构化请求验证
目前验证逻辑多为手写 if/else，建议：
- 统一使用 zod schema 验证所有请求体（keys-server 和 social-login 已采用）
- 为每个端点定义明确的 input/output schema
- 自动生成 OpenAPI 文档

### 4. 分布式会话/状态管理
多个服务使用进程内 Map 存储关键状态：
- social-login: ACTIVE_SESSIONS
- keys-server: store, sessions
- 建议迁移到 Redis 或 Cloudflare Durable Objects

### 5. 添加请求追踪
所有服务缺少 request ID / tracing：
- 建议在入口生成 X-Request-ID
- 贯穿日志记录，便于问题排查
- 响应头返回 request ID 方便客户端报告问题

### 6. 安全头统一
relay-server 和 rpc-proxy 手动设置安全头，建议：
- 创建共享 middleware 统一设置：
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Strict-Transport-Security`（缺失于所有服务）

### 7. 健康检查标准化
各服务健康检查格式不一，建议统一为：
```json
{
  "status": "ok|degraded|down",
  "version": "semver",
  "uptime": seconds,
  "checks": {
    "database": "ok|down",
    "cache": "ok|down",
    "upstream": "ok|down"
  }
}
```

### 8. 添加 HSTS 头
所有服务均缺少 `Strict-Transport-Security` 头，建议添加：
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 审计清单完成情况

### 1. API 安全
- [x] 输入验证是否完整 — **部分完整**（bundler、push-server、analytics-server 较好；blockchain-api 较弱）
- [x] 是否有速率限制 — **大部分有**（bundler HTTP 层缺失；push-server /send-batch 缺失）
- [x] 是否有请求大小限制 — **部分有**（relay-server、rpc-proxy 有；bundler、analytics-server 缺失）
- [x] 错误响应是否泄露信息 — **存在问题**（rpc-proxy、blockchain-api 泄露上游/内部错误）

### 2. 认证与授权
- [x] JWT 验证是否正确 — **正确**（social-login 使用 jose 库，验证 issuer/audience/exp）
- [x] Session 管理是否安全 — **基本安全**（但内存存储不支持分布式）
- [x] OAuth 流程是否完整 — **完整**（Google、Apple、Twitter、GitHub 均实现）
- [x] 权限检查是否到位 — **部分缺失**（blockchain-api 无任何权限检查）

### 3. 数据验证
- [x] 用户输入是否经过验证 — **大部分使用手动验证**（keys-server 使用 zod，其他为手写验证）
- [x] 是否有类型断言代替验证 — **存在**（多处 `as` 类型断言，但运行时已做类型检查）
- [x] 文件上传是否有类型/大小检查 — **不适用**（无文件上传端点）

### 4. 数据库安全
- [x] 是否使用参数化查询 — **是**（analytics-server D1 使用 `.bind()` 参数化）
- [x] 是否有 N+1 查询问题 — **存在**（push-server `getAllDevicesForAddress` 对每个 deviceId 单独查询）
- [x] 事务处理是否正确 — **不适用**（KV 存储不支持事务）
- [x] 连接池配置是否合理 — **可能不生效**（rpc-proxy 的 agent 选项传递方式有误）

### 5. 错误处理
- [x] 是否有未捕获的异常 — **基本覆盖**（各服务有 try-catch 和全局错误处理）
- [x] 错误日志是否完整 — **部分不完整**（relay-server WebSocket error 静默处理）
- [x] 是否有静默失败 — **存在**（relay-server ws error handler、passkey-auth 回退路径）

### 6. 架构规范
- [x] 模块职责是否单一 — **良好**（各服务职责清晰，push-server 拆分合理）
- [x] 依赖注入是否合理 — **良好**（配置通过构造函数注入，存储可替换）
- [x] 是否有循环依赖 — **未发现**
- [x] 配置是否外部化 — **良好**（使用 zod 验证环境变量，支持运行时配置）

---

## 统计摘要

| 风险等级 | 数量 |
|---------|------|
| 🔴 高危 | 5 |
| 🟡 中危 | 8 |
| 🟢 低危 | 6 |
| 💡 优化建议 | 8 |

**优先修复顺序**: H-001 → H-002 → H-003 → H-004 → H-005 → M-008 → M-001 → M-002

---

*报告生成时间: 2026-06-11T11:36:00Z*
