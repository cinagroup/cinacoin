/**
 * WCClient — WalletConnect v2 client for iOS using WalletConnectSwiftV2 SDK.
 *
 * Provides a native Swift implementation of the WalletConnect v2 protocol:
 * - Pairing URI generation for QR display
 * - Session proposal and establishment via WalletConnectSwiftV2
 * - X25519 key exchange (handled by SDK)
 * - Relay connection to relay.walletconnect.com
 * - JSON-RPC dispatch (eth_sendTransaction, eth_signTransaction, personal_sign, eth_signTypedData_v4)
 * - SIWE signing flow
 * - Balance fetching via on-chain RPC
 * - Session persistence via UserDefaults
 * - Automatic reconnection with exponential backoff
 *
 * Uses the official WalletConnectSwiftV2 SDK via SPM.
 */

import Foundation
import Combine
import WalletConnect

// MARK: - WCClient

/// WalletConnect v2 client wrapping the official WalletConnectSwiftV2 SDK.
public final class WCClient: ObservableObject {
    
    /// Shared singleton instance.
    public static let shared = WCClient()
    
    // MARK: - Published State
    
    /// Current connection status.
    @Published public private(set) var status: WCStatus = .disconnected
    
    /// Active pairing URI for QR display.
    @Published public private(set) var pairingUri: String?
    
    /// Active session topic.
    @Published public private(set) var sessionTopic: String?
    
    /// Connected account addresses (CAIP-10).
    @Published public private(set) var accounts: [String] = []
    
    /// Connected chain ID.
    @Published public private(set) var chainId: Int = 1
    
    /// Peer wallet metadata.
    @Published public private(set) var peerMetadata: [String: String] = [:]
    
    /// Relay connection health.
    @Published public private(set) var relayHealth: RelayHealth = .disconnected
    
    // MARK: - Configuration
    
    /// WalletConnect projectId (from WalletConnect Cloud).
    public var projectId: String
    
    /// App metadata for session proposals.
    public var metadata: AppMetadata
    
    /// Required chains (CAIP-2 format, e.g. "eip155:1").
    public var requiredChains: [String]
    
    /// Required methods.
    public var requiredMethods: [String]
    
    /// Required events.
    public var requiredEvents: [String]
    
    /// Custom relay URL (defaults to relay.walletconnect.com).
    public var relayUrl: String = "wss://relay.walletconnect.com"
    
    // MARK: - Internal WalletConnectSwiftV2 References
    
    /// The NetworkingInteractor from the SDK.
    internal var networking: NetworkingInteractor?
    
    /// The Sign client for session management.
    internal var signClient: Sign?
    
    /// The Pairing client.
    internal var pairingClient: Pair?
    
    /// Combine cancellables.
    internal var cancellables = Set<AnyCancellable>()
    
    /// Event handlers.
    private var eventHandlers: [UUID: (WCEvent) -> Void] = [:]
    
    /// Pending request callbacks.
    private var pendingRequests: [UInt64: CheckedContinuation<Any, Error>] = [:]
    
    /// Next JSON-RPC request ID.
    private var nextRequestId: UInt64 = 1
    
    /// Pending reconnect work item.
    private var reconnectWorkItem: DispatchWorkItem?
    
    /// Current reconnect attempt count.
    private var reconnectAttempts: Int = 0
    
    /// Expiry check timer.
    private var expiryTimer: Timer?
    
    // MARK: - Session Persistence & Auto-Reconnect
    
    /// Session manager for persistence and auto-reconnect.
    public let sessionManager = WCSessionManager.shared
    
    /// Session TTL in seconds (default: 7 days).
    public var sessionTTL: TimeInterval = 7 * 24 * 60 * 60 {
        didSet { sessionManager.sessionTTL = sessionTTL }
    }
    
    /// Maximum reconnect attempts before giving up.
    public var maxReconnectAttempts: Int = 5 {
        didSet { sessionManager.maxReconnectAttempts = maxReconnectAttempts }
    }
    
