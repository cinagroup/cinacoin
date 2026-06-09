# Cinacoin Cloud Dashboard — Vercel 风格设计系统改造报告

**日期**: 2026-06-08  
**项目**: `apps/cloud-dashboard`  
**设计系统**: Vercel × Cinacoin (基于 `packages/design-tokens/css/cinacoin.css`)

---

## 概述

本次改造将 Cinacoin Cloud Dashboard 应用从通用 Tailwind 样式迁移到 Vercel 风格的设计系统，强调：
- **6px 应用级圆角**（替代原设计系统的 100px pill 按钮）
- **侧边栏导航**（带活跃状态指示条）
- **数据表格**（等宽字体表头）
- **统计卡片**（堆叠阴影）
- **表单输入**（focus 时黑色边框）

---

## 核心设计特征

### 色彩系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--cc-canvas` | `#ffffff` | 卡片/面板背景 |
| `--cc-canvas-soft` | `#fafafa` | 页面背景 |
| `--cc-canvas-soft-2` | `#f5f5f5` | 表头/悬停背景 |
| `--cc-ink` | `#171717` | 主文字/主按钮 |
| `--cc-body` | `#4d4d4d` | 正文文字 |
| `--cc-muted` | `#888888` | 辅助文字 |
| `--cc-link` | `#0070f3` | 链接色 |
| `--cc-hairline` | `#ebebeb` | 边框分隔线 |

### 字体

- **主字体**: Inter / Geist (几何无衬线)
- **等宽字体**: JetBrains Mono / Geist Mono
- **字重**: Display 600, Body 400, Button 500
- **字间距**: Display `-1.28px` ~ `-2.4px`

### 组件规格

| 组件 | 规格 |
|------|------|
| 按钮 | 6px 圆角，主按钮黑底白字，次按钮白底黑字 |
| 卡片 | 8px 圆角，堆叠阴影 + inset hairline |
| 输入框 | 6px 圆角，40px 高度，focus 时边框变黑 |
| 表格 | 表头 canvas-soft 背景，等宽字体，hairline 分隔 |
| 侧边栏 | 白色背景，活跃项左侧 3px 黑色指示条 |

---

## 文件变更清单

### 1. `src/app/globals.css` — 全局样式重写

**变更**:
- 导入 `@cinacoin/design-tokens/css/cinacoin.css` 作为 token 源
- 添加 Dashboard 专用 CSS 变量映射
- 定义 `--app-radius: 6px` 覆盖 pill 圆角
- 新增 `.sidebar` 侧边栏样式（240px 宽，sticky 定位）
- 新增 `.sidebar-nav-item` 导航项样式（含 `.active::before` 指示条）
- 新增 `.data-table` 数据表格样式（等宽表头）
- 新增 `.stat-card` 统计卡片样式（堆叠阴影）
- 覆盖 `.cc-btn-*` 圆角为 6px
- 覆盖 `.cc-form-input:focus` 边框为黑色
- 设置页面背景 `#fafafa`

### 2. `src/components/Header.tsx` — 头部组件

**变更**:
- Logo 图片从 `/logo.svg` 改为 `/logo.png`
- CTA 按钮圆角从 pill 改为 6px (`rounded-[var(--app-radius)]`)
- 保持 64px 高度、白色背景

### 3. `src/components/Sidebar.tsx` — 新增侧边栏组件

**新增**:
- 240px 宽侧边栏，白色背景，右侧 hairline 边框
- 导航项：Dashboard / Projects / Settings
- 活跃状态：左侧 3px 黑色指示条 + 背景色变化
- 内联 SVG 图标（Dashboard / Projects / Settings）
- 移动端隐藏（`hidden md:block`）

### 4. `src/app/layout.tsx` — 布局重构

**变更**:
- 导入 `Sidebar` 组件
- 布局从单列改为 `flex` 侧边栏 + 主内容区
- 主内容区 `flex-1 min-w-0` 确保响应式

### 5. `src/app/page.tsx` — Dashboard 首页

