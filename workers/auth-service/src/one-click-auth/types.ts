/**
 * One-Click Auth Types
 * Type definitions for the one-click authentication flow
 */

/**
 * Request body for POST /auth/one-click/init
 */
export interface OneClickInitRequest {
  /** Ethereum wallet address (0x-prefixed, 40 hex chars) */
  address: string;
  /** Domain requesting authentication (e.g., 'https://myapp.com') */
  domain: string;
  /** EIP-155 chain ID (default: 1 for Ethereum mainnet) */
  chainId?: number;
  /** Optional human-readable statement shown to user */
  statement?: string;
}

/**
 * Response from POST /auth/one-click/init
 */
export interface OneClickInitResponse {
  success: true;
  data: {
    /** Pre-filled SIWE message ready for signing */
    message: string;
    /** Unique nonce for replay protection */
    nonce: string;
    /** ISO timestamp when message was issued */
    issuedAt: string;
    /** ISO timestamp when message expires (5 min from issuedAt) */
    expirationTime: string;
    /** Domain that will be bound to this message */
    domain: string;
    /** Chain ID bound to this message */
    chainId: number;
  };
}

/**
 * Request body for POST /auth/one-click/complete
 */
export interface OneClickCompleteRequest {
  /** Ethereum wallet address that signed */
  address: string;
  /** The exact SIWE message that was signed */
  message: string;
  /** Hex-encoded signature from the wallet */
  signature: string;
  /** Nonce from the init response (for replay protection) */
  nonce: string;
}

/**
 * Response from POST /auth/one-click/complete
 */
export interface OneClickCompleteResponse {
  success: true;
  data: {
    /** JWT access token */
    accessToken: string;
    /** JWT refresh token */
    refreshToken: string;
    /** Access token expiry in seconds */
    expiresIn: number;
    /** Token type (always 'Bearer') */
    tokenType: 'Bearer';
    /** Authenticated user info */
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string | null;
      role: string;
      status: string;
      emailVerified: boolean;
      lastLoginAt: string | null;
      createdAt: string;
    };
    /** Wallet address that authenticated */
    address: string;
    /** Chain ID used for authentication */
    chainId: number;
  };
}

/**
 * Nonce data stored in KV during the init → complete flow
 */
export interface OneClickNonceData {
  /** Lowercase Ethereum address */
  address: string;
  /** Domain that requested the nonce */
  domain: string;
  /** Chain ID */
  chainId: number;
  /** ISO timestamp when issued */
  issuedAt: string;
  /** ISO timestamp when it expires */
  expirationTime: string;
}

/**
 * SIWE message parameters (EIP-4361)
 */
export interface SIWEMessageParams {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

/**
 * Configuration for One-Click Auth
 */
export interface OneClickAuthConfig {
  /** Auth service base URL (e.g., 'https://auth.cinacoin.com') */
  authUrl: string;
  /** Domain for SIWE message binding */
  domain: string;
  /** Default chain ID */
  chainId?: number;
  /** Custom statement for SIWE message */
  statement?: string;
  /** Message expiration time in seconds (default: 300 = 5 min) */
  expirationSeconds?: number;
}
