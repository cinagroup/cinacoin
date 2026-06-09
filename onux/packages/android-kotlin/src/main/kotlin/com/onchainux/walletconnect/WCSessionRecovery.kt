/**
 * WCSessionRecovery — Automatic session recovery for WalletConnect v2.
 *
 * Handles:
 * - Session recovery on app restart from SharedPreferences
 * - Background session validation against the WC relay
 * - Multi-session support (track & manage multiple wallet sessions)
 * - Session expiry detection & cleanup
 * - Restore state reporting for UI rehydration
 *
 * Designed as a standalone module that integrates with WCClient.
 */
package com.cinacoin.walletconnect

import android.content.SharedPreferences
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

// ============================================================
// Recovery State
// ============================================================

/** Result of a session recovery attempt. */
sealed class RecoveryResult {
    object NotAvailable : RecoveryResult()
    data class Success(val sessions: List<RecoverySessionInfo>) : RecoveryResult()
    data class Failure(val reason: String) : RecoveryResult()
}

/** Summary info about a recovered session. */
data class RecoverySessionInfo(
    val topic: String,
    val accounts: List<String>,
    val chainId: Int,
    val peerName: String?,
    val isActive: Boolean,
    val expiresAt: Long,
    val timeRemainingMs: Long
) {
    val timeRemainingHours: Double get() = timeRemainingMs / (1000.0 * 60 * 60)
    val isExpired: Boolean get() = timeRemainingMs <= 0
}

// ============================================================
// Multi-Session Registry
// ============================================================

/** Extended persisted session entry for multi-session support. */
data class MultiSessionEntry(
    val topic: String,
    val accounts: List<String>,
    val chainId: Int,
    val peerName: String?,
    val createdAt: Long,
    val expiresAt: Long,
    val isActive: Boolean = false,
    val lastValidatedAt: Long = 0
)

// ============================================================
// Session Recovery Manager
// ============================================================

/**
 * Manages session recovery lifecycle. Used by WCClient for
 * automatic recovery on app startup, and by the app for
 * multi-session management.
 */
