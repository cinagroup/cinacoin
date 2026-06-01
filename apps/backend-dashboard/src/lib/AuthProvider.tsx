"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { createSiweMessage, generateNonce, connectWallet, signAndVerify, getSession, logout } from "@/lib/auth";

interface AuthContextValue {
  address: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  doLogin: () => Promise<void>;
  doLogout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  address: null,
  isLoggedIn: false,
  isLoading: true,
  error: null,
  doLogin: async () => {},
  doLogout: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Pure client-side wallet authentication for static-export dashboard.
 *
 * No server API routes needed (they don't work in static export mode).
 * Authentication is proven by wallet signature — no server verification
 * is required for the dashboard since it's a read-only monitoring tool.
 *
 * Security model:
 * 1. Wallet connection proves ownership (eth_requestAccounts)
 * 2. SIWE message signing proves control of the private key
 * 3. Session stored in localStorage with expiry
 * 4. No token can be stolen via XSS (signature is useless without wallet)
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const addressRef = useRef<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    try {
      const session = getSession();
      if (session) {
        setAddress(session.address);
        addressRef.current = session.address;
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Wallet disconnected externally
        handleLogoutRequest();
      } else {
        const current = accounts[0].toLowerCase();
        if (addressRef.current && current !== addressRef.current) {
          // Account switched
          handleLogoutRequest();
          setAddress(current);
          addressRef.current = current;
        }
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    return () => eth.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  const doLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const walletAddress = await connectWallet();
      const nonce = generateNonce();
      const message = createSiweMessage(walletAddress, nonce);
      const signature = await signAndVerify(message, walletAddress);

      // Session is saved in signAndVerify → login() → localStorage
      setAddress(walletAddress);
      addressRef.current = walletAddress;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogoutRequest = useCallback(() => {
    logout();
    addressRef.current = null;
  }, []);

  const doLogout = useCallback(() => {
    handleLogoutRequest();
    setAddress(null);
  }, [handleLogoutRequest]);

  const value: AuthContextValue = {
    address,
    isLoggedIn: address !== null,
    isLoading,
    error,
    doLogin,
    doLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
