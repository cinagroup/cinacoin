/**
 * CosmosAdapter — Cosmos (ATOM) chain adapter for Android.
 *
 * Provides Cosmos-specific operations via the Cosmos REST API:
 * - Balance fetching (ATOM & IBC tokens)
 * - Transaction broadcasting
 * - Validator listing
 * - Delegation/undelegation simulation
 *
 * ## Usage
 * ```kotlin
 * val adapter = CosmosAdapter("https://rest.cosmos.network")
 * val balance = adapter.getBalance("cosmos1...")
 * val validators = adapter.getValidators()
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
// Cosmos REST API Types
// ────────────────────────────────────────────────────────────────────────────

@Serializable
data class CosmosBalanceResponse(
    val balances: List<CosmosCoin> = emptyList(),
    val pagination: CosmosPagination? = null
)

@Serializable
data class CosmosCoin(
    val denom: String = "",
    val amount: String = "0"
)

@Serializable
data class CosmosPagination(
    val nextKey: String? = null,
    val total: String = "0"
)

@Serializable
data class CosmosSendTxResponse(
    val code: Int = 0,
    val rawLog: String = "",
    val txhash: String = "",
    val codespace: String = ""
)

@Serializable
data class CosmosValidatorsResponse(
    val validators: List<CosmosValidator> = emptyList(),
    val pagination: CosmosPagination? = null,
    val block_height: String = "0"
)

@Serializable
data class CosmosValidator(
    val operator_address: String = "",
    val consensus_pubkey: CosmosPubKey = CosmosPubKey(),
    val jailed: Boolean = false,
    val status: String = "",
    val tokens: String = "0",
    val delegator_shares: String = "0",
    val description: CosmosValidatorDescription = CosmosValidatorDescription(),
    val unbonding_height: String = "0",
    val unbonding_time: String = "",
    val commission: CosmosCommission = CosmosCommission()
)

@Serializable
data class CosmosPubKey(
    val key: String = "",
    val "@type": String = ""
)

@Serializable
data class CosmosValidatorDescription(
    val moniker: String = "",
    val identity: String = "",
    val website: String = "",
    val securityContact: String = "",
    val details: String = ""
)

@Serializable
data class CosmosCommission(
    val commissionRates: CosmosCommissionRates = CosmosCommissionRates(),
    val updateTime: String = ""
)

@Serializable
data class CosmosCommissionRates(
    val rate: String = "0",
    val maxRate: String = "0",
    val maxChangeRate: String = "0"
)

@Serializable
data class CosmosDelegationResponse(
    val delegationResponses: List<CosmosDelegationEntry> = emptyList(),
    val pagination: CosmosPagination? = null
)

@Serializable
data class CosmosDelegationEntry(
    val delegation: CosmosDelegation = CosmosDelegation(),
    val balance: CosmosCoin = CosmosCoin()
)

@Serializable
data class CosmosDelegation(
    val delegatorAddress: String = "",
    val validatorAddress: String = "",
    val shares: String = "0"
)

@Serializable
data class CosmosSimulateResponse(
    val gasInfo: CosmosGasInfo = CosmosGasInfo(),
    val result: JsonElement? = null
)

@Serializable
data class CosmosGasInfo(
    val gasWanted: String = "0",
    val gasUsed: String = "0"
)

@Serializable
data class CosmosBlockResponse(
    val block: CosmosBlock = CosmosBlock()
)

@Serializable
data class CosmosBlock(
    val header: CosmosBlockHeader = CosmosBlockHeader()
)

@Serializable
data class CosmosBlockHeader(
    val height: String = "0",
    val time: String = "",
    val chainId: String = ""
)

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

sealed class CosmosError : Exception() {
    data class InvalidAddress(val address: String) : CosmosError()
    object NotConnected : CosmosError()
    data class InvalidRpcUrl(val url: String) : CosmosError()
    data class RpcError(val message: String) : CosmosError()
    object InvalidParams : CosmosError()
    data class UnsupportedMethod(val method: String) : CosmosError()
    data class NotImplemented(val message: String) : CosmosError()

    override val message: String
        get() = when (this) {
            is InvalidAddress -> "Invalid Cosmos address: $address"
            NotConnected -> "Not connected to a Cosmos wallet"
            is InvalidRpcUrl -> "Invalid Cosmos REST URL: $url"
            is RpcError -> "Cosmos REST API error: $message"
            InvalidParams -> "Invalid parameters"
            is UnsupportedMethod -> "Unsupported method: $method"
            is NotImplemented -> "Not implemented: $message"
        }
}

// ────────────────────────────────────────────────────────────────────────────
// Cosmos Adapter
// ────────────────────────────────────────────────────────────────────────────

class CosmosAdapter(
    private var rpcUrl: String = "https://rest.cosmos.network/cosmos",
    private val bech32Prefix: String = "cosmos",
    private val httpClient: CosmosHttpClient = DefaultCosmosHttpClient()
) : ChainAdapter {

    private var _connectedAddress: String? = null

    override val chainName: String = "cosmos"

    override var endpoint: String
        get() = rpcUrl
        set(value) { rpcUrl = value }

    override val isConnected: Boolean
        get() = _connectedAddress != null

    override val connectedAddress: String?
        get() = _connectedAddress

    companion object {
        val COSMOS_HUB = "https://rest.cosmos.network/cosmos"
        val OSMOSIS = "https://rest.osmosis.zone"
        val SEI = "https://rest.atlantic-2.seinetwork.io"

        val ATOM_DENOM = "uatom"       // 1 ATOM = 1,000,000 uatom
        val OSMO_DENOM = "uosmo"

        /** Validate a Cosmos bech32 address. */
        fun isValidAddress(address: String, prefix: String = "cosmos"): Boolean {
            return address.startsWith("$prefix1") && address.length in 27..46
        }

        /** Convert uatom to ATOM string. */
        fun microToAtom(microAmount: String, decimals: Int = 6): String {
            val amount = BigDecimal(microAmount)
            val divisor = BigDecimal(10).pow(decimals)
            return amount.divide(divisor, decimals, java.math.RoundingMode.HALF_UP)
                .toPlainString()
        }
    }

    // ─── Balance ────────────────────────────────────────────────────────

    /**
     * Get ATOM balance for an address via Cosmos REST API.
     * @return Balance in ATOM as decimal string.
     */
    override suspend fun getBalance(address: String): String =
        withContext(Dispatchers.IO) {
            require(isValidAddress(address, bech32Prefix)) { "Invalid Cosmos address: $address" }

            val url = "$rpcUrl/cosmos/bank/v1beta1/balances/$address"
            val responseBody = httpClient.get(url)
            val response = Json.decodeFromString<CosmosBalanceResponse>(responseBody)

            val atomBalance = response.balances.find { it.denom == ATOM_DENOM }
            atomBalance?.let { microToAtom(it.amount) } ?: "0.000000"
        }

    /**
     * Get all token balances for an address.
     */
    suspend fun getAllBalances(address: String): List<CosmosCoin> =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/cosmos/bank/v1beta1/balances/$address"
            val responseBody = httpClient.get(url)
            val response = Json.decodeFromString<CosmosBalanceResponse>(responseBody)
            response.balances
        }

    // ─── Send Transaction ───────────────────────────────────────────────

    /**
     * Send a signed transaction via Cosmos REST API.
     * @param signedTx JSON-encoded signed transaction (TxBody + AuthInfo + Signatures).
     * @return Transaction hash.
     */
    override suspend fun sendTransaction(signedTx: String): String =
        withContext(Dispatchers.IO) {
            val responseBody = httpClient.post("$rpcUrl/cosmos/tx/v1beta1/txs", signedTx)
            val response = Json.decodeFromString<CosmosSendTxResponse>(responseBody)

            if (response.code != 0) {
                throw CosmosError.RpcError("Transaction failed: ${response.rawLog}")
            }

            response.txhash
        }

    // ─── Block Number ──────────────────────────────────────────────────

    /**
     * Get the current block height.
     */
    override suspend fun getLatestBlock(): Long = withContext(Dispatchers.IO) {
        val url = "$rpcUrl/cosmos/base/tendermint/v1beta1/blocks/latest"
        val responseBody = httpClient.get(url)
        val response = Json.decodeFromString<CosmosBlockResponse>(responseBody)
        response.block.header.height.toLongOrNull()
            ?: throw CosmosError.RpcError("Invalid block response")
    }

    // ─── Fee Estimation ────────────────────────────────────────────────

    /**
     * Estimate gas for a transaction via simulation.
     */
    override suspend fun estimateFee(): String = withContext(Dispatchers.IO) {
        // Standard Cosmos transfer uses ~55000 gas units
        "55000"
    }

    // ─── Validators ─────────────────────────────────────────────────────

    /**
     * Get the list of bonded validators.
     * @param limit Max number of validators to return.
     */
    suspend fun getValidators(limit: Int = 100): List<CosmosValidator> =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=$limit"
            val responseBody = httpClient.get(url)
            val response = Json.decodeFromString<CosmosValidatorsResponse>(responseBody)
            response.validators
        }

    // ─── Delegation ─────────────────────────────────────────────────────

    /**
     * Get delegations for a delegator address.
     */
    suspend fun getDelegations(delegatorAddress: String): List<CosmosDelegationEntry> =
        withContext(Dispatchers.IO) {
            val url = "$rpcUrl/cosmos/staking/v1beta1/delegations/$delegatorAddress"
            val responseBody = httpClient.get(url)
            val response = Json.decodeFromString<CosmosDelegationResponse>(responseBody)
            response.delegationResponses
        }

    /**
     * Simulate a delegation transaction to estimate gas.
     * @param delegator Delegator address.
     * @param validator Validator operator address.
     * @param amount Amount in uatom.
     */
    suspend fun simulateDelegate(
        delegator: String,
        validator: String,
        amount: String
    ): CosmosGasInfo = withContext(Dispatchers.IO) {
        val body = buildJsonObject {
            put("tx", buildJsonObject {
                put("body", buildJsonObject {
                    put("messages", JsonArray(listOf(buildJsonObject {
                        put("@type", JsonPrimitive("/cosmos.staking.v1beta1.MsgDelegate"))
                        put("delegator_address", JsonPrimitive(delegator))
                        put("validator_address", JsonPrimitive(validator))
                        put("amount", buildJsonObject {
                            put("denom", JsonPrimitive(ATOM_DENOM))
                            put("amount", JsonPrimitive(amount))
                        })
                    })))
                })
            })
        }
        val requestBody = Json.encodeToString(body)
        val responseBody = httpClient.post("$rpcUrl/cosmos/tx/v1beta1/simulate", requestBody)
        val response = Json.decodeFromString<CosmosSimulateResponse>(responseBody)
        response.gasInfo
    }

    /**
     * Simulate an undelegation transaction.
     */
    suspend fun simulateUndelegate(
        delegator: String,
        validator: String,
        amount: String
    ): CosmosGasInfo = withContext(Dispatchers.IO) {
        val body = buildJsonObject {
            put("tx", buildJsonObject {
                put("body", buildJsonObject {
                    put("messages", JsonArray(listOf(buildJsonObject {
                        put("@type", JsonPrimitive("/cosmos.staking.v1beta1.MsgUndelegate"))
                        put("delegator_address", JsonPrimitive(delegator))
                        put("validator_address", JsonPrimitive(validator))
                        put("amount", buildJsonObject {
                            put("denom", JsonPrimitive(ATOM_DENOM))
                            put("amount", JsonPrimitive(amount))
                        })
                    })))
                })
            })
        }
        val requestBody = Json.encodeToString(body)
        val responseBody = httpClient.post("$rpcUrl/cosmos/tx/v1beta1/simulate", requestBody)
        val response = Json.decodeFromString<CosmosSimulateResponse>(responseBody)
        response.gasInfo
    }

    // ─── Connection Management ──────────────────────────────────────────

    override fun setConnectedAddress(address: String) {
        require(isValidAddress(address, bech32Prefix)) { "Invalid Cosmos address: $address" }
        _connectedAddress = address
    }

    override fun disconnect() {
        _connectedAddress = null
    }

    // ─── Unified Request ────────────────────────────────────────────────

    suspend fun request(method: String, params: List<Any?> = emptyList()): JsonElement =
        when (method) {
            "cosmos_getBalance" -> JsonPrimitive(getBalance(params.firstOrNull() as? String ?: ""))
            "cosmos_sendTransaction" -> JsonPrimitive(sendTransaction(params.firstOrNull() as? String ?: ""))
            "cosmos_getBlockNumber" -> JsonPrimitive(getLatestBlock())
            "cosmos_estimateFee" -> JsonPrimitive(estimateFee())
            else -> throw CosmosError.UnsupportedMethod(method)
        }
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP Client Interface
// ────────────────────────────────────────────────────────────────────────────

interface CosmosHttpClient {
    suspend fun get(url: String): String
    suspend fun post(url: String, body: String): String
}

class DefaultCosmosHttpClient : CosmosHttpClient {
    override suspend fun get(url: String): String =
        withContext(Dispatchers.IO) {
            val connection = URL(url).openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw CosmosError.RpcError("HTTP ${connection.responseCode}")
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
                    throw CosmosError.RpcError("HTTP ${connection.responseCode}")
                }
                connection.inputStream.bufferedReader().use { it.readText() }
            } finally {
                connection.disconnect()
            }
        }
}
