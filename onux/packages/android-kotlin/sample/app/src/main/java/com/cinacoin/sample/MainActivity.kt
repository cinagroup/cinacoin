/**
 * MainActivity.kt — Cinacoin SDK Sample App
 *
 * A complete demo app showcasing all Cinacoin SDK features:
 * - SDK initialization (CinacoinSDK.initialize)
 * - Wallet connection via ConnectModal
 * - Chain switching via ChainSwitcher
 * - Balance display via BalanceDisplay
 * - Transaction sending
 * - Message signing
 * - Account modal with disconnect
 * - Transaction history
 * - Dark/light theme toggle
 *
 * Uses only SDK types from com.cinacoin.sdk.* that are fully implemented.
 */
package com.cinacoin.sample

import android.app.Application
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.cinacoin.sdk.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

// ============================================================================
// Sample Application — SDK initialization
// ============================================================================

class SampleApp : Application() {

    override fun onCreate() {
        super.onCreate()
        try {
            CinacoinSDK.initialize(
                application = this,
                config = CinacoinConfig(
                    projectId = "YOUR_PROJECT_ID",
                    chains = ChainConfig.defaults,
                    themeMode = ThemeMode.DARK,
                    metadata = AppMetadata(
                        name = "Cinacoin Sample",
                        description = "A demo app for the Cinacoin SDK",
                        url = "https://cinacoin.com",
                        icons = listOf("https://cinacoin.com/icon.png")
                    ),
                    recommendedWallets = listOf("metamask", "rainbow", "trust"),
                    storageEncryption = true
                )
            )
        } catch (_: CinacoinError.AlreadyInitialized) {
            // Already initialized (e.g., during hot reload)
        }
    }
}

// ============================================================================
// ViewModel — SDK state management
// ============================================================================

class SampleViewModel(application: Application) : AndroidViewModel(application) {

    val sdk = CinacoinSDK.instance

    // Connection state
    val isConnected: StateFlow<Boolean> = sdk.isConnected
    val sessionInfo = sdk.sessionInfo
    val activeChainId: StateFlow<Int> = sdk.activeChainId

    // SDK events
    val events: StateFlow<SdkEvent?> = sdk.events

    // UI state
    private val _isDarkTheme = MutableStateFlow(true)
    val isDarkTheme: StateFlow<Boolean> = _isDarkTheme.asStateFlow()

    // Transaction history (in-memory for demo)
    private val _txHistory = MutableStateFlow<List<TransactionResult>>(emptyList())
    val txHistory: StateFlow<List<TransactionResult>> = _txHistory.asStateFlow()

    // Demo balance
    private val _demoBalance = MutableStateFlow("0.0")
    val demoBalance: StateFlow<String> = _demoBalance.asStateFlow()

    fun toggleTheme() {
        _isDarkTheme.value = !_isDarkTheme.value
    }

    fun connect(walletId: String) {
        viewModelScope.launch {
            try {
                sdk.connect(walletId)
                _demoBalance.value = "1.2345"
            } catch (e: Exception) {
                // Handle connection error
            }
        }
    }

    fun disconnect() {
        viewModelScope.launch {
            sdk.disconnect()
            _txHistory.value = emptyList()
            _demoBalance.value = "0.0"
        }
    }

    fun switchChain(chainId: Int) {
        viewModelScope.launch {
            sdk.switchChain(chainId)
        }
    }

    fun sendTransaction(to: String, amount: String) {
        viewModelScope.launch {
            try {
                val from = sdk.getAccountAddress() ?: return@launch
                val params = sdk.transactionManager.buildTransfer(
                    from = from,
                    to = to,
                    valueWei = amount
                )
                val result = sdk.transactionManager.send(params)
                _txHistory.value = listOf(result) + _txHistory.value
            } catch (e: Exception) {
                // Handle transaction error
            }
        }
    }

    fun signMessage(message: String) {
        viewModelScope.launch {
            try {
                val result = sdk.signerManager.personalSign(message)
                // Signature available in result.signature
            } catch (e: Exception) {
                // Handle signing error
            }
        }
    }
}

// ============================================================================
// MainActivity — App entry point
// ============================================================================

class MainActivity : ComponentActivity() {

