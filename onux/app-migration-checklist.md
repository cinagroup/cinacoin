# Cinacoin Phase 2 — 应用迁移清单

> 按优先级排列的 6 个应用迁移清单，每个应用包含详细的迁移步骤和验收标准。

---

## 迁移优先级总览

```
Priority 1 (W3-W4):  ████████████████████  Backend Dashboard, Cloud Dashboard
Priority 2 (W5):     ████████████          Analytics Dashboard, Wallet Explorer  
Priority 3 (W7):     ████████              Demo, Health Status
```

---

## Priority 1: Backend Dashboard

**应用**: `apps/backend-dashboard`  
**端口**: 3100  
**技术栈**: Next 15 + React 19 + Tailwind + viem  
**现有依赖**: ✅ @cinacoin/design-tokens, @cinacoin/ui  
**迁移窗口**: Week 3  
**复杂度**: ★★★★☆ (高 — 12 个页面，多个本地组件)

### 现有页面路由

| 路由 | 功能 | 迁移复杂度 |
|------|------|-----------|
| `/` | 总览/首页 | 中 |
| `/analytics` | 分析数据 | 中 |
| `/chains` | 链管理 | 低 |
| `/keys-server` | Keys 服务管理 | 低 |
| `/notify-server` | 通知服务管理 | 低 |
| `/project` | 项目管理 | 中 |
| `/push-server` | 推送服务管理 | 低 |
| `/relay-server` | Relay 服务管理 | 低 |
| `/rpc-proxy` | RPC 代理管理 | 低 |
| `/settings` | 系统设置 | 低 |
| `/login` | 登录页 | 中 |

### 本地组件清单 (需替换/提取)

| 组件 | 处理方式 | 目标 |
|------|----------|------|
| `AppShell.tsx` | 替换 | @cinacoin/app-shell → AppLayout |
| `Sidebar.tsx` | 替换 | @cinacoin/ui → Sidebar (已有) |
| `Header.tsx` | 替换 | @cinacoin/ui → GlobalHeader (已有) |
| `AuthGuard.tsx` | 提取到 app-shell | @cinacoin/app-shell → AuthGuard |
| `MetricBox.tsx` | 提取到 ui | @cinacoin/ui → StatCard |
| `ServiceCard.tsx` | 提取到 ui | @cinacoin/ui → ServiceCard |
| `BarChart.tsx` | 提取到 ui | @cinacoin/ui → BarChart |
| `ProgressRing.tsx` | 提取到 ui | @cinacoin/ui → ProgressRing |
| `EmptyState.tsx` | 提取到 ui | @cinacoin/ui → EmptyState |
| `ErrorState.tsx` | 提取到 ui | @cinacoin/ui → ErrorState |
| `LoadingState.tsx` | 提取到 ui | @cinacoin/ui → LoadingSkeleton |
| `ErrorBoundary.tsx` | 提取到 ui | @cinacoin/ui → ErrorBoundary |
| `Toast.tsx` | 替换 | @cinacoin/ui → Toast (新建) |

### 迁移步骤

- [ ] **Step 1**: 添加新依赖
  ```bash
  pnpm add @cinacoin/app-shell @cinacoin/app-state @cinacoin/command-palette --filter backend-dashboard
  ```

- [ ] **Step 2**: 替换根布局 (`src/app/layout.tsx`)
  - 移除本地 ThemeProvider → 使用 @cinacoin/ui ThemeProvider
  - 保留 I18nProvider
  - 添加 AppShellProvider

- [ ] **Step 3**: 替换 AppShell 组件
  - 用 @cinacoin/app-shell 的 AppLayout 替换本地 AppShell
  - 配置 Sidebar 导航项
  - 配置 GlobalHeader 用户菜单

- [ ] **Step 4**: 逐页面迁移
  - 每页替换本地组件为 @cinacoin/ui 组件
  - 接入 TanStack Query 进行数据获取
  - 保持 AuthGuard 路由保护

