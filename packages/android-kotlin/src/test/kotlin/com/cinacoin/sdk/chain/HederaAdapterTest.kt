package com.cinacoin.sdk.chain

import com.cinacoin.chain.HederaAdapter
import com.cinacoin.chain.HederaError
import com.cinacoin.chain.HederaHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class HederaAdapterTest {

    private val testAccountId = "0.0.12345"

    private fun makeAdapter(
        rpcUrl: String = "https://test.mirrornode.hedera.com",
        getHandler: (String) -> String = { """{"account":"0.0.12345","balance":{"balance":500000000,"timestamp":"1700000000.000000000","tokens":[]}}""" },
        postHandler: (String, String) -> String = { _, _ -> """{"hash":"abc123def456"}""" }
    ): HederaAdapter {
        val client = object : HederaHttpClient {
            override suspend fun get(url: String): String = getHandler(url)
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return HederaAdapter(rpcUrl, httpClient = client)
    }

    @Test
    fun `chainName returns hedera`() = runTest {
        val adapter = makeAdapter()
        assertEquals("hedera", adapter.chainName)
    }

    @Test
    fun `getBalance returns HBAR from tinybar`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"account":"0.0.12345","balance":{"balance":2500000000,"timestamp":"1700000000.000000000","tokens":[]}}""" }
        )
        val balance = adapter.getBalance(testAccountId)
        assertEquals("25.00000000", balance)
    }

    @Test
    fun `getBalance returns default when balance is null`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"account":"0.0.12345","balance":null}""" }
        )
        val balance = adapter.getBalance(testAccountId)
        assertEquals("0.00000000", balance)
    }

    @Test
    fun `getBalance throws on invalid account ID`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-hedera-id")
        }
    }

    @Test
    fun `sendTransaction returns hash`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"hash":"txhash789","node":"0.0.3"}""" }
        )
        val hash = adapter.sendTransaction("signedTxHex")
        assertEquals("txhash789", hash)
    }

    @Test
    fun `getLatestBlock returns consensus timestamp`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"blocks":[{"timestamp":"1700000000.000000000","number":123456}],"links":null}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(1700000000L, block)
    }

    @Test
    fun `estimateFee returns standard HBAR transfer fee`() = runTest {
        val adapter = makeAdapter()
        val fee = adapter.estimateFee()
        assertEquals("0.0001", fee)
    }

    @Test
    fun `setConnectedAddress and disconnect`() = runTest {
        val adapter = makeAdapter()
        assertFalse(adapter.isConnected)

        adapter.setConnectedAddress(testAccountId)
        assertTrue(adapter.isConnected)
        assertEquals(testAccountId, adapter.connectedAddress)

        adapter.disconnect()
        assertFalse(adapter.isConnected)
        assertNull(adapter.connectedAddress)
    }

    @Test
    fun `isValidAddress accepts Hedera account IDs`() {
        assertTrue(HederaAdapter.isValidAddress("0.0.12345"))
        assertTrue(HederaAdapter.isValidAddress("0.0.1"))
        assertTrue(HederaAdapter.isValidAddress("0.0.999999999"))
        // Invalid
        assertFalse(HederaAdapter.isValidAddress("12345"))
        assertFalse(HederaAdapter.isValidAddress("0.0."))
        assertFalse(HederaAdapter.isValidAddress("abc.def.ghi"))
    }

    @Test
    fun `tinybarToHbar conversion`() {
        assertEquals("1.00000000", HederaAdapter.tinybarToHbar(100_000_000))
        assertEquals("0.00000001", HederaAdapter.tinybarToHbar(1))
        assertEquals("0.50000000", HederaAdapter.tinybarToHbar(50_000_000))
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            getHandler = { url ->
                when {
                    url.contains("/accounts/") -> """{"account":"0.0.12345","balance":{"balance":100000000,"timestamp":"1700000000.000000000","tokens":[]}}"""
                    url.contains("/blocks") -> """{"blocks":[{"timestamp":"1700000001.000000000","number":500}],"links":null}"""
                    else -> """{"account":"0.0.12345","balance":null}"""
                }
            }
        )

        val balance = adapter.request("hedera_getBalance", listOf(testAccountId))
        assertEquals("1.00000000", balance.toString().trim('"'))

        val blockNum = adapter.request("hedera_getBlockNumber")
        assertEquals("1700000001", blockNum.toString().trim('"'))

        assertFailsWith<HederaError.UnsupportedMethod> {
            adapter.request("hedera_unknown")
        }
    }

    @Test
    fun `endpoint setter updates rpcUrl`() = runTest {
        val adapter = makeAdapter("https://old.mirrornode.hedera.com")
        assertEquals("https://old.mirrornode.hedera.com", adapter.endpoint)
        adapter.endpoint = "https://mainnet.mirrornode.hedera.com"
        assertEquals("https://mainnet.mirrornode.hedera.com", adapter.endpoint)
    }
}