**变更**:
- 移除 `Header` 导入和包裹（现由 layout 提供）
- 移除 `min-h-screen bg-[var(--cc-canvas-soft)]` 包裹
- 统计卡片从 `.cc-card` 改为 `.stat-card`
- 使用 `.stat-card-label` 和 `.stat-card-value` 样式类

### 6. `src/app/projects/page.tsx` — 项目列表页

**变更**:
- 移除 `Header` 和 `ProjectCard` 导入
- 移除包裹 div
- 项目列表从卡片网格改为**数据表格**
- 使用 `.data-table` 样式：等宽表头、hairline 分隔
- 表头：Name / Description / Status / Updated / Action

### 7. `src/app/projects/new/page.tsx` — 新建项目页

**变更**:
- 移除 `Header` 导入和包裹
- 保持 `ProjectForm` 组件不变

### 8. `src/app/projects/[id]/page.tsx` — 项目详情页（服务端）

**变更**:
- 简化 not-found 状态布局
- 移除包裹 div

### 9. `src/app/projects/[id]/ProjectDetailClient.tsx` — 项目详情客户端

**变更**:
- 移除 `Header` 导入和包裹
- 统计卡片改为 `.stat-card` 样式

### 10. `src/app/settings/page.tsx` — 设置页

**变更**:
- 移除 `Header` 导入和包裹
- 保持表单和危险区域样式

---

## 设计 Token 映射

Dashboard 使用语义化 CSS 变量，映射到设计系统 token：

```css
:root {
  --bg-primary: var(--cc-canvas-soft);    /* #fafafa */
  --bg-card: var(--cc-canvas);            /* #ffffff */
  --border: var(--cc-hairline);           /* #ebebeb */
  --text-primary: var(--cc-ink);          /* #171717 */
  --text-secondary: var(--cc-body);       /* #4d4d4d */
  --app-radius: 6px;                      /* 应用级圆角 */
  --app-radius-lg: 8px;                   /* 卡片圆角 */
}
```

---

## 响应式设计

| 断点 | 行为 |
|------|------|
| `< 768px` | 侧边栏隐藏，触摸目标最小 44px |
| `≥ 768px` | 侧边栏显示，240px 固定宽度 |
| `≥ 1024px` | 主内容区最大宽度 1280px |

---

## 无障碍 (a11y)

- 侧边栏导航使用 `aria-label="Sidebar navigation"`
- 活跃项使用 `aria-current="page"`
- 统计卡片使用 `role="status"` 和 `aria-busy`
- 数据表格使用语义化 `<thead>` / `<tbody>`
- 所有交互元素保持 `focus-visible` 轮廓

---

## 暗色模式支持

所有组件通过 CSS 变量自动支持暗色模式：
- `data-theme="dark"` 时 token 自动切换
- 侧边栏、表格、卡片、按钮均适配暗色

---

## 未变更组件

以下组件保持原样，无需修改：
- `ProjectCard.tsx` — 项目卡片（已不在列表页使用，保留供未来使用）
- `ProjectForm.tsx` — 项目表单（使用 `.cc-form-input` 自动获得新样式）
- `UsageChart.tsx` — 使用图表（保持独立样式）
- `ApiKeyManager.tsx` — API Key 管理（使用 `.cc-btn-*` 自动获得新圆角）

---

## 构建验证

改造后需验证：
```bash
cd apps/cloud-dashboard
npm run build
```

确保：
- TypeScript 编译无错误
- CSS 变量正确解析
- 侧边栏在所有页面显示
- 数据表格正确渲染
- 响应式断点正常工作

---

## 后续优化建议

1. **移动端侧边栏**: 添加汉堡菜单触发器，实现滑出式侧边栏
2. **面包屑导航**: 项目详情页添加面包屑
3. **表格排序**: 数据表格添加列排序功能
4. **骨架屏**: 加载状态使用更精细的骨架屏组件
5. **主题切换**: 在设置页添加明暗主题切换开关

---

**改造完成**: 2026-06-08  
**设计系统版本**: `@cinacoin/design-tokens` (canonical CSS)  
**Tailwind Preset**: `@cinacoin/config/tailwind-preset`
