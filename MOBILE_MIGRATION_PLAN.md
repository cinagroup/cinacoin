# 移动端迁移规划

> **日期**: 2026-06-14  
> **状态**: 规划中  
> **目标**: 统一移动端 SDK 架构，与 Web 端 AppKit 对齐

---

## 📱 现状分析

### 当前 SDK 结构

| 平台        | 包名                      | 依赖                            | 状态            |
| ----------- | ------------------------- | ------------------------------- | --------------- |
| **iOS**     | `packages/ios-swift`      | WalletConnectSwiftV2 1.13.0     | ✅ 基础功能完成 |
| **Android** | `packages/android-kotlin` | WalletConnect Kotlin SDK 1.19.2 | ✅ 基础功能完成 |
| **Flutter** | `packages/flutter-dart`   | walletconnect_flutter_v2 2.2.0  | ✅ 基础功能完成 |

### 现有功能

- ✅ WalletConnect v2 连接
- ✅ EVM 链支持 (Ethereum, Polygon, Arbitrum, Base, Optimism, BSC)
- ✅ 签名和交易
- ✅ 会话管理
- ✅ 链切换

### 缺失功能

- ❌ 统一品牌配置 (类似 Web 端 `@cinacoin/appkit-config`)
- ❌ 统一主题系统
- ❌ 预构建 UI 组件
- ❌ 社交登录集成
- ❌ 邮箱登录集成
- ❌ 智能账户 (ERC-4337)
- ❌ 跨链功能

---

## 🎯 迁移目标

### 阶段一：统一配置层 (2-3 周)

创建类似 Web 端 `@cinacoin/appkit-config` 的配置包：

| 平台    | 包名                     | 职责                   |
| ------- | ------------------------ | ---------------------- |
| iOS     | `CinacoinAppKitConfig`   | 链配置、主题、钱包推荐 |
| Android | `cinacoin-appkit-config` | 链配置、主题、钱包推荐 |
| Flutter | `cinacoin_appkit_config` | 跨平台配置共享         |

**交付物：**

- 统一的链注册表 (与 Web 端对齐)
- Cinacoin 品牌主题 (深色/浅色)
- 推荐钱包列表
- 项目 ID 和元数据管理

### 阶段二：UI 组件库 (3-4 周)

创建预构建的 UI 组件：

#### iOS (SwiftUI)

```swift
// CinacoinConnectButton
CinacoinConnectButton(style: .default)

// CinacoinConnectSheet
.sheet(isPresented: $showConnect) {
    CinacoinConnectSheet()
}

// CinacoinAccountCard
CinacoinAccountCard(address: address, chain: chain)
```

#### Android (Jetpack Compose)

```kotlin
// CinacoinConnectButton
CinacoinConnectButton(onClick = { /* ... */ })

// CinacoinConnectDialog
CinacoinConnectDialog(visible = showDialog)

// CinacoinAccountCard
CinacoinAccountCard(address = address, chain = chain)
```

#### Flutter

```dart
// CinacoinConnectButton
CinacoinConnectButton(onPressed: () {})

// CinacoinConnectSheet
showModalBottomSheet(
  builder: (_) => CinacoinConnectSheet(),
)

// CinacoinAccountCard
CinacoinAccountCard(address: address, chain: chain)
```

### 阶段三：高级功能 (4-6 周)

| 功能                           | 优先级 | 依赖         |
| ------------------------------ | ------ | ------------ |
| 社交登录 (Google/Apple/GitHub) | P1     | Auth Service |
| 邮箱登录                       | P1     | Auth Service |
| 智能账户 (ERC-4337)            | P2     | Bundler 集成 |
| 跨链桥接                       | P2     | 跨链合约     |
| 生物识别认证                   | P3     | 平台原生 API |

### 阶段四：Demo 应用迁移 (2 周)

更新 `apps/demo-flutter` 使用新的配置层和 UI 组件。

