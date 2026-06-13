# CINAcoin 前端设计审计报告 — Group 1

> 审计日期: 2026-06-13
> 审计依据: `/design-guidelines/DESIGN.md`
> 审计范围: website, wallet-explorer, learn, docs-site

---

## 1. Website (apps/website) — 主站 cinacoin.com

### 合规项 ✅

- **色彩系统**: 所有颜色 token 完全匹配 DESIGN.md（Primary #171717, Canvas #ffffff, Canvas-soft #fafafa, Body #4d4d4d, Mute #888888, Hairline #ebebeb, Link #0070f3, Error #ee0000）
- **字体族**: Geist Sans (400/500/600) + Geist Mono (400)，通过 `geist/font` 加载 ✅
- **字重上限**: 最高 600（semibold），无 700+ 违规 ✅
- **Display 字距**: display-xl -2.4px, display-lg -1.28px, display-md -0.96px, display-sm -0.6px ✅
- **阴影系统**: 完整的 5 级堆叠式阴影 + inset hairline，无单一大阴影 ✅
- **Mesh gradient**: 使用品牌渐变系统作为 hero 背景装饰 ✅
- **Sentence-case 标题**: 所有标题均为 sentence-case ✅
- **Mono 使用**: 仅用于代码块和技术标签（caption-mono, code-block）✅
- **暗色模式**: 完整的 light/dark 双主题 token 映射 ✅
- **无障碍**: focus-visible, sr-only, skip-to-content, aria 标注完整 ✅

### 违规项 ❌

| 位置                        | 问题                          | 当前值                       | 规范值                             | 修复建议                                   |
| --------------------------- | ----------------------------- | ---------------------------- | ---------------------------------- | ------------------------------------------ |
| globals.css `--cc-radius-*` | **所有圆角 token 统一为 4px** | sm/md/lg/pill 全部 4px       | sm:6, md:8, lg:12, xl:16, pill:100 | 按 DESIGN.md 分级设置各 radius token       |
| `.cc-btn-primary`           | **按钮形状应为 pill**         | border-radius: 4px           | border-radius: 100px (pill)        | 营销 CTA 使用 `rounded.pill` 100px         |
| `.cc-btn-primary`           | **按钮字号偏小**              | font-size: 14px (body-sm)    | 16px (button-lg)                   | 营销按钮用 button-lg 16px/500              |
| `.cc-btn-secondary`         | **次要按钮背景错误**          | background: transparent      | background: #ffffff (canvas)       | secondary 应为 canvas 白底 + hairline 边框 |
| `.cc-nav-cta-signup/login`  | **Nav CTA 高度偏大**          | height: 36px                 | height: 28px                       | 按 nav-cta 规范改为 28px                   |
| `.cc-nav-cta-signup/login`  | **Nav CTA 圆角错误**          | border-radius: 4px           | border-radius: 6px (sm)            | Nav 按钮使用 rounded.sm 6px                |
| `.cc-navbar-link`           | **导航链接圆角错误**          | border-radius: 4px           | border-radius: 9999px (full)       | Nav link ghost pill 用 rounded.full        |
| `.cc-badge`                 | **Badge 圆角错误**            | border-radius: 4px           | border-radius: 9999px (full)       | Badge 应为 full pill 形状                  |
| `.cc-form-input`            | **表单输入框圆角错误**        | border-radius: 4px           | border-radius: 6px (sm)            | Form input 使用 rounded.sm 6px             |
| `.cc-card`                  | **卡片圆角偏小**              | border-radius: 4px           | border-radius: 8px (md)            | 营销卡片使用 rounded.md 8px                |
| `.cc-card-lg`               | **大卡片圆角偏小**            | border-radius: 4px           | border-radius: 12px (lg)           | 大卡片使用 rounded.lg 12px                 |
| Footer `h4`                 | **Footer 列标题未用 mono**    | font-medium + tracking-wider | caption-mono (12px mono)           | 改用 `.cc-caption-mono` 类                 |
| `.cc-container`             | **容器最大宽度偏小**          | max-width: 1200px            | ~1400px                            | 调整至 1400px                              |
| `.cc-code-block`            | **代码块字号偏大**            | 14px (body-sm)               | 13px (code)                        | 代码块使用 code token 13px                 |
| `.text-display-lg`          | **行高微偏**                  | line-height: 1.2 (38.4px)    | 40px                               | 改为固定 40px                              |
| `.text-display-md`          | **行高微偏**                  | line-height: 1.3 (31.2px)    | 32px                               | 改为固定 32px                              |
| `.cc-body-lg`               | **行高微偏**                  | line-height: 1.6 (28.8px)    | 28px                               | 改为固定 28px                              |
| `.btn-pill` / `.btn-sm`     | **工具类圆角也全是 4px**      | border-radius: 4px           | pill: 100px, sm: 6px               | 修正各工具类圆角值                         |

