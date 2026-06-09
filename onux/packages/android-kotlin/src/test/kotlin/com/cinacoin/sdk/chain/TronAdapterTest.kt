package com.cinacoin.sdk.chain

import com.cinacoin.chain.TronAdapter
import com.cinacoin.chain.TronError
import com.cinacoin.chain.TronHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class TronAdapterTest {

    private val testAddress = "TJDENsfBJs4RFETt4X1W2wKCmWTTDRcc9c"

    private fun makeAdapter(
        rpcUrl: String = "https://test.trongrid.io",
        apiKey: String? = null,
        getHandler: (String, Map<String, String>) -> String = { _, _ -> """{"data":[]}""" },
        postHandler: (String, String, Map<String, String>) -> String = { _, _, _ -> """{"result":true,"txid":"tx123"}""" }
    ): TronAdapter {
        val client = object : TronHttpClient {
            override suspend fun get(url: String, headers: Map<String, String>): String = getHandler(url, headers)
            override suspend fun post(url: String, body: String, headers: Map<String, String>): String = postHandler(url, body, headers)
        }
        return TronAdapter(rpcUrl, apiKey, client)
    }

    @Test
    fun `chainName returns tron`() = runTest {
        val adapter = makeAdapter()
        assertEquals("tron", adapter.chainName)
    }

    @Test
    fun `getBalance returns TRX from sun`() = runTest {
        val adapter = makeAdapter(
            getHandler = { _, _ -> """{"data":[{"address":"$testAddress","balance":5000000,"createTime":0,"latestOprationTime":0,"trc20":null}]}""" }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("5.000000", balance)
    }

    @Test
    fun `getBalance returns zero for unknown account`() = runTest {
        val adapter = makeAdapter(
            getHandler = { _, _ -> """{"data":[]}""" }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("0.000000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-tron-address")
        }
    }

    @Test
    fun `sendTransaction returns txid`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _, _ -> """{"result":true,"txid":"abc123def"}""" }
        )
        val txid = adapter.sendTransaction("""{"raw_data":{}}""")
        assertEquals("abc123def", txid)
    }

    @Test
    fun `sendTransaction throws on failure`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _, _ -> """{"result":false,"message":"bandwidth insufficient"}""" }
        )
        assertFailsWith<TronError.RpcError> {
            adapter.sendTransaction("""{"raw_data":{}}""")
        }
    }

    @Test
    fun `getLatestBlock returns block number`() = runTest {
        val adapter = makeAdapter(
            getHandler = { _, _ -> """[{"block_header":{"raw_data":{"number":55000000,"timestamp":1700000000000}}}]""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(55000000L, block)
    }

    @Test
    fun `estimateFee returns bandwidth cost`() = runTest {
        val adapter = makeAdapter()
        val fee = adapter.estimateFee()
        assertEquals("268", fee)
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
    fun `isValidAddress accepts TRON base58 addresses`() {
        assertTrue(TronAdapter.isValidAddress("TJDENsfBJs4RFETt4X1W2wKCmWTTDRcc9c"))
        assertTrue(TronAdapter.isValidAddress("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"))
        assertFalse(TronAdapter.isValidAddress("0x1234567890abcdef"))
        assertFalse(TronAdapter.isValidAddress("short"))
    }

    @Test
    fun `sunToTrx conversion`() {
        assertEquals("1.000000", TronAdapter.sunToTrx(1_000_000))
        assertEquals("0.000001", TronAdapter.sunToTrx(1))
        assertEquals("5.500000", TronAdapter.sunToTrx(5_500_000))
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            getHandler = { url, _ ->
                when {
                    url.contains("/accounts/") -> """{"data":[{"address":"$testAddress","balance":10000000,"createTime":0}]}"""
                    url.contains("/blocks") -> """[{"block_header":{"raw_data":{"number":100}}}]"""
                    else -> """{"data":[]}"""
                }
            },
            postHandler = { _, _, _ -> """{"result":true,"txid":"tx1"}""" }
        )

        val balance = adapter.request("tron_getBalance", listOf(testAddress))
        assertEquals("10.000000", balance.toString().trim('"'))

        val blockNum = adapter.request("tron_getBlockNumber")
        assertEquals("100", blockNum.toString().trim('"'))

        assertFailsWith<TronError.UnsupportedMethod> {
            adapter.request("tron_unknown")
        }
    }

    @Test
    fun `apiKey header is passed`() = runTest {
        var capturedHeaders: Map<String, String>? = null
        val adapter = makeAdapter(
            apiKey = "test-tron-key",
            getHandler = { _, headers ->
                capturedHeaders = headers
                """{"data":[]}"""
            }
        )
        adapter.getBalance(testAddress)
        assertEquals("test-tron-key", capturedHeaders?.get("TRON-PRO-API-KEY"))
    }

    @Test
    fun `TronError messages`() {
        val invalidAddr = TronError.InvalidAddress("bad")
        assertEquals("Invalid TRON address: bad", invalidAddr.message)

        assertEquals("Not connected to a TRON wallet", TronError.NotConnected.message)

        val rpcErr = TronError.RpcError("timeout")
        assertEquals("TronGrid API error: timeout", rpcErr.message)
    }
}
