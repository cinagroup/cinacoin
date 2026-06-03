//
//  CinacoinSDK.swift
//  CinacoinSDK
//
//  Main entry point — singleton facade for the Cinacoin iOS Wallet SDK.
//
//  Usage:
//  ```swift
//  import CinacoinSDK
//
//  let sdk = CinacoinSDK.shared
//
//  try await sdk.configure(
//      projectId: "YOUR_PROJECT_ID",
//      metadata: AppMetadata(
//          name: "My dApp",
//          description: "An iOS dApp using Cinacoin",
//          url: "https://mydapp.com",
//          icons: ["https://mydapp.com/icon.png"]
//      )
//  )
//
//  let result = try await sdk.connect(walletId: "metamask")
//  print("Connected: \(result.accounts)")
//
//  let sig = try await sdk.signMessage("Hello from Cinacoin!")
//  try await sdk.disconnect()
//  ```
//

import Foundation
import Combine

// MARK: - CinacoinSDK (Singleton)

/// The top-level Cinacoin Wallet SDK.
///
/// `CinacoinSDK.shared` provides a thread-safe, singleton entry point
/// that coordinates wallet connection, signing, transactions, chain
/// switching, and session persistence.
///
/// All async operations use Swift Concurrency (`async/await`).
/// Published properties use Combine for reactive SwiftUI bindings.
@MainActor
public final class CinacoinSDK: ObservableObject {

    // MARK: - Shared Instance

    /// The global shared SDK instance.
    public static let shared = CinacoinSDK()

    // MARK: - Published State (SwiftUI)

    @Published public private(set) var status: ConnectionStatus = .disconnected
    @Published public private(set) var accounts: [String] = []
    @Published public private(set) var chainId: Int = 1

    /// Convenience: whether a wallet is connected.
    public var isConnected: Bool { status == .connected }

    // MARK: - Sub-Managers

    /// WalletConnect pairing and session orchestration.
    public let walletConnect = WalletConnectManager()

    /// EVM chain registry and active-chain management.
    public let chainManager = ChainManager()

    /// Message signing (personal_sign, signTypedData).
    public private(set) lazy var signer = SignerManager(walletConnect: walletConnect)

    /// Transaction building and sending.
    public private(set) lazy var transactions = TransactionManager(
        walletConnect: walletConnect,
        chainManager: chainManager
    )

    /// Network reachability monitor.
    public let networkMonitor = NetworkMonitor()

    /// Keychain-backed session storage.
    public let storage = StorageManager()

    // MARK: - Events

    private let eventSubject = PassthroughSubject<CinacoinEvent, Never>()

    /// Combine publisher for SDK events.
    public var events: AnyPublisher<CinacoinEvent, Never> {
        eventSubject.eraseToAnyPublisher()
    }

    // MARK: - Internal State

    private var _configured = false
    private var _disposed = false
    private let lock = NSRecursiveLock()

    // MARK: - Private Init

    private init() {}

    // MARK: - Configure

    /// Initialize the SDK. Must be called once before any other method.
    ///
    /// 1. Configures WalletConnect v2.
    /// 2. Registers the chain manager with supported EVM chains.
    /// 3. Attempts session restoration from the Keychain.
    /// 4. Starts network monitoring.
    ///
    /// - Parameters:
    ///   - projectId: WalletConnect / Cinacoin project ID.
    ///   - metadata:  App metadata for wallet pairing.
    ///   - relayUrl:  Optional WebSocket relay override.
    ///   - namespace: Default chain namespace (default `"eip155"`).
    public func configure(
        projectId: String,
        metadata: AppMetadata,
        relayUrl: String? = nil,
        namespace: String = "eip155"
    ) async throws {
        try _guardNotDisposed()
        lock.lock()
        defer { lock.unlock() }
        guard !_configured else { return }

        // Configure WalletConnect.
        try await walletConnect.configure(
            projectId: projectId,
            metadata: metadata,
            relayUrl: relayUrl
        )

        // Attempt session restoration from Keychain.
        do {
            if let session = try storage.loadSession() {
                accounts = session.accounts
                chainId = session.chainId
                status = .connected
                signer.setPrimaryAddress(session.accounts.first ?? "")
                transactions.setPrimaryAddress(session.accounts.first ?? "")
                eventSubject.send(.sessionRestored(
                    accounts: session.accounts,
                    chainId: session.chainId
                ))
            }
        } catch {
            // Keychain error is non-fatal; proceed without restoration.
        }

        // Start network monitoring.
        networkMonitor.start()

        _configured = true
        eventSubject.send(.configured)
    }

    // MARK: - Connect

