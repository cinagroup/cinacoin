/**
 * TransactionToast.kt — Animated toast notification for transaction states.
 *
 * Shows pending, success, or failed transaction states with color-coded
 * indicators, links to block explorer, and auto-dismiss with configurable
 * timeout.
 *
 * ## Usage
 * ```kotlin
 * TransactionToast(
 *     txHash = "0x123abc...",
 *     status = TxStatus.PENDING,
 *     chainId = 1,
 *     onDismiss = { showToast = false },
 *     autoDismissMs = 5000
 * )
 * ```
 */
package com.cinacoin.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.cinacoin.sdk.ChainConfig
import com.cinacoin.sdk.TxStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Animated transaction toast notification.
 *
 * @param txHash Transaction hash to display
 * @param status Current transaction status
 * @param chainId Chain ID for block explorer link
 * @param onDismiss Dismiss callback
 * @param autoDismissMs Auto-dismiss timeout in ms (0 = disabled)
 * @param chains List of chain configs for explorer URL lookup
 */
@Composable
fun TransactionToast(
    txHash: String,
    status: TxStatus,
    chainId: Int,
    onDismiss: () -> Unit,
    autoDismissMs: Long = 5000,
    chains: List<ChainConfig> = ChainConfig.defaults,
    modifier: Modifier = Modifier
) {
    val scope = rememberCoroutineScope()
    val colors = CinacoinTheme.colors

    // Auto-dismiss timer
    LaunchedEffect(txHash, status) {
        if (autoDismissMs > 0 && status != TxStatus.PENDING) {
            delay(autoDismissMs)
            onDismiss()
        }
    }

    val icon = when (status) {
        TxStatus.PENDING -> Icons.Default.Schedule
        TxStatus.CONFIRMED -> Icons.Default.CheckCircle
        TxStatus.FAILED -> Icons.Default.Error
    }

    val statusColor = when (status) {
        TxStatus.PENDING -> colors.warning
        TxStatus.CONFIRMED -> colors.success
        TxStatus.FAILED -> colors.error
    }

    val statusLabel = when (status) {
        TxStatus.PENDING -> "Pending..."
        TxStatus.CONFIRMED -> "Confirmed"
        TxStatus.FAILED -> "Failed"
    }

    val explorerUrl = buildExplorerUrl(txHash, chainId, chains)

    // Animated entrance/exit
    AnimatedVisibility(
        visible = true,
        enter = slideInVertically(
            animationSpec = tween(300, easing = FastOutSlowInEasing),
            initialOffsetY = { -it }
        ) + fadeIn(tween(300)),
        exit = slideOutVertically(
            animationSpec = tween(200, easing = FastOutSlowInEasing),
            targetOffsetY = { -it }
        ) + fadeOut(tween(200)),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = colors.surfaceCard,
            tonalElevation = 8.dp
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Status icon with glow
                    Box(
                        contentAlignment = Alignment.Center
                    ) {
                        if (status == TxStatus.PENDING) {
                            // Pulsing ring for pending
                            val transition = rememberInfiniteTransition(label = "pulse")
                            val scale by transition.animateFloat(
                                initialValue = 0.8f,
                                targetValue = 1.2f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(1000, easing = FastOutSlowInEasing),
                                    repeatMode = RepeatMode.Reverse
                                ),
                                label = "pulseScale"
                            )
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .scale(scale)
                                    .background(
                                        Color(statusColor).copy(alpha = 0.15f),
                                        shape = androidx.compose.foundation.shape.CircleShape
                                    )
                            )
                        }

                        Icon(
                            imageVector = icon,
                            contentDescription = statusLabel,
                            tint = Color(statusColor),
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    // Status text and hash
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = statusLabel,
                            style = CinacoinTheme.typography.labelLarge,
                            color = Color(statusColor),
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = truncateHash(txHash),
                            style = CinacoinTheme.typography.bodySmall,
                            color = colors.textSecondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Close button
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Dismiss",
                            tint = colors.textTertiary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                // Action buttons (view on explorer / retry)
                if (status != TxStatus.PENDING) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (explorerUrl != null) {
                            OutlinedButton(
                                onClick = {
                                    openUrl(LocalContext.current, explorerUrl)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(vertical = 8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.OpenInNew,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "View on Explorer",
                                    style = CinacoinTheme.typography.labelMedium
                                )
                            }
                        }

                        if (status == TxStatus.FAILED) {
                            Button(
                                onClick = { /* retry callback */ },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(vertical = 8.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(statusColor)
                                )
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Retry",
                                    style = CinacoinTheme.typography.labelMedium
                                )
                            }
                        }
                    }
                }

                // Progress indicator for pending state
                if (status == TxStatus.PENDING) {
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { 1f }, // Infinite spinner
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(3.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = Color(colors.warning)
                    )
                }
            }
        }
    }
}

/**
 * Build block explorer URL for a transaction hash.
 */
private fun buildExplorerUrl(
    txHash: String,
    chainId: Int,
    chains: List<ChainConfig>
): String? {
    val chain = chains.find { it.id == chainId } ?: return null
    val baseUrl = chain.blockExplorerUrl ?: return null
    return "$baseUrl/tx/$txHash"
}

/**
 * Open a URL in the default browser.
 */
private fun openUrl(context: android.content.Context, url: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
}

/**
 * Truncate a transaction hash for display.
 */
private fun truncateHash(hash: String, prefix: Int = 10, suffix: Int = 6): String {
    if (hash.length <= prefix + suffix) return hash
    return "${hash.take(prefix)}…${hash.takeLast(suffix)}"
}
