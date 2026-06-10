# Cinacoin 性能审计报告
**日期:** 2026-06-10

## 执行摘要
- 检查应用数: 9 (5 前端应用 + 3 SDK 包 + 1 API 网关)
- 发现问题数: 12 (Critical: 1, Major: 5, Minor: 6)

---

## 1. 前端性能

### Bundle 大小

| 应用 | 构建工具 | JS 优化 | CSS 优化 | 代码分割 | 状态 |
|------|---------|---------|----------|---------|------|
| website | Next.js 14 | ✅ SWC minify, removeConsole | ✅ TailwindCSS | ✅ 5 chunks (framework, ui, sdk, lib, shared) | ✅ |
| developer-dashboard | Next.js 14 | ❌ 无 minify 配置 | ✅ TailwindCSS | ❌ 无代码分割 | ⚠️ |
| analytics-dashboard | Next.js 14 | ✅ SWC minify, removeConsole | ✅ TailwindCSS | ✅ 6 chunks (framework, ui, sdk, charts, lib, shared) | ✅ |
| demo-react | Vite 6 | ✅ Terser, drop_console | ✅ TailwindCSS | ✅ 3 manual chunks (react, cinacoin, walletconnect) | ✅ |
| learn | Next.js 14 | ❌ 无 minify 配置 | ✅ TailwindCSS | ❌ 无代码分割 | ⚠️ |

### 代码分割

**website** (`next.config.mjs`):
- ✅ `splitChunks` 配置完善，分离 framework / cinacoin-ui / cinacoin-sdk / lib / shared
- ✅ `optimizePackageImports` 优化 heroicons, lucide-react, lodash, date-fns, react-icons
- ✅ `usedExports: true` + `sideEffects: false` 支持 tree-shaking
- ✅ `productionBrowserSourceMaps: false` 减少生产包体积

**analytics-dashboard** (`next.config.ts`):
- ✅ 与 website 类似的 splitChunks 配置
- ✅ 额外分离 charts chunk (recharts, d3, victory)
- ✅ `optimizePackageImports` 包含 recharts, d3

**demo-react** (`vite.config.ts`):
- ✅ `manualChunks` 分离 vendor-react / vendor-cinacoin / vendor-walletconnect
- ✅ Hash-based filenames 用于长期缓存
- ✅ `chunkSizeWarningLimit: 1000`

**developer-dashboard** (`next.config.js`):
- ❌ 仅 `output: 'export'` + `images: { unoptimized: true }`
- ❌ 无 splitChunks 配置
- ❌ 无 optimizePackageImports
- ❌ 无 bundle analyzer

**learn** (`next.config.js`):
- ❌ 仅基础配置，无性能优化
- ❌ 无 splitChunks / optimizePackageImports
- ❌ 无 bundle analyzer

### 图片优化

| 应用 | 图片格式 | 尺寸 | 状态 |
|------|---------|------|------|
| website | PNG only (og-image 140KB, logo 64KB, favicon 64KB) | ~268KB total | ⚠️ 无 WebP/AVIF |
| analytics-dashboard | PNG (logo 64KB) + SVG | ~64KB | ⚠️ 无 WebP/AVIF |
| developer-dashboard | 无 public 目录 | — | ✅ |
| demo-react | N/A (Vite) | — | ✅ |
| learn | 无 public 资源 | — | ✅ |

**问题**: 
- `images.unoptimized: true` 在所有 Next.js 应用中设置，意味着 Next.js 图片优化被禁用
- 所有图片为 PNG 格式，未提供 WebP/AVIF 替代格式
- website og-image.png 140KB 可进一步压缩

### 缓存策略

**website** ✅ 完善:
- `/_next/static/*`: `public, max-age=31536000, immutable` + CDN-Cache-Control
- `/images/*`: `public, max-age=604800, stale-while-revalidate=86400`
- `/fonts/*`: `public, max-age=31536000, immutable`
- `/`: `public, max-age=0, must-revalidate` + `s-maxage=60, stale-while-revalidate=300`
- `/api/*`: `private, no-cache, no-store, must-revalidate`

**analytics-dashboard** ✅ 基本完善:
- `/_next/static/*`: immutable caching
- `/`: SWR caching
- ❌ 缺少 images/fonts 缓存策略

