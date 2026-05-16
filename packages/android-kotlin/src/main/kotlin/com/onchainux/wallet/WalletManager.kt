/**
 * WalletManager — manages wallet connections and session lifecycle for Android.
 *
 * Handles wallet discovery, connection, disconnection, and state management.
 * Supports multiple connector types: injected, WalletConnect, Coinbase,
 * email, and social logins.
 *
 * ## Usage
 * ```kotlin
 * val manager = WalletManager()
 * manager.configure(config)
 *
 * val result = manager.connect("metamask")
 * println("Connected: ${result.account.address}")
 *
 * manager.disconnect()
 * ```
 */
package com.onchainux.wallet

import com.onchainux.core.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

/**
 * Manages wallet connections and session state.
 */
class WalletManager {

    /** Currently connected account, if any. */
    private val _connectedAccount = MutableStateFlow<AccountInfo?>(null)
    val connectedAccount: StateFlow<AccountInfo?> = _connectedAccount.asStateFlow()

    /** Current connection status. */
    private val _connectionStatus = MutableStateFlow<ConnectionStatus>(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    /** Available connectors. */
    private val _connectors = MutableStateFlow<List<ConnectorInfo>>(emptyList())
    val connectors: StateFlow<List<ConnectorInfo>> = _connectors.asStateFlow()

    /** Active session ID. */
    var sessionId: String? = null
        private set

    private var config: OnChainUXConfig? = null

    /**
     * Configure the wallet manager.
     */
    fun configure(config: OnChainUXConfig) {
        this.config = config
        _connectors.value = buildDefaultConnectors(config)
    }

    /**
     * Connect to a wallet by connector ID.
     *
     * @param connectorId The connector to use.
     * @return Connection result with account info.
     * @throws IllegalStateException if not configured.
     */
    suspend fun connect(connectorId: String): ConnectResult {
        _connectionStatus.value = ConnectionStatus.CONNECTING

        // Simulate wallet connection delay
        kotlinx.coroutines.delay(1000)

        val cfg = config ?: throw IllegalStateException("WalletManager not configured")

        val chainId = cfg.chains.firstOrNull()?.chainId ?: 1
        val symbol = cfg.chains.firstOrNull()?.nativeCurrency?.symbol ?: "ETH"

        val account = AccountInfo(
            address = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            balance = "1.234",
            chainId = chainId,
            chainSymbol = symbol
        )

        val newSessionId = UUID.randomUUID().toString()
        _connectedAccount.value = account
        sessionId = newSessionId
        _connectionStatus.value = ConnectionStatus.CONNECTED

        return ConnectResult(account = account, chainId = chainId, sessionId = newSessionId)
    }

    /**
     * Disconnect from the current wallet.
     */
    suspend fun disconnect() {
        _connectedAccount.value = null
        sessionId = null
        _connectionStatus.value = ConnectionStatus.DISCONNECTED
    }

    /**
     * Get the list of available connectors.
     */
    fun getConnectors(): List<ConnectorInfo> = _connectors.value

    /**
     * Switch to a different chain.
     */
    suspend fun switchChain(chainId: Int) {
        val cfg = config ?: throw IllegalStateException("WalletManager not configured")
        if (cfg.chains.none { it.chainId == chainId }) {
            throw IllegalArgumentException("Chain $chainId not supported")
        }

        _connectedAccount.value?.let { account ->
            val chain = cfg.chains.find { it.chainId == chainId }
            if (chain != null) {
                _connectedAccount.value = account.copy(
                    chainId = chainId,
                    chainSymbol = chain.nativeCurrency.symbol
                )
            }
        }
    }

    /**
     * Check if a wallet app is installed (via package manager).
     * In production, use PackageManager.resolveActivity() to check.
     */
    fun isWalletInstalled(walletId: String, context: android.content.Context): Boolean {
        val packageName = when (walletId) {
            "metamask" -> "io.metamask"
            "coinbase" -> "org.toshi"
            "trust" -> "com.wallet.crypto.trustapp"
            "rainbow" -> "me.rainbow"
            else -> null
        } ?: return false

        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun buildDefaultConnectors(config: OnChainUXConfig): List<ConnectorInfo> {
        return listOf(
            ConnectorInfo("metamask", "MetaMask", type = ConnectorType.WALLETCONNECT),
            ConnectorInfo("walletconnect", "WalletConnect", type = ConnectorType.WALLETCONNECT),
            ConnectorInfo("coinbase", "Coinbase Wallet", type = ConnectorType.COINBASE),
            ConnectorInfo("email", "Email", type = ConnectorType.EMAIL)
        )
    }
}
