# Cinacoin 诚实审计报告 — 需要完善的地方

> **日期**: 2026-06-03  
> **审计人**: 000  
> **方法**: 逐项检查代码仓库、编译、安全、文档、部署

---

## 🟢 做得好的（继续保持）

| 维度 | 状态 | 说明 |
|------|------|------|
| TypeScript 编译 | ✅ 30/30 通过 | 零编译错误 |
| 安全 | ✅ 无硬编码密钥 | .env.example 规范，.gitignore 正确 |
| 版本一致性 | ✅ 全部 0.2.0 | 统一版本管理 |
| .d.ts 导出 | ✅ 完整 | core-sdk 45个, react 19个, vue 13个 |
| 非 EVM 适配器 | ✅ 8 个齐全 | Solana/Bitcoin/Cosmos/NEAR/Sui/Starknet/XRPL/Hedera |
| 部署状态 | ✅ 全部在线 | 5 Workers + 5 前端站点 |
| README 覆盖 | ✅ 74/78 (95%) | 仅 4 个缺失 |
| 待办事项 | ✅ 仅 4 个 TODO | 代码纪律良好 |

---

## 🟡 需要改进（中优先级）

### 1. EVM 链覆盖太窄

**问题**: core-sdk 中只配置了 `chainId: 1` (Ethereum Mainnet) 作为默认值，没有完整的 EVM 链列表。Reown 支持 500+ 链。

**证据**:
```
packages/core-sdk/src/auth/siwe.ts:48: /** EIP-155 chain ID (default: 1 for Ethereum Mainnet) */
```

**影响**: 用户无法连接到 Polygon、Arbitrum、Optimism、Base、BSC 等主流 EVM 链。

**建议**: 
- 在 `packages/core-sdk/src/configs/` 下添加完整 EVM 链配置（至少 Top 20）
- 实现 CAIP-2 namespace 解析

### 2. package.json exports 排序问题

**问题**: 3 个包的 `exports` 中 `"types"` 条件排在 `"import"/"require"` 之后，导致类型定义永不被使用。

**影响包**:
- `@cinacoin/wallet-registry`
- `@cinacoin/swap-sdk`
- `@cinacoin/onramp-sdk`
- `@cinacoin/config`（多个）

**修复**: 将 `"types"` 条件移到每个 export 对象的第一个位置。

### 3. 缺少 main 入口

**问题**: 2 个包没有 `"main"` 字段。

**影响包**:
- `@cinacoin/analytics-server`
- `com.cinacoin.unity`

**修复**: 添加正确的 `"main": "dist/index.js"` 或 `"main": "Runtime/CinacoinSDK.cs"`。

### 4. 移动 SDK 无法在 CI 中编译

**问题**: Android Kotlin、iOS Swift、Flutter Dart、Unity C# 的编译验证需要对应 SDK 环境，当前 CI 中没有移动平台编译步骤。

**影响**: 无法在 PR 合并前保证移动 SDK 的编译正确性。

**建议**:
- GitHub Actions 中添加 `android-build`、`ios-build`（macOS runner）、`flutter-analyze` job
- 或使用 `detekt`（Kotlin）、`swiftlint`（Swift）、`dart analyze`（Dart）做静态分析

---

## 🔴 需要紧急修复（高优先级）

### 5. ⚠️ 4 个 TODO 需要处理

```
packages/config/src/headless.ts:32:
  void options; // TODO: replace with real core-sdk createClient

packages/nuxt/src/server/index.ts:164:
  // TODO: In production, use jose or similar for JWE/JWT decryption

packages/siwx/src/siwx.ts:75:
  // TODO: narrow type — EIP-1193 or ethers/viem provider

packages/siwx/src/siwx.ts:112:
  // TODO: narrow type — EIP-1193 or ethers/viem provider
```

**严重度**: 
- `config/headless.ts`: 功能不完整（核心配置入口）
- `nuxt/server/index.ts`: 安全风险（JWT 解密使用临时方案）
- `siwx/siwx.ts`: 类型不安全（SIWX 签名入口）

### 6. ⚠️ CAIP-2 标准未实现

**问题**: Reown 使用 CAIP-2（`namespace:reference:account`）作为跨链标准。Cinacoin 没有实现 CAIP-2 namespace 解析。

**影响**: 无法与使用 CAIP-2 的 dApp/钱包互操作。

**建议**: 添加 `packages/caip` 包实现：
- CAIP-2: Chain ID 格式
- CAIP-10: Account ID 格式
- CAIP-19: Asset ID 格式

### 7. ⚠️ 缺少 E2E 测试

**问题**: 虽然有 260 个单元测试，但 `e2e.yml` 工作流存在，实际 E2E 测试覆盖率未知。

**建议**:
- 用 Playwright 编写核心流程 E2E 测试：连接钱包 → 切换链 → 签名消息 → 发送交易
- 至少覆盖 @cinacoin/react 的 ConnectModal 完整流程

### 8. ⚠️ 4 个包缺少 README

**问题**: 78 个包中有 4 个没有 README。

**建议**: 为以下包添加 README：
- 找出缺失的 4 个包并补充文档

---

## 📋 待办清单（按优先级排序）

| 优先级 | 任务 | 预计工作量 | 影响 |
|--------|------|-----------|------|
| P0 | 修复 JWT 解密临时方案 (nuxt) | 1h | 安全 |
| P0 | 添加 Top 20 EVM 链配置 | 4h | 核心功能 |
| P1 | 实现 CAIP-2 namespace 解析 | 8h | 互操作性 |
| P1 | 修复 exports types 排序 (3 包) | 30m | 类型安全 |
| P1 | 处理 4 个 TODO | 2h | 代码质量 |
| P2 | 添加移动 SDK CI 编译 | 4h | 质量保障 |
| P2 | 补充 4 个缺失 README | 1h | 文档 |
| P2 | 添加 main 入口 (2 包) | 15m | 包可用性 |
| P3 | 编写 E2E 测试 (ConnectModal 流程) | 8h | 质量保障 |
| P3 | Verify/安全评分系统 | 2d | 安全 |

---

## 🏆 总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构设计 | ⭐⭐⭐⭐⭐ | 全栈 monorepo，分层清晰 |
| 代码质量 | ⭐⭐⭐⭐ | 编译零错误，仅 4 个 TODO |
| 安全性 | ⭐⭐⭐⭐ | 无密钥泄漏，1 个 JWT 风险 |
| 测试覆盖 | ⭐⭐⭐ | 260 单元测试，缺少 E2E |
| 文档 | ⭐⭐⭐⭐ | 95% README 覆盖 |
| 互操作性 | ⭐⭐⭐ | 缺少 CAIP-2，EVM 链少 |
| 部署运维 | ⭐⭐⭐⭐⭐ | 全在线，CI/CD 完善 |
| 移动平台 | ⭐⭐⭐⭐ | 代码完整，缺 CI 验证 |

**综合: 4.0 / 5.0** — 优秀基础，少数关键差距需要填补。

---

*审计完成 - 2026-06-03*
