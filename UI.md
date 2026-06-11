# UI.md — Cinacoin 前端设计语言

> 学习 Vercel 的设计哲学，不是抄它的颜色值，而是理解它为什么"不像AI做的"。

---

## 0. 核心问题：为什么现在的页面"太AI化"

AI 生成的页面有几个典型特征——我们现在的页面全中了：

| AI 模板特征 | 我们现在的问题 | Vercel 的做法 |
|---|---|---|
| Emoji 当图标 | ⚡🔒🌐 做 feature icon | 用代码截图、产品 mockup、mesh gradient |
| 万物皆三列卡片 | 每个 section 都是 3 列 card grid | 交替使用：全宽暗色 band、非对称布局、代码编辑器 mockup |
| 居中对称 | 所有内容居中，左右对称 | 有时刻意左对齐，用 gradient 做视觉重心 |
| 没有品牌装饰 | 除了颜色 token 没有任何品牌元素 | Mesh gradient 是品牌签名，hero 级别的装饰 |
| 段落式文案 | 每段都是 "标题 + 描述 + Learn more →" | 用 mono eyebrow + 句号结尾的标题 + 代码块讲故事 |
| 千篇一律的 section 节奏 | Hero → 3卡片 → 2卡片 → CTA | canvas-soft → canvas → 暗色 band → canvas-soft，有呼吸感 |

**核心洞察**：Vercel 的页面不是靠 token 值（颜色、间距）赢的，是靠**视觉叙事节奏**赢的。Token 只是基础，真正的差异化在于 section 怎么排列、用什么视觉元素讲故事。

---

## 1. 设计哲学

### 1.1 工程师美学

Cinacoin 是面向金融/开发者的平台。页面应该像一个好的 API 文档——**精确、克制、有技术感**。

- 不需要花哨的插画
- 不需要渐变色卡片
- 不需要 emoji 图标
- 需要的是：代码截图、终端 mockup、数据可视化、架构图

### 1.2 装饰即品牌

Vercel 的 mesh gradient 就是它的品牌装饰。整个页面几乎只有黑白灰，但那一个 gradient 就定义了品牌调性。

**Cinacoin 的装饰系统**：
- **Mesh gradient**：沿用 Vercel 风格的 cyan-blue-magenta-amber 渐变，仅用于 hero 和关键 section 的背景氛围
- **暗色 band**：用 `primary`（#171717）做全宽暗色 section，是页面节奏的"重音"
- **代码编辑器 mockup**：深色背景 + mono 字体，展示真实的产品/代码截图
- **没有别的装饰**。不要加插画、不要加图标库、不要加装饰性 SVG

### 1.3 内容即界面

页面的主角是内容，不是 UI 组件。

- 卡片是容器，不是装饰
- 留白是设计，不是空着
- 文字层级就是导航

---

## 2. Section 节奏模式

**这是解决"AI感"的关键。** 不要每个 section 都用同一种布局。

### 2.1 五种 Section 类型

按顺序交替使用，相邻 section 不要用同一种类型：

#### Type A — 白底内容区（canvas）
```
背景: canvas (#ffffff)
内容: 最大宽度 1200px 居中
用途: 主内容区、产品列表、文档
```

#### Type B — 灰底呼吸区（canvas-soft）
```
背景: canvas-soft (#fafafa)
内容: 最大宽度 1200px 居中
用途: feature 介绍、客户 logo 条、次要内容
```

#### Type C — 暗色重音带（primary inverted）
```
背景: primary (#171717)，文字白色
内容: 全宽，内容居中
用途: 重要宣言、技术架构展示、CTA
特点: 页面中每 2-3 个 section 出现一次，制造节奏感
```

#### Type D — 代码/产品 Mockup 区
```
背景: canvas-soft 或 canvas
内容: 一个 16:10 的深色矩形（代码编辑器风格），展示真实截图
用途: 展示产品界面、代码示例、终端输出
特点: 这是"故事"——用视觉展示产品在做什么
```

