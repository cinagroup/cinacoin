package com.cinacoin.sdk.chain

import com.cinacoin.chain.SuiAdapter
import com.cinacoin.chain.SuiError
import com.cinacoin.chain.SuiHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class SuiAdapterTest {

    private val testAddress = "0x02b5e5d4e84d6b1c7f93a21c8e9d0f6a4b3c5d7e9f1a3b5c7d9e0f2a4b6c8d0e"

    private fun makeAdapter(
        rpcUrl: String = "https://test.rpc.sui.io",
        postHandler: (String, String) -> String = { _, _ -> """{"jsonrpc":"2.0","result":{"totalBalance":"1000000000","coinType":"0x2::sui::SUI","coinObjectCount":1},"id":1}""" }
    ): SuiAdapter {
        val client = object : SuiHttpClient {
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return SuiAdapter(rpcUrl, client)
    }

    @Test
    fun `chainName returns sui`() = runTest {
        val adapter = makeAdapter()
        assertEquals("sui", adapter.chainName)
    }

    @Test
    fun `getBalance returns SUI from MIST`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":{"totalBalance":"5000000000","coinType":"0x2::sui::SUI","coinObjectCount":2},"id":1}""" }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("5.000000000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-sui-address")
        }
    }

    @Test
    fun `getCoinBalance returns coin-specific balance`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":{"totalBalance":"2500000000","coinType":"0x2::sui::SUI","coinObjectCount":1},"id":1}""" }
        )
        val balance = adapter.getCoinBalance(testAddress, "0x2::sui::SUI")
        assertEquals("2.500000000", balance)
    }

    @Test
    fun `sendTransaction returns digest`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                if (body.contains("sui_executeTransactionBlock")) {
                    """{"jsonrpc":"2.0","result":"5jK9bGnM3pN7qR2sT8uV1wX3yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX","id":1}"""
                } else {
                    """{"jsonrpc":"2.0","result":{"totalBalance":"0","coinType":"0x2::sui::SUI","coinObjectCount":0},"id":1}"""
                }
            }
        )
        val digest = adapter.sendTransaction("txBytesBase64==", listOf("sigBase64=="))
        assertEquals("5jK9bGnM3pN7qR2sT8uV1wX3yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX", digest)
    }

    @Test
    fun `getLatestBlock returns checkpoint sequence`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":"12345678","id":1}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(12345678L, block)
    }

    @Test
    fun `estimateFee returns standard MIST fee`() = runTest {
        val adapter = makeAdapter()
        val fee = adapter.estimateFee()
        assertEquals("100000", fee)
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
    fun `isValidAddress accepts hex addresses`() {
        assertTrue(SuiAdapter.isValidAddress("0x2"))
        assertTrue(SuiAdapter.isValidAddress("0x02b5e5d4e84d6b1c7f93a21c8e9d0f6a4b3c5d7e9f1a3b5c7d9e0f2a4b6c8d0e"))
        // Invalid
        assertFalse(SuiAdapter.isValidAddress("not-hex"))
        assertFalse(SuiAdapter.isValidAddress("0xZZZZ")) // not hex
    }

    @Test
    fun `mistToSui conversion`() {
        assertEquals("1.000000000", SuiAdapter.mistToSui("1000000000"))
        assertEquals("0.000000001", SuiAdapter.mistToSui("1"))
        assertEquals("5.500000000", SuiAdapter.mistToSui("5500000000"))
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                when {
                    body.contains("suix_getBalance") -> """{"jsonrpc":"2.0","result":{"totalBalance":"3000000000","coinType":"0x2::sui::SUI","coinObjectCount":1},"id":1}"""
                    body.contains("sui_getLatestCheckpointSequenceNumber") -> """{"jsonrpc":"2.0","result":"200","id":1}"""
                    else -> """{"jsonrpc":"2.0","result":{},"id":1}"""
                }
            }
        )

        val balance = adapter.request("sui_getBalance", listOf(testAddress))
        assertEquals("3.000000000", balance.toString().trim('"'))

        val blockNum = adapter.request("sui_getBlockNumber")
        assertEquals("200", blockNum.toString().trim('"'))

        assertFailsWith<SuiError.UnsupportedMethod> {
            adapter.request("sui_unknown")
        }
    }

    @Test
    fun `endpoint setter updates rpcUrl`() = runTest {
        val adapter = makeAdapter("https://old.sui.io")
        assertEquals("https://old.sui.io", adapter.endpoint)
        adapter.endpoint = "https://fullnode.mainnet.sui.io"
        assertEquals("https://fullnode.mainnet.sui.io", adapter.endpoint)
    }
}
