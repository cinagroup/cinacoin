# 🔢 Cinacoin 网站审计报告
**日期:** 2026-06-05 10:16 UTC
**审核人:** 000 (CINAcoin 零号助理)

---

## 1️⃣ cinacoin.com（主站）

### 基本信息
| 项目 | 状态 |
|------|------|
| 框架 | Next.js (App Router) |
| 标题 | Cinacoin — Onchain Access, Simplified |
| SEO | ✅ 完整 (OG, Twitter Card, canonical, robots) |
| 响应式 | ✅ 支持 (移动端汉堡菜单) |
| 深色模式 | ✅ 支持 (暗/亮主题切换) |

### 页面结构

#### 🎨 Brand Logo
- ✅ Logo 存在 (`/logo.png`, 32x32px, rounded-lg)
- ✅ 导航栏左侧固定，带品牌名 "Cinacoin"
- ✅ Footer 有品牌标识

#### 🧭 Navigation（导航）
- ✅ 固定顶部导航栏 (sticky, z-50, 带底部边框)
- ✅ 导航链接: Products, Pricing, Docs, GitHub
- ✅ Dashboard 链接 (dash.cinacoin.com)
- ✅ 暗/亮模式切换按钮
- ✅ 语言选择器 (EN)
- ✅ 移动端汉堡菜单
- ⚠️ **严重问题：导航文本未国际化！** 显示为 `nav-products`、`nav-pricing`、`nav-docs` 等 i18n key，而非实际翻译文本

#### 🦸 Hero Section
- ✅ Mesh gradient 背景动画
- ✅ Badge（状态点 + `hero-badge` 文字）
- ✅ 主标题 `hero-title`（最大宽度 3xl）
- ✅ 副标题 `hero-subtitle`
- ✅ CTA 按钮: "hero-start" → docs.cinacoin.com, "hero-github" → GitHub
- ✅ 代码预览块 (`@cinacoin/react` 示例代码)
- ❌ **严重问题：所有 Hero 文案均为 i18n key 占位符**（`hero-title`, `hero-subtitle`, `hero-badge`, `hero-start`, `hero-github`）

#### 📦 Features Section（功能卡片）
- ✅ 6 张卡片，emoji 图标 (🔗🌐🔐🔔⚡🛡️)
- ✅ 响应式网格 (md:2列, lg:3列)
- ✅ 卡片样式: `cc-card` class
- ❌ **严重问题：所有文案均为 i18n key**（`f1-title`, `f1-desc`, `f2-title` 等）

#### 📊 Stats Section（数据统计）
- ✅ 4 组数据: 16 / 52 / 5 / 100%
- ❌ 标签均为 i18n key（`s1-label` 至 `s4-label`）

#### 🛠️ Products Section
- ✅ 6 个产品卡片: AppKit, Auth, Relay, Push, Keys, RPC Proxy
- ✅ 每个卡片有渐变色图标
- ✅ 链接到 docs.cinacoin.com 对应 API 文档
- ⚠️ 部分文案为 i18n key（`products-title`, `products-subtitle`, `learn-more`）
- ⚠️ 描述文案复用 `f1-desc`、`f3-desc`、`f5-desc` 等（描述重复）

#### 👨‍💻 Developers Section
- ✅ 双栏布局 (文字 + 代码示例)
- ✅ 4 个特性检查项 (✓ 标记)
- ✅ 代码块 (`example.tsx`)
- ❌ 文案为 i18n key（`dev-label`, `dev-title`, `dev-subtitle`, `d1`-`d4`）

#### 📣 CTA Section
- ✅ 深色背景 + mesh gradient
- ✅ 标题 + 副标题 + 双按钮
- ❌ 文案为 i18n key（`cta-title`, `cta-subtitle`, `cta-start`, `cta-github`）

#### 🦶 Footer
- ✅ 5 列布局: Brand, Products, Developers, Company, Legal
- ✅ 社交媒体链接: X (Twitter), GitHub, Discord
- ✅ 版权信息: © 2026 Cinacoin
- ⚠️ 大量 i18n key 未翻译

---

## 2️⃣ demo.cinacoin.com（演示应用）

### 基本信息
| 项目 | 状态 |
|------|------|
| 框架 | Next.js (App Router) |
| 标题 | Cinacoin — Wallet Connection Toolkit |
| SEO | ✅ 完整 |
| 版本 | v0.1.0 — Open Source |
| GitHub Stars | 200+ |

### 页面结构

#### 🎨 Brand Logo
- ✅ Logo 存在 (`/logo.png`, 32x32px, rounded-md)
- ✅ 导航栏左侧固定

#### 🧭 Navigation
- ✅ 丰富的导航: Home, Swap, Tokens, Multi-Chain, Batch, AA Demo, Onramp, Auth, Activity, Profile, Settings
- ✅ 当前页面高亮 (Home 为激活状态)
- ✅ 暗/亮模式切换
- ✅ 语言选择器 (EN)
- ✅ 移动端汉堡菜单
- ✅ **文案全部为实际文本，无 i18n key 问题**

#### 🦸 Hero Section
- ✅ 渐变标题 "Cinacoin" (brand-400 → brand-500 → brand-300)
- ✅ 副标题: "The open-source wallet connection toolkit"
- ✅ 版本徽章 + GitHub stars
- ✅ 粒子动画背景
- ✅ 三个 CTA 按钮:
  - 🔵 "Connect Wallet" (主按钮, rounded-[100px])
  - "Try Swap Demo →" (次按钮)
  - "Multi-Chain →" (次按钮)
