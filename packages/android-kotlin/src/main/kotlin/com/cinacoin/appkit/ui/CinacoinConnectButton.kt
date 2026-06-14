package com.cinacoin.appkit.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.cinacoin.appkit.config.CinacoinTheme

/**
 * Cinacoin branded connect wallet button
 */
@Composable
fun CinacoinConnectButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    style: ButtonStyle = ButtonStyle.Default,
    theme: CinacoinTheme = if (isSystemInDarkTheme()) CinacoinTheme.Dark else CinacoinTheme.Light
) {
    val backgroundColor = when (style) {
        ButtonStyle.Default -> theme.primary
        ButtonStyle.Outline, ButtonStyle.Minimal -> Color.Transparent
    }
    
    val contentColor = when (style) {
        ButtonStyle.Default -> Color.White
        ButtonStyle.Outline, ButtonStyle.Minimal -> theme.text
    }
    
    val border = when (style) {
        ButtonStyle.Outline -> BorderStroke(1.dp, theme.border)
        else -> null
    }
    
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = backgroundColor,
            contentColor = contentColor
        ),
        shape = RoundedCornerShape(12.dp),
        border = border,
        elevation = null
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.AccountBalanceWallet,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Connect Wallet",
                style = androidx.compose.material3.MaterialTheme.typography.labelLarge
            )
        }
    }
}

enum class ButtonStyle {
    Default, Outline, Minimal
}

@androidx.compose.runtime.Composable
private fun isSystemInDarkTheme(): Boolean {
    return androidx.compose.foundation.isSystemInDarkTheme()
}
