# One-Click Auth Documentation

## Overview

One-Click Auth is a streamlined authentication flow that combines wallet connection, SIWE (Sign-In with Ethereum) signature, and session creation into a single user action. Instead of the traditional 3-4 step process, users authenticate with just one click.

### Traditional Flow (3-4 steps)
1. User clicks "Connect Wallet"
2. Wallet connection modal appears
3. User selects wallet and approves connection
4. User clicks "Sign In"
5. SIWE message appears in wallet
6. User signs the message
7. Backend verifies and creates session

### One-Click Auth Flow (1 step)
1. User clicks "Sign in with Wallet"
2. Wallet signature request appears (pre-filled SIWE message)
3. User signs → authentication complete

## Architecture

### Backend Components

**Location:** `workers/auth-service/src/one-click-auth/`

#### Files
- `one-click-auth.ts` - Main route handlers
- `types.ts` - TypeScript type definitions
- `index.ts` - Module exports

#### API Endpoints

##### POST /auth/one-click/init

Initialize the authentication flow by generating a pre-filled SIWE message.

**Request:**
```typescript
{
  address: string;      // Ethereum address (0x-prefixed)
  domain: string;       // Domain requesting auth (e.g., 'https://myapp.com')
  chainId?: number;     // EIP-155 chain ID (default: 1)
  statement?: string;   // Optional human-readable statement
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: string;          // Pre-filled SIWE message
    nonce: string;            // Unique nonce for replay protection
    issuedAt: string;         // ISO timestamp
    expirationTime: string;   // ISO timestamp (5 min from issuedAt)
    domain: string;           // Domain bound to message
    chainId: number;          // Chain ID bound to message
  }
}
```

**Security Features:**
- Nonce stored in KV with 5-minute TTL
- Domain binding prevents cross-site attacks
- Address validation (0x + 40 hex chars)

##### POST /auth/one-click/complete

Complete authentication by verifying the signature and creating a session.

**Request:**
```typescript
{
  address: string;      // Ethereum address that signed
  message: string;      // Exact SIWE message that was signed
  signature: string;    // Hex-encoded signature from wallet
  nonce: string;        // Nonce from init response
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    accessToken: string;    // JWT access token
    refreshToken: string;   // JWT refresh token
    expiresIn: number;      // Access token expiry (seconds)
    tokenType: 'Bearer';
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string | null;
      role: string;
      status: string;
      emailVerified: boolean;
      lastLoginAt: string | null;
      createdAt: string;
    };
    address: string;        // Wallet address
    chainId: number;        // Chain ID used
  }
}
```

**Security Features:**
- Nonce validation (must exist in KV)
- Expiration check (5-minute window)
- Address matching (nonce address must match request)
- Signature verification (ecrecover)
- Nonce deletion after use (replay protection)
- Rate limiting (5 requests per 15 minutes)
- Audit logging

### Frontend Components

**Location:** `packages/core-sdk/src/auth/`

#### Files
- `OneClickAuth.tsx` - React component and hook
- `types.ts` - TypeScript type definitions

#### OneClickAuthButton Component

A ready-to-use React button component that handles the entire authentication flow.

**Props:**
```typescript
interface OneClickAuthButtonProps {
  connector: Connector;                    // Wallet connector instance
  config: OneClickAuthConfig;              // Auth configuration
  onSuccess?: (result) => void;            // Success callback
  onError?: (error: Error) => void;        // Error callback
  onStart?: () => void;                    // Start callback
  buttonText?: string;                     // Custom button text
  loadingText?: string;                    // Custom loading text
  successText?: string;                    // Custom success text
  errorText?: string;                      // Custom error text
  disabled?: boolean;                      // Disable button
  className?: string;                      // Custom CSS class
  style?: React.CSSProperties;             // Custom styles
}
```

**Example:**
```tsx
import { OneClickAuthButton } from '@cinacoin/core-sdk/components';
import { InjectedProvider } from '@cinacoin/core-sdk';

function LoginPage() {
  const connector = new InjectedProvider();
  
  const handleSuccess = (result) => {
    // Store tokens securely (httpOnly cookies recommended)
    document.cookie = `accessToken=${result.data.accessToken}; HttpOnly; Secure; SameSite=Strict`;
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  const handleError = (error) => {
    console.error('Authentication failed:', error);
    alert('Failed to authenticate. Please try again.');
  };

  return (
    <div className="login-container">
      <h1>Welcome to CINAcoin</h1>
      <OneClickAuthButton
        connector={connector}
        config={{
          authUrl: 'https://auth.cinacoin.com',
          domain: 'https://myapp.com',
          chainId: 1,
          statement: 'Sign in to MyApp',
        }}
        onSuccess={handleSuccess}
        onError={handleError}
        buttonText="Sign in with Wallet"
      />
    </div>
  );
}
```

