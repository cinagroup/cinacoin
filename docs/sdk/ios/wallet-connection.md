# iOS SDK — Wallet Connection

## Overview

AppKit supports connecting to 300+ wallets through a unified interface. This guide covers all connection methods and state management.

## Using CinacoinConnectButton

The simplest way to add wallet connection to your app:

```swift
import CinacoinAppKitUI

struct ContentView: View {
    @State private var showConnect = false

    var body: some View {
        CinacoinConnectButton {
            showConnect = true
        }
        .sheet(isPresented: $showConnect) {
            CinacoinConnectSheet(isPresented: $showConnect) { wallet in
                handleConnected(wallet)
            }
        }
    }

    func handleConnected(_ wallet: WalletInfo) {
        print("Connected: \(wallet.name)")
        print("Address: \(wallet.address)")
        print("Chain ID: \(wallet.chainId)")
    }
}
```

### Customizing the Button

```swift
CinacoinConnectButton(
    label: "Connect Wallet",
    style: .primary,  // .primary, .secondary, .outline
    size: .large      // .small, .medium, .large
) {
    showConnect = true
}
```

## Using CinacoinConnectSheet

The connect sheet provides a pre-built UI for wallet selection:

```swift
import CinacoinAppKitUI

.sheet(isPresented: $showConnect) {
    CinacoinConnectSheet(
        isPresented: $showConnect,
        onConnect: { wallet in
            print("Connected: \(wallet.name)")
        },
        onError: { error in
            print("Error: \(error.localizedDescription)")
        }
    )
}
```

### Sheet Configuration

```swift
let config = ConnectSheetConfig(
    showRecentWallets: true,
    showQRCode: true,
    featuredWallets: ["metamask", "trust", "rainbow"],
    excludedWallets: [],
    enableEmailLogin: true,
    enableSocialLogin: true
)

CinacoinConnectSheet(
    isPresented: $showConnect,
    config: config,
    onConnect: { wallet in /* ... */ }
)
```

## Custom Wallet List

Build your own wallet selection UI:

```swift
import CinacoinAppKitCore

struct CustomWalletView: View {
    @StateObject private var viewModel = WalletListViewModel()

    var body: some View {
        List(viewModel.wallets) { wallet in
            Button(action: {
                Task {
                    try await viewModel.connect(to: wallet)
                }
            }) {
                HStack {
                    AsyncImage(url: wallet.iconUrl) { image in
                        image.resizable().frame(width: 40, height: 40)
                    } placeholder: {
                        Color.gray.frame(width: 40, height: 40)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                    VStack(alignment: .leading) {
                        Text(wallet.name)
                            .font(.headline)
                        if wallet.isInstalled {
                            Text("Installed")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                }
            }
        }
    }
}

class WalletListViewModel: ObservableObject {
    @Published var wallets: [Wallet] = []
    private let appKit = CinacoinAppKit.shared

    init() {
        wallets = appKit.getAvailableWallets()
    }

    func connect(to wallet: Wallet) async throws {
        try await appKit.connect(wallet: wallet)
    }
}
```

## Connection State Management

### Using the Shared Instance

```swift
import CinacoinAppKitCore

class ConnectionStateViewModel: ObservableObject {
    @Published var state: ConnectionState = .disconnected
    @Published var account: Account?
    @Published var chainId: String?

    private let appKit = CinacoinAppKit.shared

    init() {
        setupObservers()
        restoreSession()
    }

    private func setupObservers() {
        appKit.onConnectionChange = { [weak self] connected in
            DispatchQueue.main.async {
                self?.state = connected ? .connected : .disconnected
            }
        }

        appKit.onAccountChange = { [weak self] account in
            DispatchQueue.main.async {
                self?.account = account
            }
        }

        appKit.onChainChange = { [weak self] chainId in
            DispatchQueue.main.async {
                self?.chainId = chainId
            }
        }
    }

    private func restoreSession() {
        if appKit.isConnected {
            state = .connected
            account = appKit.account
            chainId = appKit.chainId
        }
    }
}

enum ConnectionState {
    case disconnected
    case connecting
    case connected
    case error(String)
}
```

### Using Combine

```swift
import Combine

class WalletCombineViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var address: String?

    private var cancellables = Set<AnyCancellable>()
    private let appKit = CinacoinAppKit.shared

    init() {
        appKit.connectionPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] connected in
                self?.isConnected = connected
                if connected {
                    self?.address = self?.appKit.account?.address
                }
            }
            .store(in: &cancellables)
    }
}
```

## Chain Switching

### Switch Chain Programmatically

```swift
import CinacoinAppKitCore

// Switch to Ethereum Mainnet
try await CinacoinAppKit.shared.switchChain(chainId: "0x1")

// Switch to Polygon
try await CinacoinAppKit.shared.switchChain(chainId: "0x89")

// Switch to a custom chain
try await CinacoinAppKit.shared.switchChain(chainId: "0x2105") // Base
```

### Listen for Chain Changes

```swift
CinacoinAppKit.shared.onChainChange = { chainId in
    print("Chain changed to: \(chainId)")

    switch chainId {
    case "0x1":
        print("Now on Ethereum Mainnet")
    case "0x89":
        print("Now on Polygon")
    default:
        print("On chain: \(chainId)")
    }
}
```

### Request Chain Switch from dApp

```swift
// Request the wallet to switch chain (prompts user)
do {
    try await CinacoinAppKit.shared.requestChainSwitch(chainId: "0x1")
    print("User approved chain switch")
} catch ChainSwitchError.userRejected {
    print("User rejected chain switch")
} catch {
    print("Error: \(error)")
}
```

## Disconnect

```swift
// Disconnect current session
try await CinacoinAppKit.shared.disconnect()

// Disconnect and clear all stored sessions
try await CinacoinAppKit.shared.disconnect(clearSession: true)
```

## Deep Linking

### Universal Links

Configure universal links for seamless wallet communication:

```swift
// In AppKitConfig
let config = AppKitConfig(
    projectId: "YOUR_PROJECT_ID",
    metadata: metadata,
    universalLink: "https://myapp.com/wallet",
    redirectScheme: "myapp"
)
```

### Handle Wallet Callbacks

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    // Handle wallet deep link callback
                    CinacoinAppKit.shared.handleURL(url)
                }
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    if let url = activity.webpageURL {
                        CinacoinAppKit.shared.handleURL(url)
                    }
                }
        }
    }
}
```

## Error Handling

```swift
do {
    try await CinacoinAppKit.shared.connect(wallet: wallet)
} catch ConnectionError.walletNotFound {
    // Wallet app not installed
    showInstallPrompt(for: wallet)
} catch ConnectionError.userRejected {
    // User rejected the connection
    showRejectionMessage()
} catch ConnectionError.timeout {
    // Connection timed out
    showRetryPrompt()
} catch ConnectionError.chainNotSupported {
    // Requested chain not supported by wallet
    showChainNotSupported()
} catch {
    // Unexpected error
    showError(error.localizedDescription)
}
```

<!-- TODO: Add screenshot of custom wallet list -->
