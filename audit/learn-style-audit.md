# Learn 平台页面风格审查报告

**审查日期**: 2026-06-13  
**审查范围**: `apps/learn/src/` 全部页面与组件  
**对照标准**: `packages/design-tokens/css/cinacoin.css` + `design-guidelines/DESIGN.md`

---

## 问题汇总

| 严重程度 | 数量 |
|---------|------|
| 🔴 严重 (Critical) | 5 |
| 🟠 高 (High) | 6 |
| 🟡 中 (Medium) | 7 |
| 🔵 低 (Low) | 4 |
| **合计** | **22** |

---

## 🔴 严重问题 (Critical)

### C-1. 间距 Token 引用不存在 (`--cc-space-*`)

**文件**: `ResponsiveShell.tsx`, `Sidebar.tsx`, `InteractiveEditor.tsx`, `CodeBlock.tsx`  
**问题**: 多个文件使用 `var(--cc-space-lg)`, `var(--cc-space-md)`, `var(--cc-space-sm)`, `var(--cc-space-xs)`, `var(--cc-space-xl)` 等变量，但这些变量在 `cinacoin.css` 中**不存在**。正确的 token 名称是 `var(--cc-lg)`, `var(--cc-md)`, `var(--cc-sm)`, `var(--cc-xs)`, `var(--cc-xl)`。

**影响**: 所有使用这些错误 token 的 spacing/padding/margin 全部失效，回退到初始值（通常为 0 或浏览器默认值），导致布局与设计规范严重偏离。

**涉及文件与行号**:
- `components/ResponsiveShell.tsx:59` — `padding: 'var(--cc-space-lg)'`
- `components/Sidebar.tsx:21` — `padding: 'var(--cc-space-lg)'`
- `components/Sidebar.tsx:24` — `marginBottom: 'var(--cc-space-xl)'`
- `components/Sidebar.tsx:36` — `marginBottom: 'var(--cc-space-sm)'`
- `components/Sidebar.tsx:47` — `padding: 'var(--cc-space-xs) var(--cc-space-sm)'`
- `components/Sidebar.tsx:72` — `marginTop: 'var(--cc-space-xl)'`
- `components/Sidebar.tsx:73` — `paddingTop: 'var(--cc-space-lg)'`
- `components/InteractiveEditor.tsx:37-51` — 多处 `var(--cc-space-*)`
- `components/CodeBlock.tsx:18-28` — 多处 `var(--cc-space-*)`

**修复方案**:
```bash
# 全局替换
sed -i 's/var(--cc-space-lg)/var(--cc-lg)/g' <files>
sed -i 's/var(--cc-space-md)/var(--cc-md)/g' <files>
sed -i 's/var(--cc-space-sm)/var(--cc-sm)/g' <files>
sed -i 's/var(--cc-space-xs)/var(--cc-xs)/g' <files>
sed -i 's/var(--cc-space-xl)/var(--cc-xl)/g' <files>
```

---

### C-2. 颜色 Token 引用不存在 (`--cc-mute`)