    private val viewModel: SampleViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            CinacoinTheme(
                darkTheme = viewModel.isDarkTheme.collectAsState(initial = true).value
            ) {
                CinacoinSampleApp(viewModel = viewModel)
            }
        }
    }
}

// ============================================================================
// Root Composable
// ============================================================================

@Composable
fun CinacoinSampleApp(viewModel: SampleViewModel) {
    val sdk = viewModel.sdk
    val isConnected by viewModel.isConnected.collectAsState(initial = false)
    val sessionInfo by viewModel.sessionInfo.collectAsState(initial = null)
    val activeChainId by viewModel.activeChainId.collectAsState(initial = 1)
    val chains = sdk.chainManager.supportedChains.value
    val txList by viewModel.txHistory.collectAsState(initial = emptyList())
    val balance by viewModel.demoBalance.collectAsState(initial = "0.0")

    // UI navigation state
    var showConnectModal by remember { mutableStateOf(false) }
    var showAccountModal by remember { mutableStateOf(false) }
    var showSendTx by remember { mutableStateOf(false) }
    var showSignMessage by remember { mutableStateOf(false) }
    var showTxHistory by remember { mutableStateOf(false) }
    var showChainSwitcher by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            SampleTopBar(
                isConnected = isConnected,
                sessionInfo = sessionInfo,
                activeChainId = activeChainId,
                chains = chains,
                onChainSwitchClick = { showChainSwitcher = true },
                onAccountClick = { showAccountModal = true },
                onConnectClick = { showConnectModal = true }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Hero section
            if (isConnected && sessionInfo != null) {
                HeroSection(
                    address = sessionInfo!!.address,
                    balance = balance,
                    chainSymbol = sessionInfo!!.chainSymbol ?: "ETH"
                )
            } else {
                HeroDisconnected { showConnectModal = true }
            }

            // Quick action buttons
            if (isConnected) {
                QuickActions(
                    onSend = { showSendTx = true },
                    onSign = { showSignMessage = true },
                    onHistory = { showTxHistory = true }
                )
            }

            // SDK Feature Showcase
            SdkFeatureShowcase(
                isConnected = isConnected,
                chains = chains,
                activeChainId = activeChainId
            )

            // BalanceDisplay demo
            if (isConnected) {
                BalanceDisplayDemo(
                    balance = balance,
                    chainSymbol = sessionInfo?.chainSymbol ?: "ETH",
                    address = sessionInfo?.address ?: ""
                )
            }

            // Transaction history preview
            if (txList.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Recent Transactions",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        txList.take(3).forEach { tx ->
                            TransactionRowSimple(tx = tx)
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                        if (txList.size > 3) {
                            TextButton(onClick = { showTxHistory = true }) {
                                Text("View all (${txList.size})")
                            }
                        }
                    }
                }
            }
        }
    }

    // ─── Modals ─────────────────────────────────────────────────────────

    if (showConnectModal) {
        ConnectModal(
            onDismiss = { showConnectModal = false },
            recommendedWalletIds = listOf("metamask", "rainbow", "trust"),
            onWalletConnect = { walletId ->
                viewModel.connect(walletId)
                showConnectModal = false
            }
        )
    }

    if (showAccountModal && isConnected) {
        AccountModal(
            onDismiss = { showAccountModal = false },
            onDisconnect = { viewModel.disconnect() },
            chains = chains,
            activeChainId = activeChainId,
            sessionInfo = sessionInfo
        )
    }

    if (showChainSwitcher) {
        ChainSwitcher(
            chains = chains,
            activeChainId = activeChainId,
            onChainSelected = { chainId ->
                viewModel.switchChain(chainId)
                showChainSwitcher = false
            },
            onDismiss = { showChainSwitcher = false }
        )
    }

    if (showSendTx) {
        SendTransactionDialog(
            onDismiss = { showSendTx = false },
            onSend = { to, amount ->
                viewModel.sendTransaction(to, amount)
                showSendTx = false
            }
        )
    }

    if (showSignMessage) {
        SignMessageDialog(
            onDismiss = { showSignMessage = false },
            onSign = { message ->
                viewModel.signMessage(message)
                showSignMessage = false
            }
        )
    }

    if (showTxHistory) {
        TransactionHistoryDialog(
            transactions = txList,
            onDismiss = { showTxHistory = false }
        )
    }
}

