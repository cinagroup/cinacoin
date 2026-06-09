package com.cinacoin.sdk.chain

import com.cinacoin.chain.StarknetAdapter
import com.cinacoin.chain.StarknetError
import com.cinacoin.chain.StarknetHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class StarknetAdapterTest {

    private val testAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

    private fun makeAdapter(
        rpcUrl: String = "https://test.starknet-rpc.io",
        postHandler: (String, String) -> String = { _, _ -> """{"jsonrpc":"2.0","result":"1000000000000000000","id":1}""" }
    ): StarknetAdapter {
        val client = object : StarknetHttpClient {
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return StarknetAdapter(rpcUrl, client)
    }

    @Test
    fun `chainName returns starknet`() = runTest {
        val adapter = makeAdapter()
        assertEquals("starknet", adapter.chainName)
    }

    @Test
    fun `getBalance returns ETH from wei`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                if (body.contains("starknet_call")) {
                    """{"jsonrpc":"2.0","result":["1500000000000000000","0"],"id":1}"""
                } else {
                    """{"jsonrpc":"2.0","result":{},"id":1}"""
                }
            }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("1.500000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-starknet-address")
        }
    }

    @Test
    fun `sendTransaction returns tx hash`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":{"transaction_hash":"0xabc123"},"id":1}""" }
        )
        val hash = adapter.sendTransaction("0xsignedTx")
        assertEquals("0xabc123", hash)
    }

    @Test
    fun `getLatestBlock returns block number`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":850000,"id":1}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(850000L, block)
    }

    @Test
    fun `estimateFee returns fee in ETH`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":[{"gas_consumed":"100000","gas_price":"1000000000","overall_fee":"50000000000000"}],"id":1}""" }
        )
        val fee = adapter.estimateFee()
        assertEquals("0.000050", fee)
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
    fun `isValidAddress accepts Starknet hex addresses`() {
        assertTrue(StarknetAdapter.isValidAddress("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"))
        assertTrue(StarknetAdapter.isValidAddress("0x1"))
        assertTrue(StarknetAdapter.isValidAddress("0xABCDEF123456"))
        // Invalid
        assertFalse(StarknetAdapter.isValidAddress("not-hex"))
        assertFalse(StarknetAdapter.isValidAddress("0xGGGG"))
    }

    @Test
    fun `callContract returns list of values`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":["1000000","0"],"id":1}""" }
        )
        val result = adapter.callContract(
            contractAddress = StarknetAdapter.ETH_TOKEN_ADDRESS,
            entryPointSelector = "balance_of",
            calldata = listOf(testAddress)
        )
        assertEquals(2, result.size)
        assertEquals("1000000", result[0])
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                when {
                    body.contains("starknet_call") -> """{"jsonrpc":"2.0","result":["2000000000000000000","0"],"id":1}"""
                    body.contains("starknet_blockNumber") -> """{"jsonrpc":"2.0","result":100,"id":1}"""
                    else -> """{"jsonrpc":"2.0","result":{},"id":1}"""
                }
            }
        )

        val balance = adapter.request("starknet_getBalance", listOf(testAddress))
        assertEquals("2.000000", balance.toString().trim('"'))

        val blockNum = adapter.request("starknet_getBlockNumber")
        assertEquals("100", blockNum.toString().trim('"'))

        assertFailsWith<StarknetError.UnsupportedMethod> {
            adapter.request("starknet_unknown")
        }
    }

    @Test
    fun `weiToEth conversion`() {
        assertEquals("1.000000", StarknetAdapter.weiToEth("1000000000000000000"))
        assertEquals("0.500000", StarknetAdapter.weiToEth("500000000000000000"))
        assertEquals("0.000001", StarknetAdapter.weiToEth("1000000000000"))
    }

    @Test
    fun `StarknetError messages`() {
        val invalidAddr = StarknetError.InvalidAddress("bad")
        assertEquals("Invalid Starknet address: bad", invalidAddr.message)

        assertEquals("Not connected to a Starknet wallet", StarknetError.NotConnected.message)

        val rpcErr = StarknetError.RpcError("timeout")
        assertEquals("Starknet RPC error: timeout", rpcErr.message)
    }
}
