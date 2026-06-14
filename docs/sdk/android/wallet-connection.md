# Android SDK — Wallet Connection

## Overview

AppKit supports connecting to 300+ wallets on Android through a unified interface. This guide covers all connection methods and state management.

## Using CinacoinConnectButton (Compose)

The simplest way to add wallet connection:

```kotlin
import io.cinacoin.appkit.ui.CinacoinConnectButton
import io.cinacoin.appkit.ui.CinacoinConnectSheet

@Composable
fun WalletScreen() {
    var showConnect by remember { mutableStateOf(false) }

    CinacoinConnectButton(
        onClick = { showConnect = true }
    )

    if (showConnect) {
        CinacoinConnectSheet(
            onDismiss = { showConnect = false },
            onConnect = { wallet ->
                Log.d("Wallet", "Connected: ${wallet.name}")
                Log.d("Wallet", "Address: ${wallet.address}")
                showConnect = false
            },
            onError = { error ->
                Log.e("Wallet", "Error: ${error.message}")
            }
        )
    }
}
```

### Customizing the Button

```kotlin
CinacoinConnectButton(
    label = "Connect Wallet",
    style = ButtonStyle.PRIMARY, // PRIMARY, SECONDARY, OUTLINE
    size = ButtonSize.LARGE,     // SMALL, MEDIUM, LARGE
    modifier = Modifier.fillMaxWidth(),
    onClick = { showConnect = true }
)
```

## Using CinacoinConnectSheet

The connect sheet provides a pre-built UI for wallet selection:

### Compose

```kotlin
val config = ConnectSheetConfig(
    showRecentWallets = true,
    showQRCode = true,
    featuredWallets = listOf("metamask", "trust", "rainbow"),
    excludedWallets = emptyList(),
    enableEmailLogin = true,
    enableSocialLogin = true
)

CinacoinConnectSheet(
    config = config,
    onDismiss = { showConnect = false },
    onConnect = { wallet -> /* ... */ }
)
```

### XML Views (DialogFragment)

```kotlin
val sheet = CinacoinConnectSheetFragment.newInstance(
    ConnectSheetConfig(
        showRecentWallets = true,
        showQRCode = true,
        featuredWallets = listOf("metamask", "trust")
    )
)

sheet.setOnConnectListener { wallet ->
    Log.d("Wallet", "Connected: ${wallet.name}")
}

sheet.show(supportFragmentManager, "connect_sheet")
```

## Custom Wallet List

Build your own wallet selection UI:

```kotlin
import io.cinacoin.appkit.core.CinacoinAppKit

@Composable
fun CustomWalletList() {
    val appKit = CinacoinAppKit.instance
    val wallets = remember { appKit.getAvailableWallets() }
    val scope = rememberCoroutineScope()

    LazyColumn {
        items(wallets) { wallet ->
            WalletRow(
                wallet = wallet,
                onClick = {
                    scope.launch {
                        try {
                            appKit.connect(wallet = wallet)
                        } catch (e: Exception) {
                            Log.e("Wallet", "Connection failed", e)
                        }
                    }
                }
            )
        }
    }
}

@Composable
fun WalletRow(wallet: Wallet, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = wallet.iconUrl,
            contentDescription = wallet.name,
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(8.dp))
        )

        Column(modifier = Modifier.padding(start = 12.dp)) {
            Text(text = wallet.name, style = MaterialTheme.typography.titleMedium)
            if (wallet.isInstalled) {
                Text(
                    text = "Installed",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Green
                )
            }
        }
    }
}
```

## Connection State Management

### Using Kotlin Flows

