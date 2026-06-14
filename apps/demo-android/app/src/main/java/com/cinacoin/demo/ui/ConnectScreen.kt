package com.cinacoin.demo.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cinacoin.appkit.config.ChainRegistry
import com.cinacoin.appkit.ui.CinacoinConnectButton
import com.cinacoin.appkit.ui.CinacoinAccountCard
import com.cinacoin.appkit.ui.CinacoinChainSelector

@Composable
fun ConnectScreen() {
    var showConnectDialog by remember { mutableStateOf(false) }
    var isConnected by remember { mutableStateOf(false) }
    var selectedChainId by remember { mutableStateOf(1) }
    val address = "0x1234567890abcdef1234567890abcdef12345678"

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            CinacoinConnectButton(onClick = { showConnectDialog = true })
        }

        if (isConnected) {
            item {
                CinacoinAccountCard(
                    address = address,
                    chainId = selectedChainId,
                    onDisconnect = { isConnected = false }
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Active Chain:", color = MaterialTheme.colorScheme.onSurfaceVariant)
                CinacoinChainSelector(
                    selectedChainId = selectedChainId,
                    onChainSelected = { selectedChainId = it }
                )
            }
        }

        item {
            Text("Supported Chains", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }

        items(ChainRegistry.allEVMChains) { chain ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(chain.name, fontWeight = FontWeight.Medium)
                        Text(
                            "Chain ID: ${chain.chainId}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(chain.symbol, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }

    // Connect Dialog
    com.cinacoin.appkit.ui.CinacoinConnectDialog(
        visible = showConnectDialog,
        onDismiss = { showConnectDialog = false },
        onWalletSelect = {
            isConnected = true
        }
    )
}
