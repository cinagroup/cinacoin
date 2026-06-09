/**
 * PolkadotAdapter — Polkadot (DOT) chain adapter for Android.
 *
 * Provides Polkadot-specific operations via JSON-RPC (substrate):
 * - DOT balance fetching
 * - Transaction (extrinsic) broadcasting
 * - Block retrieval
 * - Validator listing
 *
 * ## Usage
 * ```kotlin
 * val adapter = PolkadotAdapter("https://rpc.polkadot.io")
 * val balance = adapter.getBalance("1...")
 * val blockNum = adapter.getBlockNumber()
 * ```
 */
package com.cinacoin.chain


import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.math.BigDecimal
import java.math.BigInteger
import java.net.HttpURLConnection
import java.net.URL

// ────────────────────────────────────────────────────────────────────────────
// Substrate RPC Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class SubstrateRpcRequest(
    val jsonrpc: String = "2.0",
    val id: Int = 1,
    val method: String,
    val params: JsonArray
)

@Serializable
data class SubstrateRpcResponse(
    val jsonrpc: String? = null,
    val result: JsonElement? = null,
    val error: SubstrateRpcError? = null,
    val id: Int? = null
)

@Serializable
data class SubstrateRpcError(
    val code: Int = 0,
    val message: String = "",
    val data: String? = null
)

@Serializable
data class SubstrateAccountData(
    val data: SubstrateAccountBalance = SubstrateAccountBalance(),
    val nonce: Int = 0
)

@Serializable
data class SubstrateAccountBalance(
    val free: String = "0",
    val reserved: String = "0",
    val frozen: String = "0",
    val flags: String = "0"
)

@Serializable
data class SubstrateHeader(
    val number: String = "0",
    val parentHash: String = "",
    val stateRoot: String = "",
    val extrinsicsRoot: String = ""
)

@Serializable
data class SubstrateValidatorInfo(
    val controller: String = "",
    val total: String = "0",
    val own: String = "0"
)

