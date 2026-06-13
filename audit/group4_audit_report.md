# Group 4 — Demo / 示例应用设计审计报告

> 审计 Agent: 004 | 审计日期: 2026-06-13  
> 审计依据: `/design-guidelines/DESIGN.md` (CINAcoin 品牌设计准则)

---

## 1. apps/demo（主 Demo — Next.js）

### 合规项 ✅

| #   | 合规点          | 说明                                                                                                                                                                                                                             |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 色彩系统完整    | `shared-design-system.css` 定义了全部品牌色：Primary/Ink #171717、Canvas #ffffff、Canvas-soft #fafafa、Body #4d4d4d、Mute #888888、Hairline #ebebeb、Link #0070f3、Error #ee0000，以及完整语义色（violet/cyan/warning/gradient） |
| 2   | 字体正确        | Geist (400/500/600) + Geist Mono (400) 通过 `localFont` 加载，变量名 `--font-geist-sans` / `--font-geist-mono`                                                                                                                   |
| 3   | 排版层级        | `.cc-display-xl` 48px/600/-2.4px、`.cc-display-lg` 32px/600/-1.28px、`.cc-display-md` 24px/600/-0.96px 等全部匹配规范                                                                                                            |
| 4   | 堆叠式阴影      | Level 1-5 全部使用多层小偏移 + inset hairline，符合"禁止单一大阴影"要求                                                                                                                                                          |
| 5   | 暗/亮主题       | 完整的 `[data-theme='light']` 和 `[data-theme='dark']` 变量映射                                                                                                                                                                  |
| 6   | Mono 用于技术层 | `.cc-code`、`.cc-code-block` 使用 `var(--font-mono)`                                                                                                                                                                             |
| 7   | 负字距          | display 层级全部使用正确的负 letter-spacing                                                                                                                                                                                      |
| 8   | 4px 间距基准    | 容器 padding 24px、card padding 24px/32px 均为 4 的倍数                                                                                                                                                                          |
| 9   | 无障碍          | focus-visible 2px link-blue outline、skip-link、sr-only、min touch target 44px                                                                                                                                                   |
| 10  | 品牌展示        | CinaCoin logo + 品牌名在 Header/Sidebar 正确展示                                                                                                                                                                                 |

### 违规项 ❌

