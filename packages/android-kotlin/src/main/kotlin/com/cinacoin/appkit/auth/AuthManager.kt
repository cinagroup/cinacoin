package com.cinacoin.appkit.auth

import android.content.Context
import com.cinacoin.appkit.auth.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

object AuthManager {

    private val _currentUser = MutableStateFlow<AuthResult?>(null)
    val currentUser: StateFlow<AuthResult?> = _currentUser

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    private var socialLogin: SocialLoginManager? = null
    private var emailLogin: EmailLoginManager? = null

    fun configure(authUrl: String = "https://auth.cinacoin.com", projectId: String) {
        socialLogin = SocialLoginManager(authUrl, projectId)
        emailLogin = EmailLoginManager(authUrl, projectId)
    }

    // Social Login
    suspend fun signInWithGoogle(context: Context): AuthResult {
        val manager = socialLogin ?: throw AuthError.NotConfigured
        val result = manager.signInWithGoogle(context)
        handleAuthResult(result)
        return result
    }

    suspend fun signInWithGitHub(context: Context): AuthResult {
        val manager = socialLogin ?: throw AuthError.NotConfigured
        val result = manager.signInWithGitHub(context)
        handleAuthResult(result)
        return result
    }

    suspend fun signInWithDiscord(context: Context): AuthResult {
        val manager = socialLogin ?: throw AuthError.NotConfigured
        val result = manager.signInWithDiscord(context)
        handleAuthResult(result)
        return result
    }

    // Email Login
    suspend fun register(email: String, password: String): AuthResult {
        val manager = emailLogin ?: throw AuthError.NotConfigured
        val result = manager.register(email, password)
        handleAuthResult(result)
        return result
    }

    suspend fun login(email: String, password: String): AuthResult {
        val manager = emailLogin ?: throw AuthError.NotConfigured
        val result = manager.login(email, password)
        handleAuthResult(result)
        return result
    }

    // Session
    fun signOut() {
        _currentUser.value = null
        _isAuthenticated.value = false
    }

    private fun handleAuthResult(result: AuthResult) {
        _currentUser.value = result
        _isAuthenticated.value = true
    }
}
