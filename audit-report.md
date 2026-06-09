# CINAcoin 网站设计审计报告

**审计日期：** 2026-06-05  
**审计工具：** Playwright (headless Chromium) + HTML/CSS 源码分析  
**对比标准：** `design-guidelines/DESIGN.md` (Vercel-Inspired Design System)

---

## 1. cinacoin.com（主站）

### 1.1 基本信息
- **标题：** `Cinacoin — Onchain Access, Simplified`
- **框架：** Next.js (App Router)
- **字体：** Inter (正文) + JetBrains Mono (代码/标签)
- **CSS 变量前缀：** `--cc-*`（完整实现设计系统 token）

### 1.2 结构检查

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Logo | ✅ 存在 | `/logo.png`，32x32，`rounded-lg` |
| 导航栏 | ✅ 存在 | 固定顶部，`h-16`，`border-b` hairline，`bg-canvas` |
| 导航链接 | ✅ 存在 | Products / Pricing / Docs / GitHub |
| Hero 区域 | ✅ 存在 | 居中布局，含 mesh gradient 背景 |
| CTA 按钮 | ✅ 存在 | `cc-btn-primary` + `cc-btn-secondary` |
| Footer | ✅ 存在 | 5列布局，含 X/GitHub/Discord 图标 |
| 功能卡片 | ✅ 存在 | 6 张卡片，3-up 网格（`lg:grid-cols-3`） |
| 统计数据 | ✅ 存在 | 4 列数据展示（16 / 52 / 5 / 100%） |
| 产品区块 | ✅ 存在 | 6 个产品卡片（AppKit/Auth/Relay/Push/Keys/RPC Proxy） |
| 开发者区块 | ✅ 存在 | 双列布局 + 代码编辑器 mockup |
| CTA 暗色区块 | ✅ 存在 | `bg-[var(--cc-primary)]` 极性翻转 |

### 1.3 DESIGN.md 合规性

#### 按钮形状
| 组件 | 预期 | 实际 | 状态 |
|------|------|------|------|
| `cc-btn-primary` | `border-radius: 100px` (pill) | `border-radius: var(--cc-radius-pill)` → 100px | ✅ |
| `cc-btn-primary-sm` | `border-radius: 100px` (pill) | `border-radius: var(--cc-radius-pill)` | ✅ |
| `cc-btn-secondary` | `border-radius: 100px` (pill) | `border-radius: var(--cc-radius-pill)` | ✅ |
| 导航 CTA | `border-radius: 6px` (sm) | 使用 `cc-btn-primary-sm` (pill) | ⚠️ 不一致 |

#### 排版
| Token | 预期 | 实际 | 状态 |
|-------|------|------|------|
| `cc-display-xl` | 48px/600/48px/-2.4px | 完全匹配 | ✅ |
| `cc-display-lg` | 32px/600/40px/-1.28px | 完全匹配 | ✅ |
| `cc-display-md` | 24px/600/32px/-0.96px | 完全匹配 | ✅ |
| `cc-display-sm` | 20px/600/28px/-0.6px | 完全匹配 | ✅ |
| `cc-body-lg` | 18px/400/28px | 完全匹配 | ✅ |
| `cc-body-sm` | 14px/400/20px/-0.28px | 完全匹配 | ✅ |
| `cc-caption-mono` | 12px/400/16px + uppercase + letter-spacing | 有 `text-transform:uppercase; letter-spacing:.5px` | ✅ |
| `cc-code` | 13px/400/20px mono | 完全匹配 | ✅ |

#### 颜色系统
| Token | 预期 | 实际 | 状态 |
|-------|------|------|------|
| `--cc-primary` | `#171717` | `#171717` | ✅ |
| `--cc-ink` | `#171717` | `#171717` | ✅ |
| `--cc-body` | `#4d4d4d` | `#4d4d4d` | ✅ |
| `--cc-muted` | `#888888` | `#888888` | ✅ |
| `--cc-canvas` | `#ffffff` | `#ffffff` | ✅ |
| `--cc-canvas-soft` | `#fafafa` | `#fafafa` | ✅ |
| `--cc-hairline` | `#ebebeb` | `#ebebeb` | ✅ |
| `--cc-link` | `#0070f3` | `#0070f3` | ✅ |
| `--cc-violet` | `#7928ca` | `#7928ca` | ✅ |
| `--cc-cyan` | `#50e3c2` | `#50e3c2` | ✅ |

**暗色模式也完整实现**，所有 token 在 `[data-theme=dark]` 中有对应值。✅

#### 间距系统
| Token | 预期 | 实际 | 状态 |
|-------|------|------|------|
| xxs → 4px | ✅ | ✅ | ✅ |
| xs → 8px | ✅ | ✅ | ✅ |
| sm → 12px | ✅ | ✅ | ✅ |
| md → 16px | ✅ | ✅ | ✅ |
| lg → 24px | ✅ | ✅ | ✅ |
| xl → 32px | ✅ | ✅ | ✅ |
| 2xl → 40px | ✅ | ✅ | ✅ |
| 3xl → 48px | ✅ | ✅ | ✅ |
| 4xl → 64px | ✅ | ✅ | ✅ |
| 5xl → 96px | ✅ | ✅ | ✅ |
| 6xl → 128px | ✅ | ✅ | ✅ |
| section → 192px | ✅ | ✅ | ✅ |

