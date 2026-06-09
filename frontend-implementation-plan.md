# Cinacoin 前端实施计划

> **版本**: 1.0.0 | **日期**: 2026-06-08 | **状态**: 待审批

---

## 1. 项目概述

### 1.1 目标

将 Cinacoin 7 个独立前端应用统一为共享架构，实现：

- ✅ 统一视觉设计和品牌一致性
- ✅ 共享组件库，减少重复代码 60%+
- ✅ 统一导航和跨应用切换体验
- ✅ 统一认证、主题、国际化
- ✅ 可定制的仪表板系统
- ✅ 跨应用搜索和通知中心

### 1.2 当前状态评估

| 应用 | 框架 | 现有共享 | 需改造项 | 优先级 |
|------|------|----------|----------|--------|
| Cloud Dashboard | Next.js 15 | Tailwind preset | 布局、导航、认证 | P0 |
| Backend Dashboard | Next.js 15 | Tailwind preset | 布局、组件、表格 | P0 |
| Analytics Dashboard | Next.js 15 | Tailwind preset | 布局、图表、实时数据 | P1 |
| Wallet Explorer | Next.js 15 | Tailwind preset | 布局、列表、搜索 | P1 |
| Website | Next.js 15 | 品牌色统一 | Header/Footer 统一 | P2 |
| Demo (Next.js) | Next.js 15 | SDK 共享 | 布局统一 | P2 |
| Docs & Status | Docusaurus / Next.js | 品牌统一 | Header 统一 | P3 |

### 1.3 约束条件

| 约束 | 说明 |
|------|------|
| 零停机 | 渐进式迁移，不中断线上服务 |
| 向后兼容 | 旧路由保持可用，渐进重定向 |
| 性能不退化 | 共享包不能增加 > 50KB gzip |
| TypeScript strict | 所有新代码 zero any |
| 测试覆盖 | 新组件 ≥ 80% 覆盖率 |

---

## 2. 实施阶段

### Phase 0: 基础设施准备 (Week 1-2)

**目标**: 搭建共享基础设施，确保所有后续工作可并行

#### 2.1 任务清单

| # | 任务 | 负责 | 预估 | 依赖 |
|---|------|------|------|------|
| 0.1 | 创建 `@cinacoin/ui` 包骨架 | FE | 2d | — |
| 0.2 | 配置 tsconfig、eslint、vitest | FE | 1d | 0.1 |
| 0.3 | 迁移 Design Tokens 到 CSS Variables | FE | 2d | — |
| 0.4 | 创建 ThemeProvider + 暗色模式 | FE | 2d | 0.3 |
| 0.5 | 统一 Tailwind preset 引用 | FE | 1d | 0.3 |
| 0.6 | 搭建 Storybook 文档站 | FE | 2d | 0.1 |
| 0.7 | CI 集成 (构建 + 测试 + 视觉回归) | FE/DevOps | 2d | 0.1 |
| 0.8 | 创建 `@cinacoin/ui-theme` 包 | FE | 1d | 0.3 |

#### 2.2 交付物

- [ ] `packages/ui/` 包结构完整
- [ ] `packages/ui-theme/` Design Tokens 发布
- [ ] Storybook 可访问 (内部预览)
- [ ] CI 流水线通过
- [ ] 所有应用可引用 `@cinacoin/ui`

#### 2.3 验收标准

```bash
# 所有应用可正常构建
pnpm build

# 共享包测试通过
pnpm --filter @cinacoin/ui test

# Storybook 可访问
pnpm --filter @cinacoin/ui storybook

# 类型检查零错误
pnpm typecheck
```

---

### Phase 1: 核心组件库 (Week 3-4)

**目标**: 完成 P0 基础组件，支撑 Dashboard 类应用

#### 2.4 任务清单

| # | 任务 | 负责 | 预估 | 依赖 |
|---|------|------|------|------|
| 1.1 | Button 组件 (所有变体 + 尺寸) | FE | 2d | Phase 0 |
| 1.2 | Input + Textarea 组件 | FE | 2d | Phase 0 |
| 1.3 | Select 组件 (基于 Radix) | FE | 2d | Phase 0 |
| 1.4 | Checkbox + Radio + Switch | FE | 1.5d | Phase 0 |
| 1.5 | Card + 子组件 | FE | 1d | Phase 0 |
| 1.6 | Badge + Avatar | FE | 1d | Phase 0 |
| 1.7 | Dialog + AlertDialog | FE | 2d | Phase 0 |
| 1.8 | Toast + useToast | FE | 1.5d | Phase 0 |
| 1.9 | Skeleton 骨架屏 | FE | 1d | Phase 0 |
| 1.10 | Tabs 组件 | FE | 1d | Phase 0 |
| 1.11 | Tooltip + Popover | FE | 1d | Phase 0 |
| 1.12 | DropdownMenu | FE | 1d | Phase 0 |
| 1.13 | 组件测试 (≥ 80% 覆盖率) | FE | 3d | 1.1-1.12 |

