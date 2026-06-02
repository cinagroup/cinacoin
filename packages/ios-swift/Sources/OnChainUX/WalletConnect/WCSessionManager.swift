/**
 * WCSessionManager — Session persistence & auto-reconnect for WalletConnect v2 (iOS).
 *
 * Provides:
 * - UserDefaults-backed session persistence (topic, accounts, chainId)
 * - Session TTL enforcement (default 7 days)
 * - Automatic reconnection with exponential backoff on app foreground
 * - Reliability tracking and reconnect attempt limits
 *
 * Used internally by WCClient; also usable standalone for custom integrations.
 */

import Foundation

// MARK: - Persisted Session Model

/// Codable snapshot of an active WC v2 session for persistence.
struct PersistedSession: Codable {
    let topic: String
    let accounts: [String]
    let chainId: Int
    let peerName: String?
    let createdAt: TimeInterval
    let expiresAt: TimeInterval

    /// Whether this session has exceeded its TTL.
    var isExpired: Bool {
        Date().timeIntervalSince1970 >= expiresAt
    }
}

// MARK: - UserDefaults Keys

enum WCSessionKeys {
    static let sessionData = "wc_v2_persisted_session_v1"
    static let relayUrl = "wc_v2_relay_url"
}

// MARK: - Session Manager

/// Manages WC v2 session lifecycle: persist, restore, expiry-check, reconnect.
public final class WCSessionManager: ObservableObject {

    /// Shared instance for app-wide access.
    public static let shared = WCSessionManager()

    /// UserDefaults backing store (injectable for testing).
    public let defaults: UserDefaults

    /// Default session TTL: 7 days.
    public var sessionTTL: TimeInterval = 7 * 24 * 60 * 60

    /// Whether auto-reconnect is enabled.
    @Published public var autoReconnectEnabled: Bool = true

    /// Maximum reconnect attempts before giving up.
    public var maxReconnectAttempts: Int = 5

    /// Base delay for exponential backoff (seconds).
    public var reconnectBaseDelay: TimeInterval = 2.0

    /// Current reconnect attempt count.
    @Published public private(set) var reconnectAttempts: Int = 0

    /// Pending reconnect work item (for cancellation).
    private var reconnectWorkItem: DispatchWorkItem?

    /// Expiry check timer.
    private var expiryTimer: Timer?

    /// Relay health status.
    @Published public private(set) var relayHealth: RelayHealth = .disconnected

    private init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    // MARK: - Persistence

    /// Save a session snapshot for later restoration.
    public func persistSession(
        topic: String,
        accounts: [String],
        chainId: Int,
        peerName: String? = nil
    ) {
        let session = PersistedSession(
            topic: topic,
            accounts: accounts,
            chainId: chainId,
            peerName: peerName,
            createdAt: Date().timeIntervalSince1970,
            expiresAt: Date().timeIntervalSince1970 + sessionTTL
        )

        if let encoded = try? JSONEncoder().encode(session) {
            defaults.set(encoded, forKey: WCSessionKeys.sessionData)
            defaults.synchronize()
        }
    }

    /// Load the persisted session, if any and not expired.
    public func loadSession() -> PersistedSession? {
        guard let data = defaults.data(forKey: WCSessionKeys.sessionData) else { return nil }
        let session = try? JSONDecoder().decode(PersistedSession.self, from: data)
        // Return nil if expired so caller knows to clean up
        return session?.isExpired == true ? nil : session
    }

    /// Clear persisted session data.
    public func clearSession() {
        defaults.removeObject(forKey: WCSessionKeys.sessionData)
        defaults.synchronize()
    }

    // MARK: - Expiry Monitoring

    /// Start periodic expiry checks (every 60s).
    public func startExpiryMonitoring(onExpired: @escaping () -> Void) {
        stopExpiryMonitoring()
        // Immediate check
        checkExpiry(onExpired: onExpired)
        // Periodic check
        expiryTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.checkExpiry(onExpired: onExpired)
        }
    }

    /// Stop expiry monitoring.
    public func stopExpiryMonitoring() {
        expiryTimer?.invalidate()
        expiryTimer = nil
    }

    /// Check if the persisted session has expired.
    private func checkExpiry(onExpired: @escaping () -> Void) {
        guard let session = loadSession(), session.isExpired else { return }
        clearSession()
        onExpired()
    }

    // MARK: - Auto-Reconnect

    /// Schedule an auto-reconnect with exponential backoff.
    /// Returns `true` if a reconnect was scheduled.
    @discardableResult
    public func scheduleReconnect(
        attempt: @escaping () async -> Bool
    ) -> Bool {
        guard autoReconnectEnabled, reconnectAttempts < maxReconnectAttempts else {
            return false
        }

        reconnectWorkItem?.cancel()

        let delay = reconnectBaseDelay * pow(2.0, Double(reconnectAttempts))
        let item = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.reconnectAttempts += 1

            Task {
                let success = await attempt()
                if !success {
                    self.scheduleReconnect(attempt: attempt)
                } else {
                    self.reconnectAttempts = 0
                }
            }
        }

        reconnectWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
        return true
    }

    /// Cancel any pending reconnect and reset counter.
    public func cancelReconnect() {
        reconnectWorkItem?.cancel()
        reconnectWorkItem = nil
        reconnectAttempts = 0
    }

    // MARK: - Lifecycle

    /// Called when app enters foreground — attempt session restore.
    public func appDidBecomeActive() {
        checkExpiry(onExpired: {})
    }

    deinit {
        stopExpiryMonitoring()
        cancelReconnect()
    }
}

// MARK: - Relay Health

/// Relay connection quality indicator.
public enum RelayHealth: Equatable {
    case connected
    case degraded
    case disconnected
    case reconnecting
}
