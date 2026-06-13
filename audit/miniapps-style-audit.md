# Mini Apps 页面风格审查报告

> **审查日期**: 2026-06-13  
> **审查范围**: Telegram App, Farcaster App, Wallet Explorer, Health Status, Demo App, Website  
> **参考标准**: `packages/design-tokens/css/cinacoin.css` + `design-guidelines/DESIGN.md`

---

## 总览

| 应用 | 颜色系统 | 圆角规范 | 暗色模式 | 移动端适配 | 可访问性 | 综合评分 |
|------|---------|---------|---------|-----------|---------|---------|
| Telegram App | ⚠️ | ❌ | ✅ | ✅ | ✅ | C+ |
| Farcaster App | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ | B |
| Wallet Explorer | ⚠️ | ✅ | ✅ | ✅ | ✅ | B+ |
| Health Status | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | B |
| Demo App | ⚠️ | ❌ | ✅ | ✅ | ✅ | B- |
| Website | ⚠️ | ✅ | ✅ | ✅ | ✅ | A- |

---

## 1. 颜色系统

### 现状

| 应用 | 导入 canonical tokens? | 变量命名空间 | 问题 |
|------|----------------------|-------------|------|
| Telegram App | ✅ `@import cinacoin.css` | `--cc-*` (覆盖) | 覆盖 `--cc-primary` 为 Telegram 主题色 `#6c63ff`，与 canonical `#ffffff`/`#171717` 冲突 |
| Farcaster App | ❌ | `--cc-*` (自定义) | 完全自定义变量，不导入 canonical tokens。颜色值与 canonical 不同（如 `--cc-canvas: #0a0a0a` vs canonical `#000000`） |
| Wallet Explorer | ❌ | `--color-*` → `--cc-*` | 使用 `shared-design-system.css` 复制了 canonical tokens 但未导入。hairline 用 hex `#2e2e2e` 而非 canonical `rgba(255,255,255,0.08)` |
| Health Status | ❌ | `--color-*` → `--cc-*` | 同 Wallet Explorer |
| Demo App | ❌ | `--color-*` → `--cc-*` | 同 Wallet Explorer，light theme 用 hex 而非 rgba |
| Website | ❌ | `--color-*` → `--cc-*` | 同 Wallet Explorer，最完整的复制品 |

### 问题

1. **没有应用真正使用 canonical tokens 作为运行时源**：Telegram App 导入了 `cinacoin.css` 但立即覆盖了所有关键变量；其他应用直接复制了变量定义。
2. **Hairline 值不一致**：Canonical 用 `rgba(255,255,255,0.08)`（暗色）/ `rgba(0,0,0,0.08)`（亮色），shared-design-system 用硬编码 hex `#2e2e2e` / `#ebebeb`。
3. **Canvas 背景不一致**：Canonical 暗色模式 `--cc-canvas: #000000`（纯黑），但 Farcaster/Wallet/Health/Demo/Website 都用 `#0a0a0a`。
4. **Link 颜色不一致**：Canonical `--cc-link: #0070f3`，Farcaster 用 `#3b82f6`，Website 暗色用 `#3b82f6`。

### 修复建议

- **P0**: 所有应用统一导入 `@cinacoin/design-tokens/css/cinacoin.css` 作为唯一 token 源
- **P1**: Telegram App 的 Telegram 主题映射应使用新变量名（如 `--tg-button`）而非覆盖 `--cc-primary`
- **P1**: 消除 `shared-design-system.css` 与 canonical tokens 的重复，改为直接 import
- **P2**: 统一 hairline 使用 rgba 格式以保持一致的半透明效果

---

## 2. 圆角规范

### DESIGN.md 标准

| 组件 | 标准值 | Token |
|------|--------|-------|
| 营销 CTA 按钮 | 100px | `--cc-radius-pill` |
| 导航按钮 | 6px | `--cc-radius-sm` |
| 卡片 | 8px | `--cc-radius-md` |
| 大卡片 | 12px | `--cc-radius-lg` |
| 表单输入 | 6px | `--cc-radius-sm` |
| Badge/头像 | 9999px | `--cc-radius-full` |

### 各应用实际值

