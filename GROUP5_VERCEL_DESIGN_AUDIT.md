# Group 5 — Vercel 设计准则审计报告

**审计日期**: 2026-06-13  
**审计范围**: telegram-app, farcaster-app, docs-site, demo-vue  
**对照标准**: Vercel 官网设计系统（design-guidelines/vercel-design-audit-guide.md）

---

## 核心规范速查

| #   | 规范         | 要求                    |
| --- | ------------ | ----------------------- |
| 1   | 深色模式优先 | 默认深色，背景 #000000  |
| 2   | 圆角         | 组件 4px，营销页 0px    |
| 3   | 色彩         | 黑白 + 灰度阶梯         |
| 4   | 图标         | 线性极简 2px，无 emoji  |
| 5   | 字体         | Geist Sans + Geist Mono |
| 6   | 边框         | 1px 半透明              |
| 7   | 无装饰元素   | 无渐变卡片、无装饰插画  |

---

## 一、telegram-app

**技术栈**: React + Vite + TypeScript  
**文件**: `apps/telegram-app/src/`

### ✅ 合规项

| 规范     | 状态 | 说明                                                           |
| -------- | ---- | -------------------------------------------------------------- |
| 字体     | ✅   | Geist Sans + Geist Mono 通过 @font-face 本地加载               |
| 图标     | ✅   | 全部使用 lucide-react 线性图标（Send, Download, RefreshCw 等） |
| 无 emoji | ✅   | 未发现 emoji 用作图标                                          |
| 边框     | ✅   | `1px solid rgba(255, 255, 255, 0.08)` 半透明细边框             |
| 键盘导航 | ✅   | `:focus-visible` 已实现                                        |

### ❌ 偏差项

| #   | 规范             | 偏差                      | 严重程度 | 详情                                                                                                     |
| --- | ---------------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| T-1 | 深色背景 #000000 | 背景色非纯黑              | 🔴 高    | `--cc-bg` 回退值为 `#1a1a2e`（深蓝），非 `#000000`                                                       |
| T-2 | 色彩：黑白+灰度  | 主色为品牌紫              | 🔴 高    | `--cc-primary: #6c63ff`（紫色），违反黑白+灰度阶梯规范                                                   |
| T-3 | 圆角 4px         | 组件圆角远超 4px          | 🔴 高    | 定义了 6px/8px/12px/16px/100px/9999px 六级圆角；按钮使用 `pill`（100px），卡片使用 16px，输入框使用 12px |
| T-4 | 圆角 4px         | BalanceCard 圆角 16px     | 🟡 中    | `.balance-card-inner { border-radius: var(--cc-radius-xl) }` = 16px                                      |
| T-5 | 圆角 4px         | QuickAction 按钮圆角 12px | 🟡 中    | `.quick-action-btn { border-radius: var(--cc-radius-lg) }` = 12px                                        |
| T-6 | 圆角 4px         | 交易列表项圆角 12px       | 🟡 中    | `.transaction-item { border-radius: var(--cc-radius-lg) }` = 12px                                        |
| T-7 | 圆角 4px         | 所有按钮使用 pill 圆角    | 🟡 中    | `.cc-btn-primary { border-radius: var(--cc-radius-pill) }` = 100px                                       |
| T-8 | 圆角 4px         | 表单输入框圆角 12px       | 🟡 中    | `.form-input { border-radius: var(--cc-radius-lg) }` = 12px                                              |
| T-9 | 色彩：灰度       | 成功/错误/警告使用彩色    | 🟢 低    | `--cc-success: #00c853`, `--cc-error: #ff5252`, `--cc-warning: #ffab00` — 这些语义色可接受但偏离灰度     |

### 偏差统计

- 🔴 高严重度：3 项
- 🟡 中严重度：5 项
- 🟢 低严重度：1 项

---

## 二、farcaster-app

**技术栈**: Next.js + Tailwind CSS + TypeScript  
**文件**: `apps/farcaster-app/src/`

### ✅ 合规项