    /// Connect to a wallet.
    ///
    /// Creates a WalletConnect pairing, opens the wallet app via deep link,
    /// and waits for session approval.
    ///
    /// - Parameters:
    ///   - walletId: Connector ID (e.g. `"metamask"`, `"walletconnect"`).
    ///   - chains:   Optional chain IDs to request.
    /// - Returns: `ConnectionResult` with session info and accounts.
    public func connect(walletId: String, chains: [Int]? = nil) async throws -> ConnectionResult {
        try _guardConfigured()

        status = .connecting
        eventSubject.send(.connecting(connectorId: walletId))

        let result = try await walletConnect.connect(walletId: walletId, chains: chains)

        // Persist session.
        let session = SessionData(
            accounts: result.accounts,
            chainId: result.chainId,
            sessionId: result.sessionId,
            connectorId: result.connectorId,
            topic: result.sessionId
        )
        try? storage.saveSession(session)

        // Update state.
        accounts = result.accounts
        chainId = result.chainId
        status = .connected
        signer.setPrimaryAddress(result.accounts.first ?? "")
        transactions.setPrimaryAddress(result.accounts.first ?? "")

        eventSubject.send(.connected(accounts: result.accounts, chainId: result.chainId))

        return result
    }

    // MARK: - Disconnect

    /// Disconnect the active wallet session.
    public func disconnect() async {
        do { try _guardConfigured() } catch { return }

        await walletConnect.disconnect()
        try? storage.clearSession()

        accounts = []
        chainId = 1
        status = .disconnected

        eventSubject.send(.disconnected)
    }

    // MARK: - Chain Switching

    /// Switch the active EVM chain.
    ///
    /// - Parameter chainId: Target chain ID.
    /// - Throws: `CinacoinError.chainNotSupported` if the chain is not registered.
    public func switchChain(chainId: Int) async throws {
        try _guardConfigured()
        guard isConnected else { throw CinacoinError.notConnected }

        try chainManager.setActiveChain(chainId: chainId)
        try await walletConnect.switchChain(chainId)

        // Update persisted session.
        if let session = try? storage.loadSession() {
            let updated = SessionData(
                accounts: session.accounts,
                chainId: chainId,
                sessionId: session.sessionId,
                connectorId: session.connectorId,
                topic: session.topic
            )
            try? storage.saveSession(updated)
        }

        self.chainId = chainId
        eventSubject.send(.chainChanged(chainId: chainId))
    }

    // MARK: - Signing

    /// Sign a plaintext message (EIP-191 `personal_sign`).
    ///
    /// - Parameter message: The plaintext message to sign.
    /// - Returns: `SignatureResult` with hex-encoded signature.
    public func signMessage(_ message: String) async throws -> SignatureResult {
        try _guardConfigured()
        guard isConnected else { throw CinacoinError.notConnected }
        return try await signer.personalSign(message: message)
    }

    /// Sign EIP-712 typed data.
    ///
    /// - Parameter typedDataJson: JSON-encoded EIP-712 typed data.
    /// - Returns: `SignatureResult` with hex-encoded signature.
    public func signTypedData(_ typedDataJson: String) async throws -> SignatureResult {
        try _guardConfigured()
        guard isConnected else { throw CinacoinError.notConnected }
        return try await signer.signTypedData(typedDataJson: typedDataJson)
    }

    // MARK: - Transactions

    /// Send a transaction through the connected wallet.
    ///
    /// - Parameter tx: Transaction parameters.
    /// - Returns: Transaction hash (`0x`-prefixed hex string).
    public func sendTransaction(_ tx: TransactionRequest) async throws -> String {
        try _guardConfigured()
        guard isConnected else { throw CinacoinError.notConnected }
        return try await transactions.sendTransaction(tx)
    }

    /// Estimate gas for a transaction.
    public func estimateGas(_ tx: TransactionRequest) async throws -> String {
        try _guardConfigured()
        return try await transactions.estimateGas(tx)
    }

    // MARK: - Balance

    /// Fetch the native token balance for the primary connected account.
    ///
    /// - Returns: Balance in wei as a hex string.
    public func getBalance() async throws -> String {
        try _guardConfigured()
        guard isConnected else { throw CinacoinError.notConnected }
        guard let address = accounts.first else { throw CinacoinError.notConnected }
        return try await transactions.getBalance(address: address, chainId: chainId)
    }

    // MARK: - SIWE

