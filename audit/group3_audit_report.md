# Group 3 设计审计报告

> 审计 Agent: 000 (Group 3)
> 审计日期: 2026-06-13
> 设计准则: `/design-guidelines/DESIGN.md` (Vercel-Inspired CINAcoin Design System)

---

## 1. Analytics Dashboard (`apps/analytics-dashboard`) 设计审计报告

### 合规项 ✅

| 类别 | 合规内容                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------- |
| 色彩 | 使用 `var(--cc-*)` token 体系，Primary/Ink #171717、Canvas #ffffff、Canvas-soft #fafafa、Canvas-soft-2 #f5f5f5 均正确 |
| 色彩 | 语义色 error #ee0000、warning #f5a623、link/success #0070f3 正确                                                      |
| 色彩 | error-soft/warning-soft 通过 badge-danger/badge-warning 使用规范语义色                                                |
| 字体 | Geist Sans (400/500/600) + Geist Mono (400) 正确加载                                                                  |
| 排版 | 字重上限 600，无 700+ 违规                                                                                            |
| 排版 | 标题 sentence-case，无全大写标题反模式                                                                                |
| 排版 | 正文不使用 mono 字体，mono 仅用于代码/技术标签                                                                        |
| 间距 | 4px 基准间距 token 体系完整 (xxs:4 → 5xl:96)                                                                          |
| 阴影 | 使用 stacked shadow + inset hairline 体系 (cinacoin-1 ~ cinacoin-4)                                                   |
| 阴影 | 无单一大阴影反模式                                                                                                    |
| 组件 | cc-card 使用 canvas bg + padding lg + L1→L2 hover 阴影                                                                |
| 组件 | badge-success/warning/danger 使用规范语义色                                                                           |
| 布局 | max-w-7xl 容器 + px-lg 水平留白符合规范                                                                               |

### 违规项 ❌

| 类别 | 违规内容                                          | 位置                                             | 规范要求                           | 严重度 |
| ---- | ------------------------------------------------- | ------------------------------------------------ | ---------------------------------- | ------ |
| 排版 | `body-lg` 定义为 16px/400，规范要求 18px/400      | `tailwind-preset.ts` fontSize.body-lg            | 18px/400/28px                      | 中     |
| 排版 | `body` 定义为 14px/400，规范要求 body-md 16px/400 | `tailwind-preset.ts` fontSize.body               | 16px/400/24px                      | 中     |
| 排版 | `body-sm` 定义为 12px/400，规范要求 14px/400      | `tailwind-preset.ts` fontSize.body-sm            | 14px/400/20px                      | 中     |
| 排版 | `caption` 定义为 11px/500，规范要求 12px/400      | `tailwind-preset.ts` fontSize.caption            | 12px/400/16px                      | 中     |
| 排版 | `heading-1` 定义为 36px，规范无此尺寸             | `tailwind-preset.ts` fontSize.heading-1          | display-lg 32px 或 display-md 24px | 低     |
| 圆角 | borderRadius sm/md/lg/xl/2xl/3xl 全部设为 4px     | `tailwind-preset.ts` borderRadius                | sm:6 md:8 lg:12 xl:16              | 高     |
| 圆角 | `--cc-radius-sm/md/lg/pill` 全部为 4px            | `shared-design-system.css`                       | sm:6 md:8 lg:12 pill:100           | 高     |
| 圆角 | badge 使用 `rounded-sm` (4px)                     | KPICard.tsx, shared-design-system.css `.badge`   | rounded-full (9999px)              | 中     |
| 组件 | 表头使用 `text-transform: uppercase`              | `shared-design-system.css` `.table-container th` | 规范禁止全大写                     | 低     |
| 色彩 | 图表使用非规范色 #0091ff、#059669                 | RegionDistribution.tsx, RetentionCurve.tsx       | 应使用规范调色板                   | 低     |

### 评分

