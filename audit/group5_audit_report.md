# Group 5 设计审计报告

**审计员：** Agent 5 — 设计系统 & 应用审计  
**审计日期：** 2026-06-13  
**设计准则：** `design-guidelines/DESIGN.md` (Vercel-Inspired Design Language)

**审计范围：**

- `apps/farcaster-app` (Farcaster 集成)
- `apps/telegram-app` (Telegram 集成)
- `design-system/` (共享设计系统 CSS 组件)
- `packages/design-tokens/` (设计 token 包)
- `packages/design-system/` (组件库 TS tokens)
- `apps/shared-design-system.css` (共享 CSS)

---

## 1. apps/farcaster-app 设计审计报告

### 合规项 ✅

- 使用 Geist Sans + Geist Mono 字体族 ✅
- 字体 weight 上限 600 ✅
- display-xl 尺寸 48px / weight 600 / letter-spacing -2.4px ✅
- display-lg 尺寸 32px / weight 600 / letter-spacing -1.28px ✅
- display-md 尺寸 24px / weight 600 / letter-spacing -0.96px ✅
- 深色主题 canvas #000000 / ink #ededed 合理 ✅
- 使用 mono 字体做技术标签（frame config）✅
- Skip link 无障碍 ✅
- Focus-visible 无障碍 ✅
- 最小触控目标 44px ✅

### 违规项 ❌

| 类别 | 位置               | 问题                            | 准则值                         | 实际值                |
| ---- | ------------------ | ------------------------------- | ------------------------------ | --------------------- |
| 色彩 | globals.css        | link 色偏离品牌蓝               | #0070f3                        | #0052ff               |
| 色彩 | globals.css        | violet 色偏离品牌紫             | #7928ca                        | #855dcd               |
| 色彩 | globals.css        | success 色使用 Tailwind green   | #0070f3                        | #22c55e               |
| 色彩 | globals.css        | error 色偏离品牌红              | #ee0000                        | #ef4444               |
| 排版 | globals.css        | body-lg line-height 用比率      | 28px                           | 1.5 (27px)            |
| 排版 | globals.css        | body-md line-height 用比率      | 24px                           | 1.5 (24px ≈ 但非精确) |
| 排版 | globals.css        | body-sm line-height 用比率      | 20px                           | 1.5 (21px)            |
| 排版 | globals.css        | display-lg line-height 用比率   | 40px                           | 1.2 (38.4px)          |
| 排版 | globals.css        | display-md line-height 用比率   | 32px                           | 1.3 (31.2px)          |
| 圆角 | tailwind.config.js | 所有圆角统一为 4px              | sm:6 md:8 lg:12 xl:16 pill:100 | 全部 4px              |
| 组件 | page.tsx           | 按钮用 rounded-sm (4px) 非 pill | pill 100px                     | 4px                   |
| 间距 | tailwind.config.js | 未定义 4px 基准间距 token       | xxs:4 xs:8 sm:12...            | 使用 Tailwind 默认    |
| 阴影 | globals.css        | 未定义堆叠式阴影系统            | L1-L5 + inset hairline         | 无                    |
| 组件 | page.tsx           | 二级按钮用 hairline-strong bg   | canvas bg + hairline border    | hairline-strong bg    |

### 评分

| 维度      | 得分      | 说明                                            |
| --------- | --------- | ----------------------------------------------- |
| 色彩      | 5/10      | 核心品牌色全部偏移，使用 Tailwind 色值替代      |
| 排版      | 7/10      | 字体/字重/尺寸正确，line-height 用比率非精确 px |
| 间距/圆角 | 3/10      | 圆角系统完全扁平化(全4px)，丢失 pill 形态       |
| 组件      | 5/10      | 基础结构在但按钮形状、阴影不合规                |
| **总分**  | **20/40** |                                                 |

---

## 2. apps/telegram-app 设计审计报告

### 合规项 ✅

