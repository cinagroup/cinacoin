/**
 * ChainManager.kt — Chain configuration and switching.
 *
 * Manages the list of supported chains, active chain state,
 * and chain-switching logic.
 */
package com.cinacoin.sdk

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class ChainManager {

    private val _supportedChains = MutableStateFlow<List<ChainConfig>>(emptyList())
    val supportedChains: StateFlow<List<ChainConfig>> = _supportedChains.asStateFlow()

    private val _activeChain = MutableStateFlow<ChainConfig?>(null)
    val activeChain: StateFlow<ChainConfig?> = _activeChain.asStateFlow()

    private val _switching = MutableStateFlow(false)
    val isSwitching: StateFlow<Boolean> = _switching.asStateFlow()

    /**
     * Set the list of supported chains.
     */
    fun setChains(chains: List<ChainConfig>) {
        require(chains.isNotEmpty()) { "At least one chain must be configured" }
        _supportedChains.value = chains
        _activeChain.value = chains.first()
    }

    /**
     * Get a chain config by ID.
     */
    fun getChain(chainId: Int): ChainConfig? =
        _supportedChains.value.find { it.id == chainId }

    /**
     * Switch to a chain by ID.
     *
     * @throws CinacoinError.ChainNotFound if the chain is not in the supported list.
     */
    suspend fun switchTo(chainId: Int) {
        val chain = getChain(chainId)
            ?: throw CinacoinError.ChainNotFound("Chain $chainId is not in the supported list. Available: ${_supportedChains.value.joinToString { it.name }}")

        _switching.value = true
        try {
            _activeChain.value = chain
        } finally {
            _switching.value = false
        }
    }

    /**
     * Check if a chain is supported.
     */
    fun isSupported(chainId: Int): Boolean =
        _supportedChains.value.any { it.id == chainId }

    /**
     * Get chain RPC URL.
     */
    fun getRpcUrl(chainId: Int): String {
        val chain = getChain(chainId)
            ?: throw CinacoinError.ChainNotFound("Chain $chainId not configured")
        return chain.rpcUrl
    }

    /**
     * Get the list of CAIP-2 chain refs, e.g. ["eip155:1", "eip155:137"].
     */
    fun getChainRefs(): List<String> =
        _supportedChains.value.map { it.chainRef }
}
