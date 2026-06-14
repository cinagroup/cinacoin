package com.cinacoin.appkit.auth.model

sealed class AuthError(message: String) : Exception(message) {
    object InvalidURL : AuthError("Invalid URL")
    object Cancelled : AuthError("Authentication cancelled")
    object InvalidCredentials : AuthError("Invalid credentials")
    object TokenExpired : AuthError("Token expired")
    object NotConfigured : AuthError("Auth not configured. Call configure() first.")
    data class NetworkError(val detail: String) : AuthError("Network error: $detail")
    data class NotImplemented(val feature: String) : AuthError("Not implemented: $feature")
}