#### useOneClickAuth Hook

A React hook for programmatic control over the authentication flow.

**Example:**
```tsx
import { useOneClickAuth } from '@cinacoin/core-sdk/components';

function CustomLoginButton() {
  const { authenticate, isLoading, error } = useOneClickAuth({
    connector: new InjectedProvider(),
    config: {
      authUrl: 'https://auth.cinacoin.com',
      domain: 'https://myapp.com',
    },
  });

  const handleLogin = async () => {
    const result = await authenticate();
    if (result) {
      console.log('Authenticated:', result.data.user);
      // Handle success
    }
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Authenticating...' : 'Login'}
      {error && <span>Error: {error.message}</span>}
    </button>
  );
}
```

## Security Mechanisms

### 1. Nonce-based Replay Protection

Each authentication attempt generates a unique cryptographic nonce:
- Generated using `crypto.getRandomValues()` (16 bytes = 128 bits)
- Stored in KV with 5-minute TTL
- Deleted after successful authentication
- Prevents replay attacks (nonce can only be used once)

### 2. Message Expiration

SIWE messages have a strict expiration time:
- Default: 5 minutes from issuance
- Configurable via `expirationSeconds` parameter
- Backend validates expiration before processing
- Prevents stale message attacks

### 3. Domain Binding

Each SIWE message is bound to a specific domain:
- Domain included in SIWE message
- Backend validates domain matches request
- Prevents cross-site request forgery (CSRF)
- Prevents phishing attacks

### 4. Address Validation

Ethereum addresses are validated at multiple points:
- Format validation (0x + 40 hex chars)
- Case-insensitive comparison (normalized to lowercase)
- Address in request must match nonce address
- Prevents address substitution attacks

### 5. Signature Verification

Wallet signatures are cryptographically verified:
- Uses ecrecover to recover signer address
- Recovered address must match claimed address
- Prevents signature forgery
- Note: Production implementation should use ethers.js or viem

### 6. Rate Limiting

API endpoints are rate-limited to prevent abuse:
- `/auth/one-click/init`: 100 requests per minute (per IP)
- `/auth/one-click/complete`: 5 requests per 15 minutes (per IP)
- Uses sliding window algorithm
- Returns 429 status with Retry-After header

### 7. Audit Logging

All authentication events are logged:
- Event type: `one_click_auth`
- User ID, IP address, user agent
- Wallet address and chain ID
- Success/failure status
- Timestamp

## Database Schema

One-Click Auth uses existing tables:

### web3_wallets
Links wallet addresses to user accounts:
```sql
CREATE TABLE web3_wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  chain_id INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  nonce TEXT NOT NULL,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(address, chain)
);
```

### web3_nonces
Tracks nonces for replay protection:
```sql
CREATE TABLE web3_nonces (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  domain TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
```

### auth_audit_log
Records authentication events:
```sql
CREATE TABLE auth_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  success INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
```

## Configuration

### Backend Configuration

Add to `.env`:
```env
# One-Click Auth
ONE_CLICK_AUTH_ENABLED=true
ONE_CLICK_AUTH_NONCE_TTL=300  # 5 minutes in seconds
ONE_CLICK_AUTH_RATE_LIMIT=5   # requests per 15 minutes
```

### Frontend Configuration

```typescript
const config: OneClickAuthConfig = {
  authUrl: 'https://auth.cinacoin.com',  // Auth service URL
  domain: 'https://myapp.com',            // Your app domain
  chainId: 1,                              // Ethereum mainnet
  statement: 'Sign in to MyApp',          // Custom message
  expirationSeconds: 300,                  // 5 minutes
};
```

## Integration Examples

### Next.js App Router

```tsx
// app/login/page.tsx
'use client';

import { OneClickAuthButton } from '@cinacoin/core-sdk/components';
import { InjectedProvider } from '@cinacoin/core-sdk';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const connector = new InjectedProvider();

  const handleSuccess = async (result) => {
    // Set httpOnly cookie via server action
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      body: JSON.stringify({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      }),
    });
    
    router.push('/dashboard');
  };

  return (
    <OneClickAuthButton
      connector={connector}
      config={{
        authUrl: process.env.NEXT_PUBLIC_AUTH_URL!,
        domain: window.location.origin,
      }}
      onSuccess={handleSuccess}
    />
  );
}
```

### React + Vite