- 导入 @cinacoin/design-tokens/css/cinacoin.css ✅
- 使用 Geist Sans + Geist Mono 字体 ✅
- 字体 weight 上限 600 (--cc-weight-bold 映射到 semibold) ✅
- 4px 基准间距网格 ✅
- 使用 mono 字体做地址/hash 显示 ✅
- Focus-visible 无障碍 ✅
- 安全区域适配 (safe-area-inset) ✅
- 句子式标题 + 句号 ✅

### 违规项 ❌

| 类别 | 位置       | 问题                                | 准则值                   | 实际值                 |
| ---- | ---------- | ----------------------------------- | ------------------------ | ---------------------- |
| 色彩 | global.css | primary 覆盖为 Telegram 紫          | #171717/#ffffff          | #6c63ff                |
| 色彩 | global.css | success 色偏离                      | #0070f3                  | #00c853                |
| 色彩 | global.css | warning 色偏离                      | #f5a623                  | #ffab00                |
| 色彩 | global.css | error 色偏离                        | #ee0000                  | #ff5252                |
| 色彩 | global.css | border 用 rgba 非 hairline          | #ebebeb                  | rgba(255,255,255,0.08) |
| 排版 | global.css | display-xl 尺寸缩小                 | 48px                     | 36px                   |
| 排版 | global.css | display-lg 尺寸缩小                 | 32px                     | 28px                   |
| 排版 | global.css | 缺少 body-lg 定义                   | 18px                     | 未定义                 |
| 排版 | global.css | 缺少精确 line-height/letter-spacing | 各token有精确值          | 仅定义 font-size       |
| 圆角 | global.css | 所有圆角统一 4px                    | sm:6 md:8 lg:12 pill:100 | 全部 4px               |
| 圆角 | global.css | pill 圆角为 4px                     | 100px                    | 4px                    |
| 阴影 | pages.css  | 无堆叠式阴影系统                    | L1-L5 + inset            | 无                     |
| 组件 | pages.css  | 按钮 border-radius 4px              | pill 100px               | 4px                    |
| 组件 | pages.css  | form-input border-radius 4px        | sm 6px                   | 4px                    |
| 组件 | pages.css  | card border-radius 4px              | md 8px                   | 4px                    |

### 评分

| 维度      | 得分      | 说明                                  |
| --------- | --------- | ------------------------------------- |
| 色彩      | 4/10      | 品牌色被 Telegram 主题色完全替换      |
| 排版      | 5/10      | 字体正确但尺寸缩小，缺少精确行高/字距 |
| 间距/圆角 | 2/10      | 间距系统正确但圆角完全扁平化          |
| 组件      | 4/10      | 组件结构合理但形状全部错误            |
| **总分**  | **15/40** |                                       |

---

## 3. design-system/ (共享设计系统 CSS 组件) 审计报告

### 合规项 ✅

- button.css: primary bg 用 --color-ink ✅
- button.css: on-primary 文字色 ✅
- button.css: 高度尺寸 32/40/48 三档 ✅
- card.css: canvas 背景 ✅
- card.css: hairline 边框 ✅
- card.css: padding lg (24px) ✅
- input.css: 高度 40px ✅
- input.css: border-radius sm ✅
- input.css: focus 用 link 色 + 3px ring ✅
- typography.css: 字体层级完整 ✅
- typography.css: display weight 600 ✅
- typography.css: mono 用于技术内容 ✅
- badge.css: caption 字号 ✅
- badge.css: canvas-soft-2 背景 ✅

### 违规项 ❌