class WCSessionRecovery(
    private val prefs: SharedPreferences,
    private val ioScope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {

    companion object {
        private const val KEY_SESSIONS = "wc_v2_multi_sessions_v1"
        private const val KEY_ACTIVE_TOPIC = "wc_v2_active_topic"
        private const val DEFAULT_TTL_MS = 7L * 24 * 60 * 60 * 1000

        fun create(context: android.content.Context): WCSessionRecovery {
            val prefs = context.getSharedPreferences("wc_session_recovery", android.content.Context.MODE_PRIVATE)
            return WCSessionRecovery(prefs)
        }
    }

    var sessionTTL: Long = DEFAULT_TTL_MS

    private val _recoveryState = MutableStateFlow<RecoveryResult>(RecoveryResult.NotAvailable)
    val recoveryState: StateFlow<RecoveryResult> = _recoveryState.asStateFlow()

    // In-memory registry of known sessions
    private val sessionRegistry = ConcurrentHashMap<String, MultiSessionEntry>()

    // Recovery callbacks — invoked by WCClient when a session is restored
    private val recoveryCallbacks = mutableListOf<suspend (RecoverySessionInfo) -> Unit>()

    // ─── Single-Session Recovery (legacy compat) ────────────────────────

    /** Load the single active session for backward compatibility. */
    fun loadActiveSession(): PersistedSession? {
        val raw = prefs.getString("wc_v2_persisted_session_v1", null) ?: return null
        return PersistedSession.deserialize(raw)?.takeUnless { it.isExpired }
    }

    /** Save the single active session for backward compatibility. */
    fun saveActiveSession(session: PersistedSession) {
        prefs.edit().putString("wc_v2_persisted_session_v1", PersistedSession.serialize(session)).apply()
    }

    // ─── Multi-Session Registry ─────────────────────────────────────────

    /** Register a new session in the multi-session store. */
    fun registerSession(
        topic: String,
        accounts: List<String>,
        chainId: Int,
        peerName: String?,
        isActive: Boolean = true
    ) {
        val now = System.currentTimeMillis()
        val entry = MultiSessionEntry(
            topic = topic,
            accounts = accounts,
            chainId = chainId,
            peerName = peerName,
            createdAt = now,
            expiresAt = now + sessionTTL,
            isActive = isActive,
            lastValidatedAt = now
        )
        sessionRegistry[topic] = entry

        // Set as active topic
        if (isActive) {
            prefs.edit().putString(KEY_ACTIVE_TOPIC, topic).apply()
        }

        persistRegistry()
    }

    /** Remove a session from the registry. */
    fun unregisterSession(topic: String) {
        sessionRegistry.remove(topic)
        if (prefs.getString(KEY_ACTIVE_TOPIC, null) == topic) {
            prefs.edit().remove(KEY_ACTIVE_TOPIC).apply()
        }
        persistRegistry()
    }

    /** Get all registered sessions. */
    fun getAllSessions(): List<MultiSessionEntry> =
        sessionRegistry.values.filterNot { it.isExpired() }

    /** Get the currently active session. */
    fun getActiveSession(): MultiSessionEntry? {
        val activeTopic = prefs.getString(KEY_ACTIVE_TOPIC, null) ?: return null
        return sessionRegistry[activeTopic]?.takeUnless { it.isExpired() }
    }

    /** Switch the active session. */
    fun setActiveSession(topic: String): Boolean {
        val entry = sessionRegistry[topic] ?: return false
        if (entry.isExpired()) return false

        // Deactivate all, activate target
        sessionRegistry.values.forEach { e ->
            sessionRegistry[e.topic] = e.copy(isActive = false)
        }
        sessionRegistry[topic] = entry.copy(isActive = true)
        prefs.edit().putString(KEY_ACTIVE_TOPIC, topic).apply()
        persistRegistry()
        return true
    }

    /** Check if a session entry has exceeded its TTL. */
    private fun MultiSessionEntry.isExpired(): Boolean =
        System.currentTimeMillis() >= expiresAt

    /** Persist the multi-session registry to SharedPreferences. */
    private fun persistRegistry() {
        val jsonArray = JSONArray()
        sessionRegistry.values.forEach { entry ->
            jsonArray.put(JSONObject().apply {
                put("topic", entry.topic)
                put("accounts", JSONArray(entry.accounts))
                put("chainId", entry.chainId)
                put("peerName", entry.peerName)
                put("createdAt", entry.createdAt)
                put("expiresAt", entry.expiresAt)
                put("isActive", entry.isActive)
                put("lastValidatedAt", entry.lastValidatedAt)
            })
        }
        prefs.edit().putString(KEY_SESSIONS, jsonArray.toString()).apply()
    }

    /** Load the multi-session registry from SharedPreferences. */
    fun loadRegistry(): List<MultiSessionEntry> {
        val raw = prefs.getString(KEY_SESSIONS, null) ?: return emptyList()
        return runCatching {
            val array = JSONArray(raw)
            (0 until array.length()).mapNotNull { i ->
                val obj = array.getJSONObject(i)
                val expiresAt = obj.getLong("expiresAt")
                if (System.currentTimeMillis() >= expiresAt) return@mapNotNull null

                MultiSessionEntry(
                    topic = obj.getString("topic"),
                    accounts = (0 until obj.getJSONArray("accounts").length()).map { j ->
                        obj.getJSONArray("accounts").getString(j)
                    },
                    chainId = obj.getInt("chainId"),
                    peerName = if (obj.isNull("peerName")) null else obj.getString("peerName"),
                    createdAt = obj.getLong("createdAt"),
                    expiresAt = expiresAt,
                    isActive = obj.optBoolean("isActive", false),
                    lastValidatedAt = obj.getLong("lastValidatedAt")
                )
            }.also { entries ->
                sessionRegistry.clear()
                entries.forEach { e -> sessionRegistry[e.topic] = e }
            }
        }.getOrDefault(emptyList())
    }

    // ─── Background Validation ─────────────────────────────────────────

    /**
     * Validate a session by checking its liveness.
     * Called by WCClient when the Sign SDK confirms a session is still active on the relay.
     */
    fun validateSession(topic: String) {
        val entry = sessionRegistry[topic] ?: return
        sessionRegistry[topic] = entry.copy(lastValidatedAt = System.currentTimeMillis())
        persistRegistry()
    }

    /**
     * Run background validation on all registered sessions.
     * Removes expired sessions and returns valid ones.
     */
    fun validateAllSessions(): List<RecoverySessionInfo> {
        val now = System.currentTimeMillis()
        val validSessions = mutableListOf<RecoverySessionInfo>()

        val toRemove = mutableListOf<String>()
        sessionRegistry.forEach { (topic, entry) ->
            val remaining = entry.expiresAt - now
            if (remaining <= 0) {
                toRemove.add(topic)
            } else {
                validSessions.add(
                    RecoverySessionInfo(
                        topic = entry.topic,
                        accounts = entry.accounts,
                        chainId = entry.chainId,
                        peerName = entry.peerName,
                        isActive = entry.isActive,
                        expiresAt = entry.expiresAt,
                        timeRemainingMs = remaining
                    )
                )
            }
        }

        toRemove.forEach { unregisterSession(it) }

        if (validSessions.isNotEmpty()) {
            _recoveryState.value = RecoveryResult.Success(validSessions)
        } else {
            _recoveryState.value = RecoveryResult.NotAvailable
        }

        return validSessions
    }

    // ─── Recovery Flow ──────────────────────────────────────────────────

    /**
     * Attempt to recover sessions on app startup.
     * Loads registry, validates sessions, and returns the best candidate.
     */
    suspend fun attemptRecovery(): RecoveryResult = withContext(Dispatchers.IO) {
        loadRegistry()
        val validSessions = validateAllSessions()

        if (validSessions.isEmpty()) {
            return@withContext RecoveryResult.NotAvailable
        }

        // Prefer active session; otherwise pick the one with most time remaining
        val best = validSessions
            .find { it.isActive }
            ?: validSessions.maxByOrNull { it.timeRemainingMs }
            ?: validSessions.first()

        _recoveryState.value = RecoveryResult.Success(validSessions)

        // Notify callbacks about the best candidate
        recoveryCallbacks.forEach { cb ->
            ioScope.launch { cb(best) }
        }

        RecoveryResult.Success(validSessions)
    }

    /** Register a callback for when a session is recovered. */
    fun onSessionRecovered(callback: suspend (RecoverySessionInfo) -> Unit) {
        recoveryCallbacks.add(callback)
    }

    /** Remove a recovery callback. */
    fun removeRecoveryCallback(callback: suspend (RecoverySessionInfo) -> Unit) {
        recoveryCallbacks.remove(callback)
    }

    /** Clean up all resources. */
    fun close() {
        recoveryCallbacks.clear()
    }
}
