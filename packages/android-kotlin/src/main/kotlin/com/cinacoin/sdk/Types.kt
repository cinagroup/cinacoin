/**
 * Types.kt — Core types, error hierarchy, and data classes for Cinacoin SDK.
 *
 * All shared types used across the SDK modules.
 */
package com.cinacoin.sdk

import kotlinx.coroutines.flow.Flow
import java.time.Instant

// ============================================================================
// Error hierarchy
// ============================================================================

/**
 * Sealed error hierarchy — every SDK operation throws or returns a subtype.
 */
sealed class CinacoinError(override val message: String, cause: Throwable? = null) : Exception(message, cause) {

    data class NotInitialized(override val message: String = "CinacoinSDK not initialized. Call initialize() first.") : CinacoinError(message)
    data class AlreadyInitialized(override val message: String = "CinacoinSDK already initialized. Call reset() first.") : CinacoinError(message)
    data class WalletConnectError(override val message: String, cause: Throwable? = null) : CinacoinError(message, cause)
    data class ChainNotFound(override val message: String) : CinacoinError(message)
    data class TransactionError(override val message: String, cause: Throwable? = null) : CinacoinError(message, cause)
    data class SigningError(override val message: String, cause: Throwable? = null) : CinacoinError(message, cause)
    data class UserRejected(override val message: String = "User rejected the request.") : CinacoinError(message)
    data class NetworkError(override val message: String, cause: Throwable? = null) : CinacoinError(message, cause)
    data class StorageError(override val message: String, cause: Throwable? = null) : CinacoinError(message, cause)
    data class Timeout(override val message: String = "Operation timed out.", cause: Throwable? = null) : CinacoinError(message, cause)
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Top-level SDK configuration passed at initialize().
 */
data class CinacoinConfig(
    val projectId: String,
    val chains: List<ChainConfig> = ChainConfig.defaults,
    val themeMode: ThemeMode = ThemeMode.DARK,
    val metadata: AppMetadata? = null,
    val recommendedWallets: List<String> = emptyList(),
    val relayUrl: String? = null,
    val storageEncryption: Boolean = true
)

/**
 * Single chain configuration.
 */
data class ChainConfig(
    val id: Int,
    val namespace: String = "eip155",
    val name: String,
    val rpcUrl: String,
    val nativeCurrency: NativeCurrency,
    val blockExplorerUrl: String? = null,
    val iconUrl: String? = null,
    val testnet: Boolean = false
) {
    /** CAIP-2 chain identifier, e.g. "eip155:1". */
    val chainRef: String get() = "$namespace:$id"

    companion object {
        val ethereum = ChainConfig(
            id = 1, name = "Ethereum", rpcUrl = "https://eth.llamarpc.com",
            nativeCurrency = NativeCurrency.eth, blockExplorerUrl = "https://etherscan.io"
        )
        val polygon = ChainConfig(
            id = 137, name = "Polygon", rpcUrl = "https://polygon-rpc.com",
            nativeCurrency = NativeCurrency(name = "MATIC", symbol = "MATIC", decimals = 18),
            blockExplorerUrl = "https://polygonscan.com"
        )
        val arbitrum = ChainConfig(
            id = 42161, name = "Arbitrum", rpcUrl = "https://arb1.arbitrum.io/rpc",
            nativeCurrency = NativeCurrency.eth, blockExplorerUrl = "https://arbiscan.io"
        )
        val base = ChainConfig(
            id = 8453, name = "Base", rpcUrl = "https://mainnet.base.org",
            nativeCurrency = NativeCurrency.eth, blockExplorerUrl = "https://basescan.org"
        )
        val optimism = ChainConfig(
            id = 10, name = "Optimism", rpcUrl = "https://mainnet.optimism.io",
            nativeCurrency = NativeCurrency.eth, blockExplorerUrl = "https://optimistic.etherscan.io"
        )
        val bsc = ChainConfig(
            id = 56, name = "BNB Smart Chain", rpcUrl = "https://bsc-dataseed.binance.org",
            nativeCurrency = NativeCurrency(name = "BNB", symbol = "BNB", decimals = 18),
            blockExplorerUrl = "https://bscscan.com"
        )
        val sepolia = ChainConfig(
            id = 11155111, name = "Sepolia", rpcUrl = "https://rpc.sepolia.org",
            nativeCurrency = NativeCurrency.eth, blockExplorerUrl = "https://sepolia.etherscan.io", testnet = true
        )

        val defaults: List<ChainConfig> = listOf(ethereum, polygon, arbitrum, base, optimism, bsc)
    }
}

/**
 * Native currency of a chain.
 */
data class NativeCurrency(
    val name: String,
    val symbol: String,
    val decimals: Int
) {
    companion object {
        val eth = NativeCurrency(name = "Ether", symbol = "ETH", decimals = 18)
    }
}

/**
 * Application metadata advertised to wallets via WalletConnect.
 */
data class AppMetadata(
    val name: String,
    val description: String,
    val url: String,
    val icons: List<String>
)

/**
 * UI theme mode.
 */
enum class ThemeMode { DARK, LIGHT, MINIMAL }

// ============================================================================
// Connection state
// ============================================================================

/**
 * Result of a successful wallet connection.
 */
data class ConnectionResult(
    val address: String,
    val chainId: Int,
    val chainSymbol: String,
    val sessionId: String,
    val connectorId: String,
    val connectedAt: Instant = Instant.now()
)

/**
 * Wallet connector info.
 */
data class ConnectorInfo(
    val id: String,
    val name: String,
    val iconUrl: String? = null,
    val type: ConnectorType
)

enum class ConnectorType {
    WALLETCONNECT, INJECTED, COINBASE, EMAIL, SOCIAL, DEEP_LINK
}

/**
 * WalletConnect session metadata.
 */
data class SessionInfo(
    val topic: String,
    val address: String,
    val chainId: Int,
    val chainSymbol: String? = null,
    val namespaces: Map<String, NamespaceData> = emptyMap(),
    val connectedAt: Instant,
    val expiry: Instant
)

data class NamespaceData(
    val accounts: List<String> = emptyList(),
    val methods: List<String> = emptyList(),
    val events: List<String> = emptyList()
)

// ============================================================================
// Transactions
// ============================================================================

/**
 * Parameters for sending a transaction.
 */
data class TransactionParams(
    val from: String,
    val to: String,
    val value: String? = null,
    val data: String? = null,
    val gas: String? = null,
    val gasPrice: String? = null,
    val maxFeePerGas: String? = null,
    val maxPriorityFeePerGas: String? = null,
    val nonce: String? = null,
    val chainId: Int? = null
)

/**
 * Result of a sent transaction.
 */
data class TransactionResult(
    val hash: String,
    val chainId: Int,
    val confirmations: Int = 0,
    val confirmedAt: Instant? = null
)

/**
 * Transaction confirmation event.
 */
data class TxConfirmationUpdate(
    val hash: String,
    val confirmations: Int,
    val status: TxStatus
)

enum class TxStatus { PENDING, CONFIRMED, FAILED }

// ============================================================================
// Signing
// ============================================================================

/**
 * Parameters for signing operations.
 */
sealed class SignParams {
    data class PersonalSign(val message: String, val address: String) : SignParams()
    data class SignTypedData(val typedDataJson: String, val address: String) : SignParams()
    data class SignTransaction(val transactionJson: String, val address: String) : SignParams()
    data class EthSign(val messageHash: String, val address: String) : SignParams()
}

/**
 * Result of a signing operation.
 */
data class SignatureResult(
    val signature: String,
    val signedAt: Instant = Instant.now()
)

// ============================================================================
// Network
// ============================================================================

/**
 * Network connectivity status.
 */
sealed class NetworkStatus {
    object Connected : NetworkStatus()
    object Disconnected : NetworkStatus()
    data class Weak(val details: String) : NetworkStatus()
}

// ============================================================================
// Events
// ============================================================================

/**
 * SDK-level events observable via Flow.
 */
sealed class SdkEvent {
    data class WalletConnected(val result: ConnectionResult) : SdkEvent()
    object WalletDisconnected : SdkEvent()
    data class ChainChanged(val chainId: Int) : SdkEvent()
    data class AccountsChanged(val accounts: List<String>) : SdkEvent()
    data class SessionExpired(val topic: String) : SdkEvent()
    data class Error(val error: CinacoinError) : SdkEvent()
}

// ============================================================================
// Storage keys
// ============================================================================

object StorageKeys {
    const val SESSION_TOPIC = "cinacoin_session_topic"
    const val SESSION_ADDRESS = "cinacoin_session_address"
    const val SESSION_CHAIN_ID = "cinacoin_session_chain_id"
    const val SESSION_CONNECTED_AT = "cinacoin_session_connected_at"
    const val LAST_ACTIVE_CHAIN = "cinacoin_last_active_chain"
    const val PREFERRED_WALLET = "cinacoin_preferred_wallet"
}
