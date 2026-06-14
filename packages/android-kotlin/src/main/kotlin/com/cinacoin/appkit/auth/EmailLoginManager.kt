package com.cinacoin.appkit.auth

import com.cinacoin.appkit.auth.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class EmailLoginManager(
    private val authUrl: String = "https://auth.cinacoin.com",
    private val projectId: String
) {
    suspend fun register(email: String, password: String): AuthResult = withContext(Dispatchers.IO) {
        val url = URL("$authUrl/api/auth/register")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true

        val body = JSONObject().apply {
            put("email", email)
            put("password", password)
            put("project_id", projectId)
        }
        conn.outputStream.write(body.toString().toByteArray())

        val responseCode = conn.responseCode
        if (responseCode !in 200..299) {
            throw AuthError.NetworkError("Registration failed with code $responseCode")
        }

        val response = conn.inputStream.bufferedReader().readText()
        parseAuthResult(response)
    }

    suspend fun login(email: String, password: String): AuthResult = withContext(Dispatchers.IO) {
        val url = URL("$authUrl/api/auth/login")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true

        val body = JSONObject().apply {
            put("email", email)
            put("password", password)
            put("project_id", projectId)
        }
        conn.outputStream.write(body.toString().toByteArray())

        val responseCode = conn.responseCode
        if (responseCode !in 200..299) {
            throw AuthError.InvalidCredentials
        }

        val response = conn.inputStream.bufferedReader().readText()
        parseAuthResult(response)
    }

    suspend fun sendPasswordReset(email: String): Unit = withContext(Dispatchers.IO) {
        val url = URL("$authUrl/api/auth/reset-password")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true

        val body = JSONObject().apply {
            put("email", email)
            put("project_id", projectId)
        }
        conn.outputStream.write(body.toString().toByteArray())

        val responseCode = conn.responseCode
        if (responseCode !in 200..299) {
            throw AuthError.NetworkError("Password reset failed")
        }
    }

    private fun parseAuthResult(json: String): AuthResult {
        val obj = JSONObject(json)
        return AuthResult(
            userId = obj.getString("user_id"),
            email = obj.optString("email", null),
            provider = obj.optString("provider", null)?.let { AuthProvider.valueOf(it.uppercase()) },
            accessToken = obj.getString("access_token"),
            refreshToken = obj.optString("refresh_token", null),
            expiresAt = obj.optLong("expires_at", 0)
        )
    }
}
