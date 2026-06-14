package com.cinacoin.appkit.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import com.cinacoin.appkit.config.CinacoinTheme as CinacoinBrandTheme

/**
 * Compose theme wrapper for Cinacoin brand
 */
object CinacoinComposeTheme {
    
    private val DarkColorScheme = darkColorScheme(
        primary = CinacoinBrandTheme.Dark.primary,
        secondary = CinacoinBrandTheme.Dark.secondary,
        background = CinacoinBrandTheme.Dark.background,
        surface = CinacoinBrandTheme.Dark.surface,
        onPrimary = androidx.compose.ui.graphics.Color.White,
        onBackground = CinacoinBrandTheme.Dark.text,
        onSurface = CinacoinBrandTheme.Dark.text,
    )
    
    private val LightColorScheme = lightColorScheme(
        primary = CinacoinBrandTheme.Light.primary,
        secondary = CinacoinBrandTheme.Light.secondary,
        background = CinacoinBrandTheme.Light.background,
        surface = CinacoinBrandTheme.Light.surface,
        onPrimary = androidx.compose.ui.graphics.Color.White,
        onBackground = CinacoinBrandTheme.Light.text,
        onSurface = CinacoinBrandTheme.Light.text,
    )
    
    @Composable
    fun CinacoinTheme(
        darkTheme: Boolean = androidx.compose.foundation.isSystemInDarkTheme(),
        content: @Composable () -> Unit
    ) {
        val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
        
        MaterialTheme(
            colorScheme = colorScheme,
            content = content
        )
    }
}
