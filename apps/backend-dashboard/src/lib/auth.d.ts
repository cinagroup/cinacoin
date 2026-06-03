export interface AuthSession {
    address: string;
    signature: string;
    nonce: string;
    timestamp: number;
    expiresAt: number;
}
/**
 * Generate an EIP-4361 compliant Sign-In With Ethereum message.
 */
export declare function createSiweMessage(address: string, nonce: string): string;
/**
 * Generate a cryptographically random nonce (32 hex chars).
 */
export declare function generateNonce(): string;
/**
 * Request wallet connection via EIP-1193. Returns the selected address.
 */
export declare function connectWallet(): Promise<string>;
/**
 * Check if a wallet extension is available.
 */
export declare function isWalletAvailable(): boolean;
/**
 * Sign a message via personal_sign and verify the recovered address matches.
 * Returns the signature hex string.
 */
export declare function signAndVerify(message: string, address: string): Promise<string>;
/**
 * Generate a cryptographically secure CSRF token using crypto.getRandomValues.
 */
export declare function generateCsrfToken(): string;
/**
 * Store a CSRF token in a cookie (for browser environments).
 */
export declare function setCsrfCookie(token: string): void;
/**
 * Read the CSRF token from the cookie.
 */
export declare function getCsrfCookie(): string | null;
/**
 * Verify that a submitted CSRF token matches the cookie value.
 * Returns true if valid, false otherwise.
 */
export declare function verifyCsrfToken(submitted: string | null): boolean;
/**
 * Initialize CSRF token — generate one if not present and store it in a cookie.
 * Call this on page load before any form submission.
 */
export declare function initCsrfToken(): string;
/**
 * Full login flow: connect wallet → sign SIWE message → save session.
 */
export declare function login(): Promise<AuthSession>;
/**
 * Clear the stored session.
 */
export declare function logout(): void;
/**
 * Save a session to localStorage.
 */
export declare function saveSession(session: AuthSession): void;
/**
 * Retrieve the current session from localStorage, or null if none / expired.
 */
export declare function getSession(): AuthSession | null;
/**
 * Check if a valid (non-expired) session exists.
 */
export declare function isLoggedIn(): boolean;
//# sourceMappingURL=auth.d.ts.map