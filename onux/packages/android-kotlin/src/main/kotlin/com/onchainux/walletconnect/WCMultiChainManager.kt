/**
 * WCMultiChainManager — Multi-chain session management for WalletConnect v2.
 *
 * Features:
 * - Multi-chain session tracking (CAIP-2 namespace handling)
 * - Chain switching without requiring reconnection
 * - Cross-chain balance aggregation
 * - Supported chain registry per session
 * - Active chain state management
 *
 * Integrates with WCClient for seamless chain operations.
 */
package com.cinacoin.walletconnect

import kotlinx.coroutines.flow.*
import java.math.BigDecimal
import java.math.RoundingMode

// ============================================================
// CAIP-2 Chain
// ============================================================

/** CAIP-2 chain identifier (e.g., "eip155:1", "eip155:137", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"). */
data class Caip2Chain(
    val namespace: String,   // e.g., "eip155", "solana"
    val reference: String    // e.g., "1", "137", "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
) {
    val id: String get() = "$namespace:$reference"

    companion object {
        fun fromString(caip2: String): Caip2Chain? {
            val parts = caip2.split(":", limit = 2)
            if (parts.size != 2) return null
            return Caip2Chain(namespace = parts[0], reference = parts[1])
        }
    }
}

// ============================================================
// Chain Info
// ============================================================

/** Metadata for a supported chain. */
data class ChainInfo(
    val chain: Caip2Chain,
    val name: String,
    val nativeCurrency: String,
    val symbol: String,
    val decimals: Int = 18,
    val rpcUrls: List<String> = emptyList(),
    val explorers: List<String> = emptyList()
)

// ============================================================
// Multi-Chain State
// ============================================================

/** State of the multi-chain session. */
data class MultiChainState(
    val activeChain: Caip2Chain,
    val supportedChains: List<Caip2Chain>,
    val balances: Map<Caip2Chain, String>,
    val address: String,
    val isSwitching: Boolean = false
)

// ============================================================
// Chain Event
// ============================================================

sealed class MultiChainEvent {
    data class ChainChanged(val newChain: Caip2Chain, val oldChain: Caip2Chain) : MultiChainEvent()
    data class BalanceUpdated(val chain: Caip2Chain, val balance: String) : MultiChainEvent()
    data class ChainAdded(val chain: Caip2Chain) : MultiChainEvent()
    data class Error(val message: String) : MultiChainEvent()
}

// ============================================================
// Multi-Chain Manager
// ============================================================

/**
 * Manages multi-chain operations over a single WC session.
 * Handles chain switching, balance tracking, and CAIP-2 namespace logic.
 */
