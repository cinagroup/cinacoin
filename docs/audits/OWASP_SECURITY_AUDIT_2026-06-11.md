# OWASP Top 10 & CWE 安全审计报告

**审计日期**: 2026-06-11
**审计范围**: Cinacoin Monorepo
**技术栈**: React 18, Next.js 15, Node.js 22, Cloudflare Workers, Rust (push-server/keys-server)
**审计方法**: 静态代码分析 + 配置审查 + 依赖审计

---

## 执行摘要

对 Cinacoin Monorepo 进行了基于 OWASP Top 10 分类的全面安全扫描。共发现 **4 个高危**、**7 个中危**、**6 个低危** 漏洞。

**整体安全态势**: 中等偏上。项目在 XSS 防护（DOMPurify）、CORS 白名单、速率限制、认证机制等方面有良好实践。主要风险集中在 `Math.random()` 用于安全敏感场景、CLI 命令注入面、CSRF 配置为空、以及部分 `dangerouslySetInnerHTML` 使用自定义 sanitizer 而非成熟库。

---

## 高危漏洞 🔴

### H1 — Math.random() 用于安全敏感 ID 生成 (CWE-330: 使用不充分随机数)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🔴 高 |
| **CWE** | CWE-330 |
| **OWASP** | A02 - 加密机制失效 |
| **影响文件** | 见下表 |
| **描述** | 多个核心模块使用 `Math.random()` 生成订单 ID、桥接 ID、赞助 ID 等。`Math.random()` 不是密码学安全的 PRNG，生成的值可被预测，可能导致 ID 碰撞或攻击者伪造有效标识符。 |

**受影响文件：**

| 文件 | 行号 | 用途 |
|------|------|------|
| `packages/onramp-sdk/src/widget.ts` | 341 | 订单 ID 生成 |
| `packages/cross-chain-sync/src/messaging.ts` | 89 | 消息 ID 生成 |
| `packages/cross-chain-sync/src/bridge-engine.ts` | 285 | 跨链转账 ID |
| `packages/cross-chain-sync/src/bridge.ts` | 176 | 桥接实例 ID |
| `packages/cross-chain-sync/src/CrossChainMessenger.ts` | 481 | 批量消息 ID |
| `packages/cross-chain-sync/src/BridgeExecutor.ts` | 570 | Hex 标识符 |
| `packages/paymaster/src/VerifyingPaymaster.ts` | 394 | Gas 赞助 ID |
| `packages/monitoring/src/performance.ts` | 251 | 性能追踪 ID |
| `packages/travel-rule/src/ComplianceReport.ts` | 118 | 合规报告 ID |
| `packages/adapters/walletconnect/adapter.ts` | 70 | WC 对称密钥（**最严重**） |
| `packages/cli/src/commands/template.ts` | 894 | 模拟私钥生成 |

**修复建议：**
```typescript
// ❌ 不安全
const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ✅ 安全 — 使用 crypto.getRandomValues (浏览器) 或 crypto.randomBytes (Node)
import { randomBytes } from 'node:crypto';
const id = `order_${Date.now()}_${randomBytes(4).toString('hex')}`;

// ✅ 安全 — Cloudflare Workers 环境
const id = `order_${Date.now()}_${crypto.randomUUID()}`;
```

**优先级**: ⚡ 立即修复 — 特别是 `walletconnect/adapter.ts` 中用于对称密钥的场景。

---

### H2 — CLI 模块存在命令注入风险 (CWE-78: OS 命令注入)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🔴 高 |
| **CWE** | CWE-78 |
| **OWASP** | A03 - 注入 |
| **影响文件** | `packages/cli/src/commands/init.ts:227`, `deploy.ts:138,150,173,185,262`, `doctor.ts:56,148,205` |
| **描述** | CLI 工具使用 `execSync()` 执行包含用户输入的命令，部分命令字符串通过模板字面量拼接，未做输入净化。攻击者可通过恶意项目名或路径注入 shell 命令。 |

**示例：**
```typescript
// packages/cli/src/commands/init.ts:227
execSync(installCmd, { cwd: targetDir, stdio: 'pipe' });

// packages/cli/src/commands/deploy.ts:262
execSync(config.buildCommand, { cwd, stdio: 'pipe' });
// config.buildCommand 来自用户配置文件，可直接注入任意命令
```

**修复建议：**
- 使用 `execFile()` 或 `spawn()` 替代 `execSync()`，避免 shell 解析
- 对所有用户输入进行白名单验证（仅允许 `[a-zA-Z0-9_-]`）
- `config.buildCommand` 应限制为预定义命令列表

---

### H3 — Cinacoin 适配器使用 Math.random() 生成对称密钥

