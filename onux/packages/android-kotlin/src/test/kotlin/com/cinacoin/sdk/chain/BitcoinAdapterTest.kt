package com.cinacoin.sdk.chain

import com.cinacoin.chain.BitcoinAdapter
import com.cinacoin.chain.BitcoinError
import com.cinacoin.chain.BitcoinHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class BitcoinAdapterTest {

    private fun makeAdapter(
        rpcUrl: String = "https://test.example.com",
        getHandler: (String) -> String = { """{"page":0,"balance":"150000000"}""" },
        postHandler: (String, String) -> String = { _, _ -> """{"result":"txhash123"}""" }
    ): BitcoinAdapter {
        val client = object : BitcoinHttpClient {
            override suspend fun get(url: String): String = getHandler(url)
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return BitcoinAdapter(rpcUrl, client)
    }

    @Test
    fun `chainName returns bitcoin`() = runTest {
        val adapter = makeAdapter()
        assertEquals("bitcoin", adapter.chainName)
    }

    @Test
    fun `endpoint returns rpcUrl`() = runTest {
        val adapter = makeAdapter("https://btc1.trezor.io")
        assertEquals("https://btc1.trezor.io", adapter.endpoint)
    }

    @Test
    fun `getBalance returns BTC from satoshis`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"page":0,"balance":"150000000","totalReceived":"200000000","totalSent":"50000000","unconfirmedBalance":"0","unconfirmedTxs":0,"txs":5,"transactions":[]}""" }
        )
        val balance = adapter.getBalance("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")
        assertEquals("1.50000000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-btc-address")
        }
    }

    @Test
    fun `sendTransaction returns txid`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"result":"abc123def456"}""" }
        )
        val txid = adapter.sendTransaction("0200000001...")
        assertEquals("abc123def456", txid)
    }

    @Test
    fun `getLatestBlock returns block height`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"paging":{"page":1,"totalPages":850000}}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(850000L, block)
    }

    @Test
    fun `estimateFee returns fee rate`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"feeRate":[{"name":"high","blocks":1,"feePerUnit":"5"},{"name":"medium","blocks":3,"feePerUnit":"3"},{"name":"low","blocks":6,"feePerUnit":"1"}]}""" }
        )
        val fee = adapter.estimateFee()
        assertEquals("5", fee)
    }

    @Test
    fun `setConnectedAddress and isConnected`() = runTest {
        val adapter = makeAdapter()
        assertFalse(adapter.isConnected)
        assertNull(adapter.connectedAddress)

        adapter.setConnectedAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")
        assertTrue(adapter.isConnected)
        assertEquals("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", adapter.connectedAddress)
    }

    @Test
    fun `disconnect clears connected address`() = runTest {
        val adapter = makeAdapter()
        adapter.setConnectedAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")
        assertTrue(adapter.isConnected)

        adapter.disconnect()
        assertFalse(adapter.isConnected)
        assertNull(adapter.connectedAddress)
    }

    @Test
    fun `setConnectedAddress rejects invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.setConnectedAddress("invalid-address")
        }
    }

    @Test
    fun `isValidAddress accepts legacy, segwit, and taproot`() {
        // Legacy P2PKH
        assertTrue(BitcoinAdapter.isValidAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"))
        // P2SH
        assertTrue(BitcoinAdapter.isValidAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"))
        // Native SegWit Bech32
        assertTrue(BitcoinAdapter.isValidAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"))
        // Taproot Bech32m
        assertTrue(BitcoinAdapter.isValidAddress("bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297"))
        // Invalid
        assertFalse(BitcoinAdapter.isValidAddress("invalid"))
        assertFalse(BitcoinAdapter.isValidAddress("0x1234567890abcdef"))
    }

    @Test
    fun `satToBtc and btcToSat conversions`() {
        assertEquals("0.00000001", BitcoinAdapter.satToBtc(1))
        assertEquals("1.00000000", BitcoinAdapter.satToBtc(100_000_000))
        assertEquals("0.50000000", BitcoinAdapter.satToBtc(50_000_000))

        assertEquals(100_000_000L, BitcoinAdapter.btcToSat(1.0))
        assertEquals(50_000_000L, BitcoinAdapter.btcToSat(0.5))
        assertEquals(1L, BitcoinAdapter.btcToSat(0.00000001))
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            getHandler = { url ->
                when {
                    url.contains("/address/") -> """{"page":0,"balance":"100000000","totalReceived":"100000000","totalSent":"0","unconfirmedBalance":"0","unconfirmedTxs":0,"txs":1,"transactions":[]}"""
                    url.contains("/estimatefee") -> """{"feeRate":[{"name":"high","blocks":1,"feePerUnit":"4"}]}"""
                    else -> """{"paging":{"totalPages":800000}}"""
                }
            },
            postHandler = { _, _ -> """{"result":"tx123"}""" }
        )
        adapter.setConnectedAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")

        val balanceResult = adapter.request("btc_getBalance", listOf("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"))
        assertEquals("1.00000000", balanceResult.toString().trim('"'))

        val feeResult = adapter.request("btc_estimateFee")
        assertEquals("4", feeResult.toString().trim('"'))

        assertFailsWith<BitcoinError.UnsupportedMethod> {
            adapter.request("btc_unknown")
        }
    }

    @Test
    fun `BitcoinError messages`() {
        val invalidAddr = BitcoinError.InvalidAddress("bad")
        assertEquals("Invalid Bitcoin address: bad", invalidAddr.message)

        assertEquals("Not connected to a Bitcoin wallet", BitcoinError.NotConnected.message)

        val rpcErr = BitcoinError.RpcError("timeout")
        assertEquals("Blockbook RPC error: timeout", rpcErr.message)

        val unsupported = BitcoinError.UnsupportedMethod("btc_foo")
        assertEquals("Unsupported method: btc_foo", unsupported.message)
    }

    @Test
    fun `getBalance returns zero for empty balance`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"page":0,"balance":"0","totalReceived":"0","totalSent":"0","unconfirmedBalance":"0","unconfirmedTxs":0,"txs":0,"transactions":[]}""" }
        )
        val balance = adapter.getBalance("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")
        assertEquals("0.00000000", balance)
    }

    @Test
    fun `getBalance network error propagates`() = runTest {
        val adapter = makeAdapter(
            getHandler = { throw BitcoinError.RpcError("HTTP 500") }
        )
        assertFailsWith<BitcoinError.RpcError> {
            adapter.getBalance("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")
        }
    }

    @Test
    fun `endpoint setter updates rpcUrl`() = runTest {
        val adapter = makeAdapter("https://old.example.com")
        assertEquals("https://old.example.com", adapter.endpoint)
        adapter.endpoint = "https://new.example.com"
        assertEquals("https://new.example.com", adapter.endpoint)
    }
}
