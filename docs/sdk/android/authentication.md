# Android SDK — Authentication

## Overview

AppKit provides built-in authentication through social login providers and email. Users can authenticate and get a connected wallet without installing any wallet app.

## Configure AuthManager

```kotlin
import io.cinacoin.appkit.auth.AuthConfig
import io.cinacoin.appkit.auth.AuthManager
import io.cinacoin.appkit.auth.AuthProvider

val authConfig = AuthConfig(
    projectId = "YOUR_PROJECT_ID",
    supportedProviders = listOf(
        AuthProvider.GOOGLE,
        AuthProvider.GITHUB,
        AuthProvider.DISCORD,
        AuthProvider.APPLE,
        AuthProvider.EMAIL
    ),
    redirectUrl = "myapp://auth/callback"
)

CinacoinAppKit.configureAuth(authConfig)
```

### Auth Configuration Options

| Parameter                 | Type                 | Description                                      |
| ------------------------- | -------------------- | ------------------------------------------------ |
| `projectId`               | `String`             | Your Cinacoin Cloud project ID                   |
| `supportedProviders`      | `List<AuthProvider>` | Enabled login providers                          |
| `redirectUrl`             | `String`             | URL scheme for OAuth callbacks                   |
| `sessionDuration`         | `Long`               | Session expiry in milliseconds (default: 7 days) |
| `enablePersistentSession` | `Boolean`            | Persist session across app launches              |

## Social Login

### Google

```kotlin
import io.cinacoin.appkit.auth.AuthManager

val result = AuthManager.instance.signIn(provider = AuthProvider.GOOGLE)

Log.d("Auth", "User ID: ${result.userId}")
Log.d("Auth", "Email: ${result.email}")
Log.d("Auth", "Wallet: ${result.address}")
Log.d("Auth", "Token: ${result.idToken}")
```

### GitHub

```kotlin
val result = AuthManager.instance.signIn(provider = AuthProvider.GITHUB)

Log.d("Auth", "Username: ${result.username}")
Log.d("Auth", "Email: ${result.email}")
Log.d("Auth", "Wallet: ${result.address}")
```

### Discord

```kotlin
val result = AuthManager.instance.signIn(provider = AuthProvider.DISCORD)

Log.d("Auth", "Username: ${result.username}")
Log.d("Auth", "Discord ID: ${result.userId}")
Log.d("Auth", "Wallet: ${result.address}")
```

### Apple

```kotlin
val result = AuthManager.instance.signIn(provider = AuthProvider.APPLE)

Log.d("Auth", "Apple ID: ${result.userId}")
Log.d("Auth", "Email: ${result.email}")
Log.d("Auth", "Wallet: ${result.address}")
```

### Social Login UI (Compose)

```kotlin
import io.cinacoin.appkit.ui.CinacoinSocialButton

@Composable
fun LoginScreen() {
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier.padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Sign In", style = MaterialTheme.typography.headlineMedium)

        CinacoinSocialButton(
            provider = AuthProvider.GOOGLE,
            onClick = { handleLogin(AuthProvider.GOOGLE) }
        )

        CinacoinSocialButton(
            provider = AuthProvider.APPLE,
            onClick = { handleLogin(AuthProvider.APPLE) }
        )

        CinacoinSocialButton(
            provider = AuthProvider.DISCORD,
            onClick = { handleLogin(AuthProvider.DISCORD) }
        )

        CinacoinSocialButton(
            provider = AuthProvider.GITHUB,
            onClick = { handleLogin(AuthProvider.GITHUB) }
        )

        error?.let {
            Text(it, color = Color.Red, style = MaterialTheme.typography.bodySmall)
        }
    }
}

fun handleLogin(provider: AuthProvider) {
    scope.launch {
        isLoading = true
        error = null
        try {
            val result = AuthManager.instance.signIn(provider = provider)
            Log.d("Auth", "Logged in: ${result.address}")
        } catch (e: Exception) {
            error = e.message
        }
        isLoading = false
    }
}
```

## Email Login

### Basic Email Authentication

```kotlin
import io.cinacoin.appkit.auth.AuthManager

// Step 1: Send OTP to email
AuthManager.instance.sendEmailOTP(email = "user@example.com")

// Step 2: Verify OTP and authenticate
val result = AuthManager.instance.verifyEmailOTP(
    email = "user@example.com",
    otp = "123456"
)

Log.d("Auth", "Authenticated: ${result.address}")
```

### Email Login UI (Compose)

