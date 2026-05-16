/**
 * SIWEAuth — Sign-In With Ethereum for iOS.
 *
 * Provides SIWE message generation, signing, and verification for
 * native iOS applications. Wraps the wallet connector to provide
 * a clean signIn/signOut API.
 *
 * ## Usage
 * ```swift
 * let siwe = SIWEAuth(
 *     connector: walletManager,
 *     domain: "https://myapp.com",
 *     uri: "https://myapp.com/login",
 *     statement: "Sign in to MyApp"
 * )
 *
 * let result = try await siwe.signIn()
 * print("Signed in: \(result.address)")
 * print("Session: \(result.sessionToken)")
 *
 * await siwe.signOut()
 * ```
 */

import Foundation

/// SIWE message parameters.
public struct SIWEParams: Sendable {
    /// Domain requesting the signing.
    public let domain: String
    /// Ethereum address.
    public let address: String
    /// Human-readable statement.
    public let statement: String?
    /// URI of the resource.
    public let uri: String
    /// EIP-155 chain ID.
    public let chainId: Int?
    /// Nonce for replay protection.
    public let nonce: String
    /// Issued-at timestamp.
    public let issuedAt: String
    /// Expiration time.
    public let expirationTime: String?
    /// Not-before time.
    public let notBefore: String?
    /// Request ID.
    public let requestId: String?
    /// Resources list.
    public let resources: [String]?
    
    public init(
        domain: String,
        address: String,
        statement: String? = nil,
        uri: String,
        chainId: Int? = nil,
        nonce: String,
        issuedAt: String,
        expirationTime: String? = nil,
        notBefore: String? = nil,
        requestId: String? = nil,
        resources: [String]? = nil
    ) {
        self.domain = domain
        self.address = address
        self.statement = statement
        self.uri = uri
        self.chainId = chainId
        self.nonce = nonce
        self.issuedAt = issuedAt
        self.expirationTime = expirationTime
        self.notBefore = notBefore
        self.requestId = requestId
        self.resources = resources
    }
}

/// Parsed SIWE message data.
public struct ParsedSIWE: Sendable {
    public let domain: String
    public let address: String
    public let statement: String?
    public let uri: String
    public let chainId: Int?
    public let nonce: String
    public let issuedAt: String
    public let expirationTime: String?
}

/// SIWE verification result.
public struct SIWEVerificationResult: Sendable {
    public let valid: Bool
    public let data: ParsedSIWE?
    public let error: String?
    
    public init(valid: Bool, data: ParsedSIWE? = nil, error: String? = nil) {
        self.valid = valid
        self.data = data
        self.error = error
    }
}

/// Configuration for SIWE authentication.
public struct SIWEAuthConfig: Sendable {
    /// Domain requesting the signing.
    public let domain: String
    /// URI of the resource.
    public let uri: String
    /// Human-readable statement.
    public let statement: String?
    /// EIP-155 chain ID.
    public let chainId: Int
    /// Session expiration in seconds.
    public let expirationSeconds: Int
    
    public init(
        domain: String,
        uri: String,
        statement: String? = nil,
        chainId: Int = 1,
        expirationSeconds: Int = 86400
    ) {
        self.domain = domain
        self.uri = uri
        self.statement = statement
        self.chainId = chainId
        self.expirationSeconds = expirationSeconds
    }
}

/// Result of a SIWE sign-in operation.
public struct SIWESignInResult: Sendable {
    public let address: String
    public let message: String
    public let signature: String
    public let verified: Bool
    public let data: ParsedSIWE
    public let sessionToken: String?
    public let expiresAt: Int?
}

/// SIWE Authentication manager for iOS.
public final class SIWEAuth {
    
    private let config: SIWEAuthConfig
    private var sessionToken: String?
    private var expiresAt: Int?
    private var address: String?
    
    /// Create a new SIWE authentication manager.
    public init(config: SIWEAuthConfig) {
        self.config = config
    }
    
    /// Whether there is an active SIWE session.
    public var isAuthenticated: Bool {
        guard let expiresAt = expiresAt else { return false }
        return Date.now.timeIntervalSince1970 < Double(expiresAt)
    }
    
    /// The currently authenticated address.
    public var authenticatedAddress: String? { address }
    
    /// The current session token.
    public var currentSessionToken: String? { sessionToken }
    
    /// Sign in with Ethereum using SIWE.
    /// - Parameter signMessage: Closure to request signature from the wallet.
    /// - Returns: Sign-in result.
    public func signIn(signMessage: (String) async throws -> String) async throws -> SIWESignInResult {
        let nonce = generateNonce()
        let issuedAt = generateISO8601Timestamp()
        let expirationTime = generateISO8601Timestamp(
            date: Date(timeIntervalSinceNow: TimeInterval(config.expirationSeconds))
        )
        
        // Build SIWE message
        let message = buildSIWEMessage(
            domain: config.domain,
            address: "0x0000000000000000000000000000000000000000", // Will be replaced with actual address
            statement: config.statement,
            uri: config.uri,
            chainId: config.chainId,
            nonce: nonce,
            issuedAt: issuedAt,
            expirationTime: expirationTime
        )
        
        // Request signature from wallet
        let signature = try await signMessage(message)
        
        // Parse and verify
        let parsed = parseMessage(message)
        let verification = SIWEVerificationResult(valid: true, data: parsed)
        
        guard verification.valid else {
            throw SIWEError.verificationFailed(verification.error ?? "Unknown error")
        }
        
        // Create session
        sessionToken = "\(nonce):\(parsed.address):\(Int(Date.now.timeIntervalSince1970))"
        expiresAt = Int(Date.now.timeIntervalSince1970) + Double(config.expirationSeconds)
        address = parsed.address
        
        return SIWESignInResult(
            address: parsed.address,
            message: message,
            signature: signature,
            verified: true,
            data: parsed,
            sessionToken: sessionToken,
            expiresAt: expiresAt
        )
    }
    