#### Type E — Hero / 氛围区
```
背景: canvas 或 canvas-soft
装饰: mesh gradient 作为背景氛围（仅 hero 级别使用）
内容: 标题 + 副标题 + CTA
特点: 全页面只能用一次 mesh gradient
```

### 2.2 典型页面节奏

**Landing Page**:
```
E (Hero + mesh gradient)
→ B (Logo strip / 客户背书)
→ A (Feature 三列，但用 icon 组件而非 emoji)
→ C (暗色 band：技术宣言)
→ D (代码编辑器 mockup：展示产品)
→ B (使用场景 / 模板网格)
→ A (定价或产品列表)
→ A (CTA)
```

**Dashboard**:
```
A (主内容区，左侧导航 + 右侧数据)
→ 无 section 交替，dashboard 是工具不是营销页
```

**文档页**:
```
B (左侧目录 + 右侧内容)
→ 代码块用 mono 字体 + 深色背景
```

---

## 3. 视觉元素规范

### 3.1 Feature 展示：禁止 Emoji

❌ 错误做法：
```tsx
<div className="text-4xl">⚡</div>  // 不要这样
<h3>极速性能</h3>
<p>我们的系统非常快...</p>
```

✅ 正确做法（选一种）：

**方案 A — Icon 组件**
```tsx
<BoltIcon className="w-5 h-5 text-[var(--cc-ink)]" />  // Lucide/Phosphor outline icon
```

**方案 B — 数据/代码截图**
```tsx
<div className="bg-[var(--cc-primary)] rounded-[var(--cc-radius-md)] p-6">
  <pre className="font-mono text-sm text-[var(--cc-on-primary)]">
    <code>{`$ cc-cli deploy\n✓ Building...\n✓ Deployed to prod (2.3s)`}</code>
  </pre>
</div>
```

**方案 C — 产品 Mockup**
```tsx
<div className="border border-[var(--cc-hairline)] rounded-[var(--cc-radius-lg)] overflow-hidden">
  <img src="/screenshots/performance.png" alt="Performance dashboard" />
</div>
```

### 3.2 标题文案风格

学习 Vercel 的文案纪律：

- **Sentence case**，不是 Title Case
  - ✅ "Build and deploy on the AI Cloud."
  - ❌ "Build And Deploy On The AI Cloud"
  - ❌ "构建和部署在AI云上"（中文不需要大小写，但保持自然语句）

- **句号结尾**——标题是一个完整的句子
  - ✅ "构建去中心化金融基础设施."
  - ❌ "构建去中心化金融基础设施"

- **Mono eyebrow**——小标题用 mono 字体做技术标注
  ```tsx
  <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">INFRASTRUCTURE</p>
  <h2 className="text-display-lg font-semibold">构建去中心化金融基础设施.</h2>
  ```

### 3.3 Mesh Gradient 使用规则

- **仅限 hero 区域使用**，全页面最多一处
- 作为背景氛围，不作为前景元素
- 不缩小到 icon 尺寸
- 不裁剪为单色
- 实现方式：CSS radial-gradient 或 inline SVG

```css
.mesh-gradient {
  background:
    radial-gradient(ellipse at 20% 50%, #007cf033 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, #7928ca33 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%, #ff008033 0%, transparent 50%),
    radial-gradient(ellipse at 40% 40%, #50e3c233 0%, transparent 50%);
}
```

### 3.4 暗色 Band 的使用

暗色 band 是页面节奏的"重音符号"：

```tsx
{/* 暗色 Band — 每页 1-2 个，不要更多 */}
<section className="bg-[var(--cc-primary)] text-[var(--cc-on-primary)] py-24">
  <div className="max-w-[1200px] mx-auto px-6">
    <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TECHNOLOGY</p>
    <h2 className="text-display-xl font-semibold mb-6">为所有工作负载设计的计算模型.</h2>
    <p className="text-body-lg text-[var(--cc-body)] max-w-2xl">
      从静态站点到 AI 代理，Cinacoin 的基础设施自动适配你的需求.
    </p>
    {/* 可以内嵌一个代码编辑器 mockup */}
    <div className="mt-12 bg-[var(--cc-canvas-soft-2)] rounded-[var(--cc-radius-md)] p-6">
      <pre className="font-mono text-sm text-[var(--cc-ink)]">
        <code>{`cc deploy --project my-dapp\n✓ Deployed in 2.3s`}</code>
      </pre>
    </div>
  </div>
</section>
```

