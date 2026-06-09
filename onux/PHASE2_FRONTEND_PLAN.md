# Phase 2: Cinacoin 统一前端架构 — 详细实施计划

> **目标**: 将剩余 6 个应用迁移到统一前端架构，创建统一仪表板，实现跨应用一致性体验  
> **时间**: 8 周 (W1-W8)  
> **前置条件**: Phase 1 已完成 `@cinacoin/ui` 组件库 + Website 集成

---

## 1. 现状分析

### 1.1 已完成 (Phase 1)

| 产出物 | 状态 | 说明 |
|--------|------|------|
| `@cinacoin/ui` | ✅ 完成 | Brand, Button, Card, GlobalHeader, Input, Sidebar, SiteFooter, SiteHeader, ThemeProvider |
| `@cinacoin/design-tokens` | ✅ 完成 | CSS Variables, tokens, theme system |
| `apps/website` | ✅ 已集成 | 使用 @cinacoin/ui + @cinacoin/design-tokens |

### 1.2 待迁移应用 (6 个)

| 应用 | 端口 | 技术栈 | 现有 @cinacoin/ui 依赖 | 优先级 |
|------|------|--------|----------------------|--------|
| `backend-dashboard` | 3100 | Next 15 + React 19 + Tailwind | ✅ 已引入 | P1 |
| `cloud-dashboard` | 3200 | Next 15 + React 19 + Tailwind | ❌ 未引入 | P1 |
| `analytics-dashboard` | — | Next 15.5 + React 19 + Tailwind | ✅ 已引入 | P2 |
| `wallet-explorer` | 3010 | Next 15 + React 19 + Tailwind | ✅ 已引入 | P2 |
| `demo` | — | Next 15 + React 19 + Tailwind | ✅ 已引入 (core-sdk, core-ui, react) | P3 |
| `health-status` | — | Next 15 + React 19 + Tailwind | ❌ 未引入 | P3 |

### 1.3 现有组件重复问题

各应用存在大量重复的本地组件：

- **Sidebar**: backend-dashboard, cloud-dashboard, @cinacoin/ui 各有独立实现
- **Header**: backend-dashboard, cloud-dashboard, @cinacoin/ui 各有独立实现
- **ThemeProvider**: backend-dashboard, cloud-dashboard, health-status, @cinacoin/ui 各有独立实现
- **ErrorState/LoadingState**: backend-dashboard 本地实现
- **MetricBox/ServiceCard**: backend-dashboard 本地实现

---

## 2. 架构设计

### 2.1 包依赖拓扑

```
@cinacoin/design-tokens          ← 基础层：Design Tokens
       ↓
@cinacoin/ui                     ← 组件层：共享 UI 组件
       ↓
@cinacoin/app-shell              ← 应用壳层：布局、路由、导航 (NEW)
       ↓
@cinacoin/app-state              ← 状态层：跨应用状态管理 (NEW)
       ↓
apps/*                           ← 应用层：各业务应用
```

### 2.2 新增包

| 包名 | 用途 | 技术 |
|------|------|------|
| `@cinacoin/app-shell` | 统一应用壳：布局、导航、路由保护 | React + Next.js App Router |
| `@cinacoin/app-state` | 跨应用状态管理 | Zustand + TanStack Query |
| `@cinacoin/realtime` | WebSocket/SSE 实时更新 | Native WebSocket + EventSource |
| `@cinacoin/command-palette` | Cmd+K 命令面板 | React + kbar/cmdk |

### 2.3 状态管理架构

```
┌─────────────────────────────────────────────────────────┐
│                    State Layers                          │
├─────────────┬───────────────┬────────────┬──────────────┤
│ Server State│  Client State │  URL State │ Persistent   │
│ TanStack    │  Zustand      │  Next.js   │ localStorage │
│ Query       │  Stores       │  Router    │ + IndexedDB  │
├─────────────┼───────────────┼────────────┼──────────────┤
│ API 数据    │ UI 状态       │ 路由参数   │ 用户偏好     │
│ 缓存/同步   │ 主题/侧边栏   │ 查询筛选   │ 最近访问     │
│ 乐观更新    │ 通知面板      │ 排序/分页  │ 自定义布局   │
└─────────────┴───────────────┴────────────┴──────────────┘
```