#### 2.5 交付物

- [ ] 12+ 基础组件发布
- [ ] Storybook 文档完整
- [ ] 测试覆盖率报告
- [ ] 迁移指南文档

#### 2.6 组件 API 设计原则

```typescript
// 1. 组合优于配置
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>

// 2. 受控 + 非受控双模式
<Select value={value} onChange={setValue} />     // 受控
<Select defaultValue="opt1" />                    // 非受控

// 3. asChild 模式 (Radix 风格)
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>

// 4. 多态组件
<Text as="h1" variant="heading-1">Title</Text>
<Text as="p" variant="body">Content</Text>
```

---

### Phase 2: 布局与导航 (Week 5-6)

**目标**: 实现统一布局系统和导航，Cloud/Backend Dashboard 率先接入

#### 2.7 任务清单

| # | 任务 | 负责 | 预估 | 依赖 |
|---|------|------|------|------|
| 2.1 | GlobalShell 布局组件 | FE | 2d | Phase 1 |
| 2.2 | GlobalHeader 组件 | FE | 3d | 1.1, 1.6 |
| 2.3 | GlobalSidebar 组件 | FE | 2d | 1.1, Phase 1 |
| 2.4 | Breadcrumb 组件 | FE | 0.5d | Phase 1 |
| 2.5 | Pagination 组件 | FE | 1d | Phase 1 |
| 2.6 | AppSwitcher 组件 | FE | 1.5d | 1.12 |
| 2.7 | 认证集成 (AuthProvider) | FE | 2d | — |
| 2.8 | 权限导航系统 | FE | 2d | 2.7 |
| 2.9 | Cloud Dashboard 迁移 | FE | 3d | 2.1-2.6 |
| 2.10 | Backend Dashboard 迁移 | FE | 3d | 2.1-2.6 |

#### 2.8 迁移策略

```
Step 1: 创建新布局路由 (/v2/*)
Step 2: 新旧布局并存 (Feature Flag)
Step 3: 内部测试新布局
Step 4: 灰度发布 (10% → 50% → 100%)
Step 5: 移除旧布局代码
```

#### 2.9 交付物

- [ ] GlobalShell + Header + Sidebar 组件
- [ ] Cloud Dashboard 新布局上线
- [ ] Backend Dashboard 新布局上线
- [ ] 应用切换器可用
- [ ] 权限导航系统可用

---

### Phase 3: 数据组件与仪表板 (Week 7-8)

**目标**: 完成数据展示组件，实现统一仪表板

#### 2.10 任务清单

| # | 任务 | 负责 | 预估 | 依赖 |
|---|------|------|------|------|
| 3.1 | DataTable 组件 (TanStack Table) | FE | 3d | Phase 1 |
| 3.2 | StatCard 组件 | FE | 1d | Phase 1 |
| 3.3 | 图表组件 (Line, Bar, Pie) | FE | 3d | Phase 1 |
| 3.4 | Sparkline 迷你图 | FE | 1d | 3.3 |
| 3.5 | SearchInput + 防抖 | FE | 1d | 1.2 |
| 3.6 | DatePicker 组件 | FE | 2d | Phase 1 |
| 3.7 | Form 组件 (React Hook Form) | FE | 2d | Phase 1 |
| 3.8 | FileUpload 组件 | FE | 1.5d | Phase 1 |
| 3.9 | Analytics Dashboard 迁移 | FE | 3d | 3.1-3.4 |
| 3.10 | Wallet Explorer 迁移 | FE | 3d | 3.1, 3.5 |

#### 2.11 统一仪表板设计

