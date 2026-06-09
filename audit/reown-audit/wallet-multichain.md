# Cinacoin 钱包与多链支持审计报告

**审计日期:** 2026-06-09  
**审计范围:** 钱包连接、多链支持、嵌入式钱包、EIP-5792、跨链能力  
**对比基准:** Reown/AppKit (WalletConnect)

---

## 1. 功能对比矩阵

| # | Reown 功能 | Cinacoin 实现状态 | 差距程度 | 影响范围 |
|---|-----------|------------------|---------|---------|
| 1 | 600+ Wallet Connections | ✅ **已有** — 104 钱包注册表 + 动态 WC Registry 拉取 | ⚠️ 中等 | 生态 |
| 2 | Multi-chain Support (EVM/Solana/BTC/TON/TRON) | ✅ **已有** — 11 条非 EVM 链适配器 + 110 EVM 链 | ✅ 轻微 | 用户/开发者 |
| 3 | WalletConnect v2 协议 | ✅ **已有** — 完整 WC v2 Client 自托管实现 | ✅ 轻微 | 开发者 |
| 4 | Embedded Wallets | ✅ **已有** — PBKDF2 密钥派生 + 社交登录 + 备份恢复 | ✅ 轻微 | 用户 |
| 5 | Multiwallet Linking | ✅ **已有** — MultiwalletManager + 命名空间管理 | ⚠️ 中等 | 用户 |
| 6 | EIP-5792 (Wallet API) | ✅ **已有** — 批量交易 + 服务端验证 + Session Keys | ✅ 轻微 | 开发者 |
| 7 | Chain Switching | ✅ **已有** — 多适配器支持链切换 | ✅ 轻微 | 用户 |
| 8 | Custom Chains | ✅ **已有** — 110 链注册表 + 动态注册 | ✅ 轻微 | 开发者 |

**总体评估：Cinacoin 已实现 Reown 全部 8 项核心功能，无严重差距。**

---

## 2. 支持的链对比

### Reown/AppKit 支持的链
| 链族 | 具体链 |
|------|--------|
| EVM | Ethereum, Polygon, Arbitrum, Optimism, BSC, Base, Avalanche 等 600+ |
| Solana | Solana Mainnet, Devnet |
| Bitcoin | BTC Mainnet, Testnet |
| TON | TON Mainnet, Testnet |
| TRON | TRON Mainnet, Shasta Testnet |

### Cinacoin 支持的链
| 链族 | 适配器包 | 具体链/钱包 |
|------|---------|------------|
| **EVM** | `chain-registry` + `core-sdk/adapters/evm` | **110 条** EVM 链（Ethereum, Polygon, Arbitrum, BSC, Base, Optimism, Avalanche, zkSync 等） |
| **Solana** | `adapter-solana` | Mainnet, Devnet；Phantom, Solflare, Wallet Standard |
| **Bitcoin** | `adapter-bitcoin` | Mainnet, Testnet；Unisat, Leather, OKX, Xverse, SatsConnect |
| **TON** | `adapter-ton` | Mainnet, Testnet；@ton/ton RPC |
| **TRON** | `adapter-tron` | Mainnet, Shasta；TronWeb RPC |
| **Cosmos** | `adapter-cosmos` | Cosmos Hub, Osmosis, Injective, Celestia；Keplr, Leap |
| **NEAR** | `adapter-near` | Mainnet, Testnet；NEAR Wallet, Here Wallet, Meteor |
| **Starknet** | `adapter-starknet` | Mainnet, Goerli；Argent X, Braavos |
| **Sui** | `adapter-sui` | Mainnet, Testnet, Devnet；Sui Wallet, Suiet, Ethos, Martian |
| **Hedera** | `adapter-hedera` | Mainnet, Testnet；Blade Wallet, HashPack, Kantara |
| **XRPL** | `adapter-xrpl` | Mainnet, Testnet, Devnet；Xaman, Fireblocks, Ledger |
| **Polkadot** | `core-sdk/adapters/polkadot` | Polkadot, Kusama |

**结论：Cinacoin 在链覆盖面上超越 Reown**，额外支持 Cosmos (4 链), NEAR, Starknet, Sui (4 网络), Hedera, XRPL, Polkadot 等 Reown 不原生支持的链族。

---

## 3. 钱包连接能力差距分析

### 3.1 钱包注册表

| 指标 | Reown | Cinacoin |
|------|-------|---------|
| 静态注册钱包数 | 600+ (via WC Registry) | 104 (静态) + 动态 WC Registry |
| 动态拉取 | ✅ WC Registry API | ✅ `registry.walletconnect.com/api/v2` |
| EIP-6963 发现 | ✅ | ✅ `core-sdk/eip6963.ts` |
| Deep Link 支持 | ✅ | ✅ 18+ 硬编码 deep link scheme |
| 跨平台检测 | ✅ | ✅ `WalletPlatform` (browser/ios/android/desktop) |