**注意**：暗色 band 内部的文字颜色：
- 标题：`on-primary`（白色）
- 正文：`body`（#4d4d4d → 暗色主题下自动适配）或直接用 `rgba(255,255,255,0.7)`
- 如果暗色 band 内需要代码块，代码块背景用 `canvas-soft-2`

### 3.5 代码编辑器 Mockup

这是 Cinacoin 页面的"故事讲述者"——展示产品在做什么，而不是用文字描述。

```tsx
<div className="bg-[var(--cc-primary)] rounded-[var(--cc-radius-md)] overflow-hidden">
  {/* 窗口标题栏 */}
  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
    <span className="ml-2 font-mono text-xs text-white/50">terminal</span>
  </div>
  {/* 代码内容 */}
  <div className="p-6">
    <pre className="font-mono text-sm leading-6 text-white/90">
      <code>{`$ npx create-cinacoin-app@latest my-dapp
✓ Created project structure
✓ Installed dependencies (42 packages)
✓ Initialized wallet connection
✓ Configured testnet

  Ready! cd my-dapp && npm run dev`}</code>
    </pre>
  </div>
</div>
```

---

## 4. 组件使用规范

### 4.1 卡片

卡片是**容器**，不是装饰。保持简单：

```tsx
{/* 标准卡片 — 所有卡片统一这个结构 */}
<div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-6 shadow-[var(--cc-level1)]">
  <h3 className="text-title font-semibold mb-2">标题</h3>
  <p className="text-body-sm text-[var(--cc-body)]">描述内容</p>
</div>
```

**禁止**：
- 卡片内用 emoji 做图标
- 卡片用彩色背景
- 卡片用彩色阴影
- 卡片用渐变边框

### 4.2 按钮

保持两种就够了：

```tsx
{/* Primary — 黑色药丸 */}
<button className="bg-[var(--cc-primary)] text-[var(--cc-on-primary)] rounded-[var(--cc-radius-sm)] px-4 h-10 font-medium text-body-sm">
  开始使用
</button>

{/* Secondary — 白底描边 */}
<button className="bg-[var(--cc-canvas)] text-[var(--cc-ink)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)] px-4 h-10 font-medium text-body-sm">
  了解更多
</button>
```

**营销页 CTA** 用 `pill` 圆角（100px），**应用内按钮** 用 `sm` 圆角（6px）。不要混用。

### 4.3 Badge / Tag

```tsx
{/* 技术标签 — mono 字体 */}
<span className="font-mono text-xs bg-[var(--cc-canvas-soft-2)] text-[var(--cc-body)] px-2 py-1 rounded-[var(--cc-radius-xs)]">
  DeFi
</span>
```

### 4.4 导航

```tsx
{/* 顶部导航 — 简洁 */}
<nav className="h-16 bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)]">
  <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-full">
    {/* Logo 左 */}
    {/* 链接中 */}
    {/* CTA 右：Log In + Sign Up */}
  </div>
</nav>
```

导航按钮用 `sm` 圆角（6px），不用 pill。

---

## 5. 布局模式库

### 5.1 Feature Grid（三列特性）

不要每次都三列。如果需要三列，给每列加不同的视觉元素：

