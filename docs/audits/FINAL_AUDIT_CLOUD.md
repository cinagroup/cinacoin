# Final Audit Report — cloud-dashboard (cloud.cinacoin.com)

**Date:** 2026-06-08  
**Auditor:** Cinacoin Design Compliance Subagent

---

## P0 — 高优先级

### ✅ 卡片堆叠阴影 + inset hairline 已补全

**状态：PASS**

`.cc-card` 和 `.stat-card` 在 `src/app/globals.css` 中已正确实现：

```css
.cc-card {
  border-radius: var(--app-radius-lg);
  box-shadow:
    0px 1px 1px rgba(0, 0, 0, 0.02),
    0px 2px 2px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px #ebebeb;
}

.cc-card:hover {
  box-shadow:
    0px 2px 2px rgba(0, 0, 0, 0.04),
    0px 8px 8px -8px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px #ebebeb;
}

.stat-card {
  box-shadow:
    0px 1px 1px rgba(0, 0, 0, 0.02),
    0px 2px 2px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px #ebebeb;
}
```

**涉及组件：**

- `src/app/page.tsx` — 项目卡片、统计卡片
- `src/app/settings/page.tsx` — 设置面板
- `src/app/projects/new/page.tsx` — 新建项目表单
- `src/app/projects/[id]/ProjectDetailClient.tsx` — 项目详情统计

---

## P1 — 中优先级

### ✅ 数据表格表头使用 Geist Mono 等宽字体

**状态：PASS**

`.data-table th` 在 `src/app/globals.css` 中定义：

```css
.data-table th {
  font-family: var(--font-mono);
  /* 展开: 'JetBrains Mono', 'Geist Mono', ui-monospace, ... */
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  ...
}
```

**注意：** 当前 `src/` 中未发现使用 `.data-table` 类的组件。但样式定义已就绪。

### ✅ 输入框高度统一为 40px

**状态：PASS**

输入框使用 `.cc-form-input` 类，由 `packages/design-tokens/css/cinacoin.css` 统一提供：

```css
.cc-form-input {
  height: 40px;
  ...
}
```

**使用位置：**

- `src/app/settings/page.tsx` — API Key 输入、设置表单
- `src/app/projects/[id]/ProjectDetailClient.tsx` — 项目编辑表单
- `src/components/ProjectForm.tsx` — 新建项目表单

---

## P2 — 低优先级

### ⚠️ Logo 引用部分修正

**状态：PARTIAL**

- `src/components/Header.tsx:38` — ✅ 使用 `/logo.png`
- `src/app/layout.tsx:13` — ❌ favicon 仍为 `/dashboard/logo.svg`

**建议：** 将 layout.tsx 中的 favicon 引用也修正为 `/logo.png` 或提供对应的 favicon 文件。

### ❌ 字体栈顺序未修正（Geist 应优先）

**状态：FAIL**

`src/app/globals.css` 中字体栈声明：

```css
:root {
  --font-sans: 'Inter', 'Geist', system-ui, -apple-system, sans-serif;
  --font-mono:
    'JetBrains Mono', 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
}
```

**问题：** Inter 和 JetBrains Mono 排在 Geist 前面，导致即使加载了 Geist 字体也不会被使用。

**应修正为：**

```css
:root {
  --font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
}
```

### ❌ Geist 字体未加载

**状态：FAIL**

`src/app/layout.tsx` 加载的是 **Inter** 和 **JetBrains Mono**（Google Fonts）：

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
```

**建议：**

1. 使用 `next/font/local` 加载 Geist 和 Geist Mono 字体文件
2. 修正字体栈顺序，Geist 优先

---

## 总结

| 优先级 | 检查项                        | 状态       |
| ------ | ----------------------------- | ---------- |
| P0     | 卡片堆叠阴影 + inset hairline | ✅ PASS    |
| P1     | 表头 Geist Mono 等宽字体      | ✅ PASS    |
| P1     | 输入框高度 40px               | ✅ PASS    |
| P2     | Logo 引用 /logo.png           | ⚠️ PARTIAL |
| P2     | 字体栈顺序 Geist 优先         | ❌ FAIL    |
| P2     | Geist 字体文件加载            | ❌ FAIL    |

**合规率：3/6 通过，1 项部分通过，2 项未通过**

### 待修复项

1. **字体栈顺序：** `--font-sans` 和 `--font-mono` 中 Geist 应排在 Inter/JetBrains Mono 前面
2. **Geist 字体加载：** 替换 `next/font/google` 的 Inter/JetBrains_Mono 为 `next/font/local` 的 Geist/Geist Mono
3. **Favicon 引用：** `/dashboard/logo.svg` → `/logo.png`（可选，视 favicon 需求而定）
