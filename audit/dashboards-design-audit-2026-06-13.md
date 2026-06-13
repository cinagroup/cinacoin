# Dashboard DESIGN.md 合规性审计报告

**审计日期**: 2026-06-13  
**审计范围**: 5 个 Dashboard 应用  
**设计规范**: `/design-guidelines/DESIGN.md`  

---

## 审计概要

| 应用 | 合规评分 | 严重问题 | 中等问题 | 轻微问题 |
|------|---------|---------|---------|---------|
| analytics-dashboard | 72/100 | 2 | 3 | 4 |
| developer-dashboard | 78/100 | 1 | 2 | 3 |
| backend-dashboard | 80/100 | 1 | 2 | 3 |
| cloud-dashboard | 76/100 | 1 | 3 | 3 |
| unified-dashboard | 82/100 | 1 | 2 | 2 |

**整体合规评分: 77.6/100**

---

## 1. 颜色系统

### 1.1 `--cc-primary` (#171717) 作为主按钮背景

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | `globals.css:146` `.cc-btn-primary { background: var(--cc-ink) }` — 使用 `--cc-ink` 而非 `--cc-primary`，但值相同 #171717 |
| developer-dashboard | ✅ | `globals.css:151` `.cc-btn-primary` 使用 `var(--cc-primary)` |
| backend-dashboard | ✅ | `shared-design-system.css:336` `.cc-btn-primary` 使用 `var(--cc-primary)` |
| cloud-dashboard | ✅ | `shared-design-system.css:341` `.cc-btn-primary` 使用 `var(--cc-primary)` |
| unified-dashboard | ✅ | `shared-design-system.css:339` `.cc-btn-primary` 使用 `var(--cc-primary)` |

### 1.2 `--cc-link` (#0070f3) 作为链接颜色

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | 通过 `@cinacoin/design-tokens` 引入 |
| developer-dashboard | ✅ | 通过 token 系统 |
| backend-dashboard | ✅ | 通过 token 系统 |
| cloud-dashboard | ✅ | `shared-design-system.css` 定义 `--color-link: #0070f3` |
| unified-dashboard | ✅ | `shared-design-system.css` 定义 `--color-link: #0070f3` |

