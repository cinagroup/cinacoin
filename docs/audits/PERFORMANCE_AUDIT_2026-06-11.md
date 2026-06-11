# 性能问题审计报告

**审计日期**: 2026-06-11
**审计范围**: Cinacoin Monorepo 前端应用 + 后端服务 + 共享包
**审计人**: 000 (AI Assistant)

---

## 执行摘要

本次审计覆盖 20 个前端应用（apps/）和 101 个共享包（packages/）。主要发现：

- **构建产物体积过大**：多个 Next.js 应用 .next 目录超过 100MB，单个 JS chunk 最大达 857KB
- **无现代图片格式**：全项目未使用 WebP/AVIF，全部为 PNG
- **无虚拟滚动**：列表组件未使用虚拟化库，大数据集场景存在性能隐患
- **无浏览器 Web Worker**：计算密集型任务未做线程分离
- **缓存策略缺失**：前端无 SWR/React Query 等数据缓存方案
- **内存泄漏防护良好**：setInterval/setTimeout 基本都有对应的清理逻辑

---

## 1. Bundle 大小 🔴

### 构建产物总览

| 应用 | .next/dist 大小 | 状态 |
|------|----------------|------|
| apps/website | 289 MB | 🔴 严重 |
| apps/unified-dashboard | 127 MB | 🔴 严重 |
| apps/demo | 111 MB | 🔴 严重 |
| apps/analytics-dashboard | 106 MB | 🔴 严重 |
| apps/backend-dashboard | 104 MB | 🔴 严重 |
| apps/cloud-dashboard | 66 MB | 🟡 偏高 |
| apps/wallet-explorer | 57 MB | 🟡 偏高 |
| apps/health-status | 40 MB | 🟡 偏高 |
| apps/developer-dashboard | 35 MB | 🟡 偏高 |
| apps/learn | 31 MB | 🟡 偏高 |
| apps/farcaster-app | 30 MB | 🟡 偏高 |
| apps/demo-react | 2.6 MB (dist) | 🟢 正常 |

### 超大 JS Chunk（>100KB）

| 文件 | 大小 | 所属应用 |
|------|------|----------|
| lib-630c4292ab07e03d.js | **857 KB** | analytics-dashboard |
| lib-0c1b1ab664ca3017.js | **828 KB** | unified-dashboard |
| framework-bef83a85c94ff7de.js | 137 KB | 多个应用（共享） |
| 151-e9250639c66adec8.js | 121 KB | website |
| main-80f23741f06c0070.js | 115 KB | website |
| polyfills-42372ed130431b0a.js | 110 KB | 多个应用（共享） |

### 代码分割情况

- ✅ **demo-dapp-react**：使用 `React.lazy()` + `dynamic import` 分割 8 个组件
- ✅ **demo-react**：使用 `lazy()` 分割 10 个页面路由
- ✅ **analytics-dashboard**：使用 `next/dynamic` 分割 8 个图表组件
- ⚠️ **website / unified-dashboard**：虽有 Next.js 自动分割，但 lib chunk 过大说明依赖未充分拆分

### 问题清单

- [x] 是否有超大 bundle（>500KB）→ **是，2 个 lib chunk 超过 800KB**
- [x] 是否使用代码分割 → **部分应用使用，但核心 dashboard 应用分割不足**
- [ ] 是否有未 tree-shake 的依赖 → **疑似存在，lib chunk 过大暗示 tree-shaking 不充分**
- [x] 是否使用动态导入 → **demo 类应用使用良好，dashboard 类应用不足**

---

## 2. 渲染性能 🟡

### React 优化使用情况

- 183 个文件使用了 `useMemo` / `useCallback` / `React.memo`
- 278 处 memoization 调用
- 覆盖率中等，但核心 dashboard 组件需进一步审查

### 虚拟滚动

- ❌ **未发现任何虚拟滚动库**（react-window / react-virtual / react-virtuoso 均未使用）
- 影响：交易列表、NFT 画廊、代币列表等大数据集场景可能导致 DOM 节点过多

