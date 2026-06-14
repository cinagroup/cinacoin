package com.cinacoin.appkit.config

import com.cinacoin.appkit.config.model.ChainConfig

/**
 * Configuration for Cinacoin AppKit Android
 */
data class AppKitConfig(
    val projectId: String,
    val metadata: AppMetadata,
    val themeMode: ThemeMode = ThemeMode.DARK,
    val chains: List<ChainConfig> = ChainRegistry.allEVMChains,
    val recommendedWallets: List<String> = WalletRegistry.recommended.map { it.id },
    val enableAnalytics: Boolean = false,
    val enableEmail: Boolean = false,
    val enableSocials: Boolean = false
) {
    data class AppMetadata(
        val name: String,
        val description: String,
        val url: String,
        val icons: List<String> = emptyList()
    )
    
    enum class ThemeMode {
        LIGHT, DARK
    }
    
    /**
     * Get theme based on mode
     */
    val theme: CinacoinTheme
        get() = when (themeMode) {
            ThemeMode.LIGHT -> CinacoinTheme.Light
            ThemeMode.DARK -> CinacoinTheme.Dark
        }
}

/**
 * Main entry point for Cinacoin AppKit Android
 */
object CinacoinAppKit {
    
    private var _config: AppKitConfig? = null
    
    /**
     * Current configuration
     */
    val config: AppKitConfig?
        get() = _config
    
    /**
     * Configure Cinacoin AppKit
     */
    fun configure(config: AppKitConfig) {
        _config = config
    }
    
    /**
     * Reset configuration
     */
    fun reset() {
        _config = null
    }
}
