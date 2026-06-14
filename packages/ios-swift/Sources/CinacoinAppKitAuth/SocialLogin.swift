import Foundation
import AuthenticationServices

/// Social login manager for iOS
public final class SocialLoginManager: NSObject, ObservableObject, @unchecked Sendable {
    
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: String?
    
    private let authUrl: String
    private let projectId: String
    private let callbackScheme: String
    
    public init(
        authUrl: String = "https://auth.cinacoin.com",
        projectId: String,
        callbackScheme: String = "cinacoin"
    ) {
        self.authUrl = authUrl
        self.projectId = projectId
        self.callbackScheme = callbackScheme
        super.init()
    }
    
    /// Sign in with Apple
    public func signInWithApple(
        presentationAnchor: ASPresentationAnchor? = nil
    ) async throws -> AuthResult {
        isLoading = true
        defer { isLoading = false }
        
        // Request Apple ID credential
        let authorizationController = ASAuthorizationController(
            authorizationRequests: [
                ASAuthorizationAppleIDProvider().createRequest()
            ]
        )
        
        // In production, this would use ASAuthorizationControllerDelegate
        // For now, simulate the flow
        throw AuthError.notImplemented("Apple Sign-In requires ASAuthorizationControllerDelegate")
    }
    
    /// Sign in with Google (via ASWebAuthenticationSession)
    public func signInWithGoogle() async throws -> AuthResult {
        isLoading = true
        defer { isLoading = false }
        
        let callbackURL = "\(callbackScheme)://auth/google/callback"
        let authURL = "\(authUrl)/api/auth/google?redirect_uri=\(callbackURL)&project_id=\(projectId)"
        
        guard let url = URL(string: authURL) else {
            throw AuthError.invalidURL
        }
        
        return try await performWebAuth(url: url, provider: .google)
    }
    
    /// Sign in with GitHub
    public func signInWithGitHub() async throws -> AuthResult {
        isLoading = true
        defer { isLoading = false }
        
        let callbackURL = "\(callbackScheme)://auth/github/callback"
        let authURL = "\(authUrl)/api/auth/github?redirect_uri=\(callbackURL)&project_id=\(projectId)"
        
        guard let url = URL(string: authURL) else {
            throw AuthError.invalidURL
        }
        
        return try await performWebAuth(url: url, provider: .github)
    }
    
    /// Sign in with Discord
    public func signInWithDiscord() async throws -> AuthResult {
        isLoading = true
        defer { isLoading = false }
        
        let callbackURL = "\(callbackScheme)://auth/discord/callback"
        let authURL = "\(authUrl)/api/auth/discord?redirect_uri=\(callbackURL)&project_id=\(projectId)"
        
        guard let url = URL(string: authURL) else {
            throw AuthError.invalidURL
        }
        
        return try await performWebAuth(url: url, provider: .discord)
    }
    
    // MARK: - Private
    
    private func performWebAuth(url: URL, provider: AuthProvider) async throws -> AuthResult {
        // Perform ASWebAuthenticationSession and get callback URL
        let callbackURL = try await startWebAuthSession(url: url)
        
        // Parse authorization code from callback URL
        guard let code = parseAuthorizationCode(from: callbackURL) else {
            throw AuthError.invalidCallback("Missing authorization code in callback URL")
        }
        
        // Exchange authorization code for tokens
        let authResult = try await exchangeCodeForTokens(code: code, provider: provider)
        
        // Store tokens securely in Keychain
        try storeTokensInKeychain(authResult: authResult)
        
        return authResult
    }
    
