# design-tokens 包完整性审计报告

**日期**: 2026-06-13  
**审计范围**: `@cinacoin/design-tokens` v0.2.0 vs `DESIGN.md` (alpha)  
**审计文件**:
- `/design-guidelines/DESIGN.md` — 设计规范（source of truth）
- `/packages/design-tokens/css/cinacoin.css` — CSS 变量 + 组件类
- `/packages/design-tokens/css/fonts.css` — 字体声明
- `/packages/design-tokens/package.json` — 包配置

---

## 总览

| 维度 | 检查项 | 通过 | 缺失/不一致 | 完整度 |
|------|--------|------|-------------|--------|
| 1. 颜色变量 | 35 | 20 | 15 | 57% |
| 2. 排版变量 | 17 | 16 | 1 | 94% |
| 3. 间距变量 | 12 | 12 | 0 | 100% |
| 4. 圆角变量 | 9 | 9 | 0 | 100% |
| 5. 阴影变量 | 6 | 6 | 0 | 100% |
| 6. 组件类 | 15 | 15 | 0* | 85%** |
| 7. 字体文件 | 5 | 5 | 0 | 100% |
| 8. 暗色/亮色主题 | 2 | 2 | 0 | 100% |
| **综合** | **101** | **85** | **16** | **≈ 84%** |

> *组件类全部存在，但部分属性值与 DESIGN.md 不一致（见详表）。  
> **组件类值一致性约 85%。

---

## 1. 颜色变量完整性

### 1.1 品牌 & 表面色

| Token | DESIGN.md 值 | CSS Light 值 | 状态 |
|-------|-------------|--------------|------|
| `--cc-primary` | `#171717` | `#171717` | ✅ |
| `--cc-on-primary` | `#ffffff` | `#ffffff` | ✅ |
| `--cc-ink` | `#171717` | `#171717` | ✅ |
| `--cc-body` | `#4d4d4d` | `#525252` | ❌ 值不一致 |
| `--cc-muted` | `#888888` | `#a3a3a3` | ❌ 值不一致 |
| `--cc-canvas` | `#ffffff` | `#ffffff` | ✅ |
| `--cc-canvas-soft` | `#fafafa` | `#fafafa` | ✅ |
| `--cc-canvas-soft-2` | `#f5f5f5` | `#f5f5f5` | ✅ |
| `--cc-hairline` | `#ebebeb` | `rgba(0,0,0,0.08)` | ❌ 值不一致（应为 `#ebebeb`） |
| `--cc-hairline-strong` | `#a1a1a1` | `rgba(0,0,0,0.15)` | ❌ 值不一致（应为 `#a1a1a1`） |

### 1.2 链接 & 语义色

| Token | DESIGN.md 值 | CSS Light 值 | 状态 |
|-------|-------------|--------------|------|
| `--cc-link` | `#0070f3` | `#0070f3` | ✅ |
| `--cc-link-deep` | `#0761d1` | `#0761d1` | ✅ |
| `--cc-link-bg-soft` | `#d3e5ff` | `rgba(0,112,243,0.1)` | ❌ 值不一致 |
| `--cc-success` | `#0070f3` | `#0070f3` | ✅ |
| `--cc-error` | `#ee0000` | `#ee0000` | ✅ |
| `--cc-error-soft` | `#f7d4d6` | `rgba(238,0,0,0.1)` | ❌ 值不一致 |
| `--cc-error-deep` | `#c50000` | `#c50000` | ✅ |
| `--cc-warning` | `#f5a623` | `#f5a623` | ✅ |
| `--cc-warning-soft` | `#ffefcf` | `rgba(245,166,35,0.1)` | ❌ 值不一致 |
| `--cc-warning-deep` | `#ab570a` | `#ab570a` | ✅ |

### 1.3 品牌强调色（完全缺失）

