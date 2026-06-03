/**
 * WCRelayManager — Relay connection management for WalletConnect v2.
 *
 * Features:
 * - Relay connection lifecycle management
 * - Auto-reconnect with exponential backoff
 * - Relay health monitoring (ping/latency)
 * - Fallback relay support
 * - Connection state reporting
 *
 * Wraps the WalletConnectKotlin SDK relay with enhanced reliability.
 */
package com.cinacoin.walletconnect

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

// ============================================================
// Relay State
// ============================================================

/** Relay connection states. */
sealed class RelayState {
    object Disconnected : RelayState()
    object Connecting : RelayState()
    object Connected : RelayState()
    object Reconnecting : RelayState()
    data class Error(val message: String) : RelayState()
}

/** Relay health metrics. */
data class RelayHealthMetrics(
    val state: RelayState,
    val currentUrl: String,
    val latencyMs: Long = 0,
    val consecutiveFailures: Int = 0,
    val totalReconnects: Int = 0,
    val lastPingAt: Long = 0,
    val uptimeMs: Long = 0
)

// ============================================================
// Relay Manager
// ============================================================

/**
 * Manages the WalletConnect relay connection with enhanced
 * reliability features: auto-reconnect, health checks, fallback.
 */
class WCRelayManager(
    private val wcClient: WCClient,
    private val ioScope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {

    companion object {
        // Default relay endpoints
        const val DEFAULT_RELAY_URL = "wss://relay.walletconnect.com"
        const val FALLBACK_RELAY_URL = "wss://relay.walletconnect.org"

        // Reconnect configuration
        const val BASE_RECONNECT_DELAY_MS = 1000L
        const val MAX_RECONNECT_DELAY_MS = 60_000L
        const val MAX_RECONNECT_ATTEMPTS = 10

        // Health check configuration
        const val HEALTH_CHECK_INTERVAL_MS = 30_000L
        const val HEALTH_CHECK_TIMEOUT_MS = 5_000L
        const val FAILURE_THRESHOLD = 3
    }

    // Connection state
    private val _relayState = MutableStateFlow<RelayState>(RelayState.Disconnected)
    val relayState: StateFlow<RelayState> = _relayState.asStateFlow()

    // Health metrics
    private val _healthMetrics = MutableStateFlow(
        RelayHealthMetrics(
            state = RelayState.Disconnected,
            currentUrl = DEFAULT_RELAY_URL
        )
    )
    val healthMetrics: StateFlow<RelayHealthMetrics> = _healthMetrics.asStateFlow()

    // Configuration
    var primaryRelayUrl: String = DEFAULT_RELAY_URL
    var fallbackRelayUrl: String = FALLBACK_RELAY_URL
    var autoReconnect: Boolean = true
    var maxReconnectAttempts: Int = MAX_RECONNECT_ATTEMPTS

    // Internal state
    private var reconnectAttempts = 0
    private var consecutiveFailures = 0
    private var totalReconnects = 0
    private var connectionStartMs: Long = 0

    private var healthCheckJob: Job? = null
    private var reconnectJob: Job? = null

    // Fallback tracking
    private var usingFallback = false

    /**
     * Start relay health monitoring.
     * Periodically checks connection health and triggers
     * auto-reconnect on failure.
     */
    fun startHealthMonitoring() {
        healthCheckJob?.cancel()
        healthCheckJob = ioScope.launch {
            while (isActive) {
                delay(HEALTH_CHECK_INTERVAL_MS)
                checkHealth()
            }
        }
    }

    /** Stop health monitoring. */
    fun stopHealthMonitoring() {
        healthCheckJob?.cancel()
        healthCheckJob = null
    }

    /**
     * Perform a health check on the relay connection.
     * Uses the WCClient's session status as a proxy for relay health.
     */
    private fun checkHealth() {
        val status = wcClient.status.value
        val isHealthy = status is WCStatus.Connected

        if (isHealthy) {
            consecutiveFailures = 0
            val now = System.currentTimeMillis()
            _healthMetrics.value = _healthMetrics.value.copy(
                state = RelayState.Connected,
                consecutiveFailures = 0,
                lastPingAt = now,
                uptimeMs = if (connectionStartMs > 0) now - connectionStartMs else 0
            )
        } else {
            consecutiveFailures++
            _healthMetrics.value = _healthMetrics.value.copy(
                state = when (status) {
                    is WCStatus.Connecting, is WCStatus.Pairing -> RelayState.Connecting
                    is WCStatus.Disconnected -> RelayState.Disconnected
                    is WCStatus.Error -> RelayState.Error(status.message)
                    else -> RelayState.Connected
                },
                consecutiveFailures = consecutiveFailures
            )

            // Trigger auto-reconnect if failures exceed threshold
            if (consecutiveFailures >= FAILURE_THRESHOLD && autoReconnect) {
                attemptReconnect()
            }
        }
    }

    /**
     * Attempt to reconnect to the relay.
     * Uses exponential backoff and falls back to secondary relay.
     */
    private fun attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            _relayState.value = RelayState.Error("Max reconnect attempts ($maxReconnectAttempts) exceeded")
            return
        }

        reconnectJob?.cancel()
        reconnectJob = ioScope.launch {
            val delayMs = (BASE_RECONNECT_DELAY_MS * (1L shl reconnectAttempts)).coerceAtMost(MAX_RECONNECT_DELAY_MS)
            _relayState.value = RelayState.Reconnecting

            delay(delayMs)
            reconnectAttempts++
            totalReconnects++

            // Try fallback relay after initial attempts fail
            if (reconnectAttempts >= 3 && !usingFallback) {
                usingFallback = true
                switchToFallbackRelay()
            }

            // Trigger WCClient reconnection
            try {
                wcClient.sessionManager?.scheduleReconnect {
                    // The WCClient will attempt to restore the session
                    wcClient.session.value != null
                }
            } catch (e: Exception) {
                _relayState.value = RelayState.Error("Reconnect failed: ${e.message}")
                attemptReconnect() // Retry
            }
        }
    }

    /**
     * Switch to the fallback relay URL.
     */
    private fun switchToFallbackRelay() {
        wcClient.relayUrl = fallbackRelayUrl
        _healthMetrics.value = _healthMetrics.value.copy(
            currentUrl = fallbackRelayUrl
        )
    }

    /**
     * Manually switch to a specific relay URL.
     */
    fun switchRelay(url: String) {
        wcClient.relayUrl = url
        usingFallback = false
        _healthMetrics.value = _healthMetrics.value.copy(
            currentUrl = url
        )
    }

    /**
     * Reset the relay manager state.
     */
    fun reset() {
        reconnectAttempts = 0
        consecutiveFailures = 0
        usingFallback = false
        reconnectJob?.cancel()
        reconnectJob = null
        wcClient.relayUrl = primaryRelayUrl
        _relayState.value = RelayState.Disconnected
        _healthMetrics.value = _healthMetrics.value.copy(
            state = RelayState.Disconnected,
            currentUrl = primaryRelayUrl
        )
    }

    /**
     * Record a successful connection.
     * Called by WCClient when the relay connects.
     */
    fun onConnected() {
        connectionStartMs = System.currentTimeMillis()
        reconnectAttempts = 0
        consecutiveFailures = 0
        _relayState.value = RelayState.Connected
        _healthMetrics.value = _healthMetrics.value.copy(
            state = RelayState.Connected,
            lastPingAt = System.currentTimeMillis(),
            uptimeMs = 0
        )
    }

    /**
     * Record a connection failure.
     */
    fun onDisconnected() {
        _relayState.value = RelayState.Disconnected
        _healthMetrics.value = _healthMetrics.value.copy(
            state = RelayState.Disconnected
        )

        if (autoReconnect) {
            attemptReconnect()
        }
    }

    /**
     * Clean up all resources.
     */
    fun close() {
        stopHealthMonitoring()
        reconnectJob?.cancel()
        reconnectJob = null
    }
}
