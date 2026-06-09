/**
 * EvmAdapter — EVM chain adapter for Android.
 *
 * Provides EVM-specific operations via JSON-RPC:
 * - Balance fetching (eth_getBalance)
 * - Gas estimation (eth_estimateGas)
 * - Contract calls (eth_call)
 * - Block number, nonce, gas price queries
 * - Transaction receipt retrieval
 *
 * ## Usage
 * ```kotlin
 * val adapter = EvmAdapter("https://eth.llamarpc.com")
 * val balance = adapter.getBalance("0x...")
 * val blockNumber = adapter.getBlockNumber()
 * ```
 */
package com.cinacoin.chain

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.net.HttpURLConnection
import java.net.URL

// ────────────────────────────────────────────────────────────────────────────
// RPC Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class EvmRpcRequest(
    val jsonrpc: String = "2.0",
    val method: String,
    val params: JsonArray,
    val id: Int = 1
)

@Serializable
data class EvmRpcResponse(
    val jsonrpc: String? = null,
    val result: JsonElement? = null,
    val error: RpcError? = null,
    val id: Int? = null
)

// ────────────────────────────────────────────────────────────────────────────
// Transaction Request for EVM
// ────────────────────────────────────────────────────────────────────────────

data class EvmTransactionRequest(
    val from: String,
    val to: String,
    val value: String? = null,
    val data: String? = null,
    val gas: String? = null,
    val gasPrice: String? = null,
    val maxFeePerGas: String? = null,
    val maxPriorityFeePerGas: String? = null,
    val nonce: String? = null,
    val chainId: Int? = null
) {
    fun toJson(): JsonObject = buildJsonObject {
        put("from", JsonPrimitive(from))
        put("to", JsonPrimitive(to))
        value?.let { put("value", JsonPrimitive(it)) }
        data?.let { put("data", JsonPrimitive(it)) }
        gas?.let { put("gas", JsonPrimitive(it)) }
        gasPrice?.let { put("gasPrice", JsonPrimitive(it)) }
        maxFeePerGas?.let { put("maxFeePerGas", JsonPrimitive(it)) }
        maxPriorityFeePerGas?.let { put("maxPriorityFeePerGas", JsonPrimitive(it)) }
        nonce?.let { put("nonce", JsonPrimitive(it)) }
        chainId?.let { put("chainId", JsonPrimitive("0x${it.toString(16)}")) }
    }
}

// ────────────────────────────────────────────────────────────────────────────
// EVM Chain Config
// ────────────────────────────────────────────────────────────────────────────

data class EvmChainConfig(
    val chainId: Int,
    val name: String,
    val rpcUrl: String,
    val nativeCurrency: EvmNativeCurrency,
    val blockExplorerUrl: String? = null,
    val testnet: Boolean = false
) {
    companion object {
        val ethereum = EvmChainConfig(
            chainId = 1, name = "Ethereum", rpcUrl = "https://eth.llamarpc.com",
            nativeCurrency = EvmNativeCurrency(name = "Ether", symbol = "ETH", decimals = 18),
            blockExplorerUrl = "https://etherscan.io"
        )
        val polygon = EvmChainConfig(
            chainId = 137, name = "Polygon", rpcUrl = "https://polygon-rpc.com",
            nativeCurrency = EvmNativeCurrency(name = "MATIC", symbol = "MATIC", decimals = 18),
            blockExplorerUrl = "https://polygonscan.com"
        )
        val arbitrum = EvmChainConfig(
            chainId = 42161, name = "Arbitrum", rpcUrl = "https://arb1.arbitrum.io/rpc",
            nativeCurrency = EvmNativeCurrency(name = "Ether", symbol = "ETH", decimals = 18),
            blockExplorerUrl = "https://arbiscan.io"
        )
        val optimism = EvmChainConfig(
            chainId = 10, name = "Optimism", rpcUrl = "https://mainnet.optimism.io",
            nativeCurrency = EvmNativeCurrency(name = "Ether", symbol = "ETH", decimals = 18),
            blockExplorerUrl = "https://optimistic.etherscan.io"
        )
        val base = EvmChainConfig(
            chainId = 8453, name = "Base", rpcUrl = "https://mainnet.base.org",
            nativeCurrency = EvmNativeCurrency(name = "Ether", symbol = "ETH", decimals = 18),
            blockExplorerUrl = "https://basescan.org"
        )
    }
}

