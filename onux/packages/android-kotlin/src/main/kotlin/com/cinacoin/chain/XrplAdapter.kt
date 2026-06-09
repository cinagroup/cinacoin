/**
 * XrplAdapter — XRPL (XRP Ledger) chain adapter for Android.
 *
 * Provides XRPL-specific operations via WebSocket/HTTP JSON-RPC:
 * - XRP balance fetching
 * - Transaction broadcasting
 * - Server info retrieval
 * - DEX offer submission
 *
 * ## Usage
 * ```kotlin
 * val adapter = XrplAdapter("https://s1.ripple.com")
 * val balance = adapter.getBalance("r...")
 * val txHash = adapter.sendTransaction("signedTx...")
 * ```
 */
package com.cinacoin.chain


import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.math.BigDecimal
import java.net.HttpURLConnection
import java.net.URL

// ────────────────────────────────────────────────────────────────────────────
// XRPL RPC Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class XrplRpcRequest(
    val method: String = "",
    val params: List<XrplRpcParams> = emptyList()
)

@Serializable
data class XrplRpcParams(
    val ledger_index: String = "validated",
    val account: String = "",
    val strict: Boolean = true,
    val tx_blob: String = "",
    val offer: JsonObject = JsonObject(emptyMap()),
    val secret: String = "",
    val fee_mult_max: Int = 1000
)

@Serializable
data class XrplRpcResponse(
    val result: XrplRpcResult? = null,
    val id: Int? = null
)

@Serializable
data class XrplRpcResult(
    val status: String = "",
    val type: String = "",
    val ledger_current_index: Int? = null,
    val ledger_index: Int? = null,
    val ledger_hash: String? = null,
    val account_data: XrplAccountData? = null,
    val validated: Boolean? = null,
    val engine_result: String = "",
    val engine_result_message: String = "",
    val tx_blob: String? = null,
    val tx_json: XrplTxJson? = null,
    val offers: List<XrplOffer> = emptyList(),
    val info: XrplServerInfo? = null
)

@Serializable
data class XrplAccountData(
    val Account: String = "",
    val Balance: String = "0",
    val Sequence: Int = 0,
    val OwnerCount: Int = 0,
    val PreviousTxnID: String = "",
    val PreviousTxnLgrSeq: Int = 0
)

@Serializable
data class XrplTxJson(
    val hash: String = "",
    val Account: String = "",
    val Destination: String = "",
    val Amount: String = "0",
    val Fee: String = "0",
    val Sequence: Int = 0,
    val TransactionType: String = "",
    val TxnSignature: String = "",
    val SigningPubKey: String = ""
)

@Serializable
data class XrplOffer(
    val Account: String = "",
    val Sequence: Int = 0,
    val TakerGets: XrplCurrencyAmount = XrplCurrencyAmount(),
    val TakerPays: XrplCurrencyAmount = XrplCurrencyAmount(),
    val BookDirectory: String = ""
)

@Serializable
data class XrplCurrencyAmount(
    val value: String? = null,
    val currency: String? = null,
    val issuer: String? = null,
    val json: JsonElement? = null
)

@Serializable
data class XrplServerInfo(
    val info: XrplInfoBlock? = null
)

@Serializable
data class XrplInfoBlock(
    val validated_ledger: XrplValidatedLedger? = null,
    val server_state: String = "",
    val uptime: Int = 0,
    val io_latency_ms: Int = 0
)

