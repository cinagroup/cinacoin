'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSession, login, logout, AuthSession } from '@/lib/auth';

interface Credentials {
  address?: string;
  signature?: string;
  email?: string;
  password?: string;
}

interface AuthContextType {
  session: AuthSession;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>({ authenticated: false });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const currentSession = await getSession();
      setSession(currentSession);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSession({ authenticated: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleLogin = async (credentials: Credentials): Promise<AuthSession> => {
    const result = await login(credentials);
    if ('authenticated' in result && result.authenticated) {
      setSession(result);
    }
    return result as AuthSession;
  };

  const handleLogout = async () => {
    await logout();
    setSession({ authenticated: false });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
