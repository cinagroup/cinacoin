"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  login as apiLogin,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  verifyMfa,
  verifyRecoveryCode,
  handleOAuthCallback,
  isAuthenticated,
  getMfaToken,
  clearMfaToken,
  type LoginResponse,
} from "@/lib/api";

// ============================================================
// Types
// ============================================================

export type AuthStatus =
  | "idle"           // Initial state, checking session
  | "authenticated"  // User is logged in
  | "unauthenticated"// Not logged in
  | "mfaRequired"    // Login succeeded, needs 2FA code
  | "mfaSetupRequired"; // Login succeeded, needs to setup 2FA

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextValue {
  user: UserInfo | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
  mfaToken: string | null;
  doLogin: (email: string, password: string) => Promise<void>;
  doLogout: () => Promise<void>;
  doMfaVerify: (code: string) => Promise<void>;
  doRecoveryCode: (code: string) => Promise<void>;
  doOAuthCallback: (code: string, state: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: "idle",
  isLoading: true,
  error: null,
  mfaToken: null,
  doLogin: async () => {},
  doLogout: async () => {},
  doMfaVerify: async () => {},
  doRecoveryCode: async () => {},
  doOAuthCallback: async () => {},
  clearError: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================
// Provider
// ============================================================

/**
 * Authentication provider for the Backend Dashboard.
 * Supports:
 * - Email/password login with token-based auth
 * - 2FA (TOTP) verification flow
 * - OAuth callback handling
 * - Session restoration via refresh token
 * - Automatic token refresh
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mfaToken, setMfaTokenState] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (!isAuthenticated()) {
        setStatus("unauthenticated");
        setIsLoading(false);
        return;
      }

      // Try to get current user info
      const userInfo = await getCurrentUser();
      if (userInfo) {
        setUser(userInfo);
        setStatus("authenticated");
      } else {
        // Token might be expired, try refresh
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const userInfo = await getCurrentUser();
          if (userInfo) {
            setUser(userInfo);
            setStatus("authenticated");
          } else {
            setStatus("unauthenticated");
          }
        } else {
          setStatus("unauthenticated");
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Cleanup refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const handleLoginResponse = useCallback((data: LoginResponse) => {
    if (data.mfaRequired) {
      // Store MFA token for verification step
      if (data.mfaToken) {
        setMfaTokenState(data.mfaToken);
        // Also store in localStorage for persistence across page reloads
        if (typeof window !== 'undefined') {
          localStorage.setItem('mfaToken', data.mfaToken);
        }
      }
      setStatus("mfaRequired");
      return;
    }

    if (data.mfaSetupRequired) {
      if (data.mfaToken) {
        setMfaTokenState(data.mfaToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mfaToken', data.mfaToken);
        }
      }
      setStatus("mfaSetupRequired");
      return;
    }

    // Direct login success (no MFA)
    setUser(data.user);
    setStatus("authenticated");
    setError(null);
  }, []);

  const doLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiLogin(email, password);
      handleLoginResponse(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      setStatus("unauthenticated");
    } finally {
      setIsLoading(false);
    }
  }, [handleLoginResponse]);

  const doLogout = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    await logoutUser();
    setUser(null);
    setMfaTokenState(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const doMfaVerify = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = mfaToken || getMfaToken();
      if (!token) {
        throw new Error("No MFA token available. Please login again.");
      }

      const data = await verifyMfa(token, code);
      clearMfaToken();
      setMfaTokenState(null);
      setUser(data.user);
      setStatus("authenticated");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid verification code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [mfaToken]);

  const doRecoveryCode = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = mfaToken || getMfaToken();
      if (!token) {
        throw new Error("No MFA token available. Please login again.");
      }

      const data = await verifyRecoveryCode(token, code);
      clearMfaToken();
      setMfaTokenState(null);
      setUser(data.user);
      setStatus("authenticated");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid recovery code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [mfaToken]);

  const doOAuthCallback = useCallback(async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await handleOAuthCallback(code, state);
      handleLoginResponse(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "OAuth login failed";
      setError(message);
      setStatus("unauthenticated");
    } finally {
      setIsLoading(false);
    }
  }, [handleLoginResponse]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    status,
    isLoading,
    error,
    mfaToken,
    doLogin,
    doLogout,
    doMfaVerify,
    doRecoveryCode,
    doOAuthCallback,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
