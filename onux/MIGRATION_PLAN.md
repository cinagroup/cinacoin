# Cinacoin 前端 React 统一迁移计划

> **目标**：将所有 Cinacoin **自有前端应用**统一为 React/Next.js 技术栈  
> **范围**：3 个 Web 前端 + 1 个移动端 → React 生态  
> **排除**：SDK/适配器包（vue, angular, svelte, nuxt, flutter, ios, android, unity, dotnet）——这些是给开发者用的框架适配层，必须保留

---

## 📊 当前状态

### 已是 React（9/13 ✅）
| 应用 | 框架 | 部署 |
|------|------|------|
| website | Next.js 15 + React 19 | cloudflare pages |
| demo | Next.js 15 + React 19 | cloudflare pages |
| demo-react | React 18 + Vite | cloudflare pages |
| demo-dapp-react | Next.js 14 + React 18 | cloudflare pages |
| backend-dashboard | Next.js 15 + React 19 | cloudflare pages |
| cloud-dashboard | Next.js 15 + React 19 | cloudflare pages |
| health-status | Next.js 15 + React 19 | cloudflare pages |
| wallet-explorer | Next.js 15 + React 19 | cloudflare pages |
| analytics-dashboard | Next.js 15 + React 19 | cloudflare pages |

### 需迁移（4 个）
| 应用 | 当前框架 | 规模 | 复杂度 |
|------|---------|------|--------|
| **demo-vue** | Vue 3 + Vite | 8 .vue 文件 | 🟢 低 |
| **demo-flutter** | Flutter/Dart | 9 .dart 文件 | 🟡 中 |
| **docs-site** | VitePress (Vue) | ~40 .md 文档 | 🟢 低 |
| **docs-site 主题** | VitePress Vue 主题 | 自定义 CSS | 🟢 低 |

---

## 🎯 阶段 1：demo-vue → React（预计 1-2 天）

### 1.1 现有功能分析

demo-vue 当前 8 个组件：
```
App.vue                    → 主布局
├── AppHeader.vue          → 顶部导航栏
├── ConnectWallet.vue      → 钱包连接
├── ConnectedFeatures.vue  → 连接后功能菜单
├── SignMessage.vue        → 消息签名
├── SendTransaction.vue    → 发送交易
├── AccountBalance.vue     → 账户余额
└── ChainInfo.vue          → 链信息
```

功能：展示 @cinacoin/vue SDK 的连接钱包、签名、转账等基础能力。  
与 `apps/demo`（Next.js）功能高度重叠，可考虑直接复用 demo 的页面结构。

### 1.2 迁移方案

**方案 A（推荐）：合并到现有 `apps/demo`**
- demo-vue 的功能在 `apps/demo` 中已有 React 实现
- 在 demo 中添加 `/vue-demo` 路由作为对比展示（可选）
- 删除 `apps/demo-vue` 目录
- **优势**：零新代码，只需清理和 DNS 重定向
- **工作量**：0.5 天

**方案 B：独立迁移为 React + Vite**
- 新建 `apps/demo-react-vue`（或直接用 `apps/demo-vue` 重写）
- 将 8 个 .vue 文件逐个翻译为 .tsx
- 使用 `@cinacoin/react` 替代 `@cinacoin/vue`
- 部署到 cloudflare pages
- **工作量**：1-2 天

### 1.3 执行步骤（方案 A）
```bash
# 1. 确认 demo 已覆盖所有 demo-vue 功能
# 2. 在 demo 的 next.config.ts 中添加 redirect:
#    { source: '/vue-demo', destination: '/', permanent: false }
# 3. 删除 apps/demo-vue
# 4. 更新 pnpm-workspace.yaml
# 5. 更新 wrangler.toml 和 CI
# 6. 在 Cloudflare Pages 设置 demo-vue → demo 的 redirect
# 7. 部署验证
```

---

## 🎯 阶段 2：demo-flutter → React Native / 响应式 Web（预计 3-5 天）

### 2.1 现有功能分析

demo-flutter 当前 9 个文件：
```
main.dart                  → 入口
├── screens/
│   ├── home_screen.dart       → 主页
│   ├── connect_screen.dart    → 连接钱包
│   ├── chain_screen.dart      → 链选择
│   ├── sign_screen.dart       → 签名
│   └── transaction_screen.dart → 交易
└── widgets/
    ├── wallet_tile.dart       → 钱包列表项
    ├── info_row.dart          → 信息行
    └── status_card.dart       → 状态卡片
```

功能：移动端钱包连接 Demo，展示 Flutter SDK。

### 2.2 迁移方案

**方案 A（推荐）：响应式 Web 版**
- 将功能整合到 `apps/demo`（已是 Next.js）
- 利用 Tailwind 响应式设计，确保移动端体验
- 删除 `apps/demo-flutter`（保留 `packages/flutter-dart` SDK）
- **优势**：维护一个代码库，无需 React Native 额外依赖
- **工作量**：2-3 天（优化移动端 UI + PWA 支持）

**方案 B：React Native 独立应用**
- 新建 `apps/demo-react-native`
- 使用 Expo 快速搭建
- 需要独立构建和发布流程
- **工作量**：3-5 天