| 属性 | 值 |
|------|-----|
| **风险等级** | 🔴 高 |
| **CWE** | CWE-330, CWE-326 |
| **OWASP** | A02 - 加密机制失效 |
| **影响文件** | `packages/adapters/walletconnect/adapter.ts:70` |
| **描述** | `symKey` 使用 `Math.random().toString(36).slice(2)` 生成，密钥空间极小（约 36^34 ≈ 2^176 理论值，但实际熵远低于此因为 Math.random 是 PRNG）。攻击者可暴力破解会话密钥，拦截 Cinacoin 通信。 |

**代码：**
```typescript
// packages/adapters/walletconnect/adapter.ts:70
this.uri = `wc:${Date.now()}@2?relay-protocol=irn&symKey=${Math.random().toString(36).slice(2)}`;
```

**修复建议：**
```typescript
import { randomBytes } from 'node:crypto';
const symKey = randomBytes(32).toString('hex');
this.uri = `wc:${Date.now()}@2?relay-protocol=irn&symKey=${symKey}`;
```

---

### H4 — StructuredData 组件未对 JSON-LD 输入做转义 (CWE-79: XSS)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🔴 高（取决于数据来源） |
| **CWE** | CWE-79 |
| **OWASP** | A03 - 注入 (XSS) |
| **影响文件** | `apps/website/src/components/StructuredData.tsx:9` |
| **描述** | `JSON.stringify(data)` 直接传入 `dangerouslySetInnerHTML`。如果 `data` 对象中包含用户可控内容（如 UGC 字段），`</script>` 标签可逃逸 script 块导致 XSS。 |

**代码：**
```tsx
// apps/website/src/components/StructuredData.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
/>
```

**修复建议：**
```tsx
// 对 JSON 字符串做 script 标签安全转义
function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}
```

---

## 中危漏洞 🟡

### M1 — CSRF 允许源列表为空 (CWE-352: 跨站请求伪造)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟡 中 |
| **CWE** | CWE-352 |
| **OWASP** | A01 - 访问控制失效 |
| **影响文件** | `packages/cf-utils.ts:21`, `packages/push-server/cloudflare/worker.ts:21`, `packages/keys-server/cloudflare/worker.ts:21` |
| **描述** | `CSRF_ALLOWED_ORIGINS` 被声明为空数组 `[]`，且当列表为空时 `validateCsrf()` 直接返回 `true`，等于完全禁用 CSRF 验证。 |

**代码：**
```typescript
// packages/cf-utils.ts:21
export const CSRF_ALLOWED_ORIGINS: string[] = [];

export function validateCsrf(request: Request): boolean {
  // ...
  if (CSRF_ALLOWED_ORIGINS.length === 0) return true; // ← 永远跳过
  return CSRF_ALLOWED_ORIGINS.includes(origin);
}
```

**修复建议：**
- 从环境变量或配置中加载 CSRF 允许源
- 当列表为空时应返回 `false`（拒绝）而非 `true`（放行）

---

### M2 — Push Server API Key 未配置时跳过认证 (CWE-287: 认证不当)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟡 中 |
| **CWE** | CWE-287 |
| **OWASP** | A07 - 身份验证失败 |
| **影响文件** | `packages/push-server/src/index.ts:92-93`, `packages/push-server/cloudflare/worker.ts:121-122` |
| **描述** | 当 `API_KEY` 环境变量未设置时，认证函数直接返回 `true`。若生产环境意外遗漏配置，所有 API 端点将完全开放。 |

**代码：**
```typescript
const apiKey = env.API_KEY;
if (!apiKey) return true; // skip in dev ← 生产环境也可能触发
```

**修复建议：**
- 生产环境应要求 `API_KEY` 必须存在，否则返回 500 错误
- 添加启动时配置检查

---

### M3 — social-login sanitizeSvg 使用自定义 sanitizer (CWE-79: XSS)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟡 中 |
| **CWE** | CWE-79 |
| **OWASP** | A03 - 注入 (XSS) |
| **影响文件** | `packages/social-login/src/components.tsx:27-648` |
| **描述** | 自定义 `sanitizeSvg()` 函数使用标签/属性白名单过滤 SVG，但自定义 sanitizer 容易遗漏边缘情况（如 `<animate>`、`<set>`、`<foreignObject>`、`xlink:href="javascript:..."` 等）。网站其他位置使用的 DOMPurify 是更成熟的选择。 |

**修复建议：**
- 使用 DOMPurify 的 SVG 支持替代自定义 sanitizer
- 或至少添加对 `<animate>`, `<set>`, `<foreignObject>`, `xlink:href` 的过滤

---