```
┌─────────────────────────────────────────────────────────────┐
│                    主仪表板 (Dashboard Home)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 总项目数 │ │ API 调用 │ │ 活跃钱包 │ │ 收入趋势 │       │
│  │   12     │ │  1.2M    │ │   8.4K   │ │  +12%    │       │
│  │  +3      │ │  +15%    │ │  +5%     │ │  ↑       │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌────────────────────────────┐ ┌────────────────────┐      │
│  │                            │ │                    │      │
│  │   API 调用趋势 (7d)        │ │  链分布            │      │
│  │   [Line Chart]             │ │  [Pie Chart]       │      │
│  │                            │ │                    │      │
│  └────────────────────────────┘ └────────────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  最近活动                                           │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │ 10:32  Deployment: cloud-dashboard v2.1.0    │  │     │
│  │  │ 10:15  API Key created: sk-xxxx             │  │     │
│  │  │ 09:48  Wallet connected: 0x1234...           │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.12 可定制仪表板

```typescript
// 用户可拖拽、调整大小的仪表板组件
interface DashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'activity' | 'custom';
  title: string;
  config: Record<string, any>;
  layout: { x: number; y: number; w: number; h: number };
}

// 布局持久化到用户设置
// 使用 react-grid-layout 实现拖拽
```

#### 2.13 交付物

- [ ] DataTable 组件 (排序、筛选、分页)
- [ ] 图表组件套件
- [ ] Analytics Dashboard 新布局上线
- [ ] Wallet Explorer 新布局上线
- [ ] 主仪表板页面
- [ ] 可定制仪表板 (MVP)

---

### Phase 4: 全局功能 (Week 9-10)

**目标**: 实现跨应用功能 — 搜索、通知、设置

#### 2.14 任务清单

| # | 任务 | 负责 | 预估 | 依赖 |
|---|------|------|------|------|
| 4.1 | CommandPalette 全局搜索 | FE | 3d | Phase 2 |
| 4.2 | 搜索索引构建 (跨应用) | FE/BE | 2d | 4.1 |
| 4.3 | 通知中心 UI | FE | 2d | Phase 1 |
| 4.4 | 通知推送集成 (WebSocket) | FE/BE | 2d | 4.3 |
| 4.5 | 用户设置页面 | FE | 2d | Phase 2 |
| 4.6 | 个人资料页面 | FE | 1.5d | Phase 2 |
| 4.7 | 主题切换 (亮/暗/系统) | FE | 1d | Phase 0 |
| 4.8 | 国际化集成 (i18n) | FE | 2d | Phase 0 |
| 4.9 | 键盘快捷键系统 | FE | 1.5d | 4.1 |

#### 2.15 全局搜索架构

```
用户输入 ⌘K
    │
    ▼
CommandPalette 打开
    │
    ├── 本地搜索 (导航、操作、最近)
    │     └── 客户端即时响应
    │
    └── 远程搜索 (钱包、交易、文档)
          └── API 调用 (debounce 300ms)
                ├── /api/search/wallets?q=...
                ├── /api/search/transactions?q=...
                └── /api/search/docs?q=...
```

#### 2.16 交付物

- [ ] CommandPalette (⌘K) 全局可用
- [ ] 跨应用搜索功能
- [ ] 通知中心 (下拉 + 全页)
- [ ] 实时通知推送
- [ ] 用户设置/个人资料页面
- [ ] 键盘快捷键文档

---

### Phase 5: 剩余应用迁移 (Week 11-12)

**目标**: Website、Demo、Docs、Status 统一

#### 2.17 任务清单

| # | 任务 | 负责 | 预估 | 依赖 |
|---|------|------|------|------|
| 5.1 | Website Header/Footer 统一 | FE | 2d | Phase 2 |
| 5.2 | Website 组件迁移 | FE | 2d | Phase 1 |
| 5.3 | Demo 应用布局统一 | FE | 1.5d | Phase 2 |
| 5.4 | Demo-React (Vite) 集成 | FE | 1.5d | Phase 1 |
| 5.5 | Docs 站点 Header 统一 | FE | 1d | Phase 2 |
| 5.6 | Health Status 布局统一 | FE | 1d | Phase 2 |
| 5.7 | 跨应用 E2E 测试 | FE/QA | 3d | 5.1-5.6 |
| 5.8 | 性能审计 + 优化 | FE | 2d | 5.1-5.6 |

#### 2.18 交付物

- [ ] 所有 7 个应用使用统一布局
- [ ] 跨应用导航流畅
- [ ] E2E 测试通过
- [ ] 性能预算达标

---

### Phase 6: 优化与文档 (Week 13-14)

**目标**: 性能优化、文档完善、长期维护机制

#### 2.19 任务清单

| # | 任务 | 负责 | 预估 | 依赖 |
|---|------|------|------|------|
| 6.1 | Bundle 分析 + 优化 | FE | 2d | Phase 5 |
| 6.2 | 图片/字体优化 | FE | 1d | Phase 5 |
| 6.3 | Service Worker 缓存策略 | FE | 2d | Phase 5 |
| 6.4 | 组件库文档完善 | FE | 2d | Phase 5 |
| 6.5 | 贡献指南编写 | FE | 1d | 6.4 |
| 6.6 | 设计系统 Figma 同步 | Design | 2d | — |
| 6.7 | 视觉回归测试 (Chromatic) | FE | 1.5d | 6.1 |
| 6.8 | 性能监控接入 | FE | 1d | Phase 5 |

#### 2.20 交付物

- [ ] Bundle 大小报告 (各应用 < 200KB initial JS)
- [ ] Lighthouse 评分 > 90 (所有应用)
- [ ] 组件库文档站完整
- [ ] 贡献指南
- [ ] 视觉回归 CI 集成

---

## 3. 时间线总览

```
Week  1  2  3  4  5  6  7  8  9  10  11  12  13  14
      ├──────┤                                                      Phase 0: 基础设施
               ├──────┤                                             Phase 1: 核心组件
                        ├──────┤                                    Phase 2: 布局导航
                                 ├──────┤                           Phase 3: 数据组件
                                          ├──────┤                  Phase 4: 全局功能
                                                   ├──────┤         Phase 5: 剩余迁移
                                                            ├──────┤ Phase 6: 优化文档

