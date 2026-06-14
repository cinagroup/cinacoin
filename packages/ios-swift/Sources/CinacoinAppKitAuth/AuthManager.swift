import Foundation

/// Unified auth manager combining social and email login
public final class AuthManager: ObservableObject, @unchecked Sendable {
    
    public static let shared = AuthManager()
    
    @Published public private(set) var currentUser: AuthResult?
    @Published public private(set) var isAuthenticated = false
    
    private var socialLogin: SocialLoginManager?
    private var emailLogin: EmailLoginManager?
    
    private let keychainKey = "com.cinacoin.auth.token"
    
    /// Configure auth manager
    public func configure(authUrl: String = "https://auth.cinacoin.com", projectId: String) {
        socialLogin = SocialLoginManager(authUrl: authUrl, projectId: projectId)
        emailLogin = EmailLoginManager(authUrl: authUrl, projectId: projectId)
        
        // Restore session from keychain
        restoreSession()
    }
    
    // MARK: - Social Login
    
    public func signInWithApple() async throws -> AuthResult {
        guard let socialLogin = socialLogin else {
            throw AuthError.notImplemented("Auth not configured. Call configure() first.")
        }
        let result = try await socialLogin.signInWithApple()
        await handleAuthResult(result)
        return result
    }
    
    public func signInWithGoogle() async throws -> AuthResult {
        guard let socialLogin = socialLogin else {
            throw AuthError.notImplemented("Auth not configured")
        }
        let result = try await socialLogin.signInWithGoogle()
        await handleAuthResult(result)
        return result
    }
    
    public func signInWithGitHub() async throws -> AuthResult {
        guard let socialLogin = socialLogin else {
            throw AuthError.notImplemented("Auth not configured")
        }
        let result = try await socialLogin.signInWithGitHub()
        await handleAuthResult(result)
        return result
    }
    
    public func signInWithDiscord() async throws -> AuthResult {
        guard let socialLogin = socialLogin else {
            throw AuthError.notImplemented("Auth not configured")
        }
        let result = try await socialLogin.signInWithDiscord()
        await handleAuthResult(result)
        return result
    }
    
    // MARK: - Email Login
    
    public func register(email: String, password: String) async throws -> AuthResult {
        guard let emailLogin = emailLogin else {
            throw AuthError.notImplemented("Auth not configured")
        }
        let result = try await emailLogin.register(email: email, password: password)
        await handleAuthResult(result)
        return result
    }
    
    public func login(email: String, password: String) async throws -> AuthResult {
        guard let emailLogin = emailLogin else {
            throw AuthError.notImplemented("Auth not configured")
        }
        let result = try await emailLogin.login(email: email, password: password)
        await handleAuthResult(result)
        return result
    }
    
    // MARK: - Session Management
    
    public func signOut() {
        currentUser = nil
        isAuthenticated = false
        // Remove from keychain
        try? KeychainHelper.delete(key: keychainKey)
    }
    
    public func refreshToken() async throws -> AuthResult {
        guard let current = currentUser, let refreshToken = current.refreshToken else {
            throw AuthError.tokenExpired
        }
        // Refresh token via API
        // In production, call auth service
        throw AuthError.notImplemented("Token refresh not yet implemented")
    }
    
    // MARK: - Private
    
    @MainActor
    private func handleAuthResult(_ result: AuthResult) {
        currentUser = result
        isAuthenticated = true
        // Store in keychain
        try? KeychainHelper.save(key: keychainKey, data: result.accessToken.data(using: .utf8) ?? Data())
    }
    
    private func restoreSession() {
        guard let data = try? KeychainHelper.load(key: keychainKey),
              let token = String(data: data, encoding: .utf8) else {
            return
        }
        // Restore session from stored token
        // In production, validate token with auth service
        _ = token
    }
}

/// Simple keychain helper
enum KeychainHelper {
    static func save(key: String, data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    static func load(key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        return result as? Data
    }
    
    static func delete(key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
