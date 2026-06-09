//
//  WalletConnectManager.swift
//  CinacoinSDK
//
//  WalletConnect v2 pairing, session, and relay orchestration.
//
//  In a production app this imports WalletConnectSwiftV2 and drives
//  the real WC SDK. Here we define a protocol + mock-friendly facade
//  so that the rest of the SDK depends on abstractions (testable).
//

import Foundation
import Combine
#if canImport(UIKit)
import UIKit
#endif

// MARK: - WalletConnectManager

/// Coordinates WalletConnect v2 pairing and session lifecycle.
///
/// The public API uses `async/await`. Internally it wraps the WalletConnect
/// delegate-based callbacks so callers never need `@MainActor` or Combine.
public final class WalletConnectManager: Sendable {

    // MARK: - Configuration

    private(set) var projectId: String = ""
    private(set) var metadata: AppMetadata?
    private var relayUrl: String?

    // MARK: - State

    @MainActor public var status: ConnectionStatus = .disconnected
    @MainActor public var sessionTopic: String?

    private let _sessionPublisher = PassthroughSubject<WalletConnectSessionEvent, Never>()
    private let lock = NSRecursiveLock()
    private var _configured = false
    private var _disposed = false

    // MARK: - Configure

    /// Configure the WalletConnect client.
    ///
    /// Must be called before any pairing or session operations.
    public func configure(
        projectId: String,
        metadata: AppMetadata,
        relayUrl: String? = nil
    ) async throws {
        lock.lock()
        defer { lock.unlock() }
        guard !_configured else { return }
        guard !_disposed else { throw CinacoinError.disposed }

        self.projectId = projectId
        self.metadata = metadata
        self.relayUrl = relayUrl

        // In production: call `Networking.configure(...)` and
        // `SignClient.configure(...)` from WalletConnectSwiftV2 here.

        _configured = true
    }

    // MARK: - Pairing

    /// Create a WalletConnect pairing URI (wallet://wc... format).
    ///
    /// Returns a URI string suitable for QR code display or deep-link.
    public func createPairing() async throws -> String {
        try _guardConfigured()
        // In production: `try await Sign.instance.connect(...)` returns the URI.
        return "wc:pairing-uri-placeholder@2?controller=0&symKey=placeholder&relay-protocol=irn"
    }

    /// Pair from an existing URI (scanned from a QR code).
    public func pair(uri: String) async throws {
        try _guardConfigured()
        // In production: `try await Sign.instance.pair(uri: uri)`
    }

    // MARK: - Session

    /// Initiate a session connection to a wallet.
    ///
    /// - Parameters:
    ///   - walletId: Connector ID (e.g. `"metamask"`).
    ///   - chains:   Chain IDs to request (defaults to all supported).
    /// - Returns: `ConnectionResult` on success.
    public func connect(walletId: String, chains: [Int]? = nil) async throws -> ConnectionResult {
        try _guardConfigured()

        let requestedChains = chains ?? [1, 137, 42161, 8453, 10, 56]

        // In production:
        //   1. Create required namespaces from requested chains.
        //   2. Call `Sign.instance.connect(...)`.
        //   3. Wait for `onSessionSettle` delegate callback.
        //   4. Return ConnectionResult.

        // Simulated result for compilation:
        let result = ConnectionResult(
            accounts: ["0x1234567890abcdef1234567890abcdef12345678"],
            chainId: requestedChains.first ?? 1,
            sessionId: UUID().uuidString,
            connectorId: walletId
        )

        await MainActor.run {
            self.sessionTopic = result.sessionId
        }

        return result
    }

    /// Disconnect the active WalletConnect session.
    public func disconnect() async {
        // In production: `try await Sign.instance.disconnect(topic: ...)`.
        await MainActor.run {
            self.sessionTopic = nil
        }
    }

    /// Request a chain switch on the active session.
    public func switchChain(_ chainId: Int) async throws {
        try _guardConfigured()
        // In production: send `wallet_switchEthereumChain` via WC request.
    }

    // MARK: - Session Events

    /// Publisher for session lifecycle events.
    public var sessionEvents: AnyPublisher<WalletConnectSessionEvent, Never> {
        _sessionPublisher.eraseToAnyPublisher()
    }

    // MARK: - Wallet Detection

    /// Check whether a wallet app is installed on the device.
    public func isWalletInstalled(_ walletId: String) -> Bool {
        guard let scheme = WalletConnectManager.deepLinkScheme(for: walletId) else {
            return false
        }
        guard let url = URL(string: scheme) else { return false }
        #if canImport(UIKit)
        return UIApplication.shared.canOpenURL(url)
        #else
        return false
        #endif
    }

    /// Open a wallet app via its deep link / universal link.
    public func openWallet(_ walletId: String, uri: String? = nil) {
        var urlString = WalletConnectManager.deepLinkScheme(for: walletId) ?? ""
        if let uri = uri {
            urlString += uri
        }
        guard let url = URL(string: urlString) else { return }
        #if canImport(UIKit)
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        #endif
    }

    // MARK: - Disposal

    public func dispose() async {
        lock.lock()
        defer { lock.unlock() }
        guard !_disposed else { return }
        _disposed = true
    }

    // MARK: - Helpers

    private func _guardConfigured() throws {
        lock.lock()
        defer { lock.unlock() }
        guard _configured else { throw CinacoinError.notInitialized }
        guard !_disposed else { throw CinacoinError.disposed }
    }

    /// Map a wallet ID to its iOS deep-link scheme.
    public static func deepLinkScheme(for walletId: String) -> String? {
        switch walletId.lowercased() {
        case "metamask":
            return "metamask://wc?uri="
        case "trust":
            return "trust://wc?uri="
        case "rainbow":
            return "rainbow://wc?uri="
        case "coinbase", "coinbase-wallet":
            return "cbwallet://wc?uri="
        case "phantom":
            return "phantom://wc?uri="
        default:
            return nil
        }
    }
}

// MARK: - WalletConnectSessionEvent

public enum WalletConnectSessionEvent: Sendable {
    case paired(topic: String)
    case sessionApproved(topic: String, accounts: [String], chainId: Int)
    case sessionRejected(topic: String)
    case sessionDeleted(topic: String)
    case sessionEvent(topic: String, event: String)
}
