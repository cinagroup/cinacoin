# 快速开始 — Android

> 5 分钟从零到钱包连接。适用于 Android Kotlin SDK。

## 概述

本指南帮助你在 Android 应用中快速集成 Cinacoin SDK，实现：

- ✅ 钱包连接（MetaMask、Trust Wallet 等）
- ✅ 账户状态管理
- ✅ 发送交易
- ✅ QR 码扫码连接
- ✅ Deep Link 回调处理

**预计完成时间：** 5 分钟

---

## 前置条件

- **Android 8.0+** (API 26+)
- **Kotlin** ≥ 1.9
- **Gradle** ≥ 8.0
- **Android Studio** Hedgehog+ 或最新稳定版
- 已有 Android 项目，或准备从零创建

---

## 第一步：添加依赖

### Gradle 配置

在项目级 `build.gradle.kts` 中确认 maven 仓库配置：

```kotlin
// build.gradle.kts (project level)
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://maven.cinacoin.com/releases") }
    }
}
```

在模块级 `build.gradle.kts` 中添加依赖：

```kotlin
// app/build.gradle.kts
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.mydapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.mydapp"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        viewBinding = true  // 或 compose = true
    }
}

dependencies {
    // Cinacoin SDK
    implementation("com.cinacoin:core:0.1.0")
    implementation("com.cinacoin:android:0.1.0")

    // 协程支持
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // 可选：QR 码扫描
    implementation("com.google.mlkit:barcode-scanning:17.2.0")
}
```

同步 Gradle 项目：

```bash
./gradlew build
```

---

## 第二步：初始化 SDK

在 `Application` 类或主 Activity 中初始化 Cinacoin：

```kotlin
// MyApplication.kt
package com.example.mydapp

import android.app.Application
import com.cinacoin.core.Cinacoin
import com.cinacoin.core.config.CinacoinConfig
import com.cinacoin.core.model.Chain
import com.cinacoin.core.model.AppMetadata

class MyApplication : Application() {

    lateinit var cinacoin: Cinacoin

    override fun onCreate() {
        super.onCreate()

        val config = CinacoinConfig(
            projectId = "your-project-id",
            relayUrl = "wss://relay.yourdomain.com/v1",
            chains = listOf(
                Chain(
                    id = 1,
                    name = "Ethereum",
                    nativeCurrency = com.cinacoin.core.model.NativeCurrency(
                        name = "Ether", symbol = "ETH", decimals = 18
                    ),
                    rpcUrl = "https://rpc.yourdomain.com/eth"
                ),
                Chain(
                    id = 137,
                    name = "Polygon",
                    nativeCurrency = com.cinacoin.core.model.NativeCurrency(
                        name = "MATIC", symbol = "MATIC", decimals = 18
                    ),
                    rpcUrl = "https://rpc.yourdomain.com/polygon"
                ),
            ),
            metadata = AppMetadata(
                name = "My dApp",
                description = "Android dApp built with Cinacoin",
                url = "https://mydapp.com",
                icons = listOf("https://mydapp.com/icon.png")
            )
        )

        cinacoin = Cinacoin(config, applicationContext)
    }
}
```

在 `AndroidManifest.xml` 中注册 Application：

```xml
<application
    android:name=".MyApplication"
    android:allowBackup="true"
    android:label="My dApp"
    android:theme="@style/Theme.MyApp">
    <!-- ... -->
</application>
```

---

## 第三步：连接钱包

### MainActivity — 完整示例

