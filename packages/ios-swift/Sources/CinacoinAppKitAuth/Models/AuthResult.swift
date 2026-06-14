import Foundation

/// Authentication result
public struct AuthResult: Equatable, Sendable {
    public let userId: String
    public let email: String?
    public let provider: AuthProvider?
    public let accessToken: String
    public let refreshToken: String?
    public let expiresAt: Date
    
    public init(
        userId: String,
        email: String? = nil,
        provider: AuthProvider? = nil,
        accessToken: String,
        refreshToken: String? = nil,
        expiresAt: Date
    ) {
        self.userId = userId
        self.email = email
        self.provider = provider
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.expiresAt = expiresAt
    }
    
    /// Check if token is expired
    public var isExpired: Bool {
        Date() >= expiresAt
    }
}

/// Supported auth providers
public enum AuthProvider: String, CaseIterable, Sendable {
    case google
    case apple
    case github
    case discord
    case email
}
