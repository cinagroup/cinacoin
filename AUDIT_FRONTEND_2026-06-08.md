# 前端应用审计报告

**审计日期:** 2026-06-08
**审计范围:** apps/website, apps/demo, apps/demo-react, apps/demo-vue, apps/demo-dapp-react, apps/wallet-explorer, apps/analytics-dashboard, apps/health-status, apps/docs-site, apps/backend-dashboard, apps/cloud-dashboard

---

## 严重问题 (Critical)

### [F-001] 认证 Session 存储在 localStorage，XSS 可直接窃取
- **文件:** `apps/demo/src/lib/authSession.ts` (L50, L73)
- **描述:** SIWE 签名（signature）、消息原文（message）、nonce 等完整认证凭据以明文 JSON 存储在 `localStorage['cinacoin_auth_session']`。任何 XSS 漏洞（包括第三方脚本）都能直接读取这些凭据，冒充用户身份。项目已有 `secureAuthSession.ts` 使用内存存储方案，但 `passkey.ts` 等核心模块仍然 import 的是不安全的 `authSession.ts`。
- **风险:** 攻击者通过 XSS 窃取签名和 nonce，可完全绕过 SIWE 认证，伪造用户身份。
- **修复建议:** 全面切换到 `secureAuthSession.ts`（内存存储 + httpOnly cookie SSR 方案）。删除或弃用 `authSession.ts`。

### [F-002] 硬编码 fallback API Key 暴露在生产代码中
- **文件:** `apps/demo/src/app/onramp/page.tsx` (L154)
- **描述:** `process.env.NEXT_PUBLIC_MOONPAY_API_KEY || 'pk_test_demo_key'` — 当环境变量未设置时，硬编码的测试 key 会被打包进客户端 JS bundle。
- **风险:** 攻击者可提取该 key 并滥用 MoonPay API 配额。
- **修复建议:** 移除硬编码 fallback，环境变量缺失时显示错误提示。Server-side 代理 on-ramp widget URL 构建。

### [F-003] iframe 嵌入第三方 Widget 无 sandbox 属性
- **文件:** `apps/demo/src/app/onramp/page.tsx` (L517)
- **描述:** MoonPay iframe 嵌入了完整权限但**完全没有 `sandbox` 属性**。
- **风险:** 若第三方 widget 被入侵（supply chain attack），可直接访问父页面 DOM、cookie、localStorage 中的所有敏感数据。
- **修复建议:** 添加 `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` 限制 iframe 能力。

---

## 高危问题 (High)

### [F-004] 绝大多数应用缺少安全 HTTP 响应头（CSP/HSTS 等）
- **文件:** 所有 Next.js 应用的 next.config 文件（仅 backend-dashboard 有配置）
- **描述:** 仅 `backend-dashboard` 配置了 CSP、HSTS、X-Frame-Options 等安全头。其他所有 Next.js 应用均无任何安全响应头配置。
- **风险:** 无 CSP 时，任何 XSS 漏洞都可执行任意 JS；无 HSTS 可被中间人攻击降级为 HTTP。
- **修复建议:** 为所有应用统一配置安全头，建议抽取为共享的 `@cinacoin/security-headers` 包。

### [F-005] SIWE 签名验证仅在客户端执行
- **文件:** `apps/demo/src/lib/siwe.ts` (L118-L158)
- **描述:** `verifySiweSignature()` 仅检查消息中的地址匹配。**没有执行密码学签名恢复**（ecrecover）。参数 `_signature` 未使用。
- **风险:** 攻击者可构造任意消息和地址，绕过客户端验证，伪造认证。
- **修复建议:** 将签名验证移至服务端 API route，使用 `ethers.verifyMessage()` 进行密码学恢复。

### [F-006] 钱包地址和余额存储在 localStorage
- **文件:** `apps/demo/src/lib/useWallet.ts` (L208, L219, L278)
- **描述:** 连接钱包后，地址、余额、chainId 存储在 `localStorage['cinacoin_wallet']`。页面加载时自动恢复连接状态，但**未验证用户是否仍拥有该地址的控制权**。
- **风险:** 若配合 XSS，攻击者可看到用户地址并模拟交易界面。
- **修复建议:** localStorage 中仅存储 UI 偏好，不存储连接状态。每次页面加载需重新通过 `eth_requestAccounts` 验证。

### [F-007] Passkey 凭据公钥存储在 localStorage
- **文件:** `apps/demo/src/lib/passkey.ts` (L112, L129, L494)
- **描述:** WebAuthn 凭据 ID 和公钥以 JSON 存储在 `localStorage['cinacoin_passkey_credentials']`。
- **风险:** 攻击者可枚举用户的 passkey 凭据 ID，用于社工攻击或针对性钓鱼。
- **修复建议:** 凭据元数据仅存储在内存中或 httpOnly cookie 中。

### [F-008] Contact Form API 无速率限制和 CSRF 防护
- **文件:** `apps/website/src/app/api/contact/route.ts` (L4-L38)
- **描述:** 联系表单 API 仅有基本字段验证。无 CSRF token 验证、无速率限制、无 CAPTCHA。
- **风险:** 可被用于垃圾邮件轰炸、资源耗尽攻击。
- **修复建议:** 添加 hCaptcha/turnstile、服务端速率限制、CSRF token 验证。