- [ ] **Step 5**: 提取本地组件到 @cinacoin/ui
  - MetricBox → StatCard
  - ServiceCard → ServiceCard
  - BarChart → BarChart
  - 其他通用组件

- [ ] **Step 6**: 接入跨应用功能
  - 命令面板 (Cmd+K)
  - 全局通知
  - 面包屑导航

- [ ] **Step 7**: 验证
  - [ ] 所有页面可访问
  - [ ] 权限保护正常
  - [ ] 主题切换正常
  - [ ] 响应式布局正常
  - [ ] E2E 测试通过

---

## Priority 1: Cloud Dashboard

**应用**: `apps/cloud-dashboard`  
**端口**: 3200  
**技术栈**: Next 15 + React 19 + Tailwind  
**现有依赖**: ❌ @cinacoin/ui (未引入，仅有 design-tokens)  
**迁移窗口**: Week 4  
**复杂度**: ★★★☆☆ (中 — 项目 CRUD + 设置)

### 现有页面路由

| 路由 | 功能 | 迁移复杂度 |
|------|------|-----------|
| `/` | 项目列表 | 中 |
| `/projects` | 项目管理 | 中 |
| `/projects/new` | 新建项目 | 低 |
| `/projects/[id]` | 项目详情 | 高 |
| `/settings` | 用户设置 | 低 |

### 本地组件清单

| 组件 | 处理方式 | 目标 |
|------|----------|------|
| `Header.tsx` | 替换 | @cinacoin/ui → GlobalHeader |
| `Sidebar.tsx` | 替换 | @cinacoin/ui → Sidebar |
| `ProjectCard.tsx` | 提取到 ui | @cinacoin/ui → ProjectCard |
| `ProjectForm.tsx` | 保留本地 | 业务特定 |
| `UsageChart.tsx` | 提取到 ui | @cinacoin/ui → LineChart |
| `ApiKeyManager.tsx` | 提取到 ui | @cinacoin/ui → ApiKeyManager |

### 迁移步骤

- [ ] **Step 1**: 添加依赖
  ```bash
  pnpm add @cinacoin/ui @cinacoin/app-shell @cinacoin/app-state --filter cloud-dashboard
  ```

- [ ] **Step 2**: 替换根布局
  - 添加 ThemeProvider (从 @cinacoin/ui)
  - 添加 AppShellProvider

- [ ] **Step 3**: 替换布局组件
  - Header → GlobalHeader
  - Sidebar → Sidebar (from @cinacoin/ui)

- [ ] **Step 4**: 页面迁移
  - 项目列表页: 使用 Card 组件
  - 项目详情页: 使用 DataTable + Chart
  - 新建项目页: 使用 Form 组件
  - 设置页: 使用 Input + Button

- [ ] **Step 5**: 接入权限系统
  - 项目级权限控制
  - API Key 管理权限

- [ ] **Step 6**: 验证
  - [ ] 项目 CRUD 正常
  - [ ] API Key 管理正常
  - [ ] 用量图表正常
  - [ ] 权限控制正常
  - [ ] 响应式布局正常

---

## Priority 2: Analytics Dashboard

**应用**: `apps/analytics-dashboard`  
**技术栈**: Next 15.5 + React 19 + Tailwind  
**现有依赖**: ✅ @cinacoin/design-tokens, @cinacoin/ui  
**迁移窗口**: Week 5 (前半)  
**复杂度**: ★★★☆☆ (中 — 数据密集型，API routes 保持)

### 现有页面路由

| 路由 | 功能 | 迁移复杂度 |
|------|------|-----------|
| `/` | 分析概览 | 高 (图表密集) |

### 现有 API Routes (保持)

| 路由 | 功能 |
|------|------|
| `/api/analytics/query` | 分析查询 |
| `/api/analytics/kpi` | KPI 数据 |
| `/api/funnel/analyze` | 漏斗分析 |

### 迁移步骤

- [ ] **Step 1**: 添加依赖
  ```bash
  pnpm add @cinacoin/app-shell @cinacoin/app-state @cinacoin/realtime --filter analytics-dashboard
  ```

