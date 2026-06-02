/**
 * CinacoinSDK — CinacoinClient
 *
 * Top-level facade for the Cinacoin iOS SDK. Provides `configure()`,
 * `openModal()`, and `disconnect()` as the primary public API surface.
 *
 * Internally coordinates:
 * - `WalletConnector`  — WC v2 protocol implementation
 * - `SessionManager`   — UserDefaults-backed persistence
 * - `EventEmitter`     — typed event callbacks
 */

import Foundation
import Combine

// MARK: - SDK Version

public let CINA_SDK_VERSION = "1.0.0"

// MARK: - CinacoinClient

/// Primary entry point for the Cinacoin iOS SDK.
///
/// ## Usage
/// ```swift
/// let client = CinacoinClient(
///     projectId: "YOUR_PROJECT_ID",
///     metadata: AppMetadata(
///         name: "My dApp",
///         description: "Connected via Cinacoin",
///         url: "https://mydapp.com",
///         icons: ["https://mydapp.com/icon.png"]
///     )
/// )
///
/// try await client.configure()
/// let result = try await client.openModal(walletId: "metamask")
/// try await client.disconnect()
/// ```
public final class CinacoinClient: ObservableObject, Sendable {

    // ── Configuration ──────────────────────────────────────────────────

    public let projectId: String
    public let metadata: AppMetadata
    public let relayUrl: String?
    public let namespace: String

    // ── Internal State ─────────────────────────────────────────────────

    private let connector = WalletConnector()
    private let sessionManager = SessionManager(storage: UserDefaults.standard)
    private let emitter = EventEmitter<CinacoinEvent>()
    private var _configured = false
    private var _disposed = false
    private let lock = NSRecursiveLock()

    // ── Published State ────────────────────────────────────────────────

    @Published public private(set) var status: ConnectionStatus = .disconnected
    @Published public private(set) var accounts: [String] = []
    @Published public private(set) var chainId: Int = 1
    public var isConnected: Bool { status == .connected }
    public var sessionTopic: String? { connector.sessionTopic }

    // ── Event Publisher ────────────────────────────────────────────────

    public var events: AnyPublisher<CinacoinEvent, Never> {
        emitter.publisher
    }

    // ── Constructor ────────────────────────────────────────────────────

    public init(
        projectId: String,
        metadata: AppMetadata,
        relayUrl: String? = nil,
        namespace: String = "eip155"
    ) {
        self.projectId = projectId
        self.metadata = metadata
        self.relayUrl = relayUrl
        self.namespace = namespace
    }

    // ── configure() ────────────────────────────────────────────────────

    /// Initialize the SDK. Must be called once before any other method.
    ///
    /// 1. Configures the WalletConnector with WC v2 relay.
    /// 2. Attempts session restoration from UserDefaults.
    /// 3. Emits `.configured` or `.sessionRestored` event.
    public func configure() async throws {
        try _guardNotDisposed()
        lock.lock()
        defer { lock.unlock() }
        guard !_configured else { return }

        try await connector.configure(
            projectId: projectId,
            metadata: metadata,
            relayUrl: relayUrl
        )

        // Restore persisted session
        if let restored = sessionManager.restore() {
            await MainActor.run {
                self.status = .connected
                self.accounts = restored.accounts
                self.chainId = restored.chainId
            }
            emitter.emit(.sessionRestored(
                accounts: restored.accounts,
                chainId: restored.chainId
            ))
        }

        _configured = true
        emitter.emit(.configured)
    }

    // ── openModal() ────────────────────────────────────────────────────

    /// Open a wallet connection modal / flow for the specified wallet.
    ///
    /// Creates a WalletConnect pairing URI, opens the wallet app via
    /// deep link, and waits for session approval.
    ///
    /// - Parameters:
    ///   - walletId: Connector identifier (e.g. `"metamask"`, `"walletconnect"`).
    ///   - chains:   Optional chain IDs to request.
    /// - Returns: `ConnectionResult` with accounts and session info.
    public func openModal(walletId: String, chains: [Int]? = nil) async throws -> ConnectionResult {
        try _guardConfigured()

        let result = try await connector.connect(
            walletId: walletId,
            chains: chains
        )

        // Persist session
        sessionManager.save(
            accounts: result.accounts,
            chainId: result.chainId,
            sessionId: result.sessionId,
            connectorId: result.connectorId
        )

        await MainActor.run {
            self.status = .connected
            self.accounts = result.accounts
            self.chainId = result.chainId
        }

        emitter.emit(.connected(
            accounts: result.accounts,
            chainId: result.chainId
        ))

        return result
    }

    // ── disconnect() ───────────────────────────────────────────────────

    /// Disconnect the active wallet session.
    public func disconnect() async {
        do { try _guardConfigured() } catch { return }

        await connector.disconnect()
        sessionManager.clear()

        await MainActor.run {
            self.status = .disconnected
            self.accounts = []
            self.chainId = 1
        }

        emitter.emit(.disconnected)
    }