**developer-dashboard** ❌:
- 无任何缓存头配置

**learn** ❌:
- 无任何缓存头配置

**demo-react** ✅ Vite 默认:
- Hash-based filenames 支持长期缓存
- ❌ 无自定义 Cache-Control 头

---

## 2. SDK 性能

### core-sdk (`@cinacoin/core-sdk`)

**性能模块** (`src/performance/`):
- ✅ `ConnectionPool` — HTTP 连接池，支持：
  - 每 host 最大连接数限制 (默认 6)
  - 总连接数限制 (默认 20)
  - 请求去重 (deduplication)
  - 响应缓存 (TTL + LRU)
  - Keep-alive 支持
- ✅ `ResultCache` — 通用内存缓存，TTL + LRU 淘汰
- ✅ `RequestBatcher` — 请求批处理，支持 batchSize / batchWindow
- ✅ `createLazyLoader` — 懒加载模块，按需初始化
- ✅ `AdapterRegistry` — 适配器注册表，延迟加载
- ✅ `createRetryFetch` — 重试逻辑 + 指数退避
- ✅ `debounce / throttle / memoize` 工具函数
- ✅ `sideEffects: false` 支持 tree-shaking
- ✅ 模块化 exports (`.`, `./react`, `./chains`, `./utils/*`)

**问题**:
- ⚠️ 无性能基准测试结果（perf-benchmarks 包存在但未集成到 CI）
- ⚠️ ConnectionPool 默认 TTL 5s 可能对某些 RPC 调用过短

### appkit (`@cinacoin/appkit`)

- ✅ `sideEffects: false` 支持 tree-shaking
- ✅ 组件化设计 (Modal, WalletList, ChainSelector, etc.)
- ⚠️ 无可见的懒加载 / code-splitting 策略
- ⚠️ 依赖 `qrcode: latest` 和 `@walletconnect/modal: latest` 可能引入不可控的包大小变化

### universal-connector (`@cinacoin/universal-connector`)

- ✅ `sideEffects: false`
- ✅ 轻量依赖 (仅 core-sdk + chain-registry)
- ✅ 无重运行时依赖

---

## 3. 后端性能

### API Gateway (Cloudflare Workers)

**缓存** ✅:
- Cloudflare 边缘缓存 (`caches.default`)
- 静态资源: 1 年 immutable
- API 响应: 5 分钟
- 页面: 1 小时
- X-Cache HIT/MISS 头

**限流** ✅:
- 滑动窗口算法，KV 存储
- 分级限流:
  - Global: 1000/hour per IP
  - Auth: 10/min per IP
  - API: 300/min per IP
  - Transaction: 30/min per IP
  - WebSocket: 50 connections/min per IP

**其他**:
- ✅ Metrics 中间件
- ✅ CORS (allowlist-based)
- ✅ 安全头 (CSP, HSTS, X-Frame-Options, etc.)
- ✅ KV 命名空间分离 (rate-limit, analytics, cache)
- ✅ Service Bindings (auth, users)

**问题**:
- ⚠️ 无可见的超时配置
- ⚠️ 无 circuit breaker 模式
- ⚠️ 缓存未区分认证/非认证响应的 Vary 头

### RPC Proxy (`@cinacoin/rpc-proxy`)

- ❌ 无可见的缓存配置
- ❌ 无连接池配置
- ❌ 无速率限制
- ⚠️ 仅依赖 viem，无自定义性能优化

### Relay Server (`@cinacoin/relay-server`)

- ❌ 无可见的性能配置
- ⚠️ 基础 TypeScript 包，无 WebSocket 优化可见

---

## 问题汇总