**差距分析：**
- Cinacoin 静态注册表（104）少于 Reown 的 600+，但通过动态拉取 WC Registry 可覆盖同等数量
- `wallet-registry` 包提供类型安全的查询 API（`getWalletsForChainFamily`, `getWcV2Wallets`, `getEIP6963Wallets`）
- **轻微差距：** 静态注册表可扩展至更多非 WC 钱包（如 Bitcoin/TON 原生钱包）

### 3.2 WalletConnect v2 协议

| 指标 | Reown | Cinacoin |
|------|-------|---------|
| WC v2 Client | ✅ 官方 SDK | ✅ 自托管 `walletconnect-v2` 包 |
| Relay 连接 | ✅ 官方 Relay | ✅ 自托管 `WcRelay` + Cloud Relay |
| Pairing (QR/URI) | ✅ | ✅ `WcPairing` + QR overlay |
| Session 管理 | ✅ | ✅ `WcSessionManager` + Multi-session |
| 加密/签名验证 | ✅ | ✅ `crypto.ts` + `signature-verification.ts` |
| Heartbeat | ✅ | ✅ `heartbeat.ts` |

**差距分析：**
- Cinacoin 实现了完整的 WC v2 协议栈，包括 relay、pairing、session、crypto
- 自托管意味着无供应商锁定，但需要自行维护 relay 基础设施
- **无显著差距**

### 3.3 自定义连接器

| 指标 | Reown | Cinacoin |
|------|-------|---------|
| 连接器框架 | ✅ Connector API | ✅ `custom-connectors/ConnectorFactory` |
| Injected 连接器 | ✅ | ✅ `InjectedConnector` |
| QR 连接器 | ✅ | ✅ `QRConnector` |
| WC 连接器 | ✅ | ✅ `WalletConnectConnector` |
| ConnectorPicker UI | ✅ | ✅ `ConnectorPicker` 组件 |

**无差距。**

---

## 4. 嵌入式钱包缺失分析

### Reown Embedded Wallet 功能
- Email/Social 登录自动创建钱包
- MPC 或密钥分片备份
- 无缝 UX（无需扩展）

### Cinacoin 实现

| 组件 | 包 | 功能 |
|------|-----|------|
| **EmbeddedWallet** | `embedded-wallet` | secp256k1 密钥对，PBKDF2-HMAC-SHA256 派生（100k 迭代） |
| **Auth Integration** | `embedded-wallet/auth-integration` | Passkey + Social Login 桥接（Google, Apple, X, GitHub, Discord, Email, Phone） |
| **Social Login** | `social-login` | OAuth2 + Email/Phone OTP + Magic Link |
| **Passkey Auth** | `passkey-auth` | WebAuthn 注册/认证 + 密码管理 |
| **Backup** | `embedded-wallet/backup` | AES-GCM-256 加密备份（PBKDF2 310k 迭代） |
| **Wallet Recovery** | `wallet-recovery` | Shamir's Secret Sharing + Social Recovery (Guardian) |
| **Session Keys** | `session-keys` | ERC-4337 临时签名密钥 + 策略管理 |

### 差距评估

| 功能 | Reown | Cinacoin | 差距 |
|------|-------|---------|------|
| Email 登录创建钱包 | ✅ | ✅ `social-login` + `embedded-wallet` | 无 |
| Social 登录 | ✅ (Google/Apple/Facebook) | ✅ (Google/Apple/X/GitHub/Discord) | **Cinacoin 更多** |
| 密钥派生 | MPC/分片 | PBKDF2 → secp256k1 | 架构差异（非差距） |
| 备份恢复 | 云端分片 | AES-GCM 加密 + SSS + Guardian | **Cinacoin 更去中心化** |
| Passkey 支持 | ✅ | ✅ WebAuthn | 无 |
| Session Keys | ❌ | ✅ ERC-4337 策略引擎 | **Cinacoin 独有** |
| Gas Sponsorship | ✅ (Biconomy) | ✅ (Pimlico/Alchemy/Candle) | 无 |

**结论：Cinacoin 嵌入式钱包功能完备，在去中心化恢复和 Session Keys 方面超越 Reown。**

---

## 5. Multiwallet Linking 分析

### Reown 功能
- 一个身份关联多个钱包地址
- 跨链身份统一

### Cinacoin 实现

