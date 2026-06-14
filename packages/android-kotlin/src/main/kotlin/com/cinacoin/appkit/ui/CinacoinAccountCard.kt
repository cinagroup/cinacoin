package com.cinacoin.appkit.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Logout
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cinacoin.appkit.config.ChainRegistry
import com.cinacoin.appkit.config.CinacoinTheme

/**
 * Card displaying connected wallet account info
 */
@Composable
fun CinacoinAccountCard(
    address: String,
    chainId: Int? = null,
    onDisconnect: () -> Unit = {},
    theme: CinacoinTheme = if (androidx.compose.foundation.isSystemInDarkTheme()) 
        CinacoinTheme.Dark else CinacoinTheme.Light
) {
    val chain = chainId?.let { ChainRegistry.getChain(it) }
    
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, theme.border, RoundedCornerShape(12.dp)),
        shape = RoundedCornerShape(12.dp),
        color = theme.surface
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = shortenAddress(address),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.Monospace,
                    color = theme.text
                )
                if (chain != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = chain.name,
                        fontSize = 12.sp,
                        color = theme.textSecondary
                    )
                }
            }
            
            IconButton(onClick = onDisconnect) {
                Icon(
                    imageVector = Icons.Default.Logout,
                    contentDescription = "Disconnect",
                    tint = theme.textSecondary
                )
            }
        }
    }
}

private fun shortenAddress(address: String): String {
    if (address.length <= 10) return address
    return "${address.take(6)}...${address.takeLast(4)}"
}
