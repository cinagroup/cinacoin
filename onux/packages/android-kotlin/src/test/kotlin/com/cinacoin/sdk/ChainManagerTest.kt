package com.cinacoin.sdk

import org.junit.Test
import org.junit.Assert.*

class ChainManagerTest {

    @Test
    fun `setChains initializes active chain to first element`() {
        val manager = ChainManager()
        val chains = listOf(ChainConfig.ethereum, ChainConfig.polygon)
        manager.setChains(chains)

        assertEquals(chains, manager.supportedChains.value)
        assertEquals(ChainConfig.ethereum, manager.activeChain.value)
    }

    @Test
    fun `getChain returns correct chain`() {
        val manager = ChainManager()
        manager.setChains(ChainConfig.defaults)

        val arb = manager.getChain(42161)
        assertNotNull(arb)
        assertEquals("Arbitrum", arb!!.name)

        val unknown = manager.getChain(999)
        assertNull(unknown)
    }

    @Test
    fun `isSupported returns correct result`() {
        val manager = ChainManager()
        manager.setChains(ChainConfig.defaults)

        assertTrue(manager.isSupported(1))
        assertTrue(manager.isSupported(137))
        assertFalse(manager.isSupported(999999))
    }

    @Test
    fun `getChain returns null and throws ChainNotFound for unsupported chain`() {
        val manager = ChainManager()
        manager.setChains(listOf(ChainConfig.ethereum))
        val chain = manager.getChain(999999)
        assertNull(chain)
        // The ChainNotFound would be thrown by getRpcUrl or switchTo when chain is missing
        var caught = false
        try {
            manager.getRpcUrl(999999)
        } catch (e: CinacoinError.ChainNotFound) {
            caught = true
        }
        assertTrue("Expected ChainNotFound", caught)
    }

    @Test
    fun `getRpcUrl returns correct RPC`() {
        val manager = ChainManager()
        manager.setChains(listOf(ChainConfig.ethereum, ChainConfig.polygon))

        assertEquals("https://eth.llamarpc.com", manager.getRpcUrl(1))
        assertEquals("https://polygon-rpc.com", manager.getRpcUrl(137))
    }

    @Test
    fun `getChainRefs returns CAIP-2 identifiers`() {
        val manager = ChainManager()
        manager.setChains(listOf(ChainConfig.ethereum, ChainConfig.base))

        val refs = manager.getChainRefs()
        assertEquals(listOf("eip155:1", "eip155:8453"), refs)
    }

    @Test
    fun `setChains throws on empty list`() {
        val manager = ChainManager()

        var caught = false
        try {
            manager.setChains(emptyList())
        } catch (e: IllegalArgumentException) {
            caught = true
            assertTrue(e.message!!.contains("At least one chain"))
        }
        assertTrue("Expected IllegalArgumentException", caught)
    }
}
