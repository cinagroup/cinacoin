# 审计报告：analytics-dashboard (analytics.cinacoin.com)

**审计日期：** 2026-06-08  
**项目路径：** `/home/cina/.openclaw/workspace/onux/apps/analytics-dashboard`

---

## 1. 全局样式 (src/app/globals.css)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CSS 变量定义设计 token | ✅ 通过 | 通过 `@import "@cinacoin/design-tokens/css/cinacoin.css"` 引入 canonical token，并在 `:root` 定义了 `--v-*` 本地 token |
| 背景色 #fafafa | ✅ 通过 | `body { background: var(--cc-canvas-soft); }` → `#fafafa` |
| 字体栈 Geist/Inter | ⚠️ 部分通过 | CSS 声明 `'Geist', 'Inter', ...` 优先 Geist，但 `layout.tsx` 仅通过 next/font 加载了 Inter（`Inter` from `next/font/google`），**未实际加载 Geist 字体**。注释说明 "In production, replace Inter with Geist" |

## 2. 色彩合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 主色 #171717 (ink) | ✅ 通过 | 通过 `var(--cc-ink)` 引用 design token `#171717` |
| 文字色 #4d4d4d (body) | ✅ 通过 | 通过 `var(--cc-body)` 引用 |
| 文字色 #888888 (mute) | ✅ 通过 | 通过 `var(--cc-muted)` 引用 |
| 边框色 #ebebeb (hairline) | ✅ 通过 | 通过 `var(--cc-hairline)` 引用 |

## 3. 字体合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Display 字体 weight 600 | ✅ 通过 | `--v-weight-semibold: 600` 用于标题和 stat value |
| 负字间距正确 | ✅ 通过 | `--v-tracking-xl: -2.4px`, `--v-tracking-lg: -1.28px`, `--v-tracking-md: -0.96px`, `--v-tracking-sm: -0.4px` |
| 等宽字体用于数据/地址 | ✅ 通过 | `.v-table th` 使用 `var(--v-font-mono)`；交易 hash 使用 `fontFamily: 'var(--v-font-mono)'` |

## 4. 组件合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 按钮圆角 6px | ✅ 通过 | `.v-btn-primary, .v-btn-secondary { border-radius: var(--v-radius-sm); }` → 6px |
| 卡片圆角 8px | ✅ 通过 | `.v-stat-card { border-radius: var(--v-radius-md); }` → 8px |
| 卡片阴影（堆叠阴影） | ✅ 通过 | `--v-shadow-card` + `--v-shadow-inset` 组合实现堆叠阴影 |
| 输入框 6px 圆角 | ✅ 通过 | `.v-input { border-radius: var(--v-radius-sm); }` → 6px |
| 输入框 40px 高度 | ✅ 通过 | `.v-input { height: 40px; }` |
| 数据表格等宽字体表头 | ✅ 通过 | `.v-table th { font-family: var(--v-font-mono); text-transform: uppercase; }` |

## 5. Logo

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 使用 /logo.png | ❌ 不通过 | **使用 `/analytics/logo.svg` 而非 `/logo.png`**。favicon 引用 `/analytics/logo.svg`；侧边栏 logo 使用 `<img src="/analytics/logo.svg">`。`/logo.png` 存在于 public 目录但未被引用 |

## 6. 布局

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Header 高度 64px | ⚠️ 不适用 | 该应用采用 sidebar-only 布局，无顶部 header 组件。侧边栏全高布局 |
| 侧边栏活跃项 3px 黑色指示条 | ✅ 通过 | `.v-sidebar-item[data-active='true']::before { width: var(--v-sidebar-active-bar); background: var(--cc-ink); }` → 3px 黑色 |

---

## 问题清单

| # | 严重度 | 问题 | 位置 | 修复建议 |
|---|--------|------|------|----------|
| 1 | 🔴 高 | Logo 使用 SVG 而非 PNG | `src/app/page.tsx:135`, `src/app/layout.tsx:31` | 将 `<img src="/analytics/logo.svg">` 改为 `<img src="/logo.png">`；favicon 改为 `/logo.png` |
| 2 | 🟡 中 | Geist 字体未实际加载 | `src/app/layout.tsx` | 使用 `next/font/local` 加载 Geist/Geist Mono，或至少在 CSS 中保持 Inter-first 以诚实反映实际字体栈 |

## 总结

| 类别 | 通过率 |
|------|--------|
| 全局样式 | 2/3 (⚠️ 1) |
| 色彩合规 | 4/4 ✅ |
| 字体合规 | 3/3 ✅ |
| 组件合规 | 6/6 ✅ |
| Logo | 0/1 ❌ |
| 布局 | 1/1 ✅ (header N/A) |
| **总计** | **16/18 通过, 1 警告, 1 不通过** |

**结论：analytics-dashboard 基本合规，但有 1 个必须修复项（Logo 格式）和 1 个建议改进项（字体加载）。**
