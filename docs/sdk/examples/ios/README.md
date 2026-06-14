# iOS Example — Complete AppKit Integration

A complete SwiftUI example demonstrating wallet connection, authentication, and smart account usage.

## Project Structure

```
CinacoinExample/
├── CinacoinExampleApp.swift
├── ContentView.swift
├── WalletViewModel.swift
├── Views/
│   ├── ConnectWalletView.swift
│   ├── LoginView.swift
│   └── SmartAccountView.swift
└── Info.plist
```

## CinacoinExampleApp.swift

```swift
import SwiftUI
import CinacoinAppKitConfig
import CinacoinAppKitCore
import CinacoinAppKitAuth
import CinacoinAppKitSmartAccount

@main
struct CinacoinExampleApp: App {
    init() {
        // Configure AppKit
        CinacoinAppKit.configure(with: AppKitConfig(
            projectId: "YOUR_PROJECT_ID",
            metadata: AppKitConfig.AppMetadata(
                name: "Cinacoin Example",
                description: "Example app demonstrating AppKit SDK",
                url: "https://cinacoin.io",
                icons: ["https://cinacoin.io/icon.png"]
            ),
            themeMode: .dark,
            smartAccountConfig: SmartAccountConfig(
                factoryAddress: "0xFACTORY_ADDRESS",
                entryPointAddress: "0xENTRY_POINT_ADDRESS",
                paymasterUrl: "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID"
            )
        ))

        // Configure Auth
        let authConfig = AuthConfig(
            projectId: "YOUR_PROJECT_ID",
            supportedProviders: [.google, .github, .discord, .apple, .email],
            redirectUrl: "cinacoinexample://auth/callback"
        )
        CinacoinAppKit.configureAuth(with: authConfig)
    }

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

## ContentView.swift

```swift
import SwiftUI
import CinacoinAppKitCore

struct ContentView: View {
    @StateObject private var walletVM = WalletViewModel()
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            ConnectWalletView()
                .tabItem {
                    Label("Wallet", systemImage: "wallet.pass")
                }
                .tag(0)

            LoginView()
                .tabItem {
                    Label("Login", systemImage: "person.circle")
                }
                .tag(1)

            SmartAccountView()
                .tabItem {
                    Label("Smart Account", systemImage: "brain.head.profile")
                }
                .tag(2)
        }
        .environmentObject(walletVM)
    }
}
```

## WalletViewModel.swift

```swift
import Foundation
import CinacoinAppKitCore
import Combine

class WalletViewModel: ObservableObject {
    @Published var isConnected = false
    @Published var address: String?
    @Published var chainId: String?
    @Published var balance: String?
    @Published var isLoading = false
    @Published var error: String?