    /// Generate a Sign-In With Ethereum (EIP-4361) message.
    ///
    /// - Parameters:
    ///   - domain:    The dApp domain (e.g. `"mydapp.com"`).
    ///   - nonce:     Server-generated nonce for replay protection.
    ///   - uri:       Optional URI override.
    ///   - statement: Optional human-readable statement.
    /// - Returns: SIWE message string ready for signing.
    public func generateSiweMessage(
        domain: String,
        nonce: String,
        uri: String? = nil,
        statement: String? = nil
    ) throws -> String {
        guard isConnected else { throw CinacoinError.notConnected }
        guard let address = accounts.first else { throw CinacoinError.notConnected }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let now = formatter.string(from: Date())

        var lines: [String] = []
        lines.append("\(domain) wants you to sign in with your Ethereum account:")
        lines.append(address)
        lines.append("")
        if let statement = statement {
            lines.append(statement)
            lines.append("")
        }
        lines.append("URI: \(uri ?? "https://\(domain)")")
        lines.append("Version: 1")
        lines.append("Chain ID: \(chainId)")
        lines.append("Nonce: \(nonce)")
        lines.append("Issued At: \(now)")

        return lines.joined(separator: "\n")
    }

    // MARK: - Utilities

    /// Get a WalletConnect pairing URI for QR display.
    public func getPairingUri() async throws -> String? {
        try _guardConfigured()
        return try await walletConnect.createPairing()
    }

    /// Check if a wallet app is installed on the device.
    public func isWalletInstalled(_ walletId: String) -> Bool {
        walletConnect.isWalletInstalled(walletId)
    }

    /// Get a list of recommended wallets.
    public func getRecommendedWallets() -> [WalletInfo] {
        WalletRegistry.shared.recommended()
    }

    /// Get a block explorer URL for a transaction.
    public func explorerUrl(for txHash: String) -> String? {
        transactions.explorerUrl(for: txHash)
    }

    // MARK: - Disposal

    /// Dispose of all resources and reset state.
    public func dispose() async {
        lock.lock()
        defer { lock.unlock() }
        guard !_disposed else { return }
        _disposed = true

        networkMonitor.stop()
        await walletConnect.dispose()
        try? storage.clearSession()

        accounts = []
        chainId = 1
        status = .disconnected
        _configured = false
    }

    // MARK: - Guards

    private func _guardConfigured() throws {
        guard _configured else { throw CinacoinError.notInitialized }
        guard !_disposed else { throw CinacoinError.disposed }
    }

    private func _guardNotDisposed() throws {
        guard !_disposed else { throw CinacoinError.disposed }
    }
}

// MARK: - WalletRegistry

/// Static registry of known wallet apps for discovery and deep-linking.
public final class WalletRegistry: @unchecked Sendable {
    public static let shared = WalletRegistry()

    private let wallets: [WalletInfo] = [
        WalletInfo(
            id: "metamask", name: "MetaMask",
            deepLinkScheme: "metamask://",
            universalLinkDomain: "metamask.app.link",
            appStoreUrl: "https://apps.apple.com/app/id1438144202",
            supportedChains: ["eip155:1", "eip155:137", "eip155:42161", "eip155:10", "eip155:56"]
        ),
        WalletInfo(
            id: "walletconnect", name: "WalletConnect",
            supportedChains: ["eip155:1", "eip155:137"]
        ),
        WalletInfo(
            id: "coinbase", name: "Coinbase Wallet",
            deepLinkScheme: "cbwallet://",
            universalLinkDomain: "go.cb-w.com",
            appStoreUrl: "https://apps.apple.com/app/id1278383455",
            supportedChains: ["eip155:1", "eip155:10", "eip155:8453"]
        ),
        WalletInfo(
            id: "rainbow", name: "Rainbow",
            deepLinkScheme: "rainbow://",
            appStoreUrl: "https://apps.apple.com/app/id1457119021",
            supportedChains: ["eip155:1", "eip155:10", "eip155:42161", "eip155:8453"]
        ),
        WalletInfo(
            id: "trust", name: "Trust Wallet",
            deepLinkScheme: "trust://",
            appStoreUrl: "https://apps.apple.com/app/id1288339409",
            supportedChains: ["eip155:1", "eip155:56", "eip155:137"]
        ),
        WalletInfo(
            id: "phantom", name: "Phantom",
            deepLinkScheme: "phantom://",
            appStoreUrl: "https://apps.apple.com/app/id1598432977",
            supportedChains: ["eip155:1", "eip155:137", "eip155:42161"]
        ),
    ]

    /// Return all recommended wallets (filtered for EVM chains).
    public func recommended() -> [WalletInfo] {
        wallets.filter { w in
            w.supportedChains.contains { $0.hasPrefix("eip155") }
        }
    }

    /// Look up a wallet by ID.
    public func wallet(id: String) -> WalletInfo? {
        wallets.first { $0.id == id }
    }
}