```tsx
<div className="grid md:grid-cols-3 gap-6">
  {/* 第一列：文字 + icon */}
  <div className="p-6 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]">
    <BoltIcon className="w-5 h-5 mb-4" />
    <h3 className="font-semibold mb-2">极速交易</h3>
    <p className="text-body-sm text-[var(--cc-body)]">亚秒级确认...</p>
  </div>
  
  {/* 第二列：跨行，包含 mockup */}
  <div className="md:row-span-2 p-6 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] bg-[var(--cc-primary)] text-[var(--cc-on-primary)]">
    <h3 className="font-semibold mb-4">实时数据</h3>
    <div className="bg-white/10 rounded-md p-4 font-mono text-sm">
      <p>CINA/USDT: $0.0847</p>
      <p>24h Vol: $12.4M</p>
    </div>
  </div>
  
  {/* 第三列：文字 + icon */}
  <div className="p-6 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]">
    <ShieldIcon className="w-5 h-5 mb-4" />
    <h3 className="font-semibold mb-2">安全审计</h3>
    <p className="text-body-sm text-[var(--cc-body)]">多重签名...</p>
  </div>
  
  {/* 第四列：填充第二列下方 */}
  <div className="p-6 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)]">
    <CodeIcon className="w-5 h-5 mb-4" />
    <h3 className="font-semibold mb-2">开发者工具</h3>
    <p className="text-body-sm text-[var(--cc-body)]">完整 SDK...</p>
  </div>
</div>
```

### 5.2 Split Section（非对称布局）

打破居中对称，用 60/40 或 70/30 分割：

```tsx
<section className="max-w-[1200px] mx-auto px-6 py-24 grid md:grid-cols-[7fr_5fr] gap-12 items-center">
  {/* 左侧：文字内容 */}
  <div>
    <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">WALLET</p>
    <h2 className="text-display-xl font-semibold mb-4 tracking-tight">
      掌控你的数字资产.
    </h2>
    <p className="text-body-lg text-[var(--cc-body)] mb-8">
      非托管钱包，支持多链，内置 swap 和 staking.
    </p>
    <div className="flex gap-3">
      <button className="...">下载钱包</button>
      <button className="...">查看文档</button>
    </div>
  </div>
  
  {/* 右侧：产品截图或 mockup */}
  <div className="border border-[var(--cc-hairline)] rounded-[var(--cc-radius-lg)] overflow-hidden shadow-[var(--cc-level3)]">
    <img src="/screenshots/wallet.png" alt="Wallet interface" className="w-full" />
  </div>
</section>
```

### 5.3 Logo Strip（客户/合作伙伴背书）

```tsx
<section className="border-y border-[var(--cc-hairline)] py-12">
  <div className="max-w-[1200px] mx-auto px-6">
    <p className="text-center text-xs font-mono text-[var(--cc-muted)] mb-8">
      TRUSTED BY TEAMS AROUND THE WORLD
    </p>
    <div className="flex items-center justify-center gap-12 opacity-60">
      {/* 合作伙伴 logo，单色 SVG，统一 24px 高度 */}
      <img src="/logos/partner1.svg" alt="Partner 1" className="h-6" />
      <img src="/logos/partner2.svg" alt="Partner 2" className="h-6" />
      <img src="/logos/partner3.svg" alt="Partner 3" className="h-6" />
      <img src="/logos/partner4.svg" alt="Partner 4" className="h-6" />
      <img src="/logos/partner5.svg" alt="Partner 5" className="h-6" />
    </div>
  </div>
</section>
```

### 5.4 Tab Pills（产品分类导航）

```tsx
<div className="flex justify-center gap-2 mb-12">
  {['全部', 'DeFi', 'NFT', '基础设施', '工具'].map((tab) => (
    <button
      key={tab}
      className="px-4 py-2 text-body-sm rounded-[var(--cc-radius-pill-sm)] bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] hover:border-[var(--cc-hairline-strong)] transition-colors"
    >
      {tab}
    </button>
  ))}
</div>
```

---

## 6. 反模式清单（Anti-Patterns）

### ❌ 绝对不做

| 反模式 | 为什么 | 替代方案 |
|---|---|---|
| Emoji 做图标 | 看起来像 AI 模板 | Lucide/Phosphor outline icon |
| 彩色渐变卡片 | 廉价感 | 白底 + hairline border |
| 彩色阴影 | 不专业 | 灰色 stacked shadow |
| 全大写标题 | 不符合品牌 | Sentence case + 句号 |
| Font weight 700+ | 品牌上限是 600 | 用 600 semibold |
| 每个 section 都居中对称 | 无聊、AI 感 | 用 split layout、暗色 band 打破 |
| 装饰性插画 | 与品牌不符 | 代码 mockup、产品截图 |
| 超过 1 处 mesh gradient | 稀释品牌签名 | 只在 hero 用 |
| 同一个 section 类型连续出现 | 没有节奏感 | 交替使用 A/B/C/D/E |
| 正文用 mono 字体 | mono 只用于代码和技术标注 | 正文用 sans |
| `#000000` 纯黑 | 用 `#171717` ink 代替 | — |

