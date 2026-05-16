/**
 * EVMChainAdapter — EVM chain adapter for iOS.
 *
 * Provides EVM-specific operations: balance queries, contract calls,
 * gas estimation, and transaction signing through a connected wallet.
 *
 * ## Usage
 * ```swift
 * let adapter = EVMChainAdapter()
 * adapter.setRpcUrl("https://eth.llamarpc.com")
 *
 * let balance = try await adapter.getBalance(address: "0x...")
 * let gasPrice = try await adapter.getGasPrice()
 * let receipt = try await adapter.getTransaction(hash: "0x...")
 * ```
 */

import Foundation

/// Parameters for an EVM contract call.
public struct EthCallParams: Sendable {
    /// Target contract address.
    public let to: String
    /// Encoded function call data (hex).
    public let data: String?
    /// Caller address.
    public let from: String?
    /// ETH value to send (hex).
    public let value: String?
    /// Block number (default: "latest").
    public let blockNumber: String?
    
    public init(
        to: String,
        data: String? = nil,
        from: String? = nil,
        value: String? = nil,
        blockNumber: String? = nil
    ) {
        self.to = to
        self.data = data
        self.from = from
        self.value = value
        self.blockNumber = blockNumber
    }
}

/// EVM chain adapter providing chain-specific operations.
public final class EVMChainAdapter {
    
    /// RPC endpoint URL.
    private var rpcUrl: String = ""
    
    /// Registered chains.
    private var chains: [ChainConfig] = []
    
    /// Create a new EVM adapter.
    public init() {}
    
    // MARK: - Configuration
    
    /// Register supported EVM chains.
    /// - Parameter chains: Array of chain configurations.
    public func registerChains(_ chains: [ChainConfig]) {
        self.chains = chains
    }
    
    /// Set the RPC endpoint URL.
    /// - Parameter url: RPC URL.
    public func setRpcUrl(_ url: String) {
        self.rpcUrl = url
    }
    
    // MARK: - Balance
    
    /// Get the native balance for an address.
    /// - Parameter address: Ethereum address.
    /// - Returns: Balance in wei (hex string).
    public func getBalance(address: String) async throws -> String {
        guard !rpcUrl.isEmpty else {
            throw EVMError.rpcNotConfigured
        }
        let response = try await rpcCall(method: "eth_getBalance", params: [address, "latest"])
        return response as? String ?? "0x0"
    }
    
    /// Get formatted balance in ETH.
    /// - Parameter address: Ethereum address.
    /// - Returns: Balance as a decimal string.
    public func getBalanceFormatted(address: String) async throws -> String {
        let hexBalance = try await getBalance(address: address)
        return hexToEth(hexBalance)
    }
    
    // MARK: - Contract Calls
    
    /// Call a contract read method.
    /// - Parameter params: Call parameters.
    /// - Returns: Result data (hex string).
    public func call(params: EthCallParams) async throws -> String {
        guard !rpcUrl.isEmpty else {
            throw EVMError.rpcNotConfigured
        }
        let callParams: [String: Any] = buildCallParams(params)
        let blockTag = params.blockNumber ?? "latest"
        let response = try await rpcCall(method: "eth_call", params: [callParams, blockTag])
        return response as? String ?? "0x"
    }
    
    /// Get ERC-20 token balance for an address.
    /// - Parameters:
    ///   - tokenAddress: ERC-20 contract address.
    ///   - userAddress: User wallet address.
    /// - Returns: Token balance (hex string).
    public func getTokenBalance(tokenAddress: String, userAddress: String) async throws -> String {
        // ERC-20 balanceOf function selector + padded address
        let paddedAddress = userAddress
            .replacingOccurrences(of: "0x", with: "")
            .padding(toLength: 64, withPad: "0", startingAt: 0)
        let data = "0x70a08231\(paddedAddress.lowercased())"
        
        return try await call(params: EthCallParams(
            to: tokenAddress,
            data: data
        ))
    }
    
    // MARK: - Gas
    
    /// Estimate gas for a transaction.
    /// - Parameter tx: Transaction parameters.
    /// - Returns: Gas estimate (hex string).
    public func estimateGas(tx: [String: String]) async throws -> String {
        guard !rpcUrl.isEmpty else {
            throw EVMError.rpcNotConfigured
        }
        let response = try await rpcCall(method: "eth_estimateGas", params: [tx])
        return response as? String ?? "0x0"
    }
    
    /// Get the current gas price.
    /// - Returns: Gas price in wei (hex string).
    public func getGasPrice() async throws -> String {
        guard !rpcUrl.isEmpty else {
            throw EVMError.rpcNotConfigured
        }
        let response = try await rpcCall(method: "eth_gasPrice")
        return response as? String ?? "0x0"
    }
    
