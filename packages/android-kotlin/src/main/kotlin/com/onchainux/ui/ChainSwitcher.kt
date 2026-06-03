/**
 * ChainSwitcher.kt — Jetpack Compose dropdown for switching between chains.
 *
 * Displays a list of configured chains with their icons, names, and
 * connection status. Supports animated transitions and uses ChainConfig
 * from the core SDK.
 *
 * ## Usage
 * ```kotlin
 * ChainSwitcher(
 *     chains = listOf(ChainConfig.ethereum, ChainConfig.polygon),
 *     activeChainId = 1,
 *     onChainSelected = { chainId -> /* handle */ },
 *     onDismiss = { /* close */ }
 * )
 * ```
 */
package com.cinacoin.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.cinacoin.core.ChainConfig
import com.cinacoin.core.ConnectionStatus
import com.cinacoin.core.Cinacoin

/**
 * Chain selector button with dropdown modal.
 */
@Composable
fun ChainSwitcher(
    chains: List<ChainConfig>,
    activeChainId: Int,
    onChainSelected: (Int) -> Unit,
    onDismiss: () -> Unit,
    onChainUX: Cinacoin = Cinacoin.getInstance(),
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors
    var expanded by remember { mutableStateOf(false) }
    val rotation by animateFloatAsState(
        targetValue = if (expanded) 180f else 0f,
        animationSpec = tween(durationMillis = 200)
    )

    val activeChain = chains.find { it.chainId == activeChainId }
        ?: chains.firstOrNull()

    // Trigger button
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(colors.surfaceCard)
            .border(
                width = 1.dp,
                color = Color(colors.border),
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { expanded = true }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (activeChain != null) {
            ChainIcon(chainId = activeChain.chainId, size = 20.dp)
            Text(
                text = activeChain.name,
                style = CinacoinTheme.typography.labelLarge,
                color = colors.textPrimary
            )
        }
        Icon(
            imageVector = Icons.Default.ArrowDropDown,
            contentDescription = "Expand chains",
            tint = colors.textSecondary,
            modifier = Modifier.rotate(rotation)
        )
    }

    // Dropdown modal
    if (expanded) {
        ChainDropdownModal(
            chains = chains,
            activeChainId = activeChainId,
            onChainSelected = { chainId ->
                expanded = false
                onChainSelected(chainId)
            },
            onDismiss = { expanded = false },
            onChainUX = onChainUX
        )
    }
}

/**
 * Full-screen modal overlay for chain selection.
 */
@Composable
private fun ChainDropdownModal(
    chains: List<ChainConfig>,
    activeChainId: Int,
    onChainSelected: (Int) -> Unit,
    onDismiss: () -> Unit,
    onChainUX: Cinacoin
) {
    val colors = CinacoinTheme.colors

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.overlay),
            contentAlignment = Alignment.Center
        ) {
            AnimatedVisibility(
                visible = true,
                enter = fadeIn(tween(200)) + expandVertically(tween(200)),
                exit = fadeOut(tween(150)) + shrinkVertically(tween(150))
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    shape = RoundedCornerShape(20.dp),
                    color = colors.surfaceCard,
                    tonalElevation = 8.dp
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        // Header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Switch Network",
                                style = CinacoinTheme.typography.headlineMedium,
                                color = colors.textPrimary
                            )
                            IconButton(onClick = onDismiss) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Close",
                                    tint = colors.textSecondary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Chain list
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            items(chains) { chain ->
                                ChainListItem(
                                    chain = chain,
                                    isActive = chain.chainId == activeChainId,
                                    onClick = { onChainSelected(chain.chainId) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Single chain list item with icon, name, and checkmark for active chain.
 */
@Composable
private fun ChainListItem(
    chain: ChainConfig,
    isActive: Boolean,
    onClick: () -> Unit
) {
    val colors = CinacoinTheme.colors
    var isHovered by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(
                if (isHovered) colors.surfaceCardHover else Color.Transparent
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        ChainIcon(chainId = chain.chainId, size = 28.dp)

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = chain.name,
                style = CinacoinTheme.typography.bodyLarge,
                color = colors.textPrimary
            )
            if (chain.testnet) {
                Text(
                    text = "Testnet",
                    style = CinacoinTheme.typography.labelSmall,
                    color = colors.warning
                )
            }
        }

        if (isActive) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = "Active chain",
                tint = CinacoinTheme.colors.accent,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

/**
 * Displays a chain icon based on chain ID.
 * Uses placeholder colored circles when icon URLs aren't available.
 */
@Composable
fun ChainIcon(chainId: Int, size: androidx.compose.ui.unit.Dp, modifier: Modifier = Modifier) {
    val iconColor = when (chainId) {
        1 -> Color(0xFF627EEA)       // Ethereum — blue
        137 -> Color(0xFF8247E5)     // Polygon — purple
        42161 -> Color(0xFF28A0F0)   // Arbitrum — light blue
        8453 -> Color(0xFF0052FF)    // Base — deep blue
        10 -> Color(0xFFFF0420)      // Optimism — red
        56 -> Color(0xFFF0B90B)      // BSC — gold
        11155111 -> Color(0xFFA0A0A0) // Sepolia — gray
        else -> Color(0xFF64748B)    // Default — slate
    }

    Box(
        modifier = modifier
            .size(size)
            .background(iconColor.copy(alpha = 0.2f), shape = androidx.compose.foundation.shape.CircleShape)
            .border(1.dp, iconColor.copy(alpha = 0.4f), shape = androidx.compose.foundation.shape.CircleShape)
    ) {
        val shortName = when (chainId) {
            1 -> "Ξ"
            137 -> "⬡"
            42161 -> "A"
            8453 -> "b"
            10 -> "O"
            56 -> "B"
            else -> "⛓"
        }
        Text(
            text = shortName,
            color = iconColor,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value * 0.5f).sp,
            modifier = Modifier.align(Alignment.Center)
        )
    }
}
