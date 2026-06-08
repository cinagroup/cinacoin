# Final Audit Report — backend-dashboard (admin.cinacoin.com)

**Date:** 2026-06-08  
**Auditor:** Cinacoin Design Compliance Subagent  

---

## P0 — 高优先级

### ✅ 卡片堆叠阴影 + inset hairline 已补全

**状态：PASS**

`.cc-card` 在 `src/app/globals.css` 中已正确实现：

```css
.cc-card {
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
```

`.ds-stat-card` 同样实现了相同的堆叠阴影 + inset hairline 模式。

**涉及组件：** 所有使用 `cc-card` 和 `ds-stat-card` 的页面（page.tsx, analytics, chains, keys-server, push-server, relay-server, rpc-proxy, notify-server, project, settings）均已受益。

---

## P1 — 中优先级

### ✅ 数据表格表头使用 Geist Mono 等宽字体

**状态：PASS**

`.ds-table-header` 在 `src/app/globals.css` 中定义：

```css
.ds-table-header {
  font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  ...
}
```

**使用位置：**
- `src/app/page.tsx` — 主仪表盘服务表
- `src/app/chains/page.tsx` — 链列表
- `src/app/rpc-proxy/page.tsx` — RPC 方法表和 Provider 表

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
- `src/app/chains/page.tsx` — 添加链表单
- `src/app/project/page.tsx` — 项目设置表单
- `src/app/settings/page.tsx` — 全局设置表单

---

## P2 — 低优先级

### ✅ Logo 引用为 /logo.png

**状态：PASS**

- `src/components/Header.tsx` — `logoSrc="/logo.png"`
- `src/components/Sidebar.tsx` — `logoSrc="/logo.png"`
- `src/app/login/page.tsx` — `src="/logo.png"`

### ⚠️ Geist 字体未通过 next/font 加载

**状态：PARTIAL**

`globals.css` 中字体栈正确声明 Geist 优先：

```css
body {
  font-family: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
}
```

**但** `src/app/layout.tsx` 未通过 `next/font/local` 或 `next/font/google` 加载 Geist 字体文件。当前依赖系统字体回退（`system-ui`）。CSS 变量中引用了 Geist，但实际字体文件未被打包。

**建议：** 在 `layout.tsx` 中通过 `next/font/local` 加载 Geist 字体文件，确保跨平台一致渲染。

---

## 总结

| 优先级 | 检查项 | 状态 |
|--------|--------|------|
| P0 | 卡片堆叠阴影 + inset hairline | ✅ PASS |
| P1 | 表头 Geist Mono 等宽字体 | ✅ PASS |
| P1 | 输入框高度 40px | ✅ PASS |
| P2 | Logo 引用 /logo.png | ✅ PASS |
| P2 | 字体栈顺序 Geist 优先 | ✅ PASS |
| P2 | Geist 字体文件加载 | ⚠️ PARTIAL |

**合规率：5/6 通过，1 项部分通过**