    // MARK: - Transactions
    
    /// Get a transaction by hash.
    /// - Parameter hash: Transaction hash.
    /// - Returns: Transaction data.
    public func getTransaction(hash: String) async throws -> [String: Any] {
        guard !rpcUrl.isEmpty else {
            throw EVMError.rpcNotConfigured
        }
        let response = try await rpcCall(method: "eth_getTransactionByHash", params: [hash])
        return response as? [String: Any] ?? [:]
    }
    
    /// Get a transaction receipt.
    /// - Parameter hash: Transaction hash.
    /// - Returns: Receipt data.
    public func getTransactionReceipt(hash: String) async throws -> [String: Any] {
        guard !rpcUrl.isEmpty else {
            throw EVMError.rpcNotConfigured
        }
        let response = try await rpcCall(method: "eth_getTransactionReceipt", params: [hash])
        return response as? [String: Any] ?? [:]
    }
    
    /// Get the current block number.
    /// - Returns: Block number (decimal).
    public func getBlockNumber() async throws -> Int {
        guard !rpcUrl.isEmpty else {
            throw EVMError.rpcNotConfigured
        }
        let response = try await rpcCall(method: "eth_blockNumber")
        if let hex = response as? String {
            return Int(hex.replacingOccurrences(of: "0x", with: ""), radix: 16) ?? 0
        }
        return 0
    }
    
    // MARK: - Chain Lookup
    
    /// Find a chain by ID.
    /// - Parameter chainId: Chain ID to find.
    /// - Returns: Chain configuration, or nil.
    public func findChain(chainId: Int) -> ChainConfig? {
        chains.first { $0.chainId == chainId }
    }
    
    // MARK: - Formatting
    
    /// Format a transaction into a JSON-RPC compatible format.
    /// - Parameter tx: Transaction request.
    /// - Returns: Dictionary for JSON-RPC params.
    public static func formatTransaction(_ tx: TransactionRequest) -> [String: String] {
        var formatted: [String: String] = [:]
        if !tx.from.isEmpty { formatted["from"] = tx.from }
        if !tx.to.isEmpty { formatted["to"] = tx.to }
        if let value = tx.value { formatted["value"] = value }
        if let data = tx.data { formatted["data"] = data }
        if let gas = tx.gas { formatted["gas"] = gas }
        if let gasPrice = tx.gasPrice { formatted["gasPrice"] = gasPrice }
        if let maxFee = tx.maxFeePerGas { formatted["maxFeePerGas"] = maxFee }
        if let maxPriority = tx.maxPriorityFeePerGas { formatted["maxPriorityFeePerGas"] = maxPriority }
        if let nonce = tx.nonce { formatted["nonce"] = nonce }
        if let chainId = tx.chainId { formatted["chainId"] = String(format: "0x%x", chainId) }
        return formatted
    }
    
    /// Convert a hex balance string to ETH.
    /// - Parameter hex: Hex balance.
    /// - Returns: ETH as a decimal string.
    public static func hexToEth(_ hex: String) -> String {
        let cleanHex = hex.replacingOccurrences(of: "0x", with: "")
        guard let wei = UInt64(cleanHex, radix: 16) else { return "0" }
        let eth = Double(wei) / 1e18
        return String(format: "%.6f", eth)
    }
    
    // MARK: - Private
    
    private func buildCallParams(_ params: EthCallParams) -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["to"] = params.to
        if let data = params.data { dict["data"] = data }
        if let from = params.from { dict["from"] = from }
        if let value = params.value { dict["value"] = value }
        return dict
    }
    
    private func rpcCall(method: String, params: [Any] = []) async throws -> Any {
        let body: [String: Any] = [
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        ]
        
        guard let url = URL(string: rpcUrl) else {
            throw EVMError.invalidRpcUrl(rpcUrl)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw EVMError.rpcError("HTTP error")
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw EVMError.rpcError("Invalid JSON response")
        }
        
        if let error = json["error"] as? [String: Any],
           let message = error["message"] as? String {
            throw EVMError.rpcError(message)
        }
        
        return json["result"] ?? ""
    }
}

// MARK: - Errors

/// EVM adapter errors.
public enum EVMError: Error, LocalizedError {
    case rpcNotConfigured
    case invalidRpcUrl(String)
    case rpcError(String)
    
    public var errorDescription: String? {
        switch self {
        case .rpcNotConfigured:
            return "RPC URL not configured. Call setRpcUrl() first."
        case let .invalidRpcUrl(url):
            return "Invalid RPC URL: \(url)"
        case let .rpcError(msg):
            return "RPC error: \(msg)"
        }
    }
}
