import Foundation

/// Chain configuration model
public struct ChainConfig: Identifiable, Equatable, Sendable {
    public var id: Int { chainId }
    
    public let chainId: Int
    public let name: String
    public let shortName: String
    public let symbol: String
    public let decimals: Int
    public let rpcUrl: String
    public let explorerUrl: String
    public let iconUrl: String?
    public let testnet: Bool
    
    public init(
        chainId: Int,
        name: String,
        shortName: String,
        symbol: String,
        decimals: Int = 18,
        rpcUrl: String,
        explorerUrl: String,
        iconUrl: String? = nil,
        testnet: Bool = false
    ) {
        self.chainId = chainId
        self.name = name
        self.shortName = shortName
        self.symbol = symbol
        self.decimals = decimals
        self.rpcUrl = rpcUrl
        self.explorerUrl = explorerUrl
        self.iconUrl = iconUrl
        self.testnet = testnet
    }
}