// ============================================================================
// Top Bar
// ============================================================================

@Composable
fun SampleTopBar(
    isConnected: Boolean,
    sessionInfo: SessionInfo?,
    activeChainId: Int,
    chains: List<ChainConfig>,
    onChainSwitchClick: () -> Unit,
    onAccountClick: () -> Unit,
    onConnectClick: () -> Unit
) {
    val colors = CinacoinTheme.colors

    TopAppBar(
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(
                            Brush.linearGradient(
                                listOf(CinacoinBrandColor, CinacoinBrandColorLight)
                            ),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🔢", fontSize = 14.sp)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Cinacoin SDK",
                    fontWeight = FontWeight.Bold
                )
            }
        },
        actions = {
            if (isConnected) {
                // Chain switcher
                val activeChain = chains.find { it.id == activeChainId }
                OutlinedButton(
                    onClick = onChainSwitchClick,
                    modifier = Modifier.height(32.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = colors.textPrimary
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp)
                ) {
                    if (activeChain != null) {
                        ChainIcon(chainId = activeChain.id, size = 16.dp)
                        Spacer(modifier = Modifier.width(4.dp))
                    }
                    Text(
                        text = activeChain?.name ?: "Chain",
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Icon(
                        imageVector = Icons.Default.ArrowDropDown,
                        contentDescription = "Switch chain",
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))

                // Account button
                FilledTonalButton(
                    onClick = onAccountClick,
                    modifier = Modifier.height(32.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountCircle,
                        contentDescription = "Account",
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = sessionInfo?.address?.let {
                            "${it.take(6)}…${it.takeLast(4)}"
                        } ?: "Account",
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            } else {
                // Connect button
                Button(
                    onClick = onConnectClick,
                    modifier = Modifier.height(32.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Wallet,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Connect", fontSize = 12.sp)
                }
            }
        }
    )
}

// ============================================================================
// Hero Sections
// ============================================================================

@Composable
fun HeroSection(address: String, balance: String, chainSymbol: String) {
    val colors = CinacoinTheme.colors

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surfaceCard),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(
                        Brush.radialGradient(
                            listOf(CinacoinBrandColor, CinacoinBrandColorLight, Color(0xFF818CF8))
                        ),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🔢", fontSize = 28.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "${address.take(6)}…${address.takeLast(4)}",
                style = CinacoinTheme.typography.labelLarge,
                color = colors.textSecondary
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Balance",
                style = CinacoinTheme.typography.bodyMedium,
                color = colors.textTertiary
            )
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = balance,
                    style = CinacoinTheme.typography.displayMedium,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )
                Text(
                    text = chainSymbol,
                    style = CinacoinTheme.typography.labelLarge,
                    color = colors.accent
                )
            }
        }
    }
}

@Composable
fun HeroDisconnected(onConnect: () -> Unit) {
    val colors = CinacoinTheme.colors

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surfaceCard),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .background(colors.accent.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🔗", fontSize = 36.sp)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Connect Your Wallet",
                style = CinacoinTheme.typography.headlineMedium,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Connect a WalletConnect-compatible wallet to start exploring the Cinacoin SDK.",
                style = CinacoinTheme.typography.bodyMedium,
                color = colors.textSecondary,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onConnect) {
                Icon(Icons.Default.Wallet, null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Connect Wallet")
            }
        }
    }
}

// ============================================================================
// Quick Actions
// ============================================================================

@Composable
fun QuickActions(onSend: () -> Unit, onSign: () -> Unit, onHistory: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        QuickActionCard(Icons.Default.ArrowUpward, "Send", onSend, Modifier.weight(1f))
        QuickActionCard(Icons.Default.Edit, "Sign", onSign, Modifier.weight(1f))
        QuickActionCard(Icons.Default.History, "History", onHistory, Modifier.weight(1f))
    }
}

@Composable
fun QuickActionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = CinacoinTheme.colors

    Card(
        modifier = modifier.clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = colors.surfaceCard),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, label, tint = colors.accent, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = label, style = CinacoinTheme.typography.labelMedium, color = colors.textPrimary)
        }
    }
}

