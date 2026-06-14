package com.cinacoin.appkit.smartaccount

import org.json.JSONObject

data class UserOperation(
    val sender: String,
    val nonce: Long,
    val initCode: ByteArray,
    val callData: ByteArray,
    val callGasLimit: Long,
    val verificationGasLimit: Long,
    val preVerificationGas: Long,
    val maxFeePerGas: Long,
    val maxPriorityFeePerGas: Long,
    val paymasterAndData: ByteArray,
    val signature: ByteArray
) {
    fun toHexParams(): Map<String, String> = mapOf(
        "sender" to sender,
        "nonce" to "0x${nonce.toString(16)}",
        "initCode" to initCode.toHexString(),
        "callData" to callData.toHexString(),
        "callGasLimit" to "0x${callGasLimit.toString(16)}",
        "verificationGasLimit" to "0x${verificationGasLimit.toString(16)}",
        "preVerificationGas" to "0x${preVerificationGas.toString(16)}",
        "maxFeePerGas" to "0x${maxFeePerGas.toString(16)}",
        "maxPriorityFeePerGas" to "0x${maxPriorityFeePerGas.toString(16)}",
        "paymasterAndData" to paymasterAndData.toHexString(),
        "signature" to signature.toHexString()
    )
}

fun ByteArray.toHexString(): String =
    "0x" + joinToString("") { "%02x".format(it) }
