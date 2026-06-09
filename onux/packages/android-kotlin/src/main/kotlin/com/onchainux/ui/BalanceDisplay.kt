/**
 * BalanceDisplay.kt — Jetpack Compose balance display with avatar.
 *
 * Shows formatted balance, token symbol, and a gradient avatar.
 * Supports multiple token symbols and displays a loading skeleton
 * while data is unavailable. Auto-refreshes on balance change via Flow.
 *
 * ## Usage
 * ```kotlin
 * BalanceDisplay()
 * BalanceDisplay(tokenSymbol = "USDC", showAvatar = true, decimals = 6)
 * ```
 */
package com.cinacoin.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cinacoin.core.AccountInfo
import com.cinacoin.core.Cinacoin
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Primary balance display component.
 *
 * @param account Override account info; defaults to Cinacoin's StateFlow
 * @param tokenSymbol Token symbol to display (defaults to connected chain)
 * @param decimals Decimal places for formatting
 * @param showAvatar Whether to show the gradient avatar
 * @param variant Card size variant — compact or expanded
 */
@Composable
fun BalanceDisplay(
    account: AccountInfo? = null,
    tokenSymbol: String? = null,
    decimals: Int = 18,
    showAvatar: Boolean = true,
    variant: BalanceVariant = BalanceVariant.EXPANDED,
    onChainUX: Cinacoin = Cinacoin.getInstance(),
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors

    // Collect account from SDK if not provided
    val sdkAccount by onChainUX.account.collectAsState()
    val effectiveAccount = account ?: sdkAccount

    if (effectiveAccount == null) {
        BalanceSkeleton(variant = variant, showAvatar = showAvatar)
        return
    }

    val symbol = tokenSymbol ?: effectiveAccount.chainSymbol
    val formattedBalance = formatBalance(effectiveAccount.balance, decimals)

    when (variant) {
        BalanceVariant.COMPACT -> CompactBalance(
            balance = formattedBalance,
            symbol = symbol,
            colors = colors,
            modifier = modifier
        )
        BalanceVariant.EXPANDED -> ExpandedBalance(
            balance = formattedBalance,
            symbol = symbol,
            account = effectiveAccount,
            showAvatar = showAvatar,
            colors = colors,
            modifier = modifier
        )
    }
}

/**
 * Balance display size variant.
 */
enum class BalanceVariant { COMPACT, EXPANDED }

/**
 * Full expanded balance card with avatar and metadata.
 */
@Composable
private fun ExpandedBalance(
    balance: String,
    symbol: String,
    account: AccountInfo,
    showAvatar: Boolean,
    colors: CinacoinColors,
    modifier: Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surfaceCard),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (showAvatar) {
                BalanceAvatar(size = 56.dp)
                Spacer(modifier = Modifier.height(16.dp))
            }

            Text(
                text = "Balance",
                style = CinacoinTheme.typography.bodyMedium,
                color = colors.textSecondary
            )
            Spacer(modifier = Modifier.height(4.dp))

            // Balance amount
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = balance,
                    style = CinacoinTheme.typography.displayMedium,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = symbol,
                    style = CinacoinTheme.typography.labelLarge,
                    color = colors.accent,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }

            // Address hint
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = truncateAddr(account.address),
                style = CinacoinTheme.typography.bodySmall,
                color = colors.textTertiary,
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * Compact inline balance display.
 */
@Composable
private fun CompactBalance(
    balance: String,
    symbol: String,
    colors: CinacoinColors,
    modifier: Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(
            text = balance,
            style = CinacoinTheme.typography.titleLarge,
            color = colors.textPrimary,
            fontWeight = FontWeight.SemiBold
        )
        Text(
            text = symbol,
            style = CinacoinTheme.typography.labelMedium,
            color = colors.textSecondary
        )
    }
}

/**
 * Loading skeleton animation shown while balance data is unavailable.
 */
@Composable
private fun BalanceSkeleton(variant: BalanceVariant, showAvatar: Boolean) {
    val colors = CinacoinTheme.colors
    val infiniteTransition = rememberInfiniteTransition(label = "skeleton")

    val shimmerColor by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shimmerAlpha"
    )

    val shimmerBrush = Brush.linearGradient(
        colors = listOf(
            colors.border.copy(alpha = shimmerColor),
            colors.border.copy(alpha = shimmerColor * 1.5f),
            colors.border.copy(alpha = shimmerColor)
        ),
        start = Offset.Zero,
        end = Offset.Infinite
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(shimmerBrush)
            .then(
                when (variant) {
                    BalanceVariant.COMPACT -> Modifier.height(40.dp)
                    BalanceVariant.EXPANDED -> Modifier.height(180.dp)
                }
            )
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {}
}

/**
 * Gradient avatar circle for balance display.
 */
@Composable
private fun BalanceAvatar(size: androidx.compose.ui.unit.Dp) {
    Box(
        modifier = Modifier
            .size(size)
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        CinacoinBrandColor,
                        CinacoinBrandColorLight,
                        Color(0xFF818CF8)
                    )
                ),
                shape = CircleShape
            )
            .padding(size * 0.2f),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "💰",
            fontSize = (size.value * 0.5).sp
        )
    }
}

/**
 * Format a raw balance string to the requested decimal places.
 */
private fun formatBalance(rawBalance: String, decimals: Int): String {
    return try {
        val amount = BigDecimal(rawBalance)
        amount.setScale(decimals, RoundingMode.HALF_UP)
            .stripTrailingZeros()
            .toPlainString()
    } catch (_: Exception) {
        rawBalance
    }
}

/**
 * Shorten an address.
 */
private fun truncateAddr(address: String, prefix: Int = 6, suffix: Int = 4): String {
    if (address.length <= prefix + suffix + 2) return address
    return "${address.take(prefix + 2)}…${address.takeLast(suffix)}"
}
