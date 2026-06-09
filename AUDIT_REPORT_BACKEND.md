# 审计报告：backend-dashboard (admin.cinacoin.com)

**审计日期：** 2026-06-08  
**项目路径：** `/home/cina/.openclaw/workspace/onux/apps/backend-dashboard`

---

## 1. 全局样式 (src/app/globals.css)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CSS 变量定义设计 token | ✅ 通过 | 通过 `@import "@cinacoin/design-tokens/css/cinacoin.css"` 引入 canonical token，并定义了 dashboard 级别的 CSS 变量映射 |
| 背景色 #fafafa | ✅ 通过 | `body { background-color: #fafafa; }` 显式声明，同时 `--cc-canvas-soft` 也映射到 `#fafafa` |
| 字体栈 Geist/Inter | ✅ 通过 | `font-family: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;` Geist 优先 |

## 2. 色彩合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 主色 #171717 (ink) | ✅ 通过 | `--cc-ink: #171717` 在 design tokens 中定义，组件通过 `var(--cc-ink)` 引用 |
| 文字色 #4d4d4d (body) | ✅ 通过 | `--cc-body: #4d4d4d` |
| 文字色 #888888 (mute) | ✅ 通过 | `--cc-muted: #888888` |
| 边框色 #ebebeb (hairline) | ✅ 通过 | `--cc-hairline: #ebebeb` |

## 3. 字体合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Display 字体 weight 600 | ✅ 通过 | design tokens 中 `.cc-display-*` 均使用 `font-weight: 600` |
| 负字间距正确 | ✅ 通过 | Display XL: -2.4px, LG: -1.28px, MD: -0.96px, SM: -0.4px; body-sm: -0.28px |
| 等宽字体用于数据/地址 | ✅ 通过 | `.ds-table-header` 使用 `'Geist Mono', 'JetBrains Mono', ui-monospace...`；`.cc-caption-mono` 用于地址显示 |

## 4. 组件合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 按钮圆角 6px | ✅ 通过 | `.cc-btn-primary, .cc-btn-primary-sm, .cc-btn-secondary, .cc-btn-secondary-sm { border-radius: 6px; }` 覆盖默认 pill |
| 卡片圆角 8px | ✅ 通过 | `.ds-stat-card { border-radius: 8px; }` |
| 卡片阴影（堆叠阴影） | ✅ 通过 | `box-shadow: 0px 1px 1px rgba(0,0,0,0.03), 0px 2px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08) inset;` |
| 输入框 6px 圆角 | ✅ 通过 | 继承 `.cc-form-input { border-radius: var(--cc-radius-sm); }` → 6px |
| 输入框 40px 高度 | ✅ 通过 | `.cc-form-input { height: 40px; }` |
| 数据表格等宽字体表头 | ✅ 通过 | `.ds-table-header` 使用 Geist Mono 等宽字体栈，12px uppercase |

## 5. Logo

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 使用 /logo.png | ✅ 通过 | Header 和 Sidebar 均通过 `<Brand logoSrc="/logo.png" />` 引用；login 页面使用 `<img src="/logo.png" />` |

## 6. 布局

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Header 高度 64px | ✅ 通过 | 使用 `.cc-navbar` 类，design tokens 定义 `height: 64px` |
| 侧边栏活跃项 3px 黑色指示条 | ✅ 通过 | `.sidebar-nav-link[aria-current='page']::before` — `width: 3px; background: var(--cc-ink);` |

---

## 总结

| 类别 | 通过率 |
|------|--------|
| 全局样式 | 3/3 ✅ |
| 色彩合规 | 4/4 ✅ |
| 字体合规 | 3/3 ✅ |
| 组件合规 | 6/6 ✅ |
| Logo | 1/1 ✅ |
| 布局 | 2/2 ✅ |
| **总计** | **19/19 ✅** |

**结论：backend-dashboard 完全符合 Cinacoin 设计规范。** 无违规项。
