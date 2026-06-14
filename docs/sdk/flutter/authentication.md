# Flutter SDK — Authentication

## Overview

AppKit provides built-in authentication through social login providers and email. Users can authenticate and get a connected wallet without installing any wallet app.

## Configure AuthManager

```dart
import 'package:cinacoin_appkit_auth/cinacoin_appkit_auth.dart';

final authConfig = AuthConfig(
  projectId: 'YOUR_PROJECT_ID',
  supportedProviders: [
    AuthProvider.google,
    AuthProvider.github,
    AuthProvider.discord,
    AuthProvider.apple,
    AuthProvider.email,
  ],
  redirectUrl: 'myapp://auth/callback',
);

CinacoinAppKit.configureAuth(authConfig);
```

### Auth Configuration Options

| Parameter                 | Type                 | Description                         |
| ------------------------- | -------------------- | ----------------------------------- |
| `projectId`               | `String`             | Your Cinacoin Cloud project ID      |
| `supportedProviders`      | `List<AuthProvider>` | Enabled login providers             |
| `redirectUrl`             | `String`             | URL scheme for OAuth callbacks      |
| `sessionDuration`         | `Duration`           | Session expiry (default: 7 days)    |
| `enablePersistentSession` | `bool`               | Persist session across app launches |

## Social Login

### Google

```dart
final result = await AuthManager.instance.signIn(provider: AuthProvider.google);

print('User ID: ${result.userId}');
print('Email: ${result.email}');
print('Wallet: ${result.address}');
print('Token: ${result.idToken}');
```

### GitHub

```dart
final result = await AuthManager.instance.signIn(provider: AuthProvider.github);

print('Username: ${result.username}');
print('Email: ${result.email}');
print('Wallet: ${result.address}');
```

### Discord

```dart
final result = await AuthManager.instance.signIn(provider: AuthProvider.discord);

print('Username: ${result.username}');
print('Discord ID: ${result.userId}');
print('Wallet: ${result.address}');
```

### Apple

```dart
final result = await AuthManager.instance.signIn(provider: AuthProvider.apple);

print('Apple ID: ${result.userId}');
print('Email: ${result.email}');
print('Wallet: ${result.address}');
```

### Social Login UI

```dart
import 'package:cinacoin_appkit_ui/cinacoin_appkit_ui.dart';

class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;
  String? _error;

  Future<void> _handleLogin(AuthProvider provider) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await AuthManager.instance.signIn(provider: provider);
      print('Logged in: ${result.address}');
    } catch (e) {
      setState(() => _error = e.toString());
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Sign In', style: Theme.of(context).textTheme.headlineMedium),
          SizedBox(height: 24),

          CinacoinSocialButton(
            provider: AuthProvider.google,
            isLoading: _isLoading,
            onPressed: () => _handleLogin(AuthProvider.google),
          ),
          SizedBox(height: 12),

          CinacoinSocialButton(
            provider: AuthProvider.apple,
            isLoading: _isLoading,
            onPressed: () => _handleLogin(AuthProvider.apple),
          ),
          SizedBox(height: 12),

          CinacoinSocialButton(
            provider: AuthProvider.discord,
            isLoading: _isLoading,
            onPressed: () => _handleLogin(AuthProvider.discord),
          ),
          SizedBox(height: 12),

          CinacoinSocialButton(
            provider: AuthProvider.github,
            isLoading: _isLoading,
            onPressed: () => _handleLogin(AuthProvider.github),
          ),

          if (_error != null) ...[
            SizedBox(height: 16),
            Text(_error!, style: TextStyle(color: Colors.red, fontSize: 12)),
          ],
        ],
      ),
    );
  }
}
```

## Email Login

### Basic Email Authentication

```dart
// Step 1: Send OTP to email
await AuthManager.instance.sendEmailOTP(email: 'user@example.com');

// Step 2: Verify OTP and authenticate
final result = await AuthManager.instance.verifyEmailOTP(
  email: 'user@example.com',
  otp: '123456',
);

print('Authenticated: ${result.address}');
```

### Email Login UI