### M4 — innerHTML 直接赋值 (CWE-79: XSS)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟡 中 |
| **CWE** | CWE-79 |
| **OWASP** | A03 - 注入 (XSS) |
| **影响文件** | 见下表 |
| **描述** | 多处代码直接设置 `innerHTML`，虽然部分场景是清空内容（`innerHTML = ""`），但仍有风险点。 |

| 文件 | 行号 | 上下文 |
|------|------|--------|
| `packages/cli/src/commands/init.ts` | 616 | `document.body.innerHTML = \`...` — 模板字面量注入 |
| `packages/core-ui/src/performance/virtual-scroll.ts` | 138 | `content.innerHTML = ''` — 清空，低风险 |
| `packages/core-ui/src/components/qr-code.ts` | 167 | `wrapper.innerHTML = ''` — 清空，低风险 |
| `apps/docs-site/src/pages/api-reference.tsx` | 120 | `container.innerHTML = ''` — 清空，低风险 |

**重点关注**: `packages/cli/src/commands/init.ts:616` — 模板字面量直接写入 innerHTML。

---

### M5 — 速率限制使用内存 Map（分布式环境失效）(CWE-770: 资源不受限分配)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟡 中 |
| **CWE** | CWE-770 |
| **OWASP** | A04 - 不安全设计 |
| **影响文件** | `packages/push-server/cloudflare/worker.ts:38`, `packages/keys-server/cloudflare/worker.ts:38` |
| **描述** | 速率限制使用 `Map<string, RateEntry>()` 在内存中存储。在 Cloudflare Workers 的隔离模型中，每次请求可能在不同 isolate 执行，内存 Map 无法跨请求共享，导致速率限制实际上无效。 |

**修复建议：**
- 使用 Cloudflare KV 或 Durable Objects 实现分布式速率限制
- 代码中已有 `RATE_LIMITS: KVNamespace` 环境变量，应利用它

---

### M6 — 硬编码测试密钥出现在源码中 (CWE-798: 硬编码凭证)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟡 中 |
| **CWE** | CWE-798 |
| **OWASP** | A07 - 身份验证失败 |
| **影响文件** | `packages/cross-chain-sync/tests/AtomicSwap.test.ts:40`, `packages/social-login/src/__tests__/token-verifier.test.ts:12` |
| **描述** | 测试文件中使用硬编码密钥 `"abc123"` 和 `'test'`。虽然仅用于测试，但若测试代码被意外部署到生产环境，将导致认证绕过。 |

**修复建议：**
- 使用环境变量或测试配置工厂统一管理测试密钥
- 添加 CI 检查确保测试密钥不出现在生产构建中

---

### M7 — CLI 模板命令使用 Math.random() 生成密钥材料 (CWE-330)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟡 中 |
| **CWE** | CWE-330 |
| **OWASP** | A02 - 加密机制失效 |
| **影响文件** | `packages/cli/src/commands/template.ts:894`, `packages/cli/src/commands/dev.ts:110,117` |
| **描述** | CLI 模板和开发命令使用 `Math.random()` 生成看似私钥的 hex 字符串。虽然标注为模拟，但用户可能误将其用于生产。 |

---

## 低危漏洞 🟢

### L1 — .env.production 文件提交到仓库

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟢 低 |
| **CWE** | CWE-200 |
| **OWASP** | A05 - 安全配置错误 |
| **影响文件** | `apps/health-status/.env.production`, `apps/website/.env.production`, 等 6 个文件 |
| **描述** | `.env.production` 文件包含生产环境 URL 配置。当前仅含 `NEXT_PUBLIC_*` 公开变量，无敏感密钥，但模式不安全——未来可能意外添加密钥。 |

**修复建议：**
- 确认 `.gitignore` 排除 `.env.production` 或确保仅含公开变量
- 添加 pre-commit hook 扫描 `.env` 文件中的 `SECRET/KEY/PASSWORD` 模式

---

### L2 — CORS 回退到第一个白名单源

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟢 低 |
| **CWE** | CWE-942 |
| **OWASP** | A05 - 安全配置错误 |
| **影响文件** | `packages/push-server/cloudflare/worker.ts:107`, `packages/keys-server/cloudflare/worker.ts:523` |
| **描述** | 当请求来源不在白名单中时，CORS 头回退到 `ALLOWED_ORIGINS[0]` 而非省略。这意味着非授权来源的响应仍带有 `Access-Control-Allow-Origin` 头（虽然是固定值）。 |

---

### L3 — 开发环境调试日志在生产中可能泄露信息

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟢 低 |
| **CWE** | CWE-209 |
| **OWASP** | A09 - 安全日志和监控失败 |
| **影响文件** | `apps/analytics-dashboard/src/lib/monitoring.ts`, `packages/monitoring/src/performance.ts:259` |
| **描述** | 部分监控代码在 `NODE_ENV === 'development'` 时输出详细日志。若环境变量配置错误，可能泄露内部状态。 |

