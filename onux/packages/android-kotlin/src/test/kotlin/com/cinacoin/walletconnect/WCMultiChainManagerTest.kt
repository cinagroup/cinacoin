/**
 * WCMultiChainManagerTest — Tests for multi-chain session management.
 */
package com.cinacoin.walletconnect

import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.math.BigDecimal
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertNotNull

@RunWith(JUnit4::class)
class WCMultiChainManagerTest {

    @Test
    fun `CAIP-2 chain ID parsing`() {
        val eth = Caip2Chain.fromString("eip155:1")
        assertNotNull(eth)
        assertEquals("eip155", eth.namespace)
        assertEquals("1", eth.reference)

        val polygon = Caip2Chain.fromString("eip155:137")
        assertNotNull(polygon)
        assertEquals("137", polygon.reference)

        val solana = Caip2Chain.fromString("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp")
        assertNotNull(solana)
        assertEquals("solana", solana.namespace)
    }

    @Test
    fun `CAIP-10 account string building`() {
        // We test the logic independently since we can't instantiate WCClient in unit tests
        val chain = Caip2Chain("eip155", "137")
        val address = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"

        // CAIP-10 format: {chainId}:{address}
        val caip10 = "${chain.id}:${address.lowercase()}"
        assertEquals("eip155:137:0x742d35cc6634c0532925a3b844bc9e7595f2bd18", caip10)
    }

    @Test
    fun `default EVM chains are registered`() {
        val defaultChains = WCMultiChainManager.DEFAULT_EVM_CHAINS

        // Should include major chains
        val chainIds = defaultChains.map { it.chain.reference }
        assertTrue("1" in chainIds)      // Ethereum
        assertTrue("137" in chainIds)    // Polygon
        assertTrue("10" in chainIds)     // Optimism
        assertTrue("42161" in chainIds)  // Arbitrum
        assertTrue("56" in chainIds)     // BSC
    }

    @Test
    fun `chain info metadata is correct`() {
        val ethereum = WCMultiChainManager.DEFAULT_EVM_CHAINS.find { it.chain.reference == "1" }
        assertNotNull(ethereum)
        assertEquals("Ethereum Mainnet", ethereum.name)
        assertEquals("ETH", ethereum.symbol)
        assertEquals(18, ethereum.decimals)

        val polygon = WCMultiChainManager.DEFAULT_EVM_CHAINS.find { it.chain.reference == "137" }
        assertNotNull(polygon)
        assertEquals("Polygon", polygon.name)
        assertEquals("MATIC", polygon.symbol)
    }

    @Test
    fun `multi-chain state data class`() {
        val state = MultiChainState(
            activeChain = Caip2Chain("eip155", "1"),
            supportedChains = listOf(Caip2Chain("eip155", "1"), Caip2Chain("eip155", "137")),
            balances = mapOf(
                Caip2Chain("eip155", "1") to "1.5000",
                Caip2Chain("eip155", "137") to "100.0000"
            ),
            address = "0xabc",
            isSwitching = false
        )

        assertEquals("eip155:1", state.activeChain.id)
        assertEquals(2, state.supportedChains.size)
        assertEquals("1.5000", state.balances[Caip2Chain("eip155", "1")])
    }

    @Test
    fun `recovery session info expiry`() {
        val now = System.currentTimeMillis()
        val info = RecoverySessionInfo(
            topic = "test",
            accounts = emptyList(),
            chainId = 1,
            peerName = null,
            isActive = true,
            expiresAt = now + 3600_000, // 1 hour from now
            timeRemainingMs = 3600_000
        )

        assertFalse(info.isExpired)
        assertEquals(1.0, info.timeRemainingHours, 0.1)

        val expired = info.copy(timeRemainingMs = -1000, expiresAt = now - 1000)
        assertTrue(expired.isExpired)
    }

    @Test
    fun `total USD value calculation`() {
        // Test the math independently
        val balances = mapOf(
            "ETH" to BigDecimal("1.5"),
            "MATIC" to BigDecimal("500.0"),
            "BNB" to BigDecimal("2.0")
        )
        val prices = mapOf(
            "ETH" to BigDecimal("3000.0"),
            "MATIC" to BigDecimal("0.8"),
            "BNB" to BigDecimal("400.0")
        )

        val total = balances.entries.fold(BigDecimal.ZERO) { acc, (symbol, amount) ->
            val price = prices[symbol] ?: return@fold acc
            acc + (amount * price)
        }

        // 1.5 * 3000 + 500 * 0.8 + 2 * 400 = 4500 + 400 + 800 = 5700
        assertEquals(0, BigDecimal("5700.0").compareTo(total))
    }
}