```dart
class EmailLoginScreen extends StatefulWidget {
  @override
  State<EmailLoginScreen> createState() => _EmailLoginScreenState();
}

class _EmailLoginScreenState extends State<EmailLoginScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  bool _isEmailStep = true;
  bool _isLoading = false;
  String? _error;

  Future<void> _sendOTP() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await AuthManager.instance.sendEmailOTP(
        email: _emailController.text,
      );
      setState(() => _isEmailStep = false);
    } catch (e) {
      setState(() => _error = e.toString());
    }

    setState(() => _isLoading = false);
  }

  Future<void> _verifyOTP() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await AuthManager.instance.verifyEmailOTP(
        email: _emailController.text,
        otp: _otpController.text,
      );
      print('Authenticated: ${result.address}');
    } catch (e) {
      setState(() => _error = e.toString());
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_isEmailStep) ...[
            Text('Sign in with Email', style: Theme.of(context).textTheme.headlineMedium),
            SizedBox(height: 16),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'Email address',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _sendOTP,
              child: _isLoading
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator())
                  : Text('Continue'),
            ),
          ] else ...[
            Text('Enter verification code', style: Theme.of(context).textTheme.headlineMedium),
            SizedBox(height: 8),
            Text('Sent to ${_emailController.text}', style: TextStyle(color: Colors.grey)),
            SizedBox(height: 16),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 6,
              decoration: InputDecoration(
                labelText: '6-digit code',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _verifyOTP,
              child: _isLoading
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator())
                  : Text('Verify'),
            ),
            TextButton(
              onPressed: _sendOTP,
              child: Text('Resend code'),
            ),
          ],

          if (_error != null) ...[
            SizedBox(height: 16),
            Text(_error!, style: TextStyle(color: Colors.red, fontSize: 12)),
          ],
        ],
      ),
    );
  }
}
```

## Token Management

### Get Current Session

```dart
if (AuthManager.instance.isAuthenticated) {
  final session = AuthManager.instance.currentSession;
  print('User: ${session?.email}');
  print('Address: ${session?.address}');
  print('Expires: ${session?.expiresAt}');
}
```

### Access Tokens

```dart
// Get the current access token
final token = await AuthManager.instance.getAccessToken();

// Get a fresh token (refreshes if expired)
final freshToken = await AuthManager.instance.getFreshAccessToken();

// Use token for API calls
final response = await http.get(
  Uri.parse('https://api.example.com/data'),
  headers: {'Authorization': 'Bearer $token'},
);
```

### Refresh Tokens

```dart
// Manually refresh the session
await AuthManager.instance.refreshSession();

// Check token expiry
final session = AuthManager.instance.currentSession;
if (session != null && session.isExpiringSoon(within: Duration(minutes: 5))) {
  await AuthManager.instance.refreshSession();
}
```

### Listen for Auth State Changes

```dart
AuthManager.instance.onAuthStateChange = (state) {
  switch (state) {
    case AuthStateSignedIn(:final session):
      print('Signed in: ${session.address}');
      break;
    case AuthStateSignedOut():
      print('Signed out');
      break;
    case AuthStateSessionRefreshed(:final session):
      print('Session refreshed: ${session.address}');
      break;
    case AuthStateSessionExpired():
      print('Session expired');
      break;
  }
};
```

### Sign Out

```dart
// Sign out current session
await AuthManager.instance.signOut();

// Sign out from all devices
await AuthManager.instance.signOut(fromAllDevices: true);
```

## Custom Auth Provider

```dart
class CustomAuthProvider implements AuthProviderProtocol {
  @override
  String get providerId => 'custom';

  @override
  Future<AuthResult> authenticate() async {
    final token = await myCustomLoginFlow();
    return AuthResult(
      userId: token.userId,
      email: token.email,
      address: token.walletAddress,
      idToken: token.accessToken,
      provider: providerId,
    );
  }

  @override
  Future<AuthResult> refresh() async {
    final newToken = await myCustomRefreshFlow();
    return AuthResult(
      userId: newToken.userId,
      email: newToken.email,
      address: newToken.walletAddress,
      idToken: newToken.accessToken,
      provider: providerId,
    );
  }
}

// Register
AuthManager.instance.registerProvider(CustomAuthProvider());
```

## Error Handling

```dart
try {
  final result = await AuthManager.instance.signIn(provider: AuthProvider.google);
} on AuthException catch (e) {
  if (e is ProviderCancelledException) {
    // User cancelled OAuth flow
  } else if (e is InvalidCredentialsException) {
    // Invalid email or OTP
  } else if (e is SessionExpiredException) {
    // Session expired
  } else if (e is NetworkException) {
    // Network issue
  } else if (e is ProviderNotConfiguredException) {
    // Provider not enabled in config
  } else {
    // Unexpected error
  }
}
```

<!-- TODO: Add screenshot of social login UI -->
