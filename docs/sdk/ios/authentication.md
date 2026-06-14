# iOS SDK — Authentication

## Overview

AppKit provides built-in authentication through social login providers and email. Users can authenticate and get a connected wallet without installing any wallet app.

## Configure AuthManager

```swift
import CinacoinAppKitCore
import CinacoinAppKitAuth

// Configure auth providers
let authConfig = AuthConfig(
    projectId: "YOUR_PROJECT_ID",
    supportedProviders: [.google, .github, .discord, .apple, .email],
    redirectUrl: "myapp://auth/callback"
)

CinacoinAppKit.configureAuth(with: authConfig)
```

### Auth Configuration Options

| Parameter                 | Type             | Description                         |
| ------------------------- | ---------------- | ----------------------------------- |
| `projectId`               | `String`         | Your Cinacoin Cloud project ID      |
| `supportedProviders`      | `[AuthProvider]` | Enabled login providers             |
| `redirectUrl`             | `String`         | URL scheme for OAuth callbacks      |
| `sessionDuration`         | `TimeInterval`   | Session expiry (default: 7 days)    |
| `enablePersistentSession` | `Bool`           | Persist session across app launches |

## Social Login

### Google

```swift
import CinacoinAppKitAuth

// Present Google login
let result = try await AuthManager.shared.signIn(provider: .google)

print("User ID: \(result.userId)")
print("Email: \(result.email)")
print("Wallet Address: \(result.address)")
print("ID Token: \(result.idToken)")
```

### GitHub

```swift
let result = try await AuthManager.shared.signIn(provider: .github)

print("Username: \(result.username)")
print("Email: \(result.email)")
print("Wallet Address: \(result.address)")
```

### Discord

```swift
let result = try await AuthManager.shared.signIn(provider: .discord)

print("Username: \(result.username)")
print("Discord ID: \(result.userId)")
print("Wallet Address: \(result.address)")
```

### Apple

```swift
let result = try await AuthManager.shared.signIn(provider: .apple)

print("Apple ID: \(result.userId)")
print("Email: \(result.email)")  // May be nil if user chose to hide
print("Wallet Address: \(result.address)")
```

### Social Login UI

Use the built-in social login buttons:

```swift
import CinacoinAppKitUI

struct LoginView: View {
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 16) {
            CinacoinSocialButton(provider: .google) {
                await handleLogin(.google)
            }

            CinacoinSocialButton(provider: .apple) {
                await handleLogin(.apple)
            }

            CinacoinSocialButton(provider: .discord) {
                await handleLogin(.discord)
            }

            CinacoinSocialButton(provider: .github) {
                await handleLogin(.github)
            }

            if let error = error {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
        }
        .padding()
    }

    func handleLogin(_ provider: AuthProvider) async {
        isLoading = true
        error = nil

        do {
            let result = try await AuthManager.shared.signIn(provider: provider)
            print("Logged in: \(result.address)")
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}
```

## Email Login

### Basic Email Authentication

```swift
import CinacoinAppKitAuth

// Step 1: Send OTP to email
try await AuthManager.shared.sendEmailOTP(email: "user@example.com")

// Step 2: Verify OTP and authenticate
let result = try await AuthManager.shared.verifyEmailOTP(
    email: "user@example.com",
    otp: "123456"
)

print("Authenticated: \(result.address)")
```

### Email Login UI

