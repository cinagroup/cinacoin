/**
 * CinacoinSDK.kt — Main entry point. Singleton SDK manager.
 *
 * Usage:
 * ```
 * CinacoinSDK.initialize(context, config)
 * CinacoinSDK.instance.connect("walletconnect")
 * ```
 */
package com.cinacoin.sdk

import android.content.Context
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class CinacoinSDK private constructor() {

    companion object {
        @Volatile
        private var INSTANCE: CinacoinSDK? = null

        /** Access the singleton instance. */
        val instance: CinacoinSDK
            get() = INSTANCE ?: throw CinacoinError.NotInitialized()

        /**
         * Initialize the SDK. Must be called once before any other method.
         *
         * @param application Context — use applicationContext.
         * @param config SDK configuration.
         */
        fun initialize(application: Context, config: CinacoinConfig) {
            synchronized(this) {
                val existing = INSTANCE
                if (existing != null && existing._isInitialized.value) {
                    throw CinacoinError.AlreadyInitialized()
                }
                CinacoinSDK().also { sdk ->
                    sdk._context = application.applicationContext
                    sdk._config = config
                    sdk._isInitialized.value = true

                    // Initialize sub-managers
                    sdk.walletConnectManager.initialize(application, config)
                    sdk.chainManager.setChains(config.chains)
                    sdk.storageManager.initialize(application, config.storageEncryption)
                    sdk.networkMonitor.start(application)
                    sdk.transactionManager.initialize(sdk.walletConnectManager, sdk.chainManager)
                    sdk.signerManager.initialize(sdk.walletConnectManager, sdk.chainManager)

                    // Restore session if available
                    val savedTopic = sdk.storageManager.getString(StorageKeys.SESSION_TOPIC)
                    val savedAddress = sdk.storageManager.getString(StorageKeys.SESSION_ADDRESS)
                    val savedChainId = sdk.storageManager.getString(StorageKeys.SESSION_CHAIN_ID)
                        ?.toIntOrNull()
                        ?: config.chains.firstOrNull()?.id ?: 1

                    if (savedTopic != null && savedAddress != null) {
                        sdk._sessionInfo.value = SessionInfo(
                            topic = savedTopic,
                            address = savedAddress,
                            chainId = savedChainId,
                            connectedAt = sdk.storageManager.getLong(StorageKeys.SESSION_CONNECTED_AT)
                                ?.let { java.time.Instant.ofEpochMilli(it) }
                                ?: java.time.Instant.now(),
                            expiry = java.time.Instant.now().plusSeconds(604800)
                        )
                        sdk._isConnected.value = true
                        sdk._activeChainId.value = savedChainId
                    }

                    sdk.forwardWcEvents()
                    sdk.forwardNetworkEvents()
                }
            }
        }

        /** Reset the SDK to un-initialized state. Useful for testing. */
        fun reset() {
            synchronized(this) {
                INSTANCE?.walletConnectManager?.disconnect()
                INSTANCE = null
            }
        }
    }

    // ─── Internal state ────────────────────────────────────────────────────

    private var _context: Context? = null
    private val context: Context get() = _context ?: throw CinacoinError.NotInitialized()

    private var _config: CinacoinConfig? = null
    val config: CinacoinConfig get() = _config ?: throw CinacoinError.NotInitialized()

    private val _isInitialized = MutableStateFlow(false)
    val isInitialized: StateFlow<Boolean> = _isInitialized.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _sessionInfo = MutableStateFlow<SessionInfo?>(null)
    val sessionInfo: StateFlow<SessionInfo?> = _sessionInfo.asStateFlow()

    private val _activeChainId = MutableStateFlow(1)
    val activeChainId: StateFlow<Int> = _activeChainId.asStateFlow()

    private val _events = MutableStateFlow<SdkEvent?>(null)
    val events: StateFlow<SdkEvent?> = _events.asStateFlow()

    // ─── Sub-managers (created eagerly) ────────────────────────────────────

    val walletConnectManager: WalletConnectManager = WalletConnectManager()
    val chainManager: ChainManager = ChainManager()
    val transactionManager: TransactionManager = TransactionManager()
    val signerManager: SignerManager()
    val networkMonitor: NetworkMonitor = NetworkMonitor()
    val storageManager: StorageManager = StorageManager()

    // ─── Public API ────────────────────────────────────────────────────────

    /** Connect to a wallet by connector ID. */
    suspend fun connect(connectorId: String): ConnectionResult {
        val result = walletConnectManager.connect(connectorId)
        _isConnected.value = true
        _activeChainId.value = result.chainId
        _sessionInfo.value = SessionInfo(
            topic = result.sessionId,
            address = result.address,
            chainId = result.chainId,
            chainSymbol = result.chainSymbol,
            connectedAt = result.connectedAt,
            expiry = java.time.Instant.now().plusSeconds(604800)
        )
        _events.value = SdkEvent.WalletConnected(result)
        persistSession(result)
        return result
    }

    /** Disconnect the active wallet session. */
    suspend fun disconnect() {
        walletConnectManager.disconnect()
        _isConnected.value = false
        _sessionInfo.value = null
        clearSession()
        _events.value = SdkEvent.WalletDisconnected
    }

    /** Switch the active chain. */
    suspend fun switchChain(chainId: Int) {
        chainManager.switchTo(chainId)
        _activeChainId.value = chainId
        storageManager.putString(StorageKeys.LAST_ACTIVE_CHAIN, chainId.toString())
        _events.value = SdkEvent.ChainChanged(chainId)
    }

    /** Get the currently connected account address, or null. */
    fun getAccountAddress(): String? = sessionInfo.value?.address

    /** Get the list of supported connector wallets. */
    fun getConnectors(): List<ConnectorInfo> = walletConnectManager.getConnectors()

    /** Check whether a specific wallet app is installed on device. */
    fun isWalletInstalled(walletId: String): Boolean =
        walletConnectManager.isWalletInstalled(walletId)

    // ─── Session persistence ───────────────────────────────────────────────

    private fun persistSession(result: ConnectionResult) {
        storageManager.putString(StorageKeys.SESSION_TOPIC, result.sessionId)
        storageManager.putString(StorageKeys.SESSION_ADDRESS, result.address)
        storageManager.putString(StorageKeys.SESSION_CHAIN_ID, result.chainId.toString())
        storageManager.putLong(StorageKeys.SESSION_CONNECTED_AT, result.connectedAt.toEpochMilli())
    }

    private fun clearSession() {
        storageManager.remove(StorageKeys.SESSION_TOPIC)
        storageManager.remove(StorageKeys.SESSION_ADDRESS)
        storageManager.remove(StorageKeys.SESSION_CHAIN_ID)
        storageManager.remove(StorageKeys.SESSION_CONNECTED_AT)
    }

    // ─── Event forwarding ──────────────────────────────────────────────────

    private fun forwardWcEvents() {
        kotlinx.coroutines.MainScope().launch {
            walletConnectManager.events.collect { event ->
                when (event) {
                    is WcEvent.Connected -> {
                        // already handled in connect()
                    }
                    is WcEvent.Disconnected -> {
                        _isConnected.value = false
                        _sessionInfo.value = null
                        clearSession()
                        _events.value = SdkEvent.WalletDisconnected
                    }
                    is WcEvent.ChainChanged -> {
                        _activeChainId.value = event.chainId
                        _events.value = SdkEvent.ChainChanged(event.chainId)
                    }
                    is WcEvent.AccountsChanged -> {
                        _events.value = SdkEvent.AccountsChanged(event.accounts)
                    }
                    is WcEvent.SessionExpired -> {
                        _events.value = SdkEvent.SessionExpired(event.topic)
                        _isConnected.value = false
                        _sessionInfo.value = null
                        clearSession()
                    }
                    is WcEvent.Error -> {
                        _events.value = SdkEvent.Error(
                            CinacoinError.WalletConnectError(event.message)
                        )
                    }
                }
            }
        }
    }

    private fun forwardNetworkEvents() {
        kotlinx.coroutines.MainScope().launch {
            networkMonitor.status.collect { status ->
                when (status) {
                    is NetworkStatus.Disconnected -> {
                        _events.value = SdkEvent.Error(
                            CinacoinError.NetworkError("Network disconnected")
                        )
                    }
                    else -> {} // ignore
                }
            }
        }
    }
}
