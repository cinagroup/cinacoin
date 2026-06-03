/**
 * AccountModal.kt — Jetpack Compose modal showing connected account info.
 *
 * Displays address, balance, ENS name, network info, and provides
 * actions for copying the address and disconnecting. Uses StateFlow
 * from WalletManager for reactive state updates.
 *
 * ## Usage
 * ```kotlin
 * var showAccountModal by remember { mutableStateOf(false) }
 *
 * ConnectButton { showAccountModal = true }
 *
 * if (showAccountModal) {
 *     AccountModal(
 *         onDismiss = { showAccountModal = false },
 *         onDisconnect = { /* cleanup */ }
 *     )
 * }
 * ```
 */
package com.cinacoin.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.cinacoin.core.AccountInfo
import com.cinacoin.core.ChainConfig
import com.cinacoin.core.ConnectionStatus
import com.cinacoin.core.Cinacoin
import com.cinacoin.sdk.ChainConfig as SdkChainConfig
import kotlinx.coroutines.launch

/**
 * Full account details modal.
 */
@Composable
fun AccountModal(
    onDismiss: () -> Unit,
    onDisconnect: () -> Unit = {},
    onChainUX: Cinacoin = Cinacoin.getInstance(),
    chains: List<ChainConfig> = emptyList(),
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val status by onChainUX.status.collectAsState()
    val account by onChainUX.account.collectAsState()
    val activeChainId by onChainUX.activeChainId.collectAsState()

    if (account == null) {
        onDismiss()
        return
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.overlay)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onDismiss
                ),
            contentAlignment = Alignment.BottomCenter
        ) {
            AnimatedVisibility(
                visible = true,
                enter = slideInVertically(
                    animationSpec = tween(300),
                    initialOffsetY = { it / 4 }
                ) + fadeIn(tween(300)),
                exit = slideOutVertically(
                    animationSpec = tween(200),
                    targetOffsetY = { it / 4 }
                ) + fadeOut(tween(200))
            ) {
                Surface(
                    modifier = modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)),
                    color = colors.surfaceCard,
                    tonalElevation = 16.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .verticalScroll(rememberScrollState())
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Close handle
                        Box(
                            modifier = Modifier
                                .width(40.dp)
                                .height(4.dp)
                                .background(colors.borderLight, RoundedCornerShape(2.dp))
                        )
                        Spacer(modifier = Modifier.height(20.dp))

                        // Avatar + Address header
                        AccountHeader(account = account!!, colors = colors)

                        Spacer(modifier = Modifier.height(24.dp))

                        // Balance card
                        BalanceCard(
                            account = account!!,
                            colors = colors
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Action buttons
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Copy address
                            ActionButton(
                                icon = Icons.Default.ContentCopy,
                                label = "Copy Address",
                                subtitle = truncateAddress(account!!.address)
                            ) {
                                copyToClipboard(context, account!!.address)
                                Toast.makeText(
                                    context,
                                    "Address copied!",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }

                            // ENS name (if available)
                            if (account!!.ensName != null) {
                                ActionButton(
                                    icon = Icons.Default.AccountCircle,
                                    label = "ENS Name",
                                    subtitle = account!!.ensName!!
                                ) {
                                    copyToClipboard(context, account!!.ensName!!)
                                    Toast.makeText(
                                        context,
                                        "ENS name copied!",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                            }

                            // Network info
                            val activeChain = chains.find { it.chainId == activeChainId }
                            if (activeChain != null) {
                                ActionButton(
                                    icon = Icons.Default.Language,
                                    label = "Network",
                                    subtitle = "${activeChain.name} (Chain ID: ${activeChain.chainId})"
                                ) {}
                            }

                            // Connection status
                            val statusText = when (status) {
                                is ConnectionStatus.CONNECTED -> "Connected"
                                is ConnectionStatus.CONNECTING -> "Connecting..."
                                is ConnectionStatus.ERROR -> (status as ConnectionStatus.ERROR).message
                                else -> "Disconnected"
                            }
                            ActionButton(
                                icon = when (status) {
                                    is ConnectionStatus.CONNECTED -> Icons.Default.CheckCircle
                                    is ConnectionStatus.ERROR -> Icons.Default.Error
                                    else -> Icons.Default.Info
                                },
                                label = "Status",
                                subtitle = statusText
                            ) {}
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Disconnect button
                        DisconnectButton(
                            onConfirm = {
                                scope.launch {
                                    onChainUX.disconnect()
                                    onDisconnect()
                                    onDismiss()
                                }
                            },
                            colors = colors
                        )

                        // Bottom padding for safe area
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}

/**
 * Account header with avatar gradient and truncated address.
 */
@Composable
private fun AccountHeader(account: AccountInfo, colors: CinacoinColors) {
    // Gradient avatar
    Box(
        modifier = Modifier
            .size(72.dp)
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        CinacoinBrandColor,
                        CinacoinBrandColorLight,
                        Color(0xFF818CF8)
                    )
                ),
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "🔢",
            fontSize = 28.sp
        )
    }

    Spacer(modifier = Modifier.height(12.dp))

    // ENS name or address
    Text(
        text = account.ensName ?: truncateAddress(account.address),
        style = CinacoinTheme.typography.headlineLarge,
        color = colors.textPrimary,
        textAlign = TextAlign.Center,
        fontWeight = FontWeight.SemiBold
    )

    if (account.ensName != null) {
        Text(
            text = truncateAddress(account.address),
            style = CinacoinTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Balance display card with large formatted amount.
 */
@Composable
private fun BalanceCard(account: AccountInfo, colors: CinacoinColors) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colors.surface
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Balance",
                style = CinacoinTheme.typography.bodyMedium,
                color = colors.textSecondary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = account.balance,
                style = CinacoinTheme.typography.displayMedium,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = account.chainSymbol,
                style = CinacoinTheme.typography.labelLarge,
                color = colors.accent
            )
        }
    }
}

/**
 * Reusable action row with icon, label, and optional subtitle.
 */
@Composable
private fun ActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    subtitle: String,
    onClick: () -> Unit
) {
    val colors = CinacoinTheme.colors
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = colors.textSecondary,
            modifier = Modifier.size(22.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = CinacoinTheme.typography.labelLarge,
                color = colors.textPrimary
            )
            Text(
                text = subtitle,
                style = CinacoinTheme.typography.bodySmall,
                color = colors.textSecondary
            )
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = colors.textTertiary,
            modifier = Modifier.size(18.dp)
        )
    }
}

/**
 * Disconnect button with confirmation dialog.
 */
@Composable
private fun DisconnectButton(
    onConfirm: () -> Unit,
    colors: CinacoinColors
) {
    var showConfirm by remember { mutableStateOf(false) }

    Button(
        onClick = { showConfirm = true },
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(colors.error).copy(alpha = 0.15f),
            contentColor = Color(colors.error)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Icon(
            imageVector = Icons.Default.PowerSettingsNew,
            contentDescription = null,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = "Disconnect Wallet",
            style = CinacoinTheme.typography.labelLarge
        )
    }

    // Confirmation dialog
    if (showConfirm) {
        AlertDialog(
            onDismissRequest = { showConfirm = false },
            title = {
                Text(
                    text = "Disconnect Wallet?",
                    color = colors.textPrimary
                )
            },
            text = {
                Text(
                    text = "You will need to reconnect to use wallet features.",
                    color = colors.textSecondary
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    showConfirm = false
                    onConfirm()
                }) {
                    Text(
                        text = "Disconnect",
                        color = Color(colors.error),
                        fontWeight = FontWeight.SemiBold
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirm = false }) {
                    Text(
                        text = "Cancel",
                        color = colors.textSecondary
                    )
                }
            },
            containerColor = colors.surfaceCard
        )
    }
}

/**
 * Copy text to clipboard.
 */
private fun copyToClipboard(context: Context, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText("address", text))
}

/**
 * Truncate an Ethereum address for display.
 */
private fun truncateAddress(address: String, prefix: Int = 6, suffix: Int = 4): String {
    if (address.length <= prefix + suffix + 2) return address
    return "${address.substring(0, prefix + 2)}…${address.substring(address.length - suffix)}"
}
