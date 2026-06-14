# Auth Service API Client Specification

This document defines the shared API contract for authentication across all platforms (iOS, Android, Flutter).

## Overview

All platforms must implement the following API endpoints to interact with the Cinacoin Auth Service. The API follows RESTful conventions and uses JSON for request/response bodies.

**Base URL:** `https://auth.cinacoin.com` (configurable per project)

## Endpoints

### 1. OAuth Callback - Exchange Authorization Code for Tokens

**Purpose:** Exchange an OAuth authorization code for JWT tokens after social login.

**Endpoint:** `POST /api/auth/oauth/callback`

**Request Body:**

```json
{
  "code": "authorization_code_from_oauth_provider",
  "provider": "google|github|discord|apple",
  "project_id": "your_project_id"
}
```

**Response (200 OK):**

```json
{
  "user_id": "user_123456",
  "email": "user@example.com",
  "provider": "google",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_xyz789",
  "expires_at": 1735689600
}
```

**Response Fields:**

- `user_id` (string, required): Unique user identifier
- `email` (string, optional): User's email address
- `provider` (string, optional): Auth provider used (google, github, discord, apple, email)
- `access_token` (string, required): JWT access token for API authentication
- `refresh_token` (string, optional): Token for refreshing access tokens
- `expires_at` (integer, required): Unix timestamp (seconds) when access_token expires

**Error Responses:**

- `400 Bad Request`: Invalid or missing parameters
- `401 Unauthorized`: Invalid authorization code
- `500 Internal Server Error`: Server error

---

### 2. Token Refresh

**Purpose:** Refresh an expired or soon-to-expire access token using a refresh token.

**Endpoint:** `POST /api/auth/oauth/refresh`

**Request Body:**

```json
{
  "refresh_token": "refresh_token_xyz789",
  "project_id": "your_project_id"
}
```

**Response (200 OK):**

```json
{
  "user_id": "user_123456",
  "email": "user@example.com",
  "access_token": "new_access_token_abc123",
  "refresh_token": "new_refresh_token_def456",
  "expires_at": 1735776000
}
```

**Response Fields:**
Same as OAuth Callback response.

**Refresh Token Rotation:**
The server may return a new `refresh_token` in the response. Clients MUST:

1. Check if `refresh_token` is present in the response
2. If present, replace the stored refresh token with the new one
3. If absent, continue using the existing refresh token

**Error Responses:**

- `400 Bad Request`: Invalid or missing refresh_token
- `401 Unauthorized`: Invalid or expired refresh token
- `500 Internal Server Error`: Server error

---

### 3. Email Registration

**Purpose:** Register a new user with email and password.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure_password_123",
  "project_id": "your_project_id"
}
```

**Response (200 OK):**
Same as OAuth Callback response.

**Error Responses:**

- `400 Bad Request`: Invalid email format, weak password, or missing fields
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Server error

---

### 4. Email Login

**Purpose:** Authenticate an existing user with email and password.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "secure_password_123",
  "project_id": "your_project_id"
}
```

**Response (200 OK):**
Same as OAuth Callback response.

**Error Responses:**

- `401 Unauthorized`: Invalid email or password
- `500 Internal Server Error`: Server error

---

### 5. Password Reset Request

**Purpose:** Request a password reset email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**

```json
{
  "email": "user@example.com",
  "project_id": "your_project_id"
}
```

**Response (200 OK):**

