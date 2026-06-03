//
//  ChainManager.swift
//  CinacoinSDK
//
//  EVM chain registry and active-chain switching.
//

import Foundation
import Combine

/// Manages supported EVM chains and the active chain.
public final class ChainManager: ObservableObject, @unchecked Sendable {

    // MARK: - Shared Instance

    /// Shared instance for use via `CinacoinSDK.shared.chainManager`.
    public static let shared = ChainManager()

    // MARK: - Well-known Chains

    public static let ethereum = ChainConfig(
        chainId: 1,
        name: "Ethereum",
        symbol: "ETH",
        rpcUrl: "https://eth.llamarpc.com",
        explorerUrl: "https://etherscan.io"
    )

    public static let polygon = ChainConfig(
        chainId: 137,
        name: "Polygon",
        symbol: "MATIC",
        rpcUrl: "https://polygon-rpc.com",
        explorerUrl: "https://polygonscan.com",
        nativeCurrencyName: "MATIC"
    )

    public static let arbitrum = ChainConfig(
        chainId: 42161,
        name: "Arbitrum One",
        symbol: "ETH",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        explorerUrl: "https://arbiscan.io"
    )

    public static let base = ChainConfig(
        chainId: 8453,
        name: "Base",
        symbol: "ETH",
        rpcUrl: "https://mainnet.base.org",
        explorerUrl: "https://basescan.org"
    )

    public static let optimism = ChainConfig(
        chainId: 10,
        name: "Optimism",
        symbol: "ETH",
        rpcUrl: "https://mainnet.optimism.io",
        explorerUrl: "https://optimistic.etherscan.io"
    )

    public static let bsc = ChainConfig(
        chainId: 56,
        name: "BNB Smart Chain",
        symbol: "BNB",
        rpcUrl: "https://bsc-dataseed.binance.org",
        explorerUrl: "https://bscscan.com",
        nativeCurrencyName: "BNB"
    )

    /// Registry of all supported chains.
    public static let allChains: [ChainConfig] = [
        ethereum, polygon, arbitrum, base, optimism, bsc,
    ]

    /// Lookup by chain ID.
    public static func chain(for chainId: Int) -> ChainConfig? {
        allChains.first { $0.chainId == chainId }
    }

    /// Convert a numeric chain ID to the WalletConnect namespace string.
    public static func namespaceString(for chainId: Int) -> String {
        "eip155:\(chainId)"
    }

    // MARK: - Active Chain

    @Published public private(set) var activeChain: ChainConfig = ethereum

    /// Set the active chain by ID.
    /// - Throws: `.chainNotSupported` if the chain ID is not registered.
    public func setActiveChain(chainId: Int) throws {
        guard let chain = Self.chain(for: chainId) else {
            throw CinacoinError.chainNotSupported(chainId)
        }
        activeChain = chain
    }

    /// Set the active chain directly.
    public func setActiveChain(_ chain: ChainConfig) {
        activeChain = chain
    }

    /// Returns true if the given chain ID is in the supported registry.
    public func isSupported(chainId: Int) -> Bool {
        Self.chain(for: chainId) != nil
    }

    /// Return the WalletConnect-formatted namespace strings for all supported chains.
    public func supportedNamespaces() -> [String] {
        allChains.map { Self.namespaceString(for: $0.chainId) }
    }
}