Milestones:
  ● Week 2:  共享包可引用
  ● Week 4:  基础组件就绪
  ● Week 6:  Cloud/Backend 新布局上线
  ● Week 8:  Analytics/Explorer 新布局上线
  ● Week 10: 全局搜索 + 通知上线
  ● Week 12: 全部应用统一
  ● Week 14: 项目完成
```

---

## 4. 资源需求

### 4.1 人员配置

| 角色 | 人数 | 职责 |
|------|------|------|
| 前端负责人 | 1 | 架构设计、代码审查、技术决策 |
| 前端工程师 | 2-3 | 组件开发、应用迁移 |
| 设计师 | 1 (兼职) | 视觉规范、Figma 同步 |
| DevOps | 1 (兼职) | CI/CD、部署 |
| QA | 1 (兼职) | E2E 测试 |

### 4.2 基础设施

| 资源 | 用途 | 成本 |
|------|------|------|
| Storybook 部署 | 组件文档预览 | 免费 (CF Pages) |
| Chromatic | 视觉回归测试 | ~$80/mo |
| Sentry | 错误监控 | 自建 (已有) |

---

## 5. 风险管理

### 5.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 共享包体积过大 | 中 | 高 | Tree-shaking + Bundle 预算 + 动态导入 |
| 迁移中断线上服务 | 低 | 高 | Feature Flag + 灰度发布 + 回滚机制 |
| 组件 API 设计不合理 | 中 | 中 | RFC 流程 + 原型验证 + 用户测试 |
| 跨团队协调困难 | 中 | 中 | 每周同步会 + 共享看板 + 明确接口 |
| 性能退化 | 低 | 中 | 性能预算 + CI 检查 + Lighthouse CI |
| 暗色模式兼容问题 | 高 | 低 | CSS Variables + 逐组件测试 |

### 5.2 回滚策略

```
每个 Phase 结束时:
1. 旧代码保留 2 周 (不删除)
2. Feature Flag 可随时切换新旧版本
3. 数据库 Schema 向后兼容
4. CDN 缓存可快速刷新
```

---

## 6. 质量标准

### 6.1 代码质量

| 指标 | 目标 | 检查方式 |
|------|------|----------|
| TypeScript 错误 | 0 | CI typecheck |
| ESLint 错误 | 0 | CI lint |
| 测试覆盖率 | ≥ 80% | CI vitest |
| Bundle 大小 | < 200KB initial | CI check-bundle |
| 代码审查 | 2+ 审批 | GitHub PR |

### 6.2 性能质量

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| LCP | < 2.5s | Lighthouse CI |
| FID / INP | < 100ms | Web Vitals API |
| CLS | < 0.1 | Lighthouse CI |
| TTFB | < 500ms | Server timing |
| 首次可交互 | < 3.5s | Lighthouse CI |

### 6.3 可访问性

| 指标 | 目标 | 检查方式 |
|------|------|----------|
| WCAG 2.1 AA | 100% 合规 | axe-core CI |
| 键盘导航 | 所有交互可达 | 手动测试 |
| 色彩对比 | ≥ 4.5:1 | 自动化检查 |
| 屏幕阅读器 | VoiceOver + NVDA | 手动测试 |

---

## 7. 文档计划

### 7.1 文档类型

| 文档 | 受众 | 位置 |
|------|------|------|
| 组件 API 文档 | 开发者 | Storybook |
| 设计系统指南 | 设计师 + 开发者 | docs-site |
| 迁移指南 | 开发者 | docs-site |
| 贡献指南 | 新贡献者 | CONTRIBUTING.md |
| 架构决策记录 (ADR) | 团队 | docs/adr/ |
| 变更日志 | 所有人 | CHANGELOG.md |

### 7.2 ADR 模板

```markdown
# ADR-001: 选择 Radix UI 作为基础组件库

