package com.cinacoin.demo.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cinacoin.appkit.smartaccount.SmartAccountManager

@Composable
fun SmartAccountScreen() {
    val manager = remember { SmartAccountManager() }
    val smartAccountAddress by manager.smartAccountAddress.collectAsState()
    val isDeployed by manager.isDeployed.collectAsState()
    var ownerAddress by remember { mutableStateOf("0x1234567890abcdef1234567890abcdef12345678") }
    var info by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    if (smartAccountAddress != null) "Smart Account Ready" else "No Smart Account",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 18.sp
                )
                smartAccountAddress?.let {
                    Text(it.take(10) + "..." + it.takeLast(6), fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                    Text(
                        if (isDeployed) "✅ Deployed" else "⏳ Not deployed",
                        fontSize = 12.sp
                    )
                }
            }
        }

        OutlinedTextField(
            value = ownerAddress,
            onValueChange = { ownerAddress = it },
            label = { Text("Owner Address (EOA)") },
            modifier = Modifier.fillMaxWidth()
        )

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(
                onClick = { /* create */ },
                modifier = Modifier.weight(1f)
            ) { Text("Create") }
            OutlinedButton(
                onClick = { /* deploy */ },
                modifier = Modifier.weight(1f),
                enabled = smartAccountAddress != null
            ) { Text("Deploy") }
        }

        info?.let { Text(it, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp) }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp) }
    }
}