### Web Worker

- ❌ **无浏览器 Web Worker 使用**
- 注：代码中的 "Worker" 引用均为 Cloudflare Workers（服务端），非浏览器端 Web Worker
- 影响：加密计算、大数据排序等操作阻塞主线程

### 长任务阻塞

- ⚠️ 未使用 `requestIdleCallback` 或 `requestAnimationFrame` 做任务调度
- ✅ 存在 `debounce` / `throttle` 工具（packages/performance-utils）

### 问题清单

- [ ] 是否有不必要的重渲染 → **需 profiling 确认，memoization 覆盖率中等**
- [ ] 列表是否使用虚拟滚动 → **未使用，存在风险**
- [ ] 是否有长任务阻塞主线程 → **加密/计算操作可能阻塞**
- [ ] 是否使用 Web Worker → **未使用**

---

## 3. 网络性能 🟡

### API 缓存策略

| 应用 | 缓存方式 | 状态 |
|------|----------|------|
| developer-dashboard | GET 请求去重（pendingRequests Map） | 🟢 有基础去重 |
| backend-dashboard | `cache: "no-store"` | 🟡 无缓存 |
| health-status | `cache: "no-store"` / Cloudflare cacheTtl | 🟢 边缘缓存 |
| demo-react | Provider 级缓存（cachedProvider） | 🟢 单例缓存 |
| 其他应用 | 无明确缓存策略 | 🔴 缺失 |

### 请求合并

- ✅ developer-dashboard 有 GET 请求去重机制
- ❌ 未发现批量请求合并（batch request）模式

### HTTP/2

- ✅ Cloudflare 部署自动支持 HTTP/2
- ✅ Vite 构建配置中有 compression 相关设置

### 静态资源压缩

- ✅ Next.js 自动进行 JS 压缩
- ✅ Cloudflare 提供边缘 gzip/brotli
- ⚠️ 未发现应用层自定义压缩策略

### 问题清单

- [x] API 请求是否有缓存 → **大部分应用无缓存策略**
- [ ] 是否有请求合并 → **仅 developer-dashboard 有去重**
- [x] 是否使用 HTTP/2 → **Cloudflare 自动支持**
- [x] 静态资源是否压缩 → **通过 Cloudflare 和构建工具压缩**

---

## 4. 资源使用 🟡

### 图片优化

| 类型 | 数量 | 状态 |
|------|------|------|
| PNG 文件 | 15+ | 🔴 未优化 |
| WebP 文件 | 0 | 🔴 缺失 |
| AVIF 文件 | 0 | 🔴 缺失 |
| 大图片（>100KB） | 1（og-image.png 138KB） | 🟡 可优化 |

- 所有 logo.png 均为 64KB，可转换为 WebP 减少 30-50% 体积
- og-image.png 138KB，建议转换为 WebP 或 AVIF

### 字体优化

- ✅ 使用 Geist 字体，`font-display: swap` 避免 FOIT
- ✅ woff2 格式（现代高效格式）
- ⚠️ 未进行字体子集化（subset），加载了完整字符集
- 字体文件：Geist-Regular, Geist-Medium, Geist-SemiBold, GeistMono-Regular

### 内存泄漏检查

**事件监听器清理情况：**

| 组件 | addEventListener | removeEventListener | 状态 |
|------|-----------------|---------------------|------|
| OnRampWidget | 3 处 | 3 处 | ✅ 完整 |
| widget.ts | 2 处 | 2 处 | ✅ 完整 |
| adapter-cosmos/leap | 3 处 | 3 处 | ✅ 完整 |
| adapter-cosmos/keplr | 3 处 | 3 处 | ✅ 完整 |
| ui-theme/Modal | 1 处 | 1 处 | ✅ 完整 |

**定时器清理情况：**

