# 审计报告：health-status (status.cinacoin.com)

**审计日期:** 2026-06-08  
**应用路径:** `/home/cina/.openclaw/workspace/onux/apps/health-status`

---

## 1. 全局样式 (src/app/globals.css)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| CSS 变量定义设计 token | ⚠️ 部分 | 定义了 status 颜色变量，但核心 token 依赖 `@import "@cinacoin/design-tokens/css/cinacoin.css"`（`cc-*` 前缀变量），自身仅定义 status 相关覆盖 |
| 背景色 #fafafa | ✅ 通过 | `bg-[var(--cc-canvas-soft)]` 在页面根元素使用；cinacoin.css 中 `--cc-canvas-soft` 应为 `#fafafa` |
| 字体栈 Geist/Inter | ⚠️ 部分 | cinacoin.css body 声明 `font-family: Geist, var(--font-inter), Inter, system-ui...`，但 layout.tsx 仅通过 Google Fonts 加载了 Inter 和 JetBrains Mono，**Geist 字体未实际加载**（会 fallback 到 Inter） |

## 2. 色彩合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 主色 #171717 (ink) | ✅ 通过 | cinacoin.css 确认 `--cc-ink: #171717` |
| 文字色 #4d4d4d (body) | ✅ 通过 | cinacoin.css 确认 `--cc-body: #4d4d4d` |
| 文字色 #888888 (mute) | ✅ 通过 | cinacoin.css 确认 `--cc-muted: #888888` |
| 边框色 #ebebeb (hairline) | ✅ 通过 | cinacoin.css 确认 `--cc-hairline: #ebebeb` |
| 成功色 #0070f3 | ✅ 通过 | cinacoin.css 确认 `--cc-success: #0070f3`（注：status 页面额外定义了 `--status-operational: #00c853` 用于状态指示，属于语义化扩展） |
| 错误色 #ee0000 | ✅ 通过 | `--status-down: #ee0000` |
| 警告色 #f5a623 | ✅ 通过 | `--status-degraded: #f5a623` |

## 3. 字体合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Display 字体 weight 600 | ✅ 通过 | cinacoin.css 确认所有 `.cc-display-*` 均为 `font-weight: 600` |
| 负字间距正确 | ✅ 通过 | xl: -2.4px, lg: -1.1px, md: -0.8px, sm: -0.4px（比例正确） |
| 等宽字体用于地址/hash/余额 | ✅ 通过 | `cc-code` 和 `cc-caption-mono` 类用于 response time、uptime 等技术数据 |

## 4. 组件合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 按钮圆角 6px | ❌ 不通过 | cinacoin.css 中 `.cc-btn-primary` 等使用 `border-radius: var(--cc-radius-pill)`（pill 形状 = 100px），**不是 6px**。`--cc-radius-sm: 6px` 存在但按钮未使用 |
| 卡片圆角 8px | ✅ 通过 | cinacoin.css 确认 `.cc-card` 使用 `border-radius: var(--cc-radius-md)` = 8px |
| 卡片阴影：堆叠阴影 | ✅ 通过 | `.cc-card` 使用 `var(--cc-level2)` 堆叠阴影（3 层），hover 升级为 `var(--cc-level3)` |
| 输入框 6px 圆角，40px 高度 | ✅ 通过 | `.cc-form-input` 确认 `border-radius: var(--cc-radius-sm)` = 6px, `height: 40px` |
| 状态徽章 pill 形状 | ✅ 通过 | `cc-badge` 类 + inline-flex，status badge 使用 pill 样式 |

## 5. Logo

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 使用 /logo.png | ✅ 通过 | Header 和 Footer 均使用 `<img src="/logo.png">` |
| 不使用 logo.svg | ⚠️ 存在 | `public/logo.svg` 仍然存在（但未在代码中引用，仅残留文件） |

## 6. 布局

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Header 高度 64px | ✅ 通过 | `h-16`（= 64px）在 header 元素上 |
| 搜索框样式 | N/A | 状态页无搜索框 |

---

## 总结

**整体合规度：中等**

### 主要问题
1. **Geist 字体未加载** — cinacoin.css 声明了 Geist 优先字体栈，但 layout.tsx 仅加载了 Google Fonts Inter，Geist 不在 Google Fonts 中，会 fallback 到 Inter
2. **按钮圆角不合规** — `cc-btn-primary/secondary` 使用 pill 形状（`--cc-radius-pill: 100px`），规范要求 6px 圆角。`--cc-radius-sm: 6px` 存在但按钮未引用
3. **logo.svg 残留** — public 目录中仍存在 logo.svg 文件（虽然代码未引用）

### 建议
- 加载 Geist 字体（通过 `next/font/local` 或 CDN），或从字体栈中移除 Geist
- 将按钮 `border-radius` 改为 `var(--cc-radius-sm)` (6px)，或确认 pill 形状是有意为之的设计决策
- 清理 `public/logo.svg` 残留文件