### 2.4 统一主题系统

```typescript
// 主题层级
ThemeProvider (@cinacoin/ui)
  ├── CSS Variables (design-tokens)
  ├── 主题预设: dark / light / system
  ├── 应用级覆盖: 每个应用可微调
  └── 用户偏好: localStorage 持久化
```

---

## 3. 应用迁移方案

### 3.1 通用迁移步骤

每个应用遵循以下迁移流程：

1. **依赖更新**: 添加缺失的 `@cinacoin/ui` 依赖
2. **布局替换**: 用 `@cinacoin/app-shell` 的 `AppLayout` 替换本地 layout
3. **组件替换**: 将本地重复组件替换为 `@cinacoin/ui` 共享组件
4. **主题统一**: 移除本地 ThemeProvider，使用统一 ThemeProvider
5. **导航集成**: 接入 GlobalHeader + Sidebar 统一导航
6. **权限接入**: 添加路由级权限保护 (管理界面)
7. **状态迁移**: 将数据获取迁移到 TanStack Query
8. **视觉验证**: 确保迁移后视觉一致性

### 3.2 各应用特殊考虑

#### Backend Dashboard (P1)
- 已有 AuthGuard → 迁移到统一权限系统
- 有 I18nProvider → 保留，接入 @cinacoin/i18n
- 12 个页面路由 → 逐一迁移
- 本地组件 (MetricBox, ServiceCard, BarChart 等) → 提取到 @cinacoin/ui

#### Cloud Dashboard (P1)
- 项目管理 CRUD → 接入统一数据层
- ApiKeyManager → 提取为共享安全组件
- UsageChart → 提取为 @cinacoin/ui 图表组件
- 需要权限控制 (项目级)

#### Analytics Dashboard (P2)
- 数据密集型 → TanStack Query 缓存策略关键
- API routes (analytics/query, kpi, funnel) → 保持，前端接入统一数据层
- 图表组件 → 提取到 @cinacoin/ui

#### Wallet Explorer (P2)
- 依赖 @cinacoin/wallet-registry → 保持
- 搜索/筛选 → 接入统一搜索
- 相对简单，组件化程度低

#### Demo (P3)
- 功能演示应用，页面多 (12+)
- 依赖 core-sdk, core-ui, react, siwe → 保持
- 主要替换外壳组件

#### Health Status (P3)
- 公共状态页，独立性强
- 有 I18nProvider → 接入统一 i18n
- 组件最少，迁移最快

---

## 4. 统一仪表板 (Unified Dashboard)

详见 → [unified-dashboard-design.md](./unified-dashboard-design.md)

### 4.1 核心功能

- **概览页面**: 聚合所有应用的关键指标
- **快速切换**: 应用间无缝切换
- **通知中心**: 跨应用通知聚合
- **个性化设置**: 可定制布局和组件

### 4.2 技术方案

- 新建 `apps/unified-dashboard` (Next.js 15)
- 使用 Module Federation 或 iframe 嵌入各应用 widget
- 统一认证 + 权限感知
- WebSocket 实时推送

---

## 5. 跨应用功能

详见 → [cross-app-features-spec.md](./cross-app-features-spec.md)

### 5.1 统一搜索
- 全局搜索框 (Cmd+K / Ctrl+K)
- 搜索范围：用户、项目、交易、钱包、文档
- 结果分组 + 快捷操作

### 5.2 命令面板
- 基于 cmdk 库
- 应用导航、快捷操作、搜索
- 可扩展的命令注册机制

### 5.3 上下文保持
- URL-based state 跨应用传递
- Shared session storage
- 面包屑导航历史

### 5.4 实时数据
- WebSocket 连接管理
- SSE fallback
- 统一事件总线

---

## 6. 新增共享组件

详见 → [phase2-components-list.md](./phase2-components-list.md)

### 6.1 核心组件 (从现有应用提取)

| 组件 | 来源 | 用途 |
|------|------|------|
| DataTable | 多应用共性 | 数据表格 + 排序/筛选/分页 |
| Chart (Line/Bar/Pie) | analytics, cloud | 数据可视化 |
| StatCard / MetricCard | backend-dashboard | 指标展示 |
| StatusBadge | health-status | 状态指示 |
| SearchInput | wallet-explorer | 搜索输入框 |
| EmptyState | backend-dashboard | 空状态 |
| ErrorBoundary | backend-dashboard | 错误边界 |
| LoadingSkeleton | 多应用共性 | 加载骨架屏 |
| ConfirmDialog | cloud-dashboard | 确认对话框 |
| ApiKeyDisplay | cloud-dashboard | API Key 展示/复制 |