### [F-009] Cloud Dashboard API 请求无认证
- **文件:** `apps/cloud-dashboard/src/lib/api.ts` (L33-L55)
- **描述:** `fetchApi()` 仅通过 URL query param 传递 `ownerId`（从 localStorage 读取），无 Authorization header、无 token、无签名。
- **风险:** 任何人知道 `ownerId` 即可访问、修改、删除其项目，包括 API key 管理。
- **修复建议:** 使用认证 token（JWT/httpOnly cookie）进行 API 鉴权。

### [F-010] ownerId 存储在 localStorage 用于 API 鉴权
- **文件:** `apps/cloud-dashboard/src/app/page.tsx`, `projects/[id]/page.tsx`, `projects/page.tsx`
- **描述:** `localStorage.getItem("cinacoin_owner_id")` 被用作 API 请求的身份标识。该值可被任意 JS 读取和修改。
- **风险:** 用户可修改 localStorage 中的 ownerId 冒充其他用户。
- **修复建议:** 使用 httpOnly cookie 或 JWT token 进行身份验证。

---

## 中等问题 (Medium)

### [F-011] dangerouslySetInnerHTML 用于渲染 i18n 翻译内容
- **文件:** `apps/website/` 下多个页面（共 17 处）
- **描述:** 大量使用 `dangerouslySetInnerHTML={{ __html: t(contentId) }}` 渲染翻译内容。如果未来翻译来源改为 CMS 或 API，则引入存储型 XSS。
- **风险:** 若翻译内容被篡改，可注入恶意脚本。
- **修复建议:** 使用 DOMPurify 对 HTML 内容进行消毒。

### [F-012] Analytics Dashboard API 无认证和输入验证不足
- **文件:** `apps/analytics-dashboard/src/app/api/analytics/query/route.ts` (L12-L27)
- **描述:** POST `/api/analytics/query` 接受任意 JSON body 并传入 `AnalyticsEngine.query()`。无认证检查。
- **风险:** 未授权用户可查询分析数据；恶意构造的查询可能导致性能问题。
- **修复建议:** 添加 API 认证；对 `timeRange` 范围设置上限。

### [F-013] 多处 setInterval/setTimeout 清理不完整
- **文件:** `apps/demo/src/app/multi-chain/page.tsx` L303, L538, L554; `apps/demo/src/app/batch/page.tsx` L167
- **描述:** 部分定时器在组件快速卸载/重挂载时可能产生竞态。
- **风险:** 内存泄漏、状态更新已卸载组件、不必要的网络请求。
- **修复建议:** 使用 `useRef` 统一追踪所有定时器；考虑使用 `AbortController` 取消进行中的 fetch。

### [F-014] 自定义 RPC Endpoint 输入无验证
- **文件:** `apps/demo/src/app/settings/page.tsx` (L305-L318)
- **描述:** 用户可输入任意 URL 作为自定义 RPC endpoint，无 URL 格式验证、无协议检查。
- **风险:** 若未来集成到实际 RPC 调用中，恶意 URL 可导致 SSRF 或数据泄露。
- **修复建议:** 验证 URL 格式，仅允许 `https://` 协议。

---

## 低危问题 (Low)

### [F-015] 外部链接部分缺少 rel="noopener noreferrer"
- 多处 `target="_blank"` 链接缺少安全属性。

### [F-016] Vite 开发服务器配置 open: true
- `apps/demo-vue/vite.config.ts` — CI/CD 环境中可能导致进程挂起。

### [F-017] window.ethereum 类型声明使用 any
- `apps/demo-react/src/contexts/WalletContext.tsx` — 使用 `any` 削弱类型安全。

### [F-018] 部分页面缺少 aria-label 和语义化标签
- `apps/analytics-dashboard`, `apps/wallet-explorer` — 不符合 WCAG 2.1 AA 标准。

### [F-019] SEO: 部分应用缺少 metadata 配置
- Demo 应用和 Vite 应用缺少 Open Graph 图片、Twitter Card 等。

### [F-020] 响应式: 部分页面在小屏幕上水平溢出
- `apps/demo/src/app/settings/page.tsx`, `apps/demo/src/app/components/page.tsx`

### [F-021] Flutter Demo 缺少网络安全配置
- `apps/demo-flutter/` — 未配置 Android Network Security Config。

---

## 正面发现

- ✅ `backend-dashboard` 有完善的安全头配置（CSP、HSTS、X-Frame-Options）
- ✅ 大部分应用使用 TypeScript 严格模式
- ✅ SIWE 实现遵循标准流程
- ✅ Passkey/WebAuthn 实现使用标准 API
- ✅ Website 已有 skip navigation 链接

## 总结

| 级别 | 数量 |
|------|------|
| Critical | 3 |
| High | 7 |
| Medium | 4 |
| Low | 7 |

### 优先修复顺序

1. **立即:** 切换认证 Session 到安全存储 (F-001)
2. **立即:** 移除硬编码 API Key (F-002)
3. **本周:** 为所有应用添加安全响应头 (F-004)
4. **本周:** 将 SIWE 验证移至服务端 (F-005)
5. **本周:** 修复 Cloud Dashboard API 认证 (F-009, F-010)
6. **Sprint 内:** 添加 iframe sandbox (F-003)、修复 Contact Form (F-008)
