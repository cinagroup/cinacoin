# 🔢 CINAcoin 网站审计报告

> 审计时间：2026-06-05 10:28 UTC
> 对照规范：`design-guidelines/DESIGN.md`（Vercel-Inspired Design System v alpha）
> 截图位置：`screenshots/demo-react.png`、`screenshots/health-status.png`、`screenshots/analytics-dashboard.png`

---

## 1. demo-react（https://react.cinacoin.com）

**状态：HTTP 200 ✅**

### 基本信息
| 项目 | 详情 |
|------|------|
| 页面标题 | Cinacoin Demo — Wallet Connection Toolkit |
| 背景色 | `rgb(3, 7, 18)`（深色主题） |
| 字体 | Inter, system-ui, -apple-system, sans-serif |

### 品牌 Logo
- ⚠️ **未发现独立 Logo 图片** — 仅以 🔢 emoji + "CinaConnect"/"Cinacoin" 文字标识出现在导航和页脚
- 页脚文字标注 `Cinacoin v1.0.0`

### 导航栏
- ✅ 存在，包含：Logo 🔢 → CinaConnect | Swap | Multi-Chain | Auth | **Connect Wallet**（深色按钮）
- ⚠️ **导航栏样式不符合规范**：规范中 nav-bar 应为 `{colors.canvas}` 白色背景 + 64px 高度 + 水平排列 + 右侧 CTA 簇（Ask AI / Log In / Sign Up）；当前为深色背景、内联导航

### Hero 区
- ✅ 有大标题："Connect any wallet on any chain"
- ✅ 副标题："One SDK, infinite possibilities..."
- ✅ 双 CTA 按钮："🚀 Connect Wallet"（主）+ "Try Swap Demo →"（次）
- ⚠️ **缺少 mesh gradient 背景装饰**（DESIGN.md 中 hero-band 核心特征）

### CTA 按钮
| 按钮 | border-radius | 背景色 | 文字色 | 字号/字重 | shadow | 符合规范？ |
|------|-------------|--------|--------|----------|--------|----------|
| Connect Wallet (nav) | 12px | `#171717` | `#fff` | 14px/500 | none | ❌ 规范 nav-cta 为 6px radius + 28px 高 |
| 🚀 Connect Wallet (hero) | 16px | `#171717` | `#fff` | 18px/600 | `rgba(59,130,246,0.325) 0px 0px 21.6px` | ❌ 规范 pill radius=100px，无此蓝色 glow |
| Try Swap Demo | 未见样式数据 | — | — | — | — | ❌ |

- ❌ **未使用 pill 按钮**（DESIGN.md 要求营销 CTA 使用 `{rounded.pill}` = 100px border-radius）
- ❌ **使用了蓝色发光阴影**，DESIGN.md 规定使用堆叠阴影（stacked shadows），不使用单一重阴影
- ❌ 导航 CTA 应为 6px radius (`{rounded.sm}`)，当前为 12px

### 页脚
- ✅ 存在，包含：Cinacoin v1.0.0 | Docs | GitHub | Discord | Twitter
- ✅ 版权信息 "© 2026 CinaGroup. Open source under MIT."
- ⚠️ **缺少规范要求的 footer 结构**：DESIGN.md 要求 4 列导航布局 + mono 字体 eyebrow 标签

### 其他亮点
- ✅ 统计数字展示（64 Packages, 16 Chains, 30+ Wallets, $0 Cost, 100% Open Source）
- ✅ 6 个功能卡片（Connector / Multi-Chain / SIWE / Swap / Mobile / Plug & Play）
- ✅ 16 条链 Logo 展示网格

### DESIGN.md 合规总结

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Pill 按钮（100px） | ❌ | 所有按钮使用 12-16px radius，非 pill |
| 颜色系统 | ⚠️ | 背景色 `#030712` 不在规范色板中（规范为深色主题 `#171717`） |
| 堆叠阴影 | ❌ | 使用蓝色发光 shadow，非规范堆叠阴影 |
| Typography | ⚠️ | 使用 Inter（规范允许的替代品），但字重/间距不完全匹配 |
| Mesh gradient | ❌ | 无 mesh gradient 装饰 |
| Mono 字体 | ❌ | 无技术标签使用 mono |
| Nav 结构 | ⚠️ | 存在但不符合规范布局 |
| Footer 结构 | ⚠️ | 存在但非 4 列布局 |

---

## 2. health-status（https://status.cinacoin.com）

**状态：HTTP 200 ✅**