| #   | 违规点                               | 位置                             | 规范要求                           | 实际值                      | 严重度 |
| --- | ------------------------------------ | -------------------------------- | ---------------------------------- | --------------------------- | ------ |
| 1   | 圆角全部 4px                         | `shared-design-system.css` :root | sm:6 md:8 lg:12 pill:100           | 所有 `--cc-radius-*` = 4px  | 🔴 高  |
| 2   | Button 非 pill 形                    | `.cc-btn-primary` 等             | border-radius: 100px (pill)        | border-radius: 4px          | 🔴 高  |
| 3   | Card 圆角错误                        | `.cc-card`                       | border-radius: 8px (md)            | border-radius: 4px          | 🟡 中  |
| 4   | Button-secondary 使用 transparent bg | `.cc-btn-secondary`              | bg: canvas (#ffffff)               | bg: transparent             | 🟡 中  |
| 5   | 定义了 weight-bold: 700              | CSS 变量                         | 字重上限 600                       | `--weight-bold: 700` 已定义 | 🟡 中  |
| 6   | Badge 用 semibold (600)              | `.cc-badge`                      | caption weight 400                 | font-weight: 600            | 🟢 低  |
| 7   | Navbar link 圆角 4px                 | `.cc-navbar-link`                | rounded: full (9999px) 或 sm (6px) | border-radius: 4px          | 🟡 中  |
| 8   | Form input 圆角 4px                  | `.cc-form-input`                 | rounded: sm (6px)                  | border-radius: 4px          | 🟢 低  |

### 评分

| 维度      | 得分   | 满分   | 说明                                                              |
| --------- | ------ | ------ | ----------------------------------------------------------------- |
| 色彩      | 9      | 10     | 完整品牌色 + 语义色 + 暗/亮主题，仅扣 weight-bold:700 定义        |
| 排版      | 9      | 10     | 字体/层级/字距全部正确，badge weight 偏高                         |
| 间距/圆角 | 5      | 10     | 间距正确但圆角系统严重偏差——全部 4px 无差异化                     |
| 组件      | 6      | 10     | 阴影/卡片结构好，但 button 未用 pill 形、secondary 未用 canvas bg |
| **总分**  | **29** | **40** |                                                                   |

---

## 2. apps/demo-dapp-react（React DApp Demo — Next.js）

### 合规项 ✅

| #   | 合规点                    | 说明                                                                             |
| --- | ------------------------- | -------------------------------------------------------------------------------- |
| 1   | 使用共享 design-tokens 包 | `@import '@cinacoin/design-tokens/css/cinacoin.css'`                             |
| 2   | Geist + Geist Mono 加载   | localFont 400/500/600 + Mono 400                                                 |
| 3   | 字重上限 600              | 仅定义 regular/medium/-semibold，无 bold                                         |
| 4   | 堆叠式阴影                | `--cc-shadow-sm/md/lg` 均含 shadow-ring (inset) + 多层 drop                      |
| 5   | Mono 用于技术标签         | `.cc-eyebrow`、`.cc-code`、`.cc-address-mono`、`.demo-header__address` 全部 mono |
| 6   | Sentence-case + 句号      | "Connect."、"Connection."、"Multi-chain wallet toolkit."                         |
| 7   | 排版层级完整              | display-xl 到 caption 全部定义，letter-spacing 正确                              |
| 8   | 间距 4px 基准             | `--cc-space-xxs:4` 到 `--cc-space-4xl:64`                                        |
| 9   | SDK 展示                  | ConnectButton、ConnectModal、useConnect 等 SDK 组件完整展示                      |
| 10  | 无障碍                    | focus-visible、sr-only、aria-label、touch target 44px                            |

### 违规项 ❌

| #   | 违规点                           | 位置        | 规范要求                          | 实际值                                                         | 严重度 |
| --- | -------------------------------- | ----------- | --------------------------------- | -------------------------------------------------------------- | ------ |
| 1   | 圆角全部 4px                     | `:root`     | sm:6 md:8 lg:12 pill:100          | `--cc-radius-xs` 到 `--cc-radius-xl` 全部 4px                  | 🔴 高  |
| 2   | Button 非 pill 形                | `.cc-btn`   | border-radius: 100px              | border-radius: var(--cc-radius-md) = 4px                       | 🔴 高  |
| 3   | Form input 使用 mono 字体        | `.cc-input` | font-family: sans                 | font-family: var(--cc-font-mono)                               | 🟡 中  |
| 4   | Page bg 用 canvas 非 canvas-soft | `body`      | background: canvas-soft (#fafafa) | background: var(--cc-canvas)                                   | 🟢 低  |
| 5   | 部分标签用大写                   | `.cc-label` | sentence-case                     | `letter-spacing: 0.05em`（暗示大写风格但实际是 sentence-case） | 🟢 低  |
| 6   | Button 无高度规范                | `.cc-btn`   | 48px (marketing) / 32px (sm)      | 使用 min-height: 44px (touch target)                           | 🟢 低  |

### 评分

| 维度      | 得分   | 满分   | 说明                                      |
| --------- | ------ | ------ | ----------------------------------------- |
| 色彩      | 9      | 10     | 共享 token 包，色值正确                   |
| 排版      | 9      | 10     | 字重/字体/层级正确，input 误用 mono       |
| 间距/圆角 | 5      | 10     | 间距正确，圆角全部 4px 无差异化           |
| 组件      | 7      | 10     | 阴影/卡片好，button 非 pill，SDK 展示完整 |
| **总分**  | **30** | **40** |                                           |

---

## 3. apps/demo-react（React Demo — Vite）

### 合规项 ✅

| #   | 合规点                      | 说明                                                            |
| --- | --------------------------- | --------------------------------------------------------------- |
| 1   | Geist + Geist Mono 本地加载 | 完整的 @font-face 声明 (400/500/600 + Mono 400)                 |
| 2   | 使用共享 design-tokens 包   | `@import '@cinacoin/design-tokens/css/cinacoin.css'`            |
| 3   | Pill 形按钮                 | `.btn-primary` border-radius: `var(--cc-radius-pill, 100px)` ✅ |
| 4   | Mesh gradient 正确实现      | `.cc-mesh-gradient` 使用品牌 6 色 radial-gradient               |
| 5   | 堆叠式阴影                  | `.cc-card` 使用多层小偏移 + inset                               |
| 6   | 排版层级                    | display-xl 到 caption 全部定义，letter-spacing 正确             |
| 7   | 字重上限 600                | 仅 400/500/600                                                  |
| 8   | Sentence-case + 句号        | 标题使用句号终止                                                |
| 9   | CodeExample 组件            | 使用 mono 字体，带行号和语法高亮                                |
| 10  | 无障碍                      | skip-link、focus-visible、sr-only、aria-label                   |
| 11  | 品牌展示                    | `<Brand>` 组件 + "CinaCoin" 品牌名                              |
| 12  | 代码示例区域                | `CodeExample.tsx` 使用 mono 字体 + 规范色彩                     |

### 违规项 ❌

| #   | 违规点                                     | 位置              | 规范要求             | 实际值                                                                            | 严重度 |
| --- | ------------------------------------------ | ----------------- | -------------------- | --------------------------------------------------------------------------------- | ------ |
| 1   | 引入非规范色彩                             | `index.css` :root | 不引入第六种 accent  | `--cc-demo-accent: #6366f1`（靛蓝）、`--cc-demo-success: #4ade80` 等 20+ 自定义色 | 🔴 高  |
| 2   | Form input 圆角引用 fallback 不一致        | `.cc-form-input`  | rounded: sm (6px)    | 使用 `var(--cc-radius-sm, 6px)` 但 token 包中可能是 4px                           | 🟢 低  |
| 3   | Button secondary 使用 border 而非 hairline | `.btn-secondary`  | bg canvas + text ink | 使用 border 而非纯 bg 差异                                                        | 🟢 低  |

### 评分

| 维度      | 得分   | 满分   | 说明                                                |
| --------- | ------ | ------ | --------------------------------------------------- |
| 色彩      | 7      | 10     | 基础色正确但引入 20+ 非规范 demo 色                 |
| 排版      | 9      | 10     | 字体/层级/字距全部正确                              |
| 间距/圆角 | 8      | 10     | pill 按钮正确，卡片圆角依赖 token 包                |
| 组件      | 9      | 10     | mesh gradient、stacked shadow、CodeExample 组件优秀 |
| **总分**  | **33** | **40** |                                                     |

---

## 4. apps/demo-vue（Vue Demo — Vite）

### 合规项 ✅

| #   | 合规点                      | 说明                                                 |
| --- | --------------------------- | ---------------------------------------------------- |
| 1   | Geist + Geist Mono 本地加载 | 完整 @font-face (400/500/600 + Mono 400)             |
| 2   | 使用 @cinacoin/vue SDK      | CinaCoinProvider、OcxConnectButton、ConnectModal     |
| 3   | Mono 用于技术标签           | `.brand-mark`、`.mono`、`card-desc code` 使用 mono   |
| 4   | Sentence-case + 句号        | "Connect your wallet."、"CinaCoin."、"Vue SDK demo." |
| 5   | 堆叠式阴影                  | `.card` box-shadow 使用多层 + inset                  |
| 6   | 字重上限 600                | 全部 400/500/600                                     |
| 7   | 品牌展示                    | "000" brand-mark (mono) + "CinaCoin." 标题           |
| 8   | 无障碍                      | role 属性、aria-label                                |

### 违规项 ❌

| #   | 违规点                    | 位置      | 规范要求                   | 实际值                                      | 严重度 |
| --- | ------------------------- | --------- | -------------------------- | ------------------------------------------- | ------ |
| 1   | 圆角全部 4px              | 所有组件  | sm:6 md:8 lg:12 pill:100   | 全部 `border-radius: 4px`                   | 🔴 高  |
| 2   | Button 非 pill 形         | `.btn`    | border-radius: 100px       | border-radius: 4px                          | 🔴 高  |
| 3   | 无 pill 形 CTA            | 全局      | 至少 marketing CTA 用 pill | 所有按钮均为 4px 圆角                       | 🔴 高  |
| 4   | 无 mesh gradient          | 全局      | 品牌装饰系统               | 完全缺失                                    | 🟡 中  |
| 5   | 仅暗色主题                | `App.vue` | 支持 light/dark            | 仅 dark（`mode: 'dark'`）                   | 🟡 中  |
| 6   | 间距不使用 4px 基准 token | 各组件    | 使用 rem 硬编码            | `padding: 1.25rem` 等，未引用 spacing token | 🟢 低  |
| 7   | 排版层级未系统化          | 全局      | 使用 cc-\* 排版类          | 硬编码 font-size/rem 值                     | 🟡 中  |

### 评分

| 维度      | 得分   | 满分   | 说明                                   |
| --------- | ------ | ------ | -------------------------------------- |
| 色彩      | 7      | 10     | 使用 cc-\* token 但无 mesh gradient    |
| 排版      | 7      | 10     | 字体正确但排版层级未系统化             |
| 间距/圆角 | 4      | 10     | 圆角全部 4px，间距硬编码 rem           |
| 组件      | 6      | 10     | 卡片阴影正确，button 全错，无 pill CTA |
| **总分**  | **24** | **40** |                                        |

---

## 5. apps/demo-flutter（Flutter Demo — 仅配置/文档审查）

### 合规项 ✅

| #   | 合规点            | 说明                                            |
| --- | ----------------- | ----------------------------------------------- |
| 1   | 使用 cinacoin SDK | `import 'package:cinacoin/cinacoin.dart'`       |
| 2   | 暗/亮主题切换     | ThemeMode.dark/light 切换                       |
| 3   | README 文档完整   | 功能说明、架构、SDK 集成点、Setup 步骤          |
| 4   | 功能覆盖全面      | Home/Connect/Chain/Sign/Transaction 5 个 screen |
| 5   | SDK 初始化正确    | CinacoinSdk.instance.initialize()               |

### 违规项 ❌

| #   | 违规点                  | 位置                            | 规范要求                                     | 实际值                                               | 严重度  |
| --- | ----------------------- | ------------------------------- | -------------------------------------------- | ---------------------------------------------------- | ------- |
| 1   | 主色完全错误            | `main.dart` \_buildDarkTheme    | Primary #171717                              | Primary #6C5CE7（紫色）                              | 🔴 严重 |
| 2   | 次色完全错误            | `main.dart` \_buildDarkTheme    | 无品牌次色定义                               | Secondary #00CEC9（青色）                            | 🔴 严重 |
| 3   | 使用 Inter 而非 Geist   | `main.dart`                     | Geist/Inter fallback                         | `GoogleFonts.interTextTheme()` 仅 Inter              | 🔴 高   |
| 4   | 无 Geist Mono           | 全局                            | 技术标签用 mono                              | 完全缺失 mono 字体                                   | 🔴 高   |
| 5   | FontWeight.bold (700)   | `home_screen.dart`、`main.dart` | 字重上限 600                                 | `FontWeight.bold` 多处使用                           | 🔴 高   |
| 6   | Logo gradient 错误      | `main.dart` AppBar              | 品牌 gradient (cyan-blue-magenta-amber)      | LinearGradient(#6C5CE7 → #00CEC9) 紫-青              | 🔴 高   |
| 7   | 无 design token 系统    | 全局                            | CSS/token 变量系统                           | 全部硬编码 Color()                                   | 🔴 高   |
| 8   | Material Card 默认阴影  | `status_card.dart`              | 堆叠式小偏移 + inset                         | Material 默认 elevation 阴影                         | 🟡 中   |
| 9   | 圆角 12px 无系统        | `status_card.dart`              | sm:6 md:8 lg:12                              | `BorderRadius.circular(12)` 硬编码                   | 🟡 中   |
| 10  | 无 pill 形按钮          | 全局                            | CTA 使用 pill (100px)                        | Material 默认 button shape                           | 🟡 中   |
| 11  | Scaffold bg 非规范色    | `main.dart`                     | canvas-soft #fafafa (light) / #0a0a0a (dark) | #F5F5FA (light) / #0D0D1A (dark)                     | 🟡 中   |
| 12  | 无 sentence-case + 句号 | 各 screen                       | 标题 sentence-case + period                  | "Account Information"、"Quick Actions" 等 title-case | 🟡 中   |

### 评分

| 维度      | 得分   | 满分   | 说明                                            |
| --------- | ------ | ------ | ----------------------------------------------- |
| 色彩      | 2      | 10     | 主色/次色/gradient 全部错误                     |
| 排版      | 3      | 10     | 字体错误（Inter 非 Geist），无 mono，weight 700 |
| 间距/圆角 | 4      | 10     | 使用 Material 默认，无 token 系统               |
| 组件      | 3      | 10     | Material 默认组件，无品牌 pill/stacked shadow   |
| **总分**  | **12** | **40** |                                                 |

---

## 汇总评分

| Demo App            | 色彩 (/10) | 排版 (/10) | 间距圆角 (/10) | 组件 (/10) | 总分 (/40) | 等级  |
| ------------------- | ---------- | ---------- | -------------- | ---------- | ---------- | ----- |
| **demo** (主)       | 9          | 9          | 5              | 6          | **29**     | 🟡 B- |
| **demo-dapp-react** | 9          | 9          | 5              | 7          | **30**     | 🟡 B  |
| **demo-react**      | 7          | 9          | 8              | 9          | **33**     | 🟢 A- |
| **demo-vue**        | 7          | 7          | 4              | 6          | **24**     | 🟠 C+ |
| **demo-flutter**    | 2          | 3          | 4              | 3          | **12**     | 🔴 F  |

## 跨项目共性问题

### 🔴 P0 — 必须修复

1. **圆角系统扁平化**：`demo`、`demo-dapp-react`、`demo-vue` 三个项目的 `--cc-radius-*` 全部设为 4px，丧失了 sm(6)/md(8)/lg(12)/pill(100) 的层级区分。Button 应为 pill(100px)，Card 应为 md(8px)。
2. **Flutter 品牌色完全偏离**：主色 #6C5CE7 (紫) 应为 #171717 (墨黑)，需全面对齐 design token。

### 🟡 P1 — 建议修复

3. **Button secondary 实现不一致**：规范要求 bg canvas + text ink，但 `demo` 用 transparent + border，`demo-dapp-react` 用 surface-ghost。
4. **Vue demo 缺少 mesh gradient 和 light theme**：作为品牌核心装饰系统应展示。
5. **Flutter 无 Geist 字体**：需集成 Geist/Geist Mono 的 Flutter 等效方案。

### 🟢 P2 — 可选优化

6. **demo-react 非规范 demo 色过多**：20+ `--cc-demo-*` 自定义色违反"不引入第六种 accent"原则。
7. **各 demo 间距 token 未统一引用**：部分使用 rem 硬编码而非 spacing token。

---

_报告完毕。以上审计基于源代码静态分析，未涉及运行时视觉验证。_
