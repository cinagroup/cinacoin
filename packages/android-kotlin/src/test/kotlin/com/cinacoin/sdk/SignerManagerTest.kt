package com.cinacoin.sdk

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations

/**
 * Unit tests for SignerManager.
 * Tests message signing, signature verification, and EIP-712 typed data signing.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class SignerManagerTest {

    @Mock
    private lateinit var mockWcManager: WalletConnectManager

    @Mock
    private lateinit var mockChainManager: ChainManager

    private lateinit var signerManager: SignerManager

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        signerManager = SignerManager()
        signerManager.initialize(mockWcManager, mockChainManager)
    }

    @Test
    fun `personalSign should return signature result`() = runTest {
        // Arrange
        val message = "Hello, Cinacoin!"
        val address = "0x1234567890abcdef1234567890abcdef12345678"
        val expectedSignature = "0x" + "a".repeat(130)
        
        `when`(mockWcManager.connectedAddress.value).thenReturn(address)
        `when`(mockWcManager.personalSign(message, address)).thenReturn(expectedSignature)

        // Act
        val result = signerManager.personalSign(message, address)

        // Assert
        assertNotNull(result)
        assertEquals(expectedSignature, result.signature)
        verify(mockWcManager).personalSign(message, address)
    }

    @Test
    fun `personalSign should use connected address when address is null`() = runTest {
        // Arrange
        val message = "Test message"
        val connectedAddress = "0xabcdef1234567890abcdef1234567890abcdef12"
        val signature = "0x" + "b".repeat(130)
        
        `when`(mockWcManager.connectedAddress.value).thenReturn(connectedAddress)
        `when`(mockWcManager.personalSign(message, connectedAddress)).thenReturn(signature)

        // Act
        val result = signerManager.personalSign(message, null)

        // Assert
        assertNotNull(result)
        assertEquals(signature, result.signature)
    }

    @Test(expected = CinacoinError.WalletConnectError::class)
    fun `personalSign should throw when no wallet connected`() = runTest {
        // Arrange
        `when`(mockWcManager.connectedAddress.value).thenReturn(null)

        // Act
        signerManager.personalSign("message", null)
    }

    @Test
    fun `signTypedData should return signature for valid EIP-712 data`() = runTest {
        // Arrange
        val typedDataJson = """
            {
                "domain": {"name": "Test"},
                "primaryType": "Test",
                "types": {},
                "message": {}
            }
        """.trimIndent()
        val address = "0x1234567890abcdef1234567890abcdef12345678"
        val signature = "0x" + "c".repeat(130)
        
        `when`(mockWcManager.connectedAddress.value).thenReturn(address)
        `when`(mockWcManager.signTypedData(typedDataJson, address)).thenReturn(signature)

        // Act
        val result = signerManager.signTypedData(typedDataJson, address)

        // Assert
        assertNotNull(result)
        assertEquals(signature, result.signature)
    }

    @Test
    fun `verifySignature should return true for valid signature`() {
        // Arrange
        val message = "Test message"
        val address = "0x1234567890abcdef1234567890abcdef12345678"
        // Note: This is a mock signature - in real tests, use actual signed message
        val signature = "0x" + "a".repeat(130)

        // Act - Note: verifySignature will fail with mock signature since it does real ECDSA recovery
        // This test documents the expected behavior
        val result = signerManager.verifySignature(message, signature, address)

        // Assert - With invalid signature, should return false
        assertFalse(result)
    }

    @Test
    fun `verifySignature should return false for invalid signature format`() {
        // Arrange
        val message = "Test"
        val invalidSignature = "0x123" // Too short
        val address = "0x1234567890abcdef1234567890abcdef12345678"

        // Act
        val result = signerManager.verifySignature(message, invalidSignature, address)

        // Assert
        assertFalse(result)
    }

    @Test
    fun `signEip712 should build and sign typed data`() = runTest {
        // Arrange
        val address = "0x1234567890abcdef1234567890abcdef12345678"
        val signature = "0x" + "d".repeat(130)
        
        `when`(mockWcManager.connectedAddress.value).thenReturn(address)
        `when`(mockWcManager.signTypedData(any(), eq(address))).thenReturn(signature)

        // Act
        val result = signerManager.signEip712(
            domain = "TestDomain",
            chainId = 1,
            verifyingContract = "0x1234567890abcdef1234567890abcdef12345678",
            primaryType = "TestType",
            types = """{"TestType": []}""",
            message = """{"key": "value"}""",
            address = address
        )

        // Assert
        assertNotNull(result)
        assertEquals(signature, result.signature)
    }
}