- [ ] **Step 2**: 替换布局
  - 接入统一 AppLayout
  - 保留 API routes 不变

- [ ] **Step 3**: 数据层升级
  - 前端数据获取迁移到 TanStack Query
  - 配置缓存策略 (staleTime, gcTime)
  - 添加实时数据更新 (WebSocket/SSE)

- [ ] **Step 4**: 图表组件统一
  - 替换/升级图表为 @cinacoin/ui 图表组件
  - 统一图表主题和交互

- [ ] **Step 5**: 验证
  - [ ] KPI 展示正常
  - [ ] 漏斗图正常
  - [ ] 实时数据更新正常
  - [ ] 数据导出正常

---

## Priority 2: Wallet Explorer

**应用**: `apps/wallet-explorer`  
**端口**: 3010  
**技术栈**: Next 15 + React 19 + Tailwind  
**现有依赖**: ✅ @cinacoin/design-tokens, @cinacoin/ui, @cinacoin/wallet-registry  
**迁移窗口**: Week 5 (后半)  
**复杂度**: ★★☆☆☆ (低 — 页面少，组件简单)

### 现有页面路由

| 路由 | 功能 | 迁移复杂度 |
|------|------|-----------|
| `/` | 钱包列表 + 搜索 | 中 |
| `/not-found` | 404 页面 | 低 |

### 迁移步骤

- [ ] **Step 1**: 添加依赖
  ```bash
  pnpm add @cinacoin/app-shell @cinacoin/app-state --filter cinacoin-wallet-explorer
  ```

- [ ] **Step 2**: 替换布局
  - 接入统一 AppLayout
  - 配置导航

- [ ] **Step 3**: 组件替换
  - 搜索框 → @cinacoin/ui SearchInput
  - 钱包卡片 → @cinacoin/ui Card
  - 404 页面 → @cinacoin/ui EmptyState

- [ ] **Step 4**: 接入统一搜索
  - 钱包搜索接入全局搜索
  - 添加搜索快捷键

- [ ] **Step 5**: 验证
  - [ ] 钱包列表展示正常
  - [ ] 搜索筛选正常
  - [ ] 钱包详情正常
  - [ ] 响应式正常

---

## Priority 3: Demo

**应用**: `apps/demo`  
**技术栈**: Next 15 + React 19 + Tailwind + viem  
**现有依赖**: ✅ @cinacoin/core-sdk, @cinacoin/core-ui, @cinacoin/design-tokens, @cinacoin/react, @cinacoin/siwe  
**迁移窗口**: Week 7 (前半)  
**复杂度**: ★★★☆☆ (中 — 页面多，但主要是外壳替换)

### 现有页面路由 (12+)

| 路由 | 功能 | 迁移复杂度 |
|------|------|-----------|
| `/` | Demo 首页 | 低 |
| `/aa` | Account Abstraction | 低 |
| `/aa-demo` | AA 演示 | 低 |
| `/activity` | 交易活动 | 低 |
| `/auth` | 认证演示 | 低 |
| `/batch` | 批量交易 | 低 |
| `/components` | 组件展示 | 低 |
| `/multi-chain` | 多链演示 | 低 |
| `/multichain` | 多链(旧) | 低 |
| `/onramp` | 法币入金 | 低 |
| `/profile` | 用户资料 | 低 |
| `/settings` | 设置 | 低 |
| `/swap` | 代币交换 | 低 |
| `/tokens` | 代币列表 | 低 |

### 迁移步骤

- [ ] **Step 1**: 添加依赖
  ```bash
  pnpm add @cinacoin/app-shell @cinacoin/ui --filter cinacoin-demo
  ```

- [ ] **Step 2**: 替换根布局
  - 接入统一 AppLayout
  - 保留 core-sdk/core-ui 集成

- [ ] **Step 3**: 外壳统一
  - 替换导航为统一 Sidebar
  - 替换 Header 为 GlobalHeader
  - 页面内容保持不变

