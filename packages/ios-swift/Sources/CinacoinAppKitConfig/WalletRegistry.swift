import Foundation

/// Recommended wallet configuration
public struct WalletConfig: Identifiable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let iconUrl: String?
    public let universalLink: String?
    public let deepLink: String?
    public let isInstalled: Bool
    
    public init(
        id: String,
        name: String,
        iconUrl: String? = nil,
        universalLink: String? = nil,
        deepLink: String? = nil,
        isInstalled: Bool = false
    ) {
        self.id = id
        self.name = name
        self.iconUrl = iconUrl
        self.universalLink = universalLink
        self.deepLink = deepLink
        self.isInstalled = isInstalled
    }
}

/// Registry of recommended wallets
public final class WalletRegistry: @unchecked Sendable {
    
    public static let shared = WalletRegistry()
    
    /// Recommended wallets for Cinacoin
    public static let recommended: [WalletConfig] = [
        WalletConfig(
            id: "metamask",
            name: "MetaMask",
            iconUrl: "https://registry.walletconnect.com/v2/logo/lg/0x1234",
            universalLink: "https://metamask.app.link",
            deepLink: "metamask://"
        ),
        WalletConfig(
            id: "rainbow",
            name: "Rainbow",
            iconUrl: "https://registry.walletconnect.com/v2/logo/lg/0x5678",
            universalLink: "https://rainbow.link",
            deepLink: "rainbow://"
        ),
        WalletConfig(
            id: "trust",
            name: "Trust Wallet",
            iconUrl: "https://registry.walletconnect.com/v2/logo/lg/0x9abc",
            universalLink: "https://link.trustwallet.com",
            deepLink: "trust://"
        ),
        WalletConfig(
            id: "coinbase",
            name: "Coinbase Wallet",
            iconUrl: "https://registry.walletconnect.com/v2/logo/lg/0xdef0",
            universalLink: "https://go.cb-w.com",
            deepLink: "cbwallet://"
        ),
    ]
    
    /// Get wallet by ID
    public func wallet(for id: String) -> WalletConfig? {
        Self.recommended.first { $0.id == id }
    }
    
    /// Check if wallet is recommended
    public func isRecommended(_ id: String) -> Bool {
        Self.recommended.contains { $0.id == id }
    }
}
