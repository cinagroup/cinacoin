# Cinacoin DeFi / 支付 / 合规模块审计报告

- **审计日期：** 2026-06-15
- **审计员：** DeFi/支付/合规模块审计子代理
- **审计范围：** 19 个模块（packages + apps）
- **审计版本：** 基于当前工作目录代码快照

---

## 目录

1. [执行摘要](#1-执行摘要)
2. [审计范围与方法](#2-审计范围与方法)
3. [ERC 标准合规审计](#3-erc-标准合规审计)
4. [安全性审计](#4-安全性审计)
5. [跨链能力审计](#5-跨链能力审计)
6. [合规完整性审计](#6-合规完整性审计)
7. [Gas 优化审计](#7-gas-优化审计)
8. [交易管理审计](#8-交易管理审计)
9. [集成测试审计](#9-集成测试审计)
10. [风险矩阵总览](#10-风险矩阵总览)
11. [建议与修复优先级](#11-建议与修复优先级)

---

## 1. 执行摘要

### 总体评级：⚠️ 中等风险（需修复后上线）

| 维度 | 评级 | 关键发现 |
|------|------|----------|
| ERC 标准合规 | ⚠️ 中等 | EntryPoint v0.6/v0.7 混用；`validatePaymasterUserOp` 签名与 EP0.7 不完全兼容 |
| 安全性 | 🔴 高 | HTLC `emergencyWithdraw` 无权限控制；Paymaster sender 提取逻辑不安全 |
| 跨链能力 | ⚠️ 中等 | BridgeRouter 重放保护不完整；消息传递缺乏链 ID 绑定 |
| 合规完整性 | ✅ 良好 | Travel Rule / KYC / 制裁名单覆盖完整 |
| Gas 优化 | ⚠️ 中等 | Gas 估算使用固定 21,000 基准；缺少 L2 适配 |
| 交易管理 | ✅ 良好 | Nonce 管理、重试、状态追踪机制完善 |
| 集成测试 | ⚠️ 中等 | 单元测试覆盖尚可，E2E / 跨链集成测试不足 |

### 严重发现（Critical）：3 项
### 高风险发现（High）：7 项
### 中等风险发现（Medium）：12 项
### 低风险 / 建议（Low）：9 项

---

## 2. 审计范围与方法

### 审计模块清单

| # | 模块路径 | 类型 | 代码行数（估） |
|---|----------|------|----------------|
| 1 | `packages/paymaster/` | Solidity + TS | ~1,800 |
| 2 | `packages/bundler/` | TypeScript | ~2,200 |
| 3 | `packages/aa-sdk/` | TypeScript | ~600 |
| 4 | `packages/gas-estimator/` | TypeScript | ~800 |
| 5 | `packages/gas-sponsorship/` | TypeScript | ~400 |
| 6 | `packages/swap-sdk/` | TypeScript | ~1,500 |
| 7 | `packages/cross-chain-contracts/` | Solidity | ~900 |
| 8 | `packages/cross-chain-sync/` | TypeScript | ~2,500 |
| 9 | `packages/batch-transaction/` | TypeScript | ~600 |
| 10 | `packages/onramp-sdk/` | TypeScript | ~700 |
| 11 | `packages/payment-flow/` | TypeScript | ~800 |
| 12 | `packages/pay-ui/` | TSX/TypeScript | ~500 |
| 13 | `packages/deposit/` | TSX/TypeScript | ~400 |
| 14 | `packages/kyc/` | TypeScript | ~700 |
| 15 | `packages/travel-rule/` | TypeScript | ~1,200 |
| 16 | `packages/safe-decoder/` | TypeScript | ~200 |
| 17 | `packages/erc6492/` | TypeScript | ~200 |
| 18 | `apps/bundler-service/` | TypeScript | ~500 |
| 19 | `apps/auth-service/` | TypeScript/TSX | ~800 |

### 审计方法

- 逐文件代码审查（手动 + 模式匹配）
- ERC 标准规范对照（ERC-4337, ERC-6492, EIP-5792, EIP-712）
- 安全模式检查（重入、权限、溢出、重放、前端运行）
- 合规框架对照（FATF Travel Rule, OFAC SDN, KYC/AML）

---

## 3. ERC 标准合规审计

### 3.1 ERC-4337 Paymaster 合规

#### 3.1.1 VerifyingPaymaster.sol

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `validatePaymasterUserOp` 接口签名 | ⚠️ | 函数签名缺少 `UserOperation` 参数，仅接收 `userOpHash`。ERC-4337 v0.7 要求完整 UserOp 结构 |
| `postOp` 接口签名 | ✅ | 4 参数签名正确（mode, context, actualGasCost, actualUserOpFeePerGas） |
| EIP-712 域分离 | ✅ | 正确使用 `EIP712("CinaConnect VerifyingPaymaster", "1")` + chainId + verifyingContract |
| 重放保护 | ✅ | `usedSignatures[userOpHash]` 映射防止签名重放 |
| validationData 打包 | ⚠️ | `_packValidationData` 实现与 v0.7 规范有偏差——aggregator 应在高位而非 validAfter 在低位 |
| paymasterAndData 编码 | ✅ | `paymaster(20) + validUntil(32) + validAfter(32) + signature(65)` 布局清晰 |

**问题详情 [AA-01]：** `validatePaymasterUserOp` 的函数签名：
```solidity
function validatePaymasterUserOp(
    bytes32 userOpHash,
    uint256 maxFeePerGas,
    uint256 maxPriorityFeePerGas
) external view override onlyEntryPoint
```
ERC-4337 v0.7 IPaymaster 接口要求：
```solidity
function validatePaymasterUserOp(
    PackedUserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 maxCost
) external returns (uint256 validationData, bytes memory context);
```
当前实现与 v0.7 EntryPoint 不兼容。需要更新为 v0.7 接口或明确声明支持 v0.6。

**问题详情 [AA-02]：** `_extractPaymasterContext` 从 `msg.data` 尾部解析数据，但该方法假设了固定的 calldata 布局。如果 EntryPoint 的调用方式变化，解析可能失败。建议使用 `paymasterAndData` 参数显式传入。

#### 3.1.2 TokenPaymaster.sol

| 检查项 | 状态 | 说明 |
|--------|------|------|
| ERC-20 支付 Gas | ✅ | 通过 `postOp` 中 `transferFrom` 实现 token 扣款 |
| 价格预言机 | ⚠️ | 使用静态 `TokenPrice` 结构，无实时价格喂价 |
| 每日限额 | ✅ | 用户级 + 全局级每日预算控制 |
| 紧急暂停 | ✅ | `Pausable` 模式 + `EmergencyShutdown` 事件 |
| SafeERC20 使用 | ✅ | 正确使用 `SafeERC20` 进行 token 转账 |

**问题详情 [AA-03]：** Token 价格更新由 owner 手动设置（`setTokenPrice`），无 Chainlink/Pyth 等预言机集成。在价格剧烈波动时可能导致：
- 用户被多收/少收 Gas 费
- 套利者利用过时价格

#### 3.1.3 UpgradeablePaymaster / CinaConnectPaymaster

| 检查项 | 状态 | 说明 |
|--------|------|------|
| UUPS 升级模式 | ✅ | 正确使用 `UUPSUpgradeable` + `_authorizeUpgrade` onlyOwner |
| Initializable | ✅ | `initialize` 替代 constructor |
| 赞助模式 | ✅ | Fixed / Percentage / FreeTier / Whitelist 四种模式 |
| Sender 提取 | 🔴 | `_extractSender(userOpHash)` 使用 `address(uint160(uint256(userOpHash)))` — 这是 **错误的**，userOpHash 不是 sender 地址 |

**问题详情 [AA-04] [CRITICAL]：**
```solidity
function _extractSender(bytes32 userOpHash) internal pure returns (address) {
    return address(uint160(uint256(userOpHash)));
}
```
这将 userOpHash 的前 20 字节作为 sender 地址，完全错误。正确的做法是从 UserOperation 结构中提取 `sender` 字段，或在 `validatePaymasterUserOp` 中接收完整 UserOp。这导致所有赞助策略（白名单、每日限额、FreeTier 计数）均基于错误的地址，**整个赞助逻辑无效**。

### 3.2 ERC-6492 签名验证合规

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Magic Suffix 检测 | ✅ | 正确使用 `0x6492...6492` 32 字节后缀 |
| 编码格式 | ⚠️ | `encodeValidation` 中 deployer 使用 `padEnd` 右填充，但标准是 32 字节左填充地址 |
| 解码逻辑 | ⚠️ | `decodeValidation` 假设签名固定 65 字节，不支持合约签名变长 |
| 链上验证 | ❌ | 缺少实际的链上 `universalValidator` 合约调用 |

**问题详情 [ERC-01]：** ERC-6492 标准要求编码格式为：
```
abi.encode(deployer, factoryCalldata, signature) + magic_suffix
```
当前实现使用简单拼接，缺少 ABI 编码的长度前缀，可能导致解码歧义。

**问题详情 [ERC-02]：** `validateSignature` 函数仅做格式检查，不进行链上验证。对于 counterfactual 地址（合约尚未部署），必须调用 ERC-6492 通用验证器合约。

### 3.3 EIP-5792 (Wallet Call API) 合规

`aa-sdk` 模块提供了 bundler client 和 paymaster 集成，但未发现 EIP-5792 `wallet_sendCalls` / `wallet_getCallsStatus` 的明确实现。

**建议 [ERC-03]：** 如需支持 EIP-5792，应在 `aa-sdk` 中添加 `wallet_sendCalls` 和 `wallet_getCallsStatus` RPC 方法封装。

---

## 4. 安全性审计

### 4.1 资金安全

#### 🔴 [SEC-01] CRITICAL — HTLC emergencyWithdraw 无权限控制

**文件：** `packages/cross-chain-contracts/contracts/HTLC.sol`

```solidity
function emergencyWithdraw() external {
    if (address(this).balance > 0) {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }
}
```

**风险：** 任何人都可以调用 `emergencyWithdraw` 取走合约中所有 ETH。虽然注释说 "Intended as safety valve — in production, restrict to owner"，但合约未继承 Ownable，也没有任何权限检查。

**影响：** 所有锁定的 ETH 资金可被任意地址盗取。

**修复建议：** 添加 `onlyOwner` 修饰器，或移除此函数（HTLC 的资金应仅通过 `claim` 和 `refund` 流转）。

#### 🔴 [SEC-02] CRITICAL — Paymaster sender 提取逻辑错误

**文件：** `packages/paymaster/contracts/UpgradeablePaymaster.sol` & `CinaConnectPaymaster.sol`

如 [AA-04] 所述，`_extractSender` 从 userOpHash 提取地址是错误的。这意味着：
- 白名单检查基于错误地址 → 任何人都能绕过白名单
- 每日限额基于错误地址 → 限额控制无效
- FreeTier 计数基于错误地址 → 免费额度控制无效

**影响：** 所有赞助策略失效，可能导致 Paymaster 资金被无限消耗。

#### 🔴 [SEC-03] CRITICAL — VerifyingPaymaster postOp 重放标记时机

**文件：** `packages/paymaster/contracts/VerifyingPaymaster.sol`

```solidity
function postOp(...) external override onlyEntryPoint {
    if (mode == 0) {
        (bytes32 userOpHash, ) = abi.decode(context, (bytes32, uint256));
        usedSignatures[userOpHash] = true;  // ← 在 postOp 中标记
    }
}
```

`validatePaymasterUserOp` 检查 `usedSignatures[userOpHash]`，但标记在 `postOp` 中设置。在 `validatePaymasterUserOp` 和 `postOp` 之间，同一签名可以被多个 UserOp 使用（如果它们在同一 bundle 中）。

**修复建议：** 在 `validatePaymasterUserOp` 成功验证后立即标记（需要改为 non-view），或使用两阶段提交。

#### ⚠️ [SEC-04] HIGH — BridgeRouter completeTransfer 无重放保护

**文件：** `packages/cross-chain-contracts/contracts/BridgeRouter.sol`

`completeTransfer` 函数没有检查 nonce 是否已被使用（在目标链上）。虽然 `initiateTransfer` 中有 `nonceUsed` 检查，但 `completeTransfer` 没有：

```solidity
function completeTransfer(
    uint256 sourceChain,
    address sender,
    address recipient,
    uint256 amount,
    uint256 nonce,          // ← nonce 参数存在但未检查
    bytes calldata signatures
) external nonReentrant {
    // 没有 nonceUsed[sourceChain][sender][nonce] 检查！
}
```

**影响：** 同一笔跨链转账可被多次完成，导致资金超发。

#### ⚠️ [SEC-05] HIGH — MultiSig addSigner / removeSigner / updateThreshold 无多签保护

**文件：** `packages/cross-chain-contracts/contracts/MultiSig.sol`

```solidity
function addSigner(address signer) external {
    if (!isSigner[msg.sender]) revert NotSigner();
    // 任何 signer 都可以单独添加新 signer！
}

function removeSigner(address signer) external {
    if (!isSigner[msg.sender]) revert NotSigner();
    // 任何 signer 都可以单独移除其他 signer！
}

function updateThreshold(uint256 newThreshold) external {
    if (!isSigner[msg.sender]) revert NotSigner();
    // 任何 signer 都可以单独修改阈值！
}
```

**影响：** 单个 signer 可以：
1. 添加自己的额外地址
2. 移除其他 signer
3. 将阈值降为 1
这完全破坏了多签的安全模型。

**修复建议：** 这些治理函数应通过 proposal + approve + execute 流程，而非直接调用。

#### ⚠️ [SEC-06] HIGH — Bundler BUNDLER_SKIP_AUTH 环境变量

**文件：** `packages/bundler/src/env.ts` + `BundlerServer.ts`

```typescript
if (env.BUNDLER_SKIP_AUTH === 'true') {
    return true;  // 跳过所有 API key 验证
}
```

如果此环境变量在生产环境被意外设置，Bundler RPC 将完全开放。

**修复建议：** 在生产构建中移除此功能，或添加启动时的环境检查警告。

#### ⚠️ [SEC-07] HIGH — Auth Service middleware 未实际验证 token

**文件：** `apps/auth-service/src/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
    // ...
    return NextResponse.next();  // 所有非公开路径直接放行
}
```

中间件仅检查路径是否在公开列表中，但对需要认证的路径直接 `NextResponse.next()` 而不验证 JWT/session。认证逻辑可能在 API route 层实现，但中间件层没有提供统一保护。

#### ⚠️ [SEC-08] HIGH — Bundler 内存 Rate Limiter 可被绕过

**文件：** `packages/bundler/src/BundlerServer.ts`

Rate limiter 使用 `Map<string, ...>` 存储，没有 TTL 清理机制（除了 `resetAt` 时间戳）。在高流量下：
1. Map 无限增长 → 内存泄漏
2. 攻击者可以轮换 IP（通过 `X-Forwarded-For`）绕过限制
3. `X-Forwarded-For` 可被伪造

#### ⚠️ [SEC-09] HIGH — Swap SDK MEV 保护默认 nonce 为 0

**文件：** `packages/swap-sdk/src/mev.ts`

```typescript
if (options?.publicClient) {
    nonce = await options.publicClient.getTransactionCount({...});
} else {
    gasPrice = 20_000_000_000n;
    nonce = 0;  // ← 硬编码 nonce = 0
}
```

当没有提供 `publicClient` 时，nonce 默认为 0，会导致交易冲突。

### 4.2 签名验证

#### ⚠️ [SEC-10] MEDIUM — ERC-6492 签名未进行实际密码学验证

`packages/erc6492/src/erc6492.ts` 中的 `validateSignature` 仅检查格式，不验证签名的密码学正确性。对于 EOA 签名，应使用 `ecrecover`；对于合约签名，应调用 ERC-6492  universal validator。

#### ⚠️ [SEC-11] MEDIUM — Cross-chain 消息签名未绑定链 ID

`packages/cross-chain-sync/src/CrossChainMessenger.ts` 中消息哈希计算未包含 source/destination chain ID，可能导致跨链重放攻击。

### 4.3 权限控制

| 模块 | 检查项 | 状态 |
|------|--------|------|
| Paymaster | `onlyEntryPoint` 修饰器 | ✅ 正确 |
| Paymaster | `onlyOwner` / `onlyTrustedSigner` | ✅ 正确 |
| BridgeRouter | `onlyOwner` for relayer mgmt | ✅ 正确 |
| MultiSig | 治理函数权限 | 🔴 见 SEC-05 |
| HTLC | emergencyWithdraw | 🔴 见 SEC-01 |
| Bundler | API key 认证 | ⚠️ 见 SEC-06 |
| Auth Service | JWT 验证 | ⚠️ 见 SEC-07 |

---

## 5. 跨链能力审计

### 5.1 BridgeRouter.sol

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 重放保护（源链） | ✅ | `nonceUsed[chain][sender][nonce]` |
| 重放保护（目标链） | 🔴 | `completeTransfer` 无 nonce 检查（SEC-04） |
| 签名验证 | ✅ | ECDSA + 多签阈值 + 重复签名检测 |
| 超时机制 | ✅ | `expiry` + `cancelTransfer` |
| 资金隔离 | ⚠️ | ETH 和 ERC-20 资金混合在合约中 |
| 链 ID 绑定 | ✅ | `_hashTransfer` 包含 sourceChain + destinationChain |

### 5.2 HTLC (Atomic Swap)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 哈希锁验证 | ✅ | `keccak256(abi.encodePacked(secret))` |
| 时间锁 | ✅ | `timelock` 检查 |
| 秘密泄露追踪 | ✅ | `revealedSecrets` 映射 |
| 紧急提取 | 🔴 | 无权限控制（SEC-01） |
| 跨链时间差 | ⚠️ | 未强制 T₂ < T₁ 约束（依赖链下逻辑） |

### 5.3 Cross-Chain Sync (TypeScript)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| AtomicSwap 实现 | ✅ | 使用 SHA-256 + CSPRNG |
| 消息传递 | ⚠️ | 缺少链 ID 绑定（SEC-11） |
| 状态同步 | ✅ | BridgeStateManager + 状态机 |
| 流动性池 | ✅ | LiquidityPool 独立模块 |
| 多链适配 | ✅ | EVM / Solana / Bitcoin adapters |

### 5.4 Swap SDK

| 检查项 | 状态 | 说明 |
|--------|------|------|
| MEV 保护 | ✅ | Flashbots / Eden 私有 RPC |
| Slippage 保护 | ✅ | `calculateMinimumReceived` + 波动率自适应 |
| 多 DEX 路由 | ✅ | Uniswap / 1inch / 0x / Curve / Jupiter / PancakeSwap / SushiSwap |
| 跨链 Swap | ✅ | `cross-chain.ts` 模块 |
| 价格影响评估 | ✅ | 4 级严重度分类 |

---

## 6. 合规完整性审计

### 6.1 KYC 模块 (`packages/kyc/`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| KYC 状态生命周期 | ✅ | submitted → pending → verified / rejected |
| 过期管理 | ✅ | `defaultExpiryDays` + `expiresAt` 检查 |
| 加密存储 | ✅ | AES-GCM-256 + 随机 IV |
| GDPR 合规 | ✅ | `deleteUserData` 支持被遗忘权 |
| 制裁名单筛查 | ✅ | OFAC SDN + Mixer + Scam + Risky Exchange |
| 多提供商支持 | ✅ | `providers.ts` 抽象接口 |
| 文件验证 | ✅ | `file-validator.ts` |

**问题 [CMP-01] MEDIUM：** 制裁名单使用硬编码种子数据（`SEED_OFAC` 等），仅 6 个地址。生产环境需要集成 Chainalysis / TRM Labs 实时数据源。当前 `seedLists()` 在 import 时自动执行，但无自动更新机制。

### 6.2 Travel Rule 模块 (`packages/travel-rule/`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| FATF Recommendation 16 格式 | ✅ | IVMS101-compatible JSON schema |
| 阈值检查 | ✅ | 默认 $1,000 USD |
| Originator/Beneficiary 验证 | ✅ | 完整的字段验证管道 |
| VASP 注册表 | ✅ | `VaspRegistry` 接口 + `InMemoryVaspRegistry` |
| 合规检查管道 | ✅ | 8 项检查（TR-001 到 TR-008） |
| 制裁自动拒绝 | ✅ | `rejectSanctioned` 配置 |
| PII 脱敏 | ✅ | `redactPii` 方法 |
| 数据保留策略 | ✅ | 按司法管辖区配置（5-7 年） |
| 合规报告生成 | ✅ | `ComplianceReportGenerator` + 审计追踪 |
| 数据收集器 | ✅ | `TravelRuleDataCollector` 逐步收集 |

**问题 [CMP-02] MEDIUM：** USD 估值使用硬编码 `amountNum * 2000`（占位符 ETH 价格）。生产环境需要集成实时价格预言机。

**问题 [CMP-03] LOW：** `ScreeningProvider` 接口仅有 `MockScreeningProvider` 实现，缺少 Chainalysis / Elliptic / CipherTrace 的实际集成。

### 6.3 Safe Decoder (`packages/safe-decoder/`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| ERC-20 方法解码 | ✅ | approve / transfer / transferFrom |
| Safe 交易编码 | ✅ | 完整的 11 字段编码 |
| delegateCall 检测 | ⚠️ | `operation` 字段存在但未对 delegateCall 发出警告 |

**建议 [CMP-04]：** 对 `operation = 1`（delegateCall）交易应发出安全警告，因为 delegateCall 可修改 Safe 状态。

---

## 7. Gas 优化审计

### 7.1 Gas Estimator (`packages/gas-estimator/`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| EIP-1559 支持 | ✅ | baseFee + priorityFee |
| 多链支持 | ✅ | EVM + Solana |
| 缓存机制 | ✅ | `GasPriceCache` TTL 缓存 |
| Fee History | ✅ | `eth_feeHistory` 集成 |
| 价格预测 | ✅ | `GasPricePrediction` 接口 |

**问题 [GAS-01] MEDIUM：** Paymaster 合约中 Gas 估算使用固定 `21_000` 基准：
```solidity
uint256 estimatedCost = maxFeePerGas * 21_000;
```
实际 UserOp Gas 消耗通常在 100k-300k，21,000 严重低估。这会导致：
- 赞助预算不足
- 每日限额过早耗尽
- Gas 策略判断失误

### 7.2 Gas Sponsorship (`packages/gas-sponsorship/`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 赞助策略 | ✅ | `GasSponsor` + `useGasSponsorship` hook |
| Paymaster 集成 | ✅ | 与 paymaster 模块对接 |
| 类型定义 | ✅ | 完整的 `types.ts` |

### 7.3 Paymaster Gas 策略

| 策略 | maxCostPerOp | maxOpsPerPeriod | 评估 |
|------|-------------|-----------------|------|
| uncapped | 0 | 0 | 无限制，高风险 |
| conservative | 0.005 ETH | 100/h | 合理 |
| moderate | 0.025 ETH | 500/h | 合理 |
| generous | 0.1 ETH | 1000/h | 合理 |

**建议 [GAS-02]：** `conservative` 策略的 0.005 ETH 上限可能不足以覆盖复杂 UserOp（如 NFT mint + transfer）。建议根据链和操作类型动态调整。

---

## 8. 交易管理审计

### 8.1 Batch Transaction (`packages/batch-transaction/`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 批量构建 | ✅ | `batch.ts` + `executor.ts` |
| 操作类型 | ✅ | approve / swap / transfer / custom |
| React Hook | ✅ | `useBatchTransaction` |
| 原子执行 | ✅ | 单笔交易内批量 |

### 8.2 Bundler 交易管理

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Nonce 管理 | ✅ | UserOp nonce + pool sender count |
| 状态追踪 | ✅ | Pending → Submitted → Included / Reverted / Expired |
| 失败重试 | ✅ | 最多 3 次重试 → reject |
| 过期清理 | ✅ | 5 分钟过期 + 60 秒清理间隔 |
| 优先级排序 | ✅ | gasPrice × reputation × 1000 |
| Bundle 构建 | ✅ | 最多 128 ops/bundle，2s 间隔 |

### 8.3 Payment Flow (`packages/payment-flow/`)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 支付状态机 | ✅ | `PaymentStateMachine` |
| 批量支付 | ✅ | `BatchPayment` |
| 支付路由 | ✅ | `PaymentRouter` |
| 报价聚合 | ✅ | `QuoteAggregator` |
| 历史记录 | ✅ | `PaymentHistory` |
| React Hooks | ✅ | `usePayment` / `usePaymentStatus` / `usePaymentHistory` |

---

## 9. 集成测试审计

### 9.1 测试覆盖概览

| 模块 | 单元测试 | 集成测试 | E2E 测试 | Mock 质量 |
|------|----------|----------|----------|-----------|
| paymaster | ✅ 4 test files | ⚠️ 有限 | ❌ | ⚠️ 中等 |
| bundler | ✅ 3 test files | ⚠️ 有限 | ❌ | ✅ 良好 |
| aa-sdk | ✅ 3 test files | ✅ e2e-integration | ❌ | ✅ 良好 |
| gas-estimator | ✅ 1 test file | ❌ | ❌ | ⚠️ 中等 |
| swap-sdk | ✅ 5 test files | ✅ execution/quoter | ❌ | ✅ 良好 |
| cross-chain-sync | ✅ 5 test files | ⚠️ 有限 | ❌ | ⚠️ 中等 |
| cross-chain-contracts | ✅ 1 test file | ❌ | ❌ | ⚠️ 中等 |
| batch-transaction | ✅ 3 test files | ✅ onchain | ❌ | ✅ 良好 |
| kyc | ✅ 2 test files | ❌ | ❌ | ⚠️ 中等 |
| travel-rule | ❌ | ❌ | ❌ | ❌ 无测试 |
| payment-flow | ✅ 1 test file | ❌ | ❌ | ⚠️ 中等 |
| pay-ui | ✅ 3 test files | ❌ | ❌ | ⚠️ 中等 |
| deposit | ✅ 1 test file | ❌ | ❌ | ⚠️ 中等 |
| erc6492 | ❌ | ❌ | ❌ | ❌ 无测试 |
| safe-decoder | ❌ | ❌ | ❌ | ❌ 无测试 |
| bundler-service | ❌ | ❌ | ❌ | ❌ 无测试 |
| auth-service | ❌ | ❌ | ❌ | ❌ 无测试 |

### 9.2 关键测试缺口

**问题 [TEST-01] HIGH：** `travel-rule` 模块（合规核心）完全没有测试文件。作为 FATF 合规引擎，必须有完整的测试覆盖。

**问题 [TEST-02] HIGH：** `erc6492` 模块无测试。签名验证是安全关键路径。

**问题 [TEST-03] MEDIUM：** `bundler-service` (apps/) 无测试。作为生产服务入口点，需要集成测试。

**问题 [TEST-04] MEDIUM：** 跨链模块（cross-chain-contracts + cross-chain-sync）缺少端到端跨链测试。HTLC 和 BridgeRouter 的 Solidity 测试仅有 1 个文件。

**问题 [TEST-05] MEDIUM：** Mock 质量参差不齐。`MockScreeningProvider` 仅支持简单的 risky/sanctioned 标记，缺少边界情况测试。

---

## 10. 风险矩阵总览

### Critical（必须修复）

| ID | 模块 | 问题 | 影响 |
|----|------|------|------|
| SEC-01 | HTLC.sol | emergencyWithdraw 无权限 | 资金可被盗取 |
| SEC-02 | Paymaster | sender 提取逻辑错误 | 赞助策略全部失效 |
| SEC-03 | VerifyingPaymaster | postOp 重放标记时机 | 同 bundle 签名重放 |

### High（上线前修复）

| ID | 模块 | 问题 | 影响 |
|----|------|------|------|
| SEC-04 | BridgeRouter | completeTransfer 无重放保护 | 跨链资金超发 |
| SEC-05 | MultiSig | 治理函数无多签保护 | 多签安全模型破坏 |
| SEC-06 | Bundler | SKIP_AUTH 环境变量 | 生产未授权访问 |
| SEC-07 | Auth Service | middleware 未验证 token | 认证绕过 |
| SEC-08 | Bundler | Rate limiter 内存泄漏 + IP 伪造 | DoS |
| SEC-09 | Swap SDK | MEV nonce 默认 0 | 交易冲突 |
| TEST-01 | Travel Rule | 无测试 | 合规逻辑未验证 |

### Medium（尽快修复）

| ID | 模块 | 问题 |
|----|------|------|
| AA-01 | Paymaster | validatePaymasterUserOp 签名不兼容 v0.7 |
| AA-02 | Paymaster | _extractPaymasterContext 脆弱 |
| AA-03 | TokenPaymaster | 静态价格，无预言机 |
| ERC-01 | erc6492 | 编码格式不符合 ABI 标准 |
| ERC-02 | erc6492 | 缺少链上验证 |
| SEC-10 | erc6492 | 签名未进行密码学验证 |
| SEC-11 | cross-chain-sync | 消息签名未绑定链 ID |
| GAS-01 | Paymaster | Gas 估算使用 21,000 固定值 |
| CMP-01 | KYC | 制裁名单仅 6 个硬编码地址 |
| CMP-02 | Travel Rule | USD 估值使用硬编码价格 |
| TEST-02 | erc6492 | 无测试 |
| TEST-03 | bundler-service | 无测试 |

---

## 11. 建议与修复优先级

### P0 — 立即修复（阻塞上线）

1. **[SEC-01]** HTLC：移除 `emergencyWithdraw` 或添加 `onlyOwner`
2. **[SEC-02]** Paymaster：修复 `_extractSender`，从 UserOp 结构中提取 sender
3. **[SEC-03]** VerifyingPaymaster：在 validatePaymasterUserOp 中标记已用签名（改为 non-view）
4. **[SEC-04]** BridgeRouter：在 `completeTransfer` 中添加 nonce 重放检查

### P1 — 上线前修复

5. **[SEC-05]** MultiSig：治理函数通过 proposal 流程
6. **[SEC-06]** Bundler：生产环境禁用 `BUNDLER_SKIP_AUTH`
7. **[SEC-07]** Auth Service：middleware 中添加 JWT 验证
8. **[AA-01]** Paymaster：更新接口签名以兼容 ERC-4337 v0.7
9. **[TEST-01]** Travel Rule：添加完整单元测试和集成测试
10. **[TEST-02]** erc6492：添加签名验证测试

### P2 — 尽快修复

11. **[GAS-01]** Paymaster：使用实际 Gas 估算替代 21,000 固定值
12. **[ERC-01/02]** erc6492：修复编码格式 + 添加链上验证
13. **[CMP-01]** KYC：集成实时制裁名单数据源
14. **[CMP-02]** Travel Rule：集成实时价格预言机
15. **[SEC-09]** Swap SDK：移除 nonce 默认值，强制要求 publicClient

### P3 — 持续改进

16. **[AA-03]** TokenPaymaster：集成 Chainlink/Pyth 价格预言机
17. **[ERC-03]** aa-sdk：添加 EIP-5792 支持
18. **[CMP-04]** safe-decoder：delegateCall 安全警告
19. **[TEST-03/04/05]** 补充 bundler-service / 跨链 / Mock 测试

---

## 附录 A：模块间依赖关系

```
aa-sdk → bundler, paymaster
payment-flow → swap-sdk, batch-transaction, gas-sponsorship
pay-ui → payment-flow, onramp-sdk, swap-sdk, deposit
bundler-service → bundler, gas-estimator
gas-sponsorship → paymaster
cross-chain-sync → cross-chain-contracts
swap-sdk → gas-estimator (间接)
kyc → (独立)
travel-rule → kyc (逻辑依赖)
```

## 附录 B：审计工具与方法

- 手动代码审查（逐文件）
- ERC 标准规范对照（EIP-4337, EIP-6492, EIP-5792, EIP-712）
- 安全模式检查（SWC Registry / DASP Top 10）
- 合规框架对照（FATF R16, OFAC SDN, GDPR）

---

*报告生成时间：2026-06-15T04:37:00Z*
*审计代理：DeFi/支付/合规模块审计子代理*
