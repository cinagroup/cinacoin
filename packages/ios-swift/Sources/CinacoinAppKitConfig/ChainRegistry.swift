import Foundation

/// Centralized chain configuration for Cinacoin SDKs
public final class ChainRegistry: ObservableObject, @unchecked Sendable {
    
    public static let shared = ChainRegistry()
    
    // MARK: - Well-known EVM Chains
    
    public static let ethereum = ChainConfig(
        chainId: 1,
        name: "Ethereum",
        shortName: "eth",
        symbol: "ETH",
        decimals: 18,
        rpcUrl: "https://eth.llamarpc.com",
        explorerUrl: "https://etherscan.io",
        iconUrl: "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg",
        testnet: false
    )
    
    public static let polygon = ChainConfig(
        chainId: 137,
        name: "Polygon",
        shortName: "matic",
        symbol: "MATIC",
        decimals: 18,
        rpcUrl: "https://polygon-rpc.com",
        explorerUrl: "https://polygonscan.com",
        iconUrl: "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg",
        testnet: false
    )
    
    public static let arbitrum = ChainConfig(
        chainId: 42161,
        name: "Arbitrum One",
        shortName: "arb",
        symbol: "ETH",
        decimals: 18,
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        explorerUrl: "https://arbiscan.io",
        iconUrl: "https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg",
        testnet: false
    )
    
    public static let optimism = ChainConfig(
        chainId: 10,
        name: "Optimism",
        shortName: "op",
        symbol: "ETH",
        decimals: 18,
        rpcUrl: "https://mainnet.optimism.io",
        explorerUrl: "https://optimistic.etherscan.io",
        iconUrl: "https://icons.llamao.fi/icons/chains/rsz_optimism.jpg",
        testnet: false
    )
    
    public static let base = ChainConfig(
        chainId: 8453,
        name: "Base",
        shortName: "base",
        symbol: "ETH",
        decimals: 18,
        rpcUrl: "https://mainnet.base.org",
        explorerUrl: "https://basescan.org",
        iconUrl: "https://icons.llamao.fi/icons/chains/rsz_base.jpg",
        testnet: false
    )
    
    public static let bsc = ChainConfig(
        chainId: 56,
        name: "BNB Smart Chain",
        shortName: "bsc",
        symbol: "BNB",
        decimals: 18,
        rpcUrl: "https://bsc-dataseed.binance.org",
        explorerUrl: "https://bscscan.com",
        iconUrl: "https://icons.llamao.fi/icons/chains/rsz_bsc.jpg",
        testnet: false
    )
    
    public static let avalanche = ChainConfig(
        chainId: 43114,
        name: "Avalanche C-Chain",
        shortName: "avax",
        symbol: "AVAX",
        decimals: 18,
        rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
        explorerUrl: "https://snowtrace.io",
        iconUrl: "https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg",
        testnet: false
    )
    
    /// All supported EVM chains
    public static let allEVMChains: [ChainConfig] = [
        ethereum, polygon, arbitrum, optimism, base, bsc, avalanche
    ]
    
    /// Lookup chain by chain ID
    public func chain(for chainId: Int) -> ChainConfig? {
        Self.allEVMChains.first { $0.chainId == chainId }
    }
    
    /// Get CAIP-2 namespace string
    public func namespaceString(for chainId: Int) -> String {
        "eip155:\(chainId)"
    }
}
