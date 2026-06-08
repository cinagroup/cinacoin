# FINAL_AUDIT_DEMO.md — Cinacoin Demo 设计合规审计报告

**日期:** 2026-06-08  
**项目:** `/home/cina/.openclaw/workspace/onux/apps/demo`

---

## 审计结果总览

| 优先级 | 项目 | 状态 | 备注 |
|--------|------|------|------|
| P0 | 按钮圆角统一 6px | ✅ 通过 | Button 组件 sm/md/lg 均为 `rounded-[6px]` |
| P0 | 卡片堆叠阴影 + inset hairline | ⚠️ 部分通过 | CSS 变量已定义，但实际未引用 |
| P1 | 技术内容使用 Geist Mono | ✅ 通过 | 地址/hash/chainId 等均使用 `font-mono` |
| P1 | 输入框高度统一 40px | ⚠️ 部分通过 | 部分页面未统一 |
| P2 | Geist 字体已加载 | ❌ 未通过 | CSS 引用 Geist 但 layout 加载的是 Inter + JetBrains Mono |
| P2 | 移动端高度修正 | ✅ 通过 | Button sm/md 有 `min-h-[44px]` 触控目标 |

---

## 详细发现

### P0-1: 按钮圆角统一 6px ✅

`src/components/Button.tsx` 所有尺寸变体均使用 `rounded-[6px]`：
- sm: `rounded-[6px] h-[32px] min-h-[44px]`
- md: `rounded-[6px] h-[40px] min-h-[44px]`
- lg: `rounded-[6px] h-[48px] min-h-[48px]`

无其他按钮组件使用不同圆角值。

### P0-2: 卡片堆叠阴影 + inset hairline ⚠️

**已定义（globals.css:26-28）：**
```css
--ds-shadow-card: 0px 1px 1px rgba(0,0,0,0.03), 0px 2px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08) inset;
--ds-shadow-card-hover: ...
--ds-shadow-elevated: ...
```

**问题：** 这三个 CSS 变量在整个 `src/` 目录中 **无任何引用**。卡片实际使用的是 `shadow-[var(--cc-level2)]` 或 `shadow-[var(--cc-level1)]` 等 design-tokens 包的变量。`--ds-shadow-*` 变量是死代码。

**建议：** 要么将卡片阴影替换为 `shadow-[var(--ds-shadow-card)]`，要么删除未使用的变量。

### P1-1: 技术内容使用 Mono 字体 ✅

广泛使用 `font-mono` 类于：
- 钱包地址（profile, multi-chain, components 页面）
- Chain ID、RPC URL
- 交易 hash
- 代码片段

`layout.tsx` 加载 `JetBrains_Mono` 映射到 `--font-mono`，CSS 中 `--ds-font-mono` 声明了 `Geist Mono` 但实际 fallback 到 JetBrains Mono。

### P1-2: 输入框高度统一 40px ⚠️

**已统一（h-[40px]）：**
- `src/components/Button.tsx` md 变体
- `src/components/TokenInput.tsx`
- `src/app/tokens/page.tsx` 搜索框

**未统一（使用 py-2/py-3 无固定高度）：**
- `src/app/auth/page.tsx:592` — 搜索输入框 `px-3 py-2 rounded-lg`
- `src/app/batch/page.tsx:720,734` — 地址输入框 `px-3 py-2`
- `src/app/components/page.tsx:534,546,568,578` — 展示用输入框
- `src/app/onramp/page.tsx:313` — 输入框

**建议：** 统一添加 `h-[40px]` 或创建 `.cc-input` 组件类。

### P2-1: Geist 字体加载 ❌

**现状：**
- `globals.css` 声明 `--ds-font-sans: 'Geist', 'Inter', ...` 和 `--ds-font-mono: 'Geist Mono', ...`
- `layout.tsx` 实际加载的是 **Inter** (`next/font/google`) 和 **JetBrains_Mono**
- Geist / Geist Mono **从未被加载**，CSS 变量中的引用会 fallback 到 Inter / JetBrains Mono
- `package.json` 中无 `@vercel/geist` 依赖

**建议：** 安装 `geist` 包并使用 `next/font` 加载 Geist Sans + Geist Mono，或移除 CSS 中的 Geist 引用以避免误导。

### P2-2: 移动端高度修正 ✅

Button 组件 sm/md 变体均有 `min-h-[44px]`，满足 WCAG 触控目标要求。Toggle 组件也有 `min-h-[44px]`。

---

## 总结

| 通过 | 部分通过 | 未通过 |
|------|----------|--------|
| 3 | 2 | 1 |

**关键遗留问题：**
1. `--ds-shadow-*` CSS 变量定义但未使用（死代码）
2. 多个页面输入框高度未统一为 40px
3. Geist 字体声明但未加载