    // ── Chain Switching ────────────────────────────────────────────────

    public func switchChain(chainId: Int) async throws {
        try _guardConfigured()
        guard isConnected else { throw CinacoinError.notConnected }

        try await connector.switchChain(chainId)
        sessionManager.setChainId(chainId)

        await MainActor.run { self.chainId = chainId }
        emitter.emit(.chainChanged(chainId: chainId))
    }

    // ── Signing ────────────────────────────────────────────────────────

    /// Sign a plaintext message (EIP-191 `personal_sign`).
    public func signMessage(_ message: String) async throws -> String {
        try _guardConfigured()
        try _guardConnected()
        return try await connector.personalSign(message: message, address: accounts.first!)
    }

    /// Sign EIP-712 typed data.
    public func signTypedData(_ typedData: String) async throws -> String {
        try _guardConfigured()
        try _guardConnected()
        return try await connector.signTypedData(address: accounts.first!, typedData: typedData)
    }

    // ── Transactions ───────────────────────────────────────────────────

    public func sendTransaction(_ tx: TransactionRequest) async throws -> String {
        try _guardConfigured()
        try _guardConnected()
        return try await connector.sendTransaction(tx)
    }

    // ── Balance ────────────────────────────────────────────────────────

    public func getBalance() async throws -> String {
        try _guardConfigured()
        try _guardConnected()
        guard let address = accounts.first else { throw CinacoinError.notConnected }
        return try await connector.fetchBalance(address: address)
    }

    // ── SIWE ───────────────────────────────────────────────────────────

    public func generateSiweMessage(
        domain: String,
        nonce: String,
        uri: String? = nil,
        statement: String? = nil
    ) throws -> String {
        try _guardConnected()
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

    // ── Utilities ──────────────────────────────────────────────────────

    public func getPairingUri() async throws -> String? {
        try _guardConfigured()
        return try await connector.createPairing()
    }

    public func isWalletInstalled(_ walletId: String) async -> Bool {
        do { try _guardConfigured() } catch { return false }
        return connector.isWalletInstalled(walletId)
    }

    public func getRecommendedWallets() -> [WalletInfo] {
        WalletRegistry.shared.recommended(for: namespace)
    }

    // ── Disposal ───────────────────────────────────────────────────────

    public func dispose() async {
        lock.lock()
        defer { lock.unlock() }
        guard !_disposed else { return }
        _disposed = true

        await connector.dispose()
        emitter.removeAllListeners()
        _configured = false
    }

    // ── Guards ─────────────────────────────────────────────────────────

    private func _guardConfigured() throws {
        guard _configured else { throw CinacoinError.notInitialized }
        guard !_disposed else { throw CinacoinError.disposed }
    }

    private func _guardConnected() throws {
        guard isConnected else { throw CinacoinError.notConnected }
    }

    private func _guardNotDisposed() throws {
        guard !_disposed else { throw CinacoinError.disposed }
    }
}

// MARK: - AppMetadata

public struct AppMetadata: Sendable {
    public let name: String
    public let description: String
    public let url: String
    public let icons: [String]

    public init(name: String, description: String, url: String, icons: [String]) {
        self.name = name
        self.description = description
        self.url = url
        self.icons = icons
    }
}

// MARK: - ConnectionResult

public struct ConnectionResult: Sendable {
    public let accounts: [String]
    public let chainId: Int
    public let sessionId: String
    public let connectorId: String

    public init(accounts: [String], chainId: Int, sessionId: String, connectorId: String) {
        self.accounts = accounts
        self.chainId = chainId
        self.sessionId = sessionId
        self.connectorId = connectorId
    }
}

// MARK: - TransactionRequest

public struct TransactionRequest: Sendable {
    public let from: String
    public let to: String
    public let value: String?
    public let data: String?
    public let gas: String?
    public let gasPrice: String?
    public let maxFeePerGas: String?
    public let maxPriorityFeePerGas: String?
    public let nonce: String?
    public let chainId: Int?

    public init(
        from: String,
        to: String,
        value: String? = nil,
        data: String? = nil,
        gas: String? = nil,
        gasPrice: String? = nil,
        maxFeePerGas: String? = nil,
        maxPriorityFeePerGas: String? = nil,
        nonce: String? = nil,
        chainId: Int? = nil
    ) {
        self.from = from
        self.to = to
        self.value = value
        self.data = data
        self.gas = gas
        self.gasPrice = gasPrice
        self.maxFeePerGas = maxFeePerGas
        self.maxPriorityFeePerGas = maxPriorityFeePerGas
        self.nonce = nonce
        self.chainId = chainId
    }
}

// MARK: - WalletInfo

public struct WalletInfo: Sendable {
    public let id: String
    public let name: String
    public let iconUrl: String?
    public let deepLinkScheme: String?
    public let universalLinkDomain: String?
    public let appStoreUrl: String?
    public let playStoreUrl: String?
    public let supportedChains: [String]

