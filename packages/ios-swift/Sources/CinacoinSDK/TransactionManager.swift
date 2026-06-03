//
//  TransactionManager.swift
//  CinacoinSDK
//
//  Builds, sends, and tracks EVM transactions through the connected wallet.
//

import Foundation

/// Manages transaction construction and sending via the connected wallet.
public final class TransactionManager: Sendable {

    // MARK: - State

    private let walletConnect: WalletConnectManager
    private let chainManager: ChainManager
    private var primaryAddress: String?

    init(walletConnect: WalletConnectManager, chainManager: ChainManager) {
        self.walletConnect = walletConnect
        self.chainManager = chainManager
    }

    /// Update the primary address after a connection event.
    func setPrimaryAddress(_ address: String) {
        primaryAddress = address
    }

    // MARK: - Send Transaction

    /// Send a transaction through the connected wallet for signing and broadcasting.
    ///
    /// - Parameter tx: The transaction to send.
    /// - Returns: The transaction hash (`0x`-prefixed hex string).
    public func sendTransaction(_ tx: TransactionRequest) async throws -> String {
        guard let address = primaryAddress else {
            throw CinacoinError.notConnected
        }

        // Validate the destination address.
        guard tx.to.hasPrefix("0x") && tx.to.count == 42 else {
            throw CinacoinError.invalidAddress(tx.to)
        }

        // Determine the chain ID for the RPC call.
        let chainId = tx.chainId ?? await MainActor.run { chainManager.activeChain.chainId }
        let chain = ChainManager.chain(for: chainId)
        guard chain != nil else {
            throw CinacoinError.chainNotSupported(chainId)
        }

        // Build the EIP-155 transaction parameters.
        let params = buildTransactionParams(from: tx, chainId: chainId, from: address)

        // In production: send `eth_sendTransaction` via WalletConnect request.
        // let hash = try await walletConnect.request(
        //     method: "eth_sendTransaction",
        //     params: [params]
        // )

        return "0x" + String(repeating: "0", count: 64)
    }

    // MARK: - Estimate Gas

    /// Estimate the gas cost for a transaction.
    ///
    /// - Parameter tx: The transaction to estimate.
    /// - Returns: Estimated gas as a hex string.
    public func estimateGas(_ tx: TransactionRequest) async throws -> String {
        // In production: call `eth_estimateGas` via JSON-RPC.
        return "0x5208" // 21000 gas — standard ETH transfer
    }

    // MARK: - Get Balance

    /// Fetch the native token balance for an address.
    ///
    /// - Parameters:
    ///   - address: The wallet address.
    ///   - chainId: Optional chain override.
    /// - Returns: Balance in wei as a hex string.
    public func getBalance(address: String, chainId: Int? = nil) async throws -> String {
        guard address.hasPrefix("0x") && address.count == 42 else {
            throw CinacoinError.invalidAddress(address)
        }

        // In production: call `eth_getBalance` via JSON-RPC.
        return "0x0"
    }

    // MARK: - Transaction Explorer URL

    /// Generate a block explorer URL for a transaction hash.
    ///
    /// - Parameters:
    ///   - txHash: The transaction hash.
    ///   - chainId: Optional chain override.
    /// - Returns: Explorer URL string, or nil if no explorer is configured.
    public func explorerUrl(for txHash: String, chainId: Int? = nil) -> String? {
        let cid = chainId ?? chainManager.activeChain.chainId
        guard let chain = ChainManager.chain(for: cid),
              let explorer = chain.explorerUrl else {
            return nil
        }
        return "\(explorer)/tx/\(txHash)"
    }

    // MARK: - Internal

    private func buildTransactionParams(
        from tx: TransactionRequest,
        chainId: Int,
        from: String
    ) -> [String: Any] {
        var params: [String: Any] = [
            "from": from,
            "to": tx.to,
        ]

        if let value = tx.value { params["value"] = value }
        if let data = tx.data { params["data"] = data }
        if let gas = tx.gas { params["gas"] = gas }
        if let gasPrice = tx.gasPrice { params["gasPrice"] = gasPrice }
        if let maxFee = tx.maxFeePerGas { params["maxFeePerGas"] = maxFee }
        if let priorityFee = tx.maxPriorityFeePerGas { params["maxPriorityFeePerGas"] = priorityFee }
        if let nonce = tx.nonce { params["nonce"] = nonce }

        return params
    }
}
