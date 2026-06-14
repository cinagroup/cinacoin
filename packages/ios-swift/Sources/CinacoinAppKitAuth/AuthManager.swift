import Foundation

/// Unified auth manager combining social and email login
public final class AuthManager: ObservableObject, @unchecked Sendable {
    
    public static let shared = AuthManager()
    
    @Published public private(set) var currentUser: AuthResult?
    @Published public private(set) var isAuthenticated = false
    
    private var socialLogin: SocialLoginManager?
    private var emailLogin: EmailLoginManager?
    
    private let authUrl: String
    private let projectId: String
    
    /// Timer for auto-refresh
    private var refreshTimer: Timer?
    
    /// How many seconds before expiry to trigger a refresh
    private let refreshThresholdSeconds: TimeInterval = 300 // 5 minutes
    
    private init() {
        self.authUrl = "https://auth.cinacoin.com"
        self.projectId = ""
    }
    
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
        cancelRefreshTimer()
        
        // Remove all tokens from keychain
        try? KeychainHelper.delete(key: KeychainKeys.accessToken)
        try? KeychainHelper.delete(key: KeychainKeys.refreshToken)
        try? KeychainHelper.delete(key: KeychainKeys.userId)
        try? KeychainHelper.delete(key: KeychainKeys.expiresAt)
    }
    
    // MARK: - Token Refresh
    
    /// Refresh the access token using the stored refresh token
    public func refreshToken() async throws -> AuthResult {
        guard let current = currentUser,
              let refreshTokenValue = current.refreshToken else {
            throw AuthError.tokenExpired
        }
        
        let url = URL(string: "\(authUrl)/api/auth/oauth/refresh")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "refresh_token": refreshTokenValue,
            "project_id": projectId
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw AuthError.refreshFailed("Server returned status \(statusCode)")
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let accessToken = json["access_token"] as? String,
              let userId = json["user_id"] as? String,
              let expiresAt = json["expires_at"] as? TimeInterval else {
            throw AuthError.refreshFailed("Invalid response format")
        }
        
        let newRefreshToken = json["refresh_token"] as? String
        let email = json["email"] as? String
        
        // Handle refresh token rotation: if server returns a new refresh token, use it
        let finalRefreshToken = newRefreshToken ?? refreshTokenValue
        
        let result = AuthResult(
            userId: userId,
            email: email,
            provider: current.provider,
            accessToken: accessToken,
            refreshToken: finalRefreshToken,
            expiresAt: Date(timeIntervalSince1970: expiresAt)
        )
        
        // Update stored tokens
        await handleAuthResult(result)
        
        return result
    }
    
    /// Ensure the current token is valid, refreshing if needed
    public func ensureValidToken() async throws -> String {
        guard let current = currentUser else {
            throw AuthError.tokenExpired
        }
        
        // If token is still valid for at least `refreshThresholdSeconds`, return it
        let timeUntilExpiry = current.expiresAt.timeIntervalSinceNow
        if timeUntilExpiry > refreshThresholdSeconds {
            return current.accessToken
        }
        
        // Token is about to expire or already expired — refresh
        let refreshed = try await refreshToken()
        return refreshed.accessToken
    }
    
    // MARK: - Private
    
    @MainActor
    private func handleAuthResult(_ result: AuthResult) {
        currentUser = result
        isAuthenticated = true
        
        // Store in keychain
        if let tokenData = result.accessToken.data(using: .utf8) {
            try? KeychainHelper.save(key: KeychainKeys.accessToken, data: tokenData)
        }
        if let refreshData = result.refreshToken?.data(using: .utf8) {
            try? KeychainHelper.save(key: KeychainKeys.refreshToken, data: refreshData)
        }
        if let userIdData = result.userId.data(using: .utf8) {
            try? KeychainHelper.save(key: KeychainKeys.userId, data: userIdData)
        }
        let expiresAtTimestamp = String(result.expiresAt.timeIntervalSince1970)
        if let expiresData = expiresAtTimestamp.data(using: .utf8) {
            try? KeychainHelper.save(key: KeychainKeys.expiresAt, data: expiresData)
        }
        
        // Schedule auto-refresh
        scheduleAutoRefresh(for: result)
    }
    
    /// Schedule automatic token refresh before expiry
    private func scheduleAutoRefresh(for result: AuthResult) {
        cancelRefreshTimer()
        
        let timeUntilExpiry = result.expiresAt.timeIntervalSinceNow
        let refreshIn = max(timeUntilExpiry - refreshThresholdSeconds, 10) // At least 10 seconds from now
        
        refreshTimer = Timer.scheduledTimer(withTimeInterval: refreshIn, repeats: false) { [weak self] _ in
            Task { [weak self] in
                do {
                    _ = try await self?.refreshToken()
                } catch {
                    print("[AuthManager] Auto-refresh failed: \(error.localizedDescription)")
                    // Try again in 60 seconds
                    self?.scheduleRetryRefresh()
                }
            }
        }
    }
    
    /// Retry refresh after a failure
    private func scheduleRetryRefresh() {
        cancelRefreshTimer()
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: false) { [weak self] _ in
            Task { [weak self] in
                do {
                    _ = try await self?.refreshToken()
                } catch {
                    print("[AuthManager] Retry refresh failed: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func cancelRefreshTimer() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
    
    private func restoreSession() {
        guard let accessTokenData = try? KeychainHelper.load(key: KeychainKeys.accessToken),
              let accessToken = String(data: accessTokenData, encoding: .utf8),
              let userIdData = try? KeychainHelper.load(key: KeychainKeys.userId),
              let userId = String(data: userIdData, encoding: .utf8),
              let expiresAtData = try? KeychainHelper.load(key: KeychainKeys.expiresAt),
              let expiresAtStr = String(data: expiresAtData, encoding: .utf8),
              let expiresAtTimestamp = Double(expiresAtStr) else {
            return
        }
        
        let expiresAt = Date(timeIntervalSince1970: expiresAtTimestamp)
        
        // Don't restore if token is already expired
        guard expiresAt > Date() else {
            signOut()
            return
        }
        
        let refreshTokenValue: String? = {
            guard let data = try? KeychainHelper.load(key: KeychainKeys.refreshToken),
                  let str = String(data: data, encoding: .utf8) else { return nil }
            return str
        }()
        
        let restored = AuthResult(
            userId: userId,
            email: nil,
            provider: nil,
            accessToken: accessToken,
            refreshToken: refreshTokenValue,
            expiresAt: expiresAt
        )
        
        Task { @MainActor in
            self.currentUser = restored
            self.isAuthenticated = true
            self.scheduleAutoRefresh(for: restored)
        }
    }
}

// MARK: - Keychain Keys (shared with SocialLogin)
enum AuthKeychainKeys {
    static let accessToken = "com.cinacoin.auth.access_token"
    static let refreshToken = "com.cinacoin.auth.refresh_token"
    static let userId = "com.cinacoin.auth.user_id"
    static let expiresAt = "com.cinacoin.auth.expires_at"
}

/// Simple keychain helper
enum KeychainHelper {
    static func save(key: String, data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw AuthError.networkError("Keychain save failed: \(status)")
        }
    }
    
    static func load(key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw AuthError.networkError("Keychain load failed: \(status)")
        }
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
