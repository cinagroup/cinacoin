package com.cinacoin.sdk

import android.content.Context
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations

/**
 * Unit tests for WalletConnectManager.
 * Tests connection, pairing, session management, and request handling.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class WalletConnectManagerTest {

    @Mock
    private lateinit var mockContext: Context

    private lateinit var wcManager: WalletConnectManager
    private lateinit var config: CinacoinConfig

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        config = CinacoinConfig(
            projectId = "test-project-id",
            relayUrl = "wss://relay.walletconnect.com",
            chains = listOf(
                ChainConfig(id = 1, name = "Ethereum", rpcUrl = "https://eth.example.com")
            )
        )
        wcManager = WalletConnectManager()
        wcManager.initialize(mockContext, config)
    }

    @Test
    fun `createPairing should generate valid WC v2 URI`() = runTest {
        // Act
        val uri = wcManager.createPairing()

        // Assert
        assertNotNull(uri)
        assertTrue(uri.startsWith("wc:"))
        assertTrue(uri.contains("@2"))
        assertTrue(uri.contains("bridge="))
        assertTrue(uri.contains("relay-protocol="))
    }

    @Test
    fun `getConnectors should return list of supported wallets`() {
        // Act
        val connectors = wcManager.getConnectors()

        // Assert
        assertNotNull(connectors)
        assertTrue(connectors.isNotEmpty())
        assertTrue(connectors.any { it.id == "walletconnect" })
        assertTrue(connectors.any { it.id == "metamask" })
        assertTrue(connectors.any { it.id == "rainbow" })
    }

    @Test
    fun `disconnect should clear session state`() = runTest {
        // Arrange - simulate connected state
        wcManager.connect("walletconnect")

        // Act
        wcManager.disconnect()

        // Assert
        assertNull(wcManager.connectedAddress.value)
        assertNull(wcManager.activeSession.value)
    }

    @Test(expected = CinacoinError.WalletConnectError::class)
    fun `personalSign should throw when not connected`() = runTest {
        // Arrange
        val message = "Test message"
        val address = "0x1234567890abcdef1234567890abcdef12345678"

        // Act - should throw because not connected
        wcManager.personalSign(message, address)
    }

    @Test(expected = CinacoinError.WalletConnectError::class)
    fun `signTypedData should throw when not connected`() = runTest {
        // Arrange
        val typedData = """{"domain": {"name": "Test"}}"""
        val address = "0x1234567890abcdef1234567890abcdef12345678"

        // Act - should throw because not connected
        wcManager.signTypedData(typedData, address)
    }

    @Test(expected = CinacoinError.WalletConnectError::class)
    fun `sendTransaction should throw when not connected`() = runTest {
        // Arrange
        val params = TransactionParams(
            from = "0x1234567890abcdef1234567890abcdef12345678",
            to = "0xabcdef1234567890abcdef1234567890abcdef12",
            value = "0x0"
        )

        // Act - should throw because not connected
        wcManager.sendTransaction(params)
    }

    @Test
    fun `switchChain should return true when connected`() = runTest {
        // Arrange
        wcManager.connect("walletconnect")

        // Act
        val result = wcManager.switchChain(137) // Polygon

        // Assert
        assertTrue(result)
    }

    @Test(expected = CinacoinError.WalletConnectError::class)
    fun `switchChain should throw when not connected`() = runTest {
        // Act - should throw because not connected
        wcManager.switchChain(137)
    }

    @Test
    fun `fetchBalance should return hex string when connected`() = runTest {
        // Arrange
        wcManager.connect("walletconnect")
        val address = "0x1234567890abcdef1234567890abcdef12345678"

        // Act
        val balance = wcManager.fetchBalance(address, 1)

        // Assert
        assertNotNull(balance)
        assertTrue(balance.startsWith("0x"))
    }

    @Test(expected = CinacoinError.WalletConnectError::class)
    fun `fetchBalance should throw when not connected`() = runTest {
        // Arrange
        val address = "0x1234567890abcdef1234567890abcdef12345678"

        // Act - should throw because not connected
        wcManager.fetchBalance(address, 1)
    }

    @Test
    fun `isWalletInstalled should return false for unknown wallet`() {
        // Act
        val result = wcManager.isWalletInstalled("unknown-wallet")

        // Assert
        assertFalse(result)
    }
}