```kotlin
// MainActivity.kt
package com.example.mydapp

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.mydapp.databinding.ActivityMainBinding
import com.cinacoin.core.Cinacoin
import com.cinacoin.core.model.ConnectionResult
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var cinacoin: Cinacoin

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        cinacoin = (application as MyApplication).cinacoin

        setupUI()
        observeConnection()
    }

    private fun setupUI() {
        // 连接 MetaMask
        binding.btnMetamask.setOnClickListener {
            connectWallet("metamask")
        }

        // 连接 Trust Wallet
        binding.btnTrustWallet.setOnClickListener {
            connectWallet("trust")
        }

        // 打开 QR 码扫描连接
        binding.btnQRConnect.setOnClickListener {
            openQRScanner()
        }

        // 断开连接
        binding.btnDisconnect.setOnClickListener {
            lifecycleScope.launch {
                cinacoin.disconnect()
                Toast.makeText(this@MainActivity, "已断开连接", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun connectWallet(walletId: String) {
        lifecycleScope.launch {
            try {
                binding.btnConnect.isEnabled = false
                binding.btnConnect.text = "Connecting..."

                val result: ConnectionResult = cinacoin.connect(walletId = walletId)

                Toast.makeText(
                    this@MainActivity,
                    "已连接: ${result.accounts.firstOrNull()}",
                    Toast.LENGTH_SHORT
                ).show()

            } catch (e: Exception) {
                Toast.makeText(
                    this@MainActivity,
                    "连接失败: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.btnConnect.isEnabled = true
                binding.btnConnect.text = "Connect Wallet"
            }
        }
    }

    private fun observeConnection() {
        cinacoin.onAccountChange { address ->
            runOnUiThread {
                binding.tvAddress.text = "地址: $address"
                binding.tvAddress.visibility = android.view.View.VISIBLE
            }
        }

        cinacoin.onChainChange { chainId ->
            runOnUiThread {
                binding.tvChain.text = "链 ID: $chainId"
            }
        }

        cinacoin.onDisconnect {
            runOnUiThread {
                binding.tvAddress.visibility = android.view.View.GONE
                Toast.makeText(this@MainActivity, "已断开连接", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openQRScanner() {
        // 使用 ML Kit 或自定义扫码器
        // 获取 WC URI 后：
        // lifecycleScope.launch {
        //     cinacoin.connectWithUri(uriString)
        // }
    }
}
```

### Jetpack Compose 示例

```kotlin
// WalletScreen.kt
@Composable
fun WalletScreen(cinacoin: Cinacoin) {
    val accountState = cinacoin.accountState.collectAsState()

    Column(modifier = Modifier.padding(16.dp)) {
        when (val state = accountState.value) {
            is AccountState.Connected -> {
                Text("✅ 已连接")
                Text("地址: ${state.address}")
                Text("链: ${state.chainId}")
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    CoroutineScope(Dispatchers.Main).launch {
                        cinacoin.disconnect()
                    }
                }) {
                    Text("断开连接")
                }
            }
            is AccountState.Disconnected -> {
                Button(onClick = {
                    CoroutineScope(Dispatchers.Main).launch {
                        cinacoin.connect(walletId = "metamask")
                    }
                }) {
                    Text("连接 MetaMask")
                }
            }
            is AccountState.Connecting -> {
                CircularProgressIndicator()
                Text("正在连接...")
            }
            is AccountState.Error -> {
                Text("❌ ${state.message}")
            }
        }
    }
}
```

---

## 第四步：发送交易

```kotlin
import com.cinacoin.core.model.TransactionRequest

suspend fun sendTransaction(
    cinacoin: Cinacoin,
    to: String,
    valueWei: String,
): String {
    val tx = TransactionRequest(
        to = to,
        value = valueWei,  // wei 单位，十六进制
        data = "0x",       // 可选 calldata
    )

    val txHash = cinacoin.sendTransaction(tx)
    return txHash
}

// 使用示例
lifecycleScope.launch {
    val txHash = sendTransaction(
        cinacoin = cinacoin,
        to = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
        valueWei = "0x16345785D8A0000"  // 0.1 ETH
    )
    Toast.makeText(this@MainActivity, "交易已发送: $txHash", Toast.LENGTH_LONG).show()
}
```

---

## 第五步：Deep Link 配置

在 `AndroidManifest.xml` 中配置 deep link，用于钱包回调：

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask">

    <!-- Deep link for wallet callback -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="cinacoin-myapp" />
    </intent-filter>

    <!-- Universal link (App Link) -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="https"
            android:host="mydapp.com"
            android:pathPrefix="/wc" />
    </intent-filter>
</activity>
```

在 Activity 中处理 deep link：

```kotlin
override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    val uri = intent.data
    if (uri != null) {
        lifecycleScope.launch {
            cinacoin.handleDeepLink(uri.toString())
        }
    }
}
```

---

## 常见问题排查

### "ClassNotFoundException: com.cinacoin.core.Cinacoin"

- 确认依赖已正确添加到模块级 `build.gradle.kts`
- 检查 maven 仓库配置包含 `maven.cinacoin.com`
- 执行 `./gradlew clean build` 重新构建

### "No Activity found to handle Intent"

- Deep link scheme 需与钱包注册的 scheme 匹配
- 确保 `android:exported="true"` 已设置

### 连接后无回调

- 检查 deep link 配置是否正确
- 确认 `launchMode="singleTask"` 已设置
- 查看 logcat 中是否有 Cinacoin 相关日志

---

## 下一步

- [Android 示例](/examples/android) — 完整 Android 示例项目
- [Mobile SDK API](/api/mobile) — 移动端参考
- [配置选项](/guide/configuration) — 完整配置参考
- [链支持矩阵](/guides/chain-support) — 支持的链列表