```json
{
  "message": "Password reset email sent"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid email format
- `404 Not Found`: Email not registered
- `500 Internal Server Error`: Server error

---

### 6. Email Verification

**Purpose:** Send email verification link.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**

```json
{
  "email": "user@example.com",
  "project_id": "your_project_id"
}
```

**Response (200 OK):**

```json
{
  "message": "Verification email sent"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Server error

---

## OAuth Flow Implementation

### Callback URL Scheme

All platforms must register a custom URL scheme to receive OAuth callbacks:

**Scheme:** `cinacoin` (configurable)

**Callback URL Pattern:**

```
cinacoin://auth/{provider}/callback?code={authorization_code}
```

**Example:**

```
cinacoin://auth/google/callback?code=4/0Ade1234567890abcdef
```

### Platform-Specific Implementation

#### iOS (ASWebAuthenticationSession)

1. Use `ASWebAuthenticationSession` to open OAuth URL
2. Set `callbackURLScheme` to your custom scheme (e.g., "cinacoin")
3. Parse the callback URL to extract the `code` parameter
4. Call `/api/auth/oauth/callback` with the code
5. Store tokens in Keychain with `kSecAttrAccessibleAfterFirstUnlock`

#### Android (Custom Tabs)

1. Use Chrome Custom Tabs to open OAuth URL
2. Register intent filter for your custom scheme in AndroidManifest.xml
3. Parse the callback Intent URI to extract the `code` parameter
4. Call `/api/auth/oauth/callback` with the code
5. Store tokens in EncryptedSharedPreferences

#### Flutter (url_launcher + app_links)

1. Use `url_launcher` to open OAuth URL in external browser
2. Use `app_links` package to listen for callback deep links
3. Parse the callback URI to extract the `code` parameter
4. Call `/api/auth/oauth/callback` with the code
5. Store tokens using `flutter_secure_storage`

---

## Token Storage Requirements

### Security Requirements

All platforms MUST store tokens securely:

**iOS:**

- Use Keychain Services
- Set `kSecAttrAccessibleAfterFirstUnlock` for background access
- Store: access_token, refresh_token, user_id, expires_at

**Android:**

- Use EncryptedSharedPreferences (AndroidX Security library)
- Fallback to regular SharedPreferences if encryption unavailable
- Store: access_token, refresh_token, user_id, expires_at

**Flutter:**

- Use `flutter_secure_storage` package
- Store: access_token, refresh_token, user_id, expires_at

### Token Expiration Handling

**Auto-Refresh Strategy:**

- Monitor token expiration time
- Trigger refresh 5 minutes (300 seconds) before expiry
- If refresh fails, retry after 60 seconds
- If refresh token is also expired, force user to re-authenticate

**Manual Refresh:**

- Provide `refreshToken()` method in AuthManager
- Provide `ensureValidToken()` method that auto-refreshes if needed

---

## Error Handling

### Network Errors

All platforms should handle:

- Connection timeouts
- DNS resolution failures
- SSL/TLS errors
- Server errors (5xx)

### Authentication Errors

Common error scenarios:

- Invalid authorization code (401)
- Expired refresh token (401)
- Invalid credentials (401)
- Missing required fields (400)

### Error Response Format

```json
{
  "error": "error_code",
  "error_description": "Human-readable error message"
}
```

---

## Implementation Checklist

### iOS (Swift)

- [x] ASWebAuthenticationSession callback handling
- [x] Parse authorization code from callback URL
- [x] Exchange code for tokens via POST /api/auth/oauth/callback
- [x] Store tokens in Keychain
- [x] Implement refreshToken() method
- [x] Auto-refresh timer (5 minutes before expiry)
- [x] Handle refresh token rotation
- [x] Restore session from Keychain on app launch

### Android (Kotlin)

- [x] Custom Tabs callback handling
- [x] Parse authorization code from Intent URI
- [x] Exchange code for tokens via POST /api/auth/oauth/callback
- [x] Store tokens in EncryptedSharedPreferences
- [x] Implement refreshToken() suspend function
- [x] Auto-refresh coroutine (5 minutes before expiry)
- [x] Handle refresh token rotation
- [x] Restore session from storage on app launch

### Flutter (Dart)

- [x] url_launcher + app_links callback handling
- [x] Parse authorization code from deep link URI
- [x] Exchange code for tokens via POST /api/auth/oauth/callback
- [x] Store tokens in flutter_secure_storage
- [x] Implement refreshToken() method
- [x] Auto-refresh Timer (5 minutes before expiry)
- [x] Handle refresh token rotation
- [x] Restore session from storage on app launch

---

## Testing

### Unit Tests

- Test token parsing from JSON responses
- Test error handling for all error codes
- Test refresh token rotation logic
- Test expiration time calculations

### Integration Tests

- Test full OAuth flow with mock auth server
- Test token refresh flow
- Test session restoration
- Test auto-refresh scheduling

### Manual Testing

- Test each social provider (Google, GitHub, Discord)
- Test email registration and login
- Test password reset flow
- Test token expiration and refresh
- Test app restart and session restoration

---

## Security Considerations

1. **Never log tokens** - Avoid printing access tokens or refresh tokens to console/logs
2. **Use HTTPS only** - All API calls must use HTTPS
3. **Validate certificates** - Enable SSL certificate validation
4. **Secure storage** - Always use platform-specific secure storage
5. **Token rotation** - Always handle refresh token rotation
6. **Short-lived tokens** - Access tokens should expire within 1 hour
7. **Refresh token storage** - Refresh tokens must be stored securely and never transmitted except to auth server

---

## Version History

- **v1.0** (2026-06-14): Initial specification
  - OAuth callback endpoint
  - Token refresh endpoint
  - Email auth endpoints
  - Platform-specific implementation guidelines