- ✅ **按钮为药丸样式 (pill buttons)**

#### 💼 Wallet Panel（钱包连接面板）
- ✅ 模拟终端风格的窗口设计
- ✅ macOS 风格红黄绿圆点
- ✅ 状态指示器 (Idle)
- ✅ "No wallet extension detected" 提示
- ✅ "Get MetaMask →" 按钮
- ⚡ 连接钱包按钮 (disabled 状态, 需要钱包扩展)
- ✅ 网络选择下拉 (默认 Ethereum)
- ✅ 状态面板: Status / Network / Balance
- ⚠️ 未连接钱包时连接按钮为 disabled

#### 📡 Infrastructure Monitor
- ✅ Cloudflare Workers 边缘节点监控面板
- ✅ 扫描线动画效果
- ✅ 显示 0/5 Workers Online
- ✅ 骨架屏加载动画 (5 个 worker 行)
- ⚠️ 所有 worker 数据未加载 (骨架屏状态)

#### 📊 Stats Section
- ✅ 5 组数据: 64 Packages / 16 Chains / 30+ Wallets / $0 Cost / 100% Open Source
- ✅ 渐变色数字

#### 🛠️ Features Grid（9 个功能卡片）
1. 🔗 Multi-Chain — 16 chains
2. 🔐 SIWE Auth — Sign-In With Ethereum
3. 🔄 Swap — DEX Aggregation
4. 🌉 Bridge — Cross-Chain
5. 🧠 Smart Accounts — AA v5 / ERC-4337
6. ⛽ Gas Sponsorship
7. 🔑 Passkey Auth — WebAuthn
8. 📱 Multi-Platform
9. 🏠 Self-Hosted
- ✅ 卡片 hover 效果 (上浮 + 渐变边框)

#### 🔗 Supported Chains
- ✅ 16 条链: Ethereum, Polygon, Arbitrum, Base, Optimism, BNB Chain, Avalanche, Solana, Bitcoin, TON, TRON, Cosmos, Sui, Starknet, NEAR, Hedera
- ✅ 每条链有品牌色圆形图标

#### 🦶 Footer
- ✅ MIT License 声明
- ✅ Swap, Multi-Chain 链接
- ✅ GitHub 链接 (指向 cinaseek/cinacoin)
- ✅ 滚动回顶部按钮

---

## 🎨 DESIGN.md 合规检查

### ✅ 符合项
| 设计元素 | 主站 | Demo站 |
|----------|------|--------|
| CSS 变量系统 (`--cc-*`) | ✅ | ✅ |
| 药丸按钮 (rounded-full/100px) | ✅ (部分) | ✅ |
| 卡片阴影 (`cc-card`) | ✅ | ✅ (自定义 shadow) |
| 暗色/亮色主题 | ✅ | ✅ |
| 响应式设计 | ✅ | ✅ |
| 渐变背景 (mesh gradient) | ✅ | ✅ |
| 入场动画 (fade-in + slide-up) | ✅ | ✅ |
| 品牌色系统 (`--cc-primary`) | ✅ | ✅ |
| 圆角系统 (`--cc-radius-*`) | ✅ | ✅ |

### ⚠️ 问题项
| 问题 | 严重度 | 说明 |
|------|--------|------|
| **i18n key 未翻译** | 🔴 严重 | 主站所有文案显示为占位符 key (如 `hero-title`, `nav-products`)，未渲染实际文本 |
| **产品描述重复** | 🟡 中等 | AppKit/Relay 等产品的描述复用了 `f1-desc`、`f3-desc` 等相同 key |
| **Demo 站 GitHub 链接不一致** | 🟡 中等 | 主站指向 `github.com/cinagroup`，Demo 站指向 `github.com/cinaseek` |
| **OG 描述不一致** | 🟢 轻微 | 主站 meta 说 "16 blockchains"，OG tag 说 "100+ blockchains" |
| **按钮阴影** | ✅ 正常 | Demo 站按钮使用 inline style box-shadow，符合设计规范 |

---

## 📸 截图证据

截图已保存至 workspace:
- `audit-cinacoin-home.png` — cinacoin.com 首页
- `audit-cinacoin-demo.png` — demo.cinacoin.com 首页

> ⚠️ 注：由于图片分析模型不可用（token 过期/配额限制），无法附加截图视觉分析。但 HTML 源码审计已覆盖所有可见元素。

---

## 📋 总结与建议

### 🔴 必须修复（阻塞发布）
1. **主站 i18n 翻译缺失** — 所有文本内容显示为 key 占位符，用户无法理解页面内容。需要检查 i18n 配置和翻译文件是否正确加载。

### 🟡 建议修复
2. **产品描述去重** — 为每个产品编写独立的描述文案，而非复用 key
3. **统一 GitHub 链接** — 确认 `cinagroup` vs `cinaseek` 哪个是正确组织
4. **统一区块链数量** — meta description 说 16 条，OG description 说 100+ 条

### 🟢 可选改进
5. Demo 站 Infrastructure Monitor 需要实际数据接入（当前为骨架屏）
6. 考虑为主站添加 `/about`、`/pricing`、`/contact` 等页面内容（当前仅有路由链接）