    private let appKit = CinacoinAppKit.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        setupObservers()
        restoreSession()
    }

    private func setupObservers() {
        appKit.onConnectionChange = { [weak self] connected in
            DispatchQueue.main.async {
                self?.isConnected = connected
                if !connected {
                    self?.address = nil
                    self?.chainId = nil
                    self?.balance = nil
                }
            }
        }

        appKit.onAccountChange = { [weak self] account in
            DispatchQueue.main.async {
                self?.address = account?.address
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
            isConnected = true
            address = appKit.account?.address
            chainId = appKit.chainId
        }
    }

    func connect() async {
        isLoading = true
        error = nil

        do {
            // This would typically be triggered by showing the connect sheet
            // The actual connection happens in the sheet
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func disconnect() async {
        isLoading = true
        error = nil

        do {
            try await appKit.disconnect()
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func getBalance() async {
        guard isConnected else { return }

        isLoading = true
        error = nil

        do {
            let bal = try await appKit.getBalance()
            self.balance = bal
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func switchChain(to chainId: String) async {
        isLoading = true
        error = nil

        do {
            try await appKit.switchChain(chainId: chainId)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}
```

## Views/ConnectWalletView.swift

```swift
import SwiftUI
import CinacoinAppKitUI

struct ConnectWalletView: View {
    @EnvironmentObject var walletVM: WalletViewModel
    @State private var showConnect = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if walletVM.isConnected {
                        connectedView
                    } else {
                        disconnectedView
                    }

                    if let error = walletVM.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding()
                    }
                }
                .padding()
            }
            .navigationTitle("Wallet")
            .sheet(isPresented: $showConnect) {
                CinacoinConnectSheet(isPresented: $showConnect) { wallet in
                    print("Connected: \(wallet.name)")
                }
            }
        }
    }

    var disconnectedView: some View {
        VStack(spacing: 20) {
            Image(systemName: "wallet.pass")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("Connect your wallet to get started")
                .font(.headline)
                .multilineTextAlignment(.center)

            CinacoinConnectButton {
                showConnect = true
            }
        }
    }

    var connectedView: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 12) {
                Label("Connected", systemImage: "checkmark.circle.fill")
                    .foregroundColor(.green)
                    .font(.headline)

                if let address = walletVM.address {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Address")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(address)
                            .font(.system(.body, design: .monospaced))
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }
                }

                if let chainId = walletVM.chainId {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Chain ID")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(chainId)
                            .font(.system(.body, design: .monospaced))
                    }
                }

                if let balance = walletVM.balance {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Balance")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(balance)
                            .font(.system(.body, design: .monospaced))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)

            HStack(spacing: 12) {
                Button("Refresh Balance") {
                    Task {
                        await walletVM.getBalance()
                    }
                }
                .buttonStyle(.bordered)

                Button("Disconnect") {
                    Task {
                        await walletVM.disconnect()
                    }
                }
                .buttonStyle(.bordered)
                .tint(.red)
            }

            VStack(alignment: .leading, spacing: 12) {
                Text("Switch Chain")
                    .font(.headline)

                HStack {
                    Button("Ethereum") {
                        Task {
                            await walletVM.switchChain(to: "0x1")
                        }
                    }
                    .buttonStyle(.bordered)

                    Button("Polygon") {
                        Task {
                            await walletVM.switchChain(to: "0x89")
                        }
                    }
                    .buttonStyle(.bordered)

                    Button("Base") {
                        Task {
                            await walletVM.switchChain(to: "0x2105")
                        }
                    }
                    .buttonStyle(.bordered)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
    }
}
```

## Views/LoginView.swift

```swift
import SwiftUI
import CinacoinAppKitAuth
import CinacoinAppKitUI

struct LoginView: View {
    @State private var isAuthenticated = false
    @State private var userEmail: String?
    @State private var userAddress: String?
    @State private var isLoading = false
    @State private var error: String?

    @State private var email = ""
    @State private var otp = ""
    @State private var loginStep: LoginStep = .initial

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if isAuthenticated {
                        authenticatedView
                    } else {
                        loginOptionsView
                    }

                    if let error = error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding()
                    }
                }
                .padding()
            }
            .navigationTitle("Login")
        }
    }

    var loginOptionsView: some View {
        VStack(spacing: 20) {
            Text("Sign in to your account")
                .font(.title2.bold())

            VStack(spacing: 12) {
                CinacoinSocialButton(provider: .google) {
                    await handleSocialLogin(.google)
                }

                CinacoinSocialButton(provider: .apple) {
                    await handleSocialLogin(.apple)
                }

                CinacoinSocialButton(provider: .discord) {
                    await handleSocialLogin(.discord)
                }

                CinacoinSocialButton(provider: .github) {
                    await handleSocialLogin(.github)
                }
            }

            Divider()
                .padding(.vertical, 8)

            switch loginStep {
            case .initial, .email:
                emailInputView
            case .verify:
                otpInputView
            }
        }
    }

    var emailInputView: some View {
        VStack(spacing: 12) {
            Text("Or continue with email")
                .font(.subheadline)
                .foregroundColor(.secondary)

            TextField("Email address", text: $email)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .textFieldStyle(.roundedBorder)

            Button(action: {
                Task {
                    await sendOTP()
                }
            }) {
                if isLoading {
                    ProgressView()
                } else {
                    Text("Continue")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(email.isEmpty || isLoading)
        }
    }

    var otpInputView: some View {
        VStack(spacing: 12) {
            Text("Enter verification code")
                .font(.headline)

            Text("Sent to \(email)")
                .font(.caption)
                .foregroundColor(.secondary)

            TextField("6-digit code", text: $otp)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)
                .multilineTextAlignment(.center)

            Button(action: {
                Task {
                    await verifyOTP()
                }
            }) {
                if isLoading {
                    ProgressView()
                } else {
                    Text("Verify")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(otp.count != 6 || isLoading)

            Button("Resend code") {
                Task {
                    await sendOTP()
                }
            }
            .font(.caption)
        }
    }

    var authenticatedView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("Successfully logged in!")
                .font(.headline)

            if let email = userEmail {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Email")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(email)
                }
            }

            if let address = userAddress {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Wallet Address")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(address)
                        .font(.system(.body, design: .monospaced))
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }

            Button("Sign Out") {
                Task {
                    await signOut()
                }
            }
            .buttonStyle(.bordered)
            .tint(.red)
        }
    }

    func handleSocialLogin(_ provider: AuthProvider) async {
        isLoading = true
        error = nil

        do {
            let result = try await AuthManager.shared.signIn(provider: provider)
            isAuthenticated = true
            userEmail = result.email
            userAddress = result.address
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func sendOTP() async {
        isLoading = true
        error = nil

        do {
            try await AuthManager.shared.sendEmailOTP(email: email)
            loginStep = .verify
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func verifyOTP() async {
        isLoading = true
        error = nil

        do {
            let result = try await AuthManager.shared.verifyEmailOTP(
                email: email,
                otp: otp
            )
            isAuthenticated = true
            userEmail = email
            userAddress = result.address
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func signOut() async {
        isLoading = true
        error = nil

        do {
            try await AuthManager.shared.signOut()
            isAuthenticated = false
            userEmail = nil
            userAddress = nil
            loginStep = .initial
            email = ""
            otp = ""
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}

enum LoginStep {
    case initial
    case email
    case verify
}
```

## Views/SmartAccountView.swift

```swift
import SwiftUI
import CinacoinAppKitCore
import CinacoinAppKitSmartAccount

struct SmartAccountView: View {
    @State private var smartAccount: SmartAccount?
    @State private var isLoading = false
    @State private var error: String?
    @State private var result: String?

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if let account = smartAccount {
                        smartAccountInfoView(account)
                        smartAccountActionsView(account)
                    } else {
                        createSmartAccountView
                    }

                    if let error = error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding()
                    }

                    if let result = result {
                        Text(result)
                            .font(.system(.caption, design: .monospaced))
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(8)
                    }
                }
                .padding()
            }
            .navigationTitle("Smart Account")
        }
    }

    var createSmartAccountView: some View {
        VStack(spacing: 20) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("Create a smart account to enable advanced features")
                .font(.headline)
                .multilineTextAlignment(.center)

            Button("Create Smart Account") {
                Task {
                    await createSmartAccount()
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(isLoading)
        }
    }

    func smartAccountInfoView(_ account: SmartAccount) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Smart Account", systemImage: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.headline)

            VStack(alignment: .leading, spacing: 4) {
                Text("Address")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(account.address)
                    .font(.system(.body, design: .monospaced))
                    .lineLimit(1)
                    .truncationMode(.middle)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Deployed")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(account.isDeployed ? "Yes" : "No")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    func smartAccountActionsView(_ account: SmartAccount) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Actions")
                .font(.headline)

            VStack(spacing: 12) {
                Button("Deploy Account") {
                    Task {
                        await deployAccount(account)
                    }
                }
                .buttonStyle(.bordered)
                .disabled(account.isDeployed)

                Button("Send Transaction") {
                    Task {
                        await sendTransaction(account)
                    }
                }
                .buttonStyle(.bordered)

                Button("Batch Transactions") {
                    Task {
                        await batchTransactions(account)
                    }
                }
                .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    func createSmartAccount() async {
        isLoading = true
        error = nil
        result = nil

        do {
            guard let owner = CinacoinAppKit.shared.account?.address else {
                throw NSError(domain: "SmartAccount", code: -1, userInfo: [
                    NSLocalizedDescriptionKey: "No connected account"
                ])
            }

            let account = try await SmartAccountManager.shared.createSmartAccount(
                owner: owner,
                salt: 0
            )

            smartAccount = account
            result = "Created: \(account.address)"
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func deployAccount(_ account: SmartAccount) async {
        isLoading = true
        error = nil
        result = nil

        do {
            let txHash = try await account.deploy()
            result = "Deployed: \(txHash)"
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func sendTransaction(_ account: SmartAccount) async {
        isLoading = true
        error = nil
        result = nil

        do {
            let userOpHash = try await account.sendTransaction(
                to: "0x0000000000000000000000000000000000000000",
                value: BigInt(0),
                data: Data()
            )
            result = "UserOp: \(userOpHash)"
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func batchTransactions(_ account: SmartAccount) async {
        isLoading = true
        error = nil
        result = nil

        do {
            let calls: [SmartAccountCall] = [
                SmartAccountCall(
                    to: "0x0000000000000000000000000000000000000000",
                    value: BigInt(0),
                    data: Data()
                ),
                SmartAccountCall(
                    to: "0x0000000000000000000000000000000000000000",
                    value: BigInt(0),
                    data: Data()
                )
            ]

            let userOpHash = try await account.sendBatch(calls: calls)
            result = "Batch UserOp: \(userOpHash)"
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}
```

## Info.plist

Add to your `Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>cinacoinexample</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

## Running the Example

1. Replace `YOUR_PROJECT_ID` with your actual Cinacoin Cloud project ID
2. Update the factory and entry point addresses
3. Build and run in Xcode
4. Test wallet connection, authentication, and smart account features

<!-- TODO: Add screenshots of the example app -->