    /// Whether auto-reconnect on app foreground is enabled.
    public var autoReconnectEnabled: Bool = true {
        didSet { sessionManager.autoReconnectEnabled = autoReconnectEnabled }
    }
    
    private init(
        projectId: String = "",
        metadata: AppMetadata = .default,
        requiredChains: [String] = ["eip155:1"],
        requiredMethods: [String] = WCMethods.standardEvmMethods,
        requiredEvents: [String] = WCEvents.standardEvmEvents
    ) {
        self.projectId = projectId
        self.metadata = metadata
        self.requiredChains = requiredChains
        self.requiredMethods = requiredMethods
        self.requiredEvents = requiredEvents
    }
    
    // MARK: - Configuration
    
    /// Configure the WC client with app settings.
    public func configure(
        projectId: String,
        metadata: AppMetadata = .default,
        chains: [String] = ["eip155:1"]
    ) {
        self.projectId = projectId
        self.metadata = metadata
        self.requiredChains = chains
    }
    
    // MARK: - SDK Initialization
    
    /// Initialize the WalletConnectSwiftV2 SDK internals.
    /// Call this once at app launch before any WC operations.
    public func initializeSDK(
        metadata: AppMetadata,
        projectId: String,
        isController: Bool = true
    ) {
        // Configure the SDK's NetworkingInteractor
        let networking = NetworkingInteractor.configure(
            projectId: projectId,
            socketFactory: DefaultSocketFactory()
        )
        self.networking = networking
        
        // Configure Pairing client
        self.pairingClient = Pair.configure(networking: networking)
        
        // Configure Sign client
        self.signClient = Sign.configure(
            networking: networking,
            keyValueStorage: KeyValueStorageUserDefaults.standard
        )
        
        // Listen for session proposals (wallet-side; dApp side may use different flow)
        signClient?.sessionProposalPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] proposal in
                self?.handleSessionProposal(proposal)
            }
            .store(in: &cancellables)
        
        // Listen for session requests
        signClient?.sessionRequestPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] request in
                self?.handleSessionRequest(request)
            }
            .store(in: &cancellables)
        
        // Listen for session state changes
        signClient?.sessionDeletePublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.sessionTopic = nil
                self?.accounts = []
                self?.status = .disconnected
                self?.persistSessionCleanup()
                self?.emit(.disconnected)
            }
            .store(in: &cancellables)
        
        // Listen for session events (chain/accounts changes)
        signClient?.sessionEventPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] event, _, _ in
                guard let self = self else { return }
                switch event.name {
                case "chainChanged":
                    if let newChain = event.params as? String,
                       let chainId = Int(newChain.dropFirst(2), radix: 16) {
                        self.chainId = chainId
                        self.persistSessionIfActive()
                    }
                case "accountsChanged":
                    if let newAccounts = event.params as? [String] {
                        self.accounts = newAccounts
                        self.persistSessionIfActive()
                    }
                default:
                    break
                }
            }
            .store(in: &cancellables)
        
        // Start expiry monitoring
        sessionManager.startExpiryMonitoring { [weak self] in
            Task { await self?.disconnect() }
        }
        
        self.metadata = metadata
        self.projectId = projectId
        
        // Attempt to restore a persisted session
        if autoReconnectEnabled {
            Task { [weak self] in
                await self?.attemptRestoreSession()
            }
        }
        
        // Start expiry monitoring
        startExpiryMonitoring()
    }
    
    // MARK: - Pairing
    
    /// Create a new pairing and generate a WC v2 URI for QR display.
    public func createPairing() async throws -> String {
        guard let pairing = pairingClient else {
            throw WCError.notConfigured
        }
        
        let uri = try await pairing.create()
        self.pairingUri = uri.absoluteString
        status = .pairing
        relayHealth = .connected
        
        return uri.absoluteString
    }
    
    /// Connect using an existing WC v2 URI (e.g., from QR scan).
    public func connect(uri: String) async throws -> WCSession {
        guard let pairing = pairingClient else {
            throw WCError.notConfigured
        }
        
        status = .connecting
        relayHealth = .connecting
        
        // Pair with the URI
        let pairingInfo = try await pairing.pair(uri: uri)
        
        // Wait for session to be established
        return try await waitForSession(topic: pairingInfo.topic)
    }
    
    /// Disconnect the current session.
    public func disconnect() async {
        // Cancel any pending reconnection attempts
        reconnectWorkItem?.cancel()
        reconnectWorkItem = nil
        reconnectAttempts = 0
        
        guard let sign = signClient, let topic = sessionTopic else {
            persistSessionCleanup()
            await MainActor.run {
                sessionTopic = nil
                accounts = []
                pairingUri = nil
                peerMetadata = [:]
                status = .disconnected
                relayHealth = .disconnected
                emit(.disconnected)
            }
            return
        }
        
        try? await sign.disconnect(
            topic: topic,
            reason: .userDisconnected
        )
        
        await MainActor.run {
            sessionTopic = nil
            accounts = []
            pairingUri = nil
            peerMetadata = [:]
            status = .disconnected
            relayHealth = .disconnected
        }
        
        persistSessionCleanup()
        emit(.disconnected)
    }
    
    // MARK: - Session Management
    
    /// Handle an incoming session proposal (wallet side).
    private func handleSessionProposal(_ proposal: Session.Proposal) {
        Task {
            do {
                guard let sign = signClient else { return }
                
                let namespaces: [String: SessionNamespace] = [
                    "eip155": SessionNamespace(
                        accounts: requiredChains.map { chain in
                            "\(chain):0x0000000000000000000000000000000000000000"
                        },
                        methods: requiredMethods,
                        events: requiredEvents
                    )
                ]
                
                let session = try await sign.approve(
                    proposalId: proposal.id,
                    namespaces: namespaces
                )
                
                sessionTopic = session.topic
                status = .connected
                relayHealth = .connected
                emit(.connected(session: WCSession(topic: session.topic)))
            } catch {
                status = .error(error.localizedDescription)
                emit(.error(WCError.relayError(error.localizedDescription)))
            }
        }
    }
    
    /// Handle an incoming session request.
    private func handleSessionRequest(_ request: Request) {
        print("[WCClient] Received session request: \(request.method)")
    }
    
    /// Wait for session establishment after pairing.
    private func waitForSession(topic: String) async throws -> WCSession {
        try await withCheckedThrowingContinuation { continuation in
            guard let sign = signClient else {
                continuation.resume(throwing: WCError.notConfigured)
                return
            }
            
            sign.sessionSettlePublisher
                .receive(on: DispatchQueue.main)
                .first { $0.topic == topic }
                .sink { session in
                    self.sessionTopic = session.topic
                    
                    var sessionAccounts: [String] = []
                    for namespace in session.namespaces.values {
                        sessionAccounts.append(
                            contentsOf: namespace.accounts.map { $0.absoluteString }
                        )
                    }
                    
                    self.accounts = sessionAccounts
                    if let first = sessionAccounts.first {
                        let parts = first.split(separator: ":")
                        if parts.count >= 2, let cid = Int(parts[1]) {
                            self.chainId = cid
                        }
                    }
                    
                    self.status = .connected
                    self.relayHealth = .connected
                    self.reconnectAttempts = 0
                    self.persistSessionIfActive()
                    self.emit(.connected(
                        session: WCSession(topic: topic, accounts: sessionAccounts)
                    ))
                    
                    continuation.resume(returning: WCSession(
                        topic: topic,
                        accounts: sessionAccounts
                    ))
                }
                .store(in: &self.cancellables)
            
            // 5-minute timeout
            Task {
                try? await Task.sleep(nanoseconds: 300_000_000_000)
                if self.sessionTopic != topic {
                    self.attemptAutoReconnect()
                    continuation.resume(throwing: WCError.sessionTimeout)
                }
            }
        }
    }
    
    // MARK: - JSON-RPC Requests
    
    /// Send a JSON-RPC request to the connected wallet.
    public func request<T: Decodable>(method: String, params: Any) async throws -> T {
        guard let sign = signClient, let topic = sessionTopic else {
            throw WCError.notConnected
        }
        
        let request = Request(
            topic: topic,
            method: method,
            params: params,
            chainId: Blockchain("eip155:\(chainId)")!
        )
        
        return try await sign.request(params: request)
    }
    
    /// Convenience: send eth_sendTransaction.
    public func sendTransaction(_ tx: WCTransactionRequest) async throws -> String {
        let params: [[String: String]] = [[
            "from": tx.from,
            "to": tx.to,
            "value": tx.value ?? "0x0",
            "data": tx.data ?? "0x",
            "gas": tx.gas ?? "0x5208",
        ].compactMapValues { $0 }]
        return try await request(method: WCMethods.ethSendTransaction, params: params)
    }
    
    /// Convenience: send eth_signTransaction.
    public func signTransaction(_ tx: WCTransactionRequest) async throws -> String {
        let params: [[String: String]] = [[
            "from": tx.from,
            "to": tx.to,
            "value": tx.value ?? "0x0",
            "data": tx.data ?? "0x",
            "gas": tx.gas ?? "0x5208",
            "gasPrice": tx.gasPrice,
            "maxFeePerGas": tx.maxFeePerGas,
            "maxPriorityFeePerGas": tx.maxPriorityFeePerGas,
            "nonce": tx.nonce,
            "chainId": tx.chainId.map { String($0) },
        ].compactMapValues { $0 }]
        return try await request(method: WCMethods.ethSignTransaction, params: params)
    }

    /// Convenience: send personal_sign.
    public func personalSign(message: String, address: String) async throws -> String {
        let hexMessage = message.hasPrefix("0x") ? message : message.utf8Hex
        return try await request(
            method: WCMethods.personalSign,
            params: [hexMessage, address]
        )
    }
    
    /// Convenience: send eth_signTypedData_v4 (EIP-712).
    public func signTypedData(address: String, typedData: String) async throws -> String {
        try await request(
            method: WCMethods.ethSignTypedDataV4,
            params: [address, typedData]
        )
    }
    
    /// Convenience: switch chain.
    public func switchChain(chainId: Int) async throws {
        let hexChainId = "0x" + String(chainId, radix: 16)
        try await request(
            method: WCMethods.walletSwitchEthereumChain,
            params: [["chainId": hexChainId]]
        )
    }
    
    // MARK: - Balance Fetching
    
    /// Fetch the native balance for the connected account via eth_getBalance.
    public func fetchBalance() async throws -> String {
        guard !accounts.isEmpty else {
            throw WCError.notConnected
        }
        
        let address = accounts[0].split(separator: ":").last.map(String.init) ?? accounts[0]
        
        let balanceHex: String = try await request(
            method: "eth_getBalance",
            params: [address, "latest"]
        )
        
        // Convert hex wei to decimal ETH
        let cleaned = balanceHex.replacingOccurrences(of: "0x", with: "")
        if let wei = UInt256(cleaned, radix: 16) {
            let ethWei = wei.decimalValue
            let eth = ethWei / Decimal(10).power(18)
            return String(format: "%.4f", (eth as NSDecimalNumber).doubleValue)
        }
        
        return "0.0000"
    }
    
    // MARK: - Events
    
    /// Subscribe to WC client events.
    public func onEvent(_ handler: @escaping (WCEvent) -> Void) -> UUID {
        let id = UUID()
        eventHandlers[id] = handler
        return id
    }
    
    /// Unsubscribe from events.
    public func unsubscribe(_ id: UUID) {
        eventHandlers.removeValue(forKey: id)
    }
    
    /// Emit an event to all handlers.
    private func emit(_ event: WCEvent) {
        for handler in eventHandlers.values {
            handler(event)
        }
    }
    
    // MARK: - Session Persistence
    
    /// Persist the current active session to UserDefaults.
    private func persistSessionIfActive() {
        guard let topic = sessionTopic, !topic.isEmpty else { return }
        
        let defaults = UserDefaults.standard
        defaults.set(topic, forKey: WCSessionKeys.sessionTopic)
        defaults.set(accounts, forKey: WCSessionKeys.sessionAccounts)
        defaults.set(chainId, forKey: WCSessionKeys.sessionChainId)
        defaults.set(peerMetadata, forKey: WCSessionKeys.sessionPeerMetadata)
        defaults.set(Date().timeIntervalSince1970, forKey: WCSessionKeys.sessionCreatedAt)
        defaults.set(Date().timeIntervalSince1970 + sessionTTL, forKey: WCSessionKeys.sessionExpiry)
        defaults.synchronize()
    }
    
    /// Clear persisted session on disconnect.
    private func persistSessionCleanup() {
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: WCSessionKeys.sessionTopic)
        defaults.removeObject(forKey: WCSessionKeys.sessionAccounts)
        defaults.removeObject(forKey: WCSessionKeys.sessionChainId)
        defaults.removeObject(forKey: WCSessionKeys.sessionPeerMetadata)
        defaults.removeObject(forKey: WCSessionKeys.sessionCreatedAt)
        defaults.removeObject(forKey: WCSessionKeys.sessionExpiry)
        defaults.synchronize()
    }
    
    /// Attempt to restore a previously persisted session.
    func attemptRestoreSession() async {
        guard autoReconnectEnabled else { return }
        
        let defaults = UserDefaults.standard
        
        // Check for expired session
        if let expiry = defaults.object(forKey: WCSessionKeys.sessionExpiry) as? TimeInterval,
           Date().timeIntervalSince1970 > expiry {
            persistSessionCleanup()
            return
        }
        
        // Check if we already have an active session
        guard sessionTopic == nil || sessionTopic?.isEmpty == true else { return }
        
        guard let persistedTopic = defaults.string(forKey: WCSessionKeys.sessionTopic),
              !persistedTopic.isEmpty else { return }
        
        // Verify session still exists in the SDK
        guard let sign = signClient else { return }
        
        do {
            let sessions = sign.getActiveSessions()
            if let activeSession = sessions.first(where: { $0.topic == persistedTopic }) {
                // Session is still valid — restore state
                await MainActor.run {
                    self.sessionTopic = persistedTopic
                    self.accounts = defaults.stringArray(forKey: WCSessionKeys.sessionAccounts) ?? []
                    self.chainId = defaults.integer(forKey: WCSessionKeys.sessionChainId)
                    self.peerMetadata = defaults.dictionary(forKey: WCSessionKeys.sessionPeerMetadata) as? [String: String] ?? [:]
                    self.status = .connected
                    self.relayHealth = .connected
                    self.emit(.connected(session: WCSession(
                        topic: persistedTopic,
                        accounts: self.accounts
                    )))
                }
                
                // Fetch updated balance
                _ = try? await fetchBalance()
            } else {
                persistSessionCleanup()
            }
        } catch {
            persistSessionCleanup()
        }
    }
    
    // MARK: - Auto-Reconnect
    
    /// Start periodic session expiry checking.
    private func startExpiryMonitoring() {
        expiryTimer?.invalidate()
        expiryTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { [weak self] in
                await self?.checkSessionExpiry()
            }
        }
    }
    
    /// Check if the current persisted session has expired.
    private func checkSessionExpiry() async {
        let defaults = UserDefaults.standard
        guard let expiry = defaults.object(forKey: WCSessionKeys.sessionExpiry) as? TimeInterval else { return }
        if Date().timeIntervalSince1970 > expiry {
            await MainActor.run { disconnect() }
        }
    }
    
    /// Attempt to auto-reconnect after a disconnection with exponential backoff.
    private func attemptAutoReconnect() {
        guard autoReconnectEnabled, reconnectAttempts < maxReconnectAttempts else { return }
        
        reconnectWorkItem?.cancel()
        
        let delay = 2.0 * pow(2.0, Double(reconnectAttempts))
        let item = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            self.reconnectAttempts += 1
            
            Task { [weak self] in
                await self?.attemptRestoreSession()
                if await self?.status != .connected {
                    self?.attemptAutoReconnect()
                } else {
                    self?.reconnectAttempts = 0
                }
            }
        }
        
        reconnectWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
    }
}