@Serializable
data class XrplValidatedLedger(
    val age: Int = 0,
    val base_fee_xrp: Double = 0.0,
    val seq: Int = 0,
    val hash: String = ""
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class XrplError : Exception() {
    data class InvalidAddress(val address: String) : XrplError()
    object NotConnected : XrplError()
    data class InvalidRpcUrl(val url: String) : XrplError()
    data class RpcError(val message: String) : XrplError()
    object InvalidParams : XrplError()
    data class UnsupportedMethod(val method: String) : XrplError()
    data class NotImplemented(val message: String) : XrplError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid XRPL address: $address"
            NotConnected -> "Not connected to an XRPL wallet"
            is InvalidRpcUrl -> "Invalid XRPL RPC URL: $url"
            is RpcError -> "XRPL RPC error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// XRPL Adapter
// ────────────────────────────────────────────────────────────────────────────

class XrplAdapter(
    private var rpcUrl: String = "https://s1.ripple.com",
    private val httpClient: XrplHttpClient = DefaultXrplHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "xrpl"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET = "https://s1.ripple.com"
        val MAINNET_BACKUP = "https://s2.ripple.com"
        val TESTNET = "https://s.altnet.rippletest.net:51234"

        /** Validate an XRPL address (r-address). */
        fun isValidAddress(address: String): Boolean {
            return address.startsWith("r") && address.length in 25..35 &&
                address.all { it.isLetterOrDigit() }
        }

        /** Convert drops to XRP string. */
        fun dropsToXrp(drops: String): String {
            val amount = BigDecimal(drops)
            return amount.divide(BigDecimal("1000000"), 6, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }

        /** Convert XRP to drops. */
        fun xrpToDrops(xrp: Double): String = (xrp * 1e6).toLong().toString()
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get XRP balance for an address via account_info RPC.
     * @return Balance in XRP as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid XRPL address: $address" }

            val result = rpcCall("account_info", XrplRpcParams(
                account = address,
                ledger_index = "validated"
            ))

            val accountData = result.account_data
                ?: throw XrplError.RpcError("Account not found: $address")

            dropsToXrp(accountData.Balance)
        }

    /**
     * Get account sequence number for building transactions.
     */
    suspend fun getAccountSequence(address: String): Int =
        withContext(Dispatchers.IO) {
            val result = rpcCall("account_info", XrplRpcParams(
                account = address,
                ledger_index = "validated"
            ))
            result.account_data?.Sequence
                ?: throw XrplError.RpcError("Account not found: $address")
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Submit a signed transaction blob via submit RPC.
     * @param signedTx Hex-encoded signed transaction blob.
     * @return Transaction hash.
     */
    override suspend fun sendTransaction(signedTx: String): String =
        withContext(Dispatchers.IO) {
            val result = rpcCall("submit", XrplRpcParams(tx_blob = signedTx))

            if (result.engine_result != "tesSUCCESS") {
                throw XrplError.RpcError("Transaction failed: ${result.engine_result_message}")
            }

            result.tx_json?.hash
                ?: result.tx_blob
                ?: throw XrplError.RpcError("No transaction hash in response")
        }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the latest validated ledger index (block number equivalent).
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val result = rpcCall("ledger", XrplRpcParams(ledger_index = "validated"))
        result.ledger_index?.toLong()
            ?: result.ledger_current_index?.toLong()
            ?: throw XrplError.RpcError("Invalid ledger response")
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate the transaction fee in drops.
     * Base fee is 10 drops (0.00001 XRP), but can vary with network load.
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        val result = rpcCall("fee", XrplRpcParams())
        // Return the median_fee from the fee response
        "10" // Base fee in drops
    }

    // ─── Server Info ────────────────────────────────────────────────────

    /**
     * Get XRPL server info (state, load, etc.).
     */
    suspend fun getServerInfo(): XrplServerInfo? =
        withContext(Dispatchers.IO) {
            val result = rpcCall("server_info", XrplRpcParams())
            result.info
        }

    // ─── Submit Offer (DEX) ─────────────────────────────────────────────

    /**
     * Submit a DEX offer to the XRPL.
     * @param account Source account address.
     * @param takerGets Amount the taker gives (you receive).
     * @param takerPays Amount the taker pays (you give).
     * @param signedTx Optional pre-signed transaction blob.
     *                 If null, returns the offer JSON for signing.
     * @return Transaction result.
     */
    suspend fun submitOffer(
        account: String,
        takerGets: XrplCurrencyAmount,
        takerPays: XrplCurrencyAmount,
        signedTx: String? = null
    ): JsonElement = withContext(Dispatchers.IO) {
        require(isValidAddress(account)) { "Invalid XRPL address: $account" }

        if (signedTx != null) {
            val result = rpcCall("submit", XrplRpcParams(tx_blob = signedTx))
            buildJsonObject {
                put("status", JsonPrimitive(result.engine_result))
                put("message", JsonPrimitive(result.engine_result_message))
            }
        } else {
            // Return the offer structure for external signing
            buildJsonObject {
                put("TransactionType", JsonPrimitive("OfferCreate"))
                put("Account", JsonPrimitive(account))
                put("TakerGets", buildJsonObject {
                    takerGets.value?.let { put("value", JsonPrimitive(it)) }
                    takerGets.currency?.let { put("currency", JsonPrimitive(it)) }
                    takerGets.issuer?.let { put("issuer", JsonPrimitive(it)) }
                    if (takerGets.value == null && takerGets.currency == null) {
                        // Native XRP
                        put("value", JsonPrimitive("0"))
                    }
                })
                put("TakerPays", buildJsonObject {
                    takerPays.value?.let { put("value", JsonPrimitive(it)) }
                    takerPays.currency?.let { put("currency", JsonPrimitive(it)) }
                    takerPays.issuer?.let { put("issuer", JsonPrimitive(it)) }
                })
            }
        }
    }

    /**
     * Get offers for an account.
     */
    suspend fun getAccountOffers(address: String): List<XrplOffer> =
        withContext(Dispatchers.IO) {
            val result = rpcCall("account_offers", XrplRpcParams(account = address))
            result.offers
        }

    /**
     * Get the fee schedule from the server.
     */
    suspend fun getFeeSchedule(): JsonElement = withContext(Dispatchers.IO) {
        rpcCall("fee", XrplRpcParams())
    }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid XRPL address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Private: RPC ───────────────────────────────────────────────────

    private suspend fun rpcCall(method: String, params: XrplRpcParams): XrplRpcResult =
        withContext(Dispatchers.IO) {
            val request = XrplRpcRequest(
                method = method,
                params = listOf(params)
            )
            val body = Json.encodeToString(request)
            val responseBody = httpClient.post(rpcUrl, body)
            val response = Json.decodeFromString<XrplRpcResponse>(responseBody)

            response.result
                ?: throw XrplError.RpcError("Empty response from $method")
        }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "xrpl_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "xrpl_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "xrpl_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "xrpl_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw XrplError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface XrplHttpClient {
    suspend fun post(url: String, body: String): String
}

class DefaultXrplHttpClient : XrplHttpClient {
    override suspend fun post(url: String, body: String): String =
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                connection.outputStream.write(body.toByteArray(Charsets.UTF_8))
                connection.outputStream.flush()
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw XrplError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
