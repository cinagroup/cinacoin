# Reown 混合方案迁移 Checklist

> **方案**: 前端 UI 用 Reown AppKit（品牌定制），协议层/基础设施保留自研
> **创建时间**: 2026-06-14
> **状态**: 🟡 进行中

---

## Phase 1: 品牌配置层（预计 2-3 天）✅ 已完成

### 1.1 创建 `@cinacoin/appkit-config` 包 ✅

- [x] 创建 `packages/cinacoin-appkit-config/` 目录结构
- [x] 创建 `package.json`（依赖 `@reown/appkit`, `@reown/appkit-adapter-wagmi`）
- [x] 创建 `src/config.ts` — Cinacoin 品牌 AppKit 配置
- [x] 创建 `src/theme.ts` — Cinacoin 主题（品牌色、字体）
- [x] 创建 `src/chains.ts` — Cinacoin 支持的链配置
- [x] 创建 `src/wallets.ts` — 推荐钱包列表
- [x] 创建 `src/index.ts` — 统一导出
- [x] 创建 `src/react.ts` — React hooks 封装
- [x] 添加 TypeScript 配置
- [x] 添加测试配置
- [x] 构建成功（dist/ 已生成）

### 1.2 品牌主题设计 ✅

- [x] 定义 Cinacoin 主色调（dark/light）
- [x] 定义品牌字体
- [x] 定义品牌图标 URL
- [x] 配置 `--w3m-color-mix` 等 Reown 主题变量
- [x] 测试主题在 dark/light 模式下的表现

### 1.3 链配置 ✅

- [x] 配置 EVM 链（Ethereum, Polygon, BSC, Arbitrum, Optimism）
- [x] 配置 Solana
- [x] 配置 Bitcoin
- [x] 配置其他链（TON, Tron, Cosmos 等）
- [x] 配置 RPC 端点（自建 + 公共）

---

## Phase 2: 前端应用重构（预计 3-5 天）

### 2.1 重构 `apps/demo-react` ✅ 已完成

- [x] 安装 `@reown/appkit`
- [x] 删除 `src/wc.ts`（旧 WalletConnect provider）
- [x] 重构 `src/contexts/WalletContext.tsx` — 使用 `useCinacoinWallet`
- [x] 更新 `src/App.tsx` — 导入 `./lib/appkit` 初始化
- [x] 更新 `src/main.tsx` — 移除 WagmiProvider/AppKitProvider
- [x] 重写 `src/lib/appkit.ts` — 使用纯 AppKit（无 wagmi adapter）
- [x] **构建成功** ✅ (dist/ 已生成，1.6MB total)
- [ ] 测试 MetaMask 连接（需浏览器）
- [ ] 测试 WalletConnect 连接（需浏览器）
- [ ] 测试社交登录（需浏览器）
- [ ] 测试链切换（需浏览器）
- [ ] 测试交易签名（需浏览器）

### 2.2 重构 `apps/demo-dapp-react`

- [ ] 安装依赖
- [ ] 替换钱包连接逻辑
- [ ] 更新 UI 组件
- [ ] 测试所有页面

### 2.3 重构 `apps/demo-vue`

- [ ] 安装 `@reown/appkit-vue`
- [ ] 替换钱包连接逻辑
- [ ] 测试

### 2.4 重构 `apps/website`

- [ ] 集成 AppKit
- [ ] 更新首页钱包连接按钮
- [ ] 测试

### 2.5 重构 `apps/docs-site`

- [ ] 集成 AppKit（文档中的交互示例）
- [ ] 测试

---

## Phase 3: 自研 AppKit 处理（预计 1 天）

### 3.1 标记自研 AppKit 为 legacy

- [ ] 在 `packages/appkit/README.md` 添加 deprecation 说明
- [ ] 保留代码但不再主动维护
- [ ] 更新文档指向 Reown AppKit

### 3.2 保留自研协议层

- [ ] `packages/walletconnect-v2/` — 保留（CloudRelay, SessionManager, QR, 深度链接）
- [ ] `packages/core-sdk/` — 保留
- [ ] `packages/adapter-*` — 保留
- [ ] 确保自研协议层与 Reown AppKit 可共存

---

## Phase 4: 移动端 SDK 迁移（预计 2-3 周）

### 4.1 iOS (Swift)

