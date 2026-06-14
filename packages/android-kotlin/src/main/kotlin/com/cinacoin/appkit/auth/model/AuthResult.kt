package com.cinacoin.appkit.auth.model

import java.util.Date

data class AuthResult(
    val userId: String,
    val email: String? = null,
    val provider: AuthProvider? = null,
    val accessToken: String,
    val refreshToken: String? = null,
    val expiresAt: Long
) {
    val isExpired: Boolean
        get() = System.currentTimeMillis() >= expiresAt
}

enum class AuthProvider(val value: String) {
    GOOGLE("google"),
    APPLE("apple"),
    GITHUB("github"),
    DISCORD("discord"),
    EMAIL("email")
}
