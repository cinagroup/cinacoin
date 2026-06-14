package com.cinacoin.appkit.auth

import android.content.Context
import com.cinacoin.appkit.auth.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Unified auth manager combining social and email login.
 * Handles token refresh, session persistence, and auto-refresh scheduling.
 */
object AuthManager {

    private val _currentUser = MutableStateFlow<AuthResult?>(null)
    val currentUser: StateFlow<AuthResult?> = _currentUser

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

    private var socialLogin: SocialLoginManager? = null
    private var emailLogin: EmailLoginManager? = null

    private var authUrl: String = "https://auth.cinacoin.com"
    private var projectId: String = ""

    /** Stored application context for auto-refresh (weak reference to avoid leaks) */
    private var appContext: android.content.Context? = null

    /** How many seconds before expiry to trigger a refresh */
    private const val REFRESH_THRESHOLD_MS = 5 * 60 * 1000L // 5 minutes

    /** Job for the auto-refresh timer */
    private var refreshJob: Job? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    fun configure(
        context: Context,
        authUrl: String = "https://auth.cinacoin.com",
        projectId: String
    ) {
        this.appContext = context.applicationContext
        this.authUrl = authUrl
        this.projectId = projectId
        socialLogin = SocialLoginManager(authUrl, projectId)
        emailLogin = EmailLoginManager(authUrl, projectId)

        // Restore session from secure storage
        restoreSession(context)
    }

    /**
     * Restore session from secure storage.
     * Must be called with an Android Context (e.g., Application context).
     */
    fun restoreSession(context: Context) {
        val prefs = SecureTokenStorage.getPreferences(context)
        val accessToken = prefs.getString(SecureTokenStorage.KEY_ACCESS_TOKEN, null) ?: return
        val userId = prefs.getString(SecureTokenStorage.KEY_USER_ID, null) ?: return
        val expiresAt = prefs.getLong(SecureTokenStorage.KEY_EXPIRES_AT, 0)
        val refreshToken = prefs.getString(SecureTokenStorage.KEY_REFRESH_TOKEN, null)

        // Don't restore if token is already expired
        if (System.currentTimeMillis() >= expiresAt) {
            signOut(context)
            return
        }

        val restored = AuthResult(
            userId = userId,
            email = null,
            provider = null,
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresAt = expiresAt
        )

        _currentUser.value = restored
        _isAuthenticated.value = true
        scheduleAutoRefresh(restored)
    }

    // MARK: - Social Login

    suspend fun signInWithGoogle(context: Context): AuthResult {
        val manager = socialLogin ?: throw AuthError.NotConfigured
        val result = manager.signInWithGoogle(context)
        handleAuthResult(context, result)
        return result
    }

    suspend fun signInWithGitHub(context: Context): AuthResult {
        val manager = socialLogin ?: throw AuthError.NotConfigured
        val result = manager.signInWithGitHub(context)
        handleAuthResult(context, result)
        return result
    }

    suspend fun signInWithDiscord(context: Context): AuthResult {
        val manager = socialLogin ?: throw AuthError.NotConfigured
        val result = manager.signInWithDiscord(context)
        handleAuthResult(context, result)
        return result
    }

    // MARK: - Email Login

    suspend fun register(email: String, password: String): AuthResult {
        val manager = emailLogin ?: throw AuthError.NotConfigured
        val result = manager.register(email, password)
        return result
    }

    suspend fun login(email: String, password: String): AuthResult {
        val manager = emailLogin ?: throw AuthError.NotConfigured
        val result = manager.login(email, password)
        return result
    }

    // MARK: - Session

    fun signOut(context: Context? = null) {
        _currentUser.value = null
        _isAuthenticated.value = false
        cancelRefreshTimer()

        context?.let { SecureTokenStorage.clear(it) }
    }

    // MARK: - Token Refresh