// MARK: - Types

/// Relay connection health status.
public enum RelayHealth: Equatable {
    case connected
    case connecting
    case disconnected
    case reconnecting
}

/// WC client connection status.
public enum WCStatus: Equatable {
    case disconnected
    case connecting
    case pairing
    case connected
    case error(String)
    
    public static func == (lhs: WCStatus, rhs: WCStatus) -> Bool {
        switch (lhs, rhs) {
        case (.disconnected, .disconnected): return true
        case (.connecting, .connecting): return true
        case (.pairing, .pairing): return true
        case (.connected, .connected): return true
        case let (.error(l), .error(r)): return l == r
        default: return false
        }
    }
}

/// WC v2 session data.
public struct WCSession: Sendable {
    public let topic: String
    public let peerMetadata: [String: Any]
    public let accounts: [String]
    public let namespaces: [String: Any]
    public let relay: [String: Any]
    
    public init(
        topic: String,
        peerMetadata: [String: Any] = [:],
        accounts: [String] = [],
        namespaces: [String: Any] = [:],
        relay: [String: Any] = [:]
    ) {
        self.topic = topic
        self.peerMetadata = peerMetadata
        self.accounts = accounts
        self.namespaces = namespaces
        self.relay = relay
    }
}

/// Application metadata for WC session proposals.
public struct WCAppMetadata: Sendable {
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
    
