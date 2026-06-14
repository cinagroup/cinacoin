package com.cinacoin.appkit.smartaccount

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

sealed class SmartAccountError(message: String) : Exception(message) {
    object NotInitialized : SmartAccountError("Smart account not initialized")
    object InvalidBatch : SmartAccountError("Invalid batch: arrays must have same length")
    object DeploymentFailed : SmartAccountError("Smart account deployment failed")
    data class UserOpFailed(val detail: String) : SmartAccountError("User operation failed: $detail")
}

class SmartAccountManager(
    private val bundlerUrl: String = "https://bundler.cinacoin.com"
) {
    private val entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

    private val _smartAccountAddress = MutableStateFlow<String?>(null)
    val smartAccountAddress: StateFlow<String?> = _smartAccountAddress

    private val _isDeployed = MutableStateFlow(false)
    val isDeployed: StateFlow<Boolean> = _isDeployed

    suspend fun getSmartAccount(ownerAddress: String, salt: Long = 0): String {
        val address = computeAddress(ownerAddress, salt)
        _smartAccountAddress.value = address
        _isDeployed.value = checkDeployed(address)
        return address
    }

    suspend fun deploy(ownerAddress: String, salt: Long = 0): String {
        val address = _smartAccountAddress.value ?: computeAddress(ownerAddress, salt)
        val initCode = buildInitCode(ownerAddress, salt)

        val userOp = UserOperation(
            sender = address,
            nonce = 0,
            initCode = initCode,
            callData = ByteArray(0),
            callGasLimit = 500_000,
            verificationGasLimit = 500_000,
            preVerificationGas = 50_000,
            maxFeePerGas = 1_000_000_000,
            maxPriorityFeePerGas = 1_000_000_000,
            paymasterAndData = ByteArray(0),
            signature = ByteArray(0)
        )

        val txHash = BundlerClient.sendUserOperation(userOp, entryPointAddress, bundlerUrl)
        _isDeployed.value = true
        return txHash
    }

    suspend fun execute(
        target: String,
        value: Long,
        data: ByteArray,
        ownerAddress: String
    ): String {
        val accountAddress = _smartAccountAddress.value ?: throw SmartAccountError.NotInitialized

        val callData = encodeExecute(target, value, data)
        val userOp = UserOperation(
            sender = accountAddress,
            nonce = getNonce(accountAddress),
            initCode = ByteArray(0),
            callData = callData,
            callGasLimit = 500_000,
            verificationGasLimit = 500_000,
            preVerificationGas = 50_000,
            maxFeePerGas = 1_000_000_000,
            maxPriorityFeePerGas = 1_000_000_000,
            paymasterAndData = ByteArray(0),
            signature = ByteArray(0)
        )

        return BundlerClient.sendUserOperation(userOp, entryPointAddress, bundlerUrl)
    }

    // ---- Real implementations ----------------------------------------------

    private val factoryAddress = "0x9406Cc6185a346906296840746125a0E44976454"

    /** CREATE2 address: keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12..] */
    private fun computeAddress(owner: String, salt: Long): String {
        val initCode = buildInitCode(owner, salt)
        val saltPadded = CryptoUtils.padUint256(salt) // 32 bytes
        return CryptoUtils.computeCreate2Address(
            factory = factoryAddress,
            salt = saltPadded,
            initCode = initCode,
        )
    }

    private suspend fun checkDeployed(address: String): Boolean {
        // TODO: eth_getCode via RPC; non-empty means deployed
        return false
    }

    /**
     * initCode = factory (20 bytes) ++ createAccount(address owner, uint256 salt)
     * Function selector: 0x5fbfb9cf
     */
    private fun buildInitCode(owner: String, salt: Long): ByteArray {
        // createAccount(address owner, uint256 salt) selector: 0x5fbfb9cf
        val selector = byteArrayOf(0x5f, 0xbf.toByte(), 0xb9.toByte(), 0xcf.toByte())
        val ownerPadded = CryptoUtils.padAddress(owner)
        val saltPadded = CryptoUtils.padUint256(salt)
        val factoryBytes = CryptoUtils.hexToBytes(factoryAddress)
        return factoryBytes + selector + ownerPadded + saltPadded
    }

    /**
     * execute(address dest, uint256 value, bytes func)
     * Function selector: 0xb61d27f6
     */
    private fun encodeExecute(target: String, value: Long, data: ByteArray): ByteArray {
        val selector = byteArrayOf(0xb6.toByte(), 0x1d, 0x27, 0xf6)
        val targetPadded = CryptoUtils.padAddress(target)
        val valuePadded = CryptoUtils.padUint256(value)
        // Offset to dynamic bytes data: 3 * 32 = 96
        val offset = CryptoUtils.padUint256(96)
        val encodedData = CryptoUtils.abiEncodeBytes(data)
        return selector + targetPadded + valuePadded + offset + encodedData
    }

    private suspend fun getNonce(address: String): Long {
        // TODO: call entryPoint.getNonce(address, 0) via RPC
        return 0
    }
}