### 6.2 布局组件

| 组件 | 用途 |
|------|------|
| AppLayout | 统一应用布局 (Header + Sidebar + Content) |
| PageHeader | 页面标题 + 面包屑 + 操作区 |
| ContentGrid | 响应式内容网格 |
| WidgetCard | 仪表板小部件容器 |

### 6.3 反馈组件

| 组件 | 用途 |
|------|------|
| Toast / Notification | 全局通知 |
| CommandPalette | Cmd+K 命令面板 |
| SearchOverlay | 全局搜索覆盖层 |
| Breadcrumb | 面包屑导航 |

---

## 7. 用户体验优化

### 7.1 暗色/亮色主题

```typescript
// 主题切换流程
1. 系统偏好检测: matchMedia('(prefers-color-scheme: dark)')
2. 用户偏好: localStorage('cinacoin-theme')
3. 优先级: 用户设置 > 系统偏好 > 默认(dark)
4. 切换动画: CSS transition on color-scheme
5. FOUC 防护: inline script in <head>
```

### 7.2 响应式设计

```
断点系统 (Tailwind 默认):
- sm: 640px   → 手机横屏
- md: 768px   → 平板
- lg: 1024px  → 笔记本
- xl: 1280px  → 桌面
- 2xl: 1536px → 大屏

响应式策略:
- Sidebar: 桌面固定 → 平板可折叠 → 手机底部导航
- DataTable: 桌面完整表格 → 手机卡片列表
- Charts: 自适应容器宽度
- Modal: 桌面居中 → 手机全屏
```

### 7.3 可访问性 (WCAG 2.1 AA)

- [ ] 所有交互元素键盘可达
- [ ] 颜色对比度 ≥ 4.5:1 (文本), ≥ 3:1 (大文本/UI)
- [ ] ARIA labels 完整
- [ ] 焦点管理 (modal, dropdown)
- [ ] 屏幕阅读器测试
- [ ] 减少动画偏好支持 (prefers-reduced-motion)
- [ ] 跳过导航链接

### 7.4 性能优化

```
代码分割策略:
- 路由级 lazy loading (Next.js App Router 默认)
- 组件级 dynamic import (重型组件: Chart, DataTable)
- 第三方库按需加载

资源优化:
- 图片: next/image, WebP/AVIF, srcset
- 字体: Geist (已选), font-display: swap
- 图标: SVG sprite 或 tree-shakeable icon 库

缓存策略:
- TanStack Query: staleTime + gcTime 配置
- SWR 模式: 先展示缓存，后台刷新
- Service Worker: 静态资源缓存 (PWA 可选)
```

---

## 8. 实施时间表

详见 → [app-migration-checklist.md](./app-migration-checklist.md)

### Week 1-2: 基础设施

| 周 | 任务 | 产出 |
|----|------|------|
| W1 | 创建 @cinacoin/app-shell 包 | 布局组件、导航系统 |
| W1 | 创建 @cinacoin/app-state 包 | Zustand stores、TanStack Query 配置 |
| W2 | 提取共享组件到 @cinacoin/ui | DataTable, Chart, StatCard 等 |
| W2 | 创建 @cinacoin/command-palette | Cmd+K 命令面板 |

### Week 3-4: P1 应用迁移

| 周 | 任务 | 产出 |
|----|------|------|
| W3 | 迁移 backend-dashboard | 统一布局、组件替换、权限集成 |
| W4 | 迁移 cloud-dashboard | 统一布局、项目管理 UI 升级 |

### Week 5-6: P2 应用迁移 + 统一仪表板

| 周 | 任务 | 产出 |
|----|------|------|
| W5 | 迁移 analytics-dashboard + wallet-explorer | 数据层统一、搜索集成 |
| W5 | 创建 unified-dashboard 骨架 | 基础布局、导航 |
| W6 | unified-dashboard 功能开发 | 概览页、通知中心、widget 系统 |