// ============================================================================
// Balance Display Demo
// ============================================================================

@Composable
fun BalanceDisplayDemo(balance: String, chainSymbol: String, address: String) {
    val colors = CinacoinTheme.colors

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surfaceCard),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "BalanceDisplay Component",
                style = CinacoinTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                // Avatar circle
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(
                            Brush.radialGradient(
                                listOf(CinacoinBrandColor, CinacoinBrandColorLight, Color(0xFF818CF8))
                            ),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "💰", fontSize = 20.sp)
                }

                Column {
                    Text(
                        text = "Balance",
                        style = CinacoinTheme.typography.bodySmall,
                        color = colors.textTertiary
                    )
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = balance,
                            style = CinacoinTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = chainSymbol,
                            style = CinacoinTheme.typography.labelMedium,
                            color = colors.accent
                        )
                    }
                    Text(
                        text = "${address.take(6)}…${address.takeLast(4)}",
                        style = CinacoinTheme.typography.bodySmall,
                        color = colors.textTertiary,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

// ============================================================================
// SDK Feature Showcase
// ============================================================================

@Composable
fun SdkFeatureShowcase(isConnected: Boolean, chains: List<ChainConfig>, activeChainId: Int) {
    val colors = CinacoinTheme.colors

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surfaceCard),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "SDK Features",
                style = CinacoinTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(12.dp))

            listOf(
                Triple(Icons.Default.Build, "SDK Initialization", "CinacoinSDK.initialize()"),
                Triple(Icons.Default.Wallet, "WalletConnect v2", "connect(walletId)"),
                Triple(Icons.Default.SwapHoriz, "Chain Switching", "switchChain(chainId)"),
                Triple(Icons.Default.Face, "Session Management", "sessionInfo StateFlow"),
                Triple(Icons.Default.VpnKey, "Message Signing", "signerManager.personalSign()"),
                Triple(Icons.Default.Send, "Transaction Sending", "transactionManager.send()"),
                Triple(Icons.Default.Storage, "Encrypted Storage", "storageManager"),
                Triple(Icons.Default.Wifi, "Network Monitor", "networkMonitor.status"),
                Triple(Icons.Default.Refresh, "Event System", "sdk.events StateFlow"),
                Triple(Icons.Default.Palette, "Theme Support", "CinacoinTheme (dark/light)"),
            ).forEach { (icon, title, api) ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(icon, null, tint = if (isConnected) colors.success else colors.textTertiary, modifier = Modifier.size(20.dp))
                    Column {
                        Text(text = title, style = CinacoinTheme.typography.labelLarge, color = colors.textPrimary)
                        Text(text = api, style = CinacoinTheme.typography.bodySmall, color = colors.textTertiary, fontFamily = FontFamily.Monospace)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (chains.isNotEmpty()) {
                Divider(color = colors.border, thickness = 0.5.dp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Configured Chains",
                    style = CinacoinTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary
                )
                Spacer(modifier = Modifier.height(8.dp))
                chains.forEach { chain ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ChainIcon(chainId = chain.id, size = 20.dp)
                        Text(text = chain.name, style = CinacoinTheme.typography.bodyMedium, color = colors.textPrimary)
                        if (chain.id == activeChainId) {
                            Spacer(modifier = Modifier.weight(1f))
                            Text(text = "Active", style = CinacoinTheme.typography.labelSmall, color = colors.accent, fontWeight = FontWeight.SemiBold)
                        }
                        if (chain.testnet) {
                            Spacer(modifier = Modifier.weight(1f))
                            Text(text = "Testnet", style = CinacoinTheme.typography.labelSmall, color = colors.warning)
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================
// Chain Icon — local helper (avoids dependency on SDK UI package)
// ============================================================================

@Composable
fun ChainIcon(chainId: Int, size: androidx.compose.ui.unit.Dp, modifier: Modifier = Modifier) {
    val iconColor = when (chainId) {
        1 -> Color(0xFF627EEA)
        137 -> Color(0xFF8247E5)
        42161 -> Color(0xFF28A0F0)
        8453 -> Color(0xFF0052FF)
        10 -> Color(0xFFFF0420)
        56 -> Color(0xFFF0B90B)
        11155111 -> Color(0xFFA0A0A0)
        else -> Color(0xFF64748B)
    }
    val shortName = when (chainId) {
        1 -> "Ξ"
        137 -> "⬡"
        42161 -> "A"
        8453 -> "b"
        10 -> "O"
        56 -> "B"
        else -> "⛓"
    }
    Box(
        modifier = modifier
            .size(size)
            .background(iconColor.copy(alpha = 0.2f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = shortName,
            color = iconColor,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value * 0.5f).sp
        )
    }
}

// ============================================================================
// Simple Transaction Row
// ============================================================================

@Composable
fun TransactionRowSimple(tx: TransactionResult) {
    val colors = CinacoinTheme.colors
    Row(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).padding(4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        val statusColor = if (tx.confirmedAt != null) colors.success else colors.warning
        Box(modifier = Modifier.size(8.dp).background(statusColor, CircleShape))
        Text(
            text = "${tx.hash.take(10)}…${tx.hash.takeLast(6)}",
            style = CinacoinTheme.typography.labelMedium,
            color = colors.textPrimary,
            fontFamily = FontFamily.Monospace
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(text = "${tx.confirmations} conf", style = CinacoinTheme.typography.labelSmall, color = colors.textTertiary)
    }
}

// ============================================================================
// Dialogs
// ============================================================================

@Composable
fun SendTransactionDialog(onDismiss: () -> Unit, onSend: (to: String, amount: String) -> Unit) {
    val colors = CinacoinTheme.colors
    var toAddress by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Send Transaction", color = colors.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = toAddress, onValueChange = { toAddress = it },
                    label = { Text("Recipient Address") },
                    placeholder = { Text("0x...") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = colors.textPrimary, unfocusedTextColor = colors.textPrimary,
                        focusedBorderColor = colors.accent, unfocusedBorderColor = colors.border
                    )
                )
                OutlinedTextField(
                    value = amount, onValueChange = { amount = it },
                    label = { Text("Amount (wei)") },
                    placeholder = { Text("1000000000000000000") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = colors.textPrimary, unfocusedTextColor = colors.textPrimary,
                        focusedBorderColor = colors.accent, unfocusedBorderColor = colors.border
                    )
                )
            }
        },
        confirmButton = {
            Button(onClick = { onSend(toAddress, amount) }, enabled = toAddress.isNotBlank() && amount.isNotBlank()) { Text("Send") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = colors.textSecondary) } },
        containerColor = colors.surfaceCard
    )
}

@Composable
fun SignMessageDialog(onDismiss: () -> Unit, onSign: (message: String) -> Unit) {
    val colors = CinacoinTheme.colors
    var message by remember { mutableStateOf("Hello from Cinacoin SDK!") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Sign Message", color = colors.textPrimary) },
        text = {
            OutlinedTextField(
                value = message, onValueChange = { message = it },
                label = { Text("Message to sign") },
                modifier = Modifier.fillMaxWidth().height(120.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = colors.textPrimary, unfocusedTextColor = colors.textPrimary,
                    focusedBorderColor = colors.accent, unfocusedBorderColor = colors.border
                )
            )
        },
        confirmButton = {
            Button(onClick = { onSign(message) }, enabled = message.isNotBlank()) {
                Icon(Icons.Default.VpnKey, null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Sign")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = colors.textSecondary) } },
        containerColor = colors.surfaceCard
    )
}

@Composable
fun TransactionHistoryDialog(transactions: List<TransactionResult>, onDismiss: () -> Unit) {
    val colors = CinacoinTheme.colors

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Transaction History", color = colors.textPrimary) },
        text = {
            if (transactions.isEmpty()) {
                Column(modifier = Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "📋", fontSize = 48.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = "No transactions yet", style = CinacoinTheme.typography.titleMedium, color = colors.textSecondary)
                }
            } else {
                LazyColumn(modifier = Modifier.heightIn(max = 400.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(transactions, key = { it.hash }) { tx ->
                        TransactionRowSimple(tx = tx)
                        Spacer(modifier = Modifier.height(4.dp))
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close", color = colors.accent) } },
        containerColor = colors.surfaceCard
    )
}

// ============================================================================
// ConnectModal — Wallet picker for sample app
// ============================================================================

@Composable
fun ConnectModal(
    onDismiss: () -> Unit,
    recommendedWalletIds: List<String> = emptyList(),
    onWalletConnect: (walletId: String) -> Unit
) {
    val colors = CinacoinTheme.colors

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth().fillMaxHeight(0.6f),
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Connect Wallet", style = CinacoinTheme.typography.headlineMedium, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, "Close", tint = colors.textSecondary)
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    Triple("metamask", "MetaMask", "🦊"),
                    Triple("walletconnect", "WalletConnect", "🔗"),
                    Triple("coinbase", "Coinbase Wallet", "🔵"),
                    Triple("rainbow", "Rainbow", "🌈"),
                    Triple("trust", "Trust Wallet", "🛡️"),
                    Triple("phantom", "Phantom", "👻"),
                    Triple("zerion", "Zerion", "⚡")
                ).forEach { (id, name, emoji) ->
                    val isRecommended = id in recommendedWalletIds
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onWalletConnect(id) },
                        colors = CardDefaults.cardColors(containerColor = colors.surfaceCard),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(text = emoji, fontSize = 24.sp)
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = name, style = CinacoinTheme.typography.labelLarge, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                                if (isRecommended) {
                                    Text(text = "Recommended", style = CinacoinTheme.typography.labelSmall, color = colors.accent)
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {},
        containerColor = colors.surfaceCard
    )
}

// ============================================================================
// AccountModal — Connected account details for sample app
// ============================================================================

@Composable
fun AccountModal(
    onDismiss: () -> Unit,
    onDisconnect: () -> Unit,
    chains: List<ChainConfig>,
    activeChainId: Int,
    sessionInfo: SessionInfo?
) {
    val colors = CinacoinTheme.colors

    if (sessionInfo == null) {
        onDismiss()
        return
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Account", color = colors.textPrimary) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(
                            Brush.radialGradient(listOf(CinacoinBrandColor, CinacoinBrandColorLight, Color(0xFF818CF8))),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🔢", fontSize = 28.sp)
                }

                Text(
                    text = sessionInfo.address,
                    style = CinacoinTheme.typography.labelLarge,
                    fontFamily = FontFamily.Monospace,
                    color = colors.textPrimary
                )

                val activeChain = chains.find { it.id == activeChainId }
                if (activeChain != null) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ChainIcon(chainId = activeChain.id, size = 20.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = activeChain.name, style = CinacoinTheme.typography.bodyMedium, color = colors.textSecondary)
                    }
                }

                Text(
                    text = "Connected since ${sessionInfo.connectedAt}",
                    style = CinacoinTheme.typography.bodySmall,
                    color = colors.textTertiary
                )
            }
        },
        confirmButton = {},
        dismissButton = {
            Button(
                onClick = { onDisconnect(); onDismiss() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.error.copy(alpha = 0.15f),
                    contentColor = colors.error
                )
            ) {
                Icon(Icons.Default.PowerSettingsNew, null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Disconnect")
            }
        },
        containerColor = colors.surfaceCard
    )
}

// ============================================================================
// ChainSwitcher — Chain picker for sample app
// ============================================================================

@Composable
fun ChainSwitcher(
    chains: List<ChainConfig>,
    activeChainId: Int,
    onChainSelected: (chainId: Int) -> Unit,
    onDismiss: () -> Unit
) {
    val colors = CinacoinTheme.colors

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Switch Network", color = colors.textPrimary) },
        text = {
            LazyColumn(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                items(chains) { chain ->
                    val isActive = chain.id == activeChainId
                    Row(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable { onChainSelected(chain.id) }.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ChainIcon(chainId = chain.id, size = 28.dp)
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = chain.name, style = CinacoinTheme.typography.bodyLarge, color = colors.textPrimary)
                            if (chain.testnet) {
                                Text(text = "Testnet", style = CinacoinTheme.typography.labelSmall, color = colors.warning)
                            }
                        }
                        if (isActive) {
                            Icon(Icons.Default.Check, "Active", tint = colors.accent, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = colors.textSecondary) } },
        containerColor = colors.surfaceCard
    )
}
