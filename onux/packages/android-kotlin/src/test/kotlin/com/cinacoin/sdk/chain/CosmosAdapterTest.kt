package com.cinacoin.sdk.chain

import com.cinacoin.chain.CosmosAdapter
import com.cinacoin.chain.CosmosError
import com.cinacoin.chain.CosmosHttpClient
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Test

class CosmosAdapterTest {

    private val testAddress = "cosmos1fl48vsnmsdzcv85q5d2q4z5ajdha8yu34mf0eh"

    private fun makeAdapter(
        rpcUrl: String = "https://test.cosmos.rest",
        getHandler: (String) -> String = { """{"balances":[],"pagination":null}""" },
        postHandler: (String, String) -> String = { _, _ -> """{"code":0,"txhash":"hash123","rawLog":""}""" }
    ): CosmosAdapter {
        val client = object : CosmosHttpClient {
            override suspend fun get(url: String): String = getHandler(url)
            override suspend fun post(url: String, body: String): String = postHandler(url, body)
        }
        return CosmosAdapter(rpcUrl, httpClient = client)
    }

    @Test
    fun `chainName returns cosmos`() = runTest {
        val adapter = makeAdapter()
        assertEquals("cosmos", adapter.chainName)
    }

    @Test
    fun `getBalance returns ATOM balance`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"balances":[{"denom":"uatom","amount":"1500000"},{"denom":"uosmo","amount":"5000000"}],"pagination":null}""" }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("1.500000", balance)
    }

    @Test
    fun `getBalance returns zero when ATOM not found`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"balances":[{"denom":"uosmo","amount":"5000000"}],"pagination":null}""" }
        )
        val balance = adapter.getBalance(testAddress)
        assertEquals("0.000000", balance)
    }

    @Test
    fun `getBalance throws on invalid address`() = runTest {
        val adapter = makeAdapter()
        assertFailsWith<IllegalArgumentException> {
            adapter.getBalance("not-a-cosmos-address")
        }
    }

    @Test
    fun `getAllBalances returns all token balances`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"balances":[{"denom":"uatom","amount":"1000000"},{"denom":"uosmo","amount":"2000000"}],"pagination":null}""" }
        )
        val balances = adapter.getAllBalances(testAddress)
        assertEquals(2, balances.size)
        assertEquals("uatom", balances[0].denom)
        assertEquals("1000000", balances[0].amount)
        assertEquals("uosmo", balances[1].denom)
    }

    @Test
    fun `sendTransaction returns txhash`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"code":0,"txhash":"ABC123DEF","rawLog":"success"}""" }
        )
        val txhash = adapter.sendTransaction("""{"body":{"messages":[]}}""")
        assertEquals("ABC123DEF", txhash)
    }

    @Test
    fun `sendTransaction throws on failure`() = runTest {
        val adapter = makeAdapter(
            postHandler = { _, _ -> """{"code":5,"txhash":"","rawLog":"insufficient funds"}""" }
        )
        assertFailsWith<CosmosError.RpcError> {
            adapter.sendTransaction("""{"body":{"messages":[]}}""")
        }
    }

    @Test
    fun `getLatestBlock returns block height`() = runTest {
        val adapter = makeAdapter(
            getHandler = { """{"block":{"header":{"height":"850000","time":"2024-01-01T00:00:00Z","chainId":"cosmoshub-4"}}}""" }
        )
        val block = adapter.getLatestBlock()
        assertEquals(850000L, block)
    }

    @Test
    fun `estimateFee returns standard gas`() = runTest {
        val adapter = makeAdapter()
        val fee = adapter.estimateFee()
        assertEquals("55000", fee)
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
    fun `isValidAddress accepts bech32 cosmos addresses`() {
        assertTrue(CosmosAdapter.isValidAddress("cosmos1fl48vsnmsdzcv85q5d2q4z5ajdha8yu34mf0eh"))
        assertTrue(CosmosAdapter.isValidAddress("cosmos1abc", "cosmos"))
        // osmosis prefix
        assertTrue(CosmosAdapter.isValidAddress("osmo1fl48vsnmsdzcv85q5d2q4z5ajdha8yu34mf0eh", "osmo"))
        // Invalid
        assertFalse(CosmosAdapter.isValidAddress("not-valid"))
        assertFalse(CosmosAdapter.isValidAddress("cosmos1", "cosmos"))
    }

    @Test
    fun `microToAtom conversion`() {
        assertEquals("1.000000", CosmosAdapter.microToAtom("1000000"))
        assertEquals("0.000001", CosmosAdapter.microToAtom("1"))
        assertEquals("1500.000000", CosmosAdapter.microToAtom("1500000000"))
    }

    @Test
    fun `request method dispatch`() = runTest {
        val adapter = makeAdapter(
            getHandler = { url ->
                when {
                    url.contains("/balances/") -> """{"balances":[{"denom":"uatom","amount":"3000000"}],"pagination":null}"""
                    url.contains("/blocks/latest") -> """{"block":{"header":{"height":"100","time":"2024-01-01","chainId":"test"}}}"""
                    else -> """{"balances":[],"pagination":null}"""
                }
            }
        )

        val balance = adapter.request("cosmos_getBalance", listOf(testAddress))
        assertEquals("3.000000", balance.toString().trim('"'))

        val blockNum = adapter.request("cosmos_getBlockNumber")
        assertEquals("100", blockNum.toString().trim('"'))

        assertFailsWith<CosmosError.UnsupportedMethod> {
            adapter.request("cosmos_unknown")
        }
    }

    @Test
    fun `endpoint setter updates rpcUrl`() = runTest {
        val adapter = makeAdapter("https://old.cosmos.rest")
        assertEquals("https://old.cosmos.rest", adapter.endpoint)
        adapter.endpoint = "https://new.cosmos.rest"
        assertEquals("https://new.cosmos.rest", adapter.endpoint)
    }
}
