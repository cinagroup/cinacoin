# Cinacoin Demo — Vercel 设计系统合规审计报告

**审计日期:** 2026-06-08  
**项目路径:** `/home/cina/.openclaw/workspace/onux/apps/demo`  
**设计系统源:** `packages/design-tokens/css/cinacoin.css`

---

## 1. 全局样式 (`src/app/globals.css`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CSS 变量定义设计 token | ✅ 通过 | 通过 `@import "@cinacoin/design-tokens/css/cinacoin.css"` 引入完整 token 体系，并在 `:root` 中追加 `--ds-*` 局部变量 |
| 背景色 `#fafafa` | ✅ 通过 | `body { background-color: #fafafa; }` 明确声明；`--cc-canvas-soft: #fafafa` 一致 |
| 字体栈 Geist / Inter | ⚠️ 部分通过 | `globals.css` 声明 `--ds-font-sans: 'Geist', 'Inter', ...`，但 `layout.tsx` 实际加载的是 **Google Fonts Inter + JetBrains Mono**，**未加载 Geist 字体**。Geist 仅存在于 CSS 声明中，运行时 fallback 到 Inter |

### 建议
- 如需严格使用 Geist，应在 `layout.tsx` 中用 `next/font/local` 加载 Geist 字体文件，或改用 `@vercel/geist` 包。
- 当前 Inter 作为 fallback 实际渲染，视觉差异极小，但与"Geist 优先"的声明不一致。

---

## 2. 色彩合规

| Token | 期望值 | 实际值 | 状态 |
|-------|--------|--------|------|
| `--cc-primary` (主色/ink) | `#171717` | `#171717` | ✅ |
| `--cc-ink` | `#171717` | `#171717` | ✅ |
| `--cc-body` (正文色) | `#4d4d4d` | `#4d4d4d` | ✅ |
| `--cc-muted` (弱化色) | `#888888` | `#888888` | ✅ |
| `--cc-hairline` (边框色) | `#ebebeb` | `#ebebeb` | ✅ |
| `--cc-canvas-soft` (背景) | `#fafafa` | `#fafafa` | ✅ |

**结论:** 所有色彩 token 完全合规。Dark mode 亦有完整对应。

---

## 3. 字体合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Display 字体 weight 600 | ✅ 通过 | `.cc-display-xl/lg/md/sm` 均使用 `font-weight: 600` |
| 负字间距 (letter-spacing) | ✅ 通过 | Display 各级均设置正确负字间距（如 XL: -1.28px → -2.4px 响应式） |
| 等宽字体用于地址/hash | ✅ 通过 | `--font-mono` 定义完整；`.cc-code`, `.cc-caption-mono` 使用 mono 字体栈 |
| Body 字间距 | ✅ 通过 | `.cc-body-sm/strong` 使用 `-0.28px`，符合 Vercel 规范 |

---

## 4. 组件合规

### 4.1 按钮 (`src/components/Button.tsx`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 圆角 6px (应用级) | ✅ 通过 | 所有 size 均使用 `rounded-[6px]` |
| 高度 | ✅ 通过 | sm: 32px, md: 40px, lg: 48px |
| 最小触摸目标 | ✅ 通过 | sm/md 设置 `min-h-[44px]`，符合 WCAG |

### 4.2 卡片 (`src/components/Card.tsx`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 圆角 8px | ✅ 通过 | `rounded-[8px]` |
| 堆叠阴影 | ✅ 通过 | 使用多层阴影：`0px 1px 1px rgba(0,0,0,0.03), 0px 2px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08) inset` |
| Hover 阴影提升 | ✅ 通过 | hover 时升级到 level3 阴影 |

### 4.3 输入框 (`cinacoin.css` `.cc-form-input`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 圆角 6px | ✅ 通过 | `border-radius: var(--cc-radius-sm)` = 6px |
| 高度 40px | ✅ 通过 | `height: 40px` |
| Focus 样式 | ✅ 通过 | border-color 变 link 色 + 3px box-shadow ring |

### 4.4 TokenInput (`src/components/TokenInput.tsx`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 圆角 6px | ✅ 通过 | `rounded-[6px]` |
| Select 高度 40px | ✅ 通过 | `h-[40px]` |

---

## 5. Logo

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 使用 logo.png（非 logo.svg） | ✅ 通过 | 引用 `/demo/logo.png`，由于 `next.config.ts` 配置 `basePath: '/demo'`，实际解析到 `public/logo.png` (256×256 PNG) ✅ |

### 详情
- `public/logo.png` ✅ 存在 (256×256 PNG)
- `public/demo/logo.svg` 存在但未被引用（仅作为备用）
- `next.config.ts` 中 `basePath: '/demo'` + `assetPrefix: '/demo'`，因此 `public/logo.png` 在运行时通过 `/demo/logo.png` 正确访问

**引用位置:**
- `src/components/Header.tsx:72` → `src="/demo/logo.png"` ✅
- `src/components/DemoLayout.tsx:39` → `src="/demo/logo.png"` ✅
- `src/components/DemoLayout.tsx:77` → `src="/demo/logo.png"` ✅

---

## 6. 布局

### 6.1 Header 高度

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Header 高度 64px | ✅ 通过 | `Header.tsx` 使用 `h-16` (= 64px) |
| Sidebar logo 区域 | ✅ 通过 | `DemoLayout.tsx` sidebar 顶部 `h-16` (= 64px) |
| 移动端顶栏 | ⚠️ 注意 | `DemoLayout.tsx` 移动端使用 `h-14` (= 56px)，非 64px。移动端可接受，但与桌面端不一致 |

### 6.2 侧边栏导航 (`src/components/DemoLayout.tsx`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 侧边栏存在 | ✅ 通过 | 桌面端 `w-[200px]` 固定侧边栏 |
| 导航项样式 | ✅ 通过 | 14px/400/20px/-0.28px，active 状态有 3px 指示条 |
| Active 指示器 | ✅ 通过 | 左侧 3px `bg-[var(--cc-ink)] rounded-r-full` 竖条 |
| 圆角 6px | ✅ 通过 | 导航项 `rounded-[6px]` |
| Sticky 定位 | ✅ 通过 | `h-screen sticky top-0` |
| 移动端抽屉 | ✅ 通过 | 240px 宽 overlay 抽屉，带遮罩 |

---

## 总结

### 合规率

| 类别 | 通过 | 警告 | 不合规 |
|------|------|------|--------|
| 全局样式 | 2 | 1 | 0 |
| 色彩 | 6 | 0 | 0 |
| 字体 | 4 | 0 | 0 |
| 组件 | 10 | 0 | 0 |
| Logo | 1 | 0 | 0 |
| 布局 | 7 | 1 | 0 |
| **合计** | **30** | **2** | **0** |

### 建议改进 (Advisory)

1. **Geist 字体未加载** — CSS 声明 Geist 为第一字体，但实际未加载。当前 fallback 到 Inter 视觉差异极小，但声明与实现不一致。建议用 `next/font/local` 加载 Geist 或修改 CSS 声明以 Inter 为首选。

2. **移动端顶栏高度** — 移动端 `h-14` (56px) 与桌面端 `h-16` (64px) 不一致。如设计规范要求统一 64px 则需调整。

---

*审计完成。30/32 项通过，2 项警告，0 项不合规。*
