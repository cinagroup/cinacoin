# Learn 平台 DESIGN.md 合规性审计报告

**审计日期**: 2026-06-13  
**审计范围**: `apps/learn/src/` 全部页面与组件  
**设计规范**: `design-guidelines/DESIGN.md` (Vercel-Inspired Design System)  
**审计人**: 000 (自动化审计)

---

## 总览

| 维度 | 合规评分 | 状态 |
|------|---------|------|
| 1. 颜色系统 | 95% | ✅ 基本合规 |
| 2. 排版系统 | 72% | ⚠️ 部分合规 |
| 3. 间距系统 | 80% | ⚠️ 部分合规 |
| 4. 圆角系统 | 100% | ✅ 完全合规 |
| 5. 组件规范 | 65% | ❌ 多处不合规 |
| 6. 阴影系统 | 70% | ⚠️ 部分合规 |
| **综合评分** | **78%** | **⚠️ 需要改进** |

---

## 1. 颜色系统 (95%)

### 检查项

- [x] `--cc-primary` (#171717 light / #ffffff dark) 作为主按钮背景
- [x] `--cc-link` (#0070f3) 作为链接颜色
- [x] `--cc-canvas-soft` (#fafafa light / #0a0a0a dark) 作为页面背景
- [x] `--cc-canvas` (#ffffff light / #000000 dark) 作为卡片背景
- [x] 无硬编码颜色值 — 全部使用 CSS 变量

### 详细分析

**合规点:**
- `cc-btn-primary` 使用 `var(--cc-primary)` ✅ (`cinacoin.css`)
- 全局 `a` 标签使用 `var(--cc-link)` ✅ (`cinacoin.css`)
- `body` 背景使用 `var(--cc-canvas-soft)` ✅ (`cinacoin.css`)
- `.cc-card` 使用 `var(--cc-canvas)` ✅ (`cinacoin.css` / `globals.css`)
- 所有组件通过 `style={{ color: 'var(--cc-*)' }}` 引用颜色，未发现硬编码 hex 值 ✅

**轻微问题:**
- ⚠️ `ResponsiveShell.tsx` 使用 Tailwind `bg-black/50` 作为遮罩层 — 可接受（功能性半透明覆盖，非语义颜色）

### 修复建议

无需修复。颜色系统合规性优秀。

---

## 2. 排版系统 (72%)

### 检查项

- [x] 标题使用 Geist 字体、weight 600
- [x] display-xl: 48px / line-height 48px / letter-spacing -2.4px
- [x] body-md: 16px / line-height 24px
- [x] caption-mono 使用 Geist Mono 字体
- [ ] **标题未全部遵循 sentence-case + period-terminated**

### 详细分析

**字体加载** ✅
- `layout.tsx` 正确加载 Geist (400/500/600) 和 Geist Mono (400)

**排版 Token** ✅
- `globals.css` 中 `.text-display-xl` 完全匹配规范:
  ```css
  font-size: 48px; font-weight: 600; line-height: 48px; letter-spacing: -2.4px;
  ```
- `.text-body-md`: `16px / 400 / 24px` ✅
- `.cc-mono` 使用 `var(--font-geist-mono), Geist Mono, ...` ✅

**❌ 标题 Period-Termination 缺失 (严重)**

DESIGN.md 明确要求:
> Sentence-case headlines, period-terminated. Headlines like "Build and deploy on the AI Cloud." end with a deliberate period — that punctuation is part of the brand's voice.

以下标题缺少句号:

| 文件 | 行号 | 当前文本 | 应改为 |
|------|------|---------|--------|
| `app/page.tsx` | L57 | `Tutorials` | `Tutorials.` |
| `app/basics/page.tsx` | L14 | `Web3 basics` | `Web3 basics.` |
| `app/basics/page.tsx` | L27 | `Blockchain fundamentals` | `Blockchain fundamentals.` |
| `app/basics/page.tsx` | L46 | `Wallets and identity` | `Wallets and identity.` |
| `app/basics/page.tsx` | L63 | `Smart contracts` | `Smart contracts.` |
| `app/wallet-integration/page.tsx` | L13 | `Wallet integration` | `Wallet integration.` |
| `app/multichain/page.tsx` | L13 | `Multichain development` | `Multichain development.` |
| `app/multichain/page.tsx` | L27 | `Configure supported chains` | `Configure supported chains.` |
| `app/best-practices/page.tsx` | L13 | `Best practices` | `Best practices.` |

**已正确添加句号的标题** (作为参考):
- `page.tsx`: "Welcome to CinaCoin Learn." ✅, "Getting started." ✅
- `wallet-integration`: "1. Install the SDK." ✅, "2. Initialize the client." ✅, "3. Connect a wallet." ✅, "4. Sign a message." ✅, "5. Send a transaction." ✅, "6. Listen for events." ✅
- `multichain`: "Chain-agnostic interactions." ✅, "Cross-chain state." ✅, "Chain switching." ✅
- `best-practices`: "1. Security first." ✅ ~ "5. Testing your integration." ✅

### 修复建议

```tsx
// app/basics/page.tsx — 修复标题
<h1 className="text-display-lg mb-4">Web3 basics.</h1>  // 添加句号

<h2 id="blockchain-fundamentals" className="text-display-md mb-4">Blockchain fundamentals.</h2>

<h2 id="wallets-identity" className="text-display-md mb-4">Wallets and identity.</h2>

<h2 id="smart-contracts" className="text-display-md mb-4">Smart contracts.</h2>
```

同理修复 `page.tsx`, `wallet-integration/page.tsx`, `multichain/page.tsx`, `best-practices/page.tsx` 中的 h1 标题。

---

## 3. 间距系统 (80%)

### 检查项

- [x] 使用 4px 基准的间距 token
- [x] 卡片 padding 为 `--cc-lg` (24px)
- [ ] **section 间距未使用 `--cc-4xl` 到 `--cc-5xl` (64px-96px)**

### 详细分析

**Token 定义** ✅
- `cinacoin.css` 定义完整间距阶梯: `--cc-xxs: 4px` → `--cc-section: 192px`，全部为 4 的倍数

**卡片 Padding** ✅
- `.cc-card { padding: var(--cc-lg); }` → 24px ✅

**⚠️ Section 间距不足**

DESIGN.md 要求:
> Section padding: marketing bands use {spacing.4xl} to {spacing.5xl} top/bottom.

当前页面 section 间距:

| 文件 | 使用值 | 实际像素 | 规范要求 |
|------|--------|---------|---------|
| 所有教程页 `section.mb-12` | `mb-12` (Tailwind) | 48px (`--cc-3xl`) | 64-96px (`--cc-4xl` ~ `--cc-5xl`) |
| `page.tsx` hero `py-12` | `py-12` (Tailwind) | 48px | 64-96px |
| `page.tsx` section `mb-12` | `mb-12` | 48px | 64-96px |

> **注意**: Learn 平台是教育/应用页面而非营销页面，48px 间距在实际阅读体验中可能更合适。但严格对照 DESIGN.md 规范，仍属于偏差。

### 修复建议

```tsx
// 将 section 间距从 mb-12 (48px) 提升到 mb-16 (64px) 或使用 CSS 变量
// 方案 A: 使用 Tailwind 任意值
<section className="mb-16" aria-labelledby="...">

// 方案 B: 使用内联 CSS 变量（推荐，与设计系统一致）
<section style={{ marginBottom: 'var(--cc-4xl)' }} aria-labelledby="...">
```

---

## 4. 圆角系统 (100%)

### 检查项

- [x] 主按钮 `--cc-radius-pill` (100px)
- [x] 卡片 `--cc-radius-md` (8px)
- [x] 导航按钮 `--cc-radius-sm` (6px)

### 详细分析

| 组件 | 使用值 | 规范值 | 状态 |
|------|--------|--------|------|
| `.cc-btn-primary` | `var(--cc-radius-pill)` = 100px | 100px | ✅ |
| `.cc-btn-secondary` | `var(--cc-radius-pill)` = 100px | 100px | ✅ |
| `.cc-card` | `var(--cc-radius-md)` = 8px | 8px | ✅ |
| `.cc-nav-cta-signup` | `var(--cc-radius-sm)` = 6px | 6px | ✅ |
| `.cc-nav-cta-login` | `var(--cc-radius-sm)` = 6px | 6px | ✅ |
| `.cc-form-input` | `var(--cc-radius-sm)` = 6px | 6px | ✅ |
| `.cc-badge` | `var(--cc-radius-full)` = 9999px | 9999px | ✅ |
| `.cc-tab-ghost` | `var(--cc-radius-pill-sm)` = 64px | 64px | ✅ |

### 修复建议

无需修复。圆角系统完全合规。

---

## 5. 组件规范 (65%)

### 检查项

- [x] button-primary: 48px 高、pill 形状
- [ ] **card-marketing: 未使用 Level 3 阴影 (soft-stack)**
- [x] form-input: 40px 高、6px 圆角
- [x] nav-bar: 64px 高（定义存在，Learn 使用侧边栏布局）
- [ ] **CodeBlock 未遵循 code-editor-mockup 规范**
- [ ] **Sidebar 分类标签未使用 mono 字体**

### 问题 1: 卡片阴影级别不足 ❌

**DESIGN.md 规范:**
> `card-marketing`: Carries Level 3 soft-stack shadow.
> Level 3 = `0px 2px 2px #0000000a, 0px 8px 8px -8px #0000000a` plus inset hairline.

**当前实现:**
- `globals.css` 中 `.cc-card` 默认无阴影，hover 时使用 `var(--cc-level2)`
- `cinacoin.css` 中 `.cc-card` 默认 `var(--cc-level1)`，hover 时 `var(--cc-level2)`

**影响文件:**
- `components/TutorialCard.tsx` — 使用 `.cc-card` 类
- `app/page.tsx` L63 — Quick Start section 使用 `.cc-card` 类

**修复建议:**

```css
/* globals.css — 修改 .cc-card 使其匹配 card-marketing 规范 */
.cc-card {
  background: var(--cc-canvas);
  border: none; /* 移除真实 border，改用 inset shadow hairline */
  border-radius: var(--cc-radius-md);
  padding: var(--cc-lg);
  box-shadow: var(--cc-level3); /* 从 level1/level2 提升到 level3 */
  transition: box-shadow 0.3s ease;
}
.cc-card:hover {
  box-shadow: var(--cc-level4); /* hover 提升到 level4 */
}
```

### 问题 2: CodeBlock 未使用 code-editor-mockup 规范 ⚠️

**DESIGN.md 规范:**
> `code-editor-mockup`: backgroundColor `{colors.primary}`, textColor `{colors.on-primary}`, body in `{typography.code}` (13px / Geist Mono), padding `{spacing.lg}` 24px, shape `{rounded.md}` 8px.

**当前实现** (`components/CodeBlock.tsx`):
- 背景: `var(--cc-canvas-soft-2)` — 应为 `var(--cc-primary)` ❌
- 文字颜色: `var(--cc-body)` — 应为 `var(--cc-on-primary)` ❌
- 圆角: `rounded-lg` (Tailwind 8px) ✅
- 内边距: `var(--cc-md)` (16px) — 应为 `var(--cc-lg)` (24px) ⚠️

**修复建议:**

```tsx
// components/CodeBlock.tsx
<pre className="overflow-x-auto" style={{ 
  padding: 'var(--cc-lg)',  // 24px instead of 16px
  backgroundColor: 'var(--cc-primary)',  // dark background
  margin: 0 
}}>
  <code className={`language-${language} cc-mono text-sm`} 
    style={{ color: 'var(--cc-on-primary)' }}>  {/* white text */}
    {code}
  </code>
</pre>
```

### 问题 3: Sidebar 分类标签未使用 Mono 字体 ⚠️

**DESIGN.md 规范:**
> Every section eyebrow and small label uses the monospace face `{typography.caption-mono}` or `{typography.code}`

**当前实现** (`components/Sidebar.tsx` L48):
```tsx
<h3 className="text-caption tracking-wider" style={{ ... }}>
```
使用了 `text-caption` (Geist Sans) 而非 `cc-mono` (Geist Mono)。

**修复建议:**

```tsx
<h3 className="text-caption cc-mono tracking-wider" style={{
  color: 'var(--cc-muted)',
  marginBottom: 'var(--cc-sm)',
  fontWeight: 500,
  textTransform: 'uppercase',
}}>
```

### 问题 4: InteractiveEditor 按钮尺寸 ⚠️

**文件**: `components/InteractiveEditor.tsx` L47
```tsx
<button className="cc-btn-primary" style={{ height: '32px', padding: '0 var(--cc-sm)' }}>
```

使用 `cc-btn-primary` 但覆盖高度为 32px。应使用 `cc-btn-primary-sm`（已经定义为 32px 高）。

**修复建议:**

```tsx
<button onClick={handleRun} className="cc-btn-primary-sm" aria-label="Run code">
  Run code
</button>
```

---

## 6. 阴影系统 (70%)

### 检查项

- [x] 使用堆叠阴影（多个小偏移 + inset hairline）
- [x] 避免单个重阴影
- [ ] **卡片未使用规范指定的阴影级别**

### 详细分析

**阴影 Token 定义** ✅

`cinacoin.css` 中定义了完整的堆叠阴影系统:

| Level | 定义 | 用途 |
|-------|------|------|
| `--cc-level1` | inset hairline only | 默认卡片 |
| `--cc-level2` | 2 small drops + inset | 轻微悬浮 |
| `--cc-level3` | 2 medium drops + inset | 营销卡片 (soft-stack) |
| `--cc-level4` | 2 large drops + inset | 大型卡片 (float-stack) |
| `--cc-level5` | 3 drops + inset | 模态框 |

所有阴影均为多层堆叠 + inset hairline，符合 DESIGN.md 要求 ✅

**❌ 卡片阴影级别不匹配**

| 组件 | DESIGN.md 要求 | 实际使用 |
|------|---------------|---------|
| `.cc-card` (TutorialCard, Quick Start) | Level 3 (soft-stack) | Level 1 → Level 2 on hover |
| `.cc-card` (InteractiveEditor) | Level 3 | Level 1 (inherited) |

### 修复建议

同问题 5.1 — 将 `.cc-card` 的默认阴影提升到 `var(--cc-level3)`。

---

## 附加发现

### A. globals.css 与 cinacoin.css 的 `.cc-card` 冲突 ⚠️

`globals.css` 重新定义了 `.cc-card`，与 `cinacoin.css` 的定义冲突:

```css
/* globals.css — 覆盖了 cinacoin.css 的定义 */
.cc-card {
  border: 1px solid var(--cc-hairline);  /* 额外添加了真实 border */
  /* ... */
}
```

`cinacoin.css` 使用 `box-shadow: var(--cc-level1)` (inset hairline) 作为卡片边框效果。`globals.css` 又添加了真实的 `border`，导致双重边框效果。

**修复建议**: 移除 `globals.css` 中 `.cc-card` 的重复定义，统一使用 `cinacoin.css` 的版本，或明确有意覆盖并注释说明。

### B. 首页 Hero 区域不完全匹配 hero-band 规范 ⚠️

**DESIGN.md:**
> `hero-band`: backgroundColor `{colors.canvas}`, padding `{spacing.4xl} {spacing.lg}`

**当前实现** (`app/page.tsx` L38):
```tsx
<div className="rounded-lg px-8 py-12 mb-12" 
  style={{ backgroundColor: 'var(--cc-canvas-soft-2)' }}>
```

- 使用 `canvas-soft-2` 而非 `canvas` 或 `canvas-soft` ⚠️
- 使用 `rounded-lg` (有圆角) — hero-band 应为全宽无圆角 ⚠️
- padding `py-12` (48px) 而非 `--cc-4xl` (64px) ⚠️

> **注意**: Learn 平台的 hero 是一个内容卡片而非全宽营销 band，因此部分偏差可以理解为布局适配。

### C. 页面默认 Dark Mode

`layout.tsx` 设置 `data-theme="dark"` 为默认主题。DESIGN.md 的 token 值以 light mode 为基准编写。`cinacoin.css` 的 dark mode 正确反转了所有 token，这不是违规，但值得注意。

---

## 修复优先级

| 优先级 | 问题 | 影响范围 | 工作量 |
|--------|------|---------|--------|
| 🔴 P0 | 标题缺少 period-termination | 9 个标题，5 个文件 | 低 |
| 🟡 P1 | 卡片阴影级别不足 (Level 2 → Level 3) | `.cc-card` 全局影响 | 低 |
| 🟡 P1 | globals.css / cinacoin.css `.cc-card` 冲突 | 全局样式 | 低 |
| 🟡 P1 | CodeBlock 背景色不符合 code-editor-mockup 规范 | `CodeBlock.tsx` | 低 |
| 🟢 P2 | Sidebar 分类标签未使用 mono 字体 | `Sidebar.tsx` | 低 |
| 🟢 P2 | Section 间距偏小 (48px vs 64px) | 所有页面 | 中 |
| 🟢 P2 | InteractiveEditor 按钮应使用 sm 变体 | `InteractiveEditor.tsx` | 低 |
| 🔵 P3 | Hero 区域与 hero-band 规范偏差 | `page.tsx` | 低 |

---

## 总结

Learn 平台在 **颜色系统** 和 **圆角系统** 方面表现优秀，完全遵循了 DESIGN.md 规范。**排版系统** 的字体、大小、行高、字间距全部正确，但标题的 period-terminated 品牌特征未一致执行，是最显著的品牌声音偏差。**组件规范** 方面，卡片阴影级别不足和 CodeBlock 样式偏差需要修复。

**综合合规评分: 78/100** — 基础架构扎实，需要关注品牌细节一致性。
