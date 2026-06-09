# Vercel Design System — Wallet Explorer 改造报告

## 概述

已将 `apps/wallet-explorer` 应用全面改造为 Vercel 风格设计系统。改造基于 `DESIGN_SYSTEM.md` 中定义的 Vercel-inspired 设计语言，覆盖全局样式、布局、组件、色彩和字体。

## 改造范围

### 1. 全局样式 (`src/app/globals.css`)

**新增 CSS 变量系统：**
- 定义 `--vercel-*` 系列 CSS 变量，包含色彩、圆角、阴影、字体
- 色彩变量：`--vercel-primary: #171717`、`--vercel-canvas-soft: #fafafa`、`--vercel-hairline: #ebebeb`、`--vercel-link: #0070f3` 等
- 圆角变量：`--vercel-radius-sm: 6px`、`--vercel-radius-md: 8px`、`--vercel-radius-lg: 12px`
- 阴影变量：三级堆叠阴影系统 (`--vercel-shadow-1/2/3`)，遵循 Vercel 的 inset hairline + stacked shadow 模式
- 字体变量：`--vercel-font-sans` (Geist/Inter) 和 `--vercel-font-mono` (Geist Mono/JetBrains Mono)

**新增组件类：**
- `.vercel-card` — 白色背景、8px 圆角、1px hairline 边框、堆叠阴影、hover 增强
- `.vercel-btn-primary` — 黑色背景、白色文字、6px 圆角、40px 高度
- `.vercel-btn-secondary` — 白色背景、黑色文字、hairline 边框、6px 圆角
- `.vercel-input` — 白色背景、hairline 边框、6px 圆角、40px 高度、focus 蓝色环
- `.vercel-badge` — 浅灰背景、圆角药丸、12px 字号
- `.vercel-header` — 白色背景、64px 高度、底部 hairline 分隔

**新增字体工具类：**
- `.vercel-display-xl` — 48px/600/-2.4px letter-spacing
- `.vercel-display-lg` — 32px/600/-1.28px letter-spacing
- `.vercel-display-md` — 24px/600/-0.96px letter-spacing
- `.vercel-body-lg` — 18px/400
- `.vercel-body-md` — 16px/400
- `.vercel-body-sm` — 14px/400/-0.28px letter-spacing
- `.vercel-caption` — 12px/400
- `.vercel-caption-mono` — 12px/400, monospace 字体
- `.vercel-code` — 13px/400, monospace 字体

**新增视觉效果：**
- `.vercel-mesh-gradient` — Vercel 标志性的多色网格渐变（opacity 0.08，用于 hero 背景）
- `.vercel-mono` — 等宽字体工具类（用于地址、hash 等技术内容）
- 响应式字体断点（768px 以下缩小 display 字号）

### 2. 布局 (`src/app/layout.tsx`)

- 字体配置：Inter (geometric sans) + JetBrains Mono (monospace)，添加 `display: 'swap'` 优化
- 背景色：由 body 全局 CSS 控制为 `--vercel-canvas-soft: #fafafa`
- 移除 body 上的 `bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]` Tailwind 类，改由 CSS 变量全局控制

### 3. 主页面 (`src/app/page.tsx`)

**Header 改造：**
- 替换 `@cinacoin/ui` 的 `SiteHeader` 为自定义 Vercel 风格 header
- 白色背景、64px 高度、hairline 底边框
- Logo 使用 `/logo.png`，配合 "Wallet Explorer" 文字
- 内嵌搜索框：6px 圆角、hairline 边框、36px 高度、搜索图标
- 右侧导航：Docs 链接 + "← Back" 次按钮

**Hero 区域：**
- 白色背景 (`--vercel-canvas`)、底部 hairline 边框
- Vercel 风格 mesh gradient 背景装饰（opacity 0.08）
- 标题使用 `vercel-display-xl`（48px/600/-2.4px letter-spacing）
- 副标题使用 `vercel-body-lg`（18px，`--vercel-body` 色）
- 最大宽度 1400px，居中布局

**钱包卡片 (`WalletCard`)：**
- 使用 `.vercel-card` 组件类（白色背景、8px 圆角、堆叠阴影、hover 增强）
- Logo 容器：8px 圆角、hairline 边框、`--vercel-canvas-soft-2` 背景
- 钱包名称：`vercel-body-md` + `font-medium`，hover 变蓝
- 开发者名：`vercel-caption` + `--vercel-mute` 色
- 描述文字：`vercel-body-sm` + `--vercel-body` 色
- 徽章使用 `.vercel-badge`，语义色徽章（WC v2 蓝、EIP-6963 紫、AA 青、Open Source 橙）

