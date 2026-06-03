package com.cinacoin.sdk

import org.junit.Test
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertFalse

class TypesTest {

    @Test
    fun `ChainConfig defaults include all major chains`() {
        val defaults = ChainConfig.defaults
        val ids = defaults.map { it.id }

        assertEquals(6, defaults.size)
        assertTrue(ids.contains(1))      // Ethereum
        assertTrue(ids.contains(137))    // Polygon
        assertTrue(ids.contains(42161))  // Arbitrum
        assertTrue(ids.contains(8453))   // Base
        assertTrue(ids.contains(10))     // Optimism
        assertTrue(ids.contains(56))     // BSC
    }

    @Test
    fun `ChainConfig chainRef returns correct CAIP-2 format`() {
        val eth = ChainConfig.ethereum
        assertEquals("eip155:1", eth.chainRef)

        val arb = ChainConfig.arbitrum
        assertEquals("eip155:42161", arb.chainRef)
    }

    @Test
    fun `ChainConfig testnet flag`() {
        assertTrue(ChainConfig.sepolia.testnet)
        assertFalse(ChainConfig.ethereum.testnet)
    }

    @Test
    fun `CinacoinError hierarchy`() {
        val notInit = CinacoinError.NotInitialized()
        assertTrue(notInit is CinacoinError)
        assertTrue(notInit.message.contains("not initialized"))

        val userRejected = CinacoinError.UserRejected()
        assertTrue(userRejected.message.contains("rejected"))

        val custom = CinacoinError.WalletConnectError("custom error")
        assertEquals("custom error", custom.message)
    }

    @Test
    fun `TransactionResult serialization`() {
        val result = TransactionResult(
            hash = "0xabc123",
            chainId = 1,
            confirmations = 3
        )
        assertEquals("0xabc123", result.hash)
        assertEquals(1, result.chainId)
        assertEquals(3, result.confirmations)
    }

    @Test
    fun `SignatureResult contains signature`() {
        val sig = SignatureResult(signature = "0xdeadbeef")
        assertEquals("0xdeadbeef", sig.signature)
    }

    @Test
    fun `ConnectorInfo types`() {
        val wc = ConnectorInfo("walletconnect", "WalletConnect", type = ConnectorType.WALLETCONNECT)
        assertEquals("walletconnect", wc.id)
        assertEquals(ConnectorType.WALLETCONNECT, wc.type)
    }

    @Test
    fun `SessionInfo contains all fields`() {
        val now = java.time.Instant.now()
        val session = SessionInfo(
            topic = "topic-123",
            address = "0x1234",
            chainId = 1,
            chainSymbol = "ETH",
            connectedAt = now,
            expiry = now.plusSeconds(604800)
        )
        assertEquals("topic-123", session.topic)
        assertEquals("0x1234", session.address)
        assertEquals("ETH", session.chainSymbol)
        assertEquals(1, session.chainId)
    }

    @Test
    fun `SdkEvent sealed class`() {
        val connected = SdkEvent.WalletConnected(
            ConnectionResult(
                address = "0x1",
                chainId = 1,
                chainSymbol = "ETH",
                sessionId = "s1",
                connectorId = "metamask"
            )
        )
        assertTrue(connected is SdkEvent.WalletConnected)

        val disconnected = SdkEvent.WalletDisconnected
        assertTrue(disconnected is SdkEvent.WalletDisconnected)

        val err = SdkEvent.Error(CinacoinError.NetworkError("no network"))
        assertTrue(err is SdkEvent.Error)
    }

    @Test
    fun `ConnectionResult contains required fields`() {
        val result = ConnectionResult(
            address = "0xabc",
            chainId = 137,
            chainSymbol = "MATIC",
            sessionId = "session-1",
            connectorId = "walletconnect"
        )
        assertEquals("0xabc", result.address)
        assertEquals(137, result.chainId)
        assertEquals("MATIC", result.chainSymbol)
        assertEquals("session-1", result.sessionId)
        assertNotNull(result.connectedAt)
    }

    @Test
    fun `NativeCurrency eth defaults`() {
        val eth = NativeCurrency.eth
        assertEquals("Ether", eth.name)
        assertEquals("ETH", eth.symbol)
        assertEquals(18, eth.decimals)
    }
}
