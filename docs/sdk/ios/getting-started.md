# iOS SDK — Getting Started

## Requirements

- iOS 15.0+
- Xcode 15.0+
- Swift 5.9+
- A Cinacoin project ID ([get one here](https://cloud.cinacoin.io))

## Installation

### Swift Package Manager

Add the package to your `Package.swift` or via Xcode:

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/cinagroup/cinacoin-ios.git", from: "1.0.0")
]
```

Then add the relevant libraries to your target:

```swift
.target(
    name: "YourApp",
    dependencies: [
        .product(name: "CinacoinAppKitConfig", package: "cinacoin-ios"),
        .product(name: "CinacoinAppKitUI", package: "cinacoin-ios"),
        .product(name: "CinacoinAppKitCore", package: "cinacoin-ios"),
    ]
)
```

### CocoaPods

Add to your `Podfile`:

```ruby
pod 'CinacoinAppKit', '~> 1.0.0'
```

Then run:

```bash
pod install
```

### Carthage

Add to your `Cartfile`:

```
github "cinagroup/cinacoin-ios" ~> 1.0.0
```

## Quick Start

### 1. Configure AppKit

Initialize AppKit in your `App` struct or `AppDelegate`:

```swift
import CinacoinAppKitConfig
import CinacoinAppKitCore

@main
struct MyApp: App {
    init() {
        CinacoinAppKit.configure(with: AppKitConfig(
            projectId: "YOUR_PROJECT_ID",
            metadata: AppKitConfig.AppMetadata(
                name: "My App",
                description: "My App Description",
                url: "https://myapp.com",
                icons: ["https://myapp.com/icon.png"]
            ),
            themeMode: .dark
        ))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

### 2. Add a Connect Button

Use the built-in `CinacoinConnectButton` component:

```swift
import CinacoinAppKitUI

struct ContentView: View {
    @State private var showConnect = false

    var body: some View {
        VStack(spacing: 20) {
            CinacoinConnectButton {
                showConnect = true
            }
        }
        .padding()
        .sheet(isPresented: $showConnect) {
            CinacoinConnectSheet(isPresented: $showConnect) { wallet in
                print("Connected to: \(wallet.name)")
            }
        }
    }
}
```

### 3. Observe Connection State

Use the `AppKitViewModel` to observe connection state:

```swift
import CinacoinAppKitCore

class WalletViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var address: String?
    @Published var chainId: String?

    private let appKit = CinacoinAppKit.shared

    init() {
        // Observe connection changes
        appKit.onConnectionChange = { [weak self] connected in
            self?.isConnected = connected
            if connected {
                self?.address = appKit.account?.address
                self?.chainId = appKit.chainId
            }
        }

        // Check existing connection
        if appKit.isConnected {
            isConnected = true
            address = appKit.account?.address
            chainId = appKit.chainId
        }
    }
}
```

### 4. Make RPC Calls

Once connected, make blockchain calls:

```swift
import CinacoinAppKitCore

// Get balance
let balance = try await CinacoinAppKit.shared.getBalance()
print("Balance: \(balance)")

// Send transaction
let txHash = try await CinacoinAppKit.shared.sendTransaction(
    to: "0xRecipientAddress",
    value: "0.01",
    data: nil
)
print("Transaction hash: \(txHash)")

// Sign message
let signature = try await CinacoinAppKit.shared.signMessage("Hello, Cinacoin!")
print("Signature: \(signature)")
```

## Configuration Options

| Parameter         | Type          | Description                                 |
| ----------------- | ------------- | ------------------------------------------- |
| `projectId`       | `String`      | Your Cinacoin Cloud project ID              |
| `metadata`        | `AppMetadata` | App metadata displayed in the connect sheet |
| `themeMode`       | `ThemeMode`   | `.light`, `.dark`, or `.auto` (system)      |
| `customChains`    | `[Chain]`     | Additional chains to support                |
| `defaultChain`    | `Chain`       | Default chain on connect                    |
| `enableAnalytics` | `Bool`        | Enable anonymous usage analytics            |

## URL Scheme Configuration

Add your URL scheme to `Info.plist` for wallet deep linking:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>
        </array>
    </dict>
</array>
```

Handle the callback in your `App`:

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    CinacoinAppKit.shared.handleURL(url)
                }
        }
    }
}
```

## Next Steps

- [Wallet Connection](./wallet-connection.md) — Deep dive into wallet connection flows
- [Authentication](./authentication.md) — Social and email login
- [Smart Accounts](./smart-accounts.md) — ERC-4337 account abstraction

<!-- TODO: Add screenshot of connect sheet -->
