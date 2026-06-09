/**
 * API client with CSRF token management for CINAcoin backend dashboard.
 * Automatically fetches and attaches CSRF tokens to state-changing requests.
 */

const AUTH_BASE_URL = 'https://auth.cinacoin.com';

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