### 1.3 `--cc-canvas-soft` (#fafafa) 作为页面背景

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ⚠️ | `globals.css:30` body 使用 `var(--cc-canvas)` (#ffffff) 而非 `--cc-canvas-soft` (#fafafa) |
| developer-dashboard | ✅ | `globals.css` body `background: var(--cc-canvas-soft)` |
| backend-dashboard | ✅ | 通过 shared-design-system.css |
| cloud-dashboard | ✅ | `shared-design-system.css` body `background: var(--color-canvas-soft)` |
| unified-dashboard | ✅ | `shared-design-system.css` body `background: var(--color-canvas-soft)` |

**问题**:
- ❌ `apps/analytics-dashboard/src/app/globals.css:30` — body 背景使用 `var(--cc-canvas)` 而非 `var(--cc-canvas-soft)`

### 1.4 硬编码颜色值

| 应用 | 合规 | 硬编码数量 |
|------|------|-----------|
| analytics-dashboard | ⚠️ | ~55 处（主要在图表组件中） |
| developer-dashboard | ✅ | 0 处 |
| backend-dashboard | ⚠️ | ~20 处（图表数据颜色） |
| cloud-dashboard | ✅ | 仅第三方品牌 logo SVG（Google/Discord） |
| unified-dashboard | ✅ | 仅 Tailwind fallback 值 |

**具体问题**:

**analytics-dashboard** (严重):
- `src/components/UserGrowthChart.tsx:40-41,58` — 硬编码 `#0070f3`
- `src/components/RegionDistribution.tsx:7-11` — 硬编码 `#0070f3`, `#7928ca`, `#0091ff`, `#f5a623`, `#737373`
- `src/components/ChainDistribution.tsx:14-35` — 硬编码 `#627eea`, `#8247e5`, `#28a0f0`, `#ff0420`, `#0052ff`, `#737373`
- `src/components/TransactionAnalytics.tsx:79-80,132,136` — 硬编码 `#0070f3`
- `src/components/WalletFunnel.tsx:21-51,64` — 硬编码 `#f6851b`, `#3b99fc`, `#0052ff`, `#ab9ff2`, `#0070f3`
- `src/components/RetentionCurve.tsx:53,221-227` — 硬编码 `#0070f3`, `#7928ca`, `#0091ff`, `#f5a623`, `#059669`, `#ee0000`, `#737373`

**backend-dashboard** (中等):
- `src/app/push-server/page.tsx:16-18,109-110` — 硬编码 `#007aff`, `#34a853`, `#f5a623`, `#0070f3`
- `src/app/analytics/page.tsx:23-29,42-45` — 硬编码 `#627EEA`, `#8247E5`, `#F0B90B`, `#28A0F0`, `#FF0420`, `#9945FF`, `#F7931A`, `#0070f3`, `#29bc9b`, `#7928ca`
- `src/app/relay-server/page.tsx:19-23,103-104` — 硬编码 `#627eea`, `#8247e5`, `#28a0f0`, `#ff0420`, `#9945ff`, `#29bc9b`
- `src/app/rpc-proxy/page.tsx:15-19` — 硬编码链品牌色
- `src/app/notify-server/page.tsx:103` — 硬编码 `#f5a623`

> **说明**: 图表中的数据系列颜色（链品牌色如 Ethereum `#627eea`）属于数据可视化范畴，可接受硬编码。但 `#0070f3` 等系统色应使用 CSS 变量。

---

## 2. 排版系统

### 2.1 标题使用 Geist 字体、weight 600

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | `layout.tsx` 加载 Geist SemiBold (600); `globals.css` display 类均使用 `--weight-semibold` (600) |
| developer-dashboard | ✅ | `layout.tsx` 加载 Geist Regular/Medium/SemiBold |
| backend-dashboard | ✅ | `layout.tsx` 加载 Geist Regular/Medium/SemiBold |
| cloud-dashboard | ✅ | `layout.tsx` 加载 Geist Regular/Medium/SemiBold |
| unified-dashboard | ✅ | `layout.tsx` 加载 Geist Regular/Medium/SemiBold |

### 2.2 Sentence-case + period-terminated 标题

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | `"CinaCoin analytics."` — sentence-case + period |
| developer-dashboard | ✅ | 标题均为 sentence-case |
| backend-dashboard | ✅ | `"Backend dashboard."` — sentence-case + period |
| cloud-dashboard | ✅ | 标题均为 sentence-case |
| unified-dashboard | ✅ | `"Unified dashboard."` — sentence-case + period |

### 2.3 caption-mono 使用 Geist Mono

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | `globals.css:195` `.cc-mono` 使用 `var(--font-geist-mono)` |
| developer-dashboard | ✅ | 通过 Tailwind `font-mono` 类映射到 Geist Mono |
| backend-dashboard | ✅ | `shared-design-system.css` `.cc-caption-mono` 使用 `var(--font-mono)` |
| cloud-dashboard | ✅ | `shared-design-system.css` `.cc-caption-mono` 使用 `var(--font-mono)` |
| unified-dashboard | ✅ | `shared-design-system.css:299` `.cc-caption-mono` 使用 `var(--font-mono)` |

---

## 3. 间距系统

### 3.1 使用 4px 基准的间距 token

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | 通过 `@cinacoin/design-tokens` 和 `--cc-*` token |
| developer-dashboard | ✅ | 使用 `var(--cc-xs)`, `var(--cc-sm)`, `var(--cc-md)` 等 |
| backend-dashboard | ✅ | 使用 token 系统 |
| cloud-dashboard | ✅ | 使用 token 系统 |
| unified-dashboard | ✅ | 使用 token 系统 |

### 3.2 卡片 padding 为 24px

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | `globals.css:130` `.cc-card { padding: var(--cc-lg) }` — `--cc-lg` = 24px |
| developer-dashboard | ✅ | 通过 shared-design-system.css |
| backend-dashboard | ✅ | `shared-design-system.css:316` `.cc-card { padding: 24px }` |
| cloud-dashboard | ✅ | `shared-design-system.css:313` `.cc-card { padding: 24px }` |
| unified-dashboard | ✅ | `shared-design-system.css:316` `.cc-card { padding: 24px }` |

---

## 4. 圆角系统

### 4.1 主按钮为 100px pill

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | `globals.css:151` `border-radius: var(--cc-radius-pill)` = 100px |
| developer-dashboard | ✅ | `globals.css` 使用 `var(--cc-radius-pill)` |
| backend-dashboard | ✅ | `shared-design-system.css:341` `border-radius: var(--cc-radius-pill)` = 100px |
| cloud-dashboard | ✅ | `shared-design-system.css:346` `border-radius: var(--cc-radius-pill)` = 100px |
| unified-dashboard | ✅ | `shared-design-system.css:344` `border-radius: var(--cc-radius-pill)` = 100px |

### 4.2 卡片为 8px

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ✅ | `globals.css:129` `border-radius: var(--cc-radius-md)` = 8px |
| developer-dashboard | ✅ | 使用 `var(--cc-radius-md)` |
| backend-dashboard | ✅ | `shared-design-system.css:314` `border-radius: 8px` |
| cloud-dashboard | ✅ | `shared-design-system.css:312` `border-radius: var(--cc-radius-md)` = 8px |
| unified-dashboard | ✅ | `shared-design-system.css:314` `border-radius: var(--cc-radius-md)` = 8px |

### 4.3 导航按钮为 6px

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ⚠️ | 未找到明确的 nav-cta 组件 |
| developer-dashboard | ✅ | 使用 `var(--cc-radius-sm)` = 6px |
| backend-dashboard | ✅ | `shared-design-system.css` `.cc-nav-cta-signup` 使用 `var(--cc-radius-sm)` = 6px |
| cloud-dashboard | ✅ | `shared-design-system.css` `.cc-nav-cta-signup` 使用 `var(--cc-radius-sm)` = 6px |
| unified-dashboard | ✅ | `shared-design-system.css` `.cc-nav-cta-signup` 使用 `var(--cc-radius-sm)` = 6px |

---

## 5. 组件规范

### 5.1 button-primary 高度为 48px

| 应用 | 合规 | 实际值 | 详情 |
|------|------|--------|------|
| analytics-dashboard | ❌ | 40px | `globals.css:146` `.cc-btn-primary { height: 40px }` |
| developer-dashboard | ❌ | 40px | `globals.css:151` `.cc-btn-primary { height: 40px }` |
| backend-dashboard | ❌ | 40px | `shared-design-system.css:336` `.cc-btn-primary { height: 40px }` |
| cloud-dashboard | ❌ | 40px | `shared-design-system.css:341` `.cc-btn-primary { height: 40px }` |
| unified-dashboard | ❌ | 40px | `shared-design-system.css:339` `.cc-btn-primary { height: 40px }` |

**问题**: 所有 5 个应用的 `.cc-btn-primary` 高度均为 **40px**，DESIGN.md 规范要求 marketing-scale button-primary 渲染为 **~48px** 高。

> **说明**: DESIGN.md 描述 button-primary 为 "Renders ~48 px tall when paired with the marketing flex layout"，但组件 token 定义为 40px。40px 对应 `form-input` 高度，48px 对应 `form-input-lg`。建议将 marketing CTA 按钮高度提升至 48px。

### 5.2 card-marketing 有 Level 3 阴影

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ⚠️ | `.cc-card` 默认 Level 1, hover 时 Level 2 — 未使用 Level 3 |
| developer-dashboard | ⚠️ | 同上 |
| backend-dashboard | ⚠️ | `.cc-card` 使用 `var(--cc-level1)` — 未达 Level 3 |
| cloud-dashboard | ⚠️ | `.cc-card` 使用 `var(--cc-level1)` — 未达 Level 3 |
| unified-dashboard | ⚠️ | `.cc-card` 使用 `var(--cc-level1)` — 未达 Level 3 |

**问题**: DESIGN.md 规定 `card-marketing` 应携带 Level 3 soft-stack shadow，但所有应用的 `.cc-card` 默认仅使用 Level 1 (inset hairline)，hover 时升到 Level 2。

### 5.3 nav-bar 高度为 64px

| 应用 | 合规 | 实际值 | 详情 |
|------|------|--------|------|
| analytics-dashboard | ✅ | 64px | `SiteHeader.tsx:46` `h-16` = 64px |
| developer-dashboard | ❌ | ~48px | `Navbar.tsx` 使用 `py-3` (12px top+bottom) + 内容高度 ≈ 48px，无显式 64px |
| backend-dashboard | ❌ | 56px | `globals.css:72` `.cc-navbar { min-height: 56px }` |
| cloud-dashboard | ⚠️ | 混合 | `Header.tsx:32` 主 header `h-16` = 64px ✅；但子页面 header 使用 `h-14` = 56px ❌ |
| unified-dashboard | ❌ | 无显式 navbar | 使用 Sidebar 布局，无顶部 navbar 组件 |

**具体问题**:
- ❌ `apps/developer-dashboard/src/components/Navbar.tsx` — 桌面端 header 使用 `py-3` 无显式高度，实际约 48px
- ❌ `apps/backend-dashboard/src/app/globals.css:72` — `.cc-navbar { min-height: 56px }` 应为 64px
- ❌ `apps/cloud-dashboard/src/app/page.tsx:25` 等多处 — 子页面 `h-14` = 56px
- ❌ `apps/unified-dashboard` — 无顶部 nav-bar 组件（使用 sidebar 布局）

---

## 6. 阴影系统

### 6.1 使用堆叠阴影

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ⚠️ | 定义了 `--cc-level1~5` 堆叠阴影，但 `.cc-card-interactive:hover` fallback 使用单个 `0 8px 24px rgba(0,0,0,0.12)` |
| developer-dashboard | ✅ | 使用 `var(--cc-level*)` 变量 |
| backend-dashboard | ⚠️ | 定义了堆叠阴影，但 `globals.css:155` toggle knob 使用单个 `0 1px 3px rgba(0,0,0,0.2)` |
| cloud-dashboard | ✅ | `.cc-card` hover 使用堆叠阴影 `0 2px 8px + 0 1px 2px + inset` |
| unified-dashboard | ✅ | 使用 `var(--cc-level*)` 变量 |

### 6.2 避免单个重阴影

| 应用 | 合规 | 详情 |
|------|------|------|
| analytics-dashboard | ❌ | `shared-design-system.css:21` fallback `0 8px 24px rgba(0,0,0,0.12)` — 单个重阴影 |
| developer-dashboard | ✅ | 无单个重阴影 |
| backend-dashboard | ⚠️ | `globals.css:155` `0 1px 3px rgba(0,0,0,0.2)` — 轻微但可接受 |
| cloud-dashboard | ✅ | 无单个重阴影 |
| unified-dashboard | ✅ | 无单个重阴影 |

**具体问题**:
- ❌ `apps/analytics-dashboard/src/shared-design-system.css:21` — `.cc-card-interactive:hover` 的 fallback 阴影 `0 8px 24px rgba(0,0,0,0.12)` 是单个重阴影，违反 DESIGN.md "never a single heavy drop-shadow" 原则

---

## 7. 跨应用一致性

### 7.1 颜色值一致性

| 检查项 | 一致 | 详情 |
|--------|------|------|
| Primary (#171717) | ✅ | 5 个应用一致 |
| Link (#0070f3) | ✅ | 5 个应用一致 |
| Canvas (#ffffff) | ✅ | 5 个应用一致 |
| Canvas-soft (#fafafa) | ✅ | 5 个应用一致（定义值相同） |
| Hairline (#ebebeb) | ✅ | 5 个应用一致 |
| Body (#4d4d4d) | ✅ | 5 个应用一致 |
| Ink (#171717) | ✅ | 5 个应用一致 |

### 7.2 组件样式一致性

| 检查项 | 一致 | 详情 |
|--------|------|------|
| button-primary 高度 | ❌ | 全部 40px，但 DESIGN.md 要求 48px |
| button-primary 圆角 | ✅ | 全部 100px pill |
| card 圆角 | ✅ | 全部 8px |
| card padding | ✅ | 全部 24px |
| card 阴影 | ⚠️ | 大部分 Level 1，未统一使用 Level 3 |
| nav-bar 高度 | ❌ | analytics: 64px, developer: ~48px, backend: 56px, cloud: 混合, unified: 无 |
| nav-cta-signup 高度 | ⚠️ | backend/cloud/unified: 36px; DESIGN.md 要求 28px |
| form-input 高度 | ✅ | 全部 40px |
| 字体加载 | ✅ | 全部加载 Geist (400/500/600) + Geist Mono (400) |
| 间距 token | ✅ | 全部使用 4px 基准 |

**nav-cta-signup 高度不一致详情**:
- DESIGN.md 规定: `nav-cta-signup { height: 28px }`
- backend-dashboard: `shared-design-system.css:382` `.cc-nav-cta-signup { height: 36px }`
- cloud-dashboard: `shared-design-system.css:387` `.cc-nav-cta-signup { height: 36px }`
- unified-dashboard: `shared-design-system.css:390` `.cc-nav-cta-signup { height: 36px }`

---

## 问题汇总

### 严重问题 (5)

| # | 应用 | 文件 | 行号 | 问题 | 修复建议 |
|---|------|------|------|------|---------|
| S1 | analytics-dashboard | `src/app/globals.css` | 30 | body 背景使用 `--cc-canvas` 而非 `--cc-canvas-soft` | 改为 `background-color: var(--cc-canvas-soft)` |
| S2 | 全部 5 个 | `shared-design-system.css` / `globals.css` | 多处 | `.cc-btn-primary` 高度 40px，DESIGN.md 要求 ~48px | 将 marketing-scale `.cc-btn-primary` 高度改为 48px |
| S3 | backend-dashboard | `src/app/globals.css` | 72 | `.cc-navbar` min-height 56px，DESIGN.md 要求 64px | 改为 `min-height: 64px` |
| S4 | developer-dashboard | `src/components/Navbar.tsx` | 28 | 桌面端 header 无显式 64px 高度 | 添加 `h-16` 类 |
| S5 | cloud-dashboard | 多个子页面 | 多处 | 子页面 header `h-14` = 56px | 统一改为 `h-16` = 64px |

### 中等问题 (12)

| # | 应用 | 文件 | 行号 | 问题 | 修复建议 |
|---|------|------|------|------|---------|
| M1 | analytics-dashboard | `src/shared-design-system.css` | 21 | `.cc-card-interactive:hover` fallback 使用单个重阴影 | 改为堆叠阴影或使用 `var(--cc-level2)` |
| M2 | 全部 5 个 | `shared-design-system.css` / `globals.css` | 多处 | `.cc-card` 默认 Level 1 阴影，DESIGN.md 要求 card-marketing Level 3 | 将 `.cc-card` 默认阴影改为 `var(--cc-level3)` |
| M3 | 全部 3 个 (backend/cloud/unified) | `shared-design-system.css` | 多处 | `.cc-nav-cta-signup` 高度 36px，DESIGN.md 要求 28px | 改为 `height: 28px` |
| M4 | analytics-dashboard | `src/components/UserGrowthChart.tsx` | 40-41,58 | 硬编码 `#0070f3` | 使用 CSS 变量或 recharts theme |
| M5 | analytics-dashboard | `src/components/RegionDistribution.tsx` | 7-11 | 硬编码多个颜色值 | 提取为设计 token |
| M6 | analytics-dashboard | `src/components/ChainDistribution.tsx` | 14-35 | 硬编码链品牌色 | 可接受但建议提取为常量文件 |
| M7 | analytics-dashboard | `src/components/TransactionAnalytics.tsx` | 79-80,132,136 | 硬编码 `#0070f3` | 使用 CSS 变量 |
| M8 | analytics-dashboard | `src/components/WalletFunnel.tsx` | 21-51,64 | 硬编码多个颜色值 | 提取为常量 |
| M9 | analytics-dashboard | `src/components/RetentionCurve.tsx` | 53,221-227 | 硬编码多个颜色值 | 提取为常量 |
| M10 | backend-dashboard | `src/app/analytics/page.tsx` | 23-29,42-45 | 硬编码链品牌色和系统色 | 系统色改用 CSS 变量 |
| M11 | backend-dashboard | `src/app/push-server/page.tsx` | 16-18,109-110 | 硬编码颜色值 | 提取为常量 |
| M12 | cloud-dashboard | 子页面 | 多处 | 子页面 header 高度不一致 (56px vs 64px) | 统一为 64px |

### 轻微问题 (15)

| # | 应用 | 文件 | 行号 | 问题 | 修复建议 |
|---|------|------|------|------|---------|
| L1 | analytics-dashboard | `src/app/globals.css` | 146 | `.cc-btn-primary` 使用 `--cc-ink` 而非 `--cc-primary` | 统一使用 `--cc-primary` |
| L2 | analytics-dashboard | `src/shared-design-system.css` | 108 | table header `text-transform: uppercase` | DESIGN.md 规定 never uppercase outside mono labels |
| L3 | backend-dashboard | `src/app/globals.css` | 43,202 | `text-transform: uppercase` | 同上 |
| L4 | backend-dashboard | `src/app/globals.css` | 155 | toggle knob 单个阴影 `0 1px 3px rgba(0,0,0,0.2)` | 可接受但建议用 token |
| L5 | unified-dashboard | `src/app/health/page.tsx` | 56-64 | Tailwind fallback 硬编码颜色 | 可接受（fallback 值） |
| L6 | cloud-dashboard | `src/app/login/page.tsx` | 198-201 | Google logo SVG 硬编码色 | 可接受（第三方品牌） |
| L7 | cloud-dashboard | `src/app/login/page.tsx` | 210 | Discord logo `#5865F2` | 可接受（第三方品牌） |
| L8 | cloud-dashboard | `src/app/register/page.tsx` | 183-186,195 | Google/Discord logo 硬编码色 | 可接受（第三方品牌） |
| L9 | unified-dashboard | `src/components/Sidebar.tsx` | — | 无顶部 nav-bar 组件 | 如需统一导航，添加 navbar |
| L10 | analytics-dashboard | `src/components/SiteHeader.tsx` | — | 无显式 nav-cta-signup 组件 | 添加 Sign Up CTA |
| L11 | developer-dashboard | `src/app/globals.css` | — | 缺少 shared-design-system.css | 建议统一使用 shared-design-system.css |
| L12 | analytics-dashboard | `src/app/globals.css` | — | 缺少 dark theme 定义 | 其他 4 个应用均有 dark theme |
| L13 | developer-dashboard | `src/app/globals.css` | — | 缺少 dark theme 定义（通过 layout data-theme="dark" 硬编码） | 使用 CSS 变量切换 |
| L14 | 全部 | `shared-design-system.css` | 多处 | `.cc-badge` font-weight `--weight-semibold` (600) | DESIGN.md badge-secondary 使用 `caption` weight 400 |
| L15 | backend-dashboard | `src/app/globals.css` | 65-73 | `.cc-navbar` padding `12px 16px` | DESIGN.md 规定 `spacing.sm spacing.lg` = `12px 24px` |

---

## 修复优先级建议

### P0 — 立即修复 (影响视觉一致性)

1. **统一 nav-bar 高度为 64px** — 修改 backend-dashboard, developer-dashboard, cloud-dashboard 子页面
2. **analytics-dashboard body 背景改为 `--cc-canvas-soft`** — 一行修改
3. **修复 analytics-dashboard 单个重阴影** — 替换 fallback 值

### P1 — 短期修复 (影响规范合规性)

4. **button-primary 高度统一为 48px** — 需要评估是否需要区分 marketing (48px) 和 in-app (40px) 两种尺寸
5. **card-marketing 默认阴影提升至 Level 3** — 修改 `.cc-card` 或新增 `.cc-card-marketing` 类
6. **nav-cta-signup 高度统一为 28px** — 修改 backend/cloud/unified 的 shared-design-system.css

### P2 — 中期优化 (提升代码质量)

7. **analytics-dashboard 图表颜色提取为常量/token** — 创建 `chart-colors.ts` 常量文件
8. **backend-dashboard 页面颜色提取** — 同上
9. **移除 `text-transform: uppercase`** — 检查是否违反 sentence-case 原则
10. **developer-dashboard 添加 shared-design-system.css** — 统一设计系统引入方式

### P3 — 长期改进

11. **analytics-dashboard 添加 dark theme** — 与其他应用保持一致
12. **unified-dashboard 添加顶部 navbar** — 统一导航模式
13. **统一 badge 字重为 400** — 与 DESIGN.md 对齐

---

## 各应用详细评分

### analytics-dashboard (72/100)

| 维度 | 得分 | 满分 | 说明 |
|------|------|------|------|
| 颜色系统 | 14 | 20 | body 背景错误; 大量硬编码颜色 |
| 排版系统 | 18 | 20 | 字体/字重正确; 个别 uppercase |
| 间距系统 | 10 | 10 | 完全合规 |
| 圆角系统 | 10 | 10 | 完全合规 |
| 组件规范 | 8 | 20 | button-primary 高度错误; card 阴影不足; nav-bar 正确 |
| 阴影系统 | 7 | 10 | 定义了堆叠阴影但有 fallback 违规 |
| 跨应用一致性 | 5 | 10 | 缺少 dark theme; 缺少 shared-design-system.css 独立文件 |

### developer-dashboard (78/100)

| 维度 | 得分 | 满分 | 说明 |
|------|------|------|------|
| 颜色系统 | 18 | 20 | 无硬编码; token 使用正确 |
| 排版系统 | 18 | 20 | 字体正确; sentence-case |
| 间距系统 | 10 | 10 | 完全合规 |
| 圆角系统 | 10 | 10 | 完全合规 |
| 组件规范 | 10 | 20 | button-primary 高度错误; nav-bar 高度错误 |
| 阴影系统 | 9 | 10 | 使用 token，无违规 |
| 跨应用一致性 | 3 | 10 | 缺少 shared-design-system.css; 硬编码 dark theme |

### backend-dashboard (80/100)

| 维度 | 得分 | 满分 | 说明 |
|------|------|------|------|
| 颜色系统 | 16 | 20 | 图表数据硬编码（部分可接受） |
| 排版系统 | 17 | 20 | 字体正确; 个别 uppercase |
| 间距系统 | 10 | 10 | 完全合规 |
| 圆角系统 | 10 | 10 | 完全合规 |
| 组件规范 | 12 | 20 | button-primary 高度错误; nav-bar 56px; nav-cta 36px |
| 阴影系统 | 8 | 10 | 基本合规; toggle 轻微违规 |
| 跨应用一致性 | 7 | 10 | 有 dark theme; 有 shared-design-system.css |

### cloud-dashboard (76/100)

| 维度 | 得分 | 满分 | 说明 |
|------|------|------|------|
| 颜色系统 | 18 | 20 | 仅第三方 logo 硬编码（可接受） |
| 排版系统 | 18 | 20 | 字体正确 |
| 间距系统 | 10 | 10 | 完全合规 |
| 圆角系统 | 10 | 10 | 完全合规 |
| 组件规范 | 10 | 20 | button-primary 高度错误; nav-bar 混合高度; nav-cta 36px |
| 阴影系统 | 9 | 10 | 堆叠阴影使用正确 |
| 跨应用一致性 | 1 | 10 | 子页面 header 高度不一致 |

### unified-dashboard (82/100)

| 维度 | 得分 | 满分 | 说明 |
|------|------|------|------|
| 颜色系统 | 19 | 20 | 仅 Tailwind fallback（可接受） |
| 排版系统 | 18 | 20 | 字体正确 |
| 间距系统 | 10 | 10 | 完全合规 |
| 圆角系统 | 10 | 10 | 完全合规 |
| 组件规范 | 12 | 20 | button-primary 高度错误; 无顶部 navbar |
| 阴影系统 | 9 | 10 | 使用 token 系统 |
| 跨应用一致性 | 4 | 10 | 有 dark theme; 有 shared-design-system.css; 缺少 navbar |

---

## 总结

### 合规亮点 ✅

1. **字体系统高度一致** — 5 个应用均正确加载 Geist (400/500/600) + Geist Mono (400)
2. **间距系统完全合规** — 全部使用 4px 基准 token
3. **圆角系统基本合规** — pill (100px), card (8px), nav (6px) 均正确定义
4. **颜色 token 定义一致** — 核心颜色值 (#171717, #0070f3, #fafafa 等) 跨应用一致
5. **Sentence-case 标题** — 全部应用遵循 sentence-case + period-terminated 规范

### 关键差距 ❌

1. **button-primary 高度** — 全部 5 个应用均为 40px，DESIGN.md 要求 ~48px
2. **nav-bar 高度不统一** — 64px / 56px / ~48px / 混合 / 无，5 种不同实现
3. **card-marketing 阴影不足** — 全部使用 Level 1，DESIGN.md 要求 Level 3
4. **analytics-dashboard 硬编码颜色** — ~55 处硬编码颜色值，远超其他应用
5. **nav-cta-signup 高度偏差** — 3 个应用使用 36px，DESIGN.md 要求 28px

---

*报告生成时间: 2026-06-13T12:46:00Z*  
*审计工具: 手动代码审查*  
*设计规范版本: DESIGN.md (alpha)*
