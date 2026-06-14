/**
 * Client-side authentication service
 * Calls auth.cinacoin.com directly since Cloudflare Pages doesn't support API routes
 */

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://cinacoin-auth.cinagroup.workers.dev';

export interface AuthSession {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
  expiresAt?: string;
}

export interface AuthError {
  error: string;
  message: string;
}

/**
 * Get current session from auth service
 */
export async function getSession(): Promise<AuthSession> {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get session:', error);
    return { authenticated: false };
  }
}

/**
 * Request a nonce for authentication challenges
 */
export async function getNonce(address?: string): Promise<{ nonce: string } | AuthError> {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/nonce`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: 'nonce_error', message: data.error || 'Failed to get nonce' };
    }

    return data;
  } catch (error) {
    console.error('Failed to get nonce:', error);
    return { error: 'network_error', message: 'Failed to connect to auth service' };
  }
}

/**
 * Create/login session with signed credentials
 */
export async function login(credentials: {
  address?: string;
  signature?: string;
  email?: string;
  password?: string;
}): Promise<AuthSession | AuthError> {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/session`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: 'login_error', message: data.error || 'Login failed' };
    }

    return data;
  } catch (error) {
    console.error('Login failed:', error);
    return { error: 'network_error', message: 'Failed to connect to auth service' };
  }
}

/**
 * Logout / destroy session
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/auth/session`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

/**
 * Check if user is authenticated (convenience helper)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.authenticated === true;
}
