package com.cinacoin.appkit.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.cinacoin.appkit.auth.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Social login manager for Android using Custom Tabs.
 *
 * Flow:
 * 1. Launch Custom Tab to OAuth provider
 * 2. Provider redirects to cinacoin://auth/{provider}/callback?code=...
 * 3. App intercepts via deep link, calls [handleCallbackIntent]
 * 4. Exchange code for tokens via Auth Service API
 * 5. Store tokens securely in EncryptedSharedPreferences
 */
class SocialLoginManager(
    private val authUrl: String = "https://auth.cinacoin.com",
    private val projectId: String,
    private val callbackScheme: String = "cinacoin"
) {
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    // Pending continuation for callback
    @Volatile
    private var pendingCallback: kotlinx.coroutines.CancellableContinuation<Uri>? = null

    /**
     * Sign in with Google via Custom Tabs
     */
    suspend fun signInWithGoogle(context: Context): AuthResult {
        return performOAuthLogin(context, "google", AuthProvider.GOOGLE)
    }

    /**
     * Sign in with GitHub via Custom Tabs
     */
    suspend fun signInWithGitHub(context: Context): AuthResult {
        return performOAuthLogin(context, "github", AuthProvider.GITHUB)
    }

    /**
     * Sign in with Discord via Custom Tabs
     */
    suspend fun signInWithDiscord(context: Context): AuthResult {
        return performOAuthLogin(context, "discord", AuthProvider.DISCORD)
    }

    /**
     * Handle the callback intent from deep link.
     * Call this from your Activity's onNewIntent or when app_links delivers a URI.
     */
    fun handleCallbackIntent(intent: Intent?) {
        val uri = intent?.data ?: return
        val continuation = pendingCallback ?: return

        // Only handle URIs matching our callback scheme
        if (uri.scheme == callbackScheme) {
            pendingCallback = null
            continuation.resume(uri)
        }
    }

    /**
     * Check if an intent is an auth callback
     */
    fun isAuthCallback(intent: Intent?): Boolean {
        val uri = intent?.data ?: return false
        return uri.scheme == callbackScheme && uri.host == "auth"
    }

    // MARK: - Private

    private suspend fun performOAuthLogin(
        context: Context,
        provider: String,
        authProvider: AuthProvider
    ): AuthResult {
        _isLoading.value = true
        _error.value = null
        try {
            val callbackUrl = "$callbackScheme://auth/$provider/callback"
            val authUri = Uri.parse(
                "$authUrl/api/auth/$provider?redirect_uri=$callbackUrl&project_id=$projectId"
            )

            // Launch Custom Tab and wait for callback
            val callbackUri = launchCustomTabAndWait(context, authUri)

            // Parse authorization code from callback
            val code = parseAuthorizationCode(callbackUri)
                ?: throw AuthError.NetworkError("Missing authorization code in callback")

            // Exchange code for tokens
            val authResult = exchangeCodeForTokens(code, authProvider)

            // Store tokens securely
            storeTokensSecurely(context, authResult)

            return authResult
        } catch (e: Exception) {
            _error.value = e.message
            throw e
        } finally {
            _isLoading.value = false
        }
    }

    /**
     * Launch a Chrome Custom Tab and suspend until the callback deep link arrives.
     */
    private suspend fun launchCustomTabAndWait(
        context: Context,
        uri: Uri
    ): Uri = suspendCancellableCoroutine { continuation ->
        pendingCallback = continuation

        val customTabsIntent = CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
        customTabsIntent.launchUrl(context, uri)

        continuation.invokeOnCancellation {
            pendingCallback = null
            _error.value = null
        }
    }

    /**
     * Parse the authorization code from the callback URI.
     * Expected format: cinacoin://auth/{provider}/callback?code=XXXXX
     */
    private fun parseAuthorizationCode(uri: Uri): String? {
        // Check for error in callback
        val error = uri.getQueryParameter("error")
        if (error != null) {
            val errorDescription = uri.getQueryParameter("error_description") ?: error
            _error.value = "OAuth error: $errorDescription"
            return null
        }
        return uri.getQueryParameter("code")
    }

    /**
     * Exchange authorization code for tokens via Auth Service API.
     * POST /api/auth/oauth/callback
     */
    private suspend fun exchangeCodeForTokens(
        code: String,
        provider: AuthProvider
    ): AuthResult = withContext(Dispatchers.IO) {
        val url = URL("$authUrl/api/auth/oauth/callback")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true

        val body = JSONObject().apply {
            put("code", code)
            put("provider", provider.value)
            put("project_id", projectId)
        }
        conn.outputStream.write(body.toString().toByteArray())

        val responseCode = conn.responseCode
        if (responseCode !in 200..299) {
            val errorBody = try {
                conn.errorStream?.bufferedReader()?.readText() ?: "Unknown error"
            } catch (_: Exception) {
                "Unknown error"
            }
            throw AuthError.NetworkError(
                "Token exchange failed: $responseCode - $errorBody"
            )
        }

        val response = conn.inputStream.bufferedReader().readText()
        parseAuthResult(response, provider)
    }

    /**
     * Parse auth result from JSON response
     */
    private fun parseAuthResult(json: String, provider: AuthProvider): AuthResult {
        val obj = JSONObject(json)
        return AuthResult(
            userId = obj.getString("user_id"),
            email = obj.optString("email", null),
            provider = provider,
            accessToken = obj.getString("access_token"),
            refreshToken = obj.optString("refresh_token", null),
            expiresAt = obj.optLong("expires_at", 0)
        )
    }

    /**
     * Store tokens securely using EncryptedSharedPreferences
     */
    private fun storeTokensSecurely(context: Context, authResult: AuthResult) {
        val prefs = SecureTokenStorage.getPreferences(context)
        prefs.edit().apply {
            putString(SecureTokenStorage.KEY_ACCESS_TOKEN, authResult.accessToken)
            authResult.refreshToken?.let {
                putString(SecureTokenStorage.KEY_REFRESH_TOKEN, it)
            }
            putString(SecureTokenStorage.KEY_USER_ID, authResult.userId)
            putLong(SecureTokenStorage.KEY_EXPIRES_AT, authResult.expiresAt)
            apply()
        }
    }
}

/**
 * Secure token storage using EncryptedSharedPreferences.
 * Falls back to regular SharedPreferences if encryption is unavailable.
 */
object SecureTokenStorage {
    const val KEY_ACCESS_TOKEN = "com.cinacoin.auth.access_token"
    const val KEY_REFRESH_TOKEN = "com.cinacoin.auth.refresh_token"
    const val KEY_USER_ID = "com.cinacoin.auth.user_id"
    const val KEY_EXPIRES_AT = "com.cinacoin.auth.expires_at"

    private const val PREFS_NAME = "com.cinacoin.auth.secure_prefs"

    fun getPreferences(context: Context): android.content.SharedPreferences {
        return try {
            // Try EncryptedSharedPreferences first
            val masterKey = androidx.security.crypto.MasterKey.Builder(context)
                .setKeyScheme(androidx.security.crypto.MasterKey.KeyScheme.AES256_GCM)
                .build()

            androidx.security.crypto.EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                androidx.security.crypto.EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                androidx.security.crypto.EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (_: Exception) {
            // Fallback to regular SharedPreferences
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    fun clear(context: Context) {
        getPreferences(context).edit().clear().apply()
    }
}