| 组件 | Telegram | Farcaster | Wallet | Health | Demo | Website |
|------|----------|-----------|--------|--------|------|---------|
| 按钮 | ❌ 4px | ✅ 100px | ✅ 100px | ✅ 100px | ❌ 4px | ✅ 100px |
| 卡片 | ❌ 4px | N/A | ✅ 8px | ❌ 4px | ❌ 4px | ✅ 8px |
| 输入框 | ❌ 4px | N/A | ✅ 6px | ❌ 4px | ✅ 6px | ✅ 6px |
| Nav CTA | N/A | N/A | ✅ 6px | ❌ 4px | ✅ 6px | ✅ 6px |
| Badge | N/A | N/A | ✅ 9999px | ❌ 4px | ✅ 9999px | ✅ 9999px |

### 问题

1. **Telegram App**: 所有 `--cc-radius-*` 都设为 `4px`，完全违反 pill 按钮规范
2. **Demo App**: 同样所有圆角为 `4px`，包括按钮（应为 100px pill）
3. **Health Status**: 卡片和 badge 使用 4px 而非 8px/9999px

### 修复建议

- **P0**: Telegram App — 将 `--cc-radius-pill` 改为 `100px`，按钮使用 `var(--cc-radius-pill)`
- **P0**: Demo App — 同上，按钮必须使用 100px pill
- **P1**: Health Status — 卡片改为 `8px`，badge 改为 `9999px`
- **P2**: 所有应用统一使用 `var(--cc-radius-*)` token 而非硬编码值

---

## 3. 组件风格

### 按钮

| 属性 | 标准 | Telegram | Farcaster | Wallet | Health | Demo | Website |
|------|------|----------|-----------|--------|--------|------|---------|
| 高度 | 48px (lg) / 32px (sm) | 48px ✅ | N/A | 40px ⚠️ | 40px ⚠️ | 40px ⚠️ | 40px ⚠️ |
| 字体 | 16px/500 (lg) | 16px ✅ | N/A | 14px ⚠️ | 14px ⚠️ | 14px ⚠️ | 14px ⚠️ |
| Hover | opacity 0.85 | opacity 0.85 ✅ | bg change | bg change ✅ | bg change ✅ | bg change ✅ | bg change ✅ |

**问题**: 
- Canonical tokens 定义按钮高度为 48px（lg），但 Wallet/Health/Demo/Website 都用 40px
- Canonical 定义按钮字体为 `--text-body-md`（16px），但 shared-design-system 应用都用 `--text-body-sm`（14px）

### 卡片

| 属性 | 标准 | Telegram | Wallet | Health | Website |
|------|------|----------|--------|--------|---------|
| 圆角 | 8px | ❌ 4px | ✅ 8px | ❌ 4px | ✅ 8px |
| Padding | 24px | ✅ 24px | ✅ 24px | ✅ 24px | ✅ 24px |
| Shadow | level1 (inset hairline) | ⚠️ border | ✅ | ✅ | ✅ |

### 输入框

| 属性 | 标准 | Telegram | Wallet | Website |
|------|------|----------|--------|---------|
| 高度 | 40px | ✅ (implicit) | ✅ 40px | ✅ 40px |
| 圆角 | 6px | ❌ 4px | ✅ 6px | ✅ 6px |
| Focus | blue ring + shadow | ⚠️ border-color only | ✅ | ✅ |

---

## 4. 排版一致性

### 字体加载

| 应用 | Geist Sans | Geist Mono | 加载方式 |
|------|-----------|-----------|---------|
| Telegram App | ✅ | ✅ | `@font-face` (local woff2) |
| Farcaster App | ✅ | ✅ | `next/font/local` |
| Wallet Explorer | ✅ | ✅ | `next/font/local` |
| Health Status | ✅ | ✅ | `next/font/local` |
| Demo App | ✅ | ✅ | `next/font/local` |
| Website | ✅ | ✅ | `next/font/local` |

### 字体族变量

| 应用 | Sans 变量 | 值 |
|------|----------|---|
| Canonical | `--font-geist-sans` | Geist Sans, system-ui, -apple-system, sans-serif |
| Telegram | `--cc-font-sans` | 'Geist Sans', -apple-system, ... (无 system-ui) |
| Farcaster | `--font-geist-sans` (via next/font) | ✅ 正确 |
| Wallet/Health/Demo | `--font-sans` | var(--font-geist-sans), system-ui, ... ✅ |
| Website | `--font-sans` | var(--font-geist-sans), 'Inter', system-ui, ... ⚠️ 多了 Inter |