    public static let `default` = WCAppMetadata(
        name: "Cinacoin dApp",
        description: "Connected via Cinacoin",
        url: "https://cinacoin.io",
        icons: ["https://cinacoin.io/icon.png"]
    )
}

/// Transaction request for eth_sendTransaction.
public struct WCTransactionRequest: Sendable {
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

/// WC client events.
public enum WCEvent {
    case pairingCreated(uri: String)
    case sessionProposal([String: Any])
    case connected(session: WCSession)
    case sessionUpdate(session: WCSession?)
    case disconnected
    case error(WCError)
}

/// WC-specific errors.
public enum WCError: Error, LocalizedError {
    case notConnected
    case notConfigured
    case invalidUrl(String)
    case invalidUri(String)
    case sessionTimeout
    case requestTimeout(String)
    case rpcError(Int, String)
    case invalidProposalResponse
    case relayError(String)
    case cryptoError(String)
    
    public var errorDescription: String? {
        switch self {
        case .notConnected: return "Not connected to a wallet"
        case .notConfigured: return "WCClient has not been configured"
        case let .invalidUrl(url): return "Invalid relay URL: \(url)"
        case let .invalidUri(uri): return "Invalid WalletConnect URI: \(uri)"
        case .sessionTimeout: return "Session establishment timed out"
        case let .requestTimeout(method): return "Request '\(method)' timed out"
        case let .rpcError(code, message): return "RPC error \(code): \(message)"
        case .invalidProposalResponse: return "Invalid session proposal response"
        case let .relayError(msg): return "Relay error: \(msg)"
        case let .cryptoError(msg): return "Crypto error: \(msg)"
        }
    }
}

// MARK: - Standard Methods & Events

/// Standard WC v2 methods for EVM chains.
public enum WCMethods {
    public static let ethSendTransaction = "eth_sendTransaction"
    public static let ethSignTransaction = "eth_signTransaction"
    public static let personalSign = "personal_sign"
    public static let ethSignTypedData = "eth_signTypedData"
    public static let ethSignTypedDataV4 = "eth_signTypedData_v4"
    public static let walletSwitchEthereumChain = "wallet_switchEthereumChain"
    public static let walletAddEthereumChain = "wallet_addEthereumChain"
    public static let ethAccounts = "eth_accounts"
    public static let ethChainId = "eth_chainId"
    
