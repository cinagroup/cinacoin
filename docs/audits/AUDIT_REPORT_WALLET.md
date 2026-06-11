# 审计报告：wallet-explorer (wallet.cinacoin.com)

**审计日期:** 2026-06-08  
**应用路径:** `/home/cina/.openclaw/workspace/onux/apps/wallet-explorer`

---

## 1. 全局样式 (src/app/globals.css)

| 检查项                 | 状态    | 说明                                                                                                               |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| CSS 变量定义设计 token | ✅ 通过 | 完整定义了 `--vercel-*` 前缀的设计 token 系统                                                                      |
| 背景色 #fafafa         | ✅ 通过 | `--vercel-canvas-soft: #fafafa`，body 使用 `background: var(--vercel-canvas-soft)`                                 |
| 字体栈 Geist/Inter     | ⚠️ 部分 | CSS 定义 `'Geist', 'Inter', system-ui...`，但实际加载的是 Google Fonts `Inter`（layout.tsx），**Geist 字体未加载** |

## 2. 色彩合规

| 检查项                    | 状态    | 说明                                                 |
| ------------------------- | ------- | ---------------------------------------------------- |
| 主色 #171717 (ink)        | ✅ 通过 | `--vercel-primary: #171717`、`--vercel-ink: #171717` |
| 文字色 #4d4d4d (body)     | ✅ 通过 | `--vercel-body: #4d4d4d`                             |
| 文字色 #888888 (mute)     | ✅ 通过 | `--vercel-mute: #888888`                             |
| 边框色 #ebebeb (hairline) | ✅ 通过 | `--vercel-hairline: #ebebeb`                         |
| 成功色 #0070f3            | ✅ 通过 | `--vercel-success: #0070f3`                          |
| 错误色 #ee0000            | ✅ 通过 | `--vercel-error: #ee0000`                            |
| 警告色 #f5a623            | ✅ 通过 | `--vercel-warning: #f5a623`                          |

## 3. 字体合规

| 检查项                     | 状态    | 说明                                                                             |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| Display 字体 weight 600    | ✅ 通过 | `.vercel-display-xl/lg/md` 均设置 `font-weight: 600`                             |
| 负字间距正确               | ✅ 通过 | xl: -2.4px, lg: -1.28px, md: -0.96px（比例正确）                                 |
| 等宽字体用于地址/hash/余额 | ✅ 通过 | `.vercel-mono`、`.vercel-code`、`.vercel-caption-mono` 使用 `--vercel-font-mono` |

## 4. 组件合规

| 检查项                     | 状态    | 说明                                                                                |
| -------------------------- | ------- | ----------------------------------------------------------------------------------- |
| 按钮圆角 6px               | ✅ 通过 | `--vercel-radius-sm: 6px`，`.vercel-btn-primary/secondary` 使用此值                 |
| 卡片圆角 8px               | ✅ 通过 | `--vercel-radius-md: 8px`，`.vercel-card` 使用此值                                  |
| 卡片阴影：堆叠阴影         | ✅ 通过 | `--vercel-shadow-1/2/3` 均为三层堆叠阴影（含 inset border）                         |
| 输入框 6px 圆角，40px 高度 | ✅ 通过 | `.vercel-input` 使用 `border-radius: var(--vercel-radius-sm)` (6px)，`height: 40px` |
| 状态徽章 pill 形状         | ✅ 通过 | `.vercel-badge` 使用 `border-radius: 9999px`（pill 形状）                           |

## 5. Logo

| 检查项                  | 状态      | 说明                                                                       |
| ----------------------- | --------- | -------------------------------------------------------------------------- |
| 使用 /logo.png          | ✅ 通过   | Header 和 Footer 均使用 `<img src="/logo.png">`                            |
| 不使用 logo.svg         | ⚠️ 存在   | `public/logo.svg` 仍然存在（未在代码中引用，仅残留文件）                   |
| metadata icons 使用 svg | ⚠️ 不通过 | `layout.tsx` 中 `icons: { icon: "/wallets/logo.svg" }` 引用了 svg 而非 png |

## 6. 布局

| 检查项           | 状态    | 说明                                                                             |
| ---------------- | ------- | -------------------------------------------------------------------------------- |
| Header 高度 64px | ✅ 通过 | `.vercel-header` 设置 `height: 64px`                                             |
| 搜索框样式       | ✅ 通过 | Header 内搜索框使用 `.vercel-input`，高度 36px（略小于标准 40px，header 内合理） |

---

## 总结

**整体合规度：高**

### 主要问题

1. **Geist 字体未实际加载** — CSS 字体栈声明了 Geist 优先，但 layout.tsx 仅加载了 Google Fonts Inter，Geist 不在 Google Fonts 中
2. **logo.svg 残留** — public 目录中仍存在 logo.svg
3. **metadata icon 引用 svg** — `layout.tsx` 中 `icons.icon` 指向 `/wallets/logo.svg` 而非 `/logo.png`

### 次要问题

- Header 搜索框高度 36px（规范要求 40px），但在 header 上下文中可接受
- Tailwind config 中重复定义了 CSS 变量已有的 token（颜色、圆角等），存在维护风险

### 建议

- 加载 Geist 字体（通过 `next/font` 本地字体或 CDN）替代 Inter，或从字体栈中移除 Geist
- 修复 metadata icons 为 `/logo.png`
- 清理 `public/logo.svg` 残留文件
- 考虑统一 Tailwind config 与 CSS 变量的 token 来源