---

## 7. 字体加载

所有应用统一使用 Geist 字体族：

```tsx
// Next.js — layout.tsx
import localFont from 'next/font/local';

const geistSans = localFont({
  src: [
    { path: '../../packages/design-tokens/assets/Geist-Regular.woff2', weight: '400' },
    { path: '../../packages/design-tokens/assets/Geist-Medium.woff2', weight: '500' },
    { path: '../../packages/design-tokens/assets/Geist-SemiBold.woff2', weight: '600' },
  ],
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: [
    { path: '../../packages/design-tokens/assets/GeistMono-Regular.woff2', weight: '400' },
  ],
  variable: '--font-geist-mono',
});
```

**禁止**从 Google Fonts 加载 Inter 或 JetBrains Mono 作为替代。Geist 字体文件已在 `packages/design-tokens/assets/` 中。

---

## 8. Design Token 使用

所有颜色和间距通过 `@cinacoin/design-tokens` 包的 CSS 变量引用：

```css
@import "@cinacoin/design-tokens/css/cinacoin.css";
```

```tsx
// ✅ 正确：使用 CSS 变量
<div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-6">

// ❌ 错误：硬编码颜色
<div className="bg-white border border-gray-200 rounded-lg p-6">
```

---

## 9. 响应式策略

| 断点 | 宽度 | 变化 |
|---|---|---|
| Mobile | < 640px | 单列，导航折叠为 hamburger |
| Tablet | 640–1023px | 两列网格 |
| Desktop | ≥ 1024px | 完整布局，最大宽度 1200px |

- 内容最大宽度：1200px（居中）
- 水平 gutter：24px（desktop），16px（mobile）
- 图片/截图：始终 16:9 或 16:10，带圆角和 border

---

## 10. 页面模板

### 10.1 Landing Page 检查清单

- [ ] Hero 有 mesh gradient 背景氛围
- [ ] Hero 标题 sentence case + 句号结尾
- [ ] Hero 有 mono eyebrow 标注
- [ ] Hero CTA：black primary + white secondary
- [ ] Logo strip（合作伙伴背书）
- [ ] 至少 1 个暗色 band
- [ ] 至少 1 个代码/产品 mockup
- [ ] Feature 用 outline icon，不用 emoji
- [ ] Section 类型交替（不重复）
- [ ] 所有 token 用 CSS 变量
- [ ] Font weight ≤ 600

### 10.2 Dashboard 检查清单

- [ ] 左侧导航 + 右侧内容
- [ ] 无 mesh gradient（dashboard 不需要）
- [ ] 数据表格用 hairline 分隔
- [ ] 状态 badge 用语义色（success/error/warning）
- [ ] 卡片用 Level 1 elevation（inset hairline）

---

## 11. 实施优先级

### P0 — 立即修复（消除"AI感"）

1. **移除所有 emoji 图标** → 替换为 Lucide icons 或产品截图
2. **打破居中对称** → 至少 2 个 section 用 split layout
3. **加入 1 个暗色 band** → 在 feature section 和 CTA 之间
4. **加入 1 个代码/产品 mockup** → 展示 Cinacoin 产品实际界面
5. **添加 mono eyebrow** → 每个 section 标题前加技术标注

### P1 — 短期优化

6. Hero 添加 mesh gradient 背景
7. 添加 Logo strip（合作伙伴）
8. Feature grid 改为非对称布局
9. 统一所有应用的字体加载（Geist only）

### P2 — 持续打磨

10. 产品截图素材制作
11. 微交互优化（hover 状态、transition）
12. 暗色模式完善

---

*UI.md v1.0 — 2026-06-11*
*灵感来源：Vercel Design System / Geist*
*适用项目：Cinacoin 所有前端应用*
