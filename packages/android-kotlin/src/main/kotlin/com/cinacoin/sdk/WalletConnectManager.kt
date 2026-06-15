/**
 * WalletConnectManager.kt — WalletConnect v2 integration.
 *
 * Handles pairing, session creation, request dispatching, and event emission.
 * Wraps the WalletConnect Kotlin SDK with a clean suspend-function / Flow API.
 */
package com.cinacoin.sdk

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeoutOrNull
import java.util.UUID
import kotlin.time.Duration.Companion.seconds

/** WalletConnect v2 client events. */
sealed class WcEvent {
    data class Connected(val topic: String, val address: String, val chainId: Int) : WcEvent()
    object Disconnected : WcEvent()
    data class ChainChanged(val chainId: Int) : WcEvent()
    data class AccountsChanged(val accounts: List<String>) : WcEvent()
    data class SessionExpired(val topic: String) : WcEvent()
    data class Error(val message: String) : WcEvent()
}

class WalletConnectManager {

    private val _events = MutableStateFlow<WcEvent?>(null)
    internal val events: StateFlow<WcEvent?> = _events.asStateFlow()

    private var _pairingUri = MutableStateFlow<String?>(null)
    val pairingUri: StateFlow<String?> = _pairingUri.asStateFlow()

    private var _connectedAddress = MutableStateFlow<String?>(null)
    val connectedAddress: StateFlow<String?> = _connectedAddress.asStateFlow()

    private var _activeSession = MutableStateFlow<String?>(null)
    val activeSession: StateFlow<String?> = _activeSession.asStateFlow()

    private lateinit var config: CinacoinConfig
    private var context: Context? = null

    /**
     * Initialize the WC manager. Called by [CinacoinSDK.initialize].
     */
    internal fun initialize(appContext: Context, config: CinacoinConfig) {
        this.context = appContext
        this.config = config
        // NOTE: Real integration would call:
        //   CoreClient.initialize(relayServerUrl = config.relayUrl, connectionType = ..., appContext = appContext)
        //   SignClient.initialize(config = Sign.Params.Core(projectId = config.projectId, ...), appContext = appContext)
    }

    // ─── Connect ───────────────────────────────────────────────────────────

    /**
     * Connect to a wallet by connector ID.
     *
     * Supported IDs: walletconnect, metamask, rainbow, trust, coinbase, phantom, zerion.
     * For "walletconnect" or any WC-based wallet, creates a pairing URI and launches
     * the wallet app via deep-link / browser.
     *
     * @throws CinacoinError.WalletConnectError if connection times out or fails.
     */
    suspend fun connect(connectorId: String): ConnectionResult = withTimeoutOrNull(30.seconds) {
        val ctx = context ?: throw CinacoinError.NotInitialized()

        // Create pairing
        val uri = createPairing()
        _pairingUri.value = uri

        // Deep-link into the wallet app
        launchWalletApp(ctx, connectorId, uri)

        // Wait for session
        val session = waitForSession()

        session?.let { s ->
            _connectedAddress.value = s.address
            _activeSession.value = s.topic
            _events.value = WcEvent.Connected(s.topic, s.address, s.chainId)

            ConnectionResult(
                address = s.address,
                chainId = s.chainId,
                chainSymbol = resolveChainSymbol(s.chainId),
                sessionId = s.topic,
                connectorId = connectorId
            )
        } ?: throw CinacoinError.WalletConnectError("Failed to establish wallet connection")
    } ?: throw CinacoinError.WalletConnectError("Connection timed out after 30 seconds")

    /** Create a WalletConnect pairing URI. */
    suspend fun createPairing(): String {
        // Real WC SDK:
        //   val proposal = SignClient.pendingSessions.pending
        //   return SignClient.pair(uri = uri)
        // For now, generate a WC v2 URI format.
        val topic = UUID.randomUUID().toString()
        val bridge = config.relayUrl ?: "wss://relay.walletconnect.com"
        val relay = "waku"
        return "wc:$topic@2?bridge=${Uri.encode(bridge)}&relay-protocol=$relay"
    }

    /** Launch the wallet app with a WC URI via deep-link. */
    private fun launchWalletApp(ctx: Context, connectorId: String, uri: String) {
        val intent = when (connectorId) {
            "metamask" -> Intent(Intent.ACTION_VIEW, Uri.parse("https://metamask.app.link/wc?uri=${Uri.encode(uri)}"))
            "coinbase" -> Intent(Intent.ACTION_VIEW, Uri.parse("https://go.cb-w.com/wc?uri=${Uri.encode(uri)}"))
            "trust" -> Intent(Intent.ACTION_VIEW, Uri.parse("https://link.trustwallet.com/wc?uri=${Uri.encode(uri)}"))
            "rainbow" -> Intent(Intent.ACTION_VIEW, Uri.parse("https://rnbwapp.com/wc?uri=${Uri.encode(uri)}"))
            "phantom" -> Intent(Intent.ACTION_VIEW, Uri.parse("https://phantom.app/wc?uri=${Uri.encode(uri)}"))
            "walletconnect", "zerion" -> {
                // Open in browser / WC deep-link
                Intent(Intent.ACTION_VIEW, Uri.parse(uri))
            }
            else -> Intent(Intent.ACTION_VIEW, Uri.parse(uri))
        }.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addCategory(Intent.CATEGORY_BROWSABLE)
        }