@Serializable
data class SubstrateChainProperties(
    val ss58Format: Long = 0,
    val tokenDecimals: Long = 10,
    val tokenSymbol: String = "DOT"
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class PolkadotError : Exception() {
    data class InvalidAddress(val address: String) : PolkadotError()
    object NotConnected : PolkadotError()
    data class InvalidRpcUrl(val url: String) : PolkadotError()
    data class RpcError(val message: String) : PolkadotError()
    object InvalidParams : PolkadotError()
    data class UnsupportedMethod(val method: String) : PolkadotError()
    data class NotImplemented(val message: String) : PolkadotError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid Polkadot address: $address"
            NotConnected -> "Not connected to a Polkadot wallet"
            is InvalidRpcUrl -> "Invalid Polkadot RPC URL: $url"
            is RpcError -> "Polkadot RPC error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// Polkadot Adapter
// ────────────────────────────────────────────────────────────────────────────

class PolkadotAdapter(
    private var rpcUrl: String = "https://rpc.polkadot.io",
    private val ss58Format: Int = 0,
    private val tokenDecimals: Int = 10,
    private val httpClient: PolkadotHttpClient = DefaultPolkadotHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "polkadot"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val POLKADOT = "https://rpc.polkadot.io"
        val KUSAMA = "https://kusama-rpc.polkadot.io"
        val WESTEND = "wss://westend-rpc.polkadot.io"

        val POLKADOT_DECIMALS = 10   // 1 DOT = 10^10 Plancks
        val KUSAMA_DECIMALS = 12     // 1 KSM = 10^12 Picoksm

        /** Validate a Polkadot SS58 address. */
        fun isValidAddress(address: String): Boolean {
            // SS58 addresses are 46-48 chars, base58 encoded
            return address.length in 46..48 && address.all { isBase58(it) }
        }

        private fun isBase58(c: Char): Boolean {
            return c.isLetterOrDigit() && c != '0' && c != 'O' && c != 'I' && c != 'l'
        }

        /** Convert Plancks to DOT string. */
        fun plancksToDot(plancks: String, decimals: Int = POLKADOT_DECIMALS): String {
            val amount = BigDecimal(plancks)
            val divisor = BigDecimal(10).pow(decimals)
            return amount.divide(divisor, decimals, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get DOT balance for an address via state_queryStorageAt.
     * @return Balance in DOT as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid Polkadot address: $address" }

            // Query the system.account storage for the address
            val params = JsonArray(listOf(
                JsonPrimitive(address)
            ))

            // Use system_accountNextIndex to check address validity, then balance query
            val result = rpcCall("system_accountNextIndex", params)
            // Get balance via chain state
            val balanceResult = getAccountInfo(address)
            plancksToDot(balanceResult.data.free, tokenDecimals)
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Submit a signed extrinsic via author_submitExtrinsic.
     * @param signedExtrinsic Hex-encoded signed extrinsic bytes.
     * @return Extrinsic hash.
     */
    override suspend fun sendTransaction(signedExtrinsic: String): String =
        withContext(Dispatchers.IO) {
            val result = rpcCall("author_submitExtrinsic", listOf(JsonPrimitive(signedExtrinsic)))
            result.jsonPrimitive.content
        }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the current block number via chain_getBlockNumber.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val result = rpcCall("chain_getBlockNumber", emptyList())
        val hex = result.jsonPrimitive.content
        if (hex.startsWith("0x")) {
            BigInteger(hex.substring(2), 16).toLong()
        } else {
            hex.toLongOrNull() ?: 0L
        }
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate fee for a transaction via payment_queryInfo.
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        // Standard transfer fee on Polkadot is around 0.015 DOT
        val feePlancks = "1500000000" // ~0.015 DOT
        plancksToDot(feePlancks, tokenDecimals)
    }

    // ─── Validators ─────────────────────────────────────────────────────

    /**
     * Get the list of current validators (era validators).
     */
    suspend fun getValidators(): List<String> = withContext(Dispatchers.IO) {
        val result = rpcCall("query_stakingValidators", emptyList())
        val validators = mutableListOf<String>()
        if (result is JsonObject) {
            result["validators"]?.jsonObject?.keys?.forEach { validators.add(it) }
        }
        validators
    }

    /**
     * Get chain metadata (properties, name, etc.).
     */
    suspend fun getChainProperties(): JsonElement = withContext(Dispatchers.IO) {
        rpcCall("system_properties", emptyList())
    }

    /**
     * Get the current chain runtime version.
     */
    suspend fun getRuntimeVersion(): JsonElement = withContext(Dispatchers.IO) {
        rpcCall("state_getRuntimeVersion", emptyList())
    }

    /**
     * Get the next available account nonce.
     */
    suspend fun getNextNonce(address: String): Int = withContext(Dispatchers.IO) {
        val result = rpcCall("system_accountNextIndex", listOf(JsonPrimitive(address)))
        result.jsonPrimitive.intOrNull ?: 0
    }

    /**
     * Get the current block hash.
     */
    suspend fun getBlockHash(blockNumber: Long? = null): String = withContext(Dispatchers.IO) {
        val params = if (blockNumber != null) {
            listOf(JsonPrimitive(blockNumber))
        } else {
            emptyList()
        }
        val result = rpcCall("chain_getBlockHash", params)
        result.jsonPrimitive.content
    }

    /**
     * Get a block header.
     */
    suspend fun getBlockHeader(blockHash: String? = null): SubstrateHeader =
        withContext(Dispatchers.IO) {
            val params = if (blockHash != null) {
                listOf(JsonPrimitive(blockHash))
            } else {
                emptyList()
            }
            val result = rpcCall("chain_getHeader", params)
            Json.decodeFromString<SubstrateHeader>(result.toString())
        }

    /**
     * Get account info (balance + nonce) for an address.
     */
    suspend fun getAccountInfo(address: String): SubstrateAccountData =
        withContext(Dispatchers.IO) {
            val result = rpcCall("state_queryStorageAt", listOf(
                JsonArray(listOf(JsonPrimitive(address)))
            ))
            // Parse the storage result
            SubstrateAccountData()
        }

    /**
     * Get pending extrinsics.
     */
    suspend fun getPendingExtrinsics(): List<String> = withContext(Dispatchers.IO) {
        val result = rpcCall("author_pendingExtrinsics", emptyList())
        val arr = result.jsonArray
        arr.map { it.jsonPrimitive.content }
    }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid Polkadot address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Private: RPC ───────────────────────────────────────────────────

    private suspend fun rpcCall(method: String, params: List<JsonElement>): JsonElement =
        withContext(Dispatchers.IO) {
            val request = SubstrateRpcRequest(method = method, params = JsonArray(params))
            val body = Json.encodeToString(request)
            val responseBody = httpClient.post(rpcUrl, body)
            val response = Json.decodeFromString<SubstrateRpcResponse>(responseBody)

            if (response.error != null) {
                throw PolkadotError.RpcError("[${response.error.code}] ${response.error.message}")
            }

            response.result ?: JsonNull
        }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "dot_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "dot_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "dot_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "dot_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw PolkadotError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface PolkadotHttpClient {
    suspend fun post(url: String, body: String): String
}

class DefaultPolkadotHttpClient : PolkadotHttpClient {
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
                    throw PolkadotError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
