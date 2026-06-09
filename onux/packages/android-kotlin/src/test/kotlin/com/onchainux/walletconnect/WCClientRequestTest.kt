/**
 * Additional WalletConnect tests — focuses on request flow, transaction serialization,
 * and signTypedData parameter building.
 */
package com.cinacoin.walletconnect

import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class WCClientRequestTests {

    // MARK: - Transaction Request Serialization

    @Test
    fun `WCTransactionRequest toJson includes all fields`() {
        val tx = WCTransactionRequest(
            from = "0xABCDEF0123456789",
            to = "0x1234567890ABCDEF",
            value = "0xDE0B6B3A7640000",
            data = "0xa9059cbb",
            gas = "0x5208",
            gasPrice = "0x4A817C800",
            maxFeePerGas = "0x77359400",
            maxPriorityFeePerGas = "0x3B9ACA00",
            nonce = "0x1",
            chainId = 1
        )

        val json = tx.toJson()
        assertEquals("0xABCDEF0123456789", json.getString("from"))
        assertEquals("0x1234567890ABCDEF", json.getString("to"))
        assertEquals("0xDE0B6B3A7640000", json.getString("value"))
        assertEquals("0xa9059cbb", json.getString("data"))
        assertEquals("0x5208", json.getString("gas"))
        assertEquals("0x4A817C800", json.getString("gasPrice"))
        assertEquals("0x77359400", json.getString("maxFeePerGas"))
        assertEquals("0x3B9ACA00", json.getString("maxPriorityFeePerGas"))
        assertEquals("0x1", json.getString("nonce"))
        assertEquals(1, json.getInt("chainId"))
    }

    @Test
    fun `WCTransactionRequest toJson omits null fields`() {
        val tx = WCTransactionRequest(
            from = "0xFrom",
            to = "0xTo"
        )

        val json = tx.toJson()
        assertEquals("0xFrom", json.getString("from"))
        assertEquals("0xTo", json.getString("to"))
        assertFalse(json.has("value"))
        assertFalse(json.has("data"))
        assertFalse(json.has("gas"))
        assertFalse(json.has("gasPrice"))
        assertFalse(json.has("maxFeePerGas"))
        assertFalse(json.has("maxPriorityFeePerGas"))
        assertFalse(json.has("nonce"))
        assertFalse(json.has("chainId"))
    }

    @Test
    fun `WCTransactionRequest with only EIP-1559 fields`() {
        val tx = WCTransactionRequest(
            from = "0xSender",
            to = "0xReceiver",
            value = "0x1",
            maxFeePerGas = "0x77359400",
            maxPriorityFeePerGas = "0x3B9ACA00",
            chainId = 42161
        )

        val json = tx.toJson()
        assertEquals("0x77359400", json.getString("maxFeePerGas"))
        assertEquals("0x3B9ACA00", json.getString("maxPriorityFeePerGas"))
        assertFalse(json.has("gasPrice"))
    }

    // MARK: - PersonalSign Hex Encoding

    @Test
    fun `toHex encodes plain text message`() {
        // toHex is private but we can verify via the pattern
        val message = "Hello World"
        val hexMessage = if (message.startsWith("0x")) message else message.toHex()
        assertEquals("0x48656c6c6f20576f726c64", hexMessage)
    }

    @Test
    fun `toHex passes through already-hex message`() {
        val message = "0x48656c6c6f"
        val hexMessage = if (message.startsWith("0x")) message else message.toHex()
        assertEquals("0x48656c6c6f", hexMessage)
    }

    // MARK: - SignTypedData Parameter Building

    @Test
    fun `signTypedData params array structure`() {
        val address = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
        val typedData = """{"types":{"EIP712Domain":[]},"domain":{"name":"Test"},"primaryType":"Transfer","message":{}}"""

        val params = org.json.JSONArray().apply {
            put(address)
            put(typedData)
        }

        assertEquals(address, params.getString(0))
        assertEquals(typedData, params.getString(1))
        assertEquals(2, params.length())
    }

    // MARK: - Switch Chain Hex Conversion

    @Test
    fun `chainId to hex conversion`() {
        assertEquals("0x1", "0x" + Integer.toHexString(1))
        assertEquals("0x89", "0x" + Integer.toHexString(137))
        assertEquals("0xa4b1", "0x" + Integer.toHexString(42161))
        assertEquals("0x38", "0x" + Integer.toHexString(56))
        assertEquals("0xa", "0x" + Integer.toHexString(10))
        assertEquals("0x2105", "0x" + Integer.toHexString(8453))
    }

    // MARK: - WCMethods Constants

    @Test
    fun `WCMethods constants`() {
        assertEquals("eth_sendTransaction", WCMethods.ETH_SEND_TRANSACTION)
        assertEquals("personal_sign", WCMethods.PERSONAL_SIGN)
        assertEquals("eth_signTypedData_v4", WCMethods.ETH_SIGN_TYPED_DATA_V4)
        assertEquals("wallet_switchEthereumChain", WCMethods.WALLET_SWITCH_ETHEREUM_CHAIN)
        assertEquals("wallet_addEthereumChain", WCMethods.WALLET_ADD_ETHEREUM_CHAIN)
    }

    @Test
    fun `standardEvmMethods includes all required methods`() {
        val methods = WCMethods.standardEvmMethods
        assertTrue(methods.contains("eth_sendTransaction"))
        assertTrue(methods.contains("eth_signTransaction"))
        assertTrue(methods.contains("personal_sign"))
        assertTrue(methods.contains("eth_signTypedData"))
        assertTrue(methods.contains("eth_signTypedData_v4"))
        assertTrue(methods.contains("wallet_switchEthereumChain"))
        assertTrue(methods.contains("wallet_addEthereumChain"))
        assertTrue(methods.contains("eth_accounts"))
        assertTrue(methods.contains("eth_chainId"))
        assertEquals(9, methods.size)
    }

    @Test
    fun `standardEvmEvents`() {
        val events = WCEvents.standardEvmEvents
        assertTrue(events.contains("chainChanged"))
        assertTrue(events.contains("accountsChanged"))
        assertEquals(2, events.size)
    }

    // MARK: - BigInt Helpers

    @Test
    fun `hexToBigInteger parses hex values`() {
        assertEquals("1000000000000000000", "0xDE0B6B3A7640000".hexToBigInteger().toString())
        assertEquals("0", "0x0".hexToBigInteger().toString())
        assertEquals("1", "0x1".hexToBigInteger().toString())
    }

    @Test
    fun `hexToBigInteger handles non-prefixed hex`() {
        assertEquals("255", "FF".hexToBigInteger().toString())
    }

    // MARK: - URI Parsing

    @Test
    fun `parseWcUri extracts components`() {
        val uri = "wc:abc123@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com&symKey=def456"
        val parsed = WCUtils.parseWcUri(uri)

        assertEquals("abc123", parsed.topic)
        assertEquals("waku", parsed.relayProtocol)
        assertEquals("wss://relay.example.com", parsed.relayUrl)
        assertEquals("def456", parsed.symKey)
    }

    @Test(expected = IllegalArgumentException::class)
    fun `parseWcUri rejects missing symKey`() {
        WCUtils.parseWcUri("wc:abc123@2?relay-protocol=waku")
    }

    @Test(expected = IllegalArgumentException::class)
    fun `parseWcUri rejects wrong version`() {
        WCUtils.parseWcUri("wc:abc123@1?relay-protocol=waku&symKey=def456")
    }

    @Test(expected = IllegalArgumentException::class)
    fun `parseWcUri rejects invalid format`() {
        WCUtils.parseWcUri("invalid-uri")
    }

    // MARK: - Error Descriptions

    @Test
    fun `WCError messages`() {
        assertEquals("Not connected to a wallet", WCError.NotConnected.message)
        assertEquals("WCClient has not been configured", WCError.NotConfigured.message)
        assertEquals("Session establishment timed out", WCError.SessionTimeout.message)
        assertEquals("Invalid session proposal response", WCError.InvalidProposalResponse.message)
        assertEquals("Invalid relay URL: wss://bad", WCError.InvalidUrl("wss://bad").message)
        assertEquals("RPC error 4001: User rejected", WCError.RpcError(4001, "User rejected").message)
        assertEquals("Crypto error: bad key", WCError.CryptoError("bad key").message)
    }

    // MARK: - WCStatus

    @Test
    fun `WCStatus types exist`() {
        assertTrue(WCStatus.Disconnected is WCStatus.Disconnected)
        assertTrue(WCStatus.Connecting is WCStatus.Connecting)
        assertTrue(WCStatus.Pairing is WCStatus.Pairing)
        assertTrue(WCStatus.Connected is WCStatus.Connected)
        assertTrue(WCStatus.Error("fail") is WCStatus.Error)
    }

    // MARK: - Hex Encoding Extension

    @Test
    fun `toHex empty string`() {
        val message = ""
        val hexMessage = if (message.startsWith("0x")) message else message.toHex()
        assertEquals("0x", hexMessage)
    }

    // MARK: - Request Parameter Building for sendTransaction

    @Test
    fun `sendTransaction params building`() {
        val tx = WCTransactionRequest(
            from = "0xABC",
            to = "0xDEF",
            value = "0x1234",
            data = "0x"
        )

        val params = org.json.JSONArray().apply { put(tx.toJson()) }
        val obj = params.getJSONObject(0)

        assertEquals("0xABC", obj.getString("from"))
        assertEquals("0xDEF", obj.getString("to"))
        assertEquals("0x1234", obj.getString("value"))
        assertEquals("0x", obj.getString("data"))
        assertEquals(1, params.length())
    }

    // MARK: - WCSession defaults

    @Test
    fun `WCSession default values`() {
        val session = WCSession(topic = "test-topic")
        assertEquals("test-topic", session.topic)
        assertTrue(session.accounts.isEmpty())
        assertTrue(session.peerMetadata.isEmpty())
        assertTrue(session.namespaces.isEmpty())
        assertEquals("waku", session.relayProtocol)
    }
}