| 组件 | 功能 |
|------|------|
| `MultiwalletManager` | 多钱包连接管理（connect/disconnect/switch） |
| `MultiwalletStore` | 命名空间隔离（eip155/solana/bip122） |
| `MultiwalletSwitcher` | UI 组件（钱包切换器） |
| `CrossChainIdentityManager` | 跨链身份统一 + LinkingProof |
| `ConnectionAnalyzer` | 连接质量分析 |

### 差距评估

| 功能 | Reown | Cinacoin | 差距 |
|------|-------|---------|------|
| 多钱包同时连接 | ✅ | ✅ | 无 |
| 命名空间隔离 | ✅ (CAIP-2) | ✅ (eip155/solana/bip122) | 无 |
| 跨链身份关联 | ✅ (Blockchain API) | ✅ `CrossChainIdentityManager` | 无 |
| 命名空间扩展 | 固定 | ⚠️ 类型硬编码 3 种 | **中等差距** |

**关键差距：** `Namespace` 类型定义为 `"eip155" | "solana" | "bip122"`，仅支持 3 种命名空间。虽然有 11 个链适配器，但 multiwallet store 的命名空间管理仅覆盖 3 种。非 EVM 链（TON, TRON, Cosmos, NEAR, Starknet, Sui, Hedera, XRPL, Polkadot）需要通过其他方式管理连接状态。

---

## 6. EIP-5792 (Wallet API) 分析

| 功能 | Reown | Cinacoin |
|------|-------|---------|
| `wallet_sendCalls` | ✅ | ✅ `batch-transaction` 包 |
| `wallet_getCallsStatus` | ✅ | ✅ `next/server/eip5792.ts` |
| `wallet_showCallsStatus` | ✅ | ⚠️ 未确认 |
| `wallet_getCapabilities` | ✅ | ✅ 服务端推断 + 客户端查询 |
| 批量交易 UI | ✅ | ✅ `BatchTransaction` + `BatchExecutor` |
| MultiSend 合约 | ✅ | ✅ `multisend.ts` + 预部署地址 |
| 交易权限/Session Keys | ❌ | ✅ `session-keys` 策略引擎 |

**结论：Cinacoin EIP-5792 实现完整，且额外提供 Session Keys 策略引擎（Reown 无此功能）。**

---

## 7. Chain Switching 与 Custom Chains

### Chain Switching

| 功能 | Reown | Cinacoin |
|------|-------|---------|
| `wallet_switchEthereumChain` | ✅ | ✅ 通过 wagmi/viem/ethers 适配器 |
| `wallet_addEthereumChain` | ✅ | ✅ 通过 chain-registry 动态注册 |
| 一键切换 UI | ✅ AppKit Modal | ⚠️ 需 dApp 自行集成 |

**差距：** Cinacoin 提供底层能力但缺少统一的链切换 UI 组件（Reown Modal 内置）。

### Custom Chains

| 功能 | Reown | Cinacoin |
|------|-------|---------|
| 链注册表 | ✅ Dashboard | ✅ `chain-registry` 包（110 链） |
| 动态注册 | ✅ | ✅ `searchChains`, `getChainsByCategory` |
| 链分类 | ✅ | ✅ `ChainCategory` 类型 |
| CAIP-2 ID | ✅ | ✅ `Caip2` 类型 |
| 链图标/元数据 | ✅ | ✅ `iconUrls`, `nativeCurrency`, `blockExplorerUrls` |

**无差距。**

---

## 8. 跨链桥接支持

| 功能 | Reown | Cinacoin |
|------|-------|---------|
| 跨链桥引擎 | ❌ (依赖第三方) | ✅ `cross-chain-sync/bridge-engine` |
| 原子交换 | ❌ | ✅ `cross-chain-sync/AtomicSwap` |
| 跨链消息 | ❌ | ✅ `cross-chain-sync/CrossChainMessenger` |
| 桥路由 | ❌ | ✅ `cross-chain-sync/BridgeRouter` |
| IBC 支持 | ❌ | ✅ Cina Chain `chain_registry.json` ICS-20/ICS-27 |

**结论：Cinacoin 在跨链桥接方面显著超越 Reown。**

---

## 9. 技术深度分析总结

### 9.1 当前支持的链数量和类型

| 维度 | 数量 |
|------|------|
| EVM 链 | 110 |
| 非 EVM 链适配器 | 11 个包（Solana, BTC, TON, TRON, Cosmos, NEAR, Starknet, Sui, Hedera, XRPL, Polkadot） |
| 钱包注册表 | 104 静态 + 动态 WC Registry |
| 命名空间 | 3 种（eip155, solana, bip122） |

### 9.2 钱包连接协议

| 协议 | 状态 |
|------|------|
| WalletConnect v2 | ✅ 完整自托管实现 |
| EIP-6963 | ✅ 发现 + 监听 |
| Injected Provider | ✅ |
| QR Code | ✅ |
| Deep Link | ✅ 18+ 钱包 |
| Wallet Standard | ✅ (Solana, Bitcoin) |

