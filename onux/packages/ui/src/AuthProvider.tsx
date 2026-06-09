import { createContext, useContext, type ReactNode } from 'react';

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: 'admin' | 'developer' | 'viewer' | 'service';
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthContextValue {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refresh: async () => {},
});

export function useAuthService() {
  return useContext(AuthContext);
}

// ─── Auth Provider ────────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: ReactNode;
  /** Auth service base URL */
  authUrl?: string;
}

/**
 * AuthProvider — integrates with Cinacoin Auth Service for JWT-based authentication.
 *
 * Usage:
 * ```tsx
 * <AuthProvider authUrl="https://auth.cinacoin.com">
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children, authUrl = 'http://localhost:3000' }: AuthProviderProps) {
  // This is a placeholder - actual implementation would use useState, useEffect, etc.
  // For now, we'll export the types and context structure

  const value: AuthContextValue = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => {},
    logout: () => {},
    refresh: async () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Auth API Helpers ─────────────────────────────────────────────────────────

export async function loginApi(
  email: string,
  password: string,
  authUrl: string
): Promise<{ tokens: AuthTokens; user: AuthUser }> {
  const response = await fetch(`${authUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.message || error.error || 'Login failed');
  }

  const data = await response.json();
  return data.data;
}

export async function refreshApi(
  refreshToken: string,
  authUrl: string
): Promise<AuthTokens> {
  const response = await fetch(`${authUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  return data.data;
}

export async function meApi(
  accessToken: string,
  authUrl: string
): Promise<AuthUser> {
  const response = await fetch(`${authUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  const data = await response.json();
  return data.data;
}
