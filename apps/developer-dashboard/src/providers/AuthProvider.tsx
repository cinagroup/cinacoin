"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginSIWE: (message: string, signature: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("cc_auth_token");
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    auth
      .me()
      .then((user) => setState({ user, isLoading: false, isAuthenticated: true, error: null }))
      .catch(() => {
        localStorage.removeItem("cc_auth_token");
        setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { token, user } = await auth.login(email, password);
      localStorage.setItem("cc_auth_token", token);
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
      router.push("/");
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message, isLoading: false }));
    }
  }, [router]);

  const loginSIWE = useCallback(async (message: string, signature: string) => {
    setState((s) => ({ ...s, error: null }));
    try {
      const { token, user } = await auth.loginSIWE(message, signature);
      localStorage.setItem("cc_auth_token", token);
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
      router.push("/");
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message, isLoading: false }));
    }
  }, [router]);

  const logout = useCallback(() => {
    auth.logout();
    setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
    router.push("/login");
  }, [router]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginSIWE, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}
