/**
 * Types for the embedded wallet system.
 */

/** Supported authentication methods for wallet creation and recovery. */
export type AuthMethod = 'email' | 'social' | 'phone';

/** Configuration passed when creating an embedded wallet. */
export interface EmbeddedWalletConfig {
  /** Unique identifier for this wallet instance. */
  id: string;
  /** Authentication method used to create/access this wallet. */
  authMethod: AuthMethod;
  /** User identifier (email, phone number, or social provider ID). */
  identifier: string;
  /** Optional display name for the wallet. */
  label?: string;
  /** Timestamp of wallet creation (ISO 8601). */
  createdAt: string;
  /** Timestamp of last access (ISO 8601). */
  lastAccessedAt?: string;
}

/** A linked social or external provider for multi-provider access. */
export interface LinkedProvider {
  /** Unique ID for this provider linkage. */
  providerId: string;
  /** Provider type (e.g., 'google', 'twitter', 'github'). */
  provider: string;
  /** External user ID from the provider. */
  externalId: string;
  /** When this provider was linked (ISO 8601). */
  linkedAt: string;
}

/** Encrypted backup payload for wallet recovery. */
export interface WalletBackup {
  /** Wallet ID this backup belongs to. */
  walletId: string;
  /** AES-GCM encrypted private key (base64). */
  encryptedKey: string;
  /** Initialization vector used during encryption (base64). */
  iv: string;
  /** Authentication tag from AES-GCM (base64). */
  authTag: string;
  /** PBKDF2 salt used for key derivation (base64). */
  salt: string;
  /** Number of PBKDF2 iterations used. */
  iterations: number;
  /** Backup creation timestamp (ISO 8601). */
  createdAt: string;
}

/** Active wallet session state. */
export interface WalletSession {
  /** Wallet ID for the active session. */
  walletId: string;
  /** Auth method of the session. */
  authMethod: AuthMethod;
  /** User identifier. */
  identifier: string;
  /** Session created at (ISO 8601). */
  createdAt: string;
  /** Session expires at (ISO 8601), null for no expiry. */
  expiresAt: string | null;
}

/** Transaction shape that can be signed by the wallet. */
export interface UnsignedTransaction {
  /** Transaction data to sign (hex string or raw bytes). */
  data: string | Uint8Array;
  /** Optional metadata (nonce, chainId, etc.). */
  metadata?: Record<string, unknown>;
}

/** Signed transaction result. */
export interface SignedTransaction {
  /** Original transaction data. */
  data: string | Uint8Array;
  /** Hex-encoded signature (64 bytes, r || s). */
  signature: string;
  /** Hex-encoded recoverable signature (65 bytes, r || s || v). */
  signatureRecoverable: string;
  /** Signing public key (compressed, hex). */
  publicKey: string;
}