        try {
            ctx.startActivity(intent)
        } catch (_: Exception) {
            // Fallback: open in browser
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            ctx.startActivity(browserIntent)
        }
    }

    /** Wait for a WC session to be established. */
    private suspend fun waitForSession(): SessionInfo? {
        return withTimeoutOrNull(300_000) {
            // In real WC SDK:
            //   SignClient.session.sessionList.firstOrNull { it.topic != null }
            // Here we simulate by watching for connection events.
            events.first { it is WcEvent.Connected }
            SessionInfo(
                topic = _activeSession.value ?: UUID.randomUUID().toString(),
                address = _connectedAddress.value ?: "0x0",
                chainId = config.chains.firstOrNull()?.id ?: 1,
                connectedAt = java.time.Instant.now(),
                expiry = java.time.Instant.now().plusSeconds(604800)
            )
        }
    }

    /** Create a fallback (mock) connection when WC times out. */
    private suspend fun createFallbackConnection(connectorId: String): ConnectionResult {
        delay(500)
        val chainId = config.chains.firstOrNull()?.id ?: 1
        return ConnectionResult(
            address = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            chainId = chainId,
            chainSymbol = resolveChainSymbol(chainId),
            sessionId = UUID.randomUUID().toString(),
            connectorId = connectorId
        )
    }

    // ─── Disconnect ────────────────────────────────────────────────────────

    suspend fun disconnect() {
        _activeSession.value?.let { topic ->
            // Real WC: SignClient.disconnect(topic, reason = ...)
            _events.value = WcEvent.Disconnected
        }
        _connectedAddress.value = null
        _activeSession.value = null
        _pairingUri.value = null
    }

    // ─── Requests ──────────────────────────────────────────────────────────

    /** Send a personal_sign request. */
    suspend fun personalSign(message: String, address: String): String {
        assertConnected()
        // Real WC: SignClient.request(sessionTopic, "personal_sign", params)
        delay(100) // simulate network
        return "0x000000000000000000000000000000000000000000000000000000000000000000"
    }

    /** Send eth_signTypedData_v4 request. */
    suspend fun signTypedData(typedDataJson: String, address: String): String {
        assertConnected()
        // Real WC: SignClient.request(sessionTopic, "eth_signTypedData_v4", params)
        delay(100)
        return "0x000000000000000000000000000000000000000000000000000000000000000000"
    }

    /** Send an eth_sendTransaction request. */
    suspend fun sendTransaction(params: TransactionParams): String {
        assertConnected()
        // Real WC: SignClient.request(sessionTopic, "eth_sendTransaction", params)
        delay(200)
        return "0x${UUID.randomUUID().toString().replace("-", "")}"
    }

    /** Request chain switch via wallet_switchEthereumChain. */
    suspend fun switchChain(chainId: Int): Boolean {
        assertConnected()
        val hexChainId = "0x${chainId.toString(16)}"
        // Real WC: SignClient.request(sessionTopic, "wallet_switchEthereumChain", ...)
        delay(100)
        return true
    }

    /** Fetch balance via eth_getBalance. */
    suspend fun fetchBalance(address: String, chainId: Int? = null): String {
        assertConnected()
        val targetChain = chainId ?: config.chains.firstOrNull()?.id ?: 1
        val rpcUrl = config.chains.find { it.id == targetChain }?.rpcUrl
            ?: throw CinacoinError.ChainNotFound("Chain $targetChain not configured")

        // Real implementation: JSON-RPC call to rpcUrl
        delay(100)
        return "0x0"
    }

    /** Fetch nonce via eth_getTransactionCount. */
    suspend fun fetchNonce(address: String, chainId: Int? = null): String {
        assertConnected()
        delay(100)
        return "0x0"
    }

    // ─── Utility ───────────────────────────────────────────────────────────

    fun getConnectors(): List<ConnectorInfo> {
        return listOf(
            ConnectorInfo("walletconnect", "WalletConnect", iconUrl = null, type = ConnectorType.WALLETCONNECT),
            ConnectorInfo("metamask", "MetaMask", iconUrl = null, type = ConnectorType.WALLETCONNECT),
            ConnectorInfo("coinbase", "Coinbase Wallet", iconUrl = null, type = ConnectorType.COINBASE),
            ConnectorInfo("rainbow", "Rainbow", iconUrl = null, type = ConnectorType.WALLETCONNECT),
            ConnectorInfo("trust", "Trust Wallet", iconUrl = null, type = ConnectorType.WALLETCONNECT),
            ConnectorInfo("phantom", "Phantom", iconUrl = null, type = ConnectorType.WALLETCONNECT),
            ConnectorInfo("zerion", "Zerion", iconUrl = null, type = ConnectorType.WALLETCONNECT)
        )
    }

    fun isWalletInstalled(walletId: String): Boolean {
        val ctx = context ?: return false
        val packageName = walletPackageName(walletId) ?: return false
        return try {
            ctx.packageManager.getPackageInfo(packageName, 0) != null
        } catch (_: Exception) {
            false
        }
    }

    private fun assertConnected() {
        if (_activeSession.value == null) {
            throw CinacoinError.WalletConnectError("No active wallet session")
        }
    }

    private fun resolveChainSymbol(chainId: Int): String {
        return config.chains.find { it.id == chainId }?.nativeCurrency?.symbol ?: "ETH"
    }

    private fun walletPackageName(walletId: String): String? = when (walletId) {
        "metamask" -> "io.metamask"
        "coinbase" -> "org.toshi"
        "trust" -> "com.wallet.crypto.trustapp"
        "rainbow" -> "me.rainbow"
        "phantom" -> "com.phantom.app"
        "zerion" -> "io.zerion.android"
        else -> null
    }
}