| Token | DESIGN.md 值 | CSS 值 | 状态 |
|-------|-------------|--------|------|
| `--cc-violet` | `#7928ca` | — | ❌ 缺失 |
| `--cc-violet-soft` | `#d8ccf1` | — | ❌ 缺失 |
| `--cc-violet-deep` | `#4c2889` | — | ❌ 缺失 |
| `--cc-cyan` | `#50e3c2` | — | ❌ 缺失 |
| `--cc-cyan-soft` | `#aaffec` | — | ❌ 缺失 |
| `--cc-cyan-deep` | `#29bc9b` | — | ❌ 缺失 |
| `--cc-highlight-pink` | `#ff0080` | — | ❌ 缺失 |
| `--cc-highlight-magenta` | `#eb367f` | — | ❌ 缺失 |

### 1.4 渐变 Token

| Token | DESIGN.md 值 | CSS 值 | 状态 |
|-------|-------------|--------|------|
| `--cc-gradient-develop-start` | `#007cf0` | `#007cf0` | ✅（仅 dark 主题） |
| `--cc-gradient-develop-end` | `#00dfd8` | `#00dfd8` | ✅（仅 dark 主题） |
| `--cc-gradient-preview-start` | `#7928ca` | `#7928ca` | ✅（仅 dark 主题） |
| `--cc-gradient-preview-end` | `#ff0080` | `#ff0080` | ✅（仅 dark 主题） |
| `--cc-gradient-ship-start` | `#ff4d4d` | `#ff4d4d` | ✅（仅 dark 主题） |
| `--cc-gradient-ship-end` | `#f9cb28` | `#f9cb28` | ✅（仅 dark 主题） |

> ⚠️ 渐变 token 仅在 `:root / [data-theme='dark']` 中定义，`[data-theme='light']` 中缺失。渐变是装饰性 token，主题切换时应保持不变，建议提升到 `:root` 独立块。

### 1.5 Selection

| Token | DESIGN.md 值 | CSS Light 值 | 状态 |
|-------|-------------|--------------|------|
| `--cc-selection-bg` | `#171717` | `#171717` | ✅ |
| `--cc-selection-fg` | `#f2f2f2` | `#f2f2f2` | ✅ |

### 1.6 CSS 额外 Token（DESIGN.md 未定义）

| Token | 值 | 备注 |
|-------|-----|------|
| `--cc-success-bg` | `rgba(0,112,243,0.1)` | 扩展 token，可保留 |
| `--cc-warning-bg` | `rgba(245,166,35,0.1)` | 扩展 token，可保留 |
| `--cc-error-bg` | `rgba(238,0,0,0.1)` | 扩展 token，可保留 |
| `--cc-info-bg` | `rgba(0,112,243,0.1)` | 扩展 token，可保留 |
| `--cc-on-primary-hairline-soft` | `rgba(0,0,0,0.12)` | 扩展 token，可保留 |

---

## 2. 排版变量完整性

### 2.1 字号变量

| Token | DESIGN.md | CSS 变量 | 状态 |
|-------|-----------|----------|------|
| display-xl | 48px | `--text-display-xl: 48px` | ✅ |
| display-lg | 32px | `--text-display-lg: 32px` | ✅ |
| display-md | 24px | `--text-display-md: 24px` | ✅ |
| display-sm | 20px | `--text-display-sm: 20px` | ✅ |
| body-lg | 18px | `--text-body-lg: 18px` | ✅ |
| body-md | 16px | `--text-body-md: 16px` | ✅ |
| body-sm | 14px | `--text-body-sm: 14px` | ✅ |
| caption | 12px | `--text-caption: 12px` | ✅ |
| code | **13px** | — | ❌ 缺失（.cc-code 使用 14px） |

### 2.2 字重变量

| Token | DESIGN.md | CSS | 状态 |
|-------|-----------|-----|------|
| weight-regular | 400 | `--weight-regular: 400` | ✅ |
| weight-medium | 500 | `--weight-medium: 500` | ✅ |
| weight-semibold | 600 | `--weight-semibold: 600` | ✅ |

