# Cinacoin vs Cinacoin (Cinacoin) 对比审计报告

> **日期**: 2026-06-03  
> **审计人**: 000  
> **基准**: Cinacoin monorepo (177 commits, 80 packages) vs Cinacoin 公开产品线

---

## 1. 公司/项目背景

| 维度 | Cinacoin | Cinacoin (原 Cinacoin) |
|------|----------|-------------------------|
| 成立 | 2025-2026 | 2018 (Cinacoin), 2024 改名 Cinacoin |
| 定位 | 全链访问基础设施 | 钱包连接协议 |
| 架构 | 单体 monorepo + Cloudflare Workers | 多仓库 + 中心化基础设施 |
| 代码开源 | ✅ 100% 开源 (monorepo) | ⚠️ 部分开源 (SDK 开源, relay 闭源) |
| 总代码量 | **301,789 行** (5 语言) | ~150,000 行 (估算, 仅 SDK 部分开源) |

---

## 2. 功能模块对比

### 2.1 核心钱包连接

| 功能 | Cinacoin | Cinacoin |
|------|----------|-------|
| Cinacoin v2 | ✅ 自研完整实现 (9,297 行) | ✅ 创始者/协议标准 |
| EIP-6963 钱包发现 | ✅ | ✅ |
| EIP-5792 原子调用 | ✅ (atomic.ts) | ⚠️ 部分支持 |
| EIP-5793 钱包能力 | ✅ (capabilities.ts) | ✅ |
| QR Code 连接 | ✅ | ✅ |
| Deep Link | ✅ | ✅ |
| 自定义连接器 | ✅ custom-connectors | ❌ |
| 钱包推荐引擎 | ✅ wallet-recommender | ⚠️ 基础推荐 |
| 钱包恢复 | ✅ wallet-recovery | ❌ |
| 多钱包并行 | ✅ multiwallet | ⚠️ 有限 |

**Cinacoin 优势**: 自研完整 WC v2 实现（非依赖 @walletconnect/ 包），加上 EIP-5792 原子调用、钱包推荐/恢复。

### 2.2 链支持

| 维度 | Cinacoin | Cinacoin |
|------|----------|-------|
| EVM 链 (ETH, BSC, Polygon, Arbitrum, Optimism, Base) | ✅ 6 条 | ✅ 500+ (通过 caip) |
| Solana | ✅ 自研适配器 (2,448 行) | ✅ 第三方 |
| Bitcoin | ✅ 自研适配器 (5,586 行) | ⚠️ 有限支持 |
| Cosmos (IBC) | ✅ 自研适配器 (4,301 行) | ⚠️ 有限 |
| TON | ✅ Android/iOS 原生 | ❌ |
| TRON | ✅ Android/iOS 原生 | ❌ |
| NEAR | ✅ 自研适配器 (2,766 行) | ❌ |
| Sui | ✅ 自研适配器 (4,036 行) | ⚠️ 有限 |
| Starknet | ✅ 自研适配器 (2,870 行) | ⚠️ 有限 |
| Hedera | ✅ 自研适配器 (3,377 行) | ❌ |
| XRPL | ✅ 自研适配器 (3,199 行) | ❌ |
| Polkadot | ✅ 自研适配器 | ⚠️ 有限 |

**Cinacoin 优势**: 8 个非 EVM 链均有**自研适配器**，Cinacoin 主要依赖第三方集成。
**Cinacoin 优势**: EVM 链覆盖更广 (500+ CAIP 命名空间)。

### 2.3 认证

| 功能 | Cinacoin | Cinacoin |
|------|----------|-------|
| SIWE (Sign-In With Ethereum) | ✅ 1,071 行 | ✅ (创建者, EIP-4361) |
| SIWX (Sign-In With X) | ✅ 2,432 行 | ⚠️ 基础 |
| Passkey 认证 | ✅ passkey-auth | ❌ |
| Social Login | ✅ social-login | ⚠️ 有限 |
| Embedded Wallet | ✅ embedded-wallet (1,538 行) | ❌ (需第三方) |
| Session Keys | ✅ session-keys | ❌ |

**Cinacoin 优势**: Passkey、Social Login、Embedded Wallet、Session Keys 均为自研，Cinacoin 需要依赖第三方（如 Web3Auth、Privy）。

### 2.4 交易管理

