package com.cinacoin.appkit.config

/**
 * Recommended wallet configuration
 */
data class WalletConfig(
    val id: String,
    val name: String,
    val iconUrl: String? = null,
    val universalLink: String? = null,
    val deepLink: String? = null
)

/**
 * Registry of recommended wallets for Cinacoin
 */
object WalletRegistry {
    
    /**
     * Recommended wallets
     */
    val recommended: List<WalletConfig> = listOf(
        WalletConfig(
            id = "metamask",
            name = "MetaMask",
            iconUrl = "https://registry.walletconnect.com/v2/logo/lg/0x1234",
            universalLink = "https://metamask.app.link",
            deepLink = "metamask://"
        ),
        WalletConfig(
            id = "rainbow",
            name = "Rainbow",
            iconUrl = "https://registry.walletconnect.com/v2/logo/lg/0x5678",
            universalLink = "https://rainbow.link",
            deepLink = "rainbow://"
        ),
        WalletConfig(
            id = "trust",
            name = "Trust Wallet",
            iconUrl = "https://registry.walletconnect.com/v2/logo/lg/0x9abc",
            universalLink = "https://link.trustwallet.com",
            deepLink = "trust://"
        ),
        WalletConfig(
            id = "coinbase",
            name = "Coinbase Wallet",
            iconUrl = "https://registry.walletconnect.com/v2/logo/lg/0xdef0",
            universalLink = "https://go.cb-w.com",
            deepLink = "cbwallet://"
        )
    )
    
    /**
     * Get wallet by ID
     */
    fun getWallet(id: String): WalletConfig? =
        recommended.firstOrNull { it.id == id }
    
    /**
     * Check if wallet is recommended
     */
    fun isRecommended(id: String): Boolean =
        recommended.any { it.id == id }
}