```swift
import CinacoinAppKitUI

struct EmailLoginView: View {
    @State private var email = ""
    @State private var otp = ""
    @State private var step: LoginStep = .email
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 20) {
            switch step {
            case .email:
                emailStep
            case .verify:
                verifyStep
            }
        }
        .padding()
        .animation(.easeInOut, value: step)
    }

    var emailStep: some View {
        VStack(spacing: 16) {
            Text("Sign in with Email")
                .font(.title2.bold())

            TextField("Email address", text: $email)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .textFieldStyle(.roundedBorder)

            Button(action: sendOTP) {
                if isLoading {
                    ProgressView()
                } else {
                    Text("Continue")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(email.isEmpty || isLoading)

            if let error = error {
                Text(error).foregroundColor(.red).font(.caption)
            }
        }
    }

    var verifyStep: some View {
        VStack(spacing: 16) {
            Text("Enter verification code")
                .font(.title2.bold())

            Text("Sent to \(email)")
                .font(.subheadline)
                .foregroundColor(.secondary)

            TextField("6-digit code", text: $otp)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)
                .multilineTextAlignment(.center)

            Button(action: verifyOTP) {
                if isLoading {
                    ProgressView()
                } else {
                    Text("Verify")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(otp.count != 6 || isLoading)

            Button("Resend code") {
                Task { await sendOTP() }
            }
            .font(.caption)
        }
    }

    func sendOTP() async {
        isLoading = true
        error = nil
        do {
            try await AuthManager.shared.sendEmailOTP(email: email)
            step = .verify
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func verifyOTP() async {
        isLoading = true
        error = nil
        do {
            let result = try await AuthManager.shared.verifyEmailOTP(
                email: email, otp: otp
            )
            print("Authenticated: \(result.address)")
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

enum LoginStep {
    case email
    case verify
}
```

## Token Management

### Get Current Session

```swift
import CinacoinAppKitAuth

// Check if user is authenticated
if AuthManager.shared.isAuthenticated {
    let session = AuthManager.shared.currentSession
    print("User: \(session?.email ?? "unknown")")
    print("Address: \(session?.address ?? "unknown")")
    print("Expires: \(session?.expiresAt ?? "unknown")")
}
```

### Access Tokens

```swift
// Get the current access token
let token = try await AuthManager.shared.getAccessToken()

// Get a fresh token (refreshes if expired)
let freshToken = try await AuthManager.shared.getFreshAccessToken()

// Use token for API calls
var request = URLRequest(url: URL(string: "https://api.example.com/data")!)
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
```

### Refresh Tokens

```swift
// Manually refresh the session
try await AuthManager.shared.refreshSession()

// Check token expiry
if let session = AuthManager.shared.currentSession {
    if session.isExpiringSoon(within: 300) { // 5 minutes
        try await AuthManager.shared.refreshSession()
    }
}
```

### Listen for Auth State Changes

```swift
AuthManager.shared.onAuthStateChange = { state in
    switch state {
    case .signedIn(let session):
        print("Signed in: \(session.address)")
    case .signedOut:
        print("Signed out")
    case .sessionRefreshed(let session):
        print("Session refreshed: \(session.address)")
    case .sessionExpired:
        print("Session expired - user needs to re-authenticate")
    }
}
```

### Sign Out

```swift
// Sign out current session
try await AuthManager.shared.signOut()

// Sign out from all devices
try await AuthManager.shared.signOut(fromAllDevices: true)
```

## Custom Auth Provider

Implement your own authentication provider:

```swift
import CinacoinAppKitAuth

class CustomAuthProvider: AuthProviderProtocol {
    let providerId = "custom"

    func authenticate() async throws -> AuthResult {
        // Your custom auth logic
        let token = try await myCustomLoginFlow()

        return AuthResult(
            userId: token.userId,
            email: token.email,
            address: token.walletAddress,
            idToken: token.accessToken,
            provider: providerId
        )
    }

    func refresh() async throws -> AuthResult {
        // Refresh logic
        let newToken = try await myCustomRefreshFlow()

        return AuthResult(
            userId: newToken.userId,
            email: newToken.email,
            address: newToken.walletAddress,
            idToken: newToken.accessToken,
            provider: providerId
        )
    }
}

// Register custom provider
AuthManager.shared.register(provider: CustomAuthProvider())
```

## Error Handling

```swift
do {
    let result = try await AuthManager.shared.signIn(provider: .google)
} catch AuthError.providerCancelled {
    // User cancelled the OAuth flow
} catch AuthError.invalidCredentials {
    // Invalid email or OTP
} catch AuthError.sessionExpired {
    // Session expired, needs re-auth
} catch AuthError.networkError(let underlying) {
    // Network issue
} catch AuthError.providerNotConfigured(let provider) {
    // Provider not enabled in config
} catch {
    // Unexpected error
}
```

<!-- TODO: Add screenshot of social login UI -->