### 评分

| 维度      | 得分      | 说明                                            |
| --------- | --------- | ----------------------------------------------- |
| 色彩      | 10/10     | 完整精确的色彩系统，light/dark 双主题           |
| 排版      | 8/10      | 字体/字重/字距优秀，行高有微小偏差              |
| 间距/圆角 | 4/10      | 间距系统正确，但圆角全部坍塌为 4px 是系统性问题 |
| 组件      | 6/10      | 组件结构完整，但按钮形状/尺寸多处偏离规范       |
| **总分**  | **28/40** |                                                 |

---

## 2. Wallet Explorer (apps/wallet-explorer) — 钱包

### 合规项 ✅

- **色彩系统**: 通过 shared-design-system.css 共享，核心色值匹配 ✅
- **字体族**: Geist Sans (400/500/600) + Geist Mono (400) 本地 woff2 加载 ✅
- **字重上限**: 定义到 600（但定义了 --weight-bold:700 未使用）⚠️
- **阴影系统**: 5 级堆叠阴影 + inset hairline ✅
- **Mono 用于技术内容**: 地址显示用 mono，金额用 mono ✅
- **代码编辑器 mockup**: 暗色背景 + rounded corners ✅
- **Code block**: border-radius: 8px 符合 rounded.md ✅

### 违规项 ❌

| 位置                                     | 问题                          | 当前值                                     | 规范值                                    | 修复建议                                                    |
| ---------------------------------------- | ----------------------------- | ------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------- |
| shared-design-system.css `--weight-bold` | **定义了 700 字重 token**     | --weight-bold: 700                         | 不应存在（上限 600）                      | 删除 --weight-bold: 700                                     |
| shared-design-system.css `--cc-radius-*` | **所有圆角 4px**              | sm/md/lg/pill 全部 4px                     | sm:6, md:8, lg:12, pill:100               | 按规范分级设置                                              |
| `.cc-btn-primary`                        | **按钮非 pill 形**            | border-radius: 4px                         | border-radius: 100px                      | 主按钮改为 pill 100px                                       |
| `.cc-btn-primary`                        | **按钮字号偏小**              | 14px (body-sm)                             | 16px (button-lg)                          | 营销按钮用 16px                                             |
| `--color-hairline`                       | **Hairline 用 rgba 而非 hex** | rgba(0,0,0,0.08)                           | #ebebeb                                   | 统一为 #ebebeb（视觉近似但 token 不一致）                   |
| Navigation.tsx                           | **使用未定义的 CSS 类**       | `text-heading-3`, `text-mute`, `text-link` | 应使用 `cc-*` 类或 CSS 变量               | 统一为 `cc-display-sm`, `var(--cc-muted)`, `var(--cc-link)` |
| Navigation.tsx                           | **Nav tab 圆角**              | rounded-sm (4px)                           | rounded.full (9999px) 或 rounded.sm (6px) | Tab 用 pill-sm 64px 或至少 6px                              |
| WalletInfo.tsx                           | **Stat 卡片圆角**             | rounded-sm (4px)                           | rounded.md (8px)                          | 内部卡片使用 8px                                            |
| page.tsx (dark hero)                     | **暗色 hero band 圆角**       | rounded-sm (4px)                           | 0px (全出血)                              | showcase-band-dark 应无圆角                                 |
| `data-theme="dark"`                      | **硬编码暗色主题**            | html 固定 dark                             | 应支持 light/dark 切换                    | 添加主题切换器或使用 light 默认                             |
| `.search-bar`                            | **搜索框圆角**                | 4px                                        | 6px (sm)                                  | 使用 rounded.sm                                             |

### 评分

| 维度      | 得分      | 说明                                    |
| --------- | --------- | --------------------------------------- |
| 色彩      | 8/10      | 色值基本正确，hairline token 表达不一致 |
| 排版      | 8/10      | 字体系统正确，存在未使用的 700 token    |
| 间距/圆角 | 4/10      | 同 website，圆角全部坍塌为 4px          |
| 组件      | 5/10      | 存在未定义 CSS 类引用，硬编码暗色主题   |
| **总分**  | **25/40** |                                         |

---

## 3. Learn (apps/learn) — 学习中心

### 合规项 ✅

- **色彩系统**: cc-\* token 完整定义，色值匹配 ✅
- **字体族**: Geist Sans + Geist Mono 本地加载 ✅
- **字重上限**: 最高 600 ✅
- **Display-xl**: 48px/600/-2.4px ✅
- **阴影系统**: 4 级堆叠阴影 + hairline ring ✅
- **Mono 用于代码**: CodeBlock 组件正确使用 mono 字体 ✅
- **代码块**: 暗色背景 #171717 符合 code-editor-mockup 规范 ✅
- **Sentence-case 标题**: 所有标题 sentence-case + 句号结尾 ✅

