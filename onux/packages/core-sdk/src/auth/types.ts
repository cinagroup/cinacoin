/**
 * One-Click Auth Types for Frontend
 * Shared types between backend and frontend
 */

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
