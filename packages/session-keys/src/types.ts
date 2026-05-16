/**
 * Session Key Type Definitions
 *
 * Defines types for session key generation, management, policies,
 * and social recovery mechanisms.
 */

import type { Address, Hex } from "viem";

// ============================================================
// Session Key Types
// ============================================================

/**
 * A session key pair with metadata.
 */
export interface SessionKey {
  /** Public key (address) */
  publicKey: Address;
  /** Private key (kept secret — never transmit) */
  privateKey: Hex;
  /** When this key expires (Unix timestamp) */
  expiresAt: number;
  /** When this key was created (Unix timestamp) */
  createdAt: number;
  /** Associated policy ID */
  policyId?: string;
  /** Label for identification */
  label?: string;
}

/**
 * Session key policy — defines what a session key is allowed to do.
 */
export interface SessionKeyPolicy {
  /** Unique policy identifier */
  id: string;
  /** When the policy expires (Unix timestamp) */
  expiresAt: number;
  /** Allowed target contract addresses (empty = all) */
  allowedTargets: Address[];
  /** Allowed function selectors (empty = all) */
  allowedMethods: Hex[];
  /** Maximum amount per single transaction (in wei) */
  maxAmountPerTx: bigint;
  /** Maximum total daily spending (in wei) */
  dailyLimit: bigint;
  /** Allowed chain IDs (empty = all) */
  allowedChains: number[];
  /** Whether native token transfers are allowed */
  allowNativeTransfers: boolean;
  /** Whether ERC-20 transfers are allowed */
  allowErc20Transfers: boolean;
  /** Specific ERC-20 tokens allowed (empty = all) */
  allowedTokens: Address[];
  /** Metadata */
  metadata?: Record<string, string>;
}

/**
 * Daily spending tracker for a session key.
 */
export interface DailySpend {
  /** The day number (timestamp / 86400) */
  day: number;
  /** Total spent today (in wei) */
  spent: bigint;
  /** Number of transactions today */
  txCount: number;
}

// ============================================================
// Social Recovery Types
// ============================================================

/**
 * A guardian in the social recovery system.
 */
export interface Guardian {
  /** Guardian address */
  address: Address;
  /** Guardian name / label */
  name: string;
  /** Whether this guardian is currently active */
  isActive: boolean;
  /** When the guardian was added */
  addedAt: number;
}

/**
 * Social recovery configuration.
 */
export interface RecoveryConfig {
  /** Total number of guardians */
  guardianCount: number;
  /** Required signatures for recovery (threshold) */
  threshold: number;
  /** Recovery delay (seconds) — time lock before execution */
  recoveryDelay: number;
  /** List of guardians */
  guardians: Guardian[];
}

/**
 * A pending recovery request.
 */
export interface RecoveryRequest {
  /** Unique request ID */
  id: string;
  /** The smart account being recovered */
  account: Address;
  /** The new owner address to set */
  newOwner: Address;
  /** Number of guardian signatures collected */
  signatureCount: number;
  /** Guardian addresses that have signed */
  signedGuardians: Address[];
  /** When the request was initiated */
  initiatedAt: number;
  /** When the request becomes executable */
  executableAt: number;
  /** Whether the request has been executed */
  executed: boolean;
  /** Whether the request has been cancelled */
  cancelled: boolean;
}

/**
 * Result of a recovery operation.
 */
export interface RecoveryResult {
  /** Whether the recovery was successful */
  success: boolean;
  /** Recovery request ID */
  requestId?: string;
  /** Error message if failed */
  error?: string;
}
