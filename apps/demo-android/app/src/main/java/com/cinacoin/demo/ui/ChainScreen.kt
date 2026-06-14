package com.cinacoin.demo.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cinacoin.appkit.config.ChainRegistry
import com.cinacoin.appkit.config.WalletRegistry

@Composable
fun ChainScreen() {
    var selectedChainId by remember { mutableStateOf(1) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text("EVM Chains (${ChainRegistry.allEVMChains.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(Modifier.height(8.dp))
        }

        items(ChainRegistry.allEVMChains) { chain ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                onClick = { selectedChainId = chain.chainId }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(chain.name, fontWeight = FontWeight.Medium)
                        Text("Chain ID: ${chain.chainId}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("RPC: ${chain.rpcUrl}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(chain.symbol, fontWeight = FontWeight.SemiBold)
                        if (chain.testnet) {
                            Text("TESTNET", fontSize = 10.sp, color = MaterialTheme.colorScheme.error)
                        }
                        if (chain.chainId == selectedChainId) {
                            Text("✓ Active", fontSize = 10.sp, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(16.dp))
            Text("Recommended Wallets (${WalletRegistry.recommended.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(Modifier.height(8.dp))
        }

        items(WalletRegistry.recommended) { wallet ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(wallet.name, fontWeight = FontWeight.Medium)
                        Text(wallet.id, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}
