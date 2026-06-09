/**
 * ChainAdapter — Common interface for all chain adapters.
 *
 * Every chain adapter implements this interface to provide a uniform API
 * for balance queries, transaction submission, and chain metadata.
 */
package com.cinacoin.chain

/**
 * Common interface for blockchain adapters.
 *
 * Each adapter handles a specific chain family (EVM, Solana, Bitcoin, etc.)
 * and exposes the core operations needed for wallet interactions.
 */
interface ChainAdapter {
    /** Canonical chain identifier (e.g. "bitcoin", "ethereum", "solana"). */
    val chainName: String

    /** Current RPC endpoint URL. */
    val endpoint: String

    /** Whether the adapter is connected to a wallet. */
    val isConnected: Boolean

    /** Connected wallet address, or null. */
    val connectedAddress: String?

    /**
     * Get the native token balance for an address.
     * @param address Chain-specific address string.
     * @return Balance as a human-readable decimal string.
     */
    suspend fun getBalance(address: String): String

    /**
     * Broadcast a signed transaction to the network.
     * @param rawTx Chain-specific encoded transaction bytes (hex/base64).
     * @return Transaction hash/ID.
     */
    suspend fun sendTransaction(rawTx: String): String

    /**
     * Get the current block/checkpoint/slot number.
     */
    suspend fun getLatestBlock(): Long

    /**
     * Estimate the fee required for a transaction.
     * @return Fee as a decimal string in the native token.
     */
    suspend fun estimateFee(): String

    /**
     * Set the connected wallet address after a successful connection.
     */
    fun setConnectedAddress(address: String)

    /**
     * Disconnect from the current wallet session.
     */
    fun disconnect()
}
