/**
 * StarknetAdapter — Starknet chain adapter for Android.
 *
 * Provides Starknet-specific operations via JSON-RPC:
 * - Balance fetching (ETH & ERC-20)
 * - Transaction broadcasting
 * - Contract calls
 * - Fee estimation
 *
 * ## Usage
 * ```kotlin
 * val adapter = StarknetAdapter("https://free-rpc.nethermind.io/mainnet-juno")
 * val balance = adapter.getBalance("0x...")
 * val tx = adapter.sendTransaction(accountAddress, calldata)
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
// Starknet RPC Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class StarknetRpcRequest(
    val jsonrpc: String = "2.0",
    val id: Int = 1,
    val method: String,
    val params: JsonArray
)

@Serializable
data class StarknetRpcResponse(
    val jsonrpc: String? = null,
    val result: JsonElement? = null,
    val error: StarknetRpcError? = null,
    val id: Int? = null
)

@Serializable
data class StarknetRpcError(
    val code: Int = 0,
    val message: String = ""
)

@Serializable
data class StarknetFeeEstimate(
    val gas_consumed: String = "0",
    val gas_price: String = "0",
    val overall_fee: String = "0"
)

@Serializable
data class StarknetBlockInfo(
    val block_hash: String = "",
    val block_number: Int = 0,
    val new_root: String = "",
    val timestamp: Long = 0
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class StarknetError : Exception() {
    data class InvalidAddress(val address: String) : StarknetError()
    object NotConnected : StarknetError()
    data class InvalidRpcUrl(val url: String) : StarknetError()
    data class RpcError(val message: String) : StarknetError()
    object InvalidParams : StarknetError()
    data class UnsupportedMethod(val method: String) : StarknetError()
    data class NotImplemented(val message: String) : StarknetError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid Starknet address: $address"
            NotConnected -> "Not connected to a Starknet wallet"
            is InvalidRpcUrl -> "Invalid Starknet RPC URL: $url"
            is RpcError -> "Starknet RPC error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// Starknet Adapter
// ────────────────────────────────────────────────────────────────────────────

class StarknetAdapter(
    private var rpcUrl: String = "https://free-rpc.nethermind.io/mainnet-juno",
    private val httpClient: StarknetHttpClient = DefaultStarknetHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "starknet"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET = "https://free-rpc.nethermind.io/mainnet-juno"
        val SEPOLIA = "https://free-rpc.nethermind.io/sepolia-juno"

        // Starknet ETH token address
        val ETH_TOKEN_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

        /** Validate a Starknet address (0x + up to 64 hex chars). */
        fun isValidAddress(address: String): Boolean {
            return address.startsWith("0x") && address.length in 3..66 &&
                address.substring(2).all { it.isDigit() || it in 'a'..'f' || it in 'A'..'F' }
        }

        /** Convert wei (18 decimals) to ETH string. */
        fun weiToEth(wei: String): String {
            val amount = BigDecimal(wei)
            return amount.divide(BigDecimal("1000000000000000000"), 6, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get native token (STRK/ETH) balance via balanceOf on ERC-20.
     * @return Balance as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid Starknet address: $address" }

            // Call balanceOf on the ETH token contract
            val result = callContract(
                contractAddress = ETH_TOKEN_ADDRESS,
                entryPointSelector = "balance_of",
                calldata = listOf(address)
            )
            val balance = result.firstOrNull() ?: "0"
            weiToEth(balance)
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Invoke a Starknet transaction via JSON-RPC.
     * @param accountAddress Account that invokes the contract.
     * @param calldata Transaction calldata (list of field elements).
     * @return Transaction hash.
     */
    suspend fun sendTransaction(
        accountAddress: String,
        calldata: List<String>
    ): String = withContext(Dispatchers.IO) {
        require(isValidAddress(accountAddress)) { "Invalid Starknet address: $accountAddress" }

        val invokeTx = buildJsonObject {
            put("type", JsonPrimitive("INVOKE"))
            put("sender_address", JsonPrimitive(accountAddress))
            put("calldata", JsonArray(calldata.map { JsonPrimitive(it) }))
            put("max_fee", JsonPrimitive("0x0"))
            put("version", JsonPrimitive("0x1"))
            put("signature", JsonArray(emptyList()))
            put("nonce", JsonPrimitive("0x0"))
        }

        val params = JsonArray(listOf(
            invokeTx,
            JsonObject(mapOf("class" to JsonPrimitive("BROADCAST")))
        ))
        val result = rpcCall("starknet_addInvokeTransaction", params)
        result.jsonObject["transaction_hash"]?.jsonPrimitive?.content
            ?: throw StarknetError.RpcError("Invalid invoke response")
    }

    // Required by ChainAdapter (simplified)
    override suspend fun sendTransaction(rawTx: String): String = withContext(Dispatchers.IO) {
        val result = rpcCall("starknet_addInvokeTransaction", listOf(JsonPrimitive(rawTx)))
        result.jsonObject["transaction_hash"]?.jsonPrimitive?.content
            ?: throw StarknetError.RpcError("Invalid transaction response")
    }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the current block number.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val result = rpcCall("starknet_blockNumber", emptyList())
        result.jsonPrimitive.longOrNull
            ?: throw StarknetError.RpcError("Invalid block number response")
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate the fee for a transaction.
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        val result = rpcCall("starknet_estimateFee", emptyList())
        val arr = result.jsonArray
        if (arr.isEmpty()) return@withContext "0"
        val overallFee = arr[0].jsonObject["overall_fee"]?.jsonPrimitive?.content ?: "0"
        weiToEth(overallFee)
    }

    // ─── Call Contract ──────────────────────────────────────────────────

    /**
     * Call a Starknet contract view function.
     * @param contractAddress Target contract address.
     * @param entryPointSelector Function selector (name or felt).
     * @param calldata Function arguments.
     * @return List of return values.
     */
    suspend fun callContract(
        contractAddress: String,
        entryPointSelector: String,
        calldata: List<String> = emptyList()
    ): List<String> = withContext(Dispatchers.IO) {
        val request = buildJsonObject {
            put("contract_address", JsonPrimitive(contractAddress))
            put("entry_point_selector", JsonPrimitive(entryPointSelector))
            put("calldata", JsonArray(calldata.map { JsonPrimitive(it) }))
        }
        val result = rpcCall("starknet_call", listOf(request, JsonPrimitive("pending")))
        val arr = result.jsonArray
        arr.map { it.jsonPrimitive.content }
    }

    /**
     * Get the chain spec.
     */
    suspend fun getChainId(): String = withContext(Dispatchers.IO) {
        val result = rpcCall("starknet_chainId", emptyList())
        result.jsonPrimitive.content
    }

    /**
     * Get the node syncing status.
     */
    suspend fun getSyncingStatus(): JsonElement = withContext(Dispatchers.IO) {
        rpcCall("starknet_syncing", emptyList())
    }

    /**
     * Get a transaction by hash.
     */
    suspend fun getTransactionByHash(txHash: String): JsonElement =
        withContext(Dispatchers.IO) {
            val result = rpcCall("starknet_getTransactionByHash", listOf(JsonPrimitive(txHash)))
            result
        }

    /**
     * Get a transaction receipt.
     */
    suspend fun getTransactionReceipt(txHash: String): JsonElement =
        withContext(Dispatchers.IO) {
            val result = rpcCall("starknet_getTransactionReceipt", listOf(JsonPrimitive(txHash)))
            result
        }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid Starknet address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Private: RPC ───────────────────────────────────────────────────

    private suspend fun rpcCall(method: String, params: List<JsonElement>): JsonElement =
        withContext(Dispatchers.IO) {
            val request = StarknetRpcRequest(method = method, params = JsonArray(params))
            val body = Json.encodeToString(request)
            val responseBody = httpClient.post(rpcUrl, body)
            val response = Json.decodeFromString<StarknetRpcResponse>(responseBody)

            if (response.error != null) {
                throw StarknetError.RpcError("[${response.error.code}] ${response.error.message}")
            }

            response.result ?: JsonNull
        }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "starknet_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "starknet_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "starknet_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "starknet_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw StarknetError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface StarknetHttpClient {
    suspend fun post(url: String, body: String): String
}

class DefaultStarknetHttpClient : StarknetHttpClient {
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
                    throw StarknetError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
