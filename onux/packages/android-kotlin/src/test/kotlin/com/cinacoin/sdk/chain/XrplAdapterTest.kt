package com.cinacoin.sdk.chain

import com.cinacoin.chain.XrplAdapter
import com.cinacoin.chain.XrplError
import com.cinacoin.chain.XrplHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class XrplAdapterTest {

    private val testAddress = "rN7n7otQDd6FczFgLdlqtyMVrn3NnrcVcU"

    private fun makeAdapter(
        rpcUrl: String = "https://test.ripple.com",
        postHandler: (String, String) -> String = { _, _ -> """{"result":{"status":"success","type":"response","account_data":{"Account":"$testAddress","Balance":"1000000","Sequence":1},"ledger_index":50000000}}""" }
    ): XrplAdapter {
        val client = object : XrplHttpClient {
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return XrplAdapter(rpcUrl, client)
    }

    @Test
    fun `chainName returns xrpl`() = runTest {
        val adapter = makeAdapter()
        assertEquals("xrpl", adapter.chainName)
    }

    @Test
    fun `getBalance returns XRP from drops`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"result":{"status":"success","type":"response","account_data":{"Account":"$testAddress","Balance":"5000000","Sequence":1},"ledger_index":50000000}}""" }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("5.000000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-an-xrpl-address")
        }
    }

    @Test
    fun `getBalance throws on account not found`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"result":{"status":"error","type":"response","error":"actNotFound"}}""" }
        )
        assertFailsWith<XrplError.RpcError> {
            adapter.getBalance(testAddress)
        }
    }

    @Test
    fun `sendTransaction returns tx hash`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"result":{"status":"success","type":"response","engine_result":"tesSUCCESS","engine_result_message":"The transaction was applied","tx_json":{"hash":"abc123DEF456","Account":"$testAddress","TransactionType":"Payment"}}}""" }
        )
        val hash = adapter.sendTransaction("signedTxBlob")
        assertEquals("abc123DEF456", hash)
    }

    @Test
    fun `sendTransaction throws on failure`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"result":{"status":"success","type":"response","engine_result":"tecUNFUNDED_PAYMENT","engine_result_message":"Path does not have sufficient funds","tx_json":{}}}""" }
        )
        assertFailsWith<XrplError.RpcError> {
            adapter.sendTransaction("signedTxBlob")
        }
    }

    @Test
    fun `getLatestBlock returns ledger index`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"result":{"status":"success","type":"response","ledger_index":60000000,"ledger_hash":"ABC123"}}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(60000000L, block)
    }

    @Test
    fun `estimateFee returns base fee`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"result":{"status":"success","type":"response","drops":{"base_fee":"10","median_fee":"12","minimum_fee":"10"}}}""" }
        )
        val fee = adapter.estimateFee()
        assertEquals("10", fee)
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
    fun `isValidAddress accepts r-addresses`() {
        assertTrue(XrplAdapter.isValidAddress("rN7n7otQDd6FczFgLdlqtyMVrn3NnrcVcU"))
        assertTrue(XrplAdapter.isValidAddress("rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY"))
        // Invalid
        assertFalse(XrplAdapter.isValidAddress("not-an-address"))
        assertFalse(XrplAdapter.isValidAddress("0x1234567890"))
        assertFalse(XrplAdapter.isValidAddress("r")) // too short
    }

    @Test
    fun `dropsToXrp conversion`() {
        assertEquals("1.000000", XrplAdapter.dropsToXrp("1000000"))
        assertEquals("0.000001", XrplAdapter.dropsToXrp("1"))
        assertEquals("50.500000", XrplAdapter.dropsToXrp("50500000"))
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                when {
                    body.contains("account_info") -> """{"result":{"status":"success","type":"response","account_data":{"Account":"$testAddress","Balance":"3000000","Sequence":1},"ledger_index":50000000}}"""
                    body.contains("\"ledger\"") -> """{"result":{"status":"success","type":"response","ledger_index":60000000}}"""
                    body.contains("\"fee\"") -> """{"result":{"status":"success","type":"response","drops":{"base_fee":"10","median_fee":"12","minimum_fee":"10"}}}"""
                    body.contains("\"submit\"") -> """{"result":{"status":"success","type":"response","engine_result":"tesSUCCESS","engine_result_message":"success","tx_json":{"hash":"tx1"}}}"""
                    else -> """{"result":{"status":"success","type":"response"}}"""
                }
            }
        )

        val balance = adapter.request("xrpl_getBalance", listOf(testAddress))
        assertEquals("3.000000", balance.toString().trim('"'))

        val blockNum = adapter.request("xrpl_getBlockNumber")
        assertEquals("60000000", blockNum.toString().trim('"'))

        assertFailsWith<XrplError.UnsupportedMethod> {
            adapter.request("xrpl_unknown")
        }
    }

    @Test
    fun `endpoint setter updates rpcUrl`() = runTest {
        val adapter = makeAdapter("https://old.ripple.com")
        assertEquals("https://old.ripple.com", adapter.endpoint)
        adapter.endpoint = "https://s1.ripple.com"
        assertEquals("https://s1.ripple.com", adapter.endpoint)
    }
}
