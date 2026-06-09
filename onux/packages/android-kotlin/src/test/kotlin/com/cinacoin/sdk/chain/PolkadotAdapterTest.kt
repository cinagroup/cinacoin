package com.cinacoin.sdk.chain

import com.cinacoin.chain.PolkadotAdapter
import com.cinacoin.chain.PolkadotError
import com.cinacoin.chain.PolkadotHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class PolkadotAdapterTest {

    // SS58 Polkadot address
    private val testAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviLBx9S5EgbfRN9P4Nz"

    private fun makeAdapter(
        rpcUrl: String = "https://test.polkadot.io",
        postHandler: (String, String) -> String = { _, _ -> """{"jsonrpc":"2.0","result":"1000000000000","id":1}""" }
    ): PolkadotAdapter {
        val client = object : PolkadotHttpClient {
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return PolkadotAdapter(rpcUrl, httpClient = client)
    }

    @Test
    fun `chainName returns polkadot`() = runTest {
        val adapter = makeAdapter()
        assertEquals("polkadot", adapter.chainName)
    }

    @Test
    fun `getBalance returns DOT from plancks`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                if (body.contains("state_queryStorageAt") || body.contains("system_accountNextIndex")) {
                    """{"jsonrpc":"2.0","result":{"data":{"free":"50000000000","reserved":"0","frozen":"0","flags":"0"},"nonce":1},"id":1}"""
                } else {
                    """{"jsonrpc":"2.0","result":{},"id":1}"""
                }
            }
        )
        val balance = adapter.getBalance(testAddress)
        // 50000000000 plancks / 10^10 = 5.0000000000 DOT
        assertEquals("5.0000000000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-polkadot-address")
        }
    }

    @Test
    fun `sendTransaction returns extrinsic hash`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":"0xabc123def456789","id":1}""" }
        )
        val hash = adapter.sendTransaction("0xsignedExtrinsic")
        assertEquals("0xabc123def456789", hash)
    }

    @Test
    fun `getLatestBlock returns block number from hex`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":"0xc350","id":1}""" }
        )
        val block = adapter.getLatestBlock()
        // 0xc350 = 50000
        assertEquals(50000L, block)
    }

    @Test
    fun `getLatestBlock returns block number from decimal`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":"100000","id":1}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(100000L, block)
    }

    @Test
    fun `estimateFee returns standard DOT fee`() = runTest {
        val adapter = makeAdapter()
        val fee = adapter.estimateFee()
        // 1500000000 plancks / 10^10 = 0.15 DOT
        assertEquals("0.1500000000", fee)
    }

    @Test
    fun `setConnectedAddress and disconnect`() = runTest {
        val adapter = makeAdapter()
        assertFalse(adapter.isConnected)

        adapter.setConnectedAddress(testAddress)
        assertTrue(adapter.isConnected)
        assertEquals(testAddress, adapter.connectedAddress)

        adapter.disconnect()
        assertFalse(adapter.isConnected)
        assertNull(adapter.connectedAddress)
    }

    @Test
    fun `isValidAddress accepts SS58 addresses`() {
        assertTrue(PolkadotAdapter.isValidAddress("15oF4uVJwmo4TdGW7VfQxNLavjCXviLBx9S5EgbfRN9P4Nz"))
        assertTrue(PolkadotAdapter.isValidAddress("13UVJyLnbVp9RBZYFwFGyDvVd1y27StTb26SSAUZULmXc57"))
        // Invalid - too short
        assertFalse(PolkadotAdapter.isValidAddress("1aB"))
        // Invalid - contains base58-unsupported chars
        assertFalse(PolkadotAdapter.isValidAddress("1aB0lI"))
    }

    @Test
    fun `plancksToDot conversion`() {
        assertEquals("1.0000000000", PolkadotAdapter.plancksToDot("10000000000"))
        assertEquals("0.0000000001", PolkadotAdapter.plancksToDot("1"))
        assertEquals("5.5000000000", PolkadotAdapter.plancksToDot("55000000000"))
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                when {
                    body.contains("chain_getBlockNumber") -> """{"jsonrpc":"2.0","result":"0x1f4","id":1}"""
                    body.contains("system_accountNextIndex") -> """{"jsonrpc":"2.0","result":{"data":{"free":"30000000000","reserved":"0","frozen":"0","flags":"0"},"nonce":1},"id":1}"""
                    else -> """{"jsonrpc":"2.0","result":{},"id":1}"""
                }
            }
        )

        val blockNum = adapter.request("dot_getBlockNumber")
        assertEquals("500", blockNum.toString().trim('"'))

        val balance = adapter.request("dot_getBalance", listOf(testAddress))
        assertEquals("3.0000000000", balance.toString().trim('"'))

        assertFailsWith<PolkadotError.UnsupportedMethod> {
            adapter.request("dot_unknown")
        }
    }

    @Test
    fun `endpoint setter updates rpcUrl`() = runTest {
        val adapter = makeAdapter("https://old.polkadot.io")
        assertEquals("https://old.polkadot.io", adapter.endpoint)
        adapter.endpoint = "https://rpc.polkadot.io"
        assertEquals("https://rpc.polkadot.io", adapter.endpoint)
    }
}
