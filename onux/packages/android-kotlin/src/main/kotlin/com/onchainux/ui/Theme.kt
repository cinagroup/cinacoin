/**
 * Theme.kt — Cinacoin design system for Jetpack Compose.
 *
 * Provides a unified `CinacoinTheme` object with dark/light theme
 * support, typography scales, shape defaults, and a custom brand
 * color (#3B82F6 blue).
 *
 * ## Usage
 * ```kotlin
 * CinacoinTheme {
 *     Surface { /* app content */ }
 * }
 *
 * // Access tokens directly
 * val colors = CinacoinTheme.colors
 * val typography = CinacoinTheme.typography
 * ```
 */
package com.cinacoin.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─── Brand Color ────────────────────────────────────────────────────────────

/** Cinacoin brand accent — Tailwind blue-500. */
val CinacoinBrandColor = Color(0xFF3B82F6)
val CinacoinBrandColorDark = Color(0xFF2563EB)
val CinacoinBrandColorLight = Color(0xFF60A5FA)

// ─── Extended Color Palette ─────────────────────────────────────────────────

@Immutable
data class CinacoinColors(
    val accent: Color = CinacoinBrandColor,
    val accentSecondary: Color = CinacoinBrandColorLight,
    val accentGlow: Color = Color(0x4C3B82F6),
    val background: Color = Color(0xFF0F172A),
    val surface: Color = Color(0xFF111827),
    val surfaceCard: Color = Color(0xFF1E293B),
    val surfaceCardHover: Color = Color(0xFF334155),
    val textPrimary: Color = Color(0xFFF8FAFC),
    val textSecondary: Color = Color(0xFF94A3B8),
    val textTertiary: Color = Color(0xFF64748B),
    val border: Color = Color(0xFF334155),
    val borderLight: Color = Color(0x33FFFFFF),
    val success: Color = Color(0xFF22C55E),
    val warning: Color = Color(0xFFEAB308),
    val error: Color = Color(0xFFEF4444),
    val info: Color = Color(0xFF3B82F6),
    val overlay: Color = Color(0x99000000)
) {
    companion object {
        val Light = CinacoinColors(
            accent = CinacoinBrandColorDark,
            accentSecondary = CinacoinBrandColor,
            accentGlow = Color(0x262563EB),
            background = Color(0xFFFFFFFF),
            surface = Color(0xFFF8FAFC),
            surfaceCard = Color(0xFFF8FAFC),
            surfaceCardHover = Color(0xFFF1F5F9),
            textPrimary = Color(0xFF0F172A),
            textSecondary = Color(0xFF64748B),
            textTertiary = Color(0xFF94A3B8),
            border = Color(0xFFE2E8F0),
            borderLight = Color(0x1A000000),
            success = Color(0xFF16A34A),
            warning = Color(0xFFCA8A04),
            error = Color(0xFFDC2626),
            info = CinacoinBrandColorDark,
            overlay = Color(0x66000000)
        )
    }
}

// ─── Typography ─────────────────────────────────────────────────────────────

val CinacoinTypography = Typography(
    displayLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = (-1).sp
    ),
    displayMedium = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = (-0.5).sp
    ),
    headlineLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 28.sp
    ),
    headlineMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp
    ),
    titleLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    bodySmall = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp
    ),
    labelLarge = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    labelMedium = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        lineHeight = 14.sp
    )
)

// ─── CompositionLocal ───────────────────────────────────────────────────────

private val LocalCinacoinColors = staticCompositionLocalOf { CinacoinColors() }
private val LocalCinacoinTypography = staticCompositionLocalOf { CinacoinTypography }

// ─── Theme Object ───────────────────────────────────────────────────────────

object CinacoinTheme {
    val colors: CinacoinColors
        @Composable get() = LocalCinacoinColors.current

    val typography: Typography
        @Composable get() = LocalCinacoinTypography.current
}

// ─── Theme Composable ───────────────────────────────────────────────────────

@Composable
fun CinacoinTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = CinacoinBrandColor,
            secondary = CinacoinBrandColorLight,
            background = CinacoinColors().background,
            surface = CinacoinColors().surface,
            onPrimary = Color.White,
            onBackground = CinacoinColors().textPrimary,
            onSurface = CinacoinColors().textPrimary,
            error = CinacoinColors().error
        )
    } else {
        lightColorScheme(
            primary = CinacoinBrandColorDark,
            secondary = CinacoinBrandColor,
            background = CinacoinColors.Light.background,
            surface = CinacoinColors.Light.surface,
            onPrimary = Color.White,
            onBackground = CinacoinColors.Light.textPrimary,
            onSurface = CinacoinColors.Light.textPrimary,
            error = CinacoinColors.Light.error
        )
    }

    val cinacoinColors = if (darkTheme) CinacoinColors() else CinacoinColors.Light

    CompositionLocalProvider(
        LocalCinacoinColors provides cinacoinColors,
        LocalCinacoinTypography provides CinacoinTypography
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = CinacoinTypography,
            content = content
        )
    }
}
