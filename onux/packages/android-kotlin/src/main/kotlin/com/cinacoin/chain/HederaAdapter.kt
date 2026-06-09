/**
 * HederaAdapter — Hedera (HBAR) chain adapter for Android.
 *
 * Provides Hedera-specific operations via Mirror Node API and Consensus Node:
 * - HBAR balance fetching
 * - Transaction broadcasting
 * - Token balance queries
 * - Transaction record retrieval
 *
 * ## Usage
 * ```kotlin
 * val adapter = HederaAdapter("https://mainnet.mirrornode.hedera.com")
 * val balance = adapter.getBalance("0.0.12345")
 * val txId = adapter.sendTransaction("signedTx...")
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
// Hedera Mirror Node Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class HederaAccountResponse(
    val account: String = "",
    val balance: HederaBalance? = null,
    val alias: String? = null,
    val created_timestamp: String = "",
    val key: HederaKey? = null,
    val decline_reward: Boolean = false,
    val ethereum_nonce: Int = 0,
    val evm_address: String? = null,
    val receiver_sig_required: Boolean = false,
    val max_automatic_token_associations: Int = 0,
    memo: String = ""
)

@Serializable
data class HederaBalance(
    val balance: Long = 0,
    val timestamp: String = "",
    val tokens: List<HederaTokenBalance> = emptyList()
)

@Serializable
data class HederaTokenBalance(
    val token_id: String = "",
    val balance: Long = 0
)

@Serializable
data class HederaKey(
    val key: String = "",
    val _type: String = ""
)

@Serializable
data class HederaSendTxResponse(
    val node: String? = null,
    val hash: String = "",
    val transaction: String? = null
)

@Serializable
data class HederaTxRecordResponse(
    val transactions: List<HederaTxRecord> = emptyList(),
    val links: HederaLinks? = null
)

@Serializable
data class HederaTxRecord(
    val consensus_timestamp: String = "",
    val transaction_id: String = "",
    val type: String = "",
    val result: String = "",
    val charged_tx_fee: Long = 0,
    val memo: String = "",
    val transfers: List<HederaTransfer> = emptyList(),
    val token_transfers: List<HederaTokenTransfer> = emptyList()
)

@Serializable
data class HederaTransfer(
    val account: String = "",
    val amount: Long = 0,
    val is_approval: Boolean = false
)

@Serializable
data class HederaTokenTransfer(
    val token_id: String = "",
    val account: String = "",
    val amount: Long = 0,
    val is_approval: Boolean = false
)

@Serializable
data class HederaLinks(
    val next: String? = null
)

@Serializable
data class HederaTokenInfo(
    val token_id: String = "",
    val name: String = "",
    val symbol: String = "",
    val type: String = "",
    val decimals: Int = 0,
    val total_supply: String = "",
    val created_timestamp: String = ""
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class HederaError : Exception() {
    data class InvalidAddress(val address: String) : HederaError()
    object NotConnected : HederaError()
    data class InvalidRpcUrl(val url: String) : HederaError()
    data class RpcError(val message: String) : HederaError()
    object InvalidParams : HederaError()
    data class UnsupportedMethod(val method: String) : HederaError()
    data class NotImplemented(val message: String) : HederaError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid Hedera account ID: $address"
            NotConnected -> "Not connected to a Hedera wallet"
            is InvalidRpcUrl -> "Invalid Hedera Mirror Node URL: $url"
            is RpcError -> "Hedera API error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// Hedera Adapter
// ────────────────────────────────────────────────────────────────────────────

class HederaAdapter(
    private var rpcUrl: String = "https://mainnet.mirrornode.hedera.com",
    private val consensusNodeUrl: String = "mainnet-public.hedera.com:50211",
    private val httpClient: HederaHttpClient = DefaultHederaHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "hedera"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val MAINNET_MIRROR = "https://mainnet.mirrornode.hedera.com"
        val TESTNET_MIRROR = "https://testnet.mirrornode.hedera.com"
        val PREVIEWNET_MIRROR = "https://previewnet.mirrornode.hedera.com"

        val MAINNET_CONSENSUS = "mainnet-public.hedera.com:50211"
        val TESTNET_CONSENSUS = "testnet.hedera.com:50211"

        /** Validate a Hedera account ID (0.0.XXXX format). */
        fun isValidAddress(address: String): Boolean {
            return address.matches(Regex("^0\\.0\\.\\d+$"))
        }

        /** Convert tinybar to HBAR string. */
        fun tinybarToHbar(tinybar: Long): String {
            val amount = BigDecimal(tinybar)
            return amount.divide(BigDecimal("100000000"), 8, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get HBAR balance for an account via Mirror Node API.
     * @return Balance in HBAR as decimal string.
     */
    override suspend fun getBalance(accountId: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(accountId)) { "Invalid Hedera account ID: $accountId" }

            val url = "$rpcUrl/api/v1/accounts/$accountId"
            val responseBody = httpClient.get(url)
            val response = Json.decodeFromString<HederaAccountResponse>(responseBody)

            response.balance?.let { tinybarToHbar(it.balance) } ?: "0.00000000"
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Submit a signed transaction to the Hedera Consensus Node.
     * In practice, you'd use the Hedera SDK to build and sign,
     * then submit via gRPC to the consensus node. This method
     * submits via the mirror node relay for HTTP-based flows.
     *
     * @param signedTx Hex-encoded signed transaction bytes.
     * @return Transaction ID.
     */
    override suspend fun sendTransaction(signedTx: String): String =
        withContext(Dispatchers.IO) {
            val body = """{"transaction":"$signedTx"}"""
            val url = "$rpcUrl/api/v1/transactions"
            val responseBody = httpClient.post(url, body)
            val response = Json.decodeFromString<HederaSendTxResponse>(responseBody)
            response.hash.ifEmpty {
                throw HederaError.RpcError("Invalid transaction response")
            }
        }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the latest consensus timestamp (block equivalent).
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val url = "$rpcUrl/api/v1/blocks?limit=1&order=desc"
        val responseBody = httpClient.get(url)
        val obj = Json.parseToJsonElement(responseBody).jsonObject
        val blocks = obj["blocks"]?.jsonArray
        if (blocks.isNullOrEmpty()) throw HederaError.RpcError("No blocks found")
        blocks.first().jsonObject["timestamp"]?.jsonPrimitive?.content?.toLongOrNull()
            ?: throw HederaError.RpcError("Invalid block response")
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate fee for a standard HBAR transfer.
     * Hedera has fixed fees: 0.0001 HBAR per transaction.
     */
    override suspend fun estimateFee(): String = "0.0001"

    // ─── Token Balance ──────────────────────────────────────────────────

    /**
     * Get token balances for an account.
     * @return List of token balances.
     */
    suspend fun getTokenBalance(accountId: String): List<HederaTokenBalance> =
        withContext(Dispatchers.IO) {
            require(isValidAddress(accountId)) { "Invalid Hedera account ID: $accountId" }

            val url = "$rpcUrl/api/v1/accounts/$accountId/tokens"
            val responseBody = httpClient.get(url)
            val obj = Json.parseToJsonElement(responseBody).jsonObject
            val arr = obj["tokens"]?.jsonArray ?: JsonArray(emptyList())
            arr.map {
                Json.decodeFromString<HederaTokenBalance>(it.toString())
            }
        }

    // ─── Transaction Record ─────────────────────────────────────────────

    /**
     * Get transaction record by transaction ID or consensus timestamp.
     */
    suspend fun getTransactionRecord(identifier: String): HederaTxRecord =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/api/v1/transactions/$identifier"
            val responseBody = httpClient.get(url)
            val response = Json.decodeFromString<HederaTxRecordResponse>(responseBody)

            if (response.transactions.isEmpty()) {
                throw HederaError.RpcError("Transaction not found: $identifier")
            }

            response.transactions.first()
        }

    /**
     * Get transactions for an account.
     */
    suspend fun getAccountTransactions(accountId: String, limit: Int = 10): List<HederaTxRecord> =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/api/v1/transactions?account.id=$accountId&limit=$limit"
            val responseBody = httpClient.get(url)
            val response = Json.decodeFromString<HederaTxRecordResponse>(responseBody)
            response.transactions
        }

    /**
     * Get token info by token ID.
     */
    suspend fun getTokenInfo(tokenId: String): HederaTokenInfo =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/api/v1/tokens/$tokenId"
            val responseBody = httpClient.get(url)
            Json.decodeFromString<HederaTokenInfo>(responseBody)
        }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address)) { "Invalid Hedera account ID: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "hedera_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "hedera_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "hedera_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "hedera_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw HederaError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface HederaHttpClient {
    suspend fun get(url: String): String
    suspend fun post(url: String, body: String): String
}

class DefaultHederaHttpClient : HederaHttpClient {
    override suspend fun get(url: String): String =
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw HederaError.RpcError("HTTP ${connection.responseCode}")
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
                    throw HederaError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
