# @cinacoin/android-kotlin

Cinacoin Wallet SDK for Android — a native Kotlin library with Cinacoin v2, EVM chain support, transaction management, and secure storage.

## Features

- **Cinacoin v2** — Pair, connect, sign, and send transactions via WC v2 protocol
- **EVM Chain Support** — Ethereum, Polygon, Arbitrum, Base, Optimism, BSC (+ Sepolia testnet)
- **Kotlin Coroutines** — All async operations use `suspend` functions
- **Kotlin Flow** — Reactive state via `StateFlow` for connection, chain, network, and events
- **Secure Storage** — EncryptedSharedPreferences for session persistence
- **Transaction Manager** — Build, estimate gas, send, and poll confirmations
- **Signer Manager** — `personal_sign`, `eth_signTypedData_v4` (EIP-712)
- **Network Monitor** — Real-time connectivity observation
- **Singleton SDK** — Thread-safe `CinacoinSDK.instance` with clean API

## Requirements

- **Android 8.0+** (API 26+)
- **Kotlin 1.9+**
- **Java 17** toolchain

## Installation

### Gradle (Kotlin DSL)

```kotlin
dependencies {
    implementation("com.cinacoin:sdk-android:0.1.0")
}
```

### Gradle (Groovy)

```groovy
dependencies {
    implementation 'com.cinacoin:sdk-android:0.1.0'
}
```

### Local development (from source)

```bash
cd packages/android-kotlin
./gradlew assembleRelease
./gradlew publishToMavenLocal
```

Then in your app:

```kotlin
implementation("com.cinacoin:sdk-android:0.1.0-SNAPSHOT")
```

## Quick Start

### 1. Initialize the SDK

Call once at app startup (e.g. in your `Application` class):

```kotlin
import com.cinacoin.sdk.CinacoinSDK
import com.cinacoin.sdk.CinacoinConfig
import com.cinacoin.sdk.ChainConfig
import com.cinacoin.sdk.AppMetadata

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        CinacoinSDK.initialize(
            application = this,
            config = CinacoinConfig(
                projectId = "YOUR_WALLETCONNECT_PROJECT_ID",
                chains = listOf(
                    ChainConfig.ethereum,
                    ChainConfig.polygon,
                    ChainConfig.arbitrum,
                    ChainConfig.base
                ),
                metadata = AppMetadata(
                    name = "My dApp",
                    description = "A great decentralized app",
                    url = "https://myapp.com",
                    icons = listOf("https://myapp.com/icon.png")
                )
            )
        )
    }
}
```

### 2. Connect a Wallet

```kotlin
import com.cinacoin.sdk.CinacoinSDK
import kotlinx.coroutines.launch
import kotlinx.coroutines.MainScope

// Launch connection from a ViewModel or Activity
MainScope().launch {
    try {
        val result = CinacoinSDK.instance.connect("walletconnect")
        println("Connected: ${result.address} on chain ${result.chainId}")
    } catch (e: Exception) {
        println("Connection failed: ${e.message}")
    }
}
```

Or connect with a specific wallet:

```kotlin
CinacoinSDK.instance.connect("metamask")
CinacoinSDK.instance.connect("rainbow")
CinacoinSDK.instance.connect("trust")
```

### 3. Observe Connection State

```kotlin
// In a ViewModel or Activity
lifecycleScope.launch {
    CinacoinSDK.instance.isConnected.collect { connected ->
        if (connected) {
            // Wallet is connected
            val address = CinacoinSDK.instance.getAccountAddress()
            println("Connected: $address")
        } else {
            // Wallet disconnected
        }
    }
}

// Observe all SDK events
CinacoinSDK.instance.events.collect { event ->
    when (event) {
        is SdkEvent.Cinacoined -> println("Connected: ${event.result.address}")
        is SdkEvent.WalletDisconnected -> println("Disconnected")
        is SdkEvent.ChainChanged -> println("Chain: ${event.chainId}")
        is SdkEvent.SessionExpired -> println("Session expired")
        is SdkEvent.Error -> println("Error: ${event.error.message}")
        else -> {}
    }
}
```

### 4. Send a Transaction

```kotlin
val sdk = CinacoinSDK.instance
val address = sdk.getAccountAddress() ?: return

val tx = sdk.transactionManager.buildTransfer(
    from = address,
    to = "0xRecipientAddress...",
    valueWei = "0x" + BigInteger("1000000000000000000").toString(16), // 1 ETH
    chainId = 1
)

val result = sdk.transactionManager.send(tx)
println("Tx hash: ${result.hash}")

// Wait for confirmation
sdk.transactionManager.waitForConfirmation(result.hash, confirmations = 1)
println("Confirmed!")
```

### 5. Sign a Message

```kotlin
// personal_sign
val sig = sdk.signerManager.personalSign("Sign this message to login")
println("Signature: ${sig.signature}")

// EIP-712 typed data
val typedSig = sdk.signerManager.signTypedData(
    """{
        "domain": { "name": "My dApp", "chainId": 1 },
        "primaryType": "Order",
        "types": { ... },
        "message": { ... }
    }"""
)
```

### 6. Switch Chain

```kotlin
sdk.switchChain(137) // Switch to Polygon
```

### 7. Disconnect

```kotlin
sdk.disconnect()
```

## SDK Architecture

```
CinacoinSDK (singleton)
├── walletConnectManager  — WC v2 pairing, sessions, requests
├── chainManager          — Chain config, switching, RPC lookup
├── transactionManager    — Build, estimate, send, confirm
├── signerManager         — personal_sign, signTypedData, EIP-712
├── networkMonitor        — Connectivity observation via Flow
└── storageManager        — EncryptedSharedPreferences for sessions
```

## Error Handling

All SDK errors extend `CinacoinError` (sealed class):

```kotlin
try {
    sdk.connect("walletconnect")
} catch (e: CinacoinError.NotInitialized) {
    // SDK not initialized
} catch (e: CinacoinError.CinacoinError) {
    // WC protocol error
} catch (e: CinacoinError.UserRejected) {
    // User declined in wallet
} catch (e: CinacoinError.ChainNotFound) {
    // Unsupported chain
} catch (e: CinacoinError.Timeout) {
    // Operation timed out
}
```

## State Flow Reference

| Flow | Type | Description |
|------|------|-------------|
| `isInitialized` | `StateFlow<Boolean>` | Whether SDK is initialized |
| `isConnected` | `StateFlow<Boolean>` | Wallet connection status |
| `sessionInfo` | `StateFlow<SessionInfo?>` | Active session details |
| `activeChainId` | `StateFlow<Int>` | Current chain ID |
| `events` | `StateFlow<SdkEvent?>` | All SDK events |
| `networkMonitor.status` | `StateFlow<NetworkStatus>` | Network connectivity |

## Testing

```bash
# Unit tests
./gradlew test

# Instrumented tests
./gradlew connectedAndroidTest
```

## Publishing to Maven Central

```bash
./gradlew publishReleasePublicationToSonatypeRepository
```

## License

MIT — see [LICENSE](LICENSE)
