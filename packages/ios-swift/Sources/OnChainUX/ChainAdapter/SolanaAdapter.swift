/**
 * SolanaChainAdapter — Solana chain adapter for iOS.
 *
 * Provides Solana-specific operations: balance queries, transaction building,
 * message signing, and SPL token support.
 *
 * ## Usage
 * ```swift
 * let adapter = SolanaChainAdapter()
 * adapter.setRpcUrl("https://api.mainnet-beta.solana.com")
 *
 * let balance = try await adapter.getBalance(address: "7xKX...")
 * let signature = try await adapter.signMessage(message: "Hello")
 * ```
 */

import Foundation

/// Solana wallet information.
public struct SolanaWalletInfo: Sendable {
    public let id: String
    public let name: String
    public let rdns: String
    public let icon: String
    public let downloadUrl: String
    
    public init(id: String, name: String, rdns: String, icon: String, downloadUrl: String) {
        self.id = id
        self.name = name
        self.rdns = rdns
        self.icon = icon
        self.downloadUrl = downloadUrl
    }
}

/// Solana chain adapter.
public final class SolanaChainAdapter: ObservableObject {
    
    /// RPC endpoint URL.
    @Published public var rpcUrl: String = "https://api.mainnet-beta.solana.com"
    
    /// Connected address.
    @Published public private(set) var connectedAddress: String?
    
    /// Registered chains.
    private var chains: [ChainConfig] = []
    
    /// Solana wallet presets.
    public static let wallets: [SolanaWalletInfo] = [
        SolanaWalletInfo(id: "phantom", name: "Phantom", rdns: "app.phantom",
                         icon: "https://phantom.app/img/phantom-icon.png",
                         downloadUrl: "https://phantom.app/download"),
        SolanaWalletInfo(id: "solflare", name: "Solflare", rdns: "app.solflare",
                         icon: "https://solflare.com/icon.png",
                         downloadUrl: "https://solflare.com/download"),
        SolanaWalletInfo(id: "backpack", name: "Backpack", rdns: "app.backpack",
                         icon: "https://backpack.app/icon.png",
                         downloadUrl: "https://backpack.app/download"),
    ]
    
    /// Solana chain presets.
    public static let chains: [ChainConfig] = [
        ChainConfig(chainId: 101, name: "Solana Mainnet",
                    rpcUrl: "https://api.mainnet-beta.solana.com",
                    nativeCurrency: NativeCurrency(name: "Solana", symbol: "SOL", decimals: 9),
                    blockExplorerUrl: "https://explorer.solana.com"),
        ChainConfig(chainId: 102, name: "Solana Devnet",
                    rpcUrl: "https://api.devnet.solana.com",
                    nativeCurrency: NativeCurrency(name: "Solana", symbol: "SOL", decimals: 9),
                    blockExplorerUrl: "https://explorer.solana.com/?cluster=devnet",
                    testnet: true),
        ChainConfig(chainId: 103, name: "Solana Testnet",
                    rpcUrl: "https://api.testnet.solana.com",
                    nativeCurrency: NativeCurrency(name: "Solana", symbol: "SOL", decimals: 9),
                    blockExplorerUrl: "https://explorer.solana.com/?cluster=testnet",
                    testnet: true),
    ]
    
    public init() {}
    
    // MARK: - Configuration
    
    /// Register supported Solana chains.
    public func registerChains(_ chains: [ChainConfig]) {
        self.chains = chains
    }
    
    /// Set the RPC endpoint URL.
    public func setRpcUrl(_ url: String) {
        self.rpcUrl = url
    }
    
    // MARK: - Address Validation
    
    /// Validate a Solana base58 address.
    /// - Parameter address: Address to validate.
    /// - Returns: Whether the address is valid.
    public static func isValidAddress(_ address: String) -> Bool {
        // Base58 alphabet (no 0, O, I, l)
        let base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
        guard address.count >= 32 && address.count <= 44 else { return false }
        return address.allSatisfy { base58.contains($0) }
    }
    
    /// Decode a base58 string to bytes.
    /// - Parameter input: Base58-encoded string.
    /// - Returns: Decoded bytes.
    public static func base58Decode(_ input: String) -> [UInt8] {
        let base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
        var num: UInt64 = 0
        for char in input {
            guard let index = base58.firstIndex(of: char) else { continue }
            num = num * 58 + UInt64(base58.distance(from: base58.startIndex, to: index))
        }
        
        var bytes: [UInt8] = []
        while num > 0 {
            bytes.insert(UInt8(num % 256), at: 0)
            num /= 256
        }
        
        // Add leading zeros
        for char in input.prefix(while: { $0 == "1" }) {
            _ = char
            bytes.insert(0, at: 0)
        }
        
        return bytes
    }
    
    // MARK: - Balance
    
    /// Get SOL balance for an address.
    /// - Parameter address: Base58-encoded Solana address.
    /// - Returns: Balance in SOL (decimal string).
    public func getBalance(address: String) async throws -> String {
        guard Self.isValidAddress(address) else {
            throw SolanaError.invalidAddress(address)
        }
        
        let response = try await rpcCall(method: "getBalance", params: [address])
        guard let result = response as? [String: Any],
              let value = result["value"] as? UInt64 else {
            throw SolanaError.rpcError("Invalid balance response")
        }
        
        let sol = Double(value) / 1e9
        return String(format: "%.6f", sol)
    }
    
    // MARK: - Transactions
    