data class EvmNativeCurrency(
    val name: String,
    val symbol: String,
    val decimals: Int
)

// ────────────────────────────────────────────────────────────────────────────
// EVM Adapter
// ────────────────────────────────────────────────────────────────────────────

/**
 * Real EVM JSON-RPC adapter.
 */
class EvmAdapter(
    private var rpcUrl: String = "https://eth.llamarpc.com",
    private val httpClient: EvmHttpClient = DefaultEvmHttpClient()
) {

    private var _connectedAddress: String? = null

    /** Connected EVM wallet address. */
    val connectedAddress: String?
        get() = _connectedAddress

    /** RPC endpoint. */
    var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    // ─── Presets ────────────────────────────────────────────────────────

    companion object {
        val MAINNET = "https://eth.llamarpc.com"
        val POLYGON = "https://polygon-rpc.com"
        val ARBITRUM = "https://arb1.arbitrum.io/rpc"
        val OPTIMISM = "https://mainnet.optimism.io"
        val BASE = "https://mainnet.base.org"

        fun isValidAddress(address: String): Boolean {
            return address.length == 42 && address.startsWith("0x") &&
                address.substring(2).all { it.isDigit() || it in 'a'..'f' || it in 'A'..'F' }
        }

        /** Convert wei to ETH string. */
        fun weiToEth(wei: Long): String = String.format("%.6f", wei / 1e18)

        /** Convert ETH to wei. */
        fun ethToWei(eth: Double): Long = (eth * 1e18).toLong()

        /** Parse hex string to BigInteger. */
        fun hexToBigInteger(hex: String): BigInteger {
            val cleaned = if (hex.startsWith("0x")) hex.substring(2) else hex
            return BigInteger(cleaned, 16)
        }

        /** Convert BigInteger to hex string. */
        fun bigIntToHex(value: BigInteger): String = "0x" + value.toString(16)
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get ETH balance for an address via `eth_getBalance`.
     * @return Balance in ETH as decimal string (e.g. "1.234567").
     */
    suspend fun getBalance(address: String, blockTag: String = "latest"): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid EVM address: $address" }

            val result = rpcCall("eth_getBalance", listOf(
                JsonPrimitive(address),
                JsonPrimitive(blockTag)
            ))
            val balanceHex = result.jsonPrimitive.content
            val wei = hexToBigInteger(balanceHex)
            val eth = wei.toBigDecimal().divide(
                BigDecimal("1000000000000000000"), 6, java.math.RoundingMode.HALF_UP
            )
            eth.toPlainString()
        }

    /**
     * Get raw balance in wei (hex string).
     */
    suspend fun getBalanceRaw(address: String, blockTag: String = "latest"): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid EVM address: $address" }
            val result = rpcCall("eth_getBalance", listOf(
                JsonPrimitive(address), JsonPrimitive(blockTag)
            ))
            result.jsonPrimitive.content
        }

    // ─── Gas ────────────────────────────────────────────────────────────

    /**
     * Get the current gas price via `eth_gasPrice`.
     * @return Gas price in wei (hex string).
     */
    suspend fun getGasPrice(): String = withContext(Dispatchers.IO) {
        val result = rpcCall("eth_gasPrice", emptyList())
        result.jsonPrimitive.content
    }

    /**
     * Estimate gas for a transaction via `eth_estimateGas`.
     * @return Gas estimate (hex string).
     */
    suspend fun estimateGas(tx: EvmTransactionRequest): String =
        withContext(Dispatchers.IO) {
            val result = rpcCall("eth_estimateGas", listOf(tx.toJson()))
            result.jsonPrimitive.content
        }

    /**
     * Get max priority fee per gas via `eth_maxPriorityFeePerGas`.
     * @return Max priority fee (hex string).
     */
    suspend fun getMaxPriorityFeePerGas(): String = withContext(Dispatchers.IO) {
        val result = rpcCall("eth_maxPriorityFeePerGas", emptyList())
        result.jsonPrimitive.content
    }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the current block number via `eth_blockNumber`.
     * @return Block number as Long.
     */
    suspend fun getBlockNumber(): Long = withContext(Dispatchers.IO) {
        val result = rpcCall("eth_blockNumber", emptyList())
        hexToBigInteger(result.jsonPrimitive.content).toLong()
    }

    // ─── Chain ID ──────────────────────────────────────────────────────

    /**
     * Get the chain ID via `eth_chainId`.
     * @return Chain ID as Int.
     */
    suspend fun getChainId(): Int = withContext(Dispatchers.IO) {
        val result = rpcCall("eth_chainId", emptyList())
        hexToBigInteger(result.jsonPrimitive.content).toInt()
    }

    // ─── Nonce ─────────────────────────────────────────────────────────

    /**
     * Get the nonce for an address via `eth_getTransactionCount`.
     * @return Nonce as Long.
     */
    suspend fun getNonce(address: String, blockTag: String = "pending"): Long =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid EVM address: $address" }
            val result = rpcCall("eth_getTransactionCount", listOf(
                JsonPrimitive(address), JsonPrimitive(blockTag)
            ))
            hexToBigInteger(result.jsonPrimitive.content).toLong()
        }

    // ─── Contract Calls ────────────────────────────────────────────────

    /**
     * Call a contract read method via `eth_call`.
     * @param to Contract address.
     * @param data Encoded function call data.
     * @param blockTag Block to query (default: "latest").
     * @return Result data (hex string).
     */
    suspend fun call(
        to: String,
        data: String,
        from: String? = null,
        blockTag: String = "latest"
    ): String = withContext(Dispatchers.IO) {
        val params = buildJsonObject {
            put("to", JsonPrimitive(to))
            put("data", JsonPrimitive(data))
            from?.let { put("from", JsonPrimitive(it)) }
        }
        val result = rpcCall("eth_call", listOf(params, JsonPrimitive(blockTag)))
        result.jsonPrimitive.content
    }

    /**
     * Get ERC-20 token balance for an address.
     * @param tokenAddress ERC-20 contract address.
     * @param userAddress User wallet address.
     * @return Token balance (hex string).
     */
    suspend fun getTokenBalance(tokenAddress: String, userAddress: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(tokenAddress)) { "Invalid token address" }
            require(isValidAddress(userAddress)) { "Invalid user address" }

            val paddedAddress = userAddress.substring(2).padStart(64, '0')
            val data = "0x70a08231$paddedAddress"

            call(to = tokenAddress, data = data)
        }

    // ─── Transactions ──────────────────────────────────────────────────

    /**
     * Get a transaction by hash via `eth_getTransactionByHash`.
     * @return Transaction data as JSON element.
     */
    suspend fun getTransaction(txHash: String): JsonElement = withContext(Dispatchers.IO) {
        rpcCall("eth_getTransactionByHash", listOf(JsonPrimitive(txHash)))
    }

    /**
     * Get a transaction receipt via `eth_getTransactionReceipt`.
     * @return Receipt data as JSON element.
     */
    suspend fun getTransactionReceipt(txHash: String): JsonElement = withContext(Dispatchers.IO) {
        rpcCall("eth_getTransactionReceipt", listOf(JsonPrimitive(txHash)))
    }

    /**
     * Send a raw signed transaction via `eth_sendRawTransaction`.
     * @param rawTx Hex-encoded signed transaction.
     * @return Transaction hash.
     */
    suspend fun sendRawTransaction(rawTx: String): String = withContext(Dispatchers.IO) {
        val result = rpcCall("eth_sendRawTransaction", listOf(JsonPrimitive(rawTx)))
        result.jsonPrimitive.content
    }

    // ─── Connected Address ─────────────────────────────────────────────

    /**
     * Set the connected wallet address (called after successful connection).
     */
    fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid EVM address: $address" }
        _connectedAddress = address
    }

    /**
     * Disconnect the current wallet.
     */
    fun disconnect() {
        _connectedAddress = null
    }

    // ─── EIP-1193 Compatible Request ───────────────────────────────────

    /**
     * EIP-1193 compatible request method for EVM operations.
     */
    suspend fun request(method: String, params: List<JsonElement> = emptyList()): JsonElement =
        when (method) {
            "eth_getBalance" -> JsonPrimitive(getBalance(
                params.firstOrNull()?.jsonPrimitive?.content ?: "",
                params.getOrNull(1)?.jsonPrimitive?.content ?: "latest"
            ))
            "eth_gasPrice" -> JsonPrimitive(getGasPrice())
            "eth_estimateGas" -> {
                // Would need to parse params into EvmTransactionRequest
                JsonPrimitive(estimateGas(EvmTransactionRequest(
                    from = "", to = ""
                )))
            }
            "eth_blockNumber" -> JsonPrimitive(getBlockNumber().toString())
            "eth_chainId" -> JsonPrimitive(getChainId().toString(16))
            "eth_getTransactionCount" -> JsonPrimitive(getNonce(
                params.firstOrNull()?.jsonPrimitive?.content ?: "",
                params.getOrNull(1)?.jsonPrimitive?.content ?: "pending"
            ).toString())
            "eth_call" -> {
                val callParams = params.firstOrNull()?.jsonObject ?: JsonObject(emptyMap())
                call(
                    to = callParams["to"]?.jsonPrimitive?.content ?: "",
                    data = callParams["data"]?.jsonPrimitive?.content ?: "0x",
                    blockTag = params.getOrNull(1)?.jsonPrimitive?.content ?: "latest"
                ).let { JsonPrimitive(it) }
            }
            "eth_sendRawTransaction" -> JsonPrimitive(sendRawTransaction(
                params.firstOrNull()?.jsonPrimitive?.content ?: ""
            ))
            else -> throw EvmError.UnsupportedMethod(method)
        }

    // ─── Private: RPC ───────────────────────────────────────────────────

    private suspend fun rpcCall(method: String, params: List<JsonElement>): JsonElement =
        withContext(Dispatchers.IO) {
            val request = EvmRpcRequest(
                method = method,
                params = JsonArray(params)
            )
            val body = kotlinx.serialization.json.Json.encodeToString(request)
            val responseBody = httpClient.post(rpcUrl, body)

            val response = kotlinx.serialization.json.Json.decodeFromString<EvmRpcResponse>(responseBody)

            if (response.error != null) {
                throw EvmError.RpcError(
                    "[${response.error.code}] ${response.error.message}"
                )
            }

            response.result ?: JsonPrimitive("")
        }
}

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

/** EVM adapter errors. */
sealed class EvmError : Exception() {
    data class InvalidAddress(val address: String) : EvmError()
    object NotConnected : EvmError()
    data class InvalidRpcUrl(val url: String) : EvmError()
    data class RpcError(val message: String) : EvmError()
    object InvalidParams : EvmError()
    data class UnsupportedMethod(val method: String) : EvmError()
    data class NotImplemented(val message: String) : EvmError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid EVM address: $address"
            NotConnected -> "Not connected to an EVM wallet"
            is InvalidRpcUrl -> "Invalid RPC URL: $url"
            is RpcError -> "RPC error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

/** HTTP client interface for EVM RPC calls. */
interface EvmHttpClient {
    suspend fun post(url: String, body: String): String
}

/** Default implementation using Java HttpURLConnection. */
class DefaultEvmHttpClient : EvmHttpClient {
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

                val responseCode = connection.responseCode
                if (responseCode != HttpURLConnection.HTTP_OK) {
                    val errorBody = connection.errorStream?.bufferedReader()?.use { it.readText() }
                        ?: "HTTP $responseCode"
                    throw EvmError.RpcError("HTTP $responseCode: $errorBody")
                }

                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