#### Mesh Gradient
- **定义：** `.cc-mesh-gradient` / `.cc-mesh-gradient-strong`
- **实现：** 6 层 radial-gradient 叠加（develop/preview/ship 三色对 + cyan）
- **Hero 使用：** `cc-mesh-gradient-strong` + `opacity:.18`
- **CTA 暗色区使用：** `cc-mesh-gradient-strong` + `opacity:0.08`
- **状态：** ✅ 完全符合 DESIGN.md 的 mesh gradient 规范

#### 阴影层级
| 层级 | 预期 | 实际 | 状态 |
|------|------|------|------|
| Level 0 | none | none | ✅ |
| Level 1 | 1px inset hairline | `0 0 0 1px rgba(0,0,0,0.08) inset` | ✅ |
| Level 2 | stacked 1px+2px + inset | 完全匹配 | ✅ |
| Level 3 | stacked 2px+8px + inset | 完全匹配 | ✅ |
| Level 4 | stacked 2px+8/16px + inset | 完全匹配 | ✅ |
| Level 5 | stacked 1px+8px+24px + inset | 完全匹配 | ✅ |

#### 圆角系统
| Token | 预期 | 实际 | 状态 |
|-------|------|------|------|
| none → 0px | ✅ | ✅ | ✅ |
| xs → 4px | ✅ | ✅ | ✅ |
| sm → 6px | ✅ | ✅ | ✅ |
| md → 8px | ✅ | ✅ | ✅ |
| lg → 12px | ✅ | ✅ | ✅ |
| xl → 16px | ✅ | ✅ | ✅ |
| pill-sm → 64px | ✅ | ✅ | ✅ |
| pill → 100px | ✅ | ✅ | ✅ |
| full → 9999px | ✅ | ✅ | ✅ |

### 1.4 响应式布局
- ✅ 断点：`sm` (640px), `md` (768px), `lg` (1024px)
- ✅ 网格响应：3-up → 2-up → 1-up
- ✅ 导航在 `md` 以下折叠为汉堡菜单
- ✅ Hero padding 响应式调整（`pt-32 pb-24` → `md:pt-40 md:pb-32`）

### 1.5 发现的问题

#### 🔴 严重
1. **所有文本内容为国际化占位符** — Hero 标题显示 `hero-title`、导航显示 `nav-products`、按钮显示 `hero-start` 等。所有文案使用 i18n key 而非真实文本。这是一个**重大展示问题**——页面结构完整但内容未填充。

#### 🟡 中等
2. **导航 CTA 按钮形状不一致** — `cc-btn-primary-sm` 使用 pill (100px) 圆角，但 DESIGN.md 规定 `nav-cta-signup` 应使用 `{rounded.sm}` (6px)。
3. **页面 body 类名缺少 `antialiased`** — 虽然 CSS 中 `html` 有 antialiased，但 body class 应保持一致。

#### 🟢 轻微
4. **CTA 暗色区块 gradient 透明度偏低** — `opacity:0.08` 可能视觉不够明显（DESIGN.md 建议 hero scale 使用 `.18`，暗色区可酌情降低，但 .08 几乎不可见）。

---

## 2. demo.cinacoin.com（演示站）

### 2.1 基本信息
- **标题：** `Cinacoin — Wallet Connection Toolkit`
- **框架：** Next.js (App Router)
- **字体：** Inter + JetBrains Mono（与主站一致）
- **定位：** 交互式 demo 应用（暗色主题钱包连接演示）

### 2.2 结构检查

| 检查项 | 状态 | 详情 |
|--------|------|------|
| Logo | ✅ 存在 | `/logo.png`，8x8（h-8 w-8），`rounded-md` |
| 导航栏 | ✅ 存在 | 固定顶部，`h-16`，backdrop-blur |
| 导航链接 | ✅ 存在 | Home/Swap/Tokens/Multi-Chain/Batch/AA Demo/Onramp/Auth/Activity/Settings（10个） |
| Hero 区域 | ✅ 存在 | 渐变标题 + 描述 + CTA |
| CTA 按钮 | ✅ 存在 | pill 按钮 + 链接按钮 |
| 钱包连接组件 | ✅ 存在 | 链选择器 + 连接按钮 |
| 基础设施监控 | ✅ 存在 | 暗色代码编辑器风格面板 |
| 统计数据 | ✅ 存在 | 5 列（64/16/30+/$0/100%） |
| 功能卡片 | ✅ 存在 | 9 个功能卡片，3-up 网格 |
| 链列表 | ✅ 存在 | 16 条链（彩色徽章） |
| 底部 CTA | ✅ 存在 | 暗色卡片 + 双按钮 |
| Footer | ✅ 存在 | 简约底部版权 + 链接 |

### 2.3 DESIGN.md 合规性

