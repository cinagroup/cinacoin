/**
 * Social Recovery types for Guardian-based wallet recovery.
 *
 * Defines Guardian types, recovery states, events, and security parameters
 * for multi-party wallet recovery with time-delayed execution.
 */

// ─── Guardian Types ────────────────────────────────────────────────────

/**
 * Supported Guardian types.
 *
 * - EOA: Standard externally-owned account (private key wallet).
 * - Smart Account: Contract-based account with programmable validation.
 * - Passkey: WebAuthn-based passkey guardian.
 * - Social Login: OAuth-based social account (Google, Apple, etc.).
 */
export type GuardianType = 'eoa' | 'smart-account' | 'passkey' | 'social-login';

/**
 * A Guardian that can approve wallet recovery requests.
 */
export interface Guardian {
  /** Unique Guardian identifier (address, key ID, or social sub). */
  id: string;
  /** The Guardian type. */
  type: GuardianType;
  /** Human-readable label for display. */
  label: string;
  /** Contact info for notifications (email, push token, etc.). */
  contact?: string;
  /** Whether this Guardian is currently active. */
  active: boolean;
  /** Timestamp when this Guardian was added (Unix seconds). */
  addedAt: number;
  /** Provider-specific metadata (e.g., passkey credential ID). */
  metadata?: Record<string, string>;
}

// ─── Recovery States ──────────────────────────────────────────────────

/**
 * Lifecycle states of a social recovery request.
 */
export type RecoveryStatus =
  | 'initiated'      // Recovery started, awaiting Guardian approvals
  | 'approved'       // Threshold reached, in delay period
  | 'executed'       // Recovery completed
  | 'cancelled'      // Recovery cancelled (by owner, timeout, or security)
  | 'blocked';       // Blocked by security module (malicious activity detected)

/**
 * A single social recovery request.
 */
export interface RecoveryRequest {
  /** Unique recovery request ID. */
  recoveryId: string;
  /** The wallet being recovered. */
  walletId: string;
  /** Current owner address (will be replaced). */
  currentOwner: string;
  /** Proposed new owner address. */
  newOwner: string;
  /** Current lifecycle status. */
  status: RecoveryStatus;
  /** Guardian addresses that have approved. */
  approvals: string[];
  /** Required number of approvals (threshold). */
  threshold: number;
  /** Total number of active Guardians. */
  totalGuardians: number;
  /** Timestamp when recovery was initiated (Unix seconds). */
  initiatedAt: number;
  /** Timestamp when threshold was reached (Unix seconds, null if not yet). */
  approvedAt: number | null;
  /** Timestamp when recovery was executed/cancelled (Unix seconds). */
  completedAt: number | null;
  /** Delay period before execution is allowed (seconds). */
  delaySeconds: number;
  /** Timeout after which recovery is auto-cancelled (seconds). */
  timeoutSeconds: number;
  /** Security score (0-100, higher = more suspicious). */
  riskScore: number;
}

// ─── Events ───────────────────────────────────────────────────────────

/**
 * Types of events logged during recovery lifecycle.
 */
export type RecoveryEventType =
  | 'recovery-initiated'
  | 'guardian-approved'
  | 'guardianRejected'
  | 'threshold-reached'
  | 'recovery-executed'
  | 'recovery-cancelled'
  | 'recovery-blocked'
  | 'recovery-timed-out'
  | 'guardian-added'
  | 'guardian-removed'
  | 'guardian-set';

/**
 * A single recovery event log entry.
 */
export interface RecoveryEvent {
  /** Event type. */
  type: RecoveryEventType;
  /** Associated recovery ID (if applicable). */
  recoveryId: string | null;
  /** Actor address or identifier. */
  actor: string;
  /** Unix timestamp (seconds). */
  timestamp: number;
  /** Optional structured data. */
  data?: Record<string, unknown>;
}

// ─── Configuration ────────────────────────────────────────────────────

/**
 * Guardian set configuration for a wallet.
 */
export interface GuardianSetConfig {
  /** List of Guardian addresses/IDs. */
  guardians: Guardian[];
  /** Minimum approvals needed for recovery. */
  threshold: number;
  /** Delay period before execution (seconds). Default: 86400 (24h). */
  delaySeconds: number;
  /** Timeout for recovery completion (seconds). Default: 604800 (7 days). */
  timeoutSeconds: number;
}

/**
 * Result of a recovery status query.
 */
export interface RecoveryStatusResult {
  /** The recovery request. */
  request: RecoveryRequest;
  /** Events for this recovery. */
  events: RecoveryEvent[];
  /** Time remaining until execution is allowed (seconds, 0 if not applicable). */
  delayRemaining: number;
  /** Time remaining until auto-cancellation (seconds, 0 if not applicable). */
  timeoutRemaining: number;
  /** Whether the request can currently be executed. */
  canExecute: boolean;
}

/**
 * Parameters for initiating a recovery request.
 */
export interface InitiateRecoveryParams {
  /** The wallet to recover. */
  walletId: string;
  /** Current owner address. */
  currentOwner: string;
  /** Proposed new owner address. */
  newOwner: string;
  /** Initiator address (for logging). */
  initiatedBy: string;
}

/**
 * Result of setting guardians.
 */
export interface SetGuardiansResult {
  /** Wallet ID. */
  walletId: string;
  /** Active Guardian count. */
  guardianCount: number;
  /** Threshold. */
  threshold: number;
}