| 维度     | 得分   | 满分   | 说明                                                                                         |
| -------- | ------ | ------ | -------------------------------------------------------------------------------------------- |
| 色彩     | 8      | 10     | 核心色和语义色正确；图表引入非规范色                                                         |
| 排版     | 5      | 10     | 字体族正确，但 Tailwind preset 字号体系整体偏移（body-lg/body/body-sm/caption 均与规范不符） |
| 间距圆角 | 4      | 10     | 间距正确；圆角全部坍塌为 4px 是严重偏差                                                      |
| 组件     | 7      | 10     | 卡片/阴影/badge 语义色合规；badge 形状和表格大写违规                                         |
| **总分** | **24** | **40** |                                                                                              |

---

## 2. Unified Dashboard (`apps/unified-dashboard`) 设计审计报告

### 合规项 ✅

| 类别   | 合规内容                                                                         |
| ------ | -------------------------------------------------------------------------------- |
| 色彩   | 完整定义 light/dark 双主题色板，所有色值与规范一致                               |
| 色彩   | `--cc-*` 别名体系完整映射 `--color-*` → `--cc-*`                                 |
| 色彩   | 语义色 success #0070f3、error #ee0000、warning #f5a623 正确                      |
| 色彩   | SystemOverview 状态指示器使用 success/warning/error 语义色                       |
| 字体   | Geist Sans + Geist Mono 正确加载                                                 |
| 排版   | `shared-design-system.css` 字号体系完全匹配规范 (display-xl 48px → caption 12px) |
| 排版   | cc-display-xl/lg/md/sm 类正确实现 (size/weight/lineHeight/letterSpacing)         |
| 排版   | cc-body-lg/md/md-strong/sm/sm-strong 类正确实现                                  |
| 排版   | cc-caption / cc-caption-mono 类正确实现                                          |
| 排版   | 字重上限 600（虽然定义了 --weight-bold:700 但未在组件中使用）                    |
| 排版   | 标题 sentence-case + 句号结尾 ("Dashboard overview.", "User growth.")            |
| 排版   | mono 仅用于技术标签 ("ACTIVITY" caption-mono)                                    |
| 间距   | 4px 基准间距 token 完整                                                          |
| 阴影   | 5 级阴影体系 (level-1 ~ level-5) 完全匹配规范 stacked shadow + inset hairline    |
| 组件   | cc-card: canvas bg + 24px padding + L1 shadow + L2 hover ✅                      |
| 组件   | cc-badge: rounded 100px (pill) ✅                                                |
| 组件   | cc-form-input: rounded 6px (sm) ✅                                               |
| 组件   | 图表 Tooltip 使用 cc-canvas bg + cc-hairline border + cc-level2 shadow           |
| 无障碍 | focus-visible outline 2px link color ✅                                          |
| 无障碍 | min touch target 44px ✅                                                         |
| 无障碍 | sr-only 类 ✅                                                                    |
| 无障碍 | skip-to-content link ✅                                                          |

### 违规项 ❌

| 类别 | 违规内容                                         | 位置                       | 规范要求                                 | 严重度 |
| ---- | ------------------------------------------------ | -------------------------- | ---------------------------------------- | ------ |
| 圆角 | `--cc-radius-sm` 为 4px                          | `shared-design-system.css` | sm: 6px                                  | 中     |
| 圆角 | `--cc-radius-md` 为 4px                          | `shared-design-system.css` | md: 8px                                  | 高     |
| 圆角 | `--cc-radius-lg` 为 4px                          | `shared-design-system.css` | lg: 12px                                 | 高     |
| 圆角 | `--cc-radius-pill` 为 4px                        | `shared-design-system.css` | pill: 100px                              | 高     |
| 圆角 | `.cc-card` border-radius 为 4px                  | `shared-design-system.css` | md: 8px                                  | 高     |
| 圆角 | `.cc-btn-primary` border-radius 为 4px           | `shared-design-system.css` | sm: 6px (nav) 或 pill: 100px (marketing) | 中     |
| 圆角 | `.cc-navbar-link` border-radius 为 4px           | `shared-design-system.css` | 8px 或 full (pill)                       | 低     |
| 排版 | `--weight-bold: 700` 已定义（虽未使用）          | `shared-design-system.css` | 不应定义 700，上限 600                   | 低     |
| 组件 | Sidebar 使用 `cc-display-md` (24px) 作为品牌标题 | Sidebar.tsx                | 偏大，建议 display-sm (20px)             | 低     |