#### 按钮形状
| 组件 | 预期 | 实际 | 状态 |
|------|------|------|------|
| Hero CTA | `border-radius: 100px` | `rounded-[100px]` | ✅ |
| Secondary CTA | `border-radius: 100px` | `rounded-[100px]` | ✅ |
| 连接钱包按钮 | `border-radius: 100px` | `rounded-[100px]` | ✅ |
| 链选择器 | 应使用 `6px` | `rounded-md` (8px) | ⚠️ 接近 |

#### 颜色合规性
- **使用暗色主题** — demo 站整体为暗色背景（`bg-gray-900` 系列）
- **CSS 变量部分使用** — `bg-[var(--cc-primary)]` 用于主按钮
- **渐变标题** — `bg-gradient-to-r from-brand-400 via-brand-500 to-brand-300` ✅
- **粒子动画** — 使用浮动粒子效果，偏离 DESIGN.md 的简洁风格 ⚠️
- **扫描线动画** — 基础设施监控面板使用 `scan-line` 动画 ⚠️

#### 排版
- **字体一致性** — 使用 Inter 和 JetBrains Mono ✅
- **标题字重** — `font-semibold` (600) ✅
- **标题间距** — `tracking-tighter` (比 `-0.025em` 更紧) ⚠️ 比 DESIGN.md 更激进
- **代码字体** — `font-mono` + `text-xs` (12px) ✅

#### 阴影层级
- **代码编辑器卡片** — 使用 `box-shadow: 0px 2px 2px rgba(0,0,0,0.0a), 0px 8px 16px -4px rgba(0,0,0,0.0a), 0 0 0 1px rgba(0,0,0,0.14)` — 对应 Level 4 float-stack ✅
- **功能卡片** — hover 效果正确 ✅

### 2.4 发现的问题

#### 🟡 中等
1. **暗色主题偏离 DESIGN.md 基调** — DESIGN.md 以浅色 canvas 为主、暗色仅用于 CTA 区块的极性翻转。demo 站整体采用暗色 Web3 风格，虽然作为 demo 可以理解，但与品牌设计系统不一致。
2. **粒子动画效果** — 18 个浮动粒子使用 `position: absolute` + 动画，偏离 DESIGN.md "mesh gradient 是唯一的装饰系统" 原则。
3. **扫描线动画** — 基础设施监控面板的 `scan-line` 动画不属于 DESIGN.md 定义的任何装饰。
4. **渐变标题使用 `tracking-tighter`** — 比 DESIGN.md 规定的 letter-spacing 更激进。
5. **导航使用 `rounded-[var(--cc-radius-lg)]`** (12px) 作为语言选择器 — 应使用 `{rounded.sm}` (6px)。

#### 🟢 轻微
6. **Footer 设计极简** — 相比主站的 5 列完整 footer，demo 站只有单行版权 + 链接，缺少社交媒体图标。
7. **功能卡片 hover 效果含 `-translate-y-1`** — DESIGN.md 卡片不推荐使用位移 hover。

---

## 3. 对比总结

| 维度 | 主站 cinacoin.com | Demo demo.cinacoin.com |
|------|-------------------|----------------------|
| DESIGN.md 颜色系统 | ✅ 完整实现 | ⚠️ 暗色主题偏移 |
| Typography | ✅ 完全合规 | ⚠️ tracking 偏紧 |
| 按钮 pill 形状 | ✅ 正确 | ✅ 正确 |
| 阴影层级 | ✅ 完整 | ✅ 完整 |
| Mesh gradient | ✅ 正确实现 | ⚠️ 使用额外粒子/扫描线 |
| 响应式布局 | ✅ 完整 | ✅ 基本完整 |
| 内容填充 | 🔴 全部为 i18n key | ✅ 有真实内容 |
| Footer 完整性 | ✅ 5列完整 | ⚠️ 极简 |
| 装饰一致性 | ✅ 仅 mesh gradient | ⚠️ 额外动画效果 |

---

## 4. 行动建议

### 优先修复 🔴
1. **填充所有 i18n 文案** — 主站所有文本内容为占位符 key（`hero-title`、`nav-products` 等），需接入真实翻译或使用 `next-intl` 等库正确渲染。

### 建议修复 🟡
2. **主站导航 CTA 改为 6px 圆角** — 符合 DESIGN.md `nav-cta` 规范。
3. **Demo 站考虑增加浅色主题切换** — 与品牌设计系统保持一致。
4. **移除 demo 站的粒子和扫描线动画** — 或降低到不喧宾夺主的程度，保持 mesh gradient 作为唯一装饰系统。
5. **Demo 站标题 tracking 调整为 DESIGN.md 标准** — 使用 `tracking-tight` 替代 `tracking-tighter`。

### 可优化 🟢
6. **Demo 站 Footer 补充社交链接** — 与主站保持一致。
7. **统一语言选择器圆角** — 两站都使用 `rounded-sm` (6px)。
8. **调整 CTA 暗色区块 gradient 透明度** — 从 0.08 提升至 0.12-0.15 范围。