### 违规项 ❌

| 位置                        | 问题                    | 当前值                           | 规范值                                       | 修复建议                                           |
| --------------------------- | ----------------------- | -------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| globals.css `--cc-radius-*` | **所有圆角 4px**        | xs 到 pill 全部 4px              | xs:4, sm:6, md:8, lg:12, xl:16, pill:100     | 按规范分级                                         |
| `.cc-btn-primary`           | **按钮非 pill 形**      | border-radius: 4px               | border-radius: 100px                         | 主按钮改 pill                                      |
| `.cc-btn-secondary`         | **次要按钮背景**        | background: canvas (白)          | ✅ 这个正确                                  | —                                                  |
| `.text-display-lg`          | **行高偏小**            | 1.15 (36.8px)                    | 40px                                         | 改为 40px                                          |
| `.text-display-md`          | **字距偏小**            | -0.72px                          | -0.96px                                      | 改为 -0.96px                                       |
| `.text-display-md`          | **行高偏小**            | 1.2 (28.8px)                     | 32px                                         | 改为 32px                                          |
| `.text-display-sm`          | **字距偏小**            | -0.4px                           | -0.6px                                       | 改为 -0.6px                                        |
| `.text-display-sm`          | **行高偏小**            | 1.25 (25px)                      | 28px                                         | 改为 28px                                          |
| `.text-body-md`             | **行高偏大**            | 1.6 (25.6px)                     | 24px (1.5)                                   | 改为 1.5                                           |
| `.text-caption`             | **字重偏大**            | 500 (medium)                     | 400 (regular)                                | Caption 应为 400                                   |
| `data-theme="dark"`         | **硬编码暗色主题**      | html 固定 dark                   | 应支持主题切换                               | 添加主题切换                                       |
| Sidebar.tsx                 | **侧边栏 active 背景**  | rgba(0,112,243,0.1)              | 不在设计系统中                               | 使用 canvas-soft-2 或定义专用 token                |
| TutorialCard.tsx            | **卡片标题字号**        | text-body-lg (18px) semibold     | 应为 display-sm (20px/600) 或 body-md-strong | 卡片标题层级偏低                                   |
| page.tsx hero               | **Hero 暗色 band 圆角** | rounded-lg (4px in their system) | 0px (全出血)                                 | 移除圆角                                           |
| CodeBlock.tsx               | **硬编码颜色值**        | #171717, #1e1e1e, #2e2e2e        | 应使用 cc-\* token                           | 改用 var(--cc-primary), var(--cc-canvas-soft-2) 等 |

### 评分

| 维度      | 得分      | 说明                                        |
| --------- | --------- | ------------------------------------------- |
| 色彩      | 9/10      | 色彩系统完整准确                            |
| 排版      | 6/10      | Display 行高/字距多处偏差，caption 字重错误 |
| 间距/圆角 | 4/10      | 圆角全部坍塌为 4px                          |
| 组件      | 6/10      | 组件结构合理，有硬编码值和主题锁定问题      |
| **总分**  | **25/40** |                                             |

---

## 4. Docs Site (apps/docs-site) — 文档站

### 合规项 ✅

- **色彩系统**: cc-\* token 对齐主站，light/dark 双主题 ✅
- **字体族**: Geist + Geist Mono 通过 Google Fonts 加载 ✅
- **字重上限**: 主要使用 400/500/600 ✅
- **Navbar 高度**: 64px ✅
- **Mono 使用**: pagination sublabel, inline code, code block 均用 mono ✅
- **堆叠阴影**: card 使用 3 层阴影 + inset ✅
- **容器宽度**: 1200px（略小于规范但可接受）✅
- **负面字距**: h1-h4 均使用负 letter-spacing ✅
- **Focus visible**: 完整的键盘导航焦点样式 ✅
- **无障碍**: reduced-motion, touch target 44px ✅

### 违规项 ❌