**筛选面板 (`FilterPanel`)：**
- 使用 `.vercel-card` 容器
- 搜索输入框使用 `.vercel-input`
- 下拉选择器使用 `.vercel-input`
- 标签使用 `vercel-caption-mono`（等宽字体、大写风格）
- 复选框使用 `--vercel-radius-sm` 圆角
- 重置按钮使用 `.vercel-btn-secondary`
- 移动端折叠按钮使用 `.vercel-btn-secondary`

**空状态：**
- 8px 圆角、虚线边框、白色背景
- 搜索图标使用 `--vercel-mute` 色
- 标题使用 `vercel-display-md`
- 说明使用 `vercel-body-sm`

**Footer 改造：**
- 替换 `@cinacoin/ui` 的 `SiteFooter` 为自定义 Vercel 风格 footer
- 白色背景、顶部 hairline 边框、64px 上下内边距
- Logo + 描述文字
- 三列链接（Explorer / Developers / Company）
- 列标题使用 `vercel-caption-mono`（等宽大写风格）
- 链接使用 `vercel-body-sm` + `--vercel-body` 色
- 底部版权信息使用 `vercel-caption` + `--vercel-mute` 色

**骨架屏 (`WalletCardSkeleton`)：**
- 使用 `.vercel-card` 容器
- 所有占位元素使用 `--vercel-hairline` 背景色
- 圆角使用 `--vercel-radius-sm/md`

### 4. 404 页面 (`src/app/not-found.tsx`)

- 移除 `@cinacoin/ui` 依赖
- 使用与主页面一致的 Vercel 风格 header 和 footer
- 标题使用 `vercel-display-xl`
- 说明使用 `vercel-body-lg`
- CTA 按钮使用 `.vercel-btn-primary`

### 5. Tailwind 配置 (`tailwind.config.ts`)

扩展 Tailwind 主题以支持 Vercel 设计 token：
- **colors**: `vercel-primary`、`vercel-ink`、`vercel-body`、`vercel-mute`、`vercel-hairline`、`vercel-canvas`、`vercel-canvas-soft`、`vercel-link` 等
- **borderRadius**: `vercel-sm` (6px)、`vercel-md` (8px)、`vercel-lg` (12px)
- **fontFamily**: `vercel-sans` (Geist/Inter stack)、`vercel-mono` (Geist Mono stack)
- **boxShadow**: `vercel-1/2/3` 三级堆叠阴影

## 设计原则遵循

| 原则 | 实现 |
|------|------|
| 墨黑主色 `#171717` | 所有 CTA 按钮、标题文字 |
| 纯白卡片 `#ffffff` | 卡片背景、header 背景 |
| Canvas-soft 页面背景 `#fafafa` | body 全局背景 |
| Hairline 边框 `#ebebeb` | 所有卡片边框、输入框边框、分隔线 |
| 6px 圆角 (in-app) | 按钮、输入框、小组件 |
| 8px 圆角 (cards) | 钱包卡片、内容容器 |
| 堆叠阴影 | 三级阴影系统，inset hairline + multi-offset drop shadow |
| 负字间距 display | `-2.4px` at 48px, `-1.28px` at 32px, `-0.96px` at 24px |
| 等宽字体技术内容 | 标签、计数器、代码类内容使用 mono 字体 |
| 64px header 高度 | 固定 header，白色背景 |
| 链接蓝 `#0070f3` | 链接色、focus 环色 |
| Mesh gradient hero | 多色网格渐变，opacity 0.08，仅 hero 区域 |
| Weight 600 display ceiling | 所有 display 字体最大 600 |
| 1400px 最大宽度 | 内容区域居中，最大 1400px |

## 移除的依赖

- 页面组件不再依赖 `@cinacoin/ui` 的 `SiteHeader` 和 `SiteFooter`
- 页面组件不再使用 `@cinacoin/design-tokens` 的 `cc-*` 类名
- 保留 `@cinacoin/design-tokens` 的 CSS import（不冲突，提供基础 reset）
- 保留 `@cinacoin/wallet-registry` 的数据层依赖

## 文件变更清单

| 文件 | 变更类型 |
|------|----------|
| `src/app/globals.css` | 新增 ~200 行 Vercel 设计 token + 组件类 |
| `src/app/layout.tsx` | 更新字体配置，移除 body 上的 cc-* 类 |
| `src/app/page.tsx` | 全面替换 cc-* 类为 vercel-* 类，自定义 header/footer |
| `src/app/not-found.tsx` | 全面替换为 Vercel 风格，移除 @cinacoin/ui 依赖 |
| `tailwind.config.ts` | 扩展 Vercel 设计 token 到 Tailwind 主题 |
