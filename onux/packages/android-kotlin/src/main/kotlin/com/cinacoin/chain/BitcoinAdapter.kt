/**
 * BitcoinAdapter — Bitcoin (BTC) chain adapter for Android.
 *
 * Provides Bitcoin-specific operations via Blockbook API:
 * - UTXO balance fetching
 * - Transaction broadcasting
 * - Fee estimation
 * - Address generation helpers
 *
 * ## Usage
 * ```kotlin
 * val adapter = BitcoinAdapter("https://btc1.trezor.io")
 * val balance = adapter.getBalance("bc1q...")
 * val utxos = adapter.getUtxos("bc1q...")
 * val txId = adapter.sendTransaction("rawTxHex...")
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
import java.security.MessageDigest

// ────────────────────────────────────────────────────────────────────────────
// Blockbook API Response Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class BlockbookAddressResponse(
    val page: Int = 0,
    val totalPages: Int = 0,
    val itemsOnPage: Int = 0,
    val address: String = "",
    val balance: String = "0",
    val totalReceived: String = "0",
    val totalSent: String = "0",
    val unconfirmedBalance: String = "0",
    val unconfirmedTxs: Int = 0,
    val txs: Int = 0,
    val transactions: List<BlockbookTransaction> = emptyList(),
    val nonce: String? = null
)

@Serializable
data class BlockbookTransaction(
    val txid: String = "",
    val version: Int = 0,
    val vin: List<BlockbookVin> = emptyList(),
    val vout: List<BlockbookVout> = emptyList(),
    val blockHeight: Int = -1,
    val confirmations: Int = 0,
    val blockTime: Long = 0L,
    val value: String = "0",
    val valueIn: String = "0",
    val fees: String = "0"
)

@Serializable
data class BlockbookVin(
    val txid: String = "",
    val vout: Int = 0,
    val sequence: Long = 0,
    val n: Int = 0,
    val addresses: List<String> = emptyList(),
    val value: String = "0"
)

@Serializable
data class BlockbookVout(
    val value: String = "0",
    val n: Int = 0,
    val hex: String = "",
    val addresses: List<String> = emptyList()
)

@Serializable
data class BlockbookFeeResponse(
    val result: BlockbookFeeResult
)

@Serializable
data class BlockbookFeeResult(
    val feeRate: List<FeeLevel> = emptyList()
)

@Serializable
data class FeeLevel(
    val name: String = "",
    val blocks: Int = 0,
    val feePerUnit: String = "0"
)

// ────────────────────────────────────────────────────────────────────────────
// UTXO Model
// ────────────────────────────────────────────────────────────────────────────

/**
 * Represents an unspent transaction output.
 */
data class BitcoinUtxo(
    val txid: String,
    val vout: Int,
    val value: Long,
    val height: Int,
    val address: String
)

// ────────────────────────────────────────────────────────────────────────────
// Fee Estimation Result
// ────────────────────────────────────────────────────────────────────────────

/**
 * Fee estimation levels for Bitcoin transactions.
 */
