/**
 * TronAdapter — TRON (TRX) chain adapter for Android.
 *
 * Provides TRON-specific operations via TronGrid API:
 * - TRX and TRC-20 balance fetching
 * - Transaction broadcasting
 * - Block retrieval
 * - Energy estimation
 *
 * ## Usage
 * ```kotlin
 * val adapter = TronAdapter("https://api.trongrid.io")
 * val balance = adapter.getBalance("T...")
 * val txId = adapter.sendTransaction("signedTx...")
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
// TronGrid API Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class TronAccountResponse(
    val data: List<TronAccount> = emptyList()
)

@Serializable
data class TronAccount(
    val address: String = "",
    val balance: Long = 0,
    val createTime: Long = 0,
    val latestOprationTime: Long = 0,
    val trc20: Map<String, String>? = null,
    val bandwidth: TronBandwidth? = null,
    val assetV2: Map<String, Long>? = null,
    val freeNetLimit: Long = 0,
    val netLimit: Long = 0,
    val energyLimit: Long = 0
)

@Serializable
data class TronBandwidth(
    val freeNetUsed: Long = 0,
    val freeNetLimit: Long = 0,
    val netUsed: Long = 0,
    val netLimit: Long = 0
)

@Serializable
data class TronSendTxResponse(
    val result: Boolean = false,
    val txid: String = "",
    val code: String? = null,
    val message: String? = null
)

@Serializable
data class TronBlockResponse(
    val blockID: String = "",
    val block_header: TronBlockHeader = TronBlockHeader(),
    val transactions: List<TronTxInfo> = emptyList()
)

@Serializable
data class TronBlockHeader(
    val raw_data: TronBlockRawData = TronBlockRawData()
)

@Serializable
data class TronBlockRawData(
    val number: Long = 0,
    val txTrieRoot: String = "",
    val witnessAddress: String = "",
    val parentHash: String = "",
    val version: Int = 0,
    val timestamp: Long = 0
)

@Serializable
data class TronTxInfo(
    val txID: String = "",
    val raw_data: TronTxRawData = TronTxRawData(),
    val signature: List<String> = emptyList()
)

@Serializable
data class TronTxRawData(
    val contract: List<TronContract> = emptyList(),
    val ref_block_bytes: String = "",
    val ref_block_hash: String = "",
    val expiration: Long = 0,
    val timestamp: Long = 0,
    val fee_limit: Long = 0
)

@Serializable
data class TronContract(
    val type: String = "",
    val parameter: TronContractParameter = TronContractParameter()
)

@Serializable
data class TronContractParameter(
    val value: JsonObject = JsonObject(emptyMap()),
    val type_url: String = ""
)

@Serializable
data class TronEnergyResponse(
    val energy_used: Long = 0,
    val energy_limit: Long = 0
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class TronError : Exception() {
    data class InvalidAddress(val address: String) : TronError()
    object NotConnected : TronError()
    data class InvalidRpcUrl(val url: String) : TronError()
    data class RpcError(val message: String) : TronError()
    object InvalidParams : TronError()
    data class UnsupportedMethod(val method: String) : TronError()
    data class NotImplemented(val message: String) : TronError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid TRON address: $address"
            NotConnected -> "Not connected to a TRON wallet"
            is InvalidRpcUrl -> "Invalid TronGrid URL: $url"
            is RpcError -> "TronGrid API error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// TRON Adapter
// ────────────────────────────────────────────────────────────────────────────

class TronAdapter(
    private var rpcUrl: String = "https://api.trongrid.io",
    private val apiKey: String? = null,
    private val httpClient: TronHttpClient = DefaultTronHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "tron"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET = "https://api.trongrid.io"
        val NILE = "https://nile.trongrid.io"
        val SHASTA = "https://api.shasta.trongrid.io"

        /** Validate a TRON base58check address. */
        fun isValidAddress(address: String): Boolean {
            return address.startsWith("T") && address.length == 34 &&
                address.all { it.isLetterOrDigit() }
        }

        /** Convert sun to TRX string. */
        fun sunToTrx(sun: Long): String =
            BigDecimal(sun).divide(BigDecimal("1000000"), 6, java.math.RoundingMode.HALF_UP)
                .toPlainString()
    }

    private val headers: Map<String, String>
        get() = if (apiKey != null) mapOf("TRON-PRO-API-KEY" to apiKey) else emptyMap()

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get TRX balance for an address via TronGrid API.
     * @return Balance in TRX as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid TRON address: $address" }

            val url = "$rpcUrl/v1/accounts/$address"
            val responseBody = httpClient.get(url, headers)
            val response = Json.decodeFromString<TronAccountResponse>(responseBody)

            if (response.data.isEmpty()) {
                return@withContext "0.000000"
            }

            val account = response.data.first()
            sunToTrx(account.balance)
        }

    /**
     * Get TRC-20 token balance for an address.
     * @param tokenContract TRC-20 contract address.
     */
    suspend fun getTokenBalance(address: String, tokenContract: String): String =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/v1/accounts/$address"
            val responseBody = httpClient.get(url, headers)
            val response = Json.decodeFromString<TronAccountResponse>(responseBody)

            if (response.data.isEmpty()) return@withContext "0"

            response.data.first().trc20?.get(tokenContract) ?: "0"
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Send a signed transaction via TronGrid API.
     * @param signedTx JSON-encoded signed transaction.
     * @return Transaction ID.
     */
    override suspend fun sendTransaction(signedTx: String): String =
        withContext(Dispatchers.IO) {
            val responseBody = httpClient.post("$rpcUrl/wallet/broadcasttransaction", signedTx, headers)
            val response = Json.decodeFromString<TronSendTxResponse>(responseBody)

            if (!response.result) {
                throw TronError.RpcError(response.message ?: "Transaction broadcast failed")
            }

            response.txid
        }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the latest block number.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val url = "$rpcUrl/blocks?limit=1"
        val responseBody = httpClient.get(url, headers)
        val obj = Json.parseToJsonElement(responseBody).jsonArray

        if (obj.isEmpty()) throw TronError.RpcError("No blocks found")

        obj[0].jsonObject["block_header"]?.jsonObject?.get("raw_data")
            ?.jsonObject?.get("number")?.jsonPrimitive?.longOrNull
            ?: throw TronError.RpcError("Invalid block response")
    }

    /**
     * Get block by number.
     */
    suspend fun getBlockByNumber(number: Long): TronBlockResponse =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/blocks?limit=1&min=$number&max=$number"
            val responseBody = httpClient.get(url, headers)
            val arr = Json.parseToJsonElement(responseBody).jsonArray
            if (arr.isEmpty()) throw TronError.RpcError("Block $number not found")
            Json.decodeFromString<TronBlockResponse>(arr[0].toString())
        }

    // ─── Fee / Energy Estimation ───────────────────────────────────────

    /**
     * Estimate energy cost for a transaction.
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        // TRON bandwidth: 1 transaction uses ~268 bandwidth
        // Energy varies by contract interaction
        "268" // Bandwidth cost for basic TRX transfer
    }

    /**
     * Estimate energy for a contract call.
     * @param ownerAddress Sender address.
     * @param contractAddress Contract address.
     * @param functionSelector Function selector (e.g. "transfer(address,uint256)").
     */
    suspend fun estimateEnergy(
        ownerAddress: String,
        contractAddress: String,
        functionSelector: String = "transfer(address,uint256)",
        parameter: String = ""
    ): String = withContext(Dispatchers.IO) {
        val body = buildJsonObject {
            put("owner_address", JsonPrimitive(ownerAddress))
            put("contract_address", JsonPrimitive(contractAddress))
            put("function_selector", JsonPrimitive(functionSelector))
            if (parameter.isNotEmpty()) put("parameter", JsonPrimitive(parameter))
        }
        val requestBody = Json.encodeToString(body)
        val responseBody = httpClient.post("$rpcUrl/wallet/estimateenergy", requestBody, headers)
        val obj = Json.parseToJsonElement(responseBody).jsonObject
        obj["energy_required"]?.jsonPrimitive?.longOrNull?.toString() ?: "0"
    }

    // ─── Account Resources ──────────────────────────────────────────────

    /**
     * Get account bandwidth and energy resources.
     */
    suspend fun getAccountResources(address: String): JsonElement =
        withContext(Dispatchers.IO) {
            val body = """{"address":"$address"}"""
            val responseBody = httpClient.post("$rpcUrl/wallet/getaccountresource", body, headers)
            Json.parseToJsonElement(responseBody)
        }

    /**
     * Get transaction info by ID.
     */
    suspend fun getTransaction(txId: String): JsonElement =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/v1/transactions/$txId"
            val responseBody = httpClient.get(url, headers)
            Json.parseToJsonElement(responseBody)
        }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid TRON address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "tron_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "tron_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "tron_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "tron_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw TronError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface TronHttpClient {
    suspend fun get(url: String, headers: Map<String, String>): String
    suspend fun post(url: String, body: String, headers: Map<String, String>): String
}

class DefaultTronHttpClient : TronHttpClient {
    override suspend fun get(url: String, headers: Map<String, String>): String =
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                headers.forEach { connection.setRequestProperty(it.key, it.value) }
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw TronError.RpcError("HTTP ${connection.responseCode}")
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
                    throw TronError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