| 功能 | Cinacoin | Cinacoin |
|------|----------|-------|
| 批量交易 | ✅ batch-transaction | ❌ |
| 跨链桥 (HTLC + AMM) | ✅ cross-chain-sync (9,368 行) | ❌ |
| Swap SDK | ✅ swap-sdk | ❌ (需第三方 DEX) |
| Paymaster (ERC-4337) | ✅ paymaster (1,483 行) | ❌ |
| Gas 估算 | ✅ gas-estimator | ❌ |
| Gas 赞助 | ✅ gas-sponsorship | ❌ |
| 交易索引器 | ✅ tx-indexer | ❌ |
| Safe Decoder | ✅ safe-decoder | ❌ |
| ERC-6492 签名验证 | ✅ erc6492 | ⚠️ |
| Bundler (ERC-4337) | ✅ bundler | ❌ |

**Cinacoin 显著优势**: 完整的交易基础设施（Paymaster、Bundler、Gas 赞助、跨链桥），Cinacoin 仅为钱包连接层。

### 2.5 支付/合规

| 功能 | Cinacoin | Cinacoin |
|------|----------|-------|
| Onramp SDK | ✅ onramp-sdk | ❌ (需 Ramp/MoonPay) |
| 支付流程 | ✅ payment-flow | ❌ |
| Pay UI | ✅ pay-ui | ❌ |
| 充值 | ✅ deposit | ❌ |
| KYC | ✅ kyc | ❌ |
| Travel Rule | ✅ travel-rule | ❌ |

**Cinacoin 优势**: 完整支付+合规模块，Cinacoin 不涉及此层。

### 2.6 UI/前端框架

| 平台 | Cinacoin | Cinacoin |
|------|----------|-------|
| React | ✅ 2,527 行 | ✅ AppKit |
| Next.js | ✅ | ⚠️ React 兼容 |
| Vue | ✅ | ❌ |
| Nuxt | ✅ | ❌ |
| Svelte | ✅ | ❌ |
| Angular | ✅ | ❌ |
| React Native | ✅ | ✅ |
| Flutter/Dart | ✅ 10,351 行 | ❌ |
| iOS Swift | ✅ 10,093 行 | ❌ |
| Android Kotlin | ✅ 18,176 行 | ❌ |
| Unity/C# | ✅ 19,608 行 | ❌ |
| .NET | ✅ | ❌ |

**Cinacoin 压倒性优势**: 12 个前端框架/平台 vs Cinacoin 的 2 个（React + React Native）。Cinacoin AppKit 仅限 Web。

### 2.7 基础设施

| 服务 | Cinacoin | Cinacoin |
|------|----------|-------|
| RPC 代理 | ✅ rpc-proxy (Cloudflare) | ✅ 中心化 RPC |
| Relay Server | ✅ 自研 relay-server | ✅ 中心化 (闭源) |
| Keys Server | ✅ 自研 keys-server | ✅ 中心化 (闭源) |
| Notify Server | ✅ 自推通知 | ✅ Cinacoin Notify |
| Push Server | ✅ FCM/APNs 推送 | ✅ |
| Blockchain API | ✅ 2,838 行 | ❌ |
| Analytics | ✅ analytics + analytics-server | ⚠️ 基础 |
| CDN | ✅ | ✅ Cloudflare |
| Explorer | ✅ explorer | ❌ |
| 云仪表盘 | ✅ cloud-dashboard | ✅ Cinacoin Cloud |
| 后端仪表盘 | ✅ backend-dashboard | ❌ |
| 健康状态页 | ✅ health-status | ✅ status.cinacoin.com |

### 2.8 原生移动 SDK

| 功能 | Cinacoin Android | Cinacoin iOS | Cinacoin |
|------|-----------------|--------------|-------|
| Cinacoin v2 | ✅ 完整 | ✅ 完整 | ❌ 无原生 |
| SIWE 签名 | ✅ | ✅ | ❌ |
| 多链切换 | ✅ | ✅ | ❌ |
| 会话恢复 | ✅ | ✅ | ❌ |
| Compose/UIKit | ✅ 8 个组件 | ✅ | ❌ |
| 链适配器 | ✅ 12 条 | ✅ 12 条 | ❌ |
| 示例应用 | ✅ 1,153 行 | ✅ | ❌ |
| 单元测试 | ✅ 130 个 | ✅ | ❌ |
| Maven/CocoaPods 发布 | ✅ 已配置 | ✅ | ❌ |

---

## 3. 代码量对比