| 类别 | 位置           | 问题                       | 准则值                      | 实际值                   |
| ---- | -------------- | -------------------------- | --------------------------- | ------------------------ |
| 圆角 | button.css     | 按钮用 radius-sm 非 pill   | pill 100px                  | var(--radius-sm)         |
| 圆角 | badge.css      | badge 用 radius-xs         | full 9999px                 | var(--radius-xs)         |
| 阴影 | card.css       | 使用单级 drop shadow       | 堆叠式 + inset hairline     | 单层 shadow              |
| 阴影 | card.css       | e2-e5 无 inset hairline    | 每级都有 inset              | 无 inset                 |
| 排版 | typography.css | 使用未定义的 CSS 变量      | 精确 px 值                  | var(--text-display-1) 等 |
| 排版 | typography.css | body 颜色用 body 色        | ink 色(标题)                | var(--color-body)        |
| 组件 | button.css     | 缺少 button-lg 营销级 pill | 100px pill + button-lg 字体 | 仅 40px 默认             |
| 组件 | card.css       | card-title 用未定义变量    | text-display-md             | var(--text-title)        |

### 评分

| 维度      | 得分      | 说明                              |
| --------- | --------- | --------------------------------- |
| 色彩      | 8/10      | 正确引用 token 变量，色值本身合规 |
| 排版      | 7/10      | 层级完整但部分变量未解析          |
| 间距/圆角 | 5/10      | 间距正确但圆角偏小(非 pill)       |
| 组件      | 6/10      | 基础组件结构合理但阴影不合规      |
| **总分**  | **26/40** |                                   |

---

## 4. packages/design-tokens 审计报告

### 合规项 ✅

- tokens/global.json: 所有核心颜色值完全匹配 ✅
- tokens/global.json: 间距系统完全匹配 (4px base) ✅
- tokens/global.json: 圆角系统完全匹配 (xs:4 sm:6 md:8 lg:12 xl:16 pill-sm:64 pill:100 full:9999) ✅
- tokens/global.json: tracking 值匹配 (-2.4/-1.28/-0.96/-0.6/-0.28) ✅
- tokens/global.json: font-size 值匹配 ✅
- tokens/semantic.json: weight-bold 正确映射到 semibold (600) ✅
- css/cinacoin.css: 深色/浅色双主题 ✅
- css/cinacoin.css: 间距 token 完全匹配 ✅
- css/cinacoin.css: 堆叠式阴影 L1-L5 ✅
- css/cinacoin.css: mesh gradient 定义 ✅
- css/cinacoin.css: 响应式排版 ✅
- css/cinacoin.css: 无障碍 focus-visible ✅

### 违规项 ❌