### 评分

| 维度     | 得分   | 满分   | 说明                                                                           |
| -------- | ------ | ------ | ------------------------------------------------------------------------------ |
| 色彩     | 9      | 10     | 完整 light/dark 双主题，所有色值精确匹配规范                                   |
| 排版     | 9      | 10     | 字号体系完全匹配；定义了未使用的 700 weight 变量（轻微）                       |
| 间距圆角 | 6      | 10     | 间距正确；radius token 全部坍塌为 4px（但 form-input 6px 和 badge 100px 正确） |
| 组件     | 8      | 10     | 卡片/阴影/表单/badge 结构合规；card radius 和 button radius 偏差               |
| **总分** | **32** | **40** |                                                                                |

---

## 3. Health Status (`apps/health-status`) 设计审计报告

### 合规项 ✅

| 类别   | 合规内容                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| 色彩   | 完整 light/dark 双主题色板，色值与规范一致                                                                           |
| 色彩   | `--cc-*` 别名体系完整                                                                                                |
| 色彩   | StatusBadge: operational=success, degraded=warning, outage=error, maintenance=link ✅                                |
| 色彩   | OverallStatus: 语义色使用完全正确 (partial-outage=warning, major-outage=error)                                       |
| 色彩   | StatusBar90Days: 每日状态使用 success/warning/error/link 语义色 ✅                                                   |
| 色彩   | IncidentTimeline: status 颜色使用语义色 ✅                                                                           |
| 色彩   | Severity 颜色: minor=warning, major/error, critical=error ✅                                                         |
| 字体   | Geist Sans + Geist Mono 正确加载                                                                                     |
| 排版   | 字号体系完全匹配规范 (shared-design-system.css)                                                                      |
| 排版   | cc-display-xl/lg/md/sm 类正确实现                                                                                    |
| 排版   | cc-caption-mono 用于 section eyebrow ("health-status", "Monitored services", "Historical uptime", "Incident log") ✅ |
| 排版   | 标题 sentence-case + 句号 ("CinaCoin status.", "Services", "90-day history") ✅                                      |
| 排版   | 字重上限 600 ✅                                                                                                      |
| 排版   | mono 仅用于技术内容 (code mockup, uptime values, response times) ✅                                                  |
| 间距   | 4px 基准间距 ✅                                                                                                      |
| 阴影   | inset hairline ring + hover L2 shadow ✅                                                                             |
| 组件   | Dark band hero: bg #171717 + white text + mono eyebrow ✅                                                            |
| 组件   | Code mockup: dark bg + mono font + canvas-soft-2 header ✅                                                           |
| 组件   | ServiceCard: 手动 rounded-[8px] 覆盖 ✅                                                                              |
| 组件   | OverallStatus: rounded-[8px] + 语义色 bg/border ✅                                                                   |
| 组件   | StatusBadge: rounded-full + cc-caption-mono ✅                                                                       |
| 组件   | IncidentTimeline: rounded-[8px] + severity border ✅                                                                 |
| 组件   | 90-day history container: rounded-[8px] + inset hairline ✅                                                          |
| 无障碍 | focus-visible, sr-only, skip-to-content, aria-label, role ✅                                                         |

### 违规项 ❌

