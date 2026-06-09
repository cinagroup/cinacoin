# @cinacoin/ios-swift — Cinacoin iOS SDK

Native iOS Swift SDK for Cinacoin Wallet integration. Provides WalletConnect v2 pairing, session management, EVM chain support, message signing, and transaction sending — all via modern Swift Concurrency (`async/await`) and Combine reactive streams.

## Features

| Feature | Status |
|---------|--------|
| WalletConnect v2 pairing & session | ✅ |
| EVM chains (ETH, Polygon, Arbitrum, Base, Optimism, BSC) | ✅ |
| `personal_sign` (EIP-191) | ✅ |
| `signTypedData` (EIP-712) | ✅ |
| Transaction sending & gas estimation | ✅ |
| SIWE (Sign-In With Ethereum, EIP-4361) | ✅ |
| Keychain session persistence | ✅ |
| Network reachability monitoring | ✅ |
| Combine publishers for SwiftUI | ✅ |
| Swift Concurrency (`async/await`) | ✅ |
| iOS 15+ compatibility | ✅ |
| Swift Package Manager | ✅ |

## Installation

### Swift Package Manager

Add the package in Xcode or via `Package.swift`:

```swift
dependencies: [
    .package(
        path: "/path/to/onux/packages/ios-swift"
        // Or from a git URL:
        // url: "https://github.com/cinacoin/ios-swift.git",
        // from: "1.0.0"
    ),
]
```

Then link the product:

```swift
.product(name: "CinacoinSDK", package: "ios-swift")
```

## Quick Start

```swift
import CinacoinSDK

// 1. Configure (call once, typically in `application:didFinishLaunchingWithOptions:`)
try await CinacoinSDK.shared.configure(
    projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
    metadata: AppMetadata(
        name: "My dApp",
        description: "A Cinacoin-powered iOS app",
        url: "https://mydapp.com",
        icons: ["https://mydapp.com/icon.png"]
    )
)

// 2. Connect a wallet
let result = try await CinacoinSDK.shared.connect(walletId: "metamask")
print("Connected accounts: \(result.accounts)")
print("Active chain: \(result.chainId)")

// 3. Sign a message
let signature = try await CinacoinSDK.shared.signMessage("Hello from Cinacoin!")
print("Signature: \(signature.signature)")

// 4. Send a transaction
let tx = TransactionRequest(
    from: result.accounts[0],
    to: "0xRecipientAddressHere",
    value: "0x" + String(1_000_000_000_000_000_000, radix: 16)  // 1 ETH in wei
)
let txHash = try await CinacoinSDK.shared.sendTransaction(tx)
print("Tx hash: \(txHash)")

// 5. Disconnect
await CinacoinSDK.shared.disconnect()
```

## SwiftUI Integration

The SDK is `ObservableObject`, so it integrates directly with SwiftUI:

```swift
import SwiftUI
import CinacoinSDK

struct WalletView: View {
    @ObservedObject var sdk = CinacoinSDK.shared

    var body: some View {
        VStack(spacing: 16) {
            Text(sdk.status == .connected ? "✅ Connected" : "❌ Disconnected")
                .font(.headline)

            if sdk.isConnected {
                ForEach(sdk.accounts, id: \.self) { address in
                    Text(address)
                        .font(.system(.body, design: .monospaced))
                }

                Text("Chain: \(sdk.chainId)")
                    .foregroundColor(.secondary)

                Button("Disconnect") {
                    Task { await sdk.disconnect() }
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            } else {
                Button("Connect MetaMask") {
                    Task {
                        try? await sdk.connect(walletId: "metamask")
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .onAppear {
            // Observe SDK events
            sdk.events.sink { event in
                print("SDK event: \(event)")
            }.store(in: &cancellables)
        }
    }

    @State private var cancellables = Set<AnyCancellable>()
}
```

## API Reference

### `CinacoinSDK.shared` — Singleton Entry Point

| Method | Description |
|--------|-------------|
| `configure(projectId:metadata:relayUrl:namespace:)` | Initialize the SDK. Call once before anything else. |
| `connect(walletId:chains:)` → `ConnectionResult` | Connect to a wallet via WalletConnect. |
| `disconnect()` | Disconnect the active session. |
| `switchChain(chainId:)` | Switch the active EVM chain. |
| `signMessage(_ message:)` → `SignatureResult` | EIP-191 `personal_sign`. |
| `signTypedData(_ json:)` → `SignatureResult` | EIP-712 typed data signing. |
| `sendTransaction(_ tx:)` → `String` | Send & broadcast a transaction. Returns tx hash. |
| `estimateGas(_ tx:)` → `String` | Estimate gas for a transaction. |
| `getBalance()` → `String` | Fetch native token balance (in wei). |
| `generateSiweMessage(domain:nonce:uri:statement:)` → `String` | Generate a SIWE (EIP-4361) message. |
| `getPairingUri()` → `String?` | Get a WC pairing URI for QR display. |
| `isWalletInstalled(_ walletId:)` → `Bool` | Check if a wallet app is installed. |
| `getRecommendedWallets()` → `[WalletInfo]` | List recommended wallets. |
| `dispose()` | Release all resources. |

### Published Properties (SwiftUI)

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ConnectionStatus` | `.disconnected`, `.connecting`, `.connected`, `.error` |
| `accounts` | `[String]` | Connected wallet addresses |
| `chainId` | `Int` | Active chain ID |
| `isConnected` | `Bool` | Convenience computed property |

### Sub-Managers

| Manager | Access | Description |
|---------|--------|-------------|
| `walletConnect` | `sdk.walletConnect` | Direct WalletConnect v2 operations |
| `chainManager` | `sdk.chainManager` | EVM chain registry & switching |
| `signer` | `sdk.signer` | Low-level signing operations |
| `transactions` | `sdk.transactions` | Transaction building & sending |
| `networkMonitor` | `sdk.networkMonitor` | Network reachability (`@Published status`) |
| `storage` | `sdk.storage` | Keychain session persistence |

## Supported Chains

| Chain | Chain ID | Symbol |
|-------|----------|--------|
| Ethereum | 1 | ETH |
| Polygon | 137 | MATIC |
| Arbitrum One | 42161 | ETH |
| Base | 8453 | ETH |
| Optimism | 10 | ETH |
| BNB Smart Chain | 56 | BNB |

## Project Structure

```
packages/ios-swift/
├── Sources/
│   ├── CinacoinSDK/
│   │   ├── CinacoinSDK.swift       # Main singleton entry point
│   │   ├── Types.swift              # Core types, errors, enums
│   │   ├── WalletConnectManager.swift  # WC v2 pairing & session
│   │   ├── ChainManager.swift       # EVM chain registry
│   │   ├── SignerManager.swift      # Message signing
│   │   ├── TransactionManager.swift # Transaction building/sending
│   │   ├── NetworkMonitor.swift     # Network reachability
│   │   └── StorageManager.swift     # Keychain session persistence
│   ├── OnChainUX/                   # UI components (separate target)
│   └── Cinacoin/                    # Legacy compat layer
├── Tests/
│   ├── CinacoinSDKTests/
│   │   ├── TypesTests.swift
│   │   ├── ChainManagerTests.swift
│   │   └── StorageManagerTests.swift
│   └── OnChainUXTests/
├── Package.swift
└── README.md
```

## License

ISC
