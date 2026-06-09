# 审计报告：cloud-dashboard (cloud.cinacoin.com)

**审计日期：** 2026-06-08  
**项目路径：** `/home/cina/.openclaw/workspace/onux/apps/cloud-dashboard`

---

## 1. 全局样式 (src/app/globals.css)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CSS 变量定义设计 token | ✅ 通过 | 通过 `@import "@cinacoin/design-tokens/css/cinacoin.css"` 引入 canonical token，并定义了 `--app-radius`, `--font-sans`, `--font-mono` 等本地变量 |
| 背景色 #fafafa | ✅ 通过 | `body { background: #fafafa; }` 显式声明 |
| 字体栈 Geist/Inter | ⚠️ 部分通过 | CSS 声明 `'Inter', 'Geist', ...` **Inter 优先于 Geist**，与规范（Geist 优先）不一致。`layout.tsx` 仅通过 next/font 加载 Inter，未加载 Geist |

## 2. 色彩合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 主色 #171717 (ink) | ✅ 通过 | 通过 `var(--cc-ink)` 引用 |
| 文字色 #4d4d4d (body) | ✅ 通过 | 通过 `var(--cc-body)` 引用 |
| 文字色 #888888 (mute) | ✅ 通过 | 通过 `var(--cc-muted)` 引用 |
| 边框色 #ebebeb (hairline) | ✅ 通过 | 通过 `var(--cc-hairline)` 引用 |

## 3. 字体合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Display 字体 weight 600 | ✅ 通过 | `.stat-card-value { font-weight: 600; }`；design tokens 中 display 类均为 600 |
| 负字间距正确 | ✅ 通过 | `.stat-card-value { letter-spacing: -1.1px; }`；design tokens 提供完整的负字间距系统 |
| 等宽字体用于数据/地址 | ✅ 通过 | `.data-table th` 使用 `var(--font-mono)`；`ProjectForm` 中钱包地址字段使用 `font-mono` class |

## 4. 组件合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 按钮圆角 6px | ✅ 通过 | `.cc-btn-primary, .cc-btn-primary-sm, .cc-btn-secondary, .cc-btn-secondary-sm { border-radius: var(--app-radius) !important; }` → 6px |
| 卡片圆角 8px | ✅ 通过 | `.cc-card { border-radius: var(--app-radius-lg); }` → 8px；`.stat-card { border-radius: var(--app-radius-lg); }` |
| 卡片阴影（堆叠阴影） | ✅ 通过 | `.stat-card` 使用三层堆叠阴影：`0px 1px 1px rgba(0,0,0,0.03), 0px 2px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08) inset` |
| 输入框 6px 圆角 | ✅ 通过 | `.cc-form-input { border-radius: var(--app-radius) !important; }` → 6px |
| 输入框 40px 高度 | ✅ 通过 | 继承 design tokens `.cc-form-input { height: 40px; }` |
| 数据表格等宽字体表头 | ✅ 通过 | `.data-table th { font-family: var(--font-mono); text-transform: uppercase; }` |

## 5. Logo

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 使用 /logo.png | ✅ 通过 | Header 组件使用 `<Image src="/logo.png">`。但 favicon 使用 `/dashboard/logo.svg`（⚠️ 次要问题） |

## 6. 布局

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Header 高度 64px | ✅ 通过 | Header 使用 `h-16`（Tailwind = 64px）：`<div className="mx-auto flex h-16 max-w-7xl ...">` |
| 侧边栏活跃项 3px 黑色指示条 | ✅ 通过 | `.sidebar-nav-item.active::before { width: 3px; background: var(--cc-ink); }` |

---

## 问题清单

| # | 严重度 | 问题 | 位置 | 修复建议 |
|---|--------|------|------|----------|
| 1 | 🟡 中 | 字体栈顺序：Inter 优先于 Geist | `src/app/globals.css:59` | 改为 `'Geist', 'Inter', system-ui, ...` 以与 backend-dashboard 保持一致 |
| 2 | 🟡 中 | Geist 字体未实际加载 | `src/app/layout.tsx` | 使用 `next/font/local` 加载 Geist/Geist Mono 字体文件 |
| 3 | 🟢 低 | Favicon 使用 SVG 而非 PNG | `src/app/layout.tsx:13` | `icons: { icon: '/dashboard/logo.svg' }` 建议改为 `/logo.png` |

## 总结

| 类别 | 通过率 |
|------|--------|
| 全局样式 | 2/3 (⚠️ 1) |
| 色彩合规 | 4/4 ✅ |
| 字体合规 | 3/3 ✅ |
| 组件合规 | 6/6 ✅ |
| Logo | 1/1 ✅ |
| 布局 | 2/2 ✅ |
| **总计** | **18/19 通过, 1 警告** |

**结论：cloud-dashboard 基本合规。主要问题是字体栈顺序与规范不一致（Inter 优先而非 Geist），且 Geist 字体未实际加载。所有组件尺寸、颜色、阴影均符合设计规范。**