## 状态
已接受

## 背景
需要选择无样式组件库作为基础...

## 决策
选择 Radix UI 因为...

## 后果
- 正面: 完全可定制、无障碍内置
- 负面: 学习曲线、包体积

## 替代方案
- Headless UI: 组件较少
- React Aria: 更底层
```

---

## 8. 沟通计划

### 8.1 会议节奏

| 会议 | 频率 | 参与者 | 时长 |
|------|------|--------|------|
| 每日站会 | 每日 | FE 团队 | 15min |
| 设计评审 | 每周 | FE + Design | 1h |
| 代码审查 | 持续 | FE 团队 | — |
| 阶段回顾 | 每 2 周 | 全团队 | 1h |
| 利益相关方更新 | 每 2 周 | 管理层 | 30min |

### 8.2 沟通渠道

| 渠道 | 用途 |
|------|------|
| 飞书群 | 日常沟通 |
| GitHub Issues | 任务追踪 |
| GitHub PRs | 代码审查 |
| Figma | 设计协作 |
| Storybook | 组件预览 |

---

## 9. 成功标准

### 9.1 项目完成标准

- [ ] 所有 7 个应用使用统一布局
- [ ] 共享组件库覆盖 > 80% UI 需求
- [ ] 跨应用导航体验流畅
- [ ] 全局搜索可用
- [ ] 通知中心可用
- [ ] 暗色/亮色主题切换正常
- [ ] 所有应用 Lighthouse > 90
- [ ] 测试覆盖率 > 80%

### 9.2 长期成功指标

| 指标 | 基线 | 目标 (6 个月后) |
|------|------|-----------------|
| 新页面开发时间 | 5 天 | 2 天 |
| UI 不一致 bug | ~10/月 | < 2/月 |
| 组件复用率 | ~20% | > 70% |
| 前端 Bundle 大小 |  varies | < 200KB avg |
| 开发者满意度 |  N/A | > 4/5 |

---

## 10. 附录

### 10.1 技术选型决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 组件基础 | Radix UI | 无样式、无障碍、可组合 |
| 状态管理 | Zustand + TanStack Query | 轻量、类型安全、SWR |
| 表单 | React Hook Form + Zod | 性能优秀、验证强大 |
| 表格 | TanStack Table | 无头、灵活、类型安全 |
| 图表 | Recharts | React 原生、声明式 |
| 搜索 | cmdk | 轻量、可定制 |
| 图标 | Lucide React | 一致风格、Tree-shakeable |
| 日期 | date-fns | 轻量、Tree-shakeable |
| 拖拽 | react-grid-layout | 成熟、仪表板场景 |

### 10.2 关键依赖版本

```json
{
  "react": "^19.0.0",
  "next": "^15.0.0",
  "typescript": "^5.5.0",
  "tailwindcss": "^4.0.0",
  "@radix-ui/*": "latest",
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-table": "^8.0.0",
  "zustand": "^5.0.0",
  "react-hook-form": "^7.0.0",
  "zod": "^3.0.0",
  "recharts": "^2.0.0",
  "cmdk": "^1.0.0",
  "lucide-react": "latest",
  "date-fns": "^3.0.0"
}
```

### 10.3 相关文档

- [CINACOIN_FRONTEND_ARCHITECTURE.md](./CINACOIN_FRONTEND_ARCHITECTURE.md) — 前端架构设计
- [frontend-design-system.md](./frontend-design-system.md) — 设计系统规范
- [shared-components-list.md](./shared-components-list.md) — 共享组件清单

---

*文档维护: Cinacoin Frontend Team | 最后更新: 2026-06-08*