```kotlin
import io.cinacoin.appkit.core.CinacoinAppKit

class WalletViewModel : ViewModel() {
    private val appKit = CinacoinAppKit.instance

    // Connection state as Flow
    val connectionState: StateFlow<ConnectionState> = appKit.connectionState
        .map { state ->
            if (state.isConnected) {
                ConnectionState.Connected(
                    address = state.address!!,
                    chainId = state.chainId!!
                )
            } else {
                ConnectionState.Disconnected
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ConnectionState.Disconnected)

    // Collect in Compose
    @Composable
    fun observe() {
        val state by connectionState.collectAsState()

        when (state) {
            is ConnectionState.Disconnected -> ShowConnectButton()
            is ConnectionState.Connected -> ShowAccountInfo(state as ConnectionState.Connected)
            is ConnectionState.Connecting -> ShowLoading()
            is ConnectionState.Error -> ShowError(state as ConnectionState.Error)
        }
    }
}

sealed class ConnectionState {
    object Disconnected : ConnectionState()
    object Connecting : ConnectionState()
    data class Connected(val address: String, val chainId: String) : ConnectionState()
    data class Error(val message: String) : ConnectionState()
}
```

### Using LiveData (XML Views)

```kotlin
class WalletViewModel : ViewModel() {
    private val appKit = CinacoinAppKit.instance

    private val _isConnected = MutableLiveData(false)
    val isConnected: LiveData<Boolean> = _isConnected

    private val _address = MutableLiveData<String?>()
    val address: LiveData<String?> = _address

    init {
        viewModelScope.launch {
            appKit.connectionState.collect { state ->
                _isConnected.postValue(state.isConnected)
                _address.postValue(state.address)
            }
        }
    }
}
```

## Chain Switching

### Switch Chain Programmatically

```kotlin
import io.cinacoin.appkit.core.CinacoinAppKit

// Switch to Ethereum Mainnet
CinacoinAppKit.instance.switchChain("0x1")

// Switch to Polygon
CinacoinAppKit.instance.switchChain("0x89")

// Switch to Base
CinacoinAppKit.instance.switchChain("0x2105")
```

### Listen for Chain Changes

```kotlin
viewModelScope.launch {
    CinacoinAppKit.instance.chainState.collect { chainId ->
        Log.d("Chain", "Switched to: $chainId")

        when (chainId) {
            "0x1" -> Log.d("Chain", "Ethereum Mainnet")
            "0x89" -> Log.d("Chain", "Polygon")
            else -> Log.d("Chain", "Unknown chain: $chainId")
        }
    }
}
```

### Request Chain Switch from dApp

```kotlin
try {
    CinacoinAppKit.instance.requestChainSwitch("0x1")
    Log.d("Chain", "User approved chain switch")
} catch (e: ChainSwitchException.UserRejected) {
    Log.d("Chain", "User rejected")
} catch (e: Exception) {
    Log.e("Chain", "Error", e)
}
```

## Disconnect

```kotlin
// Disconnect current session
CinacoinAppKit.instance.disconnect()

// Disconnect and clear stored sessions
CinacoinAppKit.instance.disconnect(clearSession = true)
```

## Deep Linking

### Configure Intent Filters

Add to `AndroidManifest.xml`:

```xml
<activity android:name=".MainActivity"
    android:launchMode="singleTask">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="myapp" android:host="wallet" />
    </intent-filter>
</activity>
```

### Handle Deep Link Callbacks

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        intent.data?.let { uri ->
            CinacoinAppKit.instance.handleDeepLink(uri)
        }
    }
}
```

## Error Handling

```kotlin
try {
    CinacoinAppKit.instance.connect(wallet = wallet)
} catch (e: ConnectionException.WalletNotFound) {
    // Wallet app not installed — prompt install
    showInstallPrompt(wallet)
} catch (e: ConnectionException.UserRejected) {
    // User rejected connection
    showRejectionMessage()
} catch (e: ConnectionException.Timeout) {
    // Connection timed out
    showRetryPrompt()
} catch (e: ConnectionException.ChainNotSupported) {
    // Chain not supported by wallet
    showChainNotSupported()
} catch (e: Exception) {
    // Unexpected error
    showError(e.message ?: "Unknown error")
}
```

<!-- TODO: Add screenshot of custom wallet list -->