### 2.3 排版工具类

| 类名 | DESIGN.md 规范 | CSS 实际 | 状态 |
|------|---------------|----------|------|
| `.cc-display-xl` | 48px/600/48px/-2.4px | 响应式（mobile→desktop 升级） | ✅ 响应式合理 |
| `.cc-display-lg` | 32px/600/40px/-1.28px | 响应式 | ✅ |
| `.cc-display-md` | 24px/600/32px/-0.96px | 响应式 | ✅ |
| `.cc-display-sm` | 20px/600/28px/-0.6px | 响应式 | ✅ |
| `.cc-body-lg` | 18px/400/28px | 18px/400/28px | ✅ |
| `.cc-body-md` | 16px/400/24px | 16px/400/24px | ✅ |
| `.cc-body-md-strong` | 16px/500/24px | 16px/500/24px | ✅ |
| `.cc-body-sm` | 14px/400/20px/-0.28px | 14px/400/20px/-0.28px | ✅ |
| `.cc-body-sm-strong` | 14px/500/20px/-0.28px | 14px/500/20px/-0.28px | ✅ |
| `.cc-caption` | 12px/400/16px | 12px/400/16px | ✅ |
| `.cc-caption-mono` | 12px/400/16px (Geist Mono) | 12px/400/16px + mono ✅ | ✅ |
| `.cc-code` | **13px**/400/20px (Geist Mono) | **14px**/400/20px | ❌ 字号偏差 |
| `.cc-button-md` | 14px/500/20px | 14px/500/20px | ✅ |
| `.cc-button-lg` | 16px/500/24px | 16px/500/24px | ✅ |

---

## 3. 间距变量完整性

| Token | DESIGN.md | CSS | 状态 |
|-------|-----------|-----|------|
| `--cc-xxs` | 4px | 4px | ✅ |
| `--cc-xs` | 8px | 8px | ✅ |
| `--cc-sm` | 12px | 12px | ✅ |
| `--cc-md` | 16px | 16px | ✅ |
| `--cc-lg` | 24px | 24px | ✅ |
| `--cc-xl` | 32px | 32px | ✅ |
| `--cc-2xl` | 40px | 40px | ✅ |
| `--cc-3xl` | 48px | 48px | ✅ |
| `--cc-4xl` | 64px | 64px | ✅ |
| `--cc-5xl` | 96px | 96px | ✅ |
| `--cc-6xl` | 128px | 128px | ✅ |
| `--cc-section` | 192px | 192px | ✅ |

**完整度: 12/12 = 100%** ✅

---

## 4. 圆角变量完整性

| Token | DESIGN.md | CSS | 状态 |
|-------|-----------|-----|------|
| `--cc-radius-none` | 0px | 0px | ✅ |
| `--cc-radius-xs` | 4px | 4px | ✅ |
| `--cc-radius-sm` | 6px | 6px | ✅ |
| `--cc-radius-md` | 8px | 8px | ✅ |
| `--cc-radius-lg` | 12px | 12px | ✅ |
| `--cc-radius-xl` | 16px | 16px | ✅ |
| `--cc-radius-pill-sm` | 64px | 64px | ✅ |
| `--cc-radius-pill` | 100px | 100px | ✅ |
| `--cc-radius-full` | 9999px | 9999px | ✅ |

**完整度: 9/9 = 100%** ✅

---

## 5. 阴影变量完整性

