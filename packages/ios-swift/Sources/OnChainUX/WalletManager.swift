/**
 * WalletManager — manages wallet connections and session lifecycle.
 *
 * Handles wallet discovery, connection, disconnection, and state management.
 * Supports multiple connector types: injected, WalletConnect, Coinbase,
 * email, and social logins.
 *
 * ## Usage
 * ```swift
 * let manager = WalletManager()
 * manager.configure(with: config)
 *
 * let result = try await manager.connect(connectorId: "metamask")
 * print("Connected: \(result.account.address)")
 *
 * await manager.disconnect()
 * ```
 */

import Foundation

/// Result of a successful wallet connection.
public struct ConnectResult: Sendable {
    /// Connected account info.
    public let account: AccountInfo
    /// Connected chain ID.
    public let chainId: Int
    /// Session ID.
    public let sessionId: String
    
    public init(account: AccountInfo, chainId: Int, sessionId: String) {
        self.account = account
        self.chainId = chainId
        self.sessionId = sessionId
    }
}

/// Manages wallet connections and session state.
public final class WalletManager: ObservableObject {
    
    /// Currently connected account, if any.
    @Published public private(set) var connectedAccount: AccountInfo?
    
    /// Current connection status.
    @Published public private(set) var connectionStatus: ConnectionStatus = .disconnected
    
    /// Available connectors.
    @Published public private(set) var connectors: [ConnectorInfo] = []
    
    /// Active session ID.
    public private(set) var sessionId: String?
    
    private var config: OnChainUXConfig?
    
    // MARK: - Lifecycle
    
    /// Configure the wallet manager.
    /// - Parameter config: App configuration.
    public func configure(with config: OnChainUXConfig) {
        self.config = config
        connectors = buildDefaultConnectors(config: config)
    }
    
    /// Connect to a wallet by connector ID.
    /// - Parameter connectorId: The connector to use.
    /// - Returns: Connection result with account info.
    /// - Throws: OnChainUXError if connection fails.
    public func connect(connectorId: String) async throws -> ConnectResult {
        connectionStatus = .connecting
        
        // Simulate wallet connection (in production, integrate with WalletConnect SDK or injected providers)
        try await Task.sleep(nanoseconds: 1_000_000_000)
        
        guard let config = config else {
            throw OnChainUXError.notConfigured
        }
        
        let chainId = config.chains.first?.chainId ?? 1
        let symbol = config.chains.first?.nativeCurrency.symbol ?? "ETH"
        
        // Simulated connection result
        let account = AccountInfo(
            address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            balance: "1.234",
            chainId: chainId,
            chainSymbol: symbol
        )
        
        let newSessionId = UUID().uuidString
        connectedAccount = account
        sessionId = newSessionId
        connectionStatus = .connected
        
        return ConnectResult(account: account, chainId: chainId, sessionId: newSessionId)
    }
    
    /// Disconnect from the current wallet.
    public func disconnect() async {
        connectedAccount = nil
        sessionId = nil
        connectionStatus = .disconnected
    }
    
    /// Get the list of available connectors.
    /// - Returns: Array of connector info.
    public func getConnectors() -> [ConnectorInfo] {
        connectors
    }
    
    /// Check if a specific wallet app is installed (via URL scheme).
    /// - Parameter walletId: Wallet identifier.
    /// - Returns: Whether the wallet app appears to be installed.
    public func isWalletInstalled(walletId: String) -> Bool {
        guard let scheme = urlScheme(for: walletId) else { return false }
        guard let url = URL(string: scheme) else { return false }
        return UIApplication.shared.canOpenURL(url)
    }
    
    /// Switch to a different chain.
    /// - Parameter chainId: Target chain ID.
    public func switchChain(chainId: Int) async throws {
        guard let config = config else {
            throw OnChainUXError.notConfigured
        }
        guard config.chains.contains(where: { $0.chainId == chainId }) else {
            throw OnChainUXError.chainNotSupported(chainId)
        }
        
        // In production: send wallet_switchEthereumChain request to connected wallet
        if var account = connectedAccount {
            // Update chain symbol
            if let chain = config.chains.first(where: { $0.chainId == chainId }) {
                account = AccountInfo(
                    address: account.address,
                    balance: account.balance,
                    chainId: chainId,
                    chainSymbol: chain.nativeCurrency.symbol,
                    ensName: account.ensName
                )
                connectedAccount = account
            }
        }
    }
    
    // MARK: - Private
    
    private func buildDefaultConnectors(config: OnChainUXConfig) -> [ConnectorInfo] {
        var list: [ConnectorInfo] = [
            ConnectorInfo(id: "metamask", name: "MetaMask", type: .walletconnect),
            ConnectorInfo(id: "walletconnect", name: "WalletConnect", type: .walletconnect),
            ConnectorInfo(id: "coinbase", name: "Coinbase Wallet", type: .coinbase),
            ConnectorInfo(id: "email", name: "Email", type: .email),
        ]
        return list
    }
    
    private func urlScheme(for walletId: String) -> String? {
        switch walletId {
        case "metamask": return "metamask://"
        case "coinbase", "cbwallet": return "cbwallet://"
        case "rainbow": return "rainbow://"
        case "trust": return "trust://"
        case "rabby": return "rabby://"
        case "phantom": return "phantom://"
        default: return nil
        }
    }
}
