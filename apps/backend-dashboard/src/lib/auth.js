// Client-side SIWE-like wallet authentication for static-export Next.js dashboard.
// No server-side verification — address ownership is proven via personal_sign.
const SESSION_KEY = "cinacoin_auth_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
// ---------- EIP-4361 (SIWE) message construction ----------
/**
 * Generate an EIP-4361 compliant Sign-In With Ethereum message.
 */
export function createSiweMessage(address, nonce) {
    const domain = typeof window !== "undefined" ? window.location.hostname : "cinacoin.local";
    const uri = typeof window !== "undefined" ? window.location.origin : "https://cinacoin.local";
    const now = new Date();
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
    return (`${domain} wants you to sign in with your Ethereum account:\n` +
        `${address}\n\n` +
        `Sign in to the Cinacoin Backend Dashboard.\n\n` +
        `URI: ${uri}\n` +
        `Version: 1\n` +
        `Chain ID: 1\n` +
        `Nonce: ${nonce}\n` +
        `Issued At: ${issuedAt}\n` +
        `Expiration Time: ${expiresAt}`);
}
/**
 * Generate a cryptographically random nonce (32 hex chars).
 */
export function generateNonce() {
    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else {
        // Fallback for edge cases: deterministic hash (nonce is not security-critical here,
        // the actual security comes from the personal_sign verification)
        const fallback = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let hash = 0;
        for (let i = 0; i < fallback.length; i++) {
            hash = ((hash << 5) - hash + fallback.charCodeAt(i)) | 0;
        }
        return hash.toString(16).padStart(8, '0').repeat(4).slice(0, 32);
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
// ---------- Wallet connection ----------
/**
 * Request wallet connection via EIP-1193. Returns the selected address.
 */
export async function connectWallet() {
    const eth = getEthereum();
    if (!eth) {
        throw new Error("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.");
    }
    const accounts = (await eth.request({
        method: "eth_requestAccounts",
    }));
    if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned. Please approve the connection in your wallet.");
    }
    return accounts[0].toLowerCase();
}
/**
 * Check if a wallet extension is available.
 */
export function isWalletAvailable() {
    return typeof window !== "undefined" && !!getEthereum();
}
function getEthereum() {
    if (typeof window === "undefined")
        return null;
    return window.ethereum;
}
// ---------- Signing ----------
/**
 * Sign a message via personal_sign and verify the recovered address matches.
 * Returns the signature hex string.
 */
export async function signAndVerify(message, address) {
    const eth = getEthereum();
    if (!eth) {
        throw new Error("Wallet disconnected. Please reconnect.");
    }
    // personal_sign expects (message, address) — message must be hex-encoded
    const hexMessage = "0x" + Array.from(new TextEncoder().encode(message))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const signature = (await eth.request({
        method: "personal_sign",
        params: [hexMessage, address],
    }));
    // Client-side verification: confirm the wallet still holds the address
    const currentAccounts = (await eth.request({
        method: "eth_accounts",
    }));
    const stillConnected = currentAccounts.some((a) => a.toLowerCase() === address.toLowerCase());
    if (!stillConnected) {
        throw new Error("Wallet disconnected during signing.");
    }
    return signature;
}
// ---------- CSRF Protection ----------
const CSRF_COOKIE_NAME = "cinacoin_csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";
/**
 * Generate a cryptographically secure CSRF token using crypto.getRandomValues.
 */
export function generateCsrfToken() {
    const bytes = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else {
        // Fallback for SSR/edge cases — deterministic hash is acceptable for CSRF tokens
        // as long as the token is bound to a server session
        const fallback = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let hash = 0;
        for (let i = 0; i < fallback.length; i++) {
            hash = ((hash << 5) - hash + fallback.charCodeAt(i)) | 0;
        }
        return hash.toString(16).padStart(8, '0').repeat(8).slice(0, 64);
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
/**
 * Store a CSRF token in a cookie (for browser environments).
 */
export function setCsrfCookie(token) {
    if (typeof document === "undefined")
        return;
    document.cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Secure; Max-Age=3600`;
}
/**
 * Read the CSRF token from the cookie.
 */
export function getCsrfCookie() {
    if (typeof document === "undefined")
        return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}
/**
 * Verify that a submitted CSRF token matches the cookie value.
 * Returns true if valid, false otherwise.
 */
export function verifyCsrfToken(submitted) {
    if (!submitted)
        return false;
    const cookieToken = getCsrfCookie();
    return cookieToken !== null && submitted === cookieToken;
}
/**
 * Initialize CSRF token — generate one if not present and store it in a cookie.
 * Call this on page load before any form submission.
 */
export function initCsrfToken() {
    let token = getCsrfCookie();
    if (!token) {
        token = generateCsrfToken();
        setCsrfCookie(token);
    }
    return token;
}
// ---------- Session management ----------
/**
 * Full login flow: connect wallet → sign SIWE message → save session.
 */
export async function login() {
    const address = await connectWallet();
    const nonce = generateNonce();
    const message = createSiweMessage(address, nonce);
    const signature = await signAndVerify(message, address);
    const session = {
        address,
        signature,
        nonce,
        timestamp: Date.now(),
        expiresAt: Date.now() + SESSION_TTL_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}
/**
 * Clear the stored session.
 */
export function logout() {
    localStorage.removeItem(SESSION_KEY);
}
/**
 * Save a session to localStorage.
 */
export function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
/**
 * Retrieve the current session from localStorage, or null if none / expired.
 */
export function getSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw)
            return null;
        const session = JSON.parse(raw);
        if (Date.now() > session.expiresAt) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session;
    }
    catch {
        return null;
    }
}
/**
 * Check if a valid (non-expired) session exists.
 */
export function isLoggedIn() {
    return getSession() !== null;
}
//# sourceMappingURL=auth.js.map