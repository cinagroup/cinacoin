package com.cinacoin.sdk.chain

import com.cinacoin.chain.NearAdapter
import com.cinacoin.chain.NearError
import com.cinacoin.chain.NearHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class NearAdapterTest {

    private val testAccount = "alice.near"

    private fun makeAdapter(
        rpcUrl: String = "https://test.rpc.near.org",
        postHandler: (String, String) -> String = { _, _ -> """{"jsonrpc":"2.0","result":{"amount":"1000000000000000000000000","locked":"0","code_hash":"","storage_usage":0,"storage_paid_at":0},"id":1}""" }
    ): NearAdapter {
        val client = object : NearHttpClient {
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return NearAdapter(rpcUrl, client)
    }

    @Test
    fun `chainName returns near`() = runTest {
        val adapter = makeAdapter()
        assertEquals("near", adapter.chainName)
    }

    @Test
    fun `getBalance returns NEAR from yoctoNEAR`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":{"amount":"5000000000000000000000000","locked":"0","code_hash":"","storage_usage":0,"storage_paid_at":0},"id":1}""" }
        )
        val balance = adapter.getBalance(testAccount)
        assertEquals("5.000000", balance)
    }

    @Test
    fun `getBalance throws on invalid account`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("INVALID ACCOUNT")
        }
    }

    @Test
    fun `sendTransaction returns tx hash`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":{"transaction":{"hash":"5jK9bGnM3pN7qR2sT8uV1wX3yZ","signer_id":"alice.near"},"receipts_outcome":[]},"id":1}""" }
        )
        val hash = adapter.sendTransaction("base64signedtx==")
        assertEquals("5jK9bGnM3pN7qR2sT8uV1wX3yZ", hash)
    }

    @Test
    fun `getLatestBlock returns block height`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"jsonrpc":"2.0","result":{"sync_info":{"latest_block_height":12345678,"latest_block_hash":"abc123","latest_state_root":"def456","latest_block_time":"2024-01-01T00:00:00Z"}},"id":1}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(12345678L, block)
    }

    @Test
    fun `estimateFee returns standard fee`() = runTest {
        val adapter = makeAdapter()
        val fee = adapter.estimateFee()
        assertEquals("0.0001", fee)
    }

    @Test
    fun `setConnectedAddress and disconnect`() = runTest {
        val adapter = makeAdapter()
        assertFalse(adapter.isConnected)

        adapter.setConnectedAddress(testAccount)
        assertTrue(adapter.isConnected)
        assertEquals(testAccount, adapter.connectedAddress)

        adapter.disconnect()
        assertFalse(adapter.isConnected)
        assertNull(adapter.connectedAddress)
    }

    @Test
    fun `isValidAddress accepts NEAR account IDs`() {
        assertTrue(NearAdapter.isValidAddress("alice.near"))
        assertTrue(NearAdapter.isValidAddress("bob.testnet"))
        assertTrue(NearAdapter.isValidAddress("contract.near"))
        assertTrue(NearAdapter.isValidAddress("a_b-c"))
        // Invalid
        assertFalse(NearAdapter.isValidAddress("INVALID"))
        assertFalse(NearAdapter.isValidAddress("0x1234"))
        assertFalse(NearAdapter.isValidAddress("a")) // too short
    }

    @Test
    fun `yoctoToNear conversion`() {
        assertEquals("1.000000", NearAdapter.yoctoToNear("1000000000000000000000000"))
        assertEquals("0.500000", NearAdapter.yoctoToNear("500000000000000000000000"))
        assertEquals("0.000000", NearAdapter.yoctoToNear("1")) // rounds to 0 at 6 decimals
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, body ->
                if (body.contains("view_account")) {
                    """{"jsonrpc":"2.0","result":{"amount":"2000000000000000000000000","locked":"0","code_hash":"","storage_usage":0,"storage_paid_at":0},"id":1}"""
                } else if (body.contains("status")) {
                    """{"jsonrpc":"2.0","result":{"sync_info":{"latest_block_height":500,"latest_block_hash":"x","latest_state_root":"y","latest_block_time":"2024-01-01"}},"id":1}"""
                } else if (body.contains("broadcast_tx_commit")) {
                    """{"jsonrpc":"2.0","result":{"transaction":{"hash":"tx123","signer_id":"a.near"},"receipts_outcome":[]},"id":1}"""
                } else {
                    """{"jsonrpc":"2.0","result":{},"id":1}"""
                }
            }
        )

        val balance = adapter.request("near_getBalance", listOf(testAccount))
        assertEquals("2.000000", balance.toString().trim('"'))

        val blockNum = adapter.request("near_getBlockNumber")
        assertEquals("500", blockNum.toString().trim('"'))

        assertFailsWith<NearError.UnsupportedMethod> {
            adapter.request("near_unknown")
        }
    }

    @Test
    fun `NearError messages`() {
        val invalidAddr = NearError.InvalidAddress("bad")
        assertEquals("Invalid NEAR account: bad", invalidAddr.message)

        assertEquals("Not connected to a NEAR wallet", NearError.NotConnected.message)

        val rpcErr = NearError.RpcError("timeout")
        assertEquals("NEAR RPC error: timeout", rpcErr.message)
    }
}
