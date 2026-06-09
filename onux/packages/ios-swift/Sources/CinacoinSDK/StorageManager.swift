//
//  StorageManager.swift
//  CinacoinSDK
//
//  Keychain-backed persistence for session data.
//

import Foundation
import Security

/// Keychain-backed session persistence.
/// Uses `kSecClassGenericPassword` with the Cinacoin SDK access group.
public final class StorageManager: Sendable {

    // MARK: - Keys

    private let service: String
    private let account: String

    public init(service: String = "com.cinacoin.sdk", account: String = "session") {
        self.service = service
        self.account = account
    }

    // MARK: - Session

    /// Persist a wallet session to the Keychain.
    public func saveSession(_ session: SessionData) throws {
        let data = try JSONEncoder().encode(session)
        try save(data: data, key: "session")
    }

    /// Read the persisted session from the Keychain.
    public func loadSession() throws -> SessionData? {
        guard let data = try load(key: "session") else { return nil }
        return try JSONDecoder().decode(SessionData.self, from: data)
    }

    /// Remove the persisted session from the Keychain.
    public func clearSession() throws {
        try delete(key: "session")
    }

    // MARK: - Raw Keychain Helpers

    private func save(data: Data, key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "\(account).\(key)",
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]

        // Delete existing item first (upsert pattern).
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw CinacoinError.keychainError("SecItemAdd failed: \(status)")
        }
    }

    private func load(key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "\(account).\(key)",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        if status == errSecItemNotFound {
            return nil
        }
        guard status == errSecSuccess else {
            throw CinacoinError.keychainError("SecItemCopyMatching failed: \(status)")
        }
        return item as? Data
    }

    private func delete(key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "\(account).\(key)",
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw CinacoinError.keychainError("SecItemDelete failed: \(status)")
        }
    }
}

// MARK: - SessionData

/// Codable session payload persisted to the Keychain.
public struct SessionData: Codable, Sendable {
    public let accounts: [String]
    public let chainId: Int
    public let sessionId: String
    public let connectorId: String
    public let topic: String?
    public let createdAt: Date

    public init(
        accounts: [String],
        chainId: Int,
        sessionId: String,
        connectorId: String,
        topic: String? = nil
    ) {
        self.accounts = accounts
        self.chainId = chainId
        self.sessionId = sessionId
        self.connectorId = connectorId
        self.topic = topic
        self.createdAt = Date()
    }
}