| 类别 | 违规内容                                                 | 位置                       | 规范要求                     | 严重度 |
| ---- | -------------------------------------------------------- | -------------------------- | ---------------------------- | ------ |
| 圆角 | `--cc-radius-sm/md/lg/pill` 全部为 4px                   | `shared-design-system.css` | sm:6 md:8 lg:12 pill:100     | 高     |
| 圆角 | `.cc-card` border-radius 为 4px                          | `shared-design-system.css` | md: 8px                      | 高     |
| 圆角 | `.cc-badge` border-radius 为 4px                         | `shared-design-system.css` | full: 9999px                 | 中     |
| 圆角 | `.cc-btn-primary` border-radius 为 4px                   | `shared-design-system.css` | sm: 6px                      | 中     |
| 圆角 | `.cc-form-input` border-radius 为 4px                    | `shared-design-system.css` | sm: 6px                      | 中     |
| 排版 | `--weight-bold: 700` 已定义（虽未使用）                  | `shared-design-system.css` | 不应定义 700                 | 低     |
| 组件 | Tailwind 未使用 cinacoin preset（独立配置）              | `tailwind.config.ts`       | 应引用共享 preset 保证一致性 | 低     |
| 色彩 | Hero band 硬编码 `bg-[#171717]` 而非 `var(--cc-primary)` | page.tsx                   | 应使用 token                 | 低     |

### 评分

| 维度     | 得分   | 满分   | 说明                                                                             |
| -------- | ------ | ------ | -------------------------------------------------------------------------------- |
| 色彩     | 9      | 10     | 语义状态色使用堪称典范；Hero 硬编码色值轻微扣分                                  |
| 排版     | 9      | 10     | 字号/字重/字体族完全匹配；定义了未使用的 700 weight                              |
| 间距圆角 | 7      | 10     | 组件手动覆盖 rounded-[8px] 弥补了 token 缺陷；StatusBadge rounded-full 正确      |
| 组件     | 9      | 10     | 状态页组件设计优秀，dark band hero + code mockup + status badge 完全符合规范精神 |
| **总分** | **34** | **40** |                                                                                  |

---

## 汇总对比

| 应用                | 色彩 | 排版 | 间距圆角 | 组件 | 总分      |
| ------------------- | ---- | ---- | -------- | ---- | --------- |
| Analytics Dashboard | 8    | 5    | 4        | 7    | **24/40** |
| Unified Dashboard   | 9    | 9    | 6        | 8    | **32/40** |
| Health Status       | 9    | 9    | 7        | 9    | **34/40** |

## 跨应用共性问题

### 🔴 严重：圆角体系坍塌

三个应用的 `shared-design-system.css` 和 Tailwind preset 中，`radius-sm/md/lg/xl/pill` 全部设为 `4px`。规范明确要求：

- sm: 6px (nav CTA, form input, button)
- md: 8px (card, feature card)
- lg: 12px (pricing card)
- xl: 16px (large card)
- pill: 100px (marketing CTA)
- full: 9999px (badge, icon button)

Health Status 通过组件级 `rounded-[8px]` 手动覆盖部分弥补了此问题，但 Analytics Dashboard 完全依赖错误的 token。

### 🟡 中等：Analytics Dashboard 字号体系偏移

Analytics Dashboard 的 `tailwind-preset.ts` 定义了独立的字号体系，与规范存在系统性偏差：

- body-lg: 16px → 应为 18px
- body: 14px → 应为 16px (body-md)
- body-sm: 12px → 应为 14px
- caption: 11px/500 → 应为 12px/400

Unified Dashboard 和 Health Status 的 `shared-design-system.css` 字号体系则完全匹配规范。

### 🟢 轻微：`--weight-bold: 700` 变量定义

Unified Dashboard 和 Health Status 的 CSS 中定义了 `--weight-bold: 700`，虽然组件中未使用，但存在被误用的风险。规范明确字重上限为 600。

---

_审计完成。报告由 CINAcoin 设计审计 Agent 3 生成。_
