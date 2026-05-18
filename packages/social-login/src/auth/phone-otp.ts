/**
 * Phone OTP type definitions.
 *
 * Types for Phone-based one-time password authentication
 * with wallet creation and verification.
 */

/**
 * Parameters for sending a Phone OTP.
 */
export interface PhoneOTPParams {
  /** Phone number in E.164 format (e.g., "+1234567890"). */
  phone: string;

  /** Optional custom OTP length (default: 6). */
  otpLength?: number;

  /** Optional custom OTP TTL in seconds (default: 300). */
  otpTtlSeconds?: number;

  /** Optional locale for SMS message language. */
  locale?: string;
}

/**
 * Result of sending a Phone OTP.
 */
export interface PhoneOTPSendResult {
  /** Whether the OTP was sent successfully. */
  success: boolean;

  /** Opaque session ID for the verification step. */
  sessionId: string;

  /** OTP expiry timestamp (Unix seconds). */
  expiresAt: number;

  /** Error message if sending failed. */
  error?: string;
}

/**
 * Parameters for verifying a Phone OTP.
 */
export interface PhoneOTPVerifyParams {
  /** The phone number that received the OTP. */
  phone: string;

  /** The OTP code entered by the user. */
  code: string;

  /** Session ID returned from sendPhoneOTP. */
  sessionId: string;
}

/**
 * Result of verifying a Phone OTP.
 */
export interface PhoneOTPVerifyResult {
  /** Whether the verification was successful. */
  success: boolean;

  /** JWT authentication token (on success). */
  jwtToken?: string;

  /** Derived wallet address (on success). */
  walletAddress?: string;

  /** Public key for the derived wallet. */
  publicKey?: string;

  /** Whether this is a first-time login (new account). */
  isNewUser: boolean;

  /** Token expiration timestamp (Unix seconds). */
  expiresAt: number;

  /** Error message if verification failed. */
  error?: string;
}

/**
 * Parameters for creating a wallet from a phone number.
 */
export interface PhoneWalletCreationParams {
  /** Phone number in E.164 format. */
  phone: string;

  /** Optional derivation key for wallet derivation. */
  derivationKey?: string;
}

/**
 * Result of creating a wallet from a phone number.
 */
export interface PhoneWalletCreationResult {
  /** The derived wallet address. */
  walletAddress: string;

  /** The wallet's public key. */
  publicKey: string;

  /** Whether this wallet was just created. */
  isNew: boolean;

  /** The derivation path used. */
  derivationPath: string;
}

/**
 * SMS provider interface for sending OTP codes.
 */
export interface SMSProvider {
  /**
   * Send an SMS message.
   *
   * @param to - Destination phone number (E.164).
   * @param message - SMS body content.
   * @returns Promise resolving when SMS is sent.
   */
  send(to: string, message: string): Promise<void>;
}

/**
 * Phone OTP session state (server-side).
 */
export interface PhoneOTPSession {
  /** Unique session identifier. */
  sessionId: string;

  /** Phone number for this session. */
  phone: string;

  /** The OTP code (stored for verification). */
  otp: string;

  /** Session creation timestamp (Unix seconds). */
  createdAt: number;

  /** OTP expiry timestamp (Unix seconds). */
  expiresAt: number;

  /** Number of verification attempts. */
  attempts: number;

  /** Maximum allowed attempts. */
  maxAttempts: number;

  /** Whether this session has been verified. */
  verified: boolean;
}
