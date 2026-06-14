package com.cinacoin.demo.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cinacoin.appkit.auth.AuthManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen() {
    val currentUser by AuthManager.currentUser.collectAsState()
    val isAuthenticated = currentUser != null
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = if (isAuthenticated) Icons.Default.Person else Icons.Default.PersonOff,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = if (isAuthenticated) "Authenticated" else "Not Authenticated",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 18.sp
                )
                currentUser?.let {
                    Text(it.email ?: it.userId, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        if (!isAuthenticated) {
            // Social Login
            Text("Social Login", fontWeight = FontWeight.Bold)
            OutlinedButton(
                onClick = { /* social login */ },
                modifier = Modifier.fillMaxWidth()
            ) { Icon(Icons.Default.Public, null); Spacer(Modifier.width(8.dp)); Text("Sign in with Google") }

            OutlinedButton(
                onClick = { /* social login */ },
                modifier = Modifier.fillMaxWidth()
            ) { Icon(Icons.Default.Code, null); Spacer(Modifier.width(8.dp)); Text("Sign in with GitHub") }

            OutlinedButton(
                onClick = { /* social login */ },
                modifier = Modifier.fillMaxWidth()
            ) { Icon(Icons.Default.Chat, null); Spacer(Modifier.width(8.dp)); Text("Sign in with Discord") }

            // Email Login
            Text("Email Login", fontWeight = FontWeight.Bold)
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                modifier = Modifier.fillMaxWidth()
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = { /* login */ },
                    modifier = Modifier.weight(1f),
                    enabled = !isLoading
                ) { Text("Login") }
                OutlinedButton(
                    onClick = { /* register */ },
                    modifier = Modifier.weight(1f),
                    enabled = !isLoading
                ) { Text("Register") }
            }
        } else {
            Button(
                onClick = { AuthManager.signOut() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) { Icon(Icons.Default.Logout, null); Spacer(Modifier.width(8.dp)); Text("Sign Out") }
        }

        error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp) }
    }
}