### 问题

1. **Telegram App** 使用 `--cc-text-*` 前缀定义字体大小（如 `--cc-text-display-xl`），而 canonical 使用 `--text-*`（无 `cc-` 前缀）
2. **Website** 在 font-sans 中额外加了 `'Inter'`，其他应用没有
3. **字重上限一致**：所有应用都遵守 max 600 规范 ✅

---

## 5. 移动端适配

### Tab Bar / 底部导航

| 应用 | 实现 | 安全区域 | 触摸目标 |
|------|------|---------|---------|
| Telegram App | ✅ 固定底部 tab bar | ✅ `env(safe-area-inset-bottom)` | ✅ min-width 64px |
| Farcaster App | ⚠️ 网格导航卡片（非 tab bar） | N/A | ✅ min-height 44px |
| Wallet Explorer | ✅ 底部 Navigation 组件 | ✅ | ✅ |
| Health Status | N/A（单页应用） | N/A | ✅ |
| Demo App | ⚠️ 顶部 Header 导航 | N/A | ✅ |
| Website | ⚠️ 顶部 Header 导航 | N/A | ✅ |

### 响应式

| 应用 | 断点 | 移动端优化 |
|------|------|-----------|
| Telegram App | 480px | ✅ padding 调整, 字体缩小 |
| Farcaster App | Tailwind 默认 | ✅ 响应式网格 |
| Wallet Explorer | Tailwind 默认 | ✅ |
| Health Status | Tailwind 默认 | ✅ |
| Demo App | Tailwind 默认 | ✅ 移动端菜单 |
| Website | Tailwind 默认 | ✅ 移动端菜单 |

### 问题

1. **Telegram App** 的 `overflow: hidden` 在 `html, body, #root` 上可能阻止某些辅助功能
2. **Farcaster App** 没有底部 tab bar，对于 Mini App 场景可能不够直觉

---

## 6. 暗色模式

| 应用 | 默认主题 | 支持亮色? | 实现方式 |
|------|---------|----------|---------|
| Telegram App | 暗色 ✅ | ❌ (Telegram 控制) | Telegram WebApp API 主题变量 |
| Farcaster App | 暗色 ✅ | ❌ | 硬编码暗色变量 |
| Wallet Explorer | 暗色 ✅ | ✅ | ThemeProvider + `data-theme` |
| Health Status | 暗色 ✅ | ✅ | ThemeProvider + `data-theme` |
| Demo App | 暗色 ✅ | ✅ | Theme toggle + `data-theme` |
| Website | 暗色 ✅ | ✅ | Theme toggle + `[data-theme='light']` |

### 问题

1. **Farcaster App** 完全没有亮色模式支持，也没有 ThemeProvider
2. **Telegram App** 的亮色模式依赖 Telegram 客户端主题，但 CSS 变量映射不完整（只映射了部分 `--tg-theme-*` 变量）
3. **Website** 的 light theme 定义在 `[data-theme='light']` 选择器中，但 canonical tokens 也使用 `[data-theme='light']`，可能产生冲突

---

## 7. 可访问性

### Skip Link

| 应用 | 有 skip link? |
|------|-------------|
| Telegram App | ❌ |
| Farcaster App | ✅ |
| Wallet Explorer | ❌ |
| Health Status | ❌ |
| Demo App | ❌ |
| Website | ❌ |

### ARIA 使用

| 应用 | ARIA 标签 | 角色标注 | 焦点管理 |
|------|----------|---------|---------|
| Telegram App | ✅ tab/tabpanel | ✅ role="tablist" | ✅ focus-visible |
| Farcaster App | ✅ 丰富 | ⚠️ 基础 | ✅ focus-visible |
| Wallet Explorer | ✅ 表单验证 | ✅ role="status" | ✅ focus-visible |
| Health Status | ✅ 最佳实践 | ✅ role="feed", aria-live | ✅ focus-visible |
| Demo App | ✅ 丰富 | ✅ aria-expanded | ✅ focus-visible |
| Website | ✅ 丰富 | ✅ aria-live, aria-atomic | ✅ focus-visible |

### 触摸目标

