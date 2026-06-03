/**
 * TransactionManager.kt — Transaction building, estimation, and sending.
 *
 * Provides suspend functions for constructing, estimating gas,
 * and dispatching transactions via WalletConnect.
 */
package com.cinacoin.sdk

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.time.Instant

class TransactionManager {

    private val _confirmations = MutableSharedFlow<TxConfirmationUpdate>(extraBufferCapacity = 16)
    val confirmations: Flow<TxConfirmationUpdate> = _confirmations.asSharedFlow()

    private lateinit var wcManager: WalletConnectManager
    private lateinit var chainManager: ChainManager

    /** Internal initialization by CinacoinSDK. */
    internal fun initialize(wc: WalletConnectManager, chains: ChainManager) {
        this.wcManager = wc
        this.chainManager = chains
    }

    /**
     * Estimate gas for a transaction.
     *
     * Returns the estimated gas as a hex string, e.g. "0x5208".
     */
    suspend fun estimateGas(params: TransactionParams): String {
        val chainId = params.chainId ?: chainManager.activeChain?.id
            ?: throw CinacoinError.NotInitialized()

        // Real implementation: JSON-RPC eth_estimateGas to chain RPC
        delay(150)
        return "0x5208" // 21000 gas minimum
    }

    /**
     * Estimate total transaction cost (gas * gasPrice) in wei.
     */
    suspend fun estimateCost(params: TransactionParams): String {
        val gas = estimateGas(params)
        val gasPrice = params.gasPrice ?: "0x" + (1_000_000_000L).toString(16) // 1 Gwei default
        // Parse hex → multiply → hex
        val gasLong = gas.toLongOrNull(16) ?: 21000L
        val priceLong = gasPrice.toLongOrNull(16) ?: 1_000_000_000L
        val total = gasLong * priceLong
        return "0x" + total.toString(16)
    }

    /**
     * Build a [TransactionParams] for a native token transfer (ETH, MATIC, BNB, etc.).
     */
    fun buildTransfer(
        from: String,
        to: String,
        valueWei: String,
        chainId: Int? = null,
        gas: String? = null,
        maxFeePerGas: String? = null,
        maxPriorityFeePerGas: String? = null
    ): TransactionParams {
        return TransactionParams(
            from = from,
            to = to,
            value = valueWei,
            data = "0x",
            gas = gas,
            maxFeePerGas = maxFeePerGas,
            maxPriorityFeePerGas = maxPriorityFeePerGas,
            chainId = chainId
        )
    }

    /**
     * Build a [TransactionParams] for a contract interaction.
     */
    fun buildContractCall(
        from: String,
        to: String,
        calldata: String,
        valueWei: String? = null,
        chainId: Int? = null,
        gas: String? = null,
        maxFeePerGas: String? = null,
        maxPriorityFeePerGas: String? = null
    ): TransactionParams {
        return TransactionParams(
            from = from,
            to = to,
            value = valueWei,
            data = calldata,
            gas = gas,
            maxFeePerGas = maxFeePerGas,
            maxPriorityFeePerGas = maxPriorityFeePerGas,
            chainId = chainId
        )
    }

    /**
     * Send a transaction.
     *
     * 1. Estimates gas if not provided.
     * 2. Dispatches via WalletConnect.
     * 3. Returns the transaction hash.
     */
    suspend fun send(params: TransactionParams): TransactionResult {
        val resolvedParams = if (params.gas == null) {
            val gas = estimateGas(params)
            params.copy(gas = gas)
        } else {
            params
        }

        val hash = wcManager.sendTransaction(resolvedParams)

        // Start confirmation polling
        val chainId = resolvedParams.chainId ?: chainManager.activeChain?.id ?: 1
        kotlinx.coroutines.MainScope().launch {
            pollConfirmations(hash, chainId)
        }

        return TransactionResult(
            hash = hash,
            chainId = chainId
        )
    }

    /**
     * Wait for a transaction to reach a given number of confirmations.
     */
    suspend fun waitForConfirmation(hash: String, requiredConfirmations: Int = 1): TxConfirmationUpdate {
        return _confirmations.asSharedFlow()
            .filter { it.hash == hash && it.confirmations >= requiredConfirmations }
            .first()
    }

    /**
     * Get transaction receipt (stub — real impl via eth_getTransactionReceipt).
     */
    suspend fun getReceipt(hash: String, chainId: Int? = null): TxReceipt {
        val targetChain = chainId ?: chainManager.activeChain?.id ?: 1
        // Real: JSON-RPC eth_getTransactionReceipt
        delay(100)
        return TxReceipt(
            hash = hash,
            chainId = targetChain,
            status = TxStatus.PENDING,
            blockNumber = null,
            gasUsed = null
        )
    }

    // ─── Internal confirmation polling ─────────────────────────────────────

    private suspend fun pollConfirmations(hash: String, chainId: Int) {
        // Real implementation: poll eth_getTransactionReceipt on interval
        var confs = 0
        repeat(12) {
            delay(5000) // poll every 5s
            confs++
            val status = if (confs >= 12) TxStatus.CONFIRMED else TxStatus.PENDING
            val update = TxConfirmationUpdate(hash, confs, status)
            _confirmations.emit(update)
            if (status == TxStatus.CONFIRMED) return
        }
    }

}

/**
 * Simplified transaction receipt.
 */
data class TxReceipt(
    val hash: String,
    val chainId: Int,
    val status: TxStatus,
    val blockNumber: Long?,
    val gasUsed: Long?
)