- [ ] **Step 4**: 验证
  - [ ] 所有 demo 页面可访问
  - [ ] 钱包连接正常
  - [ ] 交易功能正常
  - [ ] 多链切换正常

---

## Priority 3: Health Status

**应用**: `apps/health-status`  
**技术栈**: Next 15 + React 19 + Tailwind  
**现有依赖**: ❌ @cinacoin/ui (未引入，仅有 design-tokens)  
**迁移窗口**: Week 7 (后半)  
**复杂度**: ★☆☆☆☆ (低 — 组件最少，独立性强)

### 现有页面路由

| 路由 | 功能 | 迁移复杂度 |
|------|------|-----------|
| `/` | 健康状态总览 | 低 |
| `/not-found` | 404 页面 | 低 |

### 本地模块

| 模块 | 处理方式 |
|------|----------|
| `lib/health-check.ts` | 保留 |
| `lib/incidents.ts` | 保留 |
| `types.ts` | 保留 |
| `providers/I18nProvider.tsx` | 保留，可选接入 @cinacoin/i18n |
| `providers/ThemeProvider.tsx` | 替换为 @cinacoin/ui |

### 迁移步骤

- [ ] **Step 1**: 添加依赖
  ```bash
  pnpm add @cinacoin/ui @cinacoin/app-shell --filter health-status
  ```

- [ ] **Step 2**: 替换 ThemeProvider
  - 移除本地 ThemeProvider
  - 使用 @cinacoin/ui ThemeProvider

- [ ] **Step 3**: 替换布局
  - 使用简化的 AppLayout (无 Sidebar)
  - 公共页面，无需权限

- [ ] **Step 4**: 组件替换
  - 状态指示器 → @cinacoin/ui StatusBadge
  - 事件列表 → @cinacoin/ui Card + Timeline

- [ ] **Step 5**: 验证
  - [ ] 健康状态展示正常
  - [ ] 事件时间线正常
  - [ ] 自动刷新正常
  - [ ] 响应式正常

---

## 迁移验收标准 (通用)

### 功能验收

- [ ] 所有现有页面可正常访问
- [ ] 所有现有功能正常工作
- [ ] 数据展示正确
- [ ] 表单提交正常
- [ ] 错误处理正常

### 视觉验收

- [ ] 与 Phase 1 Website 风格一致
- [ ] 暗色/亮色主题切换正常
- [ ] 响应式布局正常 (手机/平板/桌面)
- [ ] 动画/过渡效果流畅

### 技术验收

- [ ] TypeScript 无类型错误
- [ ] ESLint 无警告
- [ ] 构建成功无错误
- [ ] 包体积未显著增加 (<20% 增长)
- [ ] Lighthouse 性能分数 ≥ 90

### 可访问性验收

- [ ] 键盘导航完整
- [ ] ARIA labels 正确
- [ ] 颜色对比度达标
- [ ] 屏幕阅读器基本可用

---

## 迁移依赖关系图

```
Week 1-2: 基础设施
  ├── @cinacoin/app-shell
  ├── @cinacoin/app-state
  ├── @cinacoin/ui 扩展组件
  └── @cinacoin/command-palette

Week 3: backend-dashboard ──────┐
Week 4: cloud-dashboard ────────┤── 可并行
                                │
Week 5: analytics-dashboard ────┤
Week 5: wallet-explorer ────────┤── 可并行
                                │
Week 6: unified-dashboard ──────┘ (依赖 P1+P2 完成)
                                
Week 7: demo ───────────────────┐
Week 7: health-status ──────────┘── 可并行

Week 8: 全面优化 + 测试 ──────────── (所有应用)
```

---

## 回滚策略

每个应用迁移遵循以下回滚策略：

1. **Git 分支隔离**: 每个应用在独立分支迁移
2. **Feature Flag**: 通过环境变量控制新旧布局切换
3. **渐进发布**: 先内部环境验证，再灰度发布
4. **快速回滚**: 保留旧代码 2 周，可随时切回
