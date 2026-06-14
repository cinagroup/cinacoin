# Android Example — Complete AppKit Integration

A complete Kotlin/Compose example demonstrating wallet connection, authentication, and smart account usage.

## Project Structure

```
app/src/main/
├── java/com/example/cinacoinexample/
│   ├── MainActivity.kt
│   ├── CinacoinExampleApp.kt
│   └── ui/
│       ├── MainScreen.kt
│       ├── wallet/WalletScreen.kt
│       ├── wallet/WalletViewModel.kt
│       ├── login/LoginScreen.kt
│       └── login/LoginViewModel.kt
└── AndroidManifest.xml
```

## AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:name=".CinacoinExampleApp"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/Theme.Material3.Dark.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="cinacoinexample" android:host="wallet" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## CinacoinExampleApp.kt

```kotlin
package com.example.cinacoinexample

import android.app.Application
import io.cinacoin.appkit.core.CinacoinAppKit
import io.cinacoin.appkit.core.AppKitConfig
import io.cinacoin.appkit.core.ThemeMode
import io.cinacoin.appkit.auth.AuthConfig
import io.cinacoin.appkit.auth.AuthProvider
import io.cinacoin.appkit.smartaccount.SmartAccountConfig

class CinacoinExampleApp : Application() {
    override fun onCreate() {
        super.onCreate()

        CinacoinAppKit.configure(
            AppKitConfig(
                projectId = "YOUR_PROJECT_ID",
                metadata = AppKitConfig.AppMetadata(
                    name = "Cinacoin Example",
                    description = "Example app demonstrating AppKit SDK",
                    url = "https://cinacoin.io",
                    icons = listOf("https://cinacoin.io/icon.png")
                ),
                themeMode = ThemeMode.DARK,
                smartAccountConfig = SmartAccountConfig(
                    factoryAddress = "0xFACTORY_ADDRESS",
                    entryPointAddress = "0xENTRY_POINT_ADDRESS",
                    paymasterUrl = "https://paymaster.cinacoin.io/v1/YOUR_PROJECT_ID"
                )
            )
        )

        CinacoinAppKit.configureAuth(
            AuthConfig(
                projectId = "YOUR_PROJECT_ID",
                supportedProviders = listOf(
                    AuthProvider.GOOGLE, AuthProvider.GITHUB,
                    AuthProvider.DISCORD, AuthProvider.APPLE, AuthProvider.EMAIL
                ),
                redirectUrl = "cinacoinexample://auth/callback"
            )
        )
    }
}
```

## MainActivity.kt

```kotlin
package com.example.cinacoinexample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.cinacoinexample.ui.MainScreen
import io.cinacoin.appkit.core.CinacoinAppKit

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MainScreen() }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        intent.data?.let { CinacoinAppKit.instance.handleDeepLink(it) }
    }
}
```

## ui/MainScreen.kt

```kotlin
package com.example.cinacoinexample.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.cinacoinexample.ui.wallet.WalletScreen
import com.example.cinacoinexample.ui.login.LoginScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.AccountBalanceWallet, null) },
                    label = { Text("Wallet") },
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.Person, null) },
                    label = { Text("Login") },
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 }
                )
            }
        }
    ) { padding ->
        when (selectedTab) {
            0 -> WalletScreen(modifier = Modifier.padding(padding))
            1 -> LoginScreen(modifier = Modifier.padding(padding))
        }
    }
}
```

## ui/wallet/WalletViewModel.kt

```kotlin
package com.example.cinacoinexample.ui.wallet

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.cinacoin.appkit.core.CinacoinAppKit
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class WalletState(
    val isConnected: Boolean = false,
    val address: String? = null,
    val chainId: String? = null,
    val balance: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

class WalletViewModel : ViewModel() {
    private val appKit = CinacoinAppKit.instance
    private val _state = MutableStateFlow(WalletState())
    val state: StateFlow<WalletState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            appKit.connectionState.collect { cs ->
                _state.value = _state.value.copy(
                    isConnected = cs.isConnected,
                    address = cs.address,
                    chainId = cs.chainId
                )
            }
        }
    }

    fun disconnect() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try { appKit.disconnect() } catch (e: Exception) {
                _state.update { it.copy(error = e.message) }
            }
            _state.update { it.copy(isLoading = false) }
        }
    }

    fun getBalance() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try {
                _state.update { it.copy(balance = appKit.getBalance()) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.message) }
            }
            _state.update { it.copy(isLoading = false) }
        }
    }

    fun switchChain(chainId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try { appKit.switchChain(chainId) } catch (e: Exception) {
                _state.update { it.copy(error = e.message) }
            }
            _state.update { it.copy(isLoading = false) }
        }
    }
}
```

## ui/wallet/WalletScreen.kt

