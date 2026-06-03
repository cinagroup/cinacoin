/**
 * TonAdapter — TON (The Open Network) chain adapter for Android.
 *
 * Provides TON-specific operations via toncenter API:
 * - Balance fetching
 * - Transaction broadcasting
 * - Block retrieval
 * - Fee estimation
 *
 * ## Usage
 * ```kotlin
 * val adapter = TonAdapter("https://toncenter.com/api/v2")
 * val balance = adapter.getBalance("EQ...")
 * val tx = adapter.sendTransaction("base64boc...")
 * ```
 */
package com.cinacoin.chain

import com.cinacoin.chain.ChainAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.math.BigDecimal
import java.net.HttpURLConnection
import java.net.URL

// ────────────────────────────────────────────────────────────────────────────
// TON API Response Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class TonBalanceResponse(
    val ok: Boolean = false,
    val result: String = "0"
)

@Serializable
data class TonSendBocResponse(
    val ok: Boolean = false,
    val result: TonSendResult? = null
)

@Serializable
data class TonSendResult(
    val messageHash: String = "",
    val lastBlock: Int = 0
)

@Serializable
data class TonBlockResponse(
    val ok: Boolean = false,
    val result: TonBlockInfo? = null
)

@Serializable
data class TonBlockInfo(
    val seqno: Int = 0,
    val workchain: Int = 0,
    val shard: String = "",
    val rootHash: String = "",
    val fileHash: String = "",
    val genUtime: Long = 0L
)

@Serializable
data class TonTransactionsResponse(
    val ok: Boolean = false,
    val result: List<TonTransaction> = emptyList()
)

@Serializable
data class TonTransaction(
    val transactionId: TonTxId = TonTxId(),
    val address: String = "",
    val utime: Long = 0L,
    val totalFees: String = "0",
    val prevTransactionId: TonTxId = TonTxId(),
    val inMsg: TonMessage? = null,
    val outMsgs: List<TonMessage> = emptyList()
)

@Serializable
data class TonTxId(
    val lt: String = "0",
    val hash: String = "",
    val utime: Long = 0L
)

@Serializable
data class TonMessage(
    val source: String = "",
    val destination: String = "",
    val value: String = "0",
    val fwdFee: String = "0",
    val ihrFee: String = "0",
    val createdLt: String = "0",
    val bodyHash: String = "",
    val msgData: TonMsgData? = null
)