| 类别 | 位置                   | 问题                              | 准则值         | 实际值                                             |
| ---- | ---------------------- | --------------------------------- | -------------- | -------------------------------------------------- |
| 排版 | global.json            | font-mono 用 JetBrains Mono       | Geist Mono     | 'JetBrains Mono', 'Fira Code'                      |
| 排版 | global.json            | font-bold 定义为 700              | max 600        | 700                                                |
| 阴影 | global.json            | shadow level2-5 opacity 偏高      | 0.02/0.04/0.06 | 0.03/0.06/0.1                                      |
| 阴影 | global.json            | 含非准则的通用 shadow sm/md/lg/xl | 仅 L0-L5       | 额外 sm/md/lg/xl                                   |
| 圆角 | cinacoin.css           | --cc-radius-xs                    | 4px            | 2px                                                |
| 圆角 | cinacoin.css           | --cc-radius-sm                    | 6px            | 4px                                                |
| 圆角 | cinacoin.css           | --cc-radius-md                    | 8px            | 4px                                                |
| 圆角 | cinacoin.css           | --cc-radius-lg                    | 12px           | 4px                                                |
| 圆角 | cinacoin.css           | --cc-radius-xl                    | 16px           | 4px                                                |
| 圆角 | cinacoin.css           | --cc-radius-pill-sm               | 64px           | 4px                                                |
| 圆角 | cinacoin.css           | --cc-radius-pill                  | 100px          | 4px                                                |
| 排版 | cinacoin.css           | .cc-display-xl 基础尺寸偏移       | 48px           | var(--text-display-lg) = 32px (mobile)             |
| 排版 | cinacoin.css           | .cc-display-lg 基础尺寸偏移       | 32px           | var(--text-display-md) = 24px (mobile)             |
| 排版 | cinacoin.css           | .cc-display-md 基础尺寸偏移       | 24px           | var(--text-display-sm) = 20px (mobile)             |
| 组件 | cinacoin.css           | .cc-btn-primary 圆角              | pill 100px     | var(--cc-radius-sm) = 4px                          |
| 组件 | cinacoin.css           | .cc-btn-primary 字号              | button-lg 16px | var(--text-body-md) = 16px ✅ 但非 button-lg token |
| 组件 | cinacoin.css           | .cc-btn-secondary 背景            | canvas         | var(--cc-canvas) ✅ 但用 border 非纯 bg            |
| 组件 | cinacoin.css           | .cc-badge 圆角                    | full 9999px    | var(--cc-radius-sm) = 4px                          |
| 组件 | cinacoin.css           | .cc-tab-ghost 圆角                | pill-sm 64px   | var(--cc-radius-sm) = 4px                          |
| 组件 | cinacoin.css           | .cc-navbar-link 圆角              | full 9999px    | var(--cc-radius-sm) = 4px                          |
| 组件 | cinacoin.css           | .cc-nav-cta-signup 高度           | 28px           | 28px ✅                                            |
| 组件 | cinacoin.css           | .cc-nav-cta-signup 圆角           | sm 6px         | var(--cc-radius-sm) = 4px                          |
| 构建 | dist/css/variables.css | 完全不同的色彩系统                | #171717 系列   | #0F172A Tailwind Slate                             |
| 构建 | dist/css/variables.css | 不同前缀                          | --cc-\*        | --ocx-\*                                           |
| 构建 | dist/css/variables.css | 字体无 Geist                      | Geist, Inter   | Inter only                                         |
| 构建 | dist/css/variables.css | 字体 mono 错误                    | Geist Mono     | JetBrains Mono                                     |
| 构建 | dist/css/variables.css | 间距用 rem 非 px                  | 4px grid       | rem-based                                          |

### 评分

| 维度      | 得分      | 说明                                                        |
| --------- | --------- | ----------------------------------------------------------- |
| 色彩      | 8/10      | JSON token 完全正确，CSS 正确，但 dist 构建产物完全错误     |
| 排版      | 6/10      | JSON 字号正确但 mono 字体错误，CSS 响应式降级导致基础值偏移 |
| 间距/圆角 | 4/10      | JSON 圆角完美但 CSS 实现全部压平为 4px，严重不一致          |
| 组件      | 4/10      | 组件形状全部用 4px radius 而非准则规定的 pill/full          |
| **总分**  | **22/40** |                                                             |

---

## 5. packages/design-system 审计报告

### 合规项 ✅

- 提供 light/dark 主题预设 ✅
- 提供 applyTheme() 运行时切换 ✅
- 提供 generateCSSVariables() ✅
- TypeScript 类型完整 ✅
- Transition token 值匹配 ✅

### 违规项 ❌

| 类别 | 位置       | 问题                          | 准则值          | 实际值             |
| ---- | ---------- | ----------------------------- | --------------- | ------------------ |
| 色彩 | tokens.ts  | primary 色完全错误            | #171717         | #58a6ff (GitHub蓝) |
| 色彩 | tokens.ts  | background.primary 深色错误   | #0a0a0a/#fafafa | #0d1117 (GitHub暗) |
| 色彩 | tokens.ts  | text.primary 深色错误         | #f5f5f5/#171717 | #e6edf3 (GitHub)   |
| 色彩 | tokens.ts  | border.primary 深色错误       | #2e2e2e/#ebebeb | #30363d (GitHub)   |
| 色彩 | tokens.ts  | 整套色板使用 GitHub 风格      | Vercel 风格     | GitHub 风格        |
| 排版 | tokens.ts  | fontFamily.sans 无 Geist      | Geist, Inter    | -apple-system 系列 |
| 排版 | tokens.ts  | fontFamily.mono 无 Geist Mono | Geist Mono      | ui-monospace 系列  |
| 排版 | tokens.ts  | fontSize 最大 30px            | 48px display-xl | 1.875rem (30px)    |
| 排版 | tokens.ts  | fontWeight.bold = 700         | max 600         | 700                |
| 间距 | tokens.ts  | 使用 rem Tailwind 风格        | 4px px-based    | rem-based          |
| 圆角 | tokens.ts  | sm = 2px                      | 6px             | 0.125rem (2px)     |
| 圆角 | tokens.ts  | md = 6px                      | 8px             | 0.375rem (6px)     |
| 阴影 | tokens.ts  | 通用 Tailwind 阴影            | 堆叠式 L1-L5    | Tailwind 风格      |
| 预设 | presets.ts | 应用了错误的 token 值         | 准则值          | GitHub 风格值      |