- [ ] 引入 `reown-swift` 依赖
- [ ] 创建 `CinacoinWalletKit` 品牌包装层
- [ ] 配置 metadata（name: "Cinacoin", icons, url）
- [ ] 实现品牌主题
- [ ] 替换自研 iOS SDK 调用
- [ ] 测试钱包连接
- [ ] 测试交易签名
- [ ] 测试推送通知

### 4.2 Android (Kotlin)

- [ ] 引入 `reown-kotlin` 依赖
- [ ] 创建 `CinacoinWalletKit` 品牌包装层
- [ ] 配置 metadata
- [ ] 实现品牌主题
- [ ] 替换自研 Android SDK 调用
- [ ] 测试

### 4.3 Flutter

- [ ] 引入 `reown_appkit` / `reown_walletkit` Flutter 包
- [ ] 创建品牌配置层
- [ ] 替换自研 Flutter SDK
- [ ] 测试

### 4.4 React Native

- [ ] 引入 `@reown/appkit-react-native`
- [ ] 创建品牌配置层
- [ ] 替换自研 RN SDK
- [ ] 测试

---

## Phase 5: 基础设施保留确认（预计 1 天）

### 5.1 Workers（保留）

- [ ] 确认 `workers/auth-service` 正常运行
- [ ] 确认 `workers/api-gateway` 正常运行
- [ ] 确认 `workers/user-service` 正常运行
- [ ] 确认 `workers/router` 正常运行
- [ ] 确认 `workers/verify-service` 正常运行

### 5.2 基础设施（保留）

- [ ] 确认 `infra/relay` 中继服务器正常
- [ ] 确认 `infra/monitoring` 监控系统正常
- [ ] 确认 `packages/push-server` 推送服务器正常
- [ ] 确认 `packages/notify-server` 通知服务器正常
- [ ] 确认 `packages/keys-server` 密钥管理正常

### 5.3 集成测试

- [ ] Reown AppKit → 自建 Relay 连接测试
- [ ] Reown AppKit → 自建 Auth 服务测试
- [ ] 端到端连接流程测试

---

## Phase 6: 部署与验证（预计 2-3 天）

### 6.1 构建验证

- [ ] `pnpm build` 全量构建通过
- [ ] `pnpm test` 全量测试通过
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误

### 6.2 部署

- [ ] 部署 demo-react 到 Cloudflare Pages
- [ ] 部署 website 到 Cloudflare Pages
- [ ] 部署 docs-site 到 Cloudflare Pages
- [ ] 验证所有站点可访问

### 6.3 功能验证

- [ ] 钱包连接弹窗正常显示
- [ ] 品牌色/Logo 正确
- [ ] MetaMask 连接正常
- [ ] WalletConnect QR 码正常
- [ ] 社交登录正常
- [ ] 链切换正常
- [ ] 交易签名正常
- [ ] 移动端 SDK 正常

---

## 进度追踪

| Phase                     | 状态      | 开始时间   | 完成时间 | 备注         |
| ------------------------- | --------- | ---------- | -------- | ------------ |
| Phase 1: 品牌配置层       | 🟡 进行中 | 2026-06-14 | -        | 优先执行     |
| Phase 2: 前端应用重构     | ⬜ 待开始 | -          | -        | 依赖 Phase 1 |
| Phase 3: 自研 AppKit 处理 | ⬜ 待开始 | -          | -        | 依赖 Phase 2 |
| Phase 4: 移动端 SDK       | ⬜ 待开始 | -          | -        | 可并行       |
| Phase 5: 基础设施确认     | ⬜ 待开始 | -          | -        | 可并行       |
| Phase 6: 部署验证         | ⬜ 待开始 | -          | -        | 最后执行     |

---

## 决策记录

### 2026-06-14: 采用混合方案

- **决策**: 前端 UI 用 Reown AppKit，协议层/基础设施保留自研
- **原因**:
  - 自研前端 UI 成熟度不够，部署效果不符合预期
  - Reown AppKit 生产级质量，品牌可定制
  - 自研协议层（walletconnect-v2）已完整实现且测试完备
  - 混合方案兼顾开发速度和自主可控
- **风险**:
  - Reown 商业许可限制（免费层 100K MAU）
  - 依赖 Reown 基础设施（可通过自建中继缓解）
