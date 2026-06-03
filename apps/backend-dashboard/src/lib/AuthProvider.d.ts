import { type ReactNode } from "react";
interface AuthContextValue {
    address: string | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    error: string | null;
    doLogin: () => Promise<void>;
    doLogout: () => void;
}
export declare function useAuth(): AuthContextValue;
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
export default function AuthProvider({ children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AuthProvider.d.ts.map