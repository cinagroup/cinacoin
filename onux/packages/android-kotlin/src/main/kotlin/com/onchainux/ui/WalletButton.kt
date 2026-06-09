/**
 * WalletButton.kt — Individual wallet button for Jetpack Compose.
 *
 * Shows a wallet icon, name, installed status badge, and connect
 * callback. Supports dark/light theme via CinacoinTheme.
 *
 * ## Usage
 * ```kotlin
 * WalletButton(
 *     wallet = ConnectorInfo("metamask", "MetaMask", type = ConnectorType.WALLETCONNECT),
 *     installed = true,
 *     onClick = { /* open wallet */ },
 *     onConnect = { /* connect */ }
 * )
 * ```
 */
package com.cinacoin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cinacoin.core.ConnectorInfo
import com.cinacoin.core.ConnectorType

/**
 * Individual wallet button with icon, name, and status badge.
 *
 * @param wallet Connector information to display
 * @param installed Whether the wallet app is installed on device
 * @param selected Whether this wallet is currently selected
 * @param onClick Called when the button is tapped
 * @param onConnect Called to initiate connection flow
 */
@Composable
fun WalletButton(
    wallet: ConnectorInfo,
    installed: Boolean = false,
    selected: Boolean = false,
    onClick: () -> Unit = {},
    onConnect: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors
    var isPressed by remember { mutableStateOf(false) }

    val isWcType = wallet.type == ConnectorType.WALLETCONNECT ||
            wallet.type == ConnectorType.COINBASE ||
            wallet.type == ConnectorType.DEEP_LINK

    Card(
        modifier = modifier
            .width(140.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(
                onClick = {
                    isPressed = true
                    if (isWcType) {
                        onConnect()
                    } else {
                        onClick()
                    }
                }
            ),
        colors = CardDefaults.cardColors(
            containerColor = when {
                selected -> colors.accent.copy(alpha = 0.12f)
                isPressed -> colors.surfaceCardHover
                else -> colors.surfaceCard
            }
        ),
        shape = RoundedCornerShape(16.dp),
        border = if (selected) {
            CardDefaults.outlinedCardBorder().copy(width = 2.dp, color = colors.accent)
        } else {
            null
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Wallet icon
            WalletIcon(walletId = wallet.id, size = 48.dp)

            Spacer(modifier = Modifier.height(10.dp))

            // Wallet name
            Text(
                text = wallet.name,
                style = CinacoinTheme.typography.labelLarge,
                color = colors.textPrimary,
                textAlign = TextAlign.Center,
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Status badge
            when {
                selected -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Connected",
                            tint = colors.accent,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "Connected",
                            style = CinacoinTheme.typography.labelSmall,
                            color = colors.accent
                        )
                    }
                }
                installed -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(colors.success, shape = androidx.compose.foundation.shape.CircleShape)
                        )
                        Text(
                            text = "Installed",
                            style = CinacoinTheme.typography.labelSmall,
                            color = colors.success
                        )
                    }
                }
                else -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Download,
                            contentDescription = "Not installed",
                            tint = colors.textTertiary,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = "Get",
                            style = CinacoinTheme.typography.labelSmall,
                            color = colors.textTertiary
                        )
                    }
                }
            }
        }
    }
}

/**
 * Displays a wallet icon based on wallet ID.
 * Uses emoji placeholders; in production, replace with real icon assets.
 */
@Composable
private fun WalletIcon(walletId: String, size: androidx.compose.ui.unit.Dp) {
    val colors = CinacoinTheme.colors

    val (emoji, bgColor) = when (walletId.lowercase()) {
        "metamask" -> "🦊" to Color(0xFFFFF0E0)
        "walletconnect" -> "🔗" to Color(0xFFE0F0FF)
        "coinbase" -> "🔵" to Color(0xFFE0E8FF)
        "rainbow" -> "🌈" to Color(0xFFFFF0F5)
        "trust" -> "🛡️" to Color(0xFFE0FFE8)
        "phantom" -> "👻" to Color(0xFFE8E0FF)
        "email" -> "✉️" to Color(0xFFFFF8E0)
        else -> "💼" to colors.surface
    }

    Box(
        modifier = Modifier
            .size(size)
            .background(bgColor, shape = RoundedCornerShape(14.dp))
            .border(
                width = 1.dp,
                color = colors.border.copy(alpha = 0.3f),
                shape = RoundedCornerShape(14.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = emoji,
            fontSize = (size.value * 0.5).sp
        )
    }
}