### Week 7: P3 迁移 + 跨应用功能

| 周 | 任务 | 产出 |
|----|------|------|
| W7 | 迁移 demo + health-status | 外壳统一 |
| W7 | 实现统一搜索、上下文保持 | 全局搜索、状态同步 |

### Week 8: 优化 + 测试

| 周 | 任务 | 产出 |
|----|------|------|
| W8 | 响应式 + 可访问性 + 性能优化 | 全应用适配 |
| W8 | 集成测试 + E2E 测试 | 测试覆盖 |
| W8 | 文档 + 迁移指南 | 开发者文档 |

---

## 9. 里程碑

| 里程碑 | 时间 | 验收标准 |
|--------|------|----------|
| M1: 基础设施就绪 | W2 结束 | app-shell + app-state + 10+ 共享组件可用 |
| M2: P1 应用迁移完成 | W4 结束 | backend-dashboard + cloud-dashboard 使用统一架构 |
| M3: 统一仪表板可用 | W6 结束 | unified-dashboard 展示所有应用关键指标 |
| M4: 全量迁移完成 | W7 结束 | 所有 6 个应用 + unified-dashboard 运行在统一架构上 |
| M5: 生产就绪 | W8 结束 | 性能/可访问性/响应式达标，测试覆盖 >80% |

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 迁移破坏现有功能 | 高 | 每个应用迁移后运行完整 E2E 测试 |
| 组件 API 不稳定 | 中 | 先稳定 @cinacoin/ui API，再开始迁移 |
| 性能退化 | 中 | 设置 Lighthouse 性能基线，CI 检查 |
| 跨应用状态同步复杂 | 中 | 优先 URL state，减少共享状态需求 |
| 统一主题与现有设计冲突 | 低 | 渐进式迁移，允许过渡期混合使用 |

---

## 11. 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 状态管理 (client) | Zustand | 轻量、TypeScript 友好、无 boilerplate |
| 状态管理 (server) | TanStack Query | 成熟、缓存/同步/乐观更新 |
| 命令面板 | cmdk | 轻量、可定制、React 原生 |
| 实时通信 | WebSocket + SSE fallback | 双向通信 + 降级兼容 |
| 样式方案 | Tailwind + CSS Variables | 现有基础、design tokens 集成 |
| 应用间通信 | URL state + shared storage | 松耦合、可独立部署 |
| 图表库 | Recharts 或 Tremor | React 原生、可定制、轻量 |

---

## 12. 文件结构

```
onux/
├── packages/
│   ├── ui/                      # @cinacoin/ui (已有，扩展)
│   │   └── src/
│   │       ├── components/      # 新增: DataTable, Chart, etc.
│   │       └── ...
│   ├── design-tokens/           # @cinacoin/design-tokens (已有)
│   ├── app-shell/               # NEW: @cinacoin/app-shell
│   │   └── src/
│   │       ├── AppLayout.tsx
│   │       ├── PageHeader.tsx
│   │       ├── NavProvider.tsx
│   │       ├── AuthGuard.tsx
│   │       └── index.ts
│   ├── app-state/               # NEW: @cinacoin/app-state
│   │   └── src/
│   │       ├── stores/          # Zustand stores
│   │       ├── queries/         # TanStack Query hooks
│   │       ├── providers.tsx
│   │       └── index.ts
│   ├── realtime/                # NEW: @cinacoin/realtime
│   │   └── src/
│   │       ├── WebSocketProvider.tsx
│   │       ├── useRealtime.ts
│   │       └── index.ts
│   └── command-palette/         # NEW: @cinacoin/command-palette
│       └── src/
│           ├── CommandPalette.tsx
│           ├── useCommands.ts
│           └── index.ts
│
├── apps/
│   ├── website/                 # ✅ Phase 1 完成
│   ├── unified-dashboard/       # NEW: 统一仪表板
│   ├── backend-dashboard/       # Phase 2 迁移
│   ├── cloud-dashboard/         # Phase 2 迁移
│   ├── analytics-dashboard/     # Phase 2 迁移
│   ├── wallet-explorer/         # Phase 2 迁移
│   ├── demo/                    # Phase 2 迁移
│   └── health-status/           # Phase 2 迁移
│
└── PHASE2_FRONTEND_PLAN.md      # 本文件
```