| 位置                         | 问题                          | 当前值                                 | 规范值                                             | 修复建议                |
| ---------------------------- | ----------------------------- | -------------------------------------- | -------------------------------------------------- | ----------------------- |
| custom.css 全局              | **所有圆角 4px**              | --ifm-global-radius: 4px, 所有组件 4px | 按组件分级: card 8px, button pill 100px, input 6px | 分组件设置不同 radius   |
| Dark theme `--cc-canvas`     | **暗色 canvas 偏黑**          | #000000                                | #0a0a0a                                            | 改为 #0a0a0a            |
| Dark theme `--cc-ink`        | **暗色 ink 偏暗**             | #ededed                                | #f5f5f5                                            | 改为 #f5f5f5            |
| `--ifm-font-weight-semibold` | **Semibold 被覆盖为 500**     | 500                                    | 600                                                | 改为 600                |
| `.landing-btn`               | **按钮非 pill 形**            | border-radius: 4px                     | border-radius: 100px (pill)                        | 营销按钮改 pill         |
| `.landing-card`              | **卡片圆角偏小**              | border-radius: 4px                     | border-radius: 8px (md)                            | 改 8px                  |
| `.footer__title`             | **Footer 标题正向字距**       | letter-spacing: 0.05em                 | 0 或负值（规范禁止正向字距）                       | 移除正向 letter-spacing |
| `.footer__title`             | **Footer 标题未用 mono**      | 使用 base font                         | caption-mono                                       | 改用 mono 字体          |
| Typography scale             | **使用 rem 而非 px**          | h1: 2.5rem, h2: 1.75rem                | 48px/32px/24px/20px                                | 建议统一为 px 值        |
| `.markdown h1`               | **H1 字距不够**               | -0.05em ≈ -2px at 40px                 | -2.4px at 48px                                     | 匹配 display-xl token   |
| `.card`                      | **卡片阴影层级**              | 3 层但 opacity 偏高 (0.03/0.06)        | 0.02/0.04 (Level 2)                                | 降低阴影透明度          |
| `.navbar-github-link`        | **Nav CTA 圆角**              | 4px                                    | 6px (sm)                                           | 改为 6px                |
| `.tabs__item`                | **Tab 圆角**                  | 4px                                    | 64px (pill-sm)                                     | Tab 应为 pill-sm 64px   |
| `.badge`                     | **Badge 圆角**                | 4px                                    | 9999px (full)                                      | Badge 应为 full pill    |
| `api-reference.tsx`          | **Service selector 按钮字重** | font-semibold (active)                 | font-medium (500)                                  | 按钮不用 600            |

### 评分

| 维度      | 得分      | 说明                                          |
| --------- | --------- | --------------------------------------------- |
| 色彩      | 8/10      | 系统完整，暗色模式 canvas/ink 值偏差          |
| 排版      | 7/10      | 字体正确，semibold 覆盖错误，rem vs px 不一致 |
| 间距/圆角 | 4/10      | 圆角全部 4px，tab/badge/button 形状错误       |
| 组件      | 7/10      | Docusaurus 集成良好，阴影/边框规范            |
| **总分**  | **26/40** |                                               |

---

## 跨应用系统性问题汇总

### 🔴 严重 (P0)

1. **圆角坍塌**: 4 个应用全部将所有 radius token 设为 4px。DESIGN.md 定义了从 4px 到 9999px 的完整圆角阶梯，但实际代码中 button pill(100px)、card md(8px)、badge full(9999px)、tab pill-sm(64px) 全部缺失。**这是最大的系统性偏差。**

2. **按钮形状错误**: 所有营销 CTA 按钮应为 100px pill 形，实际全部为 4px 方角。这严重偏离了品牌视觉识别。

### 🟡 中等 (P1)

3. **按钮字号偏小**: website 和 wallet-explorer 的营销按钮用 14px，规范要求 16px (button-lg)。
4. **次要按钮背景**: website 的 button-secondary 用 transparent，规范要求 canvas (#ffffff)。
5. **暗色主题硬编码**: wallet-explorer 和 learn 硬编码 `data-theme="dark"`，缺少主题切换能力。
6. **Display 行高偏差**: learn 的 display-lg/md/sm 行高均偏小 2-3px。

### 🟢 轻微 (P2)

7. **Hairline token 表达不一致**: wallet-explorer 用 rgba()，website 用 hex #ebebeb。
8. **Footer 列标题**: website 和 docs-site 未使用 mono 字体。
9. **正向字距**: docs-site footer 标题使用正向 letter-spacing，规范明确禁止。
10. **未定义 CSS 类**: wallet-explorer 引用 `text-heading-3`, `text-mute` 等未定义类。

---

## 总分排名

| 排名 | 应用            | 色彩 | 排版 | 间距/圆角 | 组件 | 总分      |
| ---- | --------------- | ---- | ---- | --------- | ---- | --------- |
| 1    | website         | 10   | 8    | 4         | 6    | **28/40** |
| 2    | docs-site       | 8    | 7    | 4         | 7    | **26/40** |
| 3    | wallet-explorer | 8    | 8    | 4         | 5    | **25/40** |
| 3    | learn           | 9    | 6    | 4         | 6    | **25/40** |

**最高优先级修复**: 圆角系统分级 + 按钮 pill 形状 → 这一项改动将同时提升所有应用的「间距/圆角」和「组件」得分。