---

### L4 — 服务端 fetch 调用缺少 URL 验证 (CWE-918: SSRF)

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟢 低（当前风险） |
| **CWE** | CWE-918 |
| **OWASP** | A10 - SSRF |
| **影响文件** | `packages/blockchain-api/src/client.ts:244,260,679,796`, `packages/adapter-cosmos/src/CosmosAdapter.ts:629,661,1221` |
| **描述** | 区块链适配器使用配置的 RPC URL 发起服务端请求。当前 URL 来自配置而非用户输入，风险较低。但如果未来允许用户自定义 RPC 端点，需添加 URL 验证（禁止内网 IP、`file://` 协议等）。 |

---

### L5 — 无审计日志集中实现

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟢 低 |
| **CWE** | CWE-778 |
| **OWASP** | A09 - 安全日志和监控失败 |
| **描述** | 未发现集中式安全审计日志框架。关键安全事件（认证失败、权限拒绝、敏感操作）应有结构化审计日志。 |

---

### L6 — pnpm audit CI 管道使用 `|| true` 忽略失败

| 属性 | 值 |
|------|-----|
| **风险等级** | 🟢 低 |
| **CWE** | CWE-1104 |
| **OWASP** | A06 - 自带缺陷和过时的组件 |
| **影响文件** | `.github/workflows/build.yaml:442`, `.github/workflows/quality.yaml:244` |
| **描述** | CI 中 `pnpm audit --audit-level=moderate || true` 意味着即使发现中等以上漏洞也会通过构建。 |

**修复建议：**
- 将 `|| true` 改为仅在 `security-scan.yml` 中收集结果，在 `build.yaml` 中应阻断构建

---

## 安全亮点 ✅

以下方面做得较好：

1. **XSS 防护**: 网站内容页统一使用 DOMPurify (`isomorphic-dompurify`) 进行 HTML 净化，白名单配置合理
2. **CORS 白名单**: 服务端 CORS 使用明确的域名白名单，不使用 `*`
3. **速率限制**: 实现了 per-device/per-IP 速率限制（虽然内存存储有问题）
4. **安全响应头**: 包含 `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
5. **常量时间比较**: API Key 验证使用 `constantTimeCompare` 防止时序攻击
6. **密钥管理**: APNS 私钥等通过环境变量管理，未硬编码在源码中
7. **无 eval()**: 未发现 `eval()`, `new Function()` 等危险代码执行
8. **无 SQL 注入**: 未发现 SQL 字符串拼接模式
9. **CI 安全扫描**: 已有 `security-scan.yml` 工作流运行 `pnpm audit`

---

## 修复优先级

| 优先级 | 编号 | 描述 | 建议时限 |
|--------|------|------|----------|
| **P0** | H3 | Cinacoin symKey 使用 Math.random() | 立即 |
| **P0** | H1 | Math.random() 用于安全敏感 ID（全量修复） | 24h |
| **P1** | H2 | CLI 命令注入风险 | 1 周 |
| **P1** | H4 | StructuredData XSS 转义 | 1 周 |
| **P1** | M1 | CSRF 配置为空 | 1 周 |
| **P2** | M2 | API Key 未配置时跳过认证 | 2 周 |
| **P2** | M3 | 自定义 SVG sanitizer 替换为 DOMPurify | 2 周 |
| **P2** | M5 | 速率限制改用 KV/Durable Objects | 2 周 |
| **P3** | M4, M6, M7 | innerHTML / 测试密钥 / CLI 模板 | 1 月 |
| **P3** | L1-L6 | 低危项 | 1 月 |

---

## 附录：扫描统计

| 检查项 | 结果数 | 需关注 |
|--------|--------|--------|
| dangerouslySetInnerHTML | 18 处（源码） | 2 处（StructuredData, sanitizeSvg） |
| innerHTML 赋值 | 9 处 | 1 处（CLI 模板注入） |
| eval() / Function() | 0 | ✅ |
| 硬编码密码/密钥 | 4 处 | 均为测试代码 |
| 硬编码 API Key | 0 | ✅ |
| SQL 注入模式 | 0 | ✅ |
| Math.random() 安全用途 | 11 处 | 🔴 需全量替换 |
| execSync/spawn | 20+ 处 | CLI 工具中需审查 |
| 弱加密算法 (MD5/SHA1/DES) | 0 | ✅ |
| CORS 配置 | 5 个服务 | 白名单模式正确 |
| .env.production | 6 个文件 | 仅含公开变量 |
| 速率限制 | 2 个服务 | 内存存储需改进 |

---

*报告生成时间: 2026-06-11T11:36:00Z*
*审计工具: 静态代码分析 (grep/rg)*
*审计人: OpenClaw Security Subagent*