    public static let standardEvmMethods: [String] = [
        ethSendTransaction, ethSignTransaction, personalSign,
        ethSignTypedData, ethSignTypedDataV4,
        walletSwitchEthereumChain, walletAddEthereumChain,
        ethAccounts, ethChainId
    ]
}

/// Standard WC v2 events for EVM chains.
public enum WCEvents {
    public static let chainChanged = "chainChanged"
    public static let accountsChanged = "accountsChanged"
    public static let standardEvmEvents: [String] = [chainChanged, accountsChanged]
}

// MARK: - UInt256 Implementation

/// 256-bit unsigned integer for handling large blockchain values (wei, balances, etc.)
public struct UInt256: Equatable, Comparable, CustomStringConvertible {
    private let high: UInt128
    private let low: UInt128
    
    public init(high: UInt128, low: UInt128) {
        self.high = high
        self.low = low
    }
    
    /// Initialize from hex string (with or without 0x prefix)
    public init?(_ hexString: String, radix: Int = 16) {
        guard radix == 16 else { return nil }
        let cleaned = hexString.replacingOccurrences(of: "0x", with: "")
        guard !cleaned.isEmpty else { return nil }
        
        // Pad to 64 characters (256 bits)
        let padded = String(repeating: "0", count: max(0, 64 - cleaned.count)) + cleaned
        guard padded.count == 64 else { return nil }
        
        let highHex = String(padded.prefix(32))
        let lowHex = String(padded.suffix(32))
        
        guard let highVal = UInt128(highHex, radix: 16),
              let lowVal = UInt128(lowHex, radix: 16) else {
            return nil
        }
        
        self.high = highVal
        self.low = lowVal
    }
    
