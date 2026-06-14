# Android SDK — Getting Started

## Requirements

- Android 7.0 (API 24)+
- Kotlin 1.9+
- Jetpack Compose 1.5+ (recommended) or XML Views
- AGP 8.0+
- A Cinacoin project ID ([get one here](https://cloud.cinacoin.io))

## Installation

### Gradle (Kotlin DSL)

Add the dependency to your `app/build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.cinacoin:appkit-core:1.0.0")
    implementation("io.cinacoin:appkit-ui:1.0.0")
    implementation("io.cinacoin:appkit-auth:1.0.0")       // Optional: auth
    implementation("io.cinacoin:appkit-smart-account:1.0.0") // Optional: smart accounts
}
```

### Gradle (Groovy)

```groovy
dependencies {
    implementation 'io.cinacoin:appkit-core:1.0.0'
    implementation 'io.cinacoin:appkit-ui:1.0.0'
    implementation 'io.cinacoin:appkit-auth:1.0.0'
    implementation 'io.cinacoin:appkit-smart-account:1.0.0'
}
```

### Maven BOM

```kotlin
dependencies {
    implementation(platform("io.cinacoin:appkit-bom:1.0.0"))
    implementation("io.cinacoin:appkit-core")
    implementation("io.cinacoin:appkit-ui")
}
```

## Quick Start

### 1. Configure AppKit

Initialize in your `Application` class:

```kotlin
import io.cinacoin.appkit.core.CinacoinAppKit
import io.cinacoin.appkit.core.AppKitConfig

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        CinacoinAppKit.configure(
            AppKitConfig(
                projectId = "YOUR_PROJECT_ID",
                metadata = AppKitConfig.AppMetadata(
                    name = "My App",
                    description = "My App Description",
                    url = "https://myapp.com",
                    icons = listOf("https://myapp.com/icon.png")
                ),
                themeMode = ThemeMode.DARK
            )
        )
    }
}
```

Register in `AndroidManifest.xml`:

```xml
<application
    android:name=".MyApplication"
    ...>
```

### 2. Add Connect Button (Compose)

```kotlin
import io.cinacoin.appkit.ui.CinacoinConnectButton
import io.cinacoin.appkit.ui.CinacoinConnectSheet

@Composable
fun WalletScreen() {
    var showConnect by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        CinacoinConnectButton(
            onClick = { showConnect = true }
        )

        if (showConnect) {
            CinacoinConnectSheet(
                onDismiss = { showConnect = false },
                onConnect = { wallet ->
                    Log.d("Wallet", "Connected: ${wallet.name}")
                    showConnect = false
                }
            )
        }
    }
}
```

### 3. Add Connect Button (XML Views)

```xml
<!-- res/layout/activity_main.xml -->
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <io.cinacoin.appkit.ui.CinacoinConnectButtonView
        android:id="@+id/connectButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content" />

</LinearLayout>
```

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val connectButton = findViewById<CinacoinConnectButtonView>(R.id.connectButton)
        connectButton.setOnClickListener {
            CinacoinConnectSheet.show(
                supportFragmentManager,
                onConnect = { wallet ->
                    Log.d("Wallet", "Connected: ${wallet.name}")
                }
            )
        }
    }
}
```

### 4. Observe Connection State

```kotlin
import io.cinacoin.appkit.core.CinacoinAppKit

class WalletViewModel : ViewModel() {
    private val appKit = CinacoinAppKit.instance

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _address = MutableStateFlow<String?>(null)
    val address: StateFlow<String?> = _address.asStateFlow()

    init {
        viewModelScope.launch {
            appKit.connectionState.collect { state ->
                _isConnected.value = state.isConnected
                _address.value = state.address
            }
        }

        // Check existing connection
        if (appKit.isConnected) {
            _isConnected.value = true
            _address.value = appKit.account?.address
        }
    }
}
```

### 5. Make RPC Calls

```kotlin
import io.cinacoin.appkit.core.CinacoinAppKit

// Get balance
val balance = CinacoinAppKit.instance.getBalance()
Log.d("Balance", "Balance: $balance")

// Send transaction
val txHash = CinacoinAppKit.instance.sendTransaction(
    to = "0xRecipientAddress",
    value = "0.01",
    data = null
)
Log.d("Tx", "Transaction hash: $txHash")

// Sign message
val signature = CinacoinAppKit.instance.signMessage("Hello, Cinacoin!")
Log.d("Sig", "Signature: $signature")
```

## Configuration Options

| Parameter         | Type          | Description                                 |
| ----------------- | ------------- | ------------------------------------------- |
| `projectId`       | `String`      | Your Cinacoin Cloud project ID              |
| `metadata`        | `AppMetadata` | App metadata displayed in the connect sheet |
| `themeMode`       | `ThemeMode`   | `LIGHT`, `DARK`, or `SYSTEM`                |
| `customChains`    | `List<Chain>` | Additional chains to support                |
| `defaultChain`    | `Chain`       | Default chain on connect                    |
| `enableAnalytics` | `Boolean`     | Enable anonymous usage analytics            |

## ProGuard / R8

Add to your `proguard-rules.pro`:

```proguard
-keep class io.cinacoin.appkit.** { *; }
-keepclassmembers class io.cinacoin.appkit.** { *; }
```

## Next Steps

- [Wallet Connection](./wallet-connection.md) — Deep dive into wallet connection flows
- [Authentication](./authentication.md) — Social and email login
- [Smart Accounts](./smart-accounts.md) — ERC-4337 account abstraction

<!-- TODO: Add screenshot of connect sheet -->