| 应用 | 最小 44px? | 实现方式 |
|------|-----------|---------|
| Telegram App | ✅ | CSS min-height on tab items |
| Farcaster App | ✅ | Global CSS rule |
| Wallet Explorer | ⚠️ | 部分组件 (buttons only 32px min) |
| Health Status | ✅ | Global CSS rule |
| Demo App | ✅ | Global CSS rule |
| Website | ✅ | Global CSS rule |

### 问题

1. **大多数应用缺少 skip link**（仅 Farcaster 有）
2. **Wallet Explorer** 的按钮最小触摸目标只有 32px（`min-height: 32px`），低于 WCAG 推荐的 44px
3. **Telegram App** 缺少 skip link

### 修复建议

- **P1**: 所有应用添加 skip link（`<a href="#main-content" class="sr-only focus:not-sr-only ...">`）
- **P1**: Wallet Explorer 将按钮 min-height 提升到 44px
- **P2**: 统一 `prefers-reduced-motion` 处理（Telegram 和 Farcaster 有，其他在 shared-design-system 中有）

---

## 跨应用一致性问题汇总

### 🔴 严重问题 (P0)

1. **圆角系统分裂**: Telegram App 和 Demo App 所有圆角为 4px，完全违反 DESIGN.md 的 100px pill 按钮规范
2. **颜色 token 重复定义**: 5 个应用复制了 canonical tokens 而非导入，导致值漂移
3. **Telegram App 覆盖 canonical 变量**: `--cc-primary` 被覆盖为 Telegram 主题色，破坏了 token 系统的可信度

### 🟡 中等问题 (P1)

4. **按钮尺寸不一致**: Canonical 定义 48px 高，shared-design-system 应用都用 40px
5. **按钮字体不一致**: Canonical 定义 16px，shared-design-system 应用都用 14px
6. **Hairline 格式不一致**: rgba vs hex，导致半透明效果差异
7. **Canvas 背景不一致**: `#000000` vs `#0a0a0a`
8. **Farcaster 缺少亮色模式**: 唯一完全无亮色模式支持的应用
9. **缺少 skip link**: 5/6 应用没有 skip navigation

### 🟢 轻微问题 (P2)

10. **字体栈微差**: Website 多了 `'Inter'`，Telegram 少了 `system-ui`
11. **变量命名前缀不统一**: `--cc-text-*` vs `--text-*` vs `--color-*`
12. **Transition 时长不统一**: `0.15s` vs `0.2s` vs `150ms` vs `200ms`
13. **shared-design-system.css 代码重复**: 3 个应用有几乎相同的文件

---

## 修复优先级路线图

### Phase 1: Token 统一 (1-2 天)

1. 所有应用导入 `@cinacoin/design-tokens/css/cinacoin.css`
2. 删除 `shared-design-system.css` 中的重复 token 定义
3. Telegram App: 将 Telegram 主题映射移到独立变量层（不覆盖 `--cc-*`）

### Phase 2: 圆角修复 (0.5 天)

1. Telegram App: 更新 `--cc-radius-*` 为 canonical 值
2. Demo App: 同上
3. Health Status: 卡片 4px → 8px, badge 4px → 9999px

### Phase 3: 组件尺寸对齐 (0.5 天)

1. 统一按钮高度为 48px (lg) / 32px (sm)
2. 统一按钮字体为 16px (lg) / 14px (sm)
3. 统一 touch target min-height 为 44px

### Phase 4: 可访问性补全 (0.5 天)

1. 所有应用添加 skip link
2. Farcaster App 添加 ThemeProvider
3. 统一 focus-visible 样式

---

## 附录：各应用文件清单

### 样式入口文件

| 应用 | 主 CSS | Token 来源 |
|------|--------|-----------|
| Telegram App | `src/styles/global.css` + `App.css` + `pages.css` | `@import cinacoin.css` + 本地覆盖 |
| Farcaster App | `src/app/globals.css` | 本地自定义（无 canonical import） |
| Wallet Explorer | `src/app/globals.css` → `shared-design-system.css` | 本地复制 |
| Health Status | `src/app/globals.css` → `shared-design-system.css` | 本地复制 |
| Demo App | `src/app/globals.css` → `shared-design-system.css` | 本地复制 |
| Website | `src/app/globals.css` | 本地复制（最完整） |