    /**
     * Refresh the access token using the stored refresh token.
     * Handles refresh token rotation: if the server returns a new refresh token, it is stored.
     */
    suspend fun refreshToken(context: Context): AuthResult = withContext(Dispatchers.IO) {
        val current = _currentUser.value ?: throw AuthError.TokenExpired
        val currentRefreshToken = current.refreshToken ?: throw AuthError.TokenExpired

        val url = URL("$authUrl/api/auth/oauth/refresh")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true

        val body = JSONObject().apply {
            put("refresh_token", currentRefreshToken)
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
            throw AuthError.NetworkError("Token refresh failed: $responseCode - $errorBody")
        }

        val response = conn.inputStream.bufferedReader().readText()
        val obj = JSONObject(response)

        val newAccessToken = obj.getString("access_token")
        val userId = obj.getString("user_id")
        val expiresAt = obj.optLong("expires_at", 0)
        // Handle refresh token rotation
        val newRefreshToken = obj.optString("refresh_token", null) ?: currentRefreshToken
        val email = obj.optString("email", null)

        val result = AuthResult(
            userId = userId,
            email = email,
            provider = current.provider,
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            expiresAt = expiresAt
        )

        // Persist new tokens
        handleAuthResult(context, result)

        result
    }

    /**
     * Ensure the current token is valid, refreshing if needed.
     * Returns a valid access token string.
     */
    suspend fun ensureValidToken(context: Context): String {
        val current = _currentUser.value ?: throw AuthError.TokenExpired

        val timeUntilExpiry = current.expiresAt - System.currentTimeMillis()
        if (timeUntilExpiry > REFRESH_THRESHOLD_MS) {
            return current.accessToken
        }

        // Token is about to expire or already expired — refresh
        val refreshed = refreshToken(context)
        return refreshed.accessToken
    }

    // MARK: - Callback Handling

    /**
     * Handle an incoming deep link intent.
     * Call this from your Activity's onNewIntent or onCreate when handling app links.
     * Returns true if the intent was an auth callback that was handled.
     */
    fun handleCallbackIntent(intent: android.content.Intent?): Boolean {
        val manager = socialLogin ?: return false
        if (!manager.isAuthCallback(intent)) return false
        manager.handleCallbackIntent(intent)
        return true
    }

    // MARK: - Private

    private fun handleAuthResult(context: Context, result: AuthResult) {
        _currentUser.value = result
        _isAuthenticated.value = true

        // Persist tokens
        val prefs = SecureTokenStorage.getPreferences(context)
        prefs.edit().apply {
            putString(SecureTokenStorage.KEY_ACCESS_TOKEN, result.accessToken)
            result.refreshToken?.let {
                putString(SecureTokenStorage.KEY_REFRESH_TOKEN, it)
            }
            putString(SecureTokenStorage.KEY_USER_ID, result.userId)
            putLong(SecureTokenStorage.KEY_EXPIRES_AT, result.expiresAt)
            apply()
        }

        // Schedule auto-refresh
        scheduleAutoRefresh(result)
    }

    /**
     * Schedule automatic token refresh before expiry.
     */
    private fun scheduleAutoRefresh(result: AuthResult) {
        cancelRefreshTimer()

        val ctx = appContext ?: return
        val timeUntilExpiry = result.expiresAt - System.currentTimeMillis()
        val refreshIn = maxOf(timeUntilExpiry - REFRESH_THRESHOLD_MS, 10_000L)

        refreshJob = scope.launch {
            delay(refreshIn)
            try {
                val current = _currentUser.value ?: return@launch
                if (current.refreshToken == null) return@launch

                println("[AuthManager] Auto-refresh triggered")
                refreshToken(ctx)
            } catch (e: Exception) {
                println("[AuthManager] Auto-refresh failed: ${e.message}")
                scheduleRetryRefresh()
            }
        }
    }

    private fun scheduleRetryRefresh() {
        cancelRefreshTimer()
        val ctx = appContext ?: return
        refreshJob = scope.launch {
            delay(60_000L)
            try {
                println("[AuthManager] Retry refresh triggered")
                refreshToken(ctx)
            } catch (e: Exception) {
                println("[AuthManager] Retry refresh failed: ${e.message}")
            }
        }
    }

    private fun cancelRefreshTimer() {
        refreshJob?.cancel()
        refreshJob = null
    }
}