    /// Initialize from UInt64
    public init(_ value: UInt64) {
        self.high = UInt128(0)
        self.low = UInt128(value)
    }
    
    public var description: String {
        "0x" + high.hexString + low.hexString
    }
    
    public static func < (lhs: UInt256, rhs: UInt256) -> Bool {
        if lhs.high != rhs.high { return lhs.high < rhs.high }
        return lhs.low < rhs.low
    }
    
    /// Convert to Decimal for arithmetic operations
    public var decimalValue: Decimal {
        let highDecimal = high.decimalValue * Decimal(340282366920938463463374607431768211456) // 2^128
        return highDecimal + low.decimalValue
    }
}

/// 128-bit unsigned integer helper
public struct UInt128: Equatable, Comparable, CustomStringConvertible {
    private let high: UInt64
    private let low: UInt64
    
    public init(high: UInt64, low: UInt64) {
        self.high = high
        self.low = low
    }
    
    public init(_ value: UInt64) {
        self.high = 0
        self.low = value
    }
    
    /// Initialize from hex string
    public init?(_ hexString: String, radix: Int = 16) {
        guard radix == 16 else { return nil }
        let cleaned = hexString.replacingOccurrences(of: "0x", with: "")
        guard !cleaned.isEmpty else { return nil }
        
        // Pad to 32 characters (128 bits)
        let padded = String(repeating: "0", count: max(0, 32 - cleaned.count)) + cleaned
        guard padded.count == 32 else { return nil }
        
        let highHex = String(padded.prefix(16))
        let lowHex = String(padded.suffix(16))
        
        guard let highVal = UInt64(highHex, radix: 16),
              let lowVal = UInt64(lowHex, radix: 16) else {
            return nil
        }
        
        self.high = highVal
        self.low = lowVal
    }
    
    public var hexString: String {
        String(format: "%016llx%016llx", high, low)
    }
    
    public var description: String {
        "0x" + hexString
    }
    
    public var decimalValue: Decimal {
        let highDecimal = Decimal(high) * Decimal(18446744073709551616) // 2^64
        return highDecimal + Decimal(low)
    }
    
    public static func < (lhs: UInt128, rhs: UInt128) -> Bool {
        if lhs.high != rhs.high { return lhs.high < rhs.high }
        return lhs.low < rhs.low
    }
}

// MARK: - String Extensions

extension String {
    var urlEncoded: String {
        addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? self
    }
    
    var utf8Hex: String {
        "0x" + self.utf8.map { String(format: "%02x", $0) }.joined()
    }
}
