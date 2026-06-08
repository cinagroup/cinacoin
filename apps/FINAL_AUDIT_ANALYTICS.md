# Final Audit Report — analytics-dashboard (analytics.cinacoin.com)

**Date:** 2026-06-08  
**Auditor:** Cinacoin Design Compliance Subagent  

---

## P0 — 高优先级

### ✅ 卡片堆叠阴影 + inset hairline 已补全

**状态：PASS**

`.v-stat-card` 和 `.v-chart-card` 在 `src/app/globals.css` 中已正确实现：

```css
/* Stat Card */
.v-stat-card {
  box-shadow: var(--v-shadow-card), var(--v-shadow-inset);
  /* 展开: 0px 1px 1px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04), inset 0 0 0 1px #ebebeb */
}

.v-stat-card:hover {
  box-shadow: var(--v-shadow-card-hover), var(--v-shadow-inset);
}

/* Chart Card */
.v-chart-card {
  box-shadow:
    0px 1px 1px rgba(0, 0, 0, 0.02),
    0px 2px 2px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px #ebebeb;
}
```

**涉及组件：** `src/app/page.tsx` 中所有 `v-stat-card` 和 `v-chart-card` 实例。

---

## P1 — 中优先级

### ✅ 数据表格表头使用 Geist Mono 等宽字体

**状态：PASS**

`.v-table th` 在 `src/app/globals.css` 中定义：

```css
.v-table th {
  font-family: var(--v-font-mono);
  /* 展开: 'Geist Mono', var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, monospace */
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  ...
}
```

**使用位置：** `src/app/page.tsx` 中的 Recent Transactions 表格。

### ✅ 输入框高度统一为 40px

**状态：PASS**

`.v-input` 在 `src/app/globals.css` 中定义：

```css
.v-input {
  height: 40px;
  ...
}
```

**注意：** 当前 `page.tsx` 中未发现实际使用 `.v-input` 的表单元素（分析仪表盘当前为只读展示，无输入框）。但样式定义已就绪，未来添加表单时将自动遵循 40px 高度规范。

---

## P2 — 低优先级

### ❌ Logo 引用未修正为 /logo.png

**状态：FAIL**

当前仍使用 `/analytics/logo.svg`：

- `src/app/layout.tsx:31` — `icons: { icon: '/analytics/logo.svg' }`
- `src/app/page.tsx:135` — `<img src="/analytics/logo.svg" ...>`

**建议：** 将 logo 引用统一修正为 `/logo.png`。

### ⚠️ Geist 字体未加载

**状态：FAIL**

`globals.css` 中字体栈声明 Geist 优先：

```css
--v-font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
--v-font-mono: 'Geist Mono', var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
```

但 `src/app/layout.tsx` 实际加载的是 **Inter** 和 **JetBrains Mono**（Google Fonts）：

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google';
```

代码注释明确说明：
> "Note: In production, replace Inter with Geist and JetBrains_Mono with Geist Mono via next/font/local for the full Vercel-style typography experience."

**建议：** 使用 `next/font/local` 加载 Geist 和 Geist Mono 字体文件，替换当前的 Google Fonts 方案。

---

## 总结

| 优先级 | 检查项 | 状态 |
|--------|--------|------|
| P0 | 卡片堆叠阴影 + inset hairline | ✅ PASS |
| P1 | 表头 Geist Mono 等宽字体 | ✅ PASS |
| P1 | 输入框高度 40px | ✅ PASS |
| P2 | Logo 引用 /logo.png | ❌ FAIL |
| P2 | 字体栈顺序 Geist 优先 | ✅ PASS（CSS 声明正确） |
| P2 | Geist 字体文件加载 | ❌ FAIL |

**合规率：4/6 通过，2 项未通过**

### 待修复项

1. **Logo 引用：** `/analytics/logo.svg` → `/logo.png`（2 处）
2. **Geist 字体加载：** 替换 `next/font/google` 的 Inter/JetBrains_Mono 为 `next/font/local` 的 Geist/Geist Mono