| Token | DESIGN.md (Light) | CSS Light | 状态 |
|-------|-------------------|-----------|------|
| `--cc-level0` | none | none | ✅ |
| `--cc-level1` | `0 0 0 1px #00000014 inset` | `0 0 0 1px rgba(0,0,0,0.08) inset` | ✅ ≈ |
| `--cc-level2` | `0px 1px 1px #00000005, 0px 2px 2px #0000000a` + inset | `0px 1px 1px rgba(0,0,0,0.03), 0px 2px 2px rgba(0,0,0,0.06)` + inset | ✅ ≈ |
| `--cc-level3` | `0px 2px 2px #0000000a, 0px 8px 8px -8px #0000000a` + inset | `0px 2px 2px rgba(0,0,0,0.06), 0px 8px 8px -8px rgba(0,0,0,0.06)` + inset | ✅ |
| `--cc-level4` | `0px 2px 2px #0000000a, 0px 8px 16px -4px #0000000a` + inset | `0px 2px 2px rgba(0,0,0,0.06), 0px 8px 16px -4px rgba(0,0,0,0.06)` + inset | ✅ |
| `--cc-level5` | `0px 1px 1px #00000005, 0px 8px 16px -4px #0000000a, 0px 24px 32px -8px #0000000f` + inset | `..., 0px 24px 32px -8px rgba(0,0,0,0.1)` + inset | ⚠️ 最后一层 0.1 vs 0.059 |

**完整度: 6/6 = 100%**（值近似匹配，`#0000000f` ≈ `rgba(0,0,0,0.059)` 被近似为 `0.1`，建议修正）

---

## 6. 组件类完整性

### 6.1 按钮

| 类名 | 存在 | 值一致性 | 问题 |
|------|------|----------|------|
| `.cc-btn-primary` | ✅ | ⚠️ | padding `0 24px`，DESIGN.md 规定 `0 12px` (`spacing.sm`) |
| `.cc-btn-primary-sm` | ✅ | ✅ | padding `0 8px` 符合 |
| `.cc-btn-secondary` | ✅ | ⚠️ | padding `0 24px`，DESIGN.md 规定 `0 12px` |
| `.cc-btn-secondary-sm` | ✅ | ✅ | padding `0 8px` 符合 |

### 6.2 卡片

| 类名 | 存在 | 值一致性 | 问题 |
|------|------|----------|------|
| `.cc-card` | ✅ | ✅ | bg canvas, radius md, padding lg |
| `.cc-card-lg` | ✅ | ✅ | bg canvas, radius lg, padding xl |
| `.cc-card-soft` | ✅ | ⚠️ | bg `canvas-soft-2`，DESIGN.md 规定 `canvas-soft` |

### 6.3 Badge / Form / Nav / Footer

| 类名 | 存在 | 值一致性 | 问题 |
|------|------|----------|------|
| `.cc-badge` | ✅ | ✅ | bg canvas-soft-2, caption, radius full |
| `.cc-form-input` | ✅ | ✅ | h40, radius sm, padding sm |
| `.cc-form-input-sm` | ✅ | ✅ | h32, radius sm |
| `.cc-navbar` | ✅ | ✅ | h64, hairline border |
| `.cc-navbar-link` | ✅ | ✅ | body color, body-sm, full radius |
| `.cc-footer` | ✅ | ✅ | padding 4xl lg |
| `.cc-footer-heading` | ✅ | ✅ | mono, caption, uppercase |
| `.cc-footer-link` | ✅ | ✅ | body color, body-sm |

---

## 7. 字体文件

| 文件 | 存在 | 状态 |
|------|------|------|
| `assets/Geist-Regular.woff2` | ✅ | ✅ |
| `assets/Geist-Medium.woff2` | ✅ | ✅ |
| `assets/Geist-SemiBold.woff2` | ✅ | ✅ |
| `assets/GeistMono-Regular.woff2` | ✅ | ✅ |
| `css/fonts.css` @font-face 声明 | ✅ 4 条 | ✅ |

**完整度: 5/5 = 100%** ✅

---

## 8. 暗色/亮色主题

| 检查项 | 状态 |
|--------|------|
| 暗色主题（默认，`:root` + `[data-theme='dark']`） | ✅ |
| 亮色主题（`[data-theme='light']`） | ✅ |