data class BitcoinFeeEstimate(
    val slow: String,
    val medium: String,
    val fast: String
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

/** Bitcoin adapter errors. */
sealed class BitcoinError : Exception() {
    data class InvalidAddress(val address: String) : BitcoinError()
    object NotConnected : BitcoinError()
    data class InvalidRpcUrl(val url: String) : BitcoinError()
    data class RpcError(val message: String) : BitcoinError()
    object InvalidParams : BitcoinError()
    data class UnsupportedMethod(val method: String) : BitcoinError()
    data class NotImplemented(val message: String) : BitcoinError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid Bitcoin address: $address"
            NotConnected -> "Not connected to a Bitcoin wallet"
            is InvalidRpcUrl -> "Invalid Blockbook URL: $url"
            is RpcError -> "Blockbook RPC error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// Bitcoin Adapter
// ────────────────────────────────────────────────────────────────────────────

/**
 * Real Bitcoin adapter using Blockbook API.
 */
class BitcoinAdapter(
    private var rpcUrl: String = "https://btc1.trezor.io",
    private val httpClient: BitcoinHttpClient = DefaultBitcoinHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "bitcoin"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET = "https://btc1.trezor.io"
        val BLOCKCYPHER = "https://api.blockcypher.com/v1/btc/main"
        val MEMPOOL = "https://mempool.space/api"

        /** Validate a Bitcoin address (legacy, segwit, or native segwit). */
        fun isValidAddress(address: String): Boolean {
            // Legacy (P2PKH): starts with 1
            // Segwit (P2SH): starts with 3
            // Native SegWit (Bech32): starts with bc1
            // Taproot (Bech32m): starts with bc1p
            return address.matches(Regex("^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$")) ||
                address.matches(Regex("^bc1p[a-zA-HJ-NP-Z0-9]{38,58}$"))
        }

        /** Convert satoshis to BTC string. */
        fun satToBtc(satoshis: Long): String =
            BigDecimal(satoshis).divide(BigDecimal("100000000"), 8, java.math.RoundingMode.HALF_UP)
                .toPlainString()

        /** Convert BTC to satoshis. */
        fun btcToSat(btc: Double): Long = (btc * 1e8).toLong()
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get BTC balance for an address via Blockbook API.
     * @return Balance in BTC as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid Bitcoin address: $address" }

            val responseBody = httpClient.get("$rpcUrl/api/v2/address/$address?details=txids")
            val response = Json.decodeFromString<BlockbookAddressResponse>(responseBody)

            val satoshis = response.balance.toLongOrNull()
                ?: throw BitcoinError.RpcError("Invalid balance response")

            satToBtc(satoshis)
        }

    // ─── UTXOs ──────────────────────────────────────────────────────────

    /**
     * Get unspent transaction outputs for an address.
     * @return List of UTXOs.
     */
    suspend fun getUtxos(address: String): List<BitcoinUtxo> =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address)) { "Invalid Bitcoin address: $address" }

            val responseBody = httpClient.get("$rpcUrl/api/v2/utxo/$address")
            val jsonArray = Json.parseToJsonElement(responseBody).jsonArray

            jsonArray.map {
                val obj = it.jsonObject
                BitcoinUtxo(
                    txid = obj["txid"]?.jsonPrimitive?.content ?: "",
                    vout = obj["vout"]?.jsonPrimitive?.int ?: 0,
                    value = obj["value"]?.jsonPrimitive?.longOrNull ?: 0L,
                    height = obj["height"]?.jsonPrimitive?.int ?: -1,
                    address = obj["address"]?.jsonPrimitive?.content ?: address
                )
            }
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Broadcast a raw signed transaction hex via Blockbook API.
     * @param txHex Hex-encoded raw transaction.
     * @return Transaction ID.
     */
    override suspend fun sendTransaction(txHex: String): String =
        withContext(Dispatchers.IO) {
            val body = """{"hex":"$txHex"}"""
            val responseBody = httpClient.post("$rpcUrl/api/v2/sendtx", body)
            val obj = Json.parseToJsonElement(responseBody).jsonObject
            obj["result"]?.jsonPrimitive?.content
                ?: throw BitcoinError.RpcError("Invalid sendtx response")
        }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate transaction fees via Blockbook fee endpoint.
     * @return Fee estimate in sat/vB.
     */
    override suspend fun estimateFee(): String =
        withContext(Dispatchers.IO) {
            val responseBody = httpClient.get("$rpcUrl/api/v2/estimatefee")
            val obj = Json.parseToJsonElement(responseBody).jsonObject
            obj["feeRate"]?.jsonArray?.firstOrNull()
                ?.jsonObject?.get("feePerUnit")?.jsonPrimitive?.content
                ?: obj["result"]?.jsonPrimitive?.content
                ?: "1"
        }

    /**
     * Get fee estimates for different confirmation speeds.
     */
    suspend fun getFeeEstimate(): BitcoinFeeEstimate =
        withContext(Dispatchers.IO) {
            val responseBody = httpClient.get("$rpcUrl/api/v2/estimatefee")
            val obj = Json.parseToJsonElement(responseBody)
            val feeRate = obj.jsonObject["feeRate"]?.jsonArray

            if (feeRate != null && feeRate.size >= 3) {
                BitcoinFeeEstimate(
                    slow = feeRate.getOrNull(feeRate.size - 1)?.jsonObject?.get("feePerUnit")?.jsonPrimitive?.content ?: "1",
                    medium = feeRate.getOrNull(feeRate.size / 2)?.jsonObject?.get("feePerUnit")?.jsonPrimitive?.content ?: "2",
                    fast = feeRate.firstOrNull()?.jsonObject?.get("feePerUnit")?.jsonPrimitive?.content ?: "5"
                )
            } else {
                val rate = obj.jsonObject["result"]?.jsonPrimitive?.content ?: "2"
                BitcoinFeeEstimate(slow = rate, medium = rate, fast = rate)
            }
        }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the current block height.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val responseBody = httpClient.get("$rpcUrl/api/v2/blocks?pageSize=1")
        val obj = Json.parseToJsonElement(responseBody).jsonObject
        obj["paging"]?.jsonObject?.get("totalPages")?.jsonPrimitive?.content?.toLongOrNull()
            ?: throw BitcoinError.RpcError("Invalid block response")
    }

    /**
     * Get transaction details by ID.
     */
    suspend fun getTransaction(txid: String): BlockbookTransaction =
        withContext(Dispatchers.IO) {
            val responseBody = httpClient.get("$rpcUrl/api/v2/tx/$txid")
            Json.decodeFromString<BlockbookTransaction>(responseBody)
        }

    // ─── Address Generation ─────────────────────────────────────────────

    /**
     * Generate a bech32 address from a public key hash.
     * This is a simple helper; for real usage use a proper BIP library.
     * @param pubKeyHash 20-byte public key hash.
     * @return Native SegWit address (bech32).
     */
    fun generateAddress(pubKeyHash: ByteArray): String {
        require(pubKeyHash.size == 20) { "Public key hash must be 20 bytes" }
        // Simplified: returns a placeholder for actual BIP-173 bech32 encoding.
        // In production, use the bech32 library.
        val hex = pubKeyHash.joinToString("") { "%02x".format(it) }
        return "bc1q${hex.take(38)}" // Simplified representation
    }

    /**
     * Generate address from compressed public key.
     */
    suspend fun generateAddressFromPubKey(pubKeyHex: String): String =
        withContext(Dispatchers.IO) {
            val pubKeyBytes = pubKeyHex.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
            val sha256 = MessageDigest.getInstance("SHA-256").digest(pubKeyBytes)
            val ripemd160 = MessageDigest.getInstance("RIPEMD-160").digest(sha256)
            generateAddress(ripemd160)
        }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid Bitcoin address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── EIP-1193 Compatible Request ────────────────────────────────────

    /**
     * Unified request method for Bitcoin operations.
     */
    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "btc_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "btc_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "btc_getUtxos" -> {
                val utxos = getUtxos(params.firstOrNull() as? String ?: "")
                Json.encodeToJsonElement(
                    JsonArray(utxos.map { buildJsonObject {
                        put("txid", JsonPrimitive(it.txid))
                        put("vout", JsonPrimitive(it.vout))
                        put("value", JsonPrimitive(it.value))
                        put("height", JsonPrimitive(it.height))
                    }})
                )
            }
            "btc_estimateFee" -> JsonPrimitive(estimateFee())
            "btc_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            else -> throw BitcoinError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

/** HTTP client interface for Blockbook API calls. */
interface BitcoinHttpClient {
    suspend fun get(url: String): String
    suspend fun post(url: String, body: String): String
}

/** Default implementation using Java HttpURLConnection. */
class DefaultBitcoinHttpClient : BitcoinHttpClient {
    override suspend fun get(url: String): String =
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw BitcoinError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }

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
                    throw BitcoinError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