```kotlin
@Composable
fun EmailLoginScreen() {
    var email by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var step by remember { mutableStateOf(LoginStep.EMAIL) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier.padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        when (step) {
            LoginStep.EMAIL -> {
                Text("Sign in with Email", style = MaterialTheme.typography.headlineMedium)

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email address") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        isLoading = true
                        // Send OTP logic
                    },
                    enabled = email.isNotEmpty() && !isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isLoading) CircularProgressIndicator() else Text("Continue")
                }
            }

            LoginStep.VERIFY -> {
                Text("Enter verification code", style = MaterialTheme.typography.headlineMedium)
                Text("Sent to $email", style = MaterialTheme.typography.bodySmall)

                OutlinedTextField(
                    value = otp,
                    onValueChange = { otp = it },
                    label = { Text("6-digit code") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = { /* Verify OTP logic */ },
                    enabled = otp.length == 6 && !isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isLoading) CircularProgressIndicator() else Text("Verify")
                }

                TextButton(onClick = { /* Resend OTP */ }) {
                    Text("Resend code")
                }
            }
        }

        error?.let {
            Text(it, color = Color.Red, style = MaterialTheme.typography.bodySmall)
        }
    }
}

enum class LoginStep { EMAIL, VERIFY }
```

## Token Management

### Get Current Session

```kotlin
if (AuthManager.instance.isAuthenticated) {
    val session = AuthManager.instance.currentSession
    Log.d("Auth", "User: ${session?.email}")
    Log.d("Auth", "Address: ${session?.address}")
    Log.d("Auth", "Expires: ${session?.expiresAt}")
}
```

### Access Tokens

```kotlin
// Get the current access token
val token = AuthManager.instance.getAccessToken()

// Get a fresh token (refreshes if expired)
val freshToken = AuthManager.instance.getFreshAccessToken()

// Use token for API calls
val request = Request.Builder()
    .url("https://api.example.com/data")
    .addHeader("Authorization", "Bearer $token")
    .build()
```

### Refresh Tokens

```kotlin
// Manually refresh the session
AuthManager.instance.refreshSession()

// Check token expiry
AuthManager.instance.currentSession?.let { session ->
    if (session.isExpiringSoon(withinMs = 300_000)) { // 5 minutes
        AuthManager.instance.refreshSession()
    }
}
```

### Listen for Auth State Changes

```kotlin
viewModelScope.launch {
    AuthManager.instance.authState.collect { state ->
        when (state) {
            is AuthState.SignedIn -> Log.d("Auth", "Signed in: ${state.session.address}")
            is AuthState.SignedOut -> Log.d("Auth", "Signed out")
            is AuthState.SessionRefreshed -> Log.d("Auth", "Session refreshed")
            is AuthState.SessionExpired -> Log.d("Auth", "Session expired")
        }
    }
}
```

### Sign Out

```kotlin
// Sign out current session
AuthManager.instance.signOut()

// Sign out from all devices
AuthManager.instance.signOut(fromAllDevices = true)
```

## Custom Auth Provider

```kotlin
import io.cinacoin.appkit.auth.AuthProviderProtocol

class CustomAuthProvider : AuthProviderProtocol {
    override val providerId = "custom"

    override suspend fun authenticate(): AuthResult {
        val token = myCustomLoginFlow()
        return AuthResult(
            userId = token.userId,
            email = token.email,
            address = token.walletAddress,
            idToken = token.accessToken,
            provider = providerId
        )
    }

    override suspend fun refresh(): AuthResult {
        val newToken = myCustomRefreshFlow()
        return AuthResult(
            userId = newToken.userId,
            email = newToken.email,
            address = newToken.walletAddress,
            idToken = newToken.accessToken,
            provider = providerId
        )
    }
}

// Register
AuthManager.instance.registerProvider(CustomAuthProvider())
```

## Error Handling

```kotlin
try {
    val result = AuthManager.instance.signIn(provider = AuthProvider.GOOGLE)
} catch (e: AuthException.ProviderCancelled) {
    // User cancelled OAuth flow
} catch (e: AuthException.InvalidCredentials) {
    // Invalid email or OTP
} catch (e: AuthException.SessionExpired) {
    // Session expired
} catch (e: AuthException.NetworkError) {
    // Network issue
} catch (e: AuthException.ProviderNotConfigured) {
    // Provider not enabled in config
} catch (e: Exception) {
    // Unexpected error
}
```

<!-- TODO: Add screenshot of social login UI -->
