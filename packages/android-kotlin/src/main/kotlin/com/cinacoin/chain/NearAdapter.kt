/**
 * NearAdapter — NEAR Protocol chain adapter for Android.
 *
 * Provides NEAR-specific operations via JSON-RPC:
 * - Account balance fetching
 * - Transaction broadcasting
 * - Contract view calls
 * - Block retrieval
 *
 * ## Usage
 * ```kotlin
 * val adapter = NearAdapter("https://rpc.mainnet.near.org")
 * val balance = adapter.getBalance("account.near")
 * val blockNum = adapter.getBlockNumber()
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
// NEAR RPC Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class NearRpcRequest(
    val jsonrpc: String = "2.0",
    val id: Int = 1,
    val method: String,
    val params: List<Any> = emptyList()
)

@Serializable
data class NearRpcResponse(
    val jsonrpc: String? = null,
    val id: Int? = null,
    val result: JsonElement? = null,
    val error: NearRpcError? = null
)

@Serializable
data class NearRpcError(
    val code: Int = 0,
    val message: String = "",
    val data: String? = null
)

@Serializable
data class NearAccountInfo(
    val amount: String = "0",
    val locked: String = "0",
    val code_hash: String = "",
    val storage_usage: Long = 0,
    val storage_paid_at: Long = 0
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class NearError : Exception() {
    data class InvalidAddress(val address: String) : NearError()
    object NotConnected : NearError()
    data class InvalidRpcUrl(val url: String) : NearError()
    data class RpcError(val message: String) : NearError()
    object InvalidParams : NearError()
    data class UnsupportedMethod(val method: String) : NearError()
    data class NotImplemented(val message: String) : NearError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid NEAR account: $address"
            NotConnected -> "Not connected to a NEAR wallet"
            is InvalidRpcUrl -> "Invalid NEAR RPC URL: $url"
            is RpcError -> "NEAR RPC error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// NEAR Adapter
// ────────────────────────────────────────────────────────────────────────────

/**
 * Real NEAR adapter using JSON-RPC.
 */
class NearAdapter(
    private var rpcUrl: String = "https://rpc.mainnet.near.org",
    private val httpClient: NearHttpClient = DefaultNearHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "near"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET = "https://rpc.mainnet.near.org"
        val TESTNET = "https://rpc.testnet.near.org"

        /** Validate a NEAR account ID. */
        fun isValidAddress(address: String): Boolean {
            return address.matches(Regex("^[a-z0-9_\\-]{2,64}$"))
        }

        /** Convert yoctoNEAR to NEAR string. */
        fun yoctoToNear(yocto: String): String {
            val amount = BigDecimal(yocto)
            return amount.divide(BigDecimal("1000000000000000000000000"), 6, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get NEAR balance for an account via JSON-RPC.
     * @return Balance in NEAR as decimal string.
     */
    override suspend fun getBalance(accountId: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(accountId)) { "Invalid NEAR account: $accountId" }

            val result = rpcCall("query", listOf(
                buildJsonObject {
                    put("request_type", JsonPrimitive("view_account"))
                    put("finality", JsonPrimitive("final"))
                    put("account_id", JsonPrimitive(accountId))
                }
            ))
            val info = Json.decodeFromString<NearAccountInfo>(result.toString())
            yoctoToNear(info.amount)
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Send a signed transaction via JSON-RPC broadcast_tx_commit.
     * @param signedTx Base64-encoded signed transaction.
     * @return Transaction hash.
     */
    override suspend fun sendTransaction(signedTx: String): String =
        withContext(Dispatchers.IO) {
            val result = rpcCall("broadcast_tx_commit", listOf(JsonPrimitive(signedTx)))
            val obj = result.jsonObject
            obj["transaction"]?.jsonObject?.get("hash")?.jsonPrimitive?.content
                ?: throw NearError.RpcError("Invalid transaction response")
        }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the current block height.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val result = rpcCall("status", emptyList())
        val syncInfo = result.jsonObject["sync_info"]?.jsonObject
            ?: throw NearError.RpcError("Invalid status response")
        syncInfo["latest_block_height"]?.jsonPrimitive?.longOrNull
            ?: throw NearError.RpcError("Missing block height")
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate gas fee for a standard transaction.
     * NEAR uses a compute-based fee model.
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        // Standard transaction costs ~0.0001 NEAR
        "0.0001"
    }

    // ─── View Contract ──────────────────────────────────────────────────

    /**
     * Call a view method on a NEAR smart contract.
     * @param contractId Contract account ID.
     * @param methodName Method to call.
     * @param args JSON-encoded arguments.
     */
    suspend fun viewContract(
        contractId: String,
        methodName: String,
        args: String = "{}"
    ): JsonElement = withContext(Dispatchers.IO) {
        val result = rpcCall("query", listOf(
            buildJsonObject {
                put("request_type", JsonPrimitive("call_function"))
                put("finality", JsonPrimitive("final"))
                put("account_id", JsonPrimitive(contractId))
                put("method_name", JsonPrimitive(methodName))
                put("args_base64", JsonPrimitive(
                    java.util.Base64.getEncoder().encodeToString(args.toByteArray())
                ))
            }
        ))
        val arr = result.jsonObject["result"]?.jsonArray
        if (arr == null || arr.isEmpty()) return@withContext JsonNull
        val bytes = arr.map { it.jsonPrimitive.int.toByte() }.toByteArray()
        Json.parseToJsonElement(String(bytes))
    }

    /**
     * Get account access keys.
     */
    suspend fun getAccessKeys(accountId: String): JsonElement = withContext(Dispatchers.IO) {
        rpcCall("query", listOf(
            buildJsonObject {
                put("request_type", JsonPrimitive("view_access_key_list"))
                put("finality", JsonPrimitive("final"))
                put("account_id", JsonPrimitive(accountId))
            }
        ))
    }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid NEAR account: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Private: RPC ───────────────────────────────────────────────────

    private suspend fun rpcCall(method: String, params: List<Any>): JsonElement =
        withContext(Dispatchers.IO) {
            val request = NearRpcRequest(method = method, params = params)
            val body = Json.encodeToString(request)
            val responseBody = httpClient.post(rpcUrl, body)
            val response = Json.decodeFromString<NearRpcResponse>(responseBody)

            if (response.error != null) {
                throw NearError.RpcError("[${response.error.code}] ${response.error.message}")
            }

            response.result ?: JsonNull
        }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "near_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "near_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "near_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "near_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw NearError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface NearHttpClient {
    suspend fun post(url: String, body: String): String
}

class DefaultNearHttpClient : NearHttpClient {
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
                    throw NearError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