### 基本信息
| 项目 | 详情 |
|------|------|
| 页面标题 | Cinacoin — Service Status |
| 背景色 | `rgb(250, 250, 250)` = `#fafafa` ✅ 符合 `{colors.canvas-soft}` |
| 字体 | Inter, "Inter Fallback" ✅ |

### 品牌 Logo
- ⚠️ **无独立 Logo 图片** — 仅在页面顶部以文字 "Cinacoin" 出现

### 导航栏
- ⚠️ **无正式导航栏** — 页面顶部有语言切换（EN/中文）和 Auto-refresh/Refresh 按钮，但无标准 nav-bar

### Hero 区
- ✅ 页面标题 "Cinacoin" + "Service Status"
- ✅ 语言切换和刷新控制
- ✅ "All Systems Operational" 状态横幅

### CTA 按钮
| 按钮 | border-radius | 背景色 | 文字色 | 字号/字重 | 符合规范？ |
|------|-------------|--------|--------|----------|----------|
| Auto-refresh | 100px (pill ✅) | `#171717` | `#fff` | 12px/500 | ⚠️ 字号偏小，但形状正确 |
| Refresh | 100px (pill ✅) | `#171717` | `#fff` | 12px/500 | ⚠️ 同上 |

### 服务监控卡片
- ✅ 9 个服务监控项，每个显示：
  - 名称 + 描述
  - 状态（全部 Operational）
  - 响应时间
  - 7 天 uptime（全部 100.00%）
  - 最后检查时间

### 事件记录
- ✅ 有 1 条已解决事件（5/31 DNS 配置问题），中英双语记录

### 页脚
- ✅ "Powered by Cinacoin — cinacoin.com"
- ✅ "Health checks run client-side every 5 minutes"
- ✅ 链接到 Incidents API + GitHub
- ⚠️ 结构简单，非 4 列 footer 布局

### Console 错误
- ⚠️ 3 条 `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` — 跨域资源加载问题（可能影响监控图标或图表）

### DESIGN.md 合规总结

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Pill 按钮 | ✅ | Auto-refresh/Refresh 使用 100px pill |
| 颜色系统 | ✅ | 背景 `#fafafa` = canvas-soft |
| 字体 | ✅ | Inter 为主字体 |
| 堆叠阴影 | ⚠️ | 卡片使用简单阴影，需验证堆叠结构 |
| Nav 结构 | ❌ | 无正式 nav-bar |
| Logo | ⚠️ | 仅文字标识 |
| Footer | ⚠️ | 存在但非标准 4 列布局 |

---

## 3. analytics-dashboard（https://cinacoin-analytics.pages.dev）

**状态：HTTP 404 ❌**

### 问题
- 🚨 **站点返回 HTTP 404** — 完全无法访问
- 页面标题为空
- 页面内容为空
- 无任何导航、hero、按钮或页脚元素
- 字体回退到 `"Times New Roman"`（无 CSS 加载）
- Console 错误：`Failed to load resource: the server responded with a status of 404 ()`

### 可能原因
- Cloudflare Pages 部署未完成或已失效
- DNS CNAME 记录缺失（与 status.cinacoin.com 5/31 DNS 事件类似）
- Pages 自定义域名未配置

---

## 📋 总体结论

### 优先级 P0 — 需立即修复
1. **analytics-dashboard (404)** — 站点不可用，需检查 Cloudflare Pages 部署和 DNS 配置

### 优先级 P1 — 品牌一致性缺失
2. **demo-react 未使用 pill 按钮** — 所有 CTA 使用 12-16px 圆角，DESIGN.md 要求营销 CTA 使用 100px pill radius
3. **demo-react 使用蓝色发光阴影** — 应替换为规范中的堆叠阴影（stacked shadows）
4. **无 mesh gradient 装饰** — hero-band 缺少多色网格渐变背景
5. **站点均无独立 Logo 图片** — 仅用 emoji/文字标识

### 优先级 P2 — 结构改进
6. **导航栏不统一** — demo-react 有深色内联导航，status 无正式导航
7. **页脚结构不标准** — 均为简单文字链接，缺少 4 列布局
8. **技术标签未使用 mono 字体** — DESIGN.md 要求 eyebrow 标签使用 Geist Mono
9. **demo-react 背景色偏离规范** — 使用 `#030712` 而非规范深色 `#171717`

### 积极发现
- ✅ health-status 背景色 `#fafafa` 精确匹配 canvas-soft
- ✅ 所有站点使用 Inter 字体（规范允许的替代字体）
- ✅ health-status 的 Auto-refresh/Refresh 按钮正确使用了 pill 形状
- ✅ 内容结构清晰，功能完整