**文件**: `page.tsx` (首页), `StepIndicator.tsx`, `Sidebar.tsx`, `InteractiveEditor.tsx`, `TutorialCard.tsx`  
**问题**: 多处使用 `var(--cc-mute)` 但该变量在 `cinacoin.css` 中**不存在**。正确的 token 是 `var(--cc-muted)` (#737373 dark / #a3a3a3 light)。

**影响**: 文本颜色回退为初始值（通常为 `currentColor` 或继承），导致本应柔和的辅助文本变成了与主文本相同的颜色，破坏视觉层级。

**涉及文件与行号**:
- `app/page.tsx:44` — `color: 'var(--cc-mute)'`
- `app/page.tsx:52` — `color: 'var(--cc-mute)'`
- `components/StepIndicator.tsx:21` — `color: 'var(--cc-mute)'`
- `components/Sidebar.tsx:34` — `color: 'var(--cc-mute)'`
- `components/InteractiveEditor.tsx:53` — `color: 'var(--cc-mute)'`
- `components/TutorialCard.tsx:42` — `color: 'var(--cc-mute)'`

**修复方案**:
```bash
sed -i 's/var(--cc-mute)/var(--cc-muted)/g' <files>
```

---

### C-3. Shadow Token 引用不存在 (`--cc-shadow-3`)

**文件**: `components/ResponsiveShell.tsx:48`  
**问题**: 使用 `boxShadow: 'var(--cc-shadow-3)'` 但该变量不存在。正确的 token 是 `var(--cc-level3)`。

**影响**: 移动端汉堡菜单按钮没有阴影效果。

**修复**:
```tsx
// ResponsiveShell.tsx:48
boxShadow: 'var(--cc-level3)',
```

---

### C-4. CodeBlock 组件硬编码颜色（完全脱离设计系统）

**文件**: `components/CodeBlock.tsx:18-33`  
**问题**: 整个组件使用硬编码十六进制颜色，完全绕过 CSS 变量系统：
- `#2e2e2e` — 边框颜色
- `#1e1e1e` — 标题栏背景
- `#888` — 标题文字/按钮颜色
- `#171717` — 代码区背景
- `#b3b3b3` — 代码文字颜色

**影响**:
1. 暗色模式下勉强可用（因为颜色恰好接近暗色 token 值），但与设计系统脱节
2. **亮色模式下完全不可用** — 深色背景 + 深色文字 = 不可读
3. 主题切换时代码块不会跟随变化

**修复方案**:
```tsx
// CodeBlock.tsx — 替换所有硬编码颜色
<div style={{ 
  marginTop: 'var(--cc-lg)', 
  marginBottom: 'var(--cc-lg)', 
  border: '1px solid var(--cc-hairline)',  // was #2e2e2e
  borderRadius: 'var(--cc-radius-md)',
}}>
  {title && (
    <div style={{ 
      padding: 'var(--cc-sm) var(--cc-md)',
      backgroundColor: 'var(--cc-canvas-soft-2)',  // was #1e1e1e
      borderBottom: '1px solid var(--cc-hairline)',  // was #2e2e2e
    }}>
      <span className="cc-mono text-caption" style={{ color: 'var(--cc-muted)' }}>{title}</span>
      {/* ... */}
    </div>
  )}
  <pre style={{ 
    padding: 'var(--cc-md)', 
    backgroundColor: 'var(--cc-canvas-soft-2)',  // was #171717
    margin: 0 
  }}>
    <code style={{ color: 'var(--cc-body)' }}>{code}</code>  {/* was #b3b3b3 */}
  </pre>
</div>
```

---

### C-5. globals.css 覆盖了设计系统按钮规范

**文件**: `app/globals.css:87-117`  
**问题**: `globals.css` 重新定义了 `.cc-btn-primary` 和 `.cc-btn-secondary`，覆盖了 `cinacoin.css` 中的规范定义，且参数不一致：

| 属性 | cinacoin.css (设计规范) | globals.css (实际) | 差异 |
|------|------------------------|-------------------|------|
| height | 48px | 40px | ❌ 不符合 |
| padding | `0 var(--cc-lg)` (24px) | `0 var(--cc-md)` (16px) | ❌ 不符合 |
| font-size | `var(--text-body-md)` (16px) | `var(--text-body-sm)` (14px) | ❌ 不符合 |
| background | `var(--cc-primary)` | `var(--cc-ink)` | ⚠️ 暗色模式下等价但语义错误 |
| transition | `opacity 0.3s ease` | `opacity 150ms ease` | ❌ 不符合 300ms 规范 |

**影响**: 所有按钮比设计规范更小、更紧凑，过渡动画速度只有规范的一半。

**修复方案**: 删除 `globals.css` 中 `.cc-btn-primary` 和 `.cc-btn-secondary` 的重复定义，让 `cinacoin.css` 的规范版本生效。如需 Learn 平台特定调整，使用新的类名（如 `.cc-btn-learn`）而非覆盖。

---

## 🟠 高问题 (High)

### H-1. body 背景色冲突

**文件**: `app/globals.css:30` + `app/layout.tsx:39`  
**问题**:
- `cinacoin.css` 定义 `body { background: var(--cc-canvas-soft) }` (暗色下 #0a0a0a)
- `globals.css` 覆盖为 `body { background-color: var(--cc-canvas) }` (暗色下 #000000)
- `layout.tsx` 又用 inline style 设置 `backgroundColor: 'var(--cc-canvas)'`

**影响**: 三层覆盖导致设计系统的 `canvas-soft` 背景被忽略。根据 DESIGN.md，页面背景应为 `canvas-soft`，`canvas` 仅用于卡片表面。当前整个页面背景是纯黑/纯白，失去了表面层级感。

**修复**:
```css
/* globals.css — 删除 body background 覆盖，让 cinacoin.css 生效 */
body {
  color: var(--cc-ink);
  font-family: ...;
  /* 删除 background-color 行 */
}
```
```tsx
// layout.tsx — 删除 inline style
<body className={...}>  // 不再需要 style={{ backgroundColor: ... }}
```

---

### H-2. 行高系统不一致

**文件**: `app/globals.css:56-72`  
**问题**: globals.css 中的排版工具类使用无单位行高（倍数），而 `cinacoin.css` 使用固定像素行高：

| 类名 | globals.css | cinacoin.css | 实际差异 |
|------|------------|-------------|---------|
| `.text-body-sm` | `line-height: 1.5` (21px) | `line-height: 20px` | +1px |
| `.text-body-md` | `line-height: 1.6` (25.6px) | `line-height: 24px` | +1.6px |
| `.text-body-lg` | `line-height: 1.6` (28.8px) | `line-height: 28px` | +0.8px |

**影响**: 文本行高比设计规范略松，在密集排版场景下累积导致整体节奏不一致。

**修复**:
```css
.text-body-sm { line-height: 20px; }
.text-body-md { line-height: 24px; }
.text-body-lg { line-height: 28px; }
```

---

### H-3. 过渡动画时长不符合规范

**文件**: `app/globals.css:93,107`  
**问题**: 按钮过渡使用 `150ms ease`，设计规范明确要求 `0.3s ease` (300ms)。

**影响**: 交互反馈过快，与设计系统其他组件（卡片 hover、导航链接等）的 300ms 节奏不同步。

**修复**: 删除 globals.css 中的按钮覆盖即可（见 C-5）。

---

### H-4. Sidebar 活跃链接使用硬编码 rgba

**文件**: `components/Sidebar.tsx:50`  
**问题**: 活跃链接背景色使用 `rgba(0, 112, 243, 0.1)` 而非设计 token `var(--cc-link-bg-soft)`。

**影响**: 暗色模式下 `--cc-link-bg-soft` 是 `rgba(0, 112, 243, 0.15)`，与硬编码值不同。亮色模式下 token 会切换为 `rgba(0, 112, 243, 0.1)`，但硬编码值不会跟随主题变化。

**修复**:
```tsx
backgroundColor: isActive ? 'var(--cc-link-bg-soft)' : 'transparent',
```

---

### H-5. Badge 组件字重不符合规范

**文件**: `app/globals.css:119-127`  
**问题**: `.cc-badge` 设置 `font-weight: var(--weight-medium)` (500)，但 `cinacoin.css` 规范定义 badge 为 `font-weight: var(--weight-regular)` (400)。

**影响**: 徽章文字比设计规范更粗，视觉重量偏高。

**修复**: 删除 globals.css 中的 `.cc-badge` 覆盖，或改为 `font-weight: var(--weight-regular)`。

---

### H-6. Card 组件添加了规范外的边框

**文件**: `app/globals.css:80-87`  
**问题**: `.cc-card` 在 globals.css 中添加了 `border: 1px solid var(--cc-hairline)`，但 `cinacoin.css` 的 `.cc-card` 使用 `box-shadow: var(--cc-level1)` 作为边缘定义（inset hairline shadow），不使用 border。

**影响**: 卡片边缘呈现方式与设计规范不同。设计规范使用 inset shadow 创造更柔和的边缘，当前使用硬边框显得更生硬。hover 时 box-shadow 叠加在 border 上也造成视觉冲突。

**修复**: 删除 globals.css 中 `.cc-card` 的 `border` 属性，或改用 `box-shadow: var(--cc-level1)`。

---

## 🟡 中等问题 (Medium)

### M-1. 首页 Hero 区域未使用规范表面色

**文件**: `app/page.tsx:37`  
**问题**: Hero 区域使用 `backgroundColor: 'var(--cc-canvas-soft-2)'` 配合 `rounded-lg`，但根据 DESIGN.md，这应该是一个 "dark band" 或 "showcase-band" 风格区域，应使用更大的内边距和不同的排版处理。

**当前**: `px-8 py-12` (32px/48px)  
**规范**: showcase-band 应使用 `{spacing.5xl} {spacing.lg}` (96px/24px) 或至少 `{spacing.4xl}` (64px)

**修复**: 增加垂直内边距至 `py-16` 或 `py-20`，更接近规范的 band 节奏。

---

### M-2. Skip Link 使用硬编码 Tailwind 颜色

**文件**: `app/layout.tsx:41`  
**问题**: Skip link 使用 `focus:bg-white focus:text-[var(--cc-ink)]` 而非设计 token。

**修复**:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--cc-primary)] focus:text-[var(--cc-on-primary)] focus:rounded-md">
```

---

### M-3. 按钮高度与表单系统不统一

**问题**: 
- globals.css 按钮高度: 40px
- cinacoin.css `.cc-btn-primary`: 48px
- cinacoin.css `.cc-btn-primary-sm`: 32px
- cinacoin.css `.cc-form-input`: 40px

当前 globals.css 按钮 (40px) 恰好等于表单输入高度，这在表单内按钮对齐上是合理的，但与设计规范的 48px 营销按钮不一致。Learn 平台作为产品界面（非营销页面），使用 40px 按钮可以接受，但应在文档中明确记录这个有意识的偏差。

---

### M-4. InteractiveEditor 的 Run 按钮尺寸覆盖

**文件**: `components/InteractiveEditor.tsx:42`  
**问题**: 使用 inline style 覆盖按钮尺寸为 `height: '32px'`，这使其等同于 `.cc-btn-primary-sm`，但使用的是 `.cc-btn-primary` 类名。

**修复**: 改用 `cc-btn-primary-sm` 类名，或创建明确的尺寸变体。

---

### M-5. 页面标题缺少句号（品牌规范不一致）

**文件**: 多个页面  
**问题**: DESIGN.md 明确标题使用 "sentence-case, period-terminated" 风格。但部分页面标题不一致：

| 页面 | 标题 | 有句号? |
|------|------|---------|
| basics | "Web3 basics" | ❌ |
| wallet-integration | "Wallet integration" | ❌ |
| multichain | "Multichain development" | ❌ |
| best-practices | "Best practices" | ❌ |
| 首页 h1 | "Welcome to CinaCoin Learn." | ✅ |

**修复**: 统一为 "Web3 basics.", "Wallet integration.", "Multichain development.", "Best practices."

---

### M-6. 部分 H2 标题有句号，部分没有

**文件**: 各教程页面  
**问题**: 不一致的标题句号使用：
- basics: "What is Web3?" (问号), "Blockchain fundamentals" (无句号)
- multichain: "Why multichain?" (问号), "Configure supported chains" (无), "Chain-agnostic interactions." (有), "Cross-chain state." (有)
- best-practices: "1. Security first." (有), "2. Error handling." (有)

**修复**: 统一规范 — 陈述句标题加句号，疑问句标题加问号。

---

### M-7. Sidebar 分类标题未使用 mono 字体

**文件**: `components/Sidebar.tsx:33`  
**问题**: 分类标题 ("Fundamentals", "Advanced") 使用 `text-caption tracking-wider` 但未添加 `cc-mono` 类。DESIGN.md 规定 section eyebrow/label 应使用 mono 字体 (`caption-mono`)。

**修复**:
```tsx
<h3 className="cc-mono text-caption tracking-wider" ...>
```

---

## 🔵 低问题 (Low)

### L-1. Sidebar 侧边栏过渡动画时长

**文件**: `components/ResponsiveShell.tsx:67`  
**问题**: 使用 Tailwind `duration-200` (200ms)，设计规范为 300ms。

**修复**: 改为 `duration-300`。

---

### L-2. TutorialCard 难度颜色语义不精确

**文件**: `components/TutorialCard.tsx:11-15`  
**问题**: 难度映射使用语义颜色：
- Beginner → `--cc-success` (蓝色，本意是"成功")
- Intermediate → `--cc-warning` (橙色，本意是"警告")
- Advanced → `--cc-error` (红色，本意是"错误")

虽然视觉效果可接受，但语义 token 用于非其设计目的可能在将来造成混淆。

**建议**: 添加注释说明这是有意的颜色复用，或创建专门的难度颜色 token。

---

### L-3. 首页 "View docs" 按钮使用冗余 inline style

**文件**: `app/page.tsx:49`  
**问题**: 
```tsx
style={{ background: 'transparent', borderColor: 'var(--cc-hairline)', color: 'var(--cc-ink)' }}
```
这些属性已经由 `.cc-btn-secondary` 定义，inline style 覆盖是冗余的。

**修复**: 删除冗余 inline style。

---

### L-4. 未使用的 Sidebar 组件

**文件**: `components/Sidebar.tsx`  
**问题**: `Sidebar.tsx` 导出了组件但其中 `tutorials` 数组包含硬编码的 `progress` 值，这些数据应该来自外部状态或 context，而非硬编码。

**建议**: 将教程进度数据移至 context 或 props，为将来集成真实进度追踪做准备。

---

## 审查维度总结

### 1. 颜色系统 ✅ 部分通过
- **通过**: 大部分颜色使用 CSS 变量
- **不通过**: CodeBlock 完全硬编码 (C-4)，Sidebar 活跃状态硬编码 (H-4)，`--cc-mute` 拼写错误 (C-2)

### 2. 排版 ⚠️ 需改进
- **问题**: 行高使用无单位倍数而非像素 (H-2)，标题句号使用不一致 (M-5, M-6)

### 3. 间距 ❌ 严重问题
- **核心问题**: `--cc-space-*` 变量不存在 (C-1)，导致所有组件间距失效

### 4. 圆角 ✅ 基本通过
- **通过**: 按钮使用 `--cc-radius-pill`，卡片使用 `--cc-radius-md`/`rounded-lg`

### 5. 组件一致性 ⚠️ 需改进
- **问题**: globals.css 覆盖设计系统组件 (C-5, H-5, H-6)，按钮尺寸不统一 (M-3)

### 6. 暗色模式 ⚠️ 需改进
- **问题**: CodeBlock 不支持主题切换 (C-4)，body 背景三层覆盖 (H-1)

### 7. 响应式 ✅ 基本通过
- **通过**: Sidebar 有合理的移动端折叠逻辑，网格使用响应式列数
- **小问题**: 过渡动画时长不一致 (L-1)

---

## 优先修复顺序

1. **立即修复** (阻断性问题):
   - C-1: `--cc-space-*` → `--cc-*` (所有组件间距失效)
   - C-2: `--cc-mute` → `--cc-muted` (辅助文本颜色失效)
   - C-3: `--cc-shadow-3` → `--cc-level3` (阴影失效)

2. **高优先级** (影响视觉一致性):
   - C-4: CodeBlock 硬编码颜色 (亮色模式不可用)
   - C-5: 删除 globals.css 按钮覆盖
   - H-1: 修复 body 背景色冲突
   - H-2: 修复行高值

3. **中优先级** (完善细节):
   - H-4 ~ H-6: 组件细节修正
   - M-1 ~ M-7: 排版与间距微调

4. **低优先级** (代码质量):
   - L-1 ~ L-4: 清理冗余代码

---

## 附录：Token 对照表

| 错误 Token | 正确 Token | 值 |
|-----------|-----------|-----|
| `--cc-space-xxs` | `--cc-xxs` | 4px |
| `--cc-space-xs` | `--cc-xs` | 8px |
| `--cc-space-sm` | `--cc-sm` | 12px |
| `--cc-space-md` | `--cc-md` | 16px |
| `--cc-space-lg` | `--cc-lg` | 24px |
| `--cc-space-xl` | `--cc-xl` | 32px |
| `--cc-space-2xl` | `--cc-2xl` | 40px |
| `--cc-mute` | `--cc-muted` | #737373 / #a3a3a3 |
| `--cc-shadow-3` | `--cc-level3` | stacked shadow |