### 2.3 执行步骤（方案 A）
```bash
# 1. 审计 apps/demo 的移动端适配情况
# 2. 添加 PWA 支持（manifest.json + service worker）
# 3. 优化移动端触摸交互和布局
# 4. 添加 "移动端优先" 的 Demo 模式（隐藏桌面专属功能）
# 5. 测试 iOS/Android 浏览器
# 6. 删除 apps/demo-flutter
# 7. 更新文档和 CI
```

---

## 🎯 阶段 3：docs-site → Docusaurus / Next.js MDX（预计 2-3 天）

### 3.1 现有内容分析

docs-site 当前结构：
```
docs/
├── index.md                 → 首页
├── guide/                   → 指南（6 篇）
│   ├── quick-start.md
│   ├── installation.md
│   ├── configuration.md
│   ├── troubleshooting.md
│   └── migrate-from-reown.md
├── api/                     → API 文档（~30 篇）
│   ├── analytics.md
│   ├── config.md
│   ├── multiwallet.md
│   ├── ...
├── framework/               → 框架适配文档
├── zh/                      → 中文文档
└── public/                  → 静态资源
```

### 3.2 迁移方案

**方案 A（推荐）：Docusaurus 3**
- Facebook 开源的 React 文档框架
- 原生支持 MDX、版本管理、国际化
- 与 VitePress 功能对等，学习成本低
- 主题可通过 `@docusaurus/theme-classic` 定制
- **工作量**：2-3 天

**方案 B：Next.js + MDX**
- 完全复用现有 Next.js 基础设施
- 共享 `@cinacoin/ui` 的 SiteHeader/SiteFooter
- 需要手动实现文档特性（搜索、侧边栏、版本管理）
- **工作量**：3-5 天

### 3.3 执行步骤（方案 A）
```bash
# 1. 初始化 Docusaurus
npx create-docusaurus@latest apps/docs-site classic --typescript

# 2. 迁移文档内容（Markdown 文件可直接复制）
cp -r docs-site/docs/* apps/docs-site/docs/

# 3. 迁移自定义 CSS/主题
#    VitePress theme custom.css → Docusaurus src/css/custom.css

# 4. 配置侧边栏（docusaurus.config.js sidebar 配置）
#    将 docs/ 目录结构映射为 sidebarItems

# 5. 配置国际化（zh 目录）
#    i18n: { defaultLocale: 'en', locales: ['en', 'zh'] }

# 6. 更新 wrangler.toml（静态输出目录）
#    output_directory: apps/docs-site/build

# 7. 更新 CI（.github/workflows/deploy-docs.yml）
#    构建命令: cd apps/docs-site && npm run build
#    输出目录: build/

# 8. 部署到 Cloudflare Pages
wrangler pages deploy apps/docs-site/build --project-name=cinacoin-docs

# 9. 验证 docs.cinacoin.com 访问
# 10. 删除旧 docs-site（Vue/VitePress）
```

---

## 📅 总时间表

| 阶段 | 任务 | 工作量 | 优先级 | 依赖 |
|------|------|--------|--------|------|
| **P0** | demo-vue 合并到 demo | 0.5 天 | 🔴 高 | 无 |
| **P1** | demo-flutter 移动端优化 | 2-3 天 | 🟡 中 | P0 |
| **P2** | docs-site → Docusaurus | 2-3 天 | 🟡 中 | 无（可并行） |
| **P3** | CI/CD 清理 | 0.5 天 | 🟢 低 | P0+P1+P2 |
| **总计** | | **5-7 天** | | |

---

## 🔧 CI/CD 变更清单

### 删除的 Workflow
- `.github/workflows/deploy-demo-vue.yml`
- 任何 flutter 相关构建流程

### 新增/修改的 Workflow
- `.github/workflows/deploy-docs.yml` → 改为 Docusaurus 构建
- `pnpm-workspace.yaml` → 删除 demo-vue 和 demo-flutter 条目

### Cloudflare Pages
- `demo-vue` 项目 → 删除或设置 redirect 到 `demo.cinacoin.com`
- `cinacoin-docs` 项目 → 更新 build 命令和输出目录

---

## ⚠️ 保留不动的包

这些是 **SDK/适配器**，提供给开发者在不同框架中使用 Cinacoin，**不能删除**：

| 包 | 用途 |
|----|------|
| `packages/vue` | Vue 3 框架适配器 |
| `packages/angular` | Angular 框架适配器 |
| `packages/svelte` | Svelte 框架适配器 |
| `packages/nuxt` | Nuxt 框架适配器 |
| `packages/flutter-dart` | Flutter/Dart SDK |
| `packages/ios-swift` | iOS SDK |
| `packages/android-kotlin` | Android SDK |
| `packages/unity-csharp` | Unity SDK |
| `packages/dotnet` | .NET SDK |

> **核心理念**：Cinacoin 自身前端用 React 统一，但 SDK 必须覆盖所有主流框架——这是产品定位决定的。

---

## ✅ 完成标准

1. [ ] `apps/demo-vue` 目录已删除，功能并入 `apps/demo`
2. [ ] `apps/demo-flutter` 目录已删除，移动端体验由 `apps/demo` PWA 覆盖
3. [ ] `docs-site` 已迁移为 Docusaurus（或 Next.js MDX），docs.cinacoin.com 正常访问
4. [ ] 所有 CI/CD 流程更新，无失败的构建
5. [ ] Cloudflare Pages 项目清理完毕，无孤立项目
6. [ ] `pnpm-workspace.yaml` 中无非 React 前端应用
7. [ ] 所有 SDK 包正常，未被误删
