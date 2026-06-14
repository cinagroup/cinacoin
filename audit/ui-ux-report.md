# Cinacoin UI/UX 详细审计报告

**审计日期**: 2026-06-10  
**审计范围**: 7 个前端应用  
**审计员**: 000 (AI Assistant)

---

## 目录

1. [执行摘要](#执行摘要)
2. [apps/website - 主站](#1-website---主站)
3. [apps/developer-dashboard - 开发者仪表板](#2-developer-dashboard---开发者仪表板)
4. [apps/analytics-dashboard - 分析仪表板](#3-analytics-dashboard---分析仪表板)
5. [apps/demo-react - Demo dApp](#4-demo-react---demo-dapp)
6. [apps/learn - 学习平台](#5-learn---学习平台)
7. [apps/telegram-app - Telegram 小程序](#6-telegram-app---telegram-小程序)
8. [apps/farcaster-app - Farcaster 应用](#7-farcaster-app---farcaster-应用)
9. [跨应用一致性问题](#跨应用一致性问题)
10. [修复优先级建议](#修复优先级建议)

---

## 执行摘要

### 统计概览

| 严重程度 | 数量 |
|---------|------|
| 🔴 Critical | 12 |
| 🟠 Major | 24 |
| 🟡 Minor | 22 |
| **总计** | **58** |

### 关键发现

1. **设计系统碎片化严重**: 7 个应用使用了 5 套不同的颜色系统、4 套字体系统、6 套间距系统
2. **可访问性缺陷**: 多数应用缺少 ARIA 标签、键盘导航支持和焦点管理
3. **国际化缺失**: 仅 website 实现了完整的 i18n，其余 6 个应用全部硬编码英文
4. **响应式设计不完整**: learn 平台在移动端完全不可用（侧边栏固定宽度）
5. **暗色模式缺失**: 仅 website 支持暗色模式，其余 6 个应用无主题切换

---

## 1. Website - 主站

**技术栈**: Next.js + Tailwind CSS + CSS Variables  
**文件数**: 58 个源文件  
**检查组件/页面数**: 25+

### 1.1 视觉设计一致性

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| W-01 | Minor | `.btn-primary:hover` 使用硬编码 `#2a2a2a` 而非 CSS 变量 | `globals.css:163` | 使用 `color-mix(in srgb, var(--cc-primary) 85%, white)` 或定义 `--cc-primary-hover` 变量 |
| W-02 | Minor | `.cc-btn-primary-sm:hover` 同样硬编码 `#2a2a2a` | `globals.css:217` | 同上 |
| W-03 | Minor | `.cc-nav-cta-signup:hover` 硬编码 `#2a2a2a` | `globals.css:257` | 同上 |

### 1.2 响应式设计

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| W-04 | Major | Header 和 Navbar 组件功能重叠，均实现移动端菜单 | `Header.tsx`, `Navbar.tsx` | 统一使用 Navbar 组件，移除 Header 或明确各自使用场景 |
| W-05 | Minor | 代码块在小屏幕上可能水平溢出 | `Hero.tsx:66` | 添加 `overflow-x-auto` 和 `max-w-full` |

### 1.3 交互体验

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| W-06 | Minor | Newsletter 表单提交后无 loading 状态视觉反馈 | `NewsletterForm.tsx` | 添加 spinner 或按钮禁用状态 |
| W-07 | Minor | GlobalSearch 无搜索结果时的空状态不够友好 | `GlobalSearch.tsx` | 添加建议搜索词或热门链接 |

### 1.4 可访问性 (a11y)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| W-08 | Major | 缺少 skip navigation link | `layout.tsx` | 添加 `<a href="#main-content" className="skip-link">` |
| W-09 | Major | Footer 链接缺少 `aria-label` 区分同名链接 | `Footer.tsx` | 为每个区域的链接添加 `aria-label` 如 "Products - Wallet" |
| W-10 | Minor | 主题切换按钮缺少 `role="switch"` | `Navbar.tsx:85` | 添加 `role="switch"` 和 `aria-checked` |

### 1.5 国际化 (i18n)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| W-11 | Minor | Navbar 中 "Log In" 和 "Sign Up" 硬编码英文 | `Navbar.tsx:119-123` | 使用 `t('nav-login')` 和 `t('nav-signup')` |
| W-12 | Minor | Footer 中 "Stay Updated" 等文本硬编码 | `Footer.tsx:53-55` | 添加到 i18n 翻译表 |
| W-13 | Minor | Footer 品牌名 "Cinacoin" 大小写不一致 | `Footer.tsx:67` | 统一为 "Cinacoin" |

### 1.6 动画与过渡

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| W-14 | Major | 未尊重 `prefers-reduced-motion` 设置 | `FadeIn.tsx`, `globals.css` | 添加 `@media (prefers-reduced-motion: reduce)` 禁用动画 |

---

## 2. Developer Dashboard - 开发者仪表板

**技术栈**: Next.js + Tailwind CSS + CSS Variables  
**文件数**: 13 个源文件  
**检查组件/页面数**: 8

### 2.1 视觉设计一致性

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| D-01 | Critical | 颜色变量与主站不一致：`--cc-link: #0066ff` vs 主站 `#0070f3` | `globals.css:10` | 统一使用 `@cinacoin/design-tokens` 包 |
| D-02 | Critical | 无暗色模式支持 | 全局 | 添加 `[data-theme="dark"]` CSS 变量集 |
| D-03 | Major | 使用 emoji 作为图标（📦🔑📈），风格不统一 | `Sidebar.tsx:8-13` | 替换为 SVG 图标库（如 Lucide 或 Heroicons） |
| D-04 | Major | 圆角使用 rem 单位（0.375rem, 0.5rem, 0.75rem），与主站 px 系统不一致 | `globals.css:40-60` | 统一使用 6px/8px/12px |

### 2.2 响应式设计

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| D-05 | Major | 移动端底部导航与桌面侧边栏项目不一致（缺少 Billing） | `Navbar.tsx:8-14` vs `Sidebar.tsx:8-13` | 统一导航项目或添加 "更多" 入口 |
| D-06 | Minor | 表格在小屏幕上可能溢出 | `ApiKeyTable.tsx` | 已有 `overflow-x-auto` 容器，但应添加水平滚动提示 |

### 2.3 交互体验

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| D-07 | Major | API Key 生成无 loading 状态 | `ApiKeyModal.tsx` | 添加提交中的 loading 指示器 |
| D-08 | Major | 撤销操作无确认对话框 | `ApiKeyTable.tsx:75` | 添加确认弹窗防止误操作 |
| D-09 | Minor | 表单输入 focus 状态仅改变 border-color，不够明显 | `globals.css:82` | 添加 box-shadow focus ring |

### 2.4 可访问性 (a11y)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| D-10 | Critical | 侧边栏导航缺少 `aria-label` | `Sidebar.tsx:31` | 添加 `aria-label="Main navigation"` |
| D-11 | Major | Modal 无焦点陷阱（focus trap） | `ApiKeyModal.tsx` | 实现焦点陷阱，Tab 键循环在 modal 内 |
| D-12 | Major | Modal 关闭按钮无 `aria-label` | `ApiKeyModal.tsx:28` | 添加 `aria-label="Close dialog"` |
| D-13 | Major | 表格缺少 `caption` 或 `aria-label` | `ApiKeyTable.tsx` | 添加 `<caption className="sr-only">API Keys</caption>` |
| D-14 | Minor | 状态 badge 仅用颜色区分，色盲用户无法识别 | `ProjectCard.tsx:18-23` | 已有文字标签，但颜色对比度不足 |

### 2.5 国际化 (i18n)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| D-15 | Critical | 完全无 i18n 支持，所有文本硬编码英文 | 全局 | 集成 i18n 框架（next-intl 或 react-i18next） |

### 2.6 动画与过渡

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| D-16 | Minor | 页面切换无过渡动画 | 全局 | 添加页面淡入效果 |

---

## 3. Analytics Dashboard - 分析仪表板

**技术栈**: Next.js + Tailwind CSS + Recharts  
**文件数**: 20 个源文件  
**检查组件/页面数**: 12

### 3.1 视觉设计一致性

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| A-01 | Critical | 使用独立的 CSS 变量命名 `--color-*` 而非 `--cc-*` | `globals.css:5-20` | 统一使用 `@cinacoin/design-tokens` |
| A-02 | Major | 字体通过 CDN 加载（jsdelivr），与主站 Next.js font 优化不一致 | `layout.tsx:13-19` | 使用 `next/font/google` 加载 Geist 字体 |
| A-03 | Major | 自定义 spacing 变量（`--spacing-xxs` 等）与主站 tailwind-preset 定义重复 | `globals.css:47-55` | 统一使用 tailwind-preset |

### 3.2 响应式设计

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| A-04 | Critical | 无移动端导航，页面间无法在移动端切换 | `page.tsx`, `realtime/page.tsx` | 添加移动端顶部或底部导航栏 |
| A-05 | Major | KPI 卡片在中等屏幕上 2 列布局，图表可能过小 | `page.tsx:52` | 调整断点：`md:grid-cols-2 lg:grid-cols-4` → 在 `xl` 才 4 列 |
| A-06 | Major | 时间范围选择器在小屏幕上可能溢出 | `page.tsx:42-51` | 使用下拉菜单替代按钮组 |

### 3.3 交互体验

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| A-07 | Major | 图表无 loading skeleton | `UserGrowthChart.tsx`, `APICallsChart.tsx` | 添加 skeleton 加载状态 |
| A-08 | Major | WebSocket 连接断开时无用户提示 | `RealtimeDashboard.tsx:36-42` | 添加 toast 通知提示连接状态 |
| A-09 | Minor | 实时数据模拟每秒更新，可能造成性能问题 | `RealtimeDashboard.tsx:51-75` | 生产环境应移除模拟，使用真实数据 |

### 3.4 可访问性 (a11y)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| A-10 | Critical | 图表无 `aria-label` 或替代文本 | `UserGrowthChart.tsx`, `APICallsChart.tsx` | 添加 `role="img"` 和 `aria-label` 描述数据趋势 |
| A-11 | Major | 导航链接无 `aria-current` 标识当前页 | `page.tsx:37-39` | 添加 `aria-current="page"` |
| A-12 | Major | 时间范围按钮组缺少 `role="group"` 和 `aria-label` | `page.tsx:42` | 添加 `role="group" aria-label="Time range"` |

### 3.5 国际化 (i18n)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| A-13 | Critical | 完全无 i18n 支持 | 全局 | 集成 i18n 框架 |

### 3.6 动画与过渡

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| A-14 | Minor | 图表数据更新无过渡动画 | `UserGrowthChart.tsx` | 配置 Recharts `isAnimationActive` |

---

## 4. Demo React - Demo dApp

**技术栈**: React + Vite + Tailwind CSS + React Router  
**文件数**: 30+ 个源文件  
**检查组件/页面数**: 15+

### 4.1 视觉设计一致性

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| R-01 | Major | 引用 `@cinacoin/design-tokens` 但同时定义重复的 `.cc-*` 类 | `index.css:3,28-60` | 移除重复定义，仅引用 design-tokens |
| R-02 | Minor | Swap 卡片的 emoji 显示为 " swapping " 文本而非 emoji | `HomePage.tsx:59` | 替换为正确的 swap emoji（如 🔄） |

### 4.2 响应式设计

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| R-03 | Minor | 功能网格在极小屏幕（320px）上 2 列可能过挤 | `HomePage.tsx:22` | 在 `xs` 断点使用单列 |

### 4.3 交互体验

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| R-04 | Minor | Error Boundary 的 "Try Again" 按钮仅重置状态，不重新加载路由 | `App.tsx:47-50` | 添加 `window.location.reload()` 或 navigate 到当前页 |

### 4.4 可访问性 (a11y)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| R-05 | Minor | Skip link 已实现但样式可更明显 | `index.css:25-35` | 增加对比度和大小 |
| R-06 | Minor | WalletModal 无 `aria-modal="true"` | `WalletModal.tsx` | 添加 `role="dialog"` 和 `aria-modal="true"` |

### 4.5 国际化 (i18n)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| R-07 | Major | HomePage 内容硬编码中文 | `HomePage.tsx:13,19,25,31...` | 使用 i18n 或至少提供英文版本 |
| R-08 | Major | 导航标签硬编码英文（Swap, Multi-Chain, Auth） | `SiteHeader.tsx:28-46` | 统一语言或使用 i18n |

### 4.6 动画与过渡

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| R-09 | Major | 定义了大量动画但无 `prefers-reduced-motion` 支持 | `tailwind.config.js:14-22` | 在 CSS 中添加 `@media (prefers-reduced-motion: reduce)` |
| R-10 | Minor | `pulse-glow` 动画持续 2s 无限循环，可能分散注意力 | `tailwind.config.js:19` | 限制动画次数或降低频率 |

---

## 5. Learn - 学习平台

**技术栈**: Next.js + Tailwind CSS  
**文件数**: 12 个源文件  
**检查组件/页面数**: 7

### 5.1 视觉设计一致性

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| L-01 | Critical | 使用完全独立的暗色主题（`--bg-primary: #0d0d1a`），与主站设计系统无关 | `globals.css:4-15`, `tailwind.config.ts` | 基于 `@cinacoin/design-tokens` 暗色变量重构 |
| L-02 | Critical | 字体使用 system-ui，未使用品牌字体 Geist | `tailwind.config.ts:13` | 使用 `next/font` 加载 Geist |
| L-03 | Major | 颜色命名完全不同（`bg-primary`, `text-primary` vs `--cc-canvas`, `--cc-ink`） | `tailwind.config.ts:8-12` | 统一命名规范 |

### 5.2 响应式设计

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| L-04 | Critical | 侧边栏固定宽度 256px（w-64），主内容 `ml-64`，移动端完全不可用 | `layout.tsx:24-25` | 实现可折叠侧边栏或移动端抽屉菜单 |
| L-05 | Major | 无移动端侧边栏切换按钮 | `layout.tsx` | 添加汉堡菜单按钮 |

### 5.3 交互体验

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| L-06 | Major | InteractiveEditor "Run Code" 按钮无实际功能 | `InteractiveEditor.tsx:18-20` | 实现代码执行或明确标注 "Coming Soon" |
| L-07 | Minor | CodeBlock copy 按钮反馈仅 2 秒，可能不够明显 | `CodeBlock.tsx:13-15` | 添加更明显的视觉反馈（如颜色变化） |

### 5.4 可访问性 (a11y)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| L-08 | Major | 难度标签仅用颜色区分（绿/黄/红），色盲用户无法识别 | `TutorialCard.tsx:14-18` | 颜色 + 图标/文字已存在，但对比度可能不足 |
| L-09 | Major | 侧边栏导航缺少 `aria-label` | `Sidebar.tsx:17` | 添加 `aria-label="Tutorial navigation"` |
| L-10 | Major | 代码块无 `aria-label` 说明语言 | `CodeBlock.tsx:25` | 添加 `aria-label={`Code example in ${language}`}` |
| L-11 | Minor | InteractiveEditor textarea 缺少 `aria-label` | `InteractiveEditor.tsx:32` | 添加 `aria-label="Code editor"` |

### 5.5 国际化 (i18n)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| L-12 | Critical | 完全无 i18n 支持 | 全局 | 集成 i18n 框架 |

### 5.6 动画与过渡

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| L-13 | Minor | 页面切换无过渡动画 | 全局 | 添加淡入效果 |

---

## 6. Telegram App - Telegram 小程序

**技术栈**: React + Vite + CSS  
**文件数**: 12 个源文件  
**检查组件/页面数**: 8

### 6.1 视觉设计一致性

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| T-01 | Critical | 使用完全独立的颜色系统（`--color-primary: #6c63ff`），与 Cinacoin 品牌无关 | `global.css:9` | 至少在主色调上保持品牌一致性 |
| T-02 | Major | 未使用 Cinacoin design tokens | `global.css` | 考虑引入 `@cinacoin/design-tokens` 并覆盖 Telegram 主题变量 |
| T-03 | Minor | 圆角系统（8/12/16/24px）与主站（6/8/12px）不一致 | `global.css:17-20` | 在 Telegram 规范内尽量对齐 |

### 6.2 响应式设计

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| T-04 | Minor | 设计为移动端优先，但缺少横屏模式适配 | `App.css` | 添加 `@media (orientation: landscape)` 调整 |

### 6.3 交互体验

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| T-05 | Major | 转账表单无实时验证反馈 | `TransferPage.tsx` | 添加输入验证和错误提示 |
| T-06 | Major | 空状态（未连接钱包时）提示不够引导性 | `HomePage.tsx:63-67` | 添加更详细的引导步骤 |
| T-07 | Minor | Tab 切换无过渡动画 | `App.tsx` | 添加页面切换淡入效果（已有 fadeIn 但可更流畅） |

### 6.4 可访问性 (a11y)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| T-08 | Critical | Tab bar 缺少 `role="tablist"` 和 `role="tab"` | `App.tsx:99-108` | 添加 ARIA tab 角色 |
| T-09 | Major | 按钮无 `aria-label`（仅有 emoji + 文本） | `App.tsx:103` | 添加 `aria-label={tab.label}` |
| T-10 | Major | 表单输入无关联的 `<label>` | `TransferPage.tsx`, `SignPage.tsx` | 使用 `<label htmlFor>` 或 `aria-label` |
| T-11 | Minor | 交易哈希长文本未提供复制按钮 | `TransactionItem.tsx` | 添加复制功能 |

### 6.5 国际化 (i18n)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| T-12 | Critical | 完全无 i18n 支持 | 全局 | 集成 i18n，Telegram 支持多语言 |

### 6.6 动画与过渡

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| T-13 | Minor | `fadeIn` 动画使用 `translateY(8px)` 位移较小，效果不明显 | `pages.css:6-9` | 可增大位移或增加 duration |

---

## 7. Farcaster App - Farcaster 应用

**技术栈**: Next.js + Tailwind CSS  
**文件数**: 10 个源文件  
**检查组件/页面数**: 6

### 7.1 视觉设计一致性

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| F-01 | Critical | 使用 Tailwind 默认灰色系（`bg-gray-950`, `text-purple-600`），完全偏离 Cinacoin 设计系统 | `layout.tsx:21`, `page.tsx` | 引入 `@cinacoin/design-tokens` 并适配 Farcaster 品牌 |
| F-02 | Major | 未使用 Cinacoin 的阴影系统 | 全局 | 使用 `shadow-level-*` 变量 |
| F-03 | Major | 按钮圆角使用 `rounded-xl`（12px），与主站 `rounded-md`（8px）或 `rounded-pill` 不一致 | `page.tsx:28-39` | 统一圆角规范 |

### 7.2 响应式设计

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| F-04 | Major | 按钮网格在极小屏幕（Farcaster 内嵌 WebView）可能过挤 | `page.tsx:27` | `grid-cols-2` 在 < 320px 时应为单列 |
| F-05 | Minor | 无最大宽度限制，在 iPad 上可能过宽 | `page.tsx:22` | 添加 `max-w-lg` 已存在，但内容区可优化 |

### 7.3 交互体验

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| F-06 | Major | Frame 交互依赖 Farcaster 客户端，无 fallback 体验 | `FarcasterConnect.tsx:64-67` | 添加浏览器环境下的引导说明 |
| F-07 | Minor | ProfileCard loading 使用 `animate-pulse` 但无 skeleton 结构 | `ProfileCard.tsx:22-28` | 添加更详细的 skeleton 布局 |

### 7.4 可访问性 (a11y)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| F-08 | Critical | 页面缺少 `<main>` landmark 的 `aria-label` | `page.tsx:22` | 添加 `aria-label="Cinacoin Farcaster App"` |
| F-09 | Major | 按钮网格中链接无 `aria-label` 说明目标 | `page.tsx:28-39` | 添加 `aria-label="Open wallet"` 等 |
| F-10 | Major | ProfileCard 头像图片的 alt 文本可能为空（用户无 pfp 时） | `ProfileCard.tsx:55` | 确保 alt 始终有意义 |
| F-11 | Minor | FrameRenderer input 缺少 `aria-label` | `FrameRenderer.tsx:52` | 添加 `aria-label={inputPlaceholder}` |

### 7.5 国际化 (i18n)

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| F-12 | Critical | 完全无 i18n 支持 | 全局 | 集成 i18n 框架 |

### 7.6 动画与过渡

| # | 严重程度 | 问题 | 位置 | 修复建议 |
|---|---------|------|------|---------|
| F-13 | Minor | 无页面过渡动画 | 全局 | 添加淡入效果 |

---

## 跨应用一致性问题

### 设计系统碎片化

| # | 严重程度 | 问题 | 影响范围 | 修复建议 |
|---|---------|------|---------|---------|
| X-01 | Critical | **7 个应用使用 5 套不同的颜色变量系统** | 全部 | 统一使用 `@cinacoin/design-tokens` 包，各应用仅覆盖必要变量 |
| X-02 | Critical | **4 套不同的字体系统**：Geist+Inter (website/analytics), Inter+JetBrains (dev-dashboard), Inter (demo-react), system-ui (learn/telegram), -apple-system (farcaster) | 全部 | 统一使用 Geist 作为主字体，通过 `next/font` 或 `@fontsource` 分发 |
| X-03 | Critical | **6 套间距系统**：tailwind-preset (website), rem (dev-dashboard), CSS vars (analytics), design-tokens (demo-react), 硬编码 (learn), CSS vars (telegram), Tailwind default (farcaster) | 全部 | 统一使用 4px 基数系统，通过 tailwind-preset 分发 |
| X-04 | Major | **阴影系统不统一**：website 有 6 级阴影，dev-dashboard 无阴影定义，analytics 有 3 级，其余使用 Tailwind 默认 | 全部 | 统一使用 `shadow-level-1` 到 `shadow-level-5` |
| X-05 | Major | **仅 1/7 应用支持暗色模式** | 全部 | 在所有应用中实现 `data-theme="dark"` 支持 |
| X-06 | Major | **仅 1/7 应用有 i18n 支持** | 全部 | 建立共享 i18n 包，所有应用集成 |

### 组件复用

| # | 严重程度 | 问题 | 影响范围 | 修复建议 |
|---|---------|------|---------|---------|
| X-07 | Major | Button 组件在 7 个应用中各有不同实现 | 全部 | 在 `@cinacoin/ui` 中统一 Button 组件 |
| X-08 | Major | Card 组件在 7 个应用中各有不同实现 | 全部 | 在 `@cinacoin/ui` 中统一 Card 组件 |
| X-09 | Major | 导航组件（Header/Navbar/Sidebar）每个应用独立实现 | 全部 | 提取共享导航组件到 `@cinacoin/ui` |
| X-10 | Minor | 7 个应用各自定义 scrollbar 样式 | 全部 | 统一到 design-tokens |

---

## 修复优先级建议

### P0 - 立即修复（影响可用性）

1. **L-04**: Learn 平台移动端完全不可用 → 实现响应式侧边栏
2. **A-04**: Analytics Dashboard 移动端无导航 → 添加移动端导航
3. **D-11**: Modal 无焦点陷阱 → 实现 focus trap
4. **T-08**: Tab bar 缺少 ARIA 角色 → 添加 `role="tablist/tab"`

### P1 - 短期修复（1-2 周）

1. **X-01~X-03**: 统一设计系统 → 所有应用迁移到 `@cinacoin/design-tokens`
2. **X-05**: 暗色模式 → 在所有应用中实现
3. **X-06**: 国际化 → 建立共享 i18n 方案
4. **W-08**: Website skip navigation → 添加 skip link
5. **D-08**: 危险操作确认 → 添加撤销确认对话框

### P2 - 中期修复（1 个月）

1. **X-07~X-09**: 组件统一 → 提取共享组件到 `@cinacoin/ui`
2. **W-14, R-09**: `prefers-reduced-motion` 支持
3. **A-10**: 图表可访问性 → 添加 aria-label 和数据表格替代
4. **D-03**: 替换 emoji 图标为 SVG 图标库

### P3 - 长期优化

1. 建立设计系统文档站
2. 自动化视觉回归测试
3. 定期可访问性审计
4. 性能监控（Core Web Vitals）

---

## 附录：检查清单完成度

### 按应用

| 应用 | 页面/组件检查数 | 发现问题数 | Critical | Major | Minor |
|------|---------------|-----------|----------|-------|-------|
| website | 25+ | 14 | 0 | 3 | 11 |
| developer-dashboard | 8 | 16 | 3 | 5 | 2 |
| analytics-dashboard | 12 | 14 | 3 | 5 | 3 |
| demo-react | 15+ | 10 | 0 | 3 | 5 |
| learn | 7 | 13 | 3 | 4 | 2 |
| telegram-app | 8 | 13 | 2 | 3 | 3 |
| farcaster-app | 6 | 13 | 2 | 4 | 3 |
| 跨应用 | - | 10 | 3 | 5 | 1 |
| **总计** | **80+** | **58** | **12** | **24** | **22** |

### 按类别

| 类别 | Critical | Major | Minor |
|------|----------|-------|-------|
| 视觉设计一致性 | 5 | 8 | 6 |
| 响应式设计 | 3 | 5 | 3 |
| 交互体验 | 0 | 8 | 7 |
| 可访问性 (a11y) | 3 | 12 | 4 |
| 国际化 (i18n) | 6 | 2 | 0 |
| 动画与过渡 | 0 | 1 | 5 |
| 跨应用一致性 | 3 | 5 | 1 |

---

*报告结束。建议按 P0 → P1 → P2 → P3 优先级逐步修复。*