```tsx
// src/pages/Login.tsx
import { OneClickAuthButton } from '@cinacoin/core-sdk/components';
import { InjectedProvider } from '@cinacoin/core-sdk';

export function Login() {
  const connector = new InjectedProvider();

  return (
    <OneClickAuthButton
      connector={connector}
      config={{
        authUrl: import.meta.env.VITE_AUTH_URL,
        domain: window.location.origin,
        chainId: 1,
      }}
      onSuccess={(result) => {
        localStorage.setItem('accessToken', result.data.accessToken);
        window.location.href = '/dashboard';
      }}
    />
  );
}
```

### Vanilla JavaScript

```javascript
// For non-React applications, use the API directly

async function oneClickLogin() {
  const connector = new InjectedProvider();
  
  // Connect wallet
  const { accounts } = await connector.connect();
  const address = accounts[0];
  
  // Initialize auth
  const initRes = await fetch('https://auth.cinacoin.com/auth/one-click/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      domain: window.location.origin,
    }),
  });
  
  const initData = await initRes.json();
  
  // Sign message
  const signature = await connector.signMessage(initData.data.message);
  
  // Complete auth
  const completeRes = await fetch('https://auth.cinacoin.com/auth/one-click/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      message: initData.data.message,
      signature,
      nonce: initData.data.nonce,
    }),
  });
  
  const result = await completeRes.json();
  
  // Store tokens
  localStorage.setItem('accessToken', result.data.accessToken);
  
  // Redirect
  window.location.href = '/dashboard';
}

document.getElementById('login-btn').addEventListener('click', oneClickLogin);
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { oneClickAuthRoutes } from './one-click-auth';

describe('One-Click Auth', () => {
  it('should generate valid SIWE message', async () => {
    // Test init endpoint
    const req = new Request('https://auth.cinacoin.com/auth/one-click/init', {
      method: 'POST',
      body: JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        domain: 'https://myapp.com',
      }),
    });
    
    const res = await oneClickAuthRoutes.fetch(req, env);
    const data = await res.json();
    
    expect(data.success).toBe(true);
    expect(data.data.message).toContain('myapp.com');
    expect(data.data.nonce).toBeDefined();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('one-click auth flow', async ({ page }) => {
  // Mock wallet connection
  await page.evaluate(() => {
    window.ethereum = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') {
          return ['0x1234567890123456789012345678901234567890'];
        }
        if (method === 'personal_sign') {
          return '0xsignature...';
        }
      },
    };
  });
  
  // Navigate to login page
  await page.goto('/login');
  
  // Click one-click auth button
  await page.click('button:has-text("Sign in with Wallet")');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  
  // Verify authenticated
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Troubleshooting

### Common Issues

**Issue:** "Invalid or expired nonce"
- **Cause:** Nonce expired (>5 min) or already used
- **Solution:** Request a new authentication message

**Issue:** "Address mismatch"
- **Cause:** Address in complete request doesn't match init request
- **Solution:** Ensure same wallet address is used throughout flow

**Issue:** "Signature verification failed"
- **Cause:** Invalid signature or wrong message
- **Solution:** Ensure exact message from init is signed

**Issue:** "Rate limit exceeded"
- **Cause:** Too many authentication attempts
- **Solution:** Wait 15 minutes before retrying

### Debug Mode

Enable debug logging in backend:
```typescript
console.log('One-click init:', { address, domain, nonce });
console.log('One-click complete:', { address, nonce, signature });
```

## Production Checklist

- [ ] Implement proper ecrecover signature verification (use ethers.js or viem)
- [ ] Configure CORS origins in auth service
- [ ] Set up rate limiting with appropriate thresholds
- [ ] Enable audit logging and monitoring
- [ ] Store tokens in httpOnly cookies (not localStorage)
- [ ] Implement token refresh logic
- [ ] Add CSRF protection for web applications
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure proper SSL/TLS certificates
- [ ] Test with multiple wallet providers (MetaMask, Cinacoin, etc.)
- [ ] Add loading states and error handling in UI
- [ ] Implement proper session management
- [ ] Add logout functionality
- [ ] Document API for frontend developers

## Comparison with Cinacoin

| Feature | CINAcoin One-Click Auth | Cinacoin |
|---------|------------------------|-------|
| Self-hosted | ✅ Yes | ❌ No |
| One-click flow | ✅ Yes | ✅ Yes |
| SIWE support | ✅ Yes | ✅ Yes |
| Multi-chain | ✅ Yes (via adapters) | ✅ Yes |
| Customizable UI | ✅ Full control | ⚠️ Limited |
| Open source | ✅ Yes | ⚠️ Partial |
| No vendor lock-in | ✅ Yes | ❌ No |
| Cost | ✅ Free | ❌ Paid |

## References

- [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [SIWE Documentation](https://docs.login.xyz/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