| 组件 | setInterval/setTimeout | clearInterval/clearTimeout | 状态 |
|------|----------------------|---------------------------|------|
| analytics/remote | 1 setTimeout | 1 clearTimeout | ✅ |
| wallet-recovery/hooks | 1 setInterval | 1 clearInterval | ✅ |
| pay-ui/DepositWidget | 1 setInterval | 1 clearInterval | ✅ |
| cross-chain-sync (3处) | 3 setInterval | 3 clearInterval | ✅ |
| siwx/cloud-auth | 1 setTimeout | 1 clearTimeout | ✅ |

### 问题清单

- [x] 图片是否优化（WebP/AVIF） → **未优化，全部 PNG**
- [ ] 字体是否子集化 → **未子集化，但使用 woff2**
- [x] 是否有内存泄漏 → **未发现明显泄漏，清理逻辑完整**
- [x] 是否有未释放的事件监听 → **已正确释放**

---

## 5. 后端性能 🟢

### 数据库查询

- ✅ 未发现直接 SQL 查询（使用 D1/Workers 抽象层）
- ✅ 未发现 N+1 查询模式
- ⚠️ 数据库操作通过 Cloudflare D1 进行，查询优化依赖 D1 引擎

### 连接池

- ⚠️ 未发现显式连接池配置
- 注：Cloudflare Workers 无状态模型不需要传统连接池
- D1 连接由 Cloudflare 管理

### 缓存策略

- ✅ Cloudflare 边缘缓存（cacheTtl: 30）
- ✅ 环境变量缓存（cachedEnv 单例模式）
- ⚠️ 无 Redis/内存缓存层用于频繁查询

### 问题清单

- [x] 数据库查询是否优化 → **通过 D1 抽象，无明显问题**
- [x] 是否有 N+1 问题 → **未发现**
- [x] 是否有连接池 → **Workers 无状态模型，D1 托管**
- [ ] 是否有缓存策略 → **边缘缓存有，应用层缓存缺失**

---

## 高危问题 🔴

1. **Bundle 体积过大**
   - analytics-dashboard lib chunk: 857KB
   - unified-dashboard lib chunk: 828KB
   - 5 个应用 .next 目录超过 100MB
   - **影响**：首屏加载时间 >5s（3G 网络可能 >15s）
   - **建议**：
     - 分析 lib chunk 内容，拆分大型依赖（如 ethers.js, chart.js）
     - 使用 `next/dynamic` 懒加载非关键组件
     - 配置 `optimizePackageImports` 优化第三方库导入

2. **无现代图片格式**
   - 全项目 0 个 WebP/AVIF 文件
   - **影响**：图片体积比现代格式大 30-50%
   - **建议**：
     - 使用 Next.js `<Image>` 组件自动转换
     - 构建时批量转换 PNG → WebP/AVIF

3. **无虚拟滚动**
   - 大数据列表（交易、NFT、代币）无虚拟化
   - **影响**：1000+ 条目时 DOM 节点过多，滚动卡顿
   - **建议**：
     - 引入 `@tanstack/react-virtual` 或 `react-window`
     - 对交易列表、NFT 画廊等组件应用虚拟滚动

---

## 中危问题 🟡

4. **前端数据缓存缺失**
   - 大部分 API 请求使用 `cache: "no-store"`
   - 无 SWR / React Query / Apollo Client
   - **影响**：重复请求浪费带宽，用户体验差
   - **建议**：
     - 引入 `@tanstack/react-query` 或 `swr`
     - 配置合理的 staleTime / cacheTime

5. **无浏览器 Web Worker**
   - 加密计算、大数据处理在主线程执行
   - **影响**：UI 卡顿，特别是低端设备
   - **建议**：
     - 将加密/签名操作移入 Web Worker
     - 使用 `comlink` 简化 Worker 通信

6. **字体未子集化**
   - 加载完整 Geist 字体系列（4 个文件）
   - **影响**：字体文件体积偏大（但 woff2 部分缓解）
   - **建议**：
     - 仅包含使用的字符子集（拉丁 + 数字）
     - 考虑使用 `next/font` 自动优化