---

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Demo Apps / 客户应用                       │
├─────────────────────────────────────────────────────────────┤
│  UI Components (SwiftUI / Compose / Flutter Widgets)        │
│  - ConnectButton, ConnectSheet, AccountCard, ChainSelector  │
├─────────────────────────────────────────────────────────────┤
│  Config Layer (CinacoinAppKitConfig)                        │
│  - Chains, Theme, Wallets, Metadata                         │
├─────────────────────────────────────────────────────────────┤
│  Core SDK (CinacoinSDK)                                     │
│  - WalletConnect, Signing, Transactions, Sessions           │
├─────────────────────────────────────────────────────────────┤
│  Platform Adapters                                          │
│  - EVM, Solana, Bitcoin, Cosmos, etc.                       │
└─────────────────────────────────────────────────────────────┘
```

### 与 Web 端对齐

| Web 端                    | iOS                          | Android                      | Flutter                      |
| ------------------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| `@cinacoin/appkit-config` | `CinacoinAppKitConfig`       | `cinacoin-appkit-config`     | `cinacoin_appkit_config`     |
| `@cinacoin/appkit-react`  | `CinacoinAppKitUI`           | `cinacoin-appkit-ui`         | `cinacoin_appkit_ui`         |
| `createCinacoinAppKit()`  | `CinacoinAppKit.configure()` | `CinacoinAppKit.configure()` | `CinacoinAppKit.configure()` |
| `useCinacoinWallet()`     | `@CinacoinWallet`            | `cinacoinWallet()`           | `useCinacoinWallet()`        |

---

## 📋 详细任务清单

### iOS (Swift)

- [ ] 创建 `CinacoinAppKitConfig` 模块
  - [ ] `ChainRegistry.swift` — 链配置
  - [ ] `CinacoinTheme.swift` — 主题系统
  - [ ] `WalletRegistry.swift` — 钱包推荐
  - [ ] `AppKitConfig.swift` — 配置入口
- [ ] 创建 `CinacoinAppKitUI` 模块
  - [ ] `CinacoinConnectButton.swift`
  - [ ] `CinacoinConnectSheet.swift`
  - [ ] `CinacoinAccountCard.swift`
  - [ ] `CinacoinChainSelector.swift`
- [ ] 更新 `CinacoinSDK`
  - [ ] 集成配置层
  - [ ] 添加社交登录
  - [ ] 添加邮箱登录
- [ ] 更新示例应用

### Android (Kotlin)

- [ ] 创建 `cinacoin-appkit-config` 模块
  - [ ] `ChainRegistry.kt` — 链配置
  - [ ] `CinacoinTheme.kt` — 主题系统
  - [ ] `WalletRegistry.kt` — 钱包推荐
  - [ ] `AppKitConfig.kt` — 配置入口
- [ ] 创建 `cinacoin-appkit-ui` 模块
  - [ ] `CinacoinConnectButton.kt`
  - [ ] `CinacoinConnectDialog.kt`
  - [ ] `CinacoinAccountCard.kt`
  - [ ] `CinacoinChainSelector.kt`
- [ ] 更新 `CinacoinSDK`
  - [ ] 集成配置层
  - [ ] 添加社交登录
  - [ ] 添加邮箱登录
- [ ] 更新示例应用

### Flutter (Dart)

- [ ] 创建 `cinacoin_appkit_config` 包
  - [ ] `lib/src/chains.dart` — 链配置
  - [ ] `lib/src/theme.dart` — 主题系统
  - [ ] `lib/src/wallets.dart` — 钱包推荐
  - [ ] `lib/src/config.dart` — 配置入口
- [ ] 创建 `cinacoin_appkit_ui` 包
  - [ ] `lib/src/connect_button.dart`
  - [ ] `lib/src/connect_sheet.dart`
  - [ ] `lib/src/account_card.dart`
  - [ ] `lib/src/chain_selector.dart`
- [ ] 更新 `cinacoin` SDK
  - [ ] 集成配置层
  - [ ] 添加社交登录
  - [ ] 添加邮箱登录
- [ ] 更新 `apps/demo-flutter`

---

## 🔗 依赖关系

```
Web AppKit Config ──────────────────────────────────────────┐
                                                            │
iOS AppKit Config ──────── 共享链注册表 ◄───────────────────┤
                                                            │
Android AppKit Config ──── 共享链注册表 ◄───────────────────┤
                                                            │
Flutter AppKit Config ──── 共享链注册表 ◄───────────────────┘
```

### 链注册表同步

建议创建一个中央 JSON 配置文件，所有平台共享：

```json
// packages/chain-registry/chains.json
{
  "evm": {
    "1": {
      "name": "Ethereum",
      "symbol": "ETH",
      "decimals": 18,
      "rpcUrl": "https://eth.llamarpc.com",
      "explorerUrl": "https://etherscan.io",
      "iconUrl": "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg"
    }
  }
}
```

---

## 📅 时间线

| 阶段       | 时间        | 里程碑                   |
| ---------- | ----------- | ------------------------ |
| **阶段一** | 第 1-3 周   | 配置层完成，链注册表同步 |
| **阶段二** | 第 4-7 周   | UI 组件库完成            |
| **阶段三** | 第 8-13 周  | 高级功能完成             |
| **阶段四** | 第 14-15 周 | Demo 应用迁移完成        |

**总计**: 约 15 周 (3.5 个月)

---

## 🚀 优先级建议

### P0 (立即执行)

1. 统一链注册表 (与 Web 端对齐)
2. 配置层基础架构
3. 品牌主题系统

### P1 (高优先级)

1. 预构建 UI 组件
2. 社交登录集成
3. 邮箱登录集成

### P2 (中优先级)

1. 智能账户支持
2. 跨链功能
3. 生物识别认证

### P3 (低优先级)

1. 离线模式
2. 硬件钱包支持
3. NFT 管理

---

## 📝 注意事项

1. **向后兼容**: 保持现有 API 稳定，新配置层作为可选增强
2. **平台特性**: 尊重各平台的设计规范 (HIG / Material / Flutter)
3. **性能**: 移动端资源有限，注意包大小和内存占用
4. **安全**: 敏感数据使用平台安全存储 (Keychain / Keystore)
5. **测试**: 每个平台需要完整的单元测试和 UI 测试

---

## 🔧 技术决策

### 1. 配置共享方式

- **选项 A**: 中央 JSON 文件，各平台解析
- **选项 B**: 各平台独立实现，手动同步
- **建议**: 选项 A，减少维护成本

### 2. UI 框架

- **iOS**: SwiftUI (iOS 15+)
- **Android**: Jetpack Compose (API 26+)
- **Flutter**: 原生 Flutter Widgets

### 3. 状态管理

- **iOS**: Combine / Observation framework
- **Android**: Kotlin Flow / StateFlow
- **Flutter**: Riverpod / BLoC

### 4. 网络层

- 统一使用 WalletConnect v2 协议
- 可选集成 Reown Cloud 或自建 Relay

---

## 📚 参考资源

- [WalletConnect Swift SDK](https://github.com/WalletConnect/WalletConnectSwiftV2)
- [WalletConnect Kotlin SDK](https://github.com/WalletConnect/WalletConnectKotlinV2)
- [WalletConnect Flutter SDK](https://github.com/WalletConnect/WalletConnectFlutterV2)
- [Reown AppKit Web](https://docs.reown.com/appkit/overview)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)

---

_文档版本: 1.0_  
_最后更新: 2026-06-14_
