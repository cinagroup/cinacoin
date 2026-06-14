package com.cinacoin.appkit.smartaccount

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object BundlerClient {

    suspend fun sendUserOperation(
        userOp: UserOperation,
        entryPoint: String,
        bundlerUrl: String
    ): String = withContext(Dispatchers.IO) {
        val response = sendRPC(
            url = bundlerUrl,
            method = "eth_sendUserOperation",
            params = listOf(userOp.toHexParams(), entryPoint)
        )
        response as? String ?: throw SmartAccountError.UserOpFailed("Invalid response")
    }

    suspend fun getUserOperationReceipt(
        userOpHash: String,
        bundlerUrl: String
    ): Map<String, Any?> = withContext(Dispatchers.IO) {
        val response = sendRPC(
            url = bundlerUrl,
            method = "eth_getUserOperationReceipt",
            params = listOf(userOpHash)
        )
        @Suppress("UNCHECKED_CAST")
        response as? Map<String, Any?> ?: throw SmartAccountError.UserOpFailed("Invalid receipt")
    }

    suspend fun estimateGas(
        userOp: UserOperation,
        entryPoint: String,
        bundlerUrl: String
    ): GasEstimate = withContext(Dispatchers.IO) {
        val response = sendRPC(
            url = bundlerUrl,
            method = "eth_estimateUserOperationGas",
            params = listOf(userOp.toHexParams(), entryPoint)
        )
        @Suppress("UNCHECKED_CAST")
        val gas = response as? Map<String, String> ?: throw SmartAccountError.UserOpFailed("Invalid gas estimate")
        GasEstimate(
            callGasLimit = parseHexLong(gas["callGasLimit"]),
            verificationGasLimit = parseHexLong(gas["verificationGasLimit"]),
            preVerificationGas = parseHexLong(gas["preVerificationGas"])
        )
    }

    private suspend fun sendRPC(url: String, method: String, params: List<Any>): Any? = withContext(Dispatchers.IO) {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.setRequestProperty("Content-Type", "application/json")
        connection.doOutput = true

        val body = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("id", 1)
            put("method", method)
            put("params", params)
        }
        connection.outputStream.write(body.toString().toByteArray())

        val responseCode = connection.responseCode
        if (responseCode !in 200..299) {
            throw SmartAccountError.UserOpFailed("RPC request failed: $responseCode")
        }

        val responseText = connection.inputStream.bufferedReader().readText()
        val json = JSONObject(responseText)

        if (json.has("error")) {
            val error = json.getJSONObject("error")
            throw SmartAccountError.UserOpFailed(error.optString("message", "Unknown error"))
        }

        json.get("result")
    }

    private fun parseHexLong(hex: String?): Long {
        if (hex == null) return 0
        return hex.removePrefix("0x").toLongOrNull(16) ?: 0
    }
}

data class GasEstimate(
    val callGasLimit: Long,
    val verificationGasLimit: Long,
    val preVerificationGas: Long
)
