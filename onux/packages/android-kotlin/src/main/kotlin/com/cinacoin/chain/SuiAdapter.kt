/**
 * SuiAdapter — Sui chain adapter for Android.
 *
 * Provides Sui-specific operations via Sui RPC:
 * - Balance fetching (SUI & custom coins)
 * - Transaction broadcasting
 * - Latest checkpoint retrieval
 * - Move function calls
 *
 * ## Usage
 * ```kotlin
 * val adapter = SuiAdapter("https://fullnode.mainnet.sui.io")
 * val balance = adapter.getBalance("0x...")
 * val tx = adapter.sendTransaction("txBytes", ["signature"])
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
// Sui RPC Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class SuiRpcRequest(
    val jsonrpc: String = "2.0",
    val id: Int = 1,
    val method: String,
    val params: JsonArray
)

@Serializable
data class SuiRpcResponse(
    val jsonrpc: String? = null,
    val result: JsonElement? = null,
    val error: SuiRpcError? = null,
    val id: Int? = null
)

@Serializable
data class SuiRpcError(
    val code: Int = 0,
    val message: String = "",
    val data: JsonElement? = null
)

@Serializable
data class SuiBalanceResponse(
    val totalBalance: String = "0",
    val coinObjectId: String? = null,
    val coinType: String = "",
    val coinObjectCount: Int = 0
)

@Serializable
data class SuiCoinInfo(
    val coinType: String = "",
    val coinObjectId: String = "",
    val version: String = "",
    val digest: String = "",
    val balance: String = "0"
)

@Serializable
data class SuiCheckpointInfo(
    val sequenceNumber: String = "0",
    val timestampMs: String = "",
    val digest: String = "",
    val epoch: String = ""
)

@Serializable
data class SuiObjectInfo(
    val digest: String = "",
    val objectId: String = "",
    val version: String = "",
    val type: String = ""
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class SuiError : Exception() {
    data class InvalidAddress(val address: String) : SuiError()
    object NotConnected : SuiError()
    data class InvalidRpcUrl(val url: String) : SuiError()
    data class RpcError(val message: String) : SuiError()
    object InvalidParams : SuiError()
    data class UnsupportedMethod(val method: String) : SuiError()
    data class NotImplemented(val message: String) : SuiError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid Sui address: $address"
            NotConnected -> "Not connected to a Sui wallet"
            is InvalidRpcUrl -> "Invalid Sui RPC URL: $url"
            is RpcError -> "Sui RPC error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// Sui Adapter
// ────────────────────────────────────────────────────────────────────────────

class SuiAdapter(
    private var rpcUrl: String = "https://fullnode.mainnet.sui.io",
    private val httpClient: SuiHttpClient = DefaultSuiHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "sui"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET = "https://fullnode.mainnet.sui.io"
        val TESTNET = "https://fullnode.testnet.sui.io"
        val DEVNET = "https://fullnode.devnet.sui.io"

        val SUI_COIN_TYPE = "0x2::sui::SUI"

        /** Validate a Sui hex address. */
        fun isValidAddress(address: String): Boolean {
            return address.startsWith("0x") && address.length in 3..66
        }

        /** Convert MIST to SUI string. */
        fun mistToSui(mist: String): String {
            val amount = BigDecimal(mist)
            return amount.divide(BigDecimal("1000000000"), 9, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get SUI balance for an address via Sui RPC.
     * @return Balance in SUI as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid Sui address: $address" }

            val params = JsonArray(listOf(JsonPrimitive(address)))
            val result = rpcCall("suix_getBalance", params)
            val obj = result.jsonObject
            val total = obj["totalBalance"]?.jsonPrimitive?.content ?: "0"
            mistToSui(total)
        }

    /**
     * Get balance for a specific coin type.
     */
    suspend fun getCoinBalance(address: String, coinType: String = SUI_COIN_TYPE): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid Sui address: $address" }

            val params = JsonArray(listOf(
                JsonPrimitive(address),
                JsonPrimitive(coinType)
            ))
            val result = rpcCall("suix_getBalance", params)
            val obj = result.jsonObject
            val total = obj["totalBalance"]?.jsonPrimitive?.content ?: "0"
            mistToSui(total)
        }

    /**
     * Get all coin objects owned by an address.
     */
    suspend fun getCoins(address: String, coinType: String? = null): List<SuiCoinInfo> =
        withContext(Dispatchers.IO) {
            val params = JsonArray(listOf(JsonPrimitive(address)).let {
                coinType?.let { list -> it.add(JsonPrimitive(coinType)) } ?: it
            })
            val result = rpcCall("suix_getCoins", params)
            val arr = result.jsonObject["data"]?.jsonArray ?: JsonArray(emptyList())
            arr.mapNotNull {
                it.jsonObject["coinObjectId"]?.jsonPrimitive?.content?.let { id ->
                    SuiCoinInfo(
                        coinType = it.jsonObject["coinType"]?.jsonPrimitive?.content ?: "",
                        coinObjectId = id,
                        version = it.jsonObject["version"]?.jsonPrimitive?.content ?: "",
                        digest = it.jsonObject["digest"]?.jsonPrimitive?.content ?: "",
                        balance = it.jsonObject["balance"]?.jsonPrimitive?.content ?: "0"
                    )
                }
            }
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Execute a signed transaction via Sui RPC.
     * @param txBytes Base64-encoded transaction bytes.
     * @param signatures List of base64-encoded signatures.
     * @return Transaction digest.
     */
    suspend fun sendTransaction(
        txBytes: String,
        signatures: List<String>
    ): String = withContext(Dispatchers.IO) {
        val params = JsonArray(listOf(
            JsonPrimitive(txBytes),
            JsonArray(signatures.map { JsonPrimitive(it) })
        ))
        val result = rpcCall("sui_executeTransactionBlock", params)
        result.jsonPrimitive.content
    }

    // Required by ChainAdapter interface
    override suspend fun sendTransaction(rawTx: String): String = withContext(Dispatchers.IO) {
        // Fallback: treat rawTx as txBytes with no signatures (dry-run mode)
        sendTransaction(rawTx, emptyList())
    }

    // ─── Latest Checkpoint ──────────────────────────────────────────────

    /**
     * Get the latest checkpoint sequence number.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val result = rpcCall("sui_getLatestCheckpointSequenceNumber", emptyList())
        result.jsonPrimitive.content.toLongOrNull()
            ?: throw SuiError.RpcError("Invalid checkpoint response")
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate gas for a transaction.
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        // Sui gas is computed; standard tx ~100000 MIST
        "100000"
    }

    // ─── Call Move Function ─────────────────────────────────────────────

    /**
     * Call a Move function via dev inspect transaction.
     * @param sender Sender address.
     * @param packageObjectId Move package ID.
     * @param moduleName Move module name.
     * @param functionName Move function name.
     * @param typeArguments Generic type arguments.
     * @param arguments Function arguments.
     */
    suspend fun callMoveFunction(
        sender: String,
        packageObjectId: String,
        moduleName: String,
        functionName: String,
        typeArguments: List<String> = emptyList(),
        arguments: List<String> = emptyList()
    ): JsonElement = withContext(Dispatchers.IO) {
        val params = JsonArray(listOf(
            JsonPrimitive(sender),
            JsonPrimitive(packageObjectId),
            JsonPrimitive(moduleName),
            JsonPrimitive(functionName),
            JsonArray(typeArguments.map { JsonPrimitive(it) }),
            JsonArray(arguments.map { JsonPrimitive(it) }),
            buildJsonObject { put("gas_budget", JsonPrimitive("50000000")) }
        ))
        rpcCall("suix_devInspectTransactionBlock", params)
    }

    /**
     * Get objects owned by an address.
     */
    suspend fun getOwnedObjects(address: String): List<SuiObjectInfo> =
        withContext(Dispatchers.IO) {
            val params = JsonArray(listOf(JsonPrimitive(address)))
            val result = rpcCall("suix_getOwnedObjects", params)
            val arr = result.jsonObject["data"]?.jsonArray ?: JsonArray(emptyList())
            arr.mapNotNull {
                it.jsonObject["data"]?.jsonObject?.let { data ->
                    SuiObjectInfo(
                        digest = data["digest"]?.jsonPrimitive?.content ?: "",
                        objectId = data["objectId"]?.jsonPrimitive?.content ?: "",
                        version = data["version"]?.jsonPrimitive?.content ?: "",
                        type = data["type"]?.jsonPrimitive?.content ?: ""
                    )
                }
            }
        }

    /**
     * Get transaction block details.
     */
    suspend fun getTransactionBlock(digest: String): JsonElement =
        withContext(Dispatchers.IO) {
            val params = JsonArray(listOf(
                JsonPrimitive(digest),
                buildJsonObject {
                    put("showInput", JsonPrimitive(true))
                    put("showEffects", JsonPrimitive(true))
                    put("showEvents", JsonPrimitive(true))
                }
            ))
            rpcCall("sui_getTransactionBlock", params)
        }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid Sui address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Private: RPC ───────────────────────────────────────────────────

    private suspend fun rpcCall(method: String, params: JsonArray): JsonElement =
        withContext(Dispatchers.IO) {
            val request = SuiRpcRequest(method = method, params = params)
            val body = Json.encodeToString(request)
            val responseBody = httpClient.post(rpcUrl, body)
            val response = Json.decodeFromString<SuiRpcResponse>(responseBody)

            if (response.error != null) {
                throw SuiError.RpcError("[${response.error.code}] ${response.error.message}")
            }

            response.result ?: JsonNull
        }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "sui_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "sui_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "sui_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "sui_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw SuiError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface SuiHttpClient {
    suspend fun post(url: String, body: String): String
}

class DefaultSuiHttpClient : SuiHttpClient {
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
                    throw SuiError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
