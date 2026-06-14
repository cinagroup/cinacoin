import Foundation

/// Email-based login manager
public final class EmailLoginManager: @unchecked Sendable {
    
    private let authUrl: String
    private let projectId: String
    
    public init(authUrl: String = "https://auth.cinacoin.com", projectId: String) {
        self.authUrl = authUrl
        self.projectId = projectId
    }
    
    /// Register with email and password
    public func register(email: String, password: String) async throws -> AuthResult {
        let url = URL(string: "\(authUrl)/api/auth/register")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "email": email,
            "password": password,
            "project_id": projectId
        ])
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw AuthError.networkError("Registration failed")
        }
        
        return try JSONDecoder().decode(AuthResult.self, from: data)
    }
    
    /// Login with email and password
    public func login(email: String, password: String) async throws -> AuthResult {
        let url = URL(string: "\(authUrl)/api/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "email": email,
            "password": password,
            "project_id": projectId
        ])
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw AuthError.invalidCredentials
        }
        
        return try JSONDecoder().decode(AuthResult.self, from: data)
    }
    
    /// Send password reset email
    public func sendPasswordReset(email: String) async throws {
        let url = URL(string: "\(authUrl)/api/auth/reset-password")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "email": email,
            "project_id": projectId
        ])
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw AuthError.networkError("Password reset request failed")
        }
    }
    
    /// Send email verification
    public func sendVerification(email: String) async throws {
        let url = URL(string: "\(authUrl)/api/auth/verify-email")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "email": email,
            "project_id": projectId
        ])
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw AuthError.networkError("Verification email send failed")
        }
    }
}
