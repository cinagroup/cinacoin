/**
 * WCSessionManager — Session persistence & auto-reconnect for WalletConnect v2 (Android).
 *
 * Provides:
 * - SharedPreferences-backed session persistence (topic, accounts, chainId)
 * - Session TTL enforcement (default 7 days)
 * - Automatic reconnection with exponential backoff on app foreground
 * - Reconnect attempt limits and relay health tracking
 *
 * Used internally by WCClient; also usable standalone for custom integrations.
 */
package com.cinacoin.walletconnect

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// ============================================================
// Persisted Session Model
// ============================================================

/** Codable snapshot of an active WC v2 session for persistence. */
data class PersistedSession(
    val topic: String,
    val accounts: List<String>,
    val chainId: Int,
    val peerName: String?,
    val createdAt: Long,
    val expiresAt: Long
) {
    /** Whether this session has exceeded its TTL. */
    val isExpired: Boolean get() = System.currentTimeMillis() >= expiresAt

    companion object {
        private const val SEP = "|"

        fun serialize(s: PersistedSession): String =
            listOf(
                s.topic,
                s.accounts.joinToString(","),
                s.chainId.toString(),
                s.peerName ?: "",
                s.createdAt.toString(),
                s.expiresAt.toString()
            ).joinToString(SEP)

        fun deserialize(raw: String): PersistedSession? = runCatching {
            val parts = raw.split(SEP)
            require(parts.size >= 6)
            PersistedSession(
                topic = parts[0],
                accounts = parts[1].takeIf { it.isNotEmpty() }?.split(",") ?: emptyList(),
                chainId = parts[2].toInt(),
                peerName = parts[3].takeIf { it.isNotEmpty() },
                createdAt = parts[4].toLong(),
                expiresAt = parts[5].toLong()
            )
        }.getOrNull()
    }
}

// ============================================================
// Relay Health
// ============================================================

/** Relay connection quality indicator. */
sealed class RelayHealth {
    object Connected : RelayHealth()
    object Degraded : RelayHealth()
    object Disconnected : RelayHealth()
    object Reconnecting : RelayHealth()
}

// ============================================================
// Session Manager
// ============================================================

/** Manages WC v2 session lifecycle: persist, restore, expiry-check, reconnect. */
class WCSessionManager(
    private val prefs: SharedPreferences,
    private val ioScope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {

    companion object {
        private const val KEY_SESSION = "wc_v2_persisted_session_v1"
        private const val DEFAULT_TTL_MS = 7L * 24 * 60 * 60 * 1000 // 7 days

        /** Factory: create with default SharedPreferences. */
        fun create(context: Context): WCSessionManager {
            val prefs = context.getSharedPreferences("wc_session_manager", Context.MODE_PRIVATE)
            return WCSessionManager(prefs)
        }
    }

    /** Session TTL in milliseconds (default: 7 days). */
    var sessionTTL: Long = DEFAULT_TTL_MS

    /** Whether auto-reconnect is enabled. */
    var autoReconnectEnabled: Boolean = true

    /** Maximum reconnect attempts before giving up. */
    var maxReconnectAttempts: Int = 5

    /** Base delay for exponential backoff (milliseconds). */
    var reconnectBaseDelay: Long = 2000

    /** Current reconnect attempt count. */
    var reconnectAttempts: Int = 0
        private set

    /** Relay health status. */
    private val _relayHealth = MutableStateFlow<RelayHealth>(RelayHealth.Disconnected)
    val relayHealth: StateFlow<RelayHealth> = _relayHealth.asStateFlow()

    private var reconnectJob: Job? = null
    private var expiryJob: Job? = null

    // ─── Persistence ──────────────────────────────────────────────────

    /** Save a session snapshot for later restoration. */
    fun persistSession(
        topic: String,
        accounts: List<String>,
        chainId: Int,
        peerName: String? = null
    ) {
        val session = PersistedSession(
            topic = topic,
            accounts = accounts,
            chainId = chainId,
            peerName = peerName,
            createdAt = System.currentTimeMillis(),
            expiresAt = System.currentTimeMillis() + sessionTTL
        )
        prefs.edit().putString(KEY_SESSION, PersistedSession.serialize(session)).apply()
    }

    /** Load the persisted session, if any and not expired. */
    fun loadSession(): PersistedSession? {
        val raw = prefs.getString(KEY_SESSION, null) ?: return null
        return PersistedSession.deserialize(raw)?.takeUnless { it.isExpired }
    }

    /** Clear persisted session data. */
    fun clearSession() {
        prefs.edit().remove(KEY_SESSION).apply()
    }

    // ─── Expiry Monitoring ────────────────────────────────────────────

    /** Start periodic expiry checks (every 60s). */
    fun startExpiryMonitoring(onExpired: () -> Unit) {
        expiryJob?.cancel()
        // Immediate check
        checkExpiry(onExpired)
        // Periodic check
        expiryJob = ioScope.launch {
            while (isActive) {
                delay(60_000)
                checkExpiry(onExpired)
            }
        }
    }

    /** Stop expiry monitoring. */
    fun stopExpiryMonitoring() {
        expiryJob?.cancel()
        expiryJob = null
    }

    /** Check if the persisted session has expired. */
    private fun checkExpiry(onExpired: () -> Unit) {
        val session = loadSession() ?: return
        if (session.isExpired) {
            clearSession()
            onExpired()
        }
    }

    // ─── Auto-Reconnect ───────────────────────────────────────────────

    /** Schedule an auto-reconnect with exponential backoff. Returns `true` if scheduled. */
    fun scheduleReconnect(attempt: suspend () -> Boolean): Boolean {
        if (!autoReconnectEnabled || reconnectAttempts >= maxReconnectAttempts) return false

        reconnectJob?.cancel()
        reconnectJob = ioScope.launch {
            delay(reconnectBaseDelay * (1L shl reconnectAttempts))
            reconnectAttempts++
            val success = attempt()
            if (!success) {
                scheduleReconnect(attempt)
            } else {
                reconnectAttempts = 0
            }
        }
        return true
    }

    /** Cancel any pending reconnect and reset counter. */
    fun cancelReconnect() {
        reconnectJob?.cancel()
        reconnectJob = null
        reconnectAttempts = 0
    }

    // ─── Lifecycle ────────────────────────────────────────────────────

    /** Called when app enters foreground — check expiry. */
    fun appDidBecomeActive() {
        checkExpiry {}
    }

    /** Called when app goes to background — stop monitoring. */
    fun applicationWillResignActive() {
        stopExpiryMonitoring()
    }

    /** Clean up all resources. */
    fun close() {
        stopExpiryMonitoring()
        cancelReconnect()
    }
}