    /// Start ASWebAuthenticationSession and wait for callback
    private func startWebAuthSession(url: URL) async throws -> URL {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { callbackURL, error in
                if let error = error {
                    // Check if user cancelled
                    if let authError = error as? ASWebAuthenticationSessionError,
                       authError.code == .canceledLogin {
                        continuation.resume(throwing: AuthError.cancelled)
                    } else {
                        continuation.resume(throwing: error)
                    }
                } else if let callbackURL = callbackURL {
                    continuation.resume(returning: callbackURL)
                } else {
                    continuation.resume(throwing: AuthError.cancelled)
                }
            }
            
            // Set presentation context for iOS 13+
            if #available(iOS 13.0, *) {
                session.presentationContextProvider = WebAuthPresentationAnchor()
            }
            session.prefersEphemeralWebBrowserSession = true
            session.start()
        }
    }
    
    /// Parse authorization code from callback URL
    private func parseAuthorizationCode(from callbackURL: URL) -> String? {
        guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems else {
            return nil
        }
        
        // Check for authorization code
        if let code = queryItems.first(where: { $0.name == "code" })?.value {
            return code
        }
        
        // Check for error in callback
        if let error = queryItems.first(where: { $0.name == "error" })?.value {
            let errorDescription = queryItems.first(where: { $0.name == "error_description" })?.value ?? error
            print("[SocialLogin] OAuth error: \(errorDescription)")
        }
        
        return nil
    }
    
    /// Exchange authorization code for tokens via Auth Service API
    private func exchangeCodeForTokens(code: String, provider: AuthProvider) async throws -> AuthResult {
        let url = URL(string: "\(authUrl)/api/auth/oauth/callback")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "code": code,
            "provider": provider.rawValue,
            "project_id": projectId
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.networkError("Invalid response from auth service")
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            let errorBody = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw AuthError.networkError("Token exchange failed: \(httpResponse.statusCode) - \(errorBody)")
        }
        
        // Parse response
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let accessToken = json["access_token"] as? String,
              let userId = json["user_id"] as? String,
              let expiresAt = json["expires_at"] as? TimeInterval else {
            throw AuthError.networkError("Invalid response format from auth service")
        }
        
        let refreshToken = json["refresh_token"] as? String
        let email = json["email"] as? String
        
        return AuthResult(
            userId: userId,
            email: email,
            provider: provider,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: Date(timeIntervalSince1970: expiresAt)
        )
    }
    
    /// Store tokens securely in Keychain
    private func storeTokensInKeychain(authResult: AuthResult) throws {
        // Store access token
        if let tokenData = authResult.accessToken.data(using: .utf8) {
            try KeychainHelper.save(key: AuthKeychainKeys.accessToken, data: tokenData)
        }
        
        // Store refresh token if available
        if let refreshToken = authResult.refreshToken,
           let refreshData = refreshToken.data(using: .utf8) {
            try KeychainHelper.save(key: AuthKeychainKeys.refreshToken, data: refreshData)
        }
        
        // Store user ID
        if let userIdData = authResult.userId.data(using: .utf8) {
            try KeychainHelper.save(key: AuthKeychainKeys.userId, data: userIdData)
        }
        
        // Store expiration time
        let expiresAtTimestamp = String(authResult.expiresAt.timeIntervalSince1970)
        if let expiresData = expiresAtTimestamp.data(using: .utf8) {
            try KeychainHelper.save(key: AuthKeychainKeys.expiresAt, data: expiresData)
        }
    }
}

// MARK: - Web Auth Presentation Anchor
@available(iOS 13.0, *)
private final class WebAuthPresentationAnchor: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        // Find the key window
        let scenes = UIApplication.shared.connectedScenes
        let windowScene = scenes.first as? UIWindowScene
        return windowScene?.windows.first ?? ASPresentationAnchor()
    }
}

// MARK: - Auth Errors
public enum AuthError: Error, LocalizedError {
    case invalidURL
    case cancelled
    case notImplemented(String)
    case networkError(String)
    case invalidCredentials
    case tokenExpired
    case invalidCallback(String)
    case refreshFailed(String)
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .cancelled: return "Authentication cancelled"
        case .notImplemented(let msg): return "Not implemented: \(msg)"
        case .networkError(let msg): return "Network error: \(msg)"
        case .invalidCredentials: return "Invalid credentials"
        case .tokenExpired: return "Token expired"
        case .invalidCallback(let msg): return "Invalid callback: \(msg)"
        case .refreshFailed(let msg): return "Token refresh failed: \(msg)"
        }
    }
}