```kotlin
package com.example.cinacoinexample.ui.wallet

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import io.cinacoin.appkit.ui.CinacoinConnectButton
import io.cinacoin.appkit.ui.CinacoinConnectSheet

@Composable
fun WalletScreen(
    modifier: Modifier = Modifier,
    viewModel: WalletViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()
    var showConnect by remember { mutableStateOf(false) }

    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (state.isConnected) {
            // Connected info card
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Connected ✓", style = MaterialTheme.typography.titleMedium)
                    state.address?.let {
                        Text("Address: $it", fontFamily = FontFamily.Monospace)
                    }
                    state.chainId?.let { Text("Chain: $it") }
                    state.balance?.let { Text("Balance: $it") }
                }
            }

            // Action buttons
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { viewModel.getBalance() }) { Text("Balance") }
                OutlinedButton(onClick = { viewModel.disconnect() }) { Text("Disconnect") }
            }

            // Chain switching
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Switch Chain", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { viewModel.switchChain("0x1") },
                            modifier = Modifier.weight(1f)) { Text("ETH") }
                        Button(onClick = { viewModel.switchChain("0x89") },
                            modifier = Modifier.weight(1f)) { Text("Polygon") }
                        Button(onClick = { viewModel.switchChain("0x2105") },
                            modifier = Modifier.weight(1f)) { Text("Base") }
                    }
                }
            }
        } else {
            Text("Connect your wallet", style = MaterialTheme.typography.headlineSmall)
            CinacoinConnectButton(onClick = { showConnect = true })
        }

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }
    }

    if (showConnect) {
        CinacoinConnectSheet(
            onDismiss = { showConnect = false },
            onConnect = { showConnect = false }
        )
    }
}
```

## ui/login/LoginViewModel.kt

```kotlin
package com.example.cinacoinexample.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.cinacoin.appkit.auth.AuthManager
import io.cinacoin.appkit.auth.AuthProvider
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class LoginState(
    val isAuthenticated: Boolean = false,
    val email: String? = null,
    val address: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val showOTP: Boolean = false
)

class LoginViewModel : ViewModel() {
    private val _state = MutableStateFlow(LoginState())
    val state: StateFlow<LoginState> = _state.asStateFlow()

    fun socialLogin(provider: AuthProvider) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try {
                val result = AuthManager.instance.signIn(provider)
                _state.update {
                    it.copy(isAuthenticated = true, email = result.email, address = result.address)
                }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.message) }
            }
            _state.update { it.copy(isLoading = false) }
        }
    }

    fun sendOTP(email: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try {
                AuthManager.instance.sendEmailOTP(email)
                _state.update { it.copy(showOTP = true) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.message) }
            }
            _state.update { it.copy(isLoading = false) }
        }
    }

    fun verifyOTP(email: String, otp: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try {
                val result = AuthManager.instance.verifyEmailOTP(email, otp)
                _state.update {
                    it.copy(isAuthenticated = true, email = email, address = result.address)
                }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.message) }
            }
            _state.update { it.copy(isLoading = false) }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            AuthManager.instance.signOut()
            _state.value = LoginState()
        }
    }
}
```

## ui/login/LoginScreen.kt

```kotlin
package com.example.cinacoinexample.ui.login

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import io.cinacoin.appkit.auth.AuthProvider
import io.cinacoin.appkit.ui.CinacoinSocialButton

@Composable
fun LoginScreen(
    modifier: Modifier = Modifier,
    viewModel: LoginViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()
    var email by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }

    Column(
        modifier = modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (state.isAuthenticated) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Logged In ✓", style = MaterialTheme.typography.titleMedium)
                    state.email?.let { Text("Email: $it") }
                    state.address?.let { Text("Wallet: $it") }
                    OutlinedButton(onClick = { viewModel.signOut() }) { Text("Sign Out") }
                }
            }
        } else {
            Text("Sign In", style = MaterialTheme.typography.headlineMedium)

            CinacoinSocialButton(provider = AuthProvider.GOOGLE,
                onClick = { viewModel.socialLogin(AuthProvider.GOOGLE) })
            CinacoinSocialButton(provider = AuthProvider.APPLE,
                onClick = { viewModel.socialLogin(AuthProvider.APPLE) })
            CinacoinSocialButton(provider = AuthProvider.DISCORD,
                onClick = { viewModel.socialLogin(AuthProvider.DISCORD) })
            CinacoinSocialButton(provider = AuthProvider.GITHUB,
                onClick = { viewModel.socialLogin(AuthProvider.GITHUB) })

            HorizontalDivider()

            if (!state.showOTP) {
                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    label = { Text("Email") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(), singleLine = true
                )
                Button(
                    onClick = { viewModel.sendOTP(email) },
                    enabled = email.isNotEmpty() && !state.isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (state.isLoading) CircularProgressIndicator(Modifier.size(20.dp))
                    else Text("Send Code")
                }
            } else {
                Text("Enter code sent to $email")
                OutlinedTextField(
                    value = otp, onValueChange = { otp = it },
                    label = { Text("6-digit code") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(), singleLine = true, maxLength = 6
                )
                Button(
                    onClick = { viewModel.verifyOTP(email, otp) },
                    enabled = otp.length == 6 && !state.isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (state.isLoading) CircularProgressIndicator(Modifier.size(20.dp))
                    else Text("Verify")
                }
            }
        }

        state.error?.let {
            Text(it, color = MaterialTheme.colorScheme.error)
        }
    }
}
```

## Running the Example

1. Replace `YOUR_PROJECT_ID` with your actual Cinacoin Cloud project ID
2. Update factory and entry point addresses
3. Build and run in Android Studio
4. Test wallet connection, authentication features

<!-- TODO: Add screenshots of the example app -->
