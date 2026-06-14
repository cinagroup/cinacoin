package com.cinacoin.appkit.config

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp

/**
 * Cinacoin brand theme configuration
 */
data class CinacoinTheme(
    val primary: Color,
    val secondary: Color,
    val background: Color,
    val surface: Color,
    val text: Color,
    val textSecondary: Color,
    val border: Color,
    val error: Color,
    val success: Color,
    val typography: Typography = Typography.Default,
    val spacing: Spacing = Spacing.Default,
    val borderRadius: BorderRadius = BorderRadius.Default
) {
    data class Typography(
        val small: TextUnit,
        val medium: TextUnit,
        val large: TextUnit,
        val xlarge: TextUnit
    ) {
        companion object {
            val Default = Typography(
                small = 12.sp,
                medium = 14.sp,
                large = 16.sp,
                xlarge = 20.sp
            )
        }
    }
    
    data class Spacing(
        val xs: androidx.compose.ui.unit.Dp,
        val sm: androidx.compose.ui.unit.Dp,
        val md: androidx.compose.ui.unit.Dp,
        val lg: androidx.compose.ui.unit.Dp,
        val xl: androidx.compose.ui.unit.Dp
    ) {
        companion object {
            val Default = Spacing(
                xs = 4.dp,
                sm = 8.dp,
                md = 16.dp,
                lg = 24.dp,
                xl = 32.dp
            )
        }
    }
    
    data class BorderRadius(
        val small: androidx.compose.ui.unit.Dp,
        val medium: androidx.compose.ui.unit.Dp,
        val large: androidx.compose.ui.unit.Dp
    ) {
        companion object {
            val Default = BorderRadius(
                small = 4.dp,
                medium = 8.dp,
                large = 12.dp
            )
        }
    }
    
    companion object {
        val Dark = CinacoinTheme(
            primary = Color(0xFF0070F3),
            secondary = Color(0xFF6366F1),
            background = Color(0xFF000000),
            surface = Color(0xFF141414),
            text = Color(0xFFFFFFFF),
            textSecondary = Color(0xFFA1A1AA),
            border = Color(0xFF27272A),
            error = Color(0xFFEF4444),
            success = Color(0xFF22C55E)
        )
        
        val Light = CinacoinTheme(
            primary = Color(0xFF0070F3),
            secondary = Color(0xFF6366F1),
            background = Color(0xFFFFFFFF),
            surface = Color(0xFFF4F4F5),
            text = Color(0xFF000000),
            textSecondary = Color(0xFF71717A),
            border = Color(0xFFE4E4E7),
            error = Color(0xFFEF4444),
            success = Color(0xFF22C55E)
        )
    }
}
