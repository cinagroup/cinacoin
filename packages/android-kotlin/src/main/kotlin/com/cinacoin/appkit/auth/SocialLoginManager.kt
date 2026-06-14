package com.cinacoin.appkit.auth

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.cinacoin.appkit.auth.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class SocialLoginManager(
    private val authUrl: String = "https://auth.cinacoin.com",
    private val projectId: String
) {
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    suspend fun signInWithGoogle(context: Context): AuthResult {
        _isLoading.value = true
        _error.value = null
        try {
            val callbackUrl = "$authUrl/api/auth/google/callback"
            val authUri = Uri.parse("$authUrl/api/auth/google?redirect_uri=$callbackUrl&project_id=$projectId")
            launchCustomTab(context, authUri)
            throw AuthError.NotImplemented("Google Sign-In callback handling")
        } finally {
            _isLoading.value = false
        }
    }

    suspend fun signInWithGitHub(context: Context): AuthResult {
        _isLoading.value = true
        _error.value = null
        try {
            val callbackUrl = "$authUrl/api/auth/github/callback"
            val authUri = Uri.parse("$authUrl/api/auth/github?redirect_uri=$callbackUrl&project_id=$projectId")
            launchCustomTab(context, authUri)
            throw AuthError.NotImplemented("GitHub Sign-In callback handling")
        } finally {
            _isLoading.value = false
        }
    }

    suspend fun signInWithDiscord(context: Context): AuthResult {
        _isLoading.value = true
        _error.value = null
        try {
            val callbackUrl = "$authUrl/api/auth/discord/callback"
            val authUri = Uri.parse("$authUrl/api/auth/discord?redirect_uri=$callbackUrl&project_id=$projectId")
            launchCustomTab(context, authUri)
            throw AuthError.NotImplemented("Discord Sign-In callback handling")
        } finally {
            _isLoading.value = false
        }
    }

    private fun launchCustomTab(context: Context, uri: Uri) {
        val customTabsIntent = CustomTabsIntent.Builder().build()
        customTabsIntent.launchUrl(context, uri)
    }
}