@Serializable
data class TonMsgData(
    val type: String = "",
    val body: String = "",
    val init: String? = null
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class TonError : Exception() {
    data class InvalidAddress(val address: String) : TonError()
    object NotConnected : TonError()
    data class InvalidRpcUrl(val url: String) : TonError()
    data class RpcError(val message: String) : TonError()
    object InvalidParams : TonError()
    data class UnsupportedMethod(val method: String) : TonError()
    data class NotImplemented(val message: String) : TonError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid TON address: $address"
            NotConnected -> "Not connected to a TON wallet"
            is InvalidRpcUrl -> "Invalid toncenter URL: $url"
            is RpcError -> "toncenter API error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// TON Adapter
// ────────────────────────────────────────────────────────────────────────────

/**
 * Real TON adapter using toncenter API v2.
 */
class TonAdapter(
    private var rpcUrl: String = "https://toncenter.com/api/v2",
    private val apiKey: String? = null,
    private val httpClient: TonHttpClient = DefaultTonHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "ton"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET = "https://toncenter.com/api/v2"
        val TESTNET = "https://testnet.toncenter.com/api/v2"

        /** Validate a TON address (user-friendly or raw format). */
        fun isValidAddress(address: String): Boolean {
            // Raw format: workchain:hex
            if (address.matches(Regex("^-?[0-9]:[a-fA-F0-9]{64}$"))) return true
            // User-friendly: EQ... or UQ... (48 chars base64)
            if (address.length == 48 && address.matches(Regex("^[EQk-][-_0-9A-Za-z]{46}$"))) return true
            return false
        }

        /** Convert nanotons to TON string. */
        fun nanotonToTon(nanotons: String): String {
            val nano = BigDecimal(nanotons)
            return nano.divide(BigDecimal("1000000000"), 9, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }

        /** Convert TON to nanotons. */
        fun tonToNanoton(ton: Double): String = (ton * 1e9).toLong().toString()
    }

    private val headers: Map<String, String>
        get() = if (apiKey != null) mapOf("X-API-Key" to apiKey) else emptyMap()

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get TON balance for an address via toncenter API.
     * @return Balance in TON as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid TON address: $address" }

            val url = "$rpcUrl/getAddressInformation?address=$address"
            val responseBody = httpClient.get(url, headers)
            val response = Json.decodeFromString<TonBalanceResponse>(responseBody)

            if (!response.ok) {
                throw TonError.RpcError("Failed to get balance for $address")
            }

            nanotonToTon(response.result)
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Send a BoC (Bag of Cells) encoded transaction via toncenter API.
     * @param boc Base64-encoded BoC.
     * @return Message hash.
     */
    override suspend fun sendTransaction(boc: String): String =
        withContext(Dispatchers.IO) {
            val body = """{"boc":"$boc"}"""
            val responseBody = httpClient.post("$rpcUrl/sendBoc", body, headers)
            val response = Json.decodeFromString<TonSendBocResponse>(responseBody)

            if (!response.ok || response.result == null) {
                throw TonError.RpcError("Failed to send transaction")
            }

            response.result.messageHash
        }

    // ─── Latest Block ──────────────────────────────────────────────────

    /**
     * Get the latest masterchain block.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val url = "$rpcUrl/getMasterchainInfo"
        val responseBody = httpClient.get(url, headers)
        val response = Json.decodeFromString<TonBlockResponse>(responseBody)

        if (!response.ok || response.result == null) {
            throw TonError.RpcError("Failed to get block info")
        }

        response.result.seqno.toLong()
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate the minimum fee for a transaction.
     * Returns a typical fee in TON (around 0.005 TON for standard transfers).
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        // TON uses a gas-based fee model; this provides a typical estimate.
        val url = "$rpcUrl/getMasterchainInfo"
        runCatching {
            httpClient.get(url, headers)
            "0.005" // Standard transfer fee in TON
        }.getOrElse { "0.005" }
    }

    // ─── Get Transactions ───────────────────────────────────────────────

    /**
     * Get recent transactions for an address.
     * @param limit Max number of transactions to return.
     */
    suspend fun getTransactions(address: String, limit: Int = 20): List<TonTransaction> =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/getTransactions?address=$address&limit=$limit"
            val responseBody = httpClient.get(url, headers)
            val response = Json.decodeFromString<TonTransactionsResponse>(responseBody)

            if (!response.ok) {
                throw TonError.RpcError("Failed to get transactions")
            }

            response.result
        }

    /**
     * Get account state/info for an address.
     */
    suspend fun getAccountState(address: String): JsonElement =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid TON address: $address" }
            val url = "$rpcUrl/getAddressInformation?address=$address"
            val responseBody = httpClient.get(url, headers)
            Json.parseToJsonElement(responseBody)
        }

    /**
     * Run a get-method on a smart contract.
     * @param address Contract address.
     * @param method Get method name.
     * @param args Method arguments.
     */
    suspend fun runGetMethod(
        address: String,
        method: String,
        args: List<String> = emptyList()
    ): JsonElement = withContext(Dispatchers.IO) {
        val params = buildJsonObject {
            put("address", JsonPrimitive(address))
            put("method", JsonPrimitive(method))
            if (args.isNotEmpty()) {
                put("args", JsonArray(args.map { JsonPrimitive(it) }))
            }
        }
        val body = Json.encodeToString(params)
        val responseBody = httpClient.post("$rpcUrl/runGetMethod", body, headers)
        Json.parseToJsonElement(responseBody)
    }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid TON address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "ton_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "ton_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "ton_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "ton_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw TonError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface TonHttpClient {
    suspend fun get(url: String, headers: Map<String, String>): String
    suspend fun post(url: String, body: String, headers: Map<String, String>): String
}

class DefaultTonHttpClient : TonHttpClient {
    override suspend fun get(url: String, headers: Map<String, String>): String =
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                headers.forEach { connection.setRequestProperty(it.key, it.value) }
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw TonError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }

    override suspend fun post(url: String, body: String, headers: Map<String, String>): String =
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                headers.forEach { connection.setRequestProperty(it.key, it.value) }
                connection.doOutput = true
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                connection.outputStream.write(body.toByteArray(Charsets.UTF_8))
                connection.outputStream.flush()
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw TonError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
