package com.cinacoin.appkit.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.cinacoin.appkit.config.CinacoinTheme
import com.cinacoin.appkit.config.WalletConfig
import com.cinacoin.appkit.config.WalletRegistry

/**
 * Cinacoin branded wallet connection dialog
 */
@Composable
fun CinacoinConnectDialog(
    visible: Boolean,
    onDismiss: () -> Unit,
    onWalletSelect: (WalletConfig) -> Unit = {},
    theme: CinacoinTheme = if (androidx.compose.foundation.isSystemInDarkTheme()) 
        CinacoinTheme.Dark else CinacoinTheme.Light
) {
    if (!visible) return
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            color = theme.background
        ) {
            Column {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Connect Wallet",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = theme.text
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = theme.textSecondary
                        )
                    }
                }
                
                HorizontalDivider(color = theme.border)
                
                // Wallet List
                LazyColumn(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(WalletRegistry.recommended) { wallet ->
                        WalletRow(
                            wallet = wallet,
                            theme = theme,
                            onClick = {
                                onWalletSelect(wallet)
                                onDismiss()
                            }
                        )
                    }
                }
                
                // Footer
                Text(
                    text = "By connecting, you agree to our Terms of Service",
                    fontSize = 12.sp,
                    color = theme.textSecondary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .background(theme.surface)
                )
            }
        }
    }
}

@Composable
private fun WalletRow(
    wallet: WalletConfig,
    theme: CinacoinTheme,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(theme.surface)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = wallet.iconUrl,
            contentDescription = wallet.name,
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
        )
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Text(
            text = wallet.name,
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
            color = theme.text,
            modifier = Modifier.weight(1f)
        )
        
        Text(
            text = "→",
            fontSize = 14.sp,
            color = theme.textSecondary
        )
    }
}
