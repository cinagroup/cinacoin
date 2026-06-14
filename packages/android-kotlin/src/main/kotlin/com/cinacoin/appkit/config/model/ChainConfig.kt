package com.cinacoin.appkit.config.model

/**
 * Chain configuration data class
 */
data class ChainConfig(
    val chainId: Int,
    val name: String,
    val shortName: String,
    val symbol: String,
    val decimals: Int = 18,
    val rpcUrl: String,
    val explorerUrl: String,
    val iconUrl: String? = null,
    val testnet: Boolean = false
) {
    /**
     * Get CAIP-2 namespace string (e.g., "eip155:1")
     */
    fun toNamespaceString(): String = "eip155:$chainId"
}
