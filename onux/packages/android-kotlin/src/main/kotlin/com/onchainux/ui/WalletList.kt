/**
 * WalletList.kt — Jetpack Compose grid of available wallets.
 *
 * Displays a LazyVerticalGrid of wallet options with icons, names,
 * and installed badges. Includes search/filter functionality and
 * connect callback.
 *
 * ## Usage
 * ```kotlin
 * WalletList(
 *     wallets = connectors,
 *     installedWallets = setOf("metamask"),
 *     onWalletConnect = { id -> /* connect */ },
 *     onWalletClick = { id -> /* details */ }
 * )
 * ```
 */
package com.cinacoin.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cinacoin.core.ConnectorInfo
import com.cinacoin.core.ConnectorType
import com.cinacoin.core.Cinacoin

/**
 * Scrollable grid of wallet options with search.
 *
 * @param wallets Full list of connector info items
 * @param installedWallets Set of wallet IDs that are installed on device
 * @param onWalletConnect Called when user taps to connect a wallet
 * @param onWalletClick Called when user taps a wallet for details
 * @param columns Number of grid columns
 */
@Composable
fun WalletList(
    wallets: List<ConnectorInfo>,
    installedWallets: Set<String> = emptySet(),
    onWalletConnect: (String) -> Unit = {},
    onWalletClick: (String) -> Unit = {},
    columns: Int = 3,
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors
    var searchQuery by remember { mutableStateOf("") }

    // Filter wallets by search query
    val filteredWallets = remember(searchQuery, wallets) {
        if (searchQuery.isBlank()) {
            wallets
        } else {
            wallets.filter { wallet ->
                wallet.name.contains(searchQuery, ignoreCase = true) ||
                    wallet.id.contains(searchQuery, ignoreCase = true)
            }
        }
    }

    // Sort: recommended wallets first, then installed, then others
    val sortedWallets = remember(filteredWallets, installedWallets) {
        filteredWallets.sortedWith(
            compareByDescending<ConnectorInfo> { it.id in installedWallets }
                .thenByDescending { it.type == ConnectorType.WALLETCONNECT }
        )
    }

    Column(modifier = modifier) {
        // Search bar
        WalletSearchBar(
            query = searchQuery,
            onQueryChange = { searchQuery = it },
            onClear = { searchQuery = "" },
            modifier = Modifier.padding(bottom = 16.dp)
        )

        if (sortedWallets.isEmpty()) {
            // No results
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No wallets found",
                    style = CinacoinTheme.typography.bodyMedium,
                    color = colors.textTertiary
                )
            }
        } else {
            // Wallet grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(columns),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 16.dp)
            ) {
                items(sortedWallets, key = { it.id }) { wallet ->
                    WalletListButton(
                        wallet = wallet,
                        installed = wallet.id in installedWallets,
                        onClick = { onWalletConnect(wallet.id) },
                        onDetailsClick = { onWalletClick(wallet.id) }
                    )
                }
            }
        }
    }
}

/**
 * Search bar for filtering wallets.
 */
@Composable
private fun WalletSearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp)),
        color = colors.surface,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = null,
                tint = colors.textTertiary,
                modifier = Modifier.size(20.dp)
            )

            BasicTextField(
                value = query,
                onValueChange = onQueryChange,
                modifier = Modifier.weight(1f),
                textStyle = LocalTextStyle.current.copy(
                    color = colors.textPrimary,
                    fontSize = CinacoinTheme.typography.bodyMedium.fontSize
                ),
                decorationBox = { innerTextField ->
                    if (query.isEmpty()) {
                        Text(
                            text = "Search wallets...",
                            color = colors.textTertiary
                        )
                    }
                    innerTextField()
                },
                singleLine = true
            )

            if (query.isNotEmpty()) {
                IconButton(
                    onClick = onClear,
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Clear,
                        contentDescription = "Clear search",
                        tint = colors.textTertiary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

/**
 * Wallet button within the grid — simplified version of WalletButton.
 */
@Composable
private fun WalletListButton(
    wallet: ConnectorInfo,
    installed: Boolean,
    onClick: () -> Unit,
    onDetailsClick: () -> Unit
) {
    val colors = CinacoinTheme.colors

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(colors.surfaceCard)
            .border(
                width = 1.dp,
                color = colors.border.copy(alpha = 0.3f),
                shape = RoundedCornerShape(14.dp)
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Reuse the WalletIcon from WalletButton.kt
        WalletListIcon(walletId = wallet.id, size = 36.dp)

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = wallet.name,
            style = CinacoinTheme.typography.labelMedium,
            color = colors.textPrimary,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            maxLines = 1
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Installed badge
        if (installed) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(colors.success, shape = androidx.compose.foundation.shape.CircleShape)
            )
        } else {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(colors.border.copy(alpha = 0.5f), shape = androidx.compose.foundation.shape.CircleShape)
            )
        }
    }
}

/**
 * Wallet icon for the grid (smaller variant).
 */
@Composable
private fun WalletListIcon(walletId: String, size: androidx.compose.ui.unit.Dp) {
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
            .background(bgColor, shape = RoundedCornerShape(10.dp))
            .border(
                width = 1.dp,
                color = colors.border.copy(alpha = 0.3f),
                shape = RoundedCornerShape(10.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = emoji,
            fontSize = (size.value * 0.55).sp
        )
    }
}