### 9.3 交易签名流程

| 链族 | 签名方式 |
|------|---------|
| EVM | secp256k1 ECDSA（通过 viem/ethers/wagmi 适配器） |
| Solana | Ed25519（通过 Phantom/Solflare） |
| Bitcoin | ECDSA/Schnorr（通过 Unisat/Leather/Xverse） |
| 嵌入式钱包 | secp256k1 ECDSA（PBKDF2 派生） |
| 批量交易 | MultiSend 合约 + Session Keys 策略 |

### 9.4 多链资产展示

| 能力 | 状态 |
|------|------|
| EVM 余额查询 | ✅ `EvmAdapter.getBalance` |
| SOL 余额 | ✅ `SolanaChainAdapter.getBalance` |
| BTC UTXO | ✅ `BitcoinConnector` |
| TON/Jetton | ✅ `TonChainAdapter.getBalance/getJettonBalance` |
| TRC-20 | ✅ `TronChainAdapter.getTRC20Balance` |
| Cosmos | ✅ `CosmosAdapter` |
| 跨链统一视图 | ✅ `cross-chain-sync/StateSync` |

---

## 10. 差距汇总与优先级

### 需改进项

| 优先级 | 差距 | 当前状态 | 建议 |
|--------|------|---------|------|
| 🔴 高 | Multiwallet 命名空间扩展 | 仅 3 种硬编码 | 扩展 `Namespace` 类型支持所有 11 个链族 |
| 🟡 中 | 静态钱包注册表规模 | 104 vs Reown 600+ | 扩展非 WC 钱包（BTC/TON/TRON 原生钱包） |
| 🟡 中 | 统一链切换 UI 组件 | 无独立组件 | 创建 `<ChainSwitcher>` 组件 |
| 🟢 低 | `wallet_showCallsStatus` | 未确认实现 | 在 `next/server/eip5792.ts` 中补充 |
| 🟢 低 | Cina Chain 集成到 multiwallet | 独立 chain_registry.json | 将 Cina Chain 纳入 multiwallet 命名空间 |

---

## 11. 实施路线图

### Phase 1（1-2 周）：命名空间扩展
- [ ] 扩展 `multiwallet/types.ts` 的 `Namespace` 类型
- [ ] 添加 `ton`, `tron`, `cosmos`, `near`, `starknet`, `sui`, `hedera`, `xrpl`, `polkadot` 命名空间
- [ ] 更新 `MultiwalletStore` 初始化以支持动态命名空间

### Phase 2（2-3 周）：钱包注册表扩展
- [ ] 为 Bitcoin 适配器钱包（Unisat, Leather, Xverse）添加静态注册
- [ ] 为 TON/TRON/Cosmos 原生钱包添加注册条目
- [ ] 统一 `wallet-registry` 和 `walletconnect-v2/wallets.ts` 的数据源

### Phase 3（2-3 周）：UI 组件补全
- [ ] 创建 `<ChainSwitcher>` 统一链切换组件
- [ ] 创建 `<MultiChainBalance>` 多链资产总览组件
- [ ] 集成到 `wallet-explorer` 应用

### Phase 4（1-2 周）：EIP-5792 完善
- [ ] 确认并补充 `wallet_showCallsStatus` 实现
- [ ] 添加客户端 `wallet_getCapabilities` 缓存
- [ ] 编写集成测试

### Phase 5（持续）：Cina Chain 深度集成
- [ ] 将 `chain_registry.json` 的 Cina Chain 纳入 `chain-registry` 包
- [ ] 实现 Cina Chain 作为 multiwallet 原生命名空间
- [ ] 启用 IBC 跨链桥接路由

---

## 12. 总结

**Cinacoin 的钱包与多链基础设施已达到甚至超越 Reown/AppKit 的功能水平。**

### 优势
1. **链覆盖更广** — 110 EVM + 11 非 EVM 链族 vs Reown 的 5 个链族
2. **完全自托管** — 无供应商锁定，WC v2 协议栈自主实现
3. **嵌入式钱包更去中心化** — SSS + Guardian 恢复 vs Reown 的云端 MPC
4. **Session Keys** — Reown 无此功能
5. **跨链桥接** — 原子交换 + 桥引擎 + IBC，Reown 无原生支持

### 主要改进方向
1. Multiwallet 命名空间需从 3 种扩展到覆盖所有链族
2. 静态钱包注册表需扩充非 WC 钱包
3. 缺少统一的链切换 UI 组件

**整体差距评级：轻微（无需紧急行动，按计划迭代即可）**