    public init(
        id: String,
        name: String,
        iconUrl: String? = nil,
        deepLinkScheme: String? = nil,
        universalLinkDomain: String? = nil,
        appStoreUrl: String? = nil,
        playStoreUrl: String? = nil,
        supportedChains: [String] = ["eip155:1"]
    ) {
        self.id = id
        self.name = name
        self.iconUrl = iconUrl
        self.deepLinkScheme = deepLinkScheme
        self.universalLinkDomain = universalLinkDomain
        self.appStoreUrl = appStoreUrl
        self.playStoreUrl = playStoreUrl
        self.supportedChains = supportedChains
    }
}

// MARK: - WalletRegistry

public final class WalletRegistry: @unchecked Sendable {
    public static let shared = WalletRegistry()

    private let wallets: [WalletInfo] = [
        WalletInfo(id: "metamask", name: "MetaMask",
                   deepLinkScheme: "metamask://",
                   universalLinkDomain: "metamask.app.link",
                   appStoreUrl: "https://apps.apple.com/app/id1438144202",
                   supportedChains: ["eip155:1", "eip155:137", "eip155:42161"]),
        WalletInfo(id: "walletconnect", name: "WalletConnect",
                   supportedChains: ["eip155:1", "eip155:137"]),
        WalletInfo(id: "coinbase", name: "Coinbase Wallet",
                   deepLinkScheme: "cbwallet://",
                   universalLinkDomain: "go.cb-w.com",
                   appStoreUrl: "https://apps.apple.com/app/id1278383455",
                   supportedChains: ["eip155:1", "eip155:10"]),
        WalletInfo(id: "rainbow", name: "Rainbow",
                   deepLinkScheme: "rainbow://",
                   appStoreUrl: "https://apps.apple.com/app/id1457119021",
                   supportedChains: ["eip155:1"]),
        WalletInfo(id: "trust", name: "Trust Wallet",
                   deepLinkScheme: "trust://",
                   appStoreUrl: "https://apps.apple.com/app/id1288339409",
                   supportedChains: ["eip155:1", "eip155:56"]),
        WalletInfo(id: "phantom", name: "Phantom",
                   deepLinkScheme: "phantom://",
                   appStoreUrl: "https://apps.apple.com/app/id1598432977",
                   supportedChains: ["eip155:1", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"]),
    ]

    public func recommended(for namespace: String) -> [WalletInfo] {
        wallets.filter { w in
            w.supportedChains.contains { $0.hasPrefix(namespace) }
        }
    }
}

// MARK: - ConnectionStatus

public enum ConnectionStatus: Sendable, Equatable {
    case disconnected
    case connecting
    case connected
    case error(String)

    public static func == (lhs: ConnectionStatus, rhs: ConnectionStatus) -> Bool {
        switch (lhs, rhs) {
        case (.disconnected, .disconnected), (.connecting, .connecting), (.connected, .connected):
            return true
        case (.error(let l), .error(let r)): return l == r
        default: return false
        }
    }
}

// MARK: - EventEmitter

public final class EventEmitter<T>: @unchecked Sendable {
    private let subject = PassthroughSubject<T, Never>()
    private var listeners: [UUID: (T) -> Void] = [:]
    private let lock = NSLock()

    var publisher: AnyPublisher<T, Never> { subject.eraseToAnyPublisher() }

    public func emit(_ event: T) {
        lock.lock(); defer { lock.unlock() }
        subject.send(event)
        for handler in listeners.values { handler(event) }
    }

    @discardableResult
    public func on(_ handler: @escaping (T) -> Void) -> UUID {
        let id = UUID()
        lock.lock(); listeners[id] = handler; lock.unlock()
        return id
    }

    public func off(_ id: UUID) {
        lock.lock(); listeners.removeValue(forKey: id); lock.unlock()
    }

    public func removeAllListeners() {
        lock.lock(); listeners.removeAll(); lock.unlock()
    }
}

// MARK: - CinacoinEvent

public enum CinacoinEvent: Sendable {
    case configured
    case connected(accounts: [String], chainId: Int)
    case connecting(connectorId: String)
    case disconnected
    case chainChanged(chainId: Int)
    case accountsChanged(accounts: [String])
    case error(message: String)
    case sessionRestored(accounts: [String], chainId: Int)
}

// MARK: - Errors

public enum CinacoinError: Error, LocalizedError {
    case notInitialized
    case disposed
    case notConnected
    case chainNotSupported(Int)
    case walletNotFound(String)
    case connectionFailed(String)
    case userRejected
    case timeout

    public var errorDescription: String? {
        switch self {
        case .notInitialized:    return "SDK not configured. Call configure() first."
        case .disposed:          return "SDK has been disposed. Create a new instance."
        case .notConnected:      return "No wallet is currently connected."
        case .chainNotSupported(let id): return "Chain \(id) is not supported."
        case .walletNotFound(let id):    return "Wallet '\(id)' not found."
        case .connectionFailed(let msg): return "Connection failed: \(msg)"
        case .userRejected:      return "User rejected the request."
        case .timeout:           return "Operation timed out."
        }
    }
}