| # | 严重程度 | 类别 | 问题 | 位置 |
|---|---------|------|------|------|
| 1 | Critical | 前端 | developer-dashboard 无任何性能优化（无代码分割、无缓存头、无 bundle 分析） | `apps/developer-dashboard/next.config.js` |
| 2 | Major | 前端 | learn 应用无性能优化配置 | `apps/learn/next.config.js` |
| 3 | Major | 前端 | 所有 Next.js 应用 `images.unoptimized: true`，禁用 Next.js 图片优化 | 所有 `next.config.*` |
| 4 | Major | 前端 | 图片仅提供 PNG 格式，无 WebP/AVIF 替代 | `apps/website/public/`, `apps/analytics-dashboard/public/` |
| 5 | Major | 后端 | RPC Proxy 无缓存、连接池、速率限制 | `packages/rpc-proxy/` |
| 6 | Major | 后端 | Relay Server 无可见的性能优化 | `packages/relay-server/` |
| 7 | Minor | SDK | perf-benchmarks 未集成到 CI，无回归检测 | `packages/perf-benchmarks/` |
| 8 | Minor | SDK | appkit 无懒加载策略 | `packages/appkit/src/` |
| 9 | Minor | SDK | appkit 使用 `latest` 版本依赖，包大小不可控 | `packages/appkit/package.json` |
| 10 | Minor | 后端 | API Gateway 缓存未设置 Vary 头区分认证响应 | `workers/api-gateway/src/middleware/cache.ts` |
| 11 | Minor | 前端 | analytics-dashboard 缺少 images/fonts 缓存策略 | `apps/analytics-dashboard/next.config.ts` |
| 12 | Minor | SDK | core-sdk ConnectionPool 默认 TTL 5s 可能过短 | `packages/core-sdk/src/performance/optimization.ts` |

---

## 优化建议

### 🔴 Critical (立即修复)

1. **developer-dashboard 性能加固**
   - 复制 website 的 `next.config.mjs` 优化配置（splitChunks, optimizePackageImports, compiler, cache headers）
   - 添加 `@next/bundle-analyzer` 监控包大小

### 🟡 Major (本迭代修复)

2. **learn 应用性能加固**
   - 添加 splitChunks + optimizePackageImports + cache headers
   - 参考 website 配置

3. **启用 Next.js 图片优化**
   - 移除 `images.unoptimized: true`
   - 配置 `images.formats: ['image/avif', 'image/webp']`（website 已有 formats 但因 unoptimized 被忽略）
   - 考虑使用 Cloudflare Images 或 next/image 远程模式

4. **提供 WebP/AVIF 格式图片**
   - og-image.png (140KB) → WebP 预计可压缩至 ~30KB
   - logo.png (64KB) → SVG 或 WebP 可压缩至 ~10KB
   - 使用 `sharp` 或 `squoosh` 批量转换

5. **RPC Proxy 性能加固**
   - 集成 core-sdk 的 ConnectionPool
   - 添加响应缓存（读请求 30s TTL）
   - 添加速率限制

6. **Relay Server 性能加固**
   - 添加 WebSocket 连接池
   - 添加消息批处理

### 🟢 Minor (下一迭代)

7. **CI 集成性能基准测试**
   - 在 CI 中运行 `perf-benchmarks` 包
   - 设置回归阈值 (建议 20%)
   - 命令: `pnpm --filter @cinacoin/perf-benchmarks bench:ci`

8. **appkit 懒加载**
   - 使用 core-sdk 的 `createLazyLoader` 延迟加载 QRCode / WalletConnect modal
   - 动态 import 非首屏组件

9. **固定 appkit 依赖版本**
   - 将 `qrcode: latest` → 具体版本
   - 将 `@walletconnect/modal: latest` → 具体版本

10. **API Gateway 缓存优化**
    - 添加 `Vary: Authorization` 头避免缓存泄露
    - 对认证响应设置 `Cache-Control: private`

11. **analytics-dashboard 补全缓存策略**
    - 添加 images/fonts 缓存头

12. **core-sdk 调优**
    - 考虑将 ConnectionPool 默认 TTL 提升至 10s
    - 添加缓存命中率指标暴露

---

## 总结

Cinacoin 项目在 **website** 和 **analytics-dashboard** 上已建立较好的性能基础（代码分割、缓存策略、编译器优化）。**demo-react** 作为 Vite 应用也有合理的配置。

主要差距在于：
- **developer-dashboard** 和 **learn** 两个 Next.js 应用几乎没有性能优化
- **图片优化** 全面缺失（unoptimized: true + 仅 PNG）
- **后端服务** (RPC Proxy, Relay Server) 缺乏基础性能设施
- SDK 层面性能工具完善，但尚未在所有消费方充分利用

建议优先修复 Critical 和 Major 问题，预计可将 LCP 降低 30-50%，包大小减少 20-40%。