| 指标 | Cinacoin | Cinacoin (估算) |
|------|----------|-------------|
| 总代码行 | 301,789 | ~150,000 (仅 SDK) |
| 编程语言 | 5 (TS/Swift/Kotlin/Dart/C#) | 3 (TS/Swift/Kotlin 部分) |
| Packages | 80 | ~30 |
| Apps | 10 | ~5 |
| 测试数 | 260+ | 未知 |
| Git Commits | 177 | 未知 |

---

## 4. 架构对比

### Cinacoin 架构
```
┌─────────────────────────────────────────┐
│  前端应用 (10 apps)                      │
│  Website / Demo / Dash / Status / Docs   │
├─────────────────────────────────────────┤
│  前端 SDK (12 框架)                      │
│  React / Vue / Angular / Svelte / ...    │
├─────────────────────────────────────────┤
│  移动 SDK (3 平台)                       │
│  iOS Swift / Android Kotlin / Flutter    │
│  Unity / .NET                           │
├─────────────────────────────────────────┤
│  核心层 (TypeScript)                     │
│  Core SDK / WC v2 / 链适配器 / 认证      │
│  Paymaster / 跨链桥 / Swap / Gas         │
├─────────────────────────────────────────┤
│  基础设施 (Cloudflare Workers)           │
│  RPC / Relay / Keys / Notify / Push      │
│  Blockchain API / Analytics / Explorer   │
├─────────────────────────────────────────┤
│  合规/支付                               │
│  Onramp / KYC / Travel Rule / Payment    │
└─────────────────────────────────────────┘
```

### Cinacoin 架构
```
┌─────────────────────────────────────────┐
│  AppKit (React / React Native)           │
├─────────────────────────────────────────┤
│  Cinacoin v2 Protocol               │
├─────────────────────────────────────────┤
│  中心化基础设施 (闭源)                    │
│  Relay / Push / Notify / Verify          │
└─────────────────────────────────────────┘
```

---

## 5. 商业模式对比

| 维度 | Cinacoin | Cinacoin |
|------|----------|-------|
| 定价 | 完全免费/开源 | 免费层 + Pro $299/月 + 企业 |
| 自托管 | ✅ 全部可自托管 | ❌ Relay 必须用 Cinacoin 云 |
| 收入模式 | 未定义 (基础设施) | SaaS 订阅 |
| 数据控制 | ✅ 用户完全控制 | ⚠️ Cinacoin 持有元数据 |

---

## 6. 核心差异总结

### Cinacoin 独有 (Cinacoin 没有)
1. **12 框架前端 SDK** (Vue/Angular/Svelte/Nuxt/Flutter/Unity/.NET...)
2. **完整链适配器** (Bitcoin/Solana/Cosmos/TON/TRON/NEAR/Sui/Starknet/Hedera/XRPL/Polkadot)
3. **跨链桥** (HTLC 原子交换 + AMM 流动性池)
4. **AA 钱包基础设施** (Paymaster + Bundler + Gas 赞助)
5. **认证全栈** (SIWE + SIWX + Passkey + Social Login + Embedded Wallet)
6. **支付/合规模块** (Onramp + KYC + Travel Rule + Payment Flow)
7. **自托管一切** (RPC/Relay/Keys/Notify/Push 全部 Cloudflare Workers)
8. **钱包推荐/恢复/多钱包** 系统
9. **10 个部署应用** (Website/Demo/Dash/Status/Docs + Cloud/Backend Dashboard)

### Cinacoin 独有 (Cinacoin 缺失)
1. **500+ EVM 链 CAIP 覆盖** (Cinacoin 目前 6 条 EVM + 8 非 EVM)
2. **协议标准制定者** (EIP-4361 SIWE 创建者)
3. **品牌认知度** (Cinacoin 是行业事实标准)
4. **Verify/安全评分** 系统
5. **Push 通知网络** (Cinacoin Push 有数百万设备覆盖)

### 需要加强 (Cinacoin 差距)
1. ⚠️ **EVM 链覆盖**: 仅 6 条 → 需要扩展到 100+ CAIP
2. ⚠️ **Verify/安全评分**: 缺失 → 类似 Cinacoin Verify
3. ⚠️ **品牌生态**: 新品牌，需要建立开发者社区
4. ⚠️ **CAIP 标准化**: 非 EVM 链需要 CAIP 提案
5. ⚠️ **Push 网络规模**: 需要建立推送设备覆盖

---

## 7. 结论

**Cinacoin 不是 "另一个 Cinacoin"**，而是**全链访问层的超集**：

- Cinacoin = 钱包连接协议 + AppKit（2 个平台）
- Cinacoin = 钱包连接 + 链适配器 + 认证 + 交易 + 跨链 + 支付 + 合规 + 12 平台 SDK

**差距**: EVM 链覆盖广度 (500+ vs 6+8) 和品牌生态。

**机会**: Cinacoin 的 500+ 链是 CAIP 自动注册，实际活跃链 <50。Cinacoin 的 14 条链（6 EVM + 8 非 EVM）中非 EVM 部分远超 Cinacoin。

---

*审计完成 - 2026-06-03*