### 评分

| 维度      | 得分     | 说明                                         |
| --------- | -------- | -------------------------------------------- |
| 色彩      | 1/10     | 完全使用 GitHub 色板，零合规                 |
| 排版      | 2/10     | 字体族错误，缺少 display 层级，weight 超上限 |
| 间距/圆角 | 2/10     | 使用 rem 非 px，圆角值全部错误               |
| 组件      | 2/10     | 阴影系统不合规，无组件级 token               |
| **总分**  | **7/40** |                                              |

---

## 6. apps/shared-design-system.css 审计报告

### 合规项 ✅

- 所有核心颜色完全匹配 ✅ (primary #171717, ink #171717, body #4d4d4d, mute #888888, hairline #ebebeb, canvas #ffffff, canvas-soft #fafafa, link #0070f3, error #ee0000)
- 全部语义色定义完整 ✅
- 渐变 token 完整 ✅
- 字体族 Geist + Geist Mono ✅
- 间距 token 完整 (xxs 到 section) ✅
- display-xl: 48px ✅
- 字重定义完整 ✅
- 堆叠式阴影 L1-L5 + inset hairline ✅
- --cc-\* 别名系统 ✅
- .cc-btn-primary: border-radius 100px (pill) ✅
- .cc-card: border-radius 8px (md) ✅, padding 24px (lg) ✅
- .cc-form-input: height 40px ✅, border-radius 6px (sm) ✅
- .cc-badge: border-radius 100px ✅
- 暗色主题完整 ✅
- 无障碍: focus-visible ✅
- 无障碍: 最小触控目标 44px ✅
- 无障碍: sr-only ✅
- 过渡动画 token ✅

### 违规项 ❌

| 类别 | 位置               | 问题                  | 准则值                          | 实际值                     |
| ---- | ------------------ | --------------------- | ------------------------------- | -------------------------- |
| 排版 | :root              | --weight-bold: 700    | max 600                         | 700                        |
| 排版 | .cc-caption-mono   | font-weight 500       | 400                             | var(--weight-medium) = 500 |
| 排版 | .cc-body-lg        | line-height 1.6       | 28px                            | 1.6 (28.8px ≈ 但非精确)    |
| 排版 | .cc-body-md        | line-height 1.5       | 24px                            | 1.5 (24px ≈ 但非精确)      |
| 排版 | .cc-display-xl     | 缺少 font-family 声明 | Geist, Inter...                 | 未指定(依赖 body)          |
| 组件 | .cc-btn-primary    | 字号用 body-sm 14px   | button-lg 16px                  | var(--text-body-sm) = 14px |
| 组件 | .cc-btn-primary    | height 40px           | ~48px 营销级                    | 40px                       |
| 组件 | .cc-btn-secondary  | 背景 transparent      | canvas #ffffff                  | transparent                |
| 组件 | .cc-navbar-link    | border-radius 8px     | full 9999px                     | 未设置(默认)               |
| 组件 | .cc-nav-cta-signup | border-radius 100px   | sm 6px                          | 100px                      |
| 组件 | .cc-nav-cta-signup | height 36px           | 28px                            | 36px                       |
| 组件 | .cc-nav-cta-login  | border-radius 100px   | sm 6px                          | 100px                      |
| 组件 | .cc-nav-cta-login  | height 36px           | 28px                            | 36px                       |
| 阴影 | :root              | L2 opacity 0.02/0.04  | 0.02/0.04 (#00000005/#0000000a) | rgba(0,0,0,0.02/0.04) ≈ ✅ |

### 评分

| 维度      | 得分      | 说明                                              |
| --------- | --------- | ------------------------------------------------- |
| 色彩      | 10/10     | 完美匹配所有颜色 token                            |
| 排版      | 7/10      | 尺寸正确但 line-height 用比率，weight-bold 超上限 |
| 间距/圆角 | 9/10      | 间距完美，--cc-\* 圆角别名正确                    |
| 组件      | 7/10      | 大部分组件合规，nav CTA 尺寸/形状有偏差           |
| **总分**  | **33/40** |                                                   |

---

## 综合评分汇总

| 审计目标                      | 色彩    | 排版    | 间距/圆角 | 组件    | 总分        |
| ----------------------------- | ------- | ------- | --------- | ------- | ----------- |
| apps/farcaster-app            | 5       | 7       | 3         | 5       | **20/40**   |
| apps/telegram-app             | 4       | 5       | 2         | 4       | **15/40**   |
| design-system/ (CSS)          | 8       | 7       | 5         | 6       | **26/40**   |
| packages/design-tokens        | 8       | 6       | 4         | 4       | **22/40**   |
| packages/design-system        | 1       | 2       | 2         | 2       | **7/40**    |
| apps/shared-design-system.css | 10      | 7       | 9         | 7       | **33/40**   |
| **平均**                      | **6.0** | **5.7** | **4.2**   | **4.7** | **20.5/40** |

---

## 关键发现 & 建议

### 🔴 严重问题 (P0)

1. **packages/design-system 完全脱离设计准则** — 使用 GitHub 风格色板 (#58a6ff) 而非 Vercel 风格 (#171717)，字体族、间距系统、圆角全部不合规。建议：重写 tokens.ts，从 design-tokens/global.json 生成而非手工定义。

2. **design-tokens/dist/css/variables.css 构建产物错误** — 输出 --ocx-_ 前缀而非 --cc-_，色板为 Tailwind Slate 系列。建议：修复 build script，确保输出与 cinacoin.css 一致。

3. **cinacoin.css 圆角系统全部压平为 4px** — 与 global.json 定义的正确值 (sm:6 md:8 lg:12 pill:100) 严重矛盾。这是 CSS 实现与 token 定义的断裂。建议：让 cinacoin.css 从 JSON token 构建而非手工维护。

### 🟡 重要问题 (P1)

4. **两个 App 的圆角系统丢失** — farcaster-app 和 telegram-app 都将所有圆角设为 4px，丢失了 pill 100px 按钮和分级圆角体系。

5. **telegram-app 品牌色被 Telegram 主题色覆盖** — primary 变为 #6c63ff，success/warning/error 全部偏移。如果这是有意的主题适配，应在文档中说明。

6. **font-mono 使用 JetBrains Mono 而非 Geist Mono** — design-tokens/global.json 和 dist/variables.css 都用了 JetBrains Mono，但准则要求 Geist Mono。

7. **font-weight 700 存在于多处** — shared-design-system.css、global.json、tokens.ts 都定义了 700 weight，违反"weight 上限 600"准则。

### 🟢 建议改进 (P2)

8. **line-height 统一使用精确 px 值** — farcaster-app 和 shared-design-system.css 用比率 (1.5/1.6)，建议统一为准则的精确 px 值。

9. **nav-cta 组件尺寸对齐** — shared-design-system.css 的 nav-cta-signup/login 高度 36px 应改为 28px，圆角从 100px 改为 sm 6px。

10. **阴影 token 精度** — global.json 的 level2-5 opacity 略高于准则值 (0.06 vs 0.04)，建议校准。

---

_审计完成。报告由 Agent 5 生成。_
