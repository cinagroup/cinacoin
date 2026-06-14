package com.cinacoin.appkit.config

import com.cinacoin.appkit.config.model.ChainConfig

/**
 * Centralized chain configuration for Cinacoin SDKs.
 * Aligned with Web SDK chain registry.
 */
object ChainRegistry {
    
    // MARK: - Well-known EVM Chains
    
    val ethereum = ChainConfig(
        chainId = 1,
        name = "Ethereum",
        shortName = "eth",
        symbol = "ETH",
        rpcUrl = "https://eth.llamarpc.com",
        explorerUrl = "https://etherscan.io",
        iconUrl = "https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg"
    )
    
    val polygon = ChainConfig(
        chainId = 137,
        name = "Polygon",
        shortName = "matic",
        symbol = "MATIC",
        rpcUrl = "https://polygon-rpc.com",
        explorerUrl = "https://polygonscan.com",
        iconUrl = "https://icons.llamao.fi/icons/chains/rsz_polygon.jpg"
    )
    
    val arbitrum = ChainConfig(
        chainId = 42161,
        name = "Arbitrum One",
        shortName = "arb",
        symbol = "ETH",
        rpcUrl = "https://arb1.arbitrum.io/rpc",
        explorerUrl = "https://arbiscan.io",
        iconUrl = "https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg"
    )
    
    val optimism = ChainConfig(
        chainId = 10,
        name = "Optimism",
        shortName = "op",
        symbol = "ETH",
        rpcUrl = "https://mainnet.optimism.io",
        explorerUrl = "https://optimistic.etherscan.io",
        iconUrl = "https://icons.llamao.fi/icons/chains/rsz_optimism.jpg"
    )
    
    val base = ChainConfig(
        chainId = 8453,
        name = "Base",
        shortName = "base",
        symbol = "ETH",
        rpcUrl = "https://mainnet.base.org",
        explorerUrl = "https://basescan.org",
        iconUrl = "https://icons.llamao.fi/icons/chains/rsz_base.jpg"
    )
    
    val bsc = ChainConfig(
        chainId = 56,
        name = "BNB Smart Chain",
        shortName = "bsc",
        symbol = "BNB",
        rpcUrl = "https://bsc-dataseed.binance.org",
        explorerUrl = "https://bscscan.com",
        iconUrl = "https://icons.llamao.fi/icons/chains/rsz_bsc.jpg"
    )
    
    val avalanche = ChainConfig(
        chainId = 43114,
        name = "Avalanche C-Chain",
        shortName = "avax",
        symbol = "AVAX",
        rpcUrl = "https://api.avax.network/ext/bc/C/rpc",
        explorerUrl = "https://snowtrace.io",
        iconUrl = "https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg"
    )
    
    /**
     * All supported EVM chains
     */
    val allEVMChains: List<ChainConfig> = listOf(
        ethereum, polygon, arbitrum, optimism, base, bsc, avalanche
    )
    
    /**
     * Lookup chain by chain ID
     */
    fun getChain(chainId: Int): ChainConfig? =
        allEVMChains.firstOrNull { it.chainId == chainId }
    
    /**
     * Get CAIP-2 namespace string
     */
    fun namespaceString(chainId: Int): String = "eip155:$chainId"
}
