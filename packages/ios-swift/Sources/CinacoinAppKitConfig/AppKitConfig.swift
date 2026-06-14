import Foundation

/// Configuration for Cinacoin AppKit
public struct AppKitConfig: Equatable, Sendable {
    
    /// Project ID from Reown Cloud
    public let projectId: String
    
    /// Application metadata
    public let metadata: AppMetadata
    
    /// Theme mode
    public let themeMode: ThemeMode
    
    /// Supported chains
    public let chains: [ChainConfig]
    
    /// Recommended wallet IDs
    public let recommendedWallets: [String]
    
    /// Enable analytics
    public let enableAnalytics: Bool
    
    /// Enable email login
    public let enableEmail: Bool
    
    /// Enable social logins
    public let enableSocials: Bool
    
    public struct AppMetadata: Equatable, Sendable {
        public let name: String
        public let description: String
        public let url: String
        public let icons: [String]
        
        public init(name: String, description: String, url: String, icons: [String] = []) {
            self.name = name
            self.description = description
            self.url = url
            self.icons = icons
        }
    }
    
    public enum ThemeMode: String, Equatable, Sendable {
        case light
        case dark
    }
    
    /// Create configuration with defaults
    public init(
        projectId: String,
        metadata: AppMetadata,
        themeMode: ThemeMode = .dark,
        chains: [ChainConfig] = ChainRegistry.allEVMChains,
        recommendedWallets: [String] = WalletRegistry.recommended.map { $0.id },
        enableAnalytics: Bool = false,
        enableEmail: Bool = false,
        enableSocials: Bool = false
    ) {
        self.projectId = projectId
        self.metadata = metadata
        self.themeMode = themeMode
        self.chains = chains
        self.recommendedWallets = recommendedWallets
        self.enableAnalytics = enableAnalytics
        self.enableEmail = enableEmail
        self.enableSocials = enableSocials
    }
    
    /// Get theme based on mode
    public var theme: CinacoinTheme {
        switch themeMode {
        case .light: return .light
        case .dark: return .dark
        }
    }
}

// MARK: - CinacoinAppKit Entry Point

/// Main entry point for Cinacoin AppKit iOS
public final class CinacoinAppKit {
    
    private static var _config: AppKitConfig?
    
    /// Current configuration
    public static var config: AppKitConfig? {
        _config
    }
    
    /// Configure Cinacoin AppKit
    /// - Parameter config: AppKit configuration
    public static func configure(with config: AppKitConfig) {
        _config = config
    }
    
    /// Reset configuration
    public static func reset() {
        _config = nil
    }
}
