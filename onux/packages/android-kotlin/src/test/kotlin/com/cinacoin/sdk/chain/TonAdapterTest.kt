package com.cinacoin.sdk.chain

import com.cinacoin.chain.TonAdapter
import com.cinacoin.chain.TonError
import com.cinacoin.chain.TonHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class TonAdapterTest {

    private val testAddress = "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"

    private fun makeAdapter(
        rpcUrl: String = "https://test.toncenter.com/api/v2",
        apiKey: String? = null,
        getHandler: (String, Map<String, String>) -> String = { _, _ -> """{"ok":true,"result":"0"}""" },
        postHandler: (String, String, Map<String, String>) -> String = { _, _, _ -> """{"ok":true,"result":{"messageHash":"hash123","lastBlock":1}}""" }
    ): TonAdapter {
        val client = object : TonHttpClient {
            override suspend fun get(url: String, headers: Map<String, String>): String = getHandler(url, headers)
            override suspend fun post(url: String, body: String, headers: Map<String, String>): String = postHandler(url, body, headers)
        }
        return TonAdapter(rpcUrl, apiKey, client)
    }

    @Test
    fun `chainName returns ton`() = runTest {
        val adapter = makeAdapter()
        assertEquals("ton", adapter.chainName)
    }

    @Test
    fun `getBalance returns TON from nanotons`() = runTest {
        val adapter = makeAdapter(
            getHandler = { _, _ -> """{"ok":true,"result":"2500000000"}""" }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("2.500000000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-ton-address")
        }
    }

    @Test
    fun `getBalance throws on API failure`() = runTest {
        val adapter = makeAdapter(
            getHandler = { _, _ -> """{"ok":false,"result":"0"}""" }
        )
        assertFailsWith<TonError.RpcError> {
            adapter.getBalance(testAddress)
        }
    }

    @Test
    fun `sendTransaction returns message hash`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _, _ -> """{"ok":true,"result":{"messageHash":"deadbeef","lastBlock":42}}""" }
        )
        val hash = adapter.sendTransaction("base64boc==")
        assertEquals("deadbeef", hash)
    }

    @Test
    fun `getLatestBlock returns seqno`() = runTest {
        val adapter = makeAdapter(
            getHandler = { _, _ -> """{"ok":true,"result":{"seqno":12345,"workchain":-1,"shard":"8000000000000000","rootHash":"abc","fileHash":"def","genUtime":1700000000}}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(12345L, block)
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
    fun `isValidAddress accepts raw and user-friendly formats`() {
        // User-friendly EQ address
        assertTrue(TonAdapter.isValidAddress("EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"))
        // User-friendly UQ address
        assertTrue(TonAdapter.isValidAddress("UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"))
        // Raw format
        assertTrue(TonAdapter.isValidAddress("-1:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"))
        // Invalid
        assertFalse(TonAdapter.isValidAddress("invalid"))
        assertFalse(TonAdapter.isValidAddress("EQshort"))
    }

    @Test
    fun `nanotonToTon conversion`() {
        assertEquals("1.000000000", TonAdapter.nanotonToTon("1000000000"))
        assertEquals("0.000000001", TonAdapter.nanotonToTon("1"))
        assertEquals("2.500000000", TonAdapter.nanotonToTon("2500000000"))
    }

    @Test
    fun `estimateFee returns standard fee`() = runTest {
        val adapter = makeAdapter()
        val fee = adapter.estimateFee()
        assertEquals("0.005", fee)
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            getHandler = { url, _ ->
                when {
                    url.contains("getAddressInformation") -> """{"ok":true,"result":"5000000000"}"""
                    url.contains("getMasterchainInfo") -> """{"ok":true,"result":{"seqno":100,"workchain":-1,"shard":"8000000000000000","rootHash":"x","fileHash":"y","genUtime":0}}"""
                    else -> """{"ok":true,"result":"0"}"""
                }
            },
            postHandler = { _, _, _ -> """{"ok":true,"result":{"messageHash":"hash1","lastBlock":1}}""" }
        )

        val balance = adapter.request("ton_getBalance", listOf(testAddress))
        assertEquals("5.000000000", balance.toString().trim('"'))

        val blockNum = adapter.request("ton_getBlockNumber")
        assertEquals("100", blockNum.toString().trim('"'))

        assertFailsWith<TonError.UnsupportedMethod> {
            adapter.request("ton_unknown")
        }
    }

    @Test
    fun `apiKey header is passed`() = runTest {
        var capturedHeaders: Map<String, String>? = null
        val adapter = makeAdapter(
            apiKey = "test-api-key-123",
            getHandler = { _, headers ->
                capturedHeaders = headers
                """{"ok":true,"result":"0"}"""
            }
        )
        adapter.getBalance(testAddress)
        assertEquals("test-api-key-123", capturedHeaders?.get("X-API-Key"))
    }

    @Test
    fun `TonError messages`() {
        val invalidAddr = TonError.InvalidAddress("bad")
        assertEquals("Invalid TON address: bad", invalidAddr.message)

        assertEquals("Not connected to a TON wallet", TonError.NotConnected.message)

        val rpcErr = TonError.RpcError("timeout")
        assertEquals("toncenter API error: timeout", rpcErr.message)
    }
}