    /// Build a System Program transfer instruction.
    /// - Parameters:
    ///   - from: Sender address.
    ///   - to: Recipient address.
    ///   - lamports: Amount in lamports.
    /// - Returns: Transfer instruction dictionary.
    public func buildTransferInstruction(
        from: String,
        to: String,
        lamports: UInt64
    ) throws -> [String: Any] {
        guard Self.isValidAddress(from) else {
            throw SolanaError.invalidAddress(from)
        }
        guard Self.isValidAddress(to) else {
            throw SolanaError.invalidAddress(to)
        }
        
        return [
            "fromPubkey": from,
            "toPubkey": to,
            "lamports": lamports
        ]
    }
    
    /// Send a transaction (base64-encoded).
    /// - Parameter base64Tx: Base64-encoded serialized transaction.
    /// - Returns: Transaction signature.
    public func sendTransaction(_ base64Tx: String) async throws -> String {
        let response = try await rpcCall(
            method: "sendTransaction",
            params: [base64Tx, ["encoding": "base64"]]
        )
        guard let signature = response as? String else {
            throw SolanaError.rpcError("Invalid sendTransaction response")
        }
        return signature
    }
    
    // MARK: - Message Signing
    
    /// Sign a message with the connected wallet.
    /// - Parameter message: Message to sign.
    /// - Returns: Signature as a base58-encoded string.
    public func signMessage(_ message: String) async throws -> String {
        guard connectedAddress != nil else {
            throw SolanaError.notConnected
        }
        
        let bytes = [UInt8](message.utf8)
        let encodedMessage = Data(bytes).base64EncodedString()
        
        // In production: send to wallet for signing
        // This is a placeholder for the actual wallet integration
        throw SolanaError.notImplemented("Message signing requires wallet integration")
    }
    
    // MARK: - SPL Tokens
    
    /// Build an SPL token transfer instruction.
    /// - Parameters:
    ///   - mint: SPL token mint address.
    ///   - source: Source token account.
    ///   - destination: Destination token account.
    ///   - owner: Owner of the source account.
    ///   - amount: Token amount.
    /// - Returns: Transfer instruction dictionary.
    public func buildSPLTransferInstruction(
        mint: String,
        source: String,
        destination: String,
        owner: String,
        amount: UInt64
    ) throws -> [String: Any] {
        return [
            "mint": mint,
            "source": source,
            "destination": destination,
            "owner": owner,
            "amount": amount
        ]
    }
    
    // MARK: - EIP-1193 Compatible
    
    /// EIP-1193 compatible request method for Solana.
    /// - Parameter args: Method and parameters.
    /// - Returns: Response data.
    public func request(method: String, params: [Any]) async throws -> Any {
        switch method {
        case "solana_getBalance":
            guard let address = params.first as? String else {
                throw SolanaError.invalidParams
            }
            return try await getBalance(address: address)
        case "solana_sendTransaction":
            guard let tx = params.first as? String else {
                throw SolanaError.invalidParams
            }
            return try await sendTransaction(tx)
        case "solana_signMessage":
            guard let msg = params.first as? String else {
                throw SolanaError.invalidParams
            }
            return try await signMessage(msg)
        case "solana_getLatestBlockhash":
            return try await getLatestBlockhash()
        default:
            throw SolanaError.unsupportedMethod(method)
        }
    }
    
    // MARK: - Utility
    
    /// Find a chain by ID.
    public func findChain(chainId: Int) -> ChainConfig? {
        chains.first { $0.chainId == chainId }
    }
    
    /// Convert SOL to lamports.
    public static func solToLamports(_ sol: Double) -> UInt64 {
        UInt64(sol * 1e9)
    }
    
    /// Convert lamports to SOL.
    public static func lamportsToSol(_ lamports: UInt64) -> String {
        String(format: "%.6f", Double(lamports) / 1e9)
    }
    
    // MARK: - Private
    
    private func getLatestBlockhash() async throws -> [String: Any] {
        let response = try await rpcCall(method: "getLatestBlockhash")
        guard let result = response as? [String: Any],
              let value = result["value"] as? [String: Any] else {
            throw SolanaError.rpcError("Invalid blockhash response")
        }
        return value
    }
    
    private func rpcCall(method: String, params: [Any] = []) async throws -> Any {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        ]
        
        guard let url = URL(string: rpcUrl) else {
            throw SolanaError.invalidRpcUrl(rpcUrl)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw SolanaError.rpcError("HTTP error")
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw SolanaError.rpcError("Invalid JSON response")
        }
        
        if let error = json["error"] as? [String: Any],
           let message = error["message"] as? String {
            throw SolanaError.rpcError(message)
        }
        
        return json["result"] ?? ""
    }
}

// MARK: - Errors

/// Solana adapter errors.
public enum SolanaError: Error, LocalizedError {
    case invalidAddress(String)
    case notConnected
    case invalidRpcUrl(String)
    case rpcError(String)
    case invalidParams
    case unsupportedMethod(String)
    case notImplemented(String)
    
    public var errorDescription: String? {
        switch self {
        case let .invalidAddress(addr): return "Invalid Solana address: \(addr)"
        case .notConnected: return "Not connected to a Solana wallet"
        case let .invalidRpcUrl(url): return "Invalid RPC URL: \(url)"
        case let .rpcError(msg): return "RPC error: \(msg)"
        case .invalidParams: return "Invalid parameters"
        case let .unsupportedMethod(method): return "Unsupported method: \(method)"
        case let .notImplemented(msg): return "Not implemented: \(msg)"
        }
    }
}
