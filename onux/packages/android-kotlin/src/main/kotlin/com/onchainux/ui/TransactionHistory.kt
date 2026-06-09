/**
 * TransactionHistory.kt — Jetpack Compose lazy list of recent transactions.
 *
 * Displays a scrollable LazyColumn of transactions with status icons
 * (pending/success/failed), timestamp, and amount. Clicking a row
 * opens transaction details. Supports pagination for large history.
 *
 * ## Usage
 * ```kotlin
 * TransactionHistory(
 *     transactions = txList,
 *     onLoadMore = { /* fetch next page */ },
 *     hasMore = true,
 *     onTxClick = { tx -> /* view details */ }
 * )
 * ```
 */
package com.cinacoin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.cinacoin.sdk.TxStatus
import com.cinacoin.sdk.TransactionResult
import java.time.Instant
import java.time.format.DateTimeFormatter

/**
 * Transaction list with status, amount, and timestamp.
 *
 * @param transactions List of transaction results to display
 * @param onLoadMore Callback when user scrolls near the end (pagination)
 * @param hasMore Whether more transactions are available to load
 * @param onTxClick Called when a transaction row is tapped
 * @param chainSymbol Token symbol for amounts
 */
@Composable
fun TransactionHistory(
    transactions: List<TransactionResult>,
    onLoadMore: () -> Unit = {},
    hasMore: Boolean = false,
    onTxClick: (TransactionResult) -> Unit = {},
    chainSymbol: String = "ETH",
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors
    val listState = rememberLazyListState()

    // Detect scroll near bottom for pagination
    LaunchedEffect(listState) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo }
            .collect { visibleItems ->
                val lastVisible = visibleItems.lastOrNull()
                    ?: return@collect
                if (lastVisible.index >= transactions.size - 3 && hasMore) {
                    onLoadMore()
                }
            }
    }

    if (transactions.isEmpty()) {
        EmptyTransactionList(colors = colors, modifier = modifier)
        return
    }

    LazyColumn(
        state = listState,
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        items(
            items = transactions,
            key = { it.hash }
        ) { tx ->
            TransactionRow(
                transaction = tx,
                chainSymbol = chainSymbol,
                onClick = { onTxClick(tx) }
            )
        }

        // Load more indicator
        if (hasMore) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp,
                        color = colors.accent
                    )
                }
            }
        }
    }
}

/**
 * Single transaction row with status icon, hash, amount, and time.
 */
@Composable
private fun TransactionRow(
    transaction: TransactionResult,
    chainSymbol: String,
    onClick: () -> Unit
) {
    val colors = CinacoinTheme.colors
    var isHovered by remember { mutableStateOf(false) }

    val statusInfo = when (transaction.status()) {
        TxStatus.CONFIRMED -> Triple(Icons.Default.Check, colors.success, "Confirmed")
        TxStatus.FAILED -> Triple(Icons.Default.Close, colors.error, "Failed")
        TxStatus.PENDING -> Triple(Icons.Default.Schedule, colors.warning, "Pending")
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (isHovered) colors.surfaceCardHover else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Status icon
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(
                    statusInfo.second.copy(alpha = 0.15f),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = statusInfo.first,
                contentDescription = statusInfo.third,
                tint = statusInfo.second,
                modifier = Modifier.size(18.dp)
            )
        }

        // Transaction details
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = truncateHash(transaction.hash),
                style = CinacoinTheme.typography.labelLarge,
                color = colors.textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Confirmation count
                if (transaction.confirmations > 0) {
                    Text(
                        text = "${transaction.confirmations} conf",
                        style = CinacoinTheme.typography.labelSmall,
                        color = colors.textTertiary
                    )
                }
                // Timestamp
                Text(
                    text = formatTimeAgo(transaction.confirmedAt),
                    style = CinacoinTheme.typography.labelSmall,
                    color = colors.textTertiary
                )
            }
        }

        // Chain badge
        Text(
            text = chainSymbol,
            style = CinacoinTheme.typography.labelSmall,
            color = colors.accent,
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(colors.accent.copy(alpha = 0.1f))
                .padding(horizontal = 8.dp, vertical = 4.dp),
            fontWeight = FontWeight.Medium
        )
    }
}

/**
 * Placeholder when no transactions exist.
 */
@Composable
private fun EmptyTransactionList(colors: CinacoinColors, modifier: Modifier) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(48.dp, 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "📋",
            fontSize = 48.sp
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No transactions yet",
            style = CinacoinTheme.typography.titleLarge,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Your transaction history will appear here",
            style = CinacoinTheme.typography.bodyMedium,
            color = colors.textTertiary,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Extension to derive TxStatus from TransactionResult.
 */
private fun TransactionResult.status(): TxStatus = when {
    confirmedAt != null && confirmations > 0 -> TxStatus.CONFIRMED
    confirmations == 0 -> TxStatus.PENDING
    else -> TxStatus.FAILED
}

/**
 * Truncate a transaction hash.
 */
private fun truncateHash(hash: String, prefix: Int = 10, suffix: Int = 6): String {
    if (hash.length <= prefix + suffix) return hash
    return "${hash.take(prefix)}…${hash.takeLast(suffix)}"
}

/**
 * Format an Instant as a relative time string.
 */
private fun formatTimeAgo(instant: Instant?): String {
    if (instant == null) return "—"
    val now = Instant.now()
    val diffSeconds = now.epochSecond - instant.epochSecond

    return when {
        diffSeconds < 60 -> "Just now"
        diffSeconds < 3600 -> "${diffSeconds / 60}m ago"
        diffSeconds < 86400 -> "${diffSeconds / 3600}h ago"
        else -> {
            DateTimeFormatter.ofPattern("MMM d")
                .format(java.time.ZonedDateTime.ofInstant(instant, java.time.ZoneId.systemDefault()))
        }
    }
}