7. **dashboard 应用代码分割不足**
   - website / unified-dashboard 的 lib chunk 过大
   - **影响**：初始加载包含大量非关键代码
   - **建议**：
     - 按路由拆分依赖
     - 使用动态导入延迟加载图表库

---

## 低危问题 🟢

8. **请求合并不足**
   - 仅 developer-dashboard 有请求去重
   - **建议**：实现全局请求去重或批量查询 API

9. **应用层缓存缺失**
   - 后端无 Redis/内存缓存层
   - **建议**：对频繁查询数据（如汇率、Gas 价格）添加缓存

---

## 优化建议 💡

### 短期（1-2 周）

1. **图片优化**（优先级：高）
   ```bash
   # 批量转换 PNG → WebP
   find apps/ -name "*.png" -exec cwebp -q 80 {} -o {}.webp \;
   ```
   - 预期收益：图片体积减少 30-50%

2. **引入数据缓存**（优先级：高）
   ```bash
   pnpm add @tanstack/react-query
   ```
   - 预期收益：减少 50%+ 重复 API 请求

3. **分析并拆分大 bundle**（优先级：高）
   ```bash
   # 使用 bundle analyzer
   pnpm add @next/bundle-analyzer -w
   ```
   - 预期收益：首屏加载减少 2-3s

### 中期（1-2 月）

4. **虚拟滚动**（优先级：中）
   ```bash
   pnpm add @tanstack/react-virtual
   ```
   - 应用到：交易列表、NFT 画廊、代币选择器

5. **Web Worker 迁移**（优先级：中）
   - 迁移加密操作到 Worker
   - 使用 `comlink` 简化通信

6. **字体子集化**（优先级：低）
   - 使用 `fonttools` 或 `pyftsubset` 提取常用字符

### 长期（3-6 月）

7. **微前端架构**（优先级：低）
   - 考虑 Module Federation 拆分超大型应用
   - 独立部署和缓存各模块

8. **性能监控**（优先级：高）
   - 集成 Web Vitals 监控
   - 建立性能预算（LCP < 2.5s, FID < 100ms, CLS < 0.1）

---

## 性能评分

| 维度 | 评分 | 说明 |
|------|------|------|
| Bundle 大小 | 3/10 | 多个超大 bundle，代码分割不足 |
| 渲染性能 | 6/10 | 有 memoization，但缺虚拟滚动和 Worker |
| 网络性能 | 5/10 | 有边缘缓存，但缺应用层缓存 |
| 资源优化 | 4/10 | 无现代图片格式，字体未子集化 |
| 后端性能 | 7/10 | D1 抽象良好，缺应用层缓存 |
| 内存管理 | 8/10 | 清理逻辑完整，无明显泄漏 |

**综合评分：5.5/10**

---

## 附录

### 审计命令

```bash
# Bundle 大小检查
find apps/ -name ".next" -exec du -sh {} \;

# 大文件查找
find apps/ -path "*/node_modules" -prune -o -name "*.js" -size +100k -print

# 代码分割检查
grep -rn "lazy(\|React.lazy\|import(" apps/ --include="*.tsx"

# 图片格式检查
find apps/ -name "*.webp" -o -name "*.avif"

# 缓存策略检查
grep -rn "Cache-Control\|cache\|stale-while-revalidate" apps/ packages/

# 内存泄漏检查
grep -rn "addEventListener\|setInterval" packages/ apps/ | grep -v "removeEventListener\|clearInterval"
```

### 参考标准

- Google Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Bundle 预算: 单个 chunk < 200KB（gzip 后 < 70KB）
- 图片优化: 使用 WebP/AVIF，体积 < 100KB
- 缓存命中率: > 80%

---

**报告生成时间**: 2026-06-11 11:36 UTC
**下次审计建议**: 2026-07-11（优化后复评）