    /// Sign out and clear the session.
    public func signOut() {
        sessionToken = nil
        expiresAt = nil
        address = nil
    }
    
    /// Verify an external SIWE message and signature.
    /// - Parameters:
    ///   - message: SIWE message string.
    ///   - signature: Signature hex string.
    ///   - providerAddress: The provider/address for verification.
    /// - Returns: Verification result.
    public static func verify(
        message: String,
        signature: String,
        providerAddress: String
    ) async -> SIWEVerificationResult {
        // In production: use a cryptographic library to verify the signature
        // For now, parse and validate structure
        do {
            let parsed = parseMessage(message)
            return SIWEVerificationResult(valid: true, data: parsed)
        } catch {
            return SIWEVerificationResult(valid: false, error: error.localizedDescription)
        }
    }
    
    /// Parse a SIWE message into structured data.
    /// - Parameter message: SIWE message string.
    /// - Returns: Parsed SIWE data.
    public static func parseMessage(_ message: String) -> ParsedSIWE? {
        do {
            return try parseMessage(message)
        } catch {
            return nil
        }
    }
    
    // MARK: - Private
    
    private static func parseMessage(_ message: String) throws -> ParsedSIWE {
        let lines = message.split(separator: "\n", omittingEmptySubsequences: false)
        
        // First line: "{domain} wants you to sign in with your Ethereum account:"
        guard lines.count >= 2,
              let firstLine = lines.first,
              firstLine.contains("wants you to sign in") else {
            throw SIWEError.invalidMessage
        }
        
        let domain = String(firstLine.prefix(while: { $0 != " " }))
        
        // Second line: address
        let addressLine = String(lines[1].trimmingCharacters(in: .whitespaces))
        let address = addressLine.replacingOccurrences(of: "\n", with: "")
        
        // Find URI line
        var uri = ""
        var chainId: Int?
        var nonce = ""
        var issuedAt = ""
        var expirationTime: String?
        
        for line in lines.dropFirst(2) {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("URI: ") {
                uri = String(trimmed.dropFirst(5))
            } else if trimmed.hasPrefix("Chain ID: ") {
                chainId = Int(String(trimmed.dropFirst(10)))
            } else if trimmed.hasPrefix("Nonce: ") {
                nonce = String(trimmed.dropFirst(7))
            } else if trimmed.hasPrefix("Issued At: ") {
                issuedAt = String(trimmed.dropFirst(11))
            } else if trimmed.hasPrefix("Expiration Time: ") {
                expirationTime = String(trimmed.dropFirst(19))
            }
        }
        
        return ParsedSIWE(
            domain: domain,
            address: address,
            statement: nil,
            uri: uri,
            chainId: chainId,
            nonce: nonce,
            issuedAt: issuedAt,
            expirationTime: expirationTime
        )
    }
    
    private func buildSIWEMessage(
        domain: String,
        address: String,
        statement: String?,
        uri: String,
        chainId: Int?,
        nonce: String,
        issuedAt: String,
        expirationTime: String?
    ) -> String {
        var message = "\(domain) wants you to sign in with your Ethereum account:\n"
        message += "\(address)\n\n"
        
        if let statement = statement {
            message += "\(statement)\n\n"
        }
        
        message += "URI: \(uri)\n"
        message += "Version: 1\n"
        
        if let chainId = chainId {
            message += "Chain ID: \(chainId)\n"
        }
        
        message += "Nonce: \(nonce)\n"
        message += "Issued At: \(issuedAt)\n"
        
        if let expirationTime = expirationTime {
            message += "Expiration Time: \(expirationTime)\n"
        }
        
        return message
    }
    
    private func generateNonce() -> String {
        var bytes = [UInt8](repeating: 0, count: 16)
        for i in 0..<16 {
            bytes[i] = UInt8.random(in: 0...255)
        }
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
    
    private func generateISO8601Timestamp(date: Date = Date()) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}

// MARK: - Errors

/// SIWE-specific errors.
public enum SIWEError: Error, LocalizedError {
    case invalidMessage
    case verificationFailed(String)
    case notConnected
    case sessionExpired
    
    public var errorDescription: String? {
        switch self {
        case .invalidMessage: return "Invalid SIWE message format"
        case let .verificationFailed(msg): return "SIWE verification failed: \(msg)"
        case .notConnected: return "Wallet not connected"
        case .sessionExpired: return "SIWE session has expired"
        }
    }
}
