"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createSiweMessage, generateNonce, connectWallet, signAndVerify, getSession, logout, saveSession } from "@/lib/auth";
const AuthContext = createContext({
    address: null,
    isLoggedIn: false,
    isLoading: true,
    error: null,
    doLogin: async () => { },
    doLogout: () => { },
});
export function useAuth() {
    return useContext(AuthContext);
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
export default function AuthProvider({ children }) {
    const [address, setAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const addressRef = useRef(null);
    // Restore session on mount
    useEffect(() => {
        try {
            const session = getSession();
            if (session) {
                setAddress(session.address);
                addressRef.current = session.address;
            }
        }
        catch { /* ignore */ }
        setIsLoading(false);
    }, []);
    // Listen for account changes
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const eth = window.ethereum;
        if (!eth)
            return;
        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                // Wallet disconnected externally
                handleLogoutRequest();
            }
            else {
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
            // Persist session to localStorage so it survives redirects/reloads
            const session = {
                address: walletAddress,
                signature,
                nonce,
                timestamp: Date.now(),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            };
            saveSession(session);
            setAddress(walletAddress);
            addressRef.current = walletAddress;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
        }
        finally {
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
    const value = {
        address,
        isLoggedIn: address !== null,
        isLoading,
        error,
        doLogin,
        doLogout,
    };
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
//# sourceMappingURL=AuthProvider.js.map