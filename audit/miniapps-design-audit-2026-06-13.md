# Mini Apps DESIGN.md 合规性审计报告

**审计日期**: 2026-06-13  
**审计规范**: `design-guidelines/DESIGN.md` (alpha)  
**审计范围**: 5 个 Mini Apps  

---

## 总览评分

| 应用 | 颜色 | 排版 | 间距 | 圆角 | 组件 | 移动端 | **总分** |
|------|------|------|------|------|------|--------|----------|
| telegram-app | 8/10 | 7/10 | 9/10 | 9/10 | 7/10 | 8/10 | **80%** |
| farcaster-app | 5/10 | 9/10 | 9/10 | 6/10 | 5/10 | 8/10 | **70%** |
| wallet-explorer | 6/10 | 9/10 | 9/10 | 9/10 | 6/10 | 7/10 | **77%** |
| health-status | 6/10 | 9/10 | 9/10 | 9/10 | 6/10 | 7/10 | **77%** |
| demo | 7/10 | 9/10 | 9/10 | 9/10 | 7/10 | 8/10 | **82%** |

---

## 1. telegram-app

### ✅ 合规项
- [x] 使用 `@cinacoin/design-tokens` 引入 `--cc-primary` (#171717)
- [x] `--cc-link` 最终解析为 #0070f3
- [x] TSX 组件中无硬编码颜色值
- [x] Geist Sans 字体加载，weight 600 用于标题
- [x] 4px 基准间距 token（`--cc-space-1: 4px` 到 `--cc-space-12: 48px`）
- [x] `--cc-radius-pill: 100px` 用于主按钮
- [x] `--cc-radius-md: 8px` 用于卡片
- [x] `.cc-btn-primary` 高度 48px
- [x] Skip navigation（`App.tsx` L113-115）
- [x] `prefers-reduced-motion` 支持（`global.css` L175-184）
- [x] Sentence-case 标题

### ❌ 问题项

| # | 问题 | 文件 | 行号 | 严重度 |
|---|------|------|------|--------|
| 1 | `--cc-text-display-xl: 36px`，DESIGN.md 规范要求 48px | `src/styles/global.css` | L36 | 中 |
| 2 | `--cc-text-display-lg: 28px`，DESIGN.md 规范要求 32px | `src/styles/global.css` | L37 | 中 |
| 3 | 卡片（`.balance-card-inner`, `.transaction-item`）仅使用 `border` + `border-radius`，无 Level 3 阴影 | `src/styles/pages.css` | L72-78, L146-151 | 中 |
| 4 | 触摸目标未全局强制 44px（仅 tab-item `min-width: 64px`） | `src/styles/App.css` | L70-80 | 低 |
| 5 | `.cc-btn-secondary-sm` 使用 `border-radius: var(--cc-radius-sm)` (6px) 而非 pill (100px) | `src/styles/pages.css` | L241 | 低 |

### 修复建议
1. 将 `--cc-text-display-xl` 改为 `48px`，`--cc-text-display-lg` 改为 `32px`
2. 为卡片组件添加 Level 3 阴影：`box-shadow: 0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08)`
3. 添加全局 `button, a, [role='button'] { min-height: 44px; min-width: 44px; }`

---

## 2. farcaster-app

### ✅ 合规项
- [x] Geist Sans 字体加载，weight 600 用于标题
- [x] Tailwind 4px 基准间距
- [x] Skip navigation（`layout.tsx` L40-42）
- [x] `prefers-reduced-motion` 支持（`globals.css` L228-237）
- [x] 触摸目标全局 44px（`globals.css` L128-129）
- [x] Sentence-case + period-terminated 标题（"Cinacoin."）

### ❌ 问题项

| # | 问题 | 文件 | 行号 | 严重度 |
|---|------|------|------|--------|
| 1 | `--cc-link: #3b82f6`，DESIGN.md 规范要求 #0070f3 | `src/app/globals.css` | L34 | 高 |
| 2 | `--cc-link-deep: #60a5fa`，DESIGN.md 规范要求 #0761d1 | `src/app/globals.css` | L35 | 高 |
| 3 | 硬编码 `color: #ffffff` 在按钮类中（应使用 `var(--cc-on-primary)`） | `src/app/globals.css` | L148, L168, L188 | 中 |
| 4 | 主按钮使用 `rounded-sm` (6px) 而非 `100px` pill | `src/app/page.tsx` | L70, L79, L88 | 高 |
| 5 | `.cc-btn-primary` 高度 40px，DESIGN.md 规范要求 48px | `src/app/globals.css` (via shared-design-system.css) | — | 中 |
| 6 | 卡片无 Level 3 阴影（仅有 border） | `src/app/page.tsx` | L42 | 中 |
| 7 | `--cc-success: #22c55e`，DESIGN.md 规范定义为 #0070f3 | `src/app/globals.css` | L29 | 中 |
| 8 | `--cc-error: #ef4444`，DESIGN.md 规范定义为 #ee0000 | `src/app/globals.css` | L31 | 低 |

### 修复建议
1. **紧急**：将 `--cc-link` 改为 `#0070f3`，`--cc-link-deep` 改为 `#0761d1`
2. **紧急**：将页面 CTA 按钮的 `rounded-sm` 改为 `rounded-[100px]` 或使用 `--cc-radius-pill`
3. 将硬编码 `#ffffff` 替换为 `var(--cc-on-primary)`
4. 按钮高度改为 48px
5. 卡片添加 Level 3 阴影

---

## 3. wallet-explorer

### ✅ 合规项
- [x] 亮色主题 `--color-primary: #171717`，`--color-link: #0070f3` ✅
- [x] Geist Sans 字体加载，weight 600
- [x] 完整阴影系统（Level 1-5）
- [x] 4px 基准间距（Tailwind）
- [x] `--cc-radius-pill: 100px`，`--cc-radius-md: 8px`
- [x] Skip navigation（`layout.tsx`）
- [x] 触摸目标 44px（`shared-design-system.css` L567）
- [x] Sentence-case 标题

### ❌ 问题项

| # | 问题 | 文件 | 行号 | 严重度 |
|---|------|------|------|--------|
| 1 | 暗色主题 `--color-link: #3b82f6`，偏离规范 #0070f3 | `src/app/globals.css` | L69 | 高 |
| 2 | TSX 中硬编码颜色：`bg-[#171717]`, `text-[#888]`, `text-[#b3b3b3]` | `src/app/page.tsx` | L101-104 | 中 |
| 3 | `.cc-btn-primary` 高度 40px，规范要求 48px | `src/shared-design-system.css` | L337 | 中 |
| 4 | `.cc-card` 阴影为 Level 2 而非 Level 3 | `src/shared-design-system.css` | L305-309 | 中 |
| 5 | 缺少 `prefers-reduced-motion` 支持 | — | — | 中 |
| 6 | `.cc-card-lg` 使用 `border-radius: var(--cc-radius-md)` (8px)，规范要求 12px | `src/shared-design-system.css` | L317 | 低 |

### 修复建议
1. 暗色主题 `--color-link` 改回 `#0070f3`（或保持品牌一致性）
2. 将 `page.tsx` 中硬编码颜色替换为 CSS 变量
3. 按钮高度改为 48px
4. `.cc-card` 阴影升级为 Level 3
5. 添加 `@media (prefers-reduced-motion: reduce)` 规则

---

## 4. health-status

### ✅ 合规项
- [x] 亮色主题 `--color-primary: #171717`，`--color-link: #0070f3`
- [x] Geist Sans 字体加载，weight 600
- [x] 完整阴影系统（Level 1-5）
- [x] 4px 基准间距
- [x] `--cc-radius-pill: 100px`，`--cc-radius-md: 8px`
- [x] Skip navigation（`layout.tsx`）
- [x] 触摸目标 44px × 44px（`shared-design-system.css` L601-602）
- [x] Sentence-case 标题

### ❌ 问题项

| # | 问题 | 文件 | 行号 | 严重度 |
|---|------|------|------|--------|
| 1 | 暗色主题 `--color-link: #3b82f6`，偏离规范 #0070f3 | `src/shared-design-system.css` (via globals.css) | L69 | 高 |
| 2 | TSX 中硬编码颜色：`bg-[#171717]`, `text-[#888]`, `text-[#b3b3b3]`, `bg-[#f5a623]` | `src/app/page.tsx` | L81-90 | 中 |
| 3 | `.cc-btn-primary` 高度 40px，规范要求 48px | `src/shared-design-system.css` | L337 | 中 |
| 4 | `.cc-card` 阴影为 Level 2 而非 Level 3 | `src/shared-design-system.css` | L305-309 | 中 |
| 5 | 缺少 `prefers-reduced-motion` 支持 | — | — | 中 |
| 6 | `.cc-card-lg` 圆角 8px，规范要求 12px | `src/shared-design-system.css` | L317 | 低 |

### 修复建议
1. 暗色主题 `--color-link` 改回 `#0070f3`
2. 将 `page.tsx` 中硬编码颜色替换为 CSS 变量（如 `bg-[var(--cc-primary)]`, `text-[var(--cc-muted)]`）
3. 按钮高度改为 48px
4. `.cc-card` 阴影升级为 Level 3
5. 添加 `prefers-reduced-motion` 支持

---

## 5. demo

### ✅ 合规项
- [x] 亮色主题 `--color-primary: #171717`，`--color-link: #0070f3`
- [x] Geist Sans 字体加载，weight 600
- [x] 完整阴影系统（Level 1-5）
- [x] 4px 基准间距
- [x] `--cc-radius-pill: 100px`，`--cc-radius-md: 8px`
- [x] Skip navigation（`layout.tsx`）
- [x] 触摸目标 44px（`shared-design-system.css` L567-568）
- [x] `.cc-btn-primary` lg 变体高度 48px（`Button.tsx` L31）
- [x] Sentence-case 标题

### ❌ 问题项

| # | 问题 | 文件 | 行号 | 严重度 |
|---|------|------|------|--------|
| 1 | 暗色主题 `--color-link: #3b82f6`，偏离规范 #0070f3 | `src/shared-design-system.css` (via globals.css) | L69 | 高 |
| 2 | `.cc-btn-primary` md 变体高度 40px，规范要求 48px | `src/components/Button.tsx` | L30 | 中 |
| 3 | `.cc-card` 阴影为 Level 2 而非 Level 3 | `src/shared-design-system.css` | L305-309 | 中 |
| 4 | 缺少 `prefers-reduced-motion` 支持 | — | — | 中 |
| 5 | TSX 中少量硬编码：`#fff` in `Card.tsx` mask, token brand colors in `tokens/page.tsx` | `src/components/Card.tsx` L60; `src/app/tokens/page.tsx` L11-16 | 低 |
| 6 | `.cc-card-lg` 圆角 8px，规范要求 12px | `src/shared-design-system.css` | L317 | 低 |

### 修复建议
1. 暗色主题 `--color-link` 改回 `#0070f3`
2. `.cc-btn-primary` md 变体高度改为 48px
3. `.cc-card` 阴影升级为 Level 3
4. 添加 `prefers-reduced-motion` 支持
5. Token brand colors（#627EEA 等）属于外部品牌标识色，可保留

---

## 跨应用共性问题

### 🔴 高优先级

1. **暗色主题 `--color-link` 偏离规范**  
   所有 4 个 Next.js 应用的暗色主题将 `--color-link` 设为 `#3b82f6`（Tailwind blue-500），而 DESIGN.md 规范定义为 `#0070f3`。  
   **影响**: farcaster-app, wallet-explorer, health-status, demo  
   **修复**: 统一改回 `#0070f3` 或更新 DESIGN.md 暗色主题规范

2. **卡片阴影不足**  
   所有应用的 `.cc-card` 使用 Level 2 阴影（或仅 border），DESIGN.md 规范要求 `card-marketing` 使用 Level 3 阴影。  
   **修复**: 将 `.cc-card` 阴影升级为：
   ```css
   box-shadow: 0px 2px 2px rgba(0,0,0,0.04), 0px 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08);
   ```

### 🟡 中优先级

3. **`button-primary` 高度不一致**  
   DESIGN.md 规范要求 48px，但多数应用实现为 40px。  
   **影响**: farcaster-app, wallet-explorer, health-status, demo (md variant)

4. **缺少 `prefers-reduced-motion`**  
   wallet-explorer, health-status, demo 的 CSS 中无 `prefers-reduced-motion` 规则。  
   **修复**: 添加标准 reduced-motion 规则

5. **TSX 中硬编码颜色值**  
   wallet-explorer 和 health-status 的 `page.tsx` 使用 Tailwind 任意值语法硬编码颜色。  
   **修复**: 替换为 CSS 变量引用

### 🟢 低优先级

6. **`.cc-card-lg` 圆角不一致**  
   wallet-explorer, health-status, demo 的 `.cc-card-lg` 使用 8px，DESIGN.md 规范要求 12px。

7. **telegram-app display 字号偏差**  
   `display-xl` 为 36px（规范 48px），`display-lg` 为 28px（规范 32px）。

---

## 合规矩阵详细检查清单

### 颜色系统
| 检查项 | telegram | farcaster | wallet-explorer | health-status | demo |
|--------|----------|-----------|-----------------|---------------|------|
| `--cc-primary` = #171717 | ✅ | ✅* | ✅ | ✅ | ✅ |
| `--cc-link` = #0070f3 | ✅ | ❌ | ✅† | ✅† | ✅† |
| 无硬编码颜色 | ✅ | ❌ | ❌ | ❌ | ⚠️ |

*暗色主题反转为 #ffffff（可接受）  
†亮色主题正确，暗色主题偏离为 #3b82f6

### 排版系统
| 检查项 | telegram | farcaster | wallet-explorer | health-status | demo |
|--------|----------|-----------|-----------------|---------------|------|
| Geist 字体加载 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 标题 weight 600 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sentence-case | ✅ | ✅ | ✅ | ✅ | ✅ |
| 无 weight > 600 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 间距系统
| 检查项 | telegram | farcaster | wallet-explorer | health-status | demo |
|--------|----------|-----------|-----------------|---------------|------|
| 4px 基准 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 圆角系统
| 检查项 | telegram | farcaster | wallet-explorer | health-status | demo |
|--------|----------|-----------|-----------------|---------------|------|
| 主按钮 100px pill | ✅ | ❌ | ✅ | ✅ | ✅ |
| 卡片 8px | ✅ | ✅ | ✅ | ✅ | ✅ |
| 导航按钮 6px | ✅ | ✅ | ✅ | ✅ | ✅ |

### 组件规范
| 检查项 | telegram | farcaster | wallet-explorer | health-status | demo |
|--------|----------|-----------|-----------------|---------------|------|
| button-primary 48px | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| card Level 3 阴影 | ❌ | ❌ | ❌ | ❌ | ❌ |

### 移动端适配
| 检查项 | telegram | farcaster | wallet-explorer | health-status | demo |
|--------|----------|-----------|-----------------|---------------|------|
| 触摸目标 ≥ 44px | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Skip navigation | ✅ | ✅ | ✅ | ✅ | ✅ |
| prefers-reduced-motion | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 总结

**整体合规率**: ~77%

**最佳实践应用**: **demo** (82%) — 最接近规范，按钮有 48px lg 变体  
**需重点改进**: **farcaster-app** (70%) — 链接颜色偏差、按钮形状错误

**三大共性问题**:
1. 暗色主题 link 颜色统一偏离 (#3b82f6 vs #0070f3)
2. 所有应用卡片阴影均未达到 Level 3 标准
3. button-primary 高度普遍为 40px 而非规范 48px