**完整度: 2/2 = 100%** ✅

---

## 修复建议（按优先级）

### P0 — 缺失 Token（影响品牌色系统完整性）

1. **添加 8 个品牌强调色 token**（两个主题均需添加）：
   ```css
   --cc-violet: #7928ca;
   --cc-violet-soft: #d8ccf1;
   --cc-violet-deep: #4c2889;
   --cc-cyan: #50e3c2;
   --cc-cyan-soft: #aaffec;
   --cc-cyan-deep: #29bc9b;
   --cc-highlight-pink: #ff0080;
   --cc-highlight-magenta: #eb367f;
   ```

2. **渐变 token 提升到 `:root` 独立块**（不应随主题切换）：
   ```css
   :root {
     --cc-gradient-develop-start: #007cf0;
     --cc-gradient-develop-end: #00dfd8;
     /* ... etc ... */
   }
   ```

### P1 — 值不一致（影响视觉还原度）

3. **亮色主题颜色修正**：
   - `--cc-body`: `#525252` → `#4d4d4d`
   - `--cc-muted`: `#a3a3a3` → `#888888`
   - `--cc-hairline`: `rgba(0,0,0,0.08)` → `#ebebeb`
   - `--cc-hairline-strong`: `rgba(0,0,0,0.15)` → `#a1a1a1`
   - `--cc-link-bg-soft`: `rgba(0,112,243,0.1)` → `#d3e5ff`
   - `--cc-error-soft`: `rgba(238,0,0,0.1)` → `#f7d4d6`
   - `--cc-warning-soft`: `rgba(245,166,35,0.1)` → `#ffefcf`

4. **排版修正**：
   - 添加 `--text-code: 13px` 变量
   - `.cc-code` 的 `font-size` 从 `var(--text-body-sm)` (14px) 改为 `var(--text-code)` (13px)

5. **按钮 padding 修正**：
   - `.cc-btn-primary` padding: `0 var(--cc-lg)` (24px) → `0 var(--cc-sm)` (12px)
   - `.cc-btn-secondary` padding: `0 var(--cc-lg)` (24px) → `0 var(--cc-sm)` (12px)

6. **卡片背景修正**：
   - `.cc-card-soft` background: `var(--cc-canvas-soft-2)` → `var(--cc-canvas-soft)`

### P2 — 微调

7. **阴影 level5 微调**：
   - 最后一层 `rgba(0,0,0,0.1)` → `rgba(0,0,0,0.06)`（匹配 `#0000000f` ≈ 0.059）

---

## 完整性评分

| 维度 | 权重 | 得分 | 加权分 |
|------|------|------|--------|
| 颜色变量 | 25% | 57% | 14.3 |
| 排版变量 | 15% | 94% | 14.1 |
| 间距变量 | 10% | 100% | 10.0 |
| 圆角变量 | 10% | 100% | 10.0 |
| 阴影变量 | 10% | 100% | 10.0 |
| 组件类 | 15% | 85% | 12.8 |
| 字体文件 | 10% | 100% | 10.0 |
| 主题系统 | 5% | 100% | 5.0 |
| **总分** | **100%** | | **86.1 / 100** |

### 结论

`@cinacoin/design-tokens` 包的 **结构框架完整**（间距、圆角、阴影、字体、主题双轨均已到位），但在 **颜色系统** 维度存在显著缺口：

- **8 个品牌强调色完全缺失**（violet/cyan/highlight 系列），这些是 DESIGN.md 品牌渐变系统的核心组成
- **亮色主题中 7 个语义色使用了 rgba 近似值**而非 DESIGN.md 规定的精确 hex 值
- **按钮 padding 偏大 1 倍**（24px vs 12px），影响营销 CTA 的视觉比例

建议优先执行 P0 修复（补全缺失 token），然后处理 P1 值对齐。
