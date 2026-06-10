/**
 * Client-side wallet authentication utilities for the Backend Dashboard.
 * These functions run in the browser and interact with the Ethereum wallet.
 */

export interface Session {
  address: string;
  signature: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

const SESSION_KEY = "cinacoin_backend_session";

/**
 * Check whether an Ethereum wallet provider (e.g. MetaMask) is available.
 */
export function isWalletAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Window & typeof globalThis).ethereum;
}

/**
 * Generate a random nonce for SIWE messages.
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a SIWE (Sign-In with Ethereum) message.
 */
export function createSiweMessage(address: string, nonce: string): string {
  const domain = typeof window !== "undefined" ? window.location.host : "backend.cinacoin.com";
  const uri = typeof window !== "undefined" ? window.location.origin : "https://backend.cinacoin.com";
  const issuedAt = new Date().toISOString();

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to the Cinacoin Backend Dashboard.",
    "",
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

/**
 * Connect to the user's Ethereum wallet and request their account.
 */
export async function connectWallet(): Promise<string> {
  if (!isWalletAvailable()) {
    throw new Error("No Ethereum wallet detected. Please install MetaMask.");
  }

  const ethereum = (window as unknown as Window & typeof globalThis).ethereum;
  const accounts: string[] = await ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts returned from wallet.");
  }

  return accounts[0];
}

/**
 * Request the wallet to sign a SIWE message.
 * Returns the signature string.
 */
export async function signAndVerify(message: string, address: string): Promise<string> {
  if (!isWalletAvailable()) {
    throw new Error("No Ethereum wallet detected.");
  }

  const ethereum = (window as unknown as Window & typeof globalThis).ethereum;
  const signature: string = await ethereum.request({
    method: "personal_sign",
    params: [message, address],
  });

  return signature;
}

/**
 * Retrieve the current session from localStorage, if valid.
 */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Save a session to localStorage.
 */
export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Clear the session from localStorage.
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