| 规范     | 状态 | 说明                                              |
| -------- | ---- | ------------------------------------------------- |
| 字体     | ✅   | Geist Sans + Geist Mono 通过 next/font/local 加载 |
| 图标     | ✅   | 全部使用 lucide-react 线性图标                    |
| 无 emoji | ✅   | 未发现 emoji 用作图标                             |
| 边框     | ✅   | `border border-[var(--cc-hairline)]` 1px 边框     |
| 键盘导航 | ✅   | `:focus-visible` + min 44px touch target          |

### ❌ 偏差项

| #    | 规范             | 偏差                    | 严重程度 | 详情                                                                               |
| ---- | ---------------- | ----------------------- | -------- | ---------------------------------------------------------------------------------- |
| F-1  | 深色背景 #000000 | 背景色非纯黑            | 🟡 中    | `--cc-canvas: #0a0a0a`，接近但非 `#000000`                                         |
| F-2  | 色彩：黑白+灰度  | 主按钮为紫色            | 🔴 高    | `--cc-violet: #855dcd` 作为主按钮色，违反灰度规范                                  |
| F-3  | 色彩：黑白+灰度  | 链接色偏离              | 🟢 低    | `--cc-link: #0052ff`，与规范的 `#0070F3` 略有不同                                  |
| F-4  | 圆角 4px         | 大量组件使用 12px+ 圆角 | 🔴 高    | 全面使用 Tailwind `rounded-xl`（12px）、`rounded-2xl`（16px）、`rounded-lg`（8px） |
| F-5  | 圆角 4px         | 主页按钮 `rounded-xl`   | 🟡 中    | Action grid 按钮使用 `rounded-xl` = 12px                                           |
| F-6  | 圆角 4px         | 卡片 `rounded-2xl`      | 🔴 高    | ProfileCard、FrameRenderer 等卡片使用 `rounded-2xl` = 16px                         |
| F-7  | 圆角 4px         | 输入框 `rounded-lg`     | 🟡 中    | Transfer/Sign 页面输入框使用 `rounded-lg` = 8px                                    |
| F-8  | 无装饰元素       | 渐变头像                | 🟡 中    | ProfileCard 未连接时使用 `bg-gradient-to-br from-violet to-link` 渐变              |
| F-9  | 无装饰元素       | 终端窗口装饰            | 🟢 低    | 首页 code mockup 含三个圆点模拟终端窗口                                            |
| F-10 | 无装饰元素       | 重阴影                  | 🟢 低    | FrameRenderer 使用 `shadow-2xl`                                                    |

### 偏差统计

- 🔴 高严重度：3 项
- 🟡 中严重度：4 项
- 🟢 低严重度：3 项

---

## 三、docs-site

**技术栈**: Docusaurus + CSS  
**文件**: `apps/docs-site/`

### ✅ 合规项

| 规范       | 状态 | 说明                                         |
| ---------- | ---- | -------------------------------------------- |
| 字体       | ✅   | Geist + Geist Mono（通过 Google Fonts CDN）  |
| 无 emoji   | ✅   | 未发现 emoji 图标                            |
| 边框       | ✅   | 1px solid 半透明边框                         |
| 深色主题   | ✅   | 深色主题 token 已定义（`data-theme='dark'`） |
| 代码块深色 | ✅   | Prism 代码块使用深色背景 `#1e1e1e`           |

### ❌ 偏差项

| #    | 规范             | 偏差              | 严重程度    | 详情                                                  |
| ---- | ---------------- | ----------------- | ----------- | ----------------------------------------------------- |
| D-1  | **深色模式优先** | **默认浅色模式**  | 🔴 **严重** | `colorMode.defaultMode: 'light'`，Vercel 要求默认深色 |
| D-2  | 圆角 4px         | 全局圆角 8px      | 🔴 高       | `--ifm-global-radius: 8px`，所有继承组件均为 8px      |
| D-3  | 圆角 4px         | 卡片 8px          | 🟡 中       | `.card { border-radius: 8px }`                        |
| D-4  | 圆角 4px         | 代码块 8px        | 🟡 中       | `.prism-code { border-radius: 8px }`                  |
| D-5  | 圆角 4px         | 菜单链接 6px      | 🟡 中       | `.menu__link { border-radius: 6px }`                  |
| D-6  | 圆角 4px         | Landing 按钮 pill | 🟡 中       | `.landing-btn { border-radius: 100px }`               |
| D-7  | 圆角 4px         | Navbar 项 pill    | 🟡 中       | `.navbar__item { border-radius: 9999px }`             |
| D-8  | 圆角 4px         | Tabs pill         | 🟡 中       | `.tabs__item { border-radius: 64px }`                 |
| D-9  | 圆角 4px         | Badge pill        | 🟢 低       | `.badge { border-radius: 9999px }`                    |
| D-10 | 无装饰元素       | 卡片 box-shadow   | 🟡 中       | 卡片使用多层 box-shadow，Vercel 仅用边框              |
| D-11 | 无装饰元素       | Landing 卡片阴影  | 🟡 中       | `.landing-card` 含 inset box-shadow                   |
| D-12 | 色彩             | Prism 主题彩色    | 🟢 低       | 使用 `nightOwl` 多彩语法高亮，非极简单色              |
| D-13 | 字体加载         | Google Fonts CDN  | 🟢 低       | 使用 Google Fonts 而非本地 woff2，可能影响性能        |

### Docusaurus 特殊审计

| 检查项                   | 状态    | 说明                                           |
| ------------------------ | ------- | ---------------------------------------------- |
| CSS 主题匹配 Vercel 风格 | ⚠️ 部分 | 深色主题 token 正确，但默认浅色违反 dark-first |
| 侧边栏样式               | ✅      | 1px 边框分隔，简洁                             |
| 代码块风格               | ✅      | 深色背景 + Geist Mono                          |
| 导航栏                   | ⚠️      | 使用 backdrop-filter blur，但 pill 圆角偏离    |

### 偏差统计

- 🔴 严重：1 项（默认浅色模式）
- 🔴 高：1 项
- 🟡 中：7 项
- 🟢 低：3 项

---

## 四、demo-vue

**技术栈**: Vue 3 + Vite + TypeScript  
**文件**: `apps/demo-vue/src/`

### ✅ 合规项

| 规范     | 状态 | 说明                                     |
| -------- | ---- | ---------------------------------------- |
| 字体     | ✅   | Geist + Geist Mono 本地加载              |
| 图标     | ✅   | 内联 SVG 线性图标 + 文字缩写（MM/WC/CB） |
| 无 emoji | ✅   | 使用 unicode 字符（✓/↻/✕/↗）代替 emoji   |
| 边框     | ✅   | 1px solid 边框                           |

### ❌ 偏差项

| #   | 规范             | 偏差             | 严重程度    | 详情                                                                                    |
| --- | ---------------- | ---------------- | ----------- | --------------------------------------------------------------------------------------- |
| V-1 | **深色模式优先** | **默认浅色模式** | 🔴 **严重** | `body { background: var(--cc-canvas-soft, #fafafa) }` 默认白色背景                      |
| V-2 | 圆角 4px         | 卡片 8px         | 🟡 中       | `.card { border-radius: 8px }`                                                          |
| V-3 | 圆角 4px         | 按钮 pill        | 🟡 中       | `.btn { border-radius: 100px }`                                                         |
| V-4 | 圆角 4px         | 输入框 6px       | 🟡 中       | `.text-input { border-radius: 6px }`                                                    |
| V-5 | 圆角 4px         | Prompt card 12px | 🟡 中       | `.prompt-card { border-radius: 0.75rem }` = 12px                                        |
| V-6 | 圆角 4px         | Wallet items 6px | 🟢 低       | `.wallet-item { border-radius: 6px }`                                                   |
| V-7 | 圆角 4px         | Chain items 6px  | 🟢 低       | `.chain-item { border-radius: 6px }`                                                    |
| V-8 | 无装饰元素       | 卡片 box-shadow  | 🟡 中       | 所有卡片使用 `box-shadow: 0 1px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)` |
| V-9 | 色彩             | 语义色混用       | 🟢 低       | `--cc-success` 映射到 `#0070f3`（蓝色），语义混乱                                       |

### 偏差统计

- 🔴 严重：1 项（默认浅色模式）
- 🟡 中：4 项
- 🟢 低：3 项

---

## 跨应用汇总

### 按规范类别统计偏差

| 规范类别        | telegram-app | farcaster-app |   docs-site    |   demo-vue   |  总计  |
| --------------- | :----------: | :-----------: | :------------: | :----------: | :----: |
| 深色模式优先    |      🔴      |      🟡       |      🔴🔴      |     🔴🔴     | **6**  |
| 圆角 4px        | 🔴🟡🟡🟡🟡🟡 |    🔴🟡🟡     | 🔴🟡🟡🟡🟡🟡🟡 | 🟡🟡🟡🟡🟢🟢 | **24** |
| 色彩：黑白+灰度 |     🔴🟢     |     🔴🟢      |       🟢       |      🟢      | **4**  |
| 无装饰元素      |      —       |    🟡🟢🟢     |     🟡🟡🟢     |      🟡      | **7**  |
| 字体            |      ✅      |      ✅       |       ✅       |      ✅      | **0**  |
| 图标            |      ✅      |      ✅       |       ✅       |      ✅      | **0**  |
| 边框            |      ✅      |      ✅       |       ✅       |      ✅      | **0**  |

### 按严重程度统计

| 严重程度 | 数量 | 说明                                     |
| -------- | :--: | ---------------------------------------- |
| 🔴 严重  |  2   | docs-site + demo-vue 默认浅色模式        |
| 🔴 高    |  5   | 背景色非纯黑、主色偏离灰度、全局圆角超标 |
| 🟡 中    |  20  | 组件级圆角超标、装饰阴影、渐变           |
| 🟢 低    |  9   | 轻微色值差异、低优先级偏差               |

---

## 关键发现

### 🔴 最严重的 3 个问题

1. **docs-site 和 demo-vue 默认浅色模式**  
   Vercel 设计哲学的核心是 "Dark Mode First"。docs-site 的 `defaultMode: 'light'` 和 demo-vue 的白色背景直接违反这一原则。这两个应用应默认深色。

2. **全局圆角超标（所有 4 个应用）**  
   Vercel 规范要求组件 4px、营销页 0px。但所有应用普遍使用 8px-16px 圆角，按钮甚至使用 pill（100px）。这是最普遍的偏差，涉及 24 处。

3. **品牌色偏离灰度规范（telegram-app + farcaster-app）**  
   telegram-app 使用 `#6c63ff` 紫色主色，farcaster-app 使用 `#855dcd` 紫色按钮。Vercel 规范要求黑白+灰度阶梯，极少强调色。

### ✅ 做得好的方面

- **字体系统**：4 个应用全部正确使用 Geist Sans + Geist Mono
- **图标系统**：全部使用线性图标（lucide-react / SVG），无 emoji
- **边框**：全部使用 1px 半透明边框
- **键盘可访问性**：`:focus-visible` 在所有应用中实现

---

## 修复优先级建议

| 优先级 | 行动                                   | 影响应用                    |
| :----: | -------------------------------------- | --------------------------- |
|   P0   | docs-site 和 demo-vue 切换默认深色模式 | docs-site, demo-vue         |
|   P0   | 所有应用组件圆角统一为 4px             | 全部 4 个                   |
|   P1   | telegram-app 背景色改为 #000000        | telegram-app                |
|   P1   | 主色从品牌紫改为黑白灰                 | telegram-app, farcaster-app |
|   P2   | 移除卡片 box-shadow，仅保留边框        | docs-site, demo-vue         |
|   P2   | 移除装饰渐变                           | farcaster-app               |
|   P3   | docs-site 字体改为本地 woff2           | docs-site                   |

---

_本报告仅审计，不修复。_
