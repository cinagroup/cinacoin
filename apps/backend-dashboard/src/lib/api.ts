/**
 * API client with CSRF token management for CINAcoin backend dashboard.
 * Automatically fetches and attaches CSRF tokens to state-changing requests.
 * Supports 2FA, OAuth, and session management.
 */

import { getEnv } from '../env';

const env = getEnv();
const AUTH_BASE_URL = env.NEXT_PUBLIC_AUTH_URL;
const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

let csrfToken: string | null = null;
let sessionId: string | null = null;

/**
 * Fetch a CSRF token from the auth service.
 * Caches the token until it's invalidated (403 response).
 */
export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  const response = await fetch(`${AUTH_BASE_URL}/auth/csrf-token`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CSRF token: ${response.status}`);
  }

  const data = await response.json();
  csrfToken = data.csrfToken;
  sessionId = data.sessionId;

  return csrfToken!;
}

/**
 * Clear cached CSRF token (e.g., after logout or 403 response).
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  sessionId = null;
}

/**
 * Make an API request with automatic CSRF token attachment.
 * Handles token refresh on 403 responses.
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  const token = await getCsrfToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    'X-CSRF-Token': token,
    'X-Session-ID': sessionId!,
  };

  // Add Authorization header if we have an access token
  const accessToken = typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null;
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If CSRF token is invalid/expired, refresh and retry once
  if (response.status === 403 && retryCount < 1) {
    clearCsrfToken();
    return apiRequest(url, options, retryCount + 1);
  }

  return response;
}

/**
 * Convenience: GET request
 */
export async function apiGet(url: string): Promise<Response> {
  return apiRequest(url, { method: 'GET' });
}

/**
 * Convenience: POST request with JSON body
 */
export async function apiPost(url: string, body: unknown): Promise<Response> {
  return apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Convenience: PUT request with JSON body
 */
export async function apiPut(url: string, body: unknown): Promise<Response> {
  return apiRequest(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Convenience: DELETE request
 */
export async function apiDelete(url: string): Promise<Response> {
  return apiRequest(url, { method: 'DELETE' });
}

// ============================================================
// Authentication API
// ============================================================

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  mfaToken?: string;
}

export interface MfaVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  recoveryCodes: string[];
}

/**
 * Login with email and password.
 * Returns tokens or mfaRequired/mfaSetupRequired flags.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.error || `Login failed: ${response.status}`);
  }

  const data: LoginResponse = await response.json();

  // Store tokens if not MFA required
  if (!data.mfaRequired && !data.mfaSetupRequired) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
  }

  return data;
}

/**
 * Verify TOTP code during login (2FA step).
 */
export async function verifyMfa(mfaToken: string, code: string): Promise<MfaVerifyResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mfaToken, code }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Invalid code' }));
    throw new Error(error.error || `MFA verification failed: ${response.status}`);
  }

  const data: MfaVerifyResponse = await response.json();

  // Store tokens after successful MFA
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  return data;
}

/**
 * Setup 2FA - returns secret, QR code, and recovery codes.
 */
export async function setupMfa(): Promise<MfaSetupResponse> {
  const response = await apiPost(`${AUTH_BASE_URL}/auth/mfa/setup`, {});

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Setup failed' }));
    throw new Error(error.error || `MFA setup failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Enable 2FA after scanning QR code and verifying initial code.
 */
export async function enableMfa(code: string): Promise<{ recoveryCodes: string[] }> {
  const response = await apiPost(`${AUTH_BASE_URL}/auth/mfa/enable`, { code });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Enable failed' }));
    throw new Error(error.error || `MFA enable failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Disable 2FA.
 */
export async function disableMfa(code: string): Promise<void> {
  const response = await apiPost(`${AUTH_BASE_URL}/auth/mfa/disable`, { code });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Disable failed' }));
    throw new Error(error.error || `MFA disable failed: ${response.status}`);
  }
}

/**
 * Verify recovery code during login.
 */
export async function verifyRecoveryCode(mfaToken: string, recoveryCode: string): Promise<MfaVerifyResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/mfa/recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mfaToken, recoveryCode }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Invalid recovery code' }));
    throw new Error(error.error || `Recovery code verification failed: ${response.status}`);
  }

  const data: MfaVerifyResponse = await response.json();

  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  return data;
}

// ============================================================
// OAuth API
// ============================================================

export interface OAuthProvider {
  name: string;
  displayName: string;
  icon: string;
  authUrl: string;
}

/**
 * Get available OAuth providers.
 */
export async function getOAuthProviders(): Promise<OAuthProvider[]> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/oauth/providers`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    return []; // Return empty array if endpoint not available
  }

  return response.json();
}

/**
 * Get OAuth authorization URL for a provider.
 */
export function getOAuthUrl(provider: string): string {
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'https://backend.cinacoin.com/auth/callback';
  return `${AUTH_BASE_URL}/auth/oauth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Handle OAuth callback - exchange code for tokens.
 */
export async function handleOAuthCallback(code: string, state: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/auth/oauth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'OAuth failed' }));
    throw new Error(error.error || `OAuth callback failed: ${response.status}`);
  }

  const data: LoginResponse = await response.json();

  if (!data.mfaRequired && !data.mfaSetupRequired) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
  }

  return data;
}

// ============================================================
// Session Management
// ============================================================

/**
 * Refresh the access token using the refresh token.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current user info.
 */
export async function getCurrentUser(): Promise<{ id: string; email: string; username: string; role: string } | null> {
  try {
    const response = await apiGet(`${AUTH_BASE_URL}/auth/me`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Logout - clear tokens and server session.
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiPost(`${AUTH_BASE_URL}/auth/logout`, {});
  } catch {
    // Ignore errors
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('mfaToken');
    }
    clearCsrfToken();
  }
}

/**
 * Check if user is authenticated (has valid access token).
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

/**
 * Get stored access token.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Get stored MFA token (used during 2FA flow).
 */
export function getMfaToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mfaToken');
}

/**
 * Store MFA token during 2FA flow.
 */
export function setMfaToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mfaToken', token);
}

/**
 * Clear MFA token after 2FA flow completes.
 */
export function clearMfaToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mfaToken');
}

// Export base URLs for external use
export { AUTH_BASE_URL, API_BASE_URL };