class WCMultiChainManager(
    private val wcClient: WCClient
) {

    companion object {
        // Default EVM chains
        val DEFAULT_EVM_CHAINS = listOf(
            ChainInfo(Caip2Chain("eip155", "1"), "Ethereum Mainnet", "ETH", "ETH", 18),
            ChainInfo(Caip2Chain("eip155", "137"), "Polygon", "MATIC", "MATIC", 18),
            ChainInfo(Caip2Chain("eip155", "10"), "Optimism", "ETH", "ETH", 18),
            ChainInfo(Caip2Chain("eip155", "42161"), "Arbitrum One", "ETH", "ETH", 18),
            ChainInfo(Caip2Chain("eip155", "8453"), "Base", "ETH", "ETH", 18),
            ChainInfo(Caip2Chain("eip155", "56"), "BNB Smart Chain", "BNB", "BNB", 18),
            ChainInfo(Caip2Chain("eip155", "43114"), "Avalanche C-Chain", "AVAX", "AVAX", 18),
            ChainInfo(Caip2Chain("eip155", "11155111"), "Sepolia", "ETH", "ETH", 18),
            ChainInfo(Caip2Chain("eip155", "100"), "Gnosis", "xDAI", "xDAI", 18)
        )

        private val WEI_PER_ETH = BigDecimal("1000000000000000000")
    }

    // Supported chain registry
    private val _supportedChains = MutableStateFlow<List<ChainInfo>>(DEFAULT_EVM_CHAINS)
    val supportedChains: StateFlow<List<ChainInfo>> = _supportedChains.asStateFlow()

    // Active chain
    private val _activeChain = MutableStateFlow<Caip2Chain>(Caip2Chain("eip155", "1"))
    val activeChain: StateFlow<Caip2Chain> = _activeChain.asStateFlow()

    // Balances per chain
    private val _balances = MutableStateFlow<Map<Caip2Chain, String>>(emptyMap())
    val balances: StateFlow<Map<Caip2Chain, String>> = _balances.asStateFlow()

    // Events
    private val _events = MutableSharedFlow<MultiChainEvent>(extraBufferCapacity = 32)
    val events: Flow<MultiChainEvent> = _events.asSharedFlow()

    // Switching state
    private val _isSwitching = MutableStateFlow(false)
    val isSwitching: StateFlow<Boolean> = _isSwitching.asStateFlow()

    // Derived multi-chain state
    val state: StateFlow<MultiChainState> = combine(
        _activeChain,
        _supportedChains.map { it.map { ci -> ci.chain } },
        _balances,
        _isSwitching
    ) { chain, chains, bals, switching ->
        MultiChainState(
            activeChain = chain,
            supportedChains = chains,
            balances = bals,
            address = extractAddress(),
            isSwitching = switching
        )
    }.stateIn(wcClient.scope, SharingStarted.Eagerly, MultiChainState(
        activeChain = Caip2Chain("eip155", "1"),
        supportedChains = DEFAULT_EVM_CHAINS.map { it.chain },
        balances = emptyMap(),
        address = ""
    ))

    /**
     * Initialize multi-chain support.
     * Syncs with WCClient's current session to detect supported chains.
     */
    fun initialize() {
        // Extract chains from WC session namespaces
        wcClient.session.value?.let { session ->
            val detectedChains = session.namespaces.keys.mapNotNull { ns ->
                // Each namespace key is like "eip155"
                session.namespaces[ns]?.let { namespace ->
                    namespace.toString() // Parse chains from namespace
                }
            }

            // Also extract from accounts
            val accountChains = session.accounts.mapNotNull { account ->
                Caip2Chain.fromString(account.substringBeforeLast(":"))
            }.distinct()

            accountChains.forEach { chain ->
                if (!_supportedChains.value.any { it.chain.id == chain.id }) {
                    _supportedChains.value += ChainInfo(
                        chain = chain,
                        name = chain.id,
                        nativeCurrency = "ETH",
                        symbol = "ETH"
                    )
                    _events.tryEmit(MultiChainEvent.ChainAdded(chain))
                }
            }

            // Set active chain from first account
            accountChains.firstOrNull()?.let {
                _activeChain.value = it
            }
        }

        // Listen for chain change events from WC
        // (Handled via WCEvent.SessionUpdate)
    }

    /**
     * Switch the active chain.
     * Sends wallet_switchEthereumChain via WC if needed.
     */
    suspend fun switchToChain(chain: Caip2Chain): Result<Unit> {
        if (chain == _activeChain.value) return Result.success(Unit)

        val isSupported = _supportedChains.value.any { it.chain.id == chain.id }
        if (!isSupported) {
            _events.tryEmit(MultiChainEvent.Error("Chain ${chain.id} not in supported chains"))
            return Result.failure(IllegalStateException("Chain ${chain.id} not supported"))
        }

        _isSwitching.value = true

        return runCatching {
            // For EVM chains, use wallet_switchEthereumChain
            if (chain.namespace == "eip155") {
                val chainId = chain.reference.toIntOrNull()
                    ?: throw IllegalArgumentException("Invalid EVM chain reference: ${chain.reference}")
                wcClient.switchChain(chainId)
            }
            // For non-EVM chains, the namespace change is implicit in the WC session

            val oldChain = _activeChain.value
            _activeChain.value = chain
            _isSwitching.value = false

            _events.emit(MultiChainEvent.ChainChanged(chain, oldChain))

            // Fetch balance for the new chain
            fetchBalance(chain)

            Result.success(Unit)
        }.onFailure {
            _isSwitching.value = false
            _events.tryEmit(MultiChainEvent.Error("Chain switch failed: ${it.message}"))
        }
    }

    /**
     * Switch to chain by integer chain ID (EVM convenience).
     */
    suspend fun switchToChain(chainId: Int): Result<Unit> {
        return switchToChain(Caip2Chain("eip155", chainId.toString()))
    }

    /**
     * Fetch native balance for a specific chain.
     */
    suspend fun fetchBalance(chain: Caip2Chain): String {
        return runCatching {
            if (chain.namespace == "eip155") {
                val balanceHex = wcClient.request(
                    method = WCMethods.ETH_GET_BALANCE,
                    params = org.json.JSONArray().apply {
                        val address = extractAddress()
                        put(address)
                        put("latest")
                    }
                ).getString("result")

                val wei = balanceHex.removePrefix("0x").toBigInteger(16)
                val eth = BigDecimal(wei).divide(WEI_PER_ETH, 4, RoundingMode.HALF_UP)
                val balanceStr = eth.toPlainString()

                val currentBalances = _balances.value.toMutableMap()
                currentBalances[chain] = balanceStr
                _balances.value = currentBalances

                _events.tryEmit(MultiChainEvent.BalanceUpdated(chain, balanceStr))
                balanceStr
            } else {
                // Non-EVM chains: return cached or zero
                _balances.value[chain] ?: "0.0000"
            }
        }.getOrDefault("0.0000")
    }

    /**
     * Fetch balances for all supported chains (aggregation).
     */
    suspend fun fetchAllBalances(): Map<Caip2Chain, String> {
        val result = mutableMapOf<Caip2Chain, String>()
        _supportedChains.value.forEach { chainInfo ->
            result[chainInfo.chain] = fetchBalance(chainInfo.chain)
        }
        return result
    }

    /**
     * Get the total portfolio value approximation in USD.
     * Uses the provided price map (chain → price per token in USD).
     */
    fun getTotalUsdValue(prices: Map<Caip2Chain, BigDecimal>): BigDecimal {
        return _balances.value.entries.fold(BigDecimal.ZERO) { total, (chain, balance) ->
            val price = prices[chain] ?: return@fold total
            val amount = balance.toBigDecimalOrNull() ?: return@fold total
            total + (amount * price)
        }
    }

    /**
     * Add a chain to the supported chains registry.
     */
    fun addSupportedChain(chainInfo: ChainInfo) {
        val current = _supportedChains.value.toMutableList()
        if (current.none { it.chain.id == chainInfo.chain.id }) {
            current.add(chainInfo)
            _supportedChains.value = current
            _events.tryEmit(MultiChainEvent.ChainAdded(chainInfo.chain))
        }
    }

    /**
     * Get ChainInfo for a CAIP-2 chain.
     */
    fun getChainInfo(chain: Caip2Chain): ChainInfo? =
        _supportedChains.value.find { it.chain.id == chain.id }

    // ─── Private Helpers ────────────────────────────────────────────────

    private fun extractAddress(): String =
        wcClient.session.value?.accounts?.firstOrNull()
            ?.substringAfterLast(":")
            ?: ""

    /**
     * Build a CAIP-10 account string from address and chain.
     */
    fun buildCaip10(address: String, chain: Caip2Chain): String =
        "${chain.id}:${address.lowercase()}"
}
