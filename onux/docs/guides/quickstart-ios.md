# 快速开始 — iOS

> 5 分钟从零到钱包连接。适用于 iOS Swift SDK。

## 概述

本指南帮助你在 iOS 应用中快速集成 Cinacoin SDK，实现：

- ✅ 钱包连接（MetaMask、Trust Wallet、Coinbase Wallet 等）
- ✅ 账户状态管理
- ✅ 消息签名与交易发送
- ✅ Universal Link / Deep Link 回调

**预计完成时间：** 5 分钟

---

## 前置条件

- **iOS 15+**
- **Xcode 15+**
- **Swift 5.9+**
- **Swift Package Manager**

---

## 第一步：添加 Swift Package

在 Xcode 中：

1. 打开项目，点击 **File → Add Package Dependencies...**
2. 输入仓库 URL：
   ```
   https://github.com/cinacoin/ios-sdk
   ```
3. 选择版本规则（推荐 Up to Next Major，从 0.1.0）
4. 勾选以下 Package Products：
   - `CinacoinCore`
   - `Cinacoin`

或在 `Package.swift` 中添加：

```swift
dependencies: [
    .package(url: "https://github.com/cinacoin/ios-sdk.git", from: "0.1.0"),
],
targets: [
    .target(
        name: "MyApp",
        dependencies: ["CinacoinCore", "Cinacoin"]
    ),
]
```

---

## 第二步：初始化 SDK

在 `AppDelegate` 或主视图中初始化 Cinacoin：

```swift
import Cinacoin
import CinacoinCore
import SwiftUI

@main
struct MyDApp: App {
    @StateObject private var cinacoin: Cinacoin

    init() {
        let config = CinacoinConfig(
            projectId: "your-project-id",
            relayUrl: "wss://relay.yourdomain.com/v1",
            chains: [
                .init(
                    id: 1,
                    name: "Ethereum",
                    nativeCurrency: .init(name: "Ether", symbol: "ETH", decimals: 18),
                    rpcUrl: "https://rpc.yourdomain.com/eth"
                ),
                .init(
                    id: 137,
                    name: "Polygon",
                    nativeCurrency: .init(name: "MATIC", symbol: "MATIC", decimals: 18),
                    rpcUrl: "https://rpc.yourdomain.com/polygon"
                ),
            ],
            metadata: .init(
                name: "My dApp",
                description: "iOS dApp built with Cinacoin",
                url: "https://mydapp.com",
                icons: ["https://mydapp.com/icon.png"]
            )
        )

        _cinacoin = StateObject(wrappedValue: Cinacoin(config: config))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(cinacoin)
        }
    }
}
```

---

## 第三步：连接钱包

### SwiftUI 视图示例

```swift
import SwiftUI
import Cinacoin

struct ContentView: View {
    @EnvironmentObject var cinacoin: Cinacoin

    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Text("🔢 My dApp")
                    .font(.largeTitle)

                // 连接状态
                if let account = cinacoin.account {
                    VStack(spacing: 8) {
                        Text("✅ 已连接")
                            .font(.headline)

                        Text(account.address)
                            .font(.system(.body, design: .monospaced))

                        Text("Chain: \(account.chainId)")
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                }

                // 钱包列表
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())]) {
                    ForEach(availableWallets, id: \.id) { wallet in
                        Button(action: {
                            connect(to: wallet)
                        }) {
                            VStack {
                                Image(systemName: wallet.iconName)
                                    .font(.system(size: 32))
                                Text(wallet.name)
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                    }
                }

                if cinacoin.account != nil {
                    Button("断开连接", role: .destructive) {
                        Task { await cinacoin.disconnect() }
                    }
                    .padding(.top)
                }
            }
            .padding()
            .navigationTitle("钱包")
        }
    }

    var availableWallets: [WalletOption] {
        [
            .init(id: "metamask", name: "MetaMask", iconName: "ellipsis.circle"),
            .init(id: "trust", name: "Trust Wallet", iconName: "shield"),
            .init(id: "coinbase", name: "Coinbase Wallet", iconName: "building.columns"),
        ]
    }

    func connect(to wallet: WalletOption) {
        Task {
            do {
                let result = try await cinacoin.connect(walletId: wallet.id)
                print("Connected: \(result.accounts.first ?? "")")
            } catch {
                print("Connection error: \(error.localizedDescription)")
            }
        }
    }
}

struct WalletOption: Identifiable {
    let id: String
    let name: String
    let iconName: String
}
```

---

## 第四步：消息签名与交易

```swift
import Cinacoin

// 签名消息
func signMessage(_ message: String, with cinacoin: Cinacoin) async throws -> String {
    let signature = try await cinacoin.signMessage(message)
    print("Signature: \(signature)")
    return signature
}

// 发送交易
func sendTransaction(
    to: String,
    value: String,  // wei
    with cinacoin: Cinacoin
) async throws -> String {
    let tx = TransactionRequest(
        to: to,
        value: value,
        data: nil
    )
    let txHash = try await cinacoin.sendTransaction(tx)
    print("Transaction hash: \(txHash)")
    return txHash
}
```

---

## 第五步：URL Scheme / Universal Link 配置

在 `Info.plist` 中添加 URL Scheme 用于钱包回调：

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.mydapp.wallet</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>cinacoin-myapp</string>
        </array>
    </dict>
</array>
```

处理 deep link 回调：

```swift
import SwiftUI

struct MyDApp: App {
    @Environment(\.openURL) var openURL

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    // Cinacoin 会自动处理 deep link 回调
                    // 如需手动处理：
                    // cinacoin.handleDeepLink(url.absoluteString)
                }
        }
    }
}
```

---

## 常见问题排查

### "No such module 'Cinacoin'"

- 确认 Swift Package 已正确添加
- 检查 Xcode 版本 ≥ 15
- 尝试 **Product → Clean Build Folder** (⌘⇧K)

### Deep Link 不工作

- 确认 `Info.plist` 中 URL Scheme 已配置
- 使用 `cinacoin-myapp://` 格式测试
- 检查 `AppDelegate` 或 `SceneDelegate` 是否处理 `application(_:open:)`

---

## 下一步

- [iOS 示例](/examples/ios) — 完整 iOS 示例项目
- [Mobile SDK API](/api/mobile) — 移动端参考
- [配置选项](/guide/configuration) — 完整配置参考
