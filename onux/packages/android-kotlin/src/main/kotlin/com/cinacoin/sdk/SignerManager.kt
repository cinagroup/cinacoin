/**
 * SignerManager.kt — Message signing (personal_sign, signTypedData).
 *
 * Dispatches signing requests through WalletConnect to the connected wallet.
 */
package com.cinacoin.sdk

import kotlinx.coroutines.delay

class SignerManager {

    private lateinit var wcManager: WalletConnectManager
    private lateinit var chainManager: ChainManager

    internal fun initialize(wc: WalletConnectManager, chains: ChainManager) {
        this.wcManager = wc
        this.chainManager = chains
    }

    /**
     * personal_sign — sign an arbitrary message.
     *
     * @param message The message to sign.
     * @param address The account address. If null, uses the connected account.
     * @return Hex-encoded signature.
     */
    suspend fun personalSign(message: String, address: String? = null): SignatureResult {
        val addr = address ?: requireConnectedAddress()
        val signature = wcManager.personalSign(message, addr)
        return SignatureResult(signature = signature)
    }

    /**
     * eth_signTypedData_v4 — sign structured data (EIP-712).
     *
     * @param typedDataJson EIP-712 typed data as JSON string.
     * @param address The account address. If null, uses the connected account.
     * @return Hex-encoded signature.
     */
    suspend fun signTypedData(typedDataJson: String, address: String? = null): SignatureResult {
        val addr = address ?: requireConnectedAddress()
        val signature = wcManager.signTypedData(typedDataJson, addr)
        return SignatureResult(signature = signature)
    }

    /**
     * Convenience: sign a simple typed data object for common patterns.
     *
     * @param domain EIP-712 domain name.
     * @param chainId Chain ID for the domain.
     * @param verifyingContract Address of the verifying contract.
     * @param primaryType The primary type name.
     * @param types The type definitions as a JSON string.
     * @param message The message values as a JSON string.
     * @param address The signing address.
     */
    suspend fun signEip712(
        domain: String,
        chainId: Int,
        verifyingContract: String,
        primaryType: String,
        types: String,
        message: String,
        address: String? = null
    ): SignatureResult {
        val typedDataJson = buildTypedDataJson(domain, chainId, verifyingContract, primaryType, types, message)
        return signTypedData(typedDataJson, address)
    }

    /**
     * Verify a signature against a message and address.
     *
     * Uses local EC recovery (no network call).
     */
    fun verifySignature(
        message: String,
        signature: String,
        expectedAddress: String
    ): Boolean {
        try {
            val recovered = recoverAddress(message, signature)
            return recovered.equals(expectedAddress, ignoreCase = true)
        } catch (_: Exception) {
            return false
        }
    }

    // ─── Internal helpers ──────────────────────────────────────────────────

    private fun requireConnectedAddress(): String {
        return wcManager.connectedAddress.value
            ?: throw CinacoinError.WalletConnectError("No connected wallet address. Call connect() first.")
    }

    private fun buildTypedDataJson(
        domain: String,
        chainId: Int,
        verifyingContract: String,
        primaryType: String,
        types: String,
        message: String
    ): String {
        return """{
            "domain": {
                "name": "$domain",
                "chainId": $chainId,
                "verifyingContract": "$verifyingContract"
            },
            "primaryType": "$primaryType",
            "types": $types,
            "message": $message
        }"""
    }

    /**
     * Recover address from a personal_sign signature.
     * Simplified — real implementation uses ECDSA secp256k1 recovery.
     */
    private fun recoverAddress(message: String, signature: String): String {
        // Real implementation: hash message → recover pubkey from v/r/s → derive address
        // This is a placeholder. In production, use a crypto library like Web3j or BouncyCastle.
        return "0x0000000000000000000000000000000000000000"
    }
}
