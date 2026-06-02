/**
 * Social recovery — multi-guardian wallet recovery mechanism.
 *
 * When a user loses access to all their social providers,
 * they can recover their wallet through a set of trusted guardians.
 *
 * Flow:
 * 1. User adds 3-5 guardians (friends/family/other social accounts)
 * 2. When locked out, user initiates recovery
 * 3. Guardians must confirm (M of N threshold, e.g., 2 of 3)
 * 4. Once threshold is met, wallet is recovered to a new identity
 *
 * @packageDocumentation
 */

import { randomBytes, createHash } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

// ─── Types ──────────────────────────────────────────────────────────────

/** A trusted guardian who can help recover a wallet. */
export interface Guardian {
  /** Unique guardian identifier. */
  id: string;
  /** Guardian's email or social provider ID. */
  identifier: string;
  /** Guardian's social provider (google, apple, twitter, github, discord, email, phone). */
  provider: string;
  /** Guardian's display name. */
  displayName: string;
  /** When this guardian was added. */
  addedAt: string;
}

/** A pending recovery request. */
export interface RecoveryRequest {
  /** Unique recovery request ID. */
  id: string;
  /** Wallet being recovered. */
  walletId: string;
  /** New identifier for the recovered wallet. */
  newIdentifier: string;
  /** New auth method for recovery. */
  newAuthMethod: string;
  /** Guardian confirmations received (guardian IDs). */
  confirmations: string[];
  /** Required confirmations (M of N threshold). */
  requiredConfirmations: number;
  /** Total guardians available. */
  totalGuardians: number;
  /** Request status. */
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
  /** When the request was initiated. */
  createdAt: string;
  /** When the request expires (7 days by default). */
  expiresAt: string;
}

/** Current recovery state. */
export interface RecoveryState {
  /** Guardians for this wallet. */
  guardians: Guardian[];
  /** Pending recovery requests. */
  activeRequest: RecoveryRequest | null;
  /** Recovery threshold (M). */
  threshold: number;
}

/** Result of a recovery operation. */
export interface RecoveryResult {
  /** Whether recovery succeeded. */
  success: boolean;
  /** Wallet ID (on success). */
  walletId?: string;
  /** New wallet address (on success). */
  walletAddress?: string;
  /** Error message (on failure). */
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const DEFAULT_THRESHOLD_RATIO = 2 / 3; // 2/3 of guardians must confirm
const DEFAULT_EXPIRY_DAYS = 7;
const RECOVERY_COOLDOWN_DAYS = 30; // Can only add/remove guardians every 30 days

// ─── In-memory store ────────────────────────────────────────────────────

interface WalletRecoveryData {
  guardians: Guardian[];
  recoveryRequests: Map<string, RecoveryRequest>;
  lastGuardianChange: number;
}

const RECOVERY_STORE = new Map<string, WalletRecoveryData>();

// ─── Helpers ────────────────────────────────────────────────────────────

function generateId(): string {
  return randomBytes(16).toString('hex');
}

function getWalletData(walletId: string): WalletRecoveryData {
  if (!RECOVERY_STORE.has(walletId)) {
    RECOVERY_STORE.set(walletId, {
      guardians: [],
      recoveryRequests: new Map(),
      lastGuardianChange: 0,
    });
  }
  return RECOVERY_STORE.get(walletId)!;
}

// ─── Guardian Management ────────────────────────────────────────────────

/**
 * Add a guardian to a wallet.
 *
 * @param walletId - Wallet to add guardian to.
 * @param guardian - Guardian details.
 * @param cooldownCheck - Whether to enforce the cooldown period.
 * @throws Error if cooldown is still active or max guardians reached.
 */
export async function addGuardian(
  walletId: string,
  guardian: Omit<Guardian, 'id' | 'addedAt'>,
  cooldownCheck = true
): Promise<Guardian> {
  const data = getWalletData(walletId);

  // Enforce cooldown
  if (cooldownCheck) {
    const now = Date.now();
    const cooldownMs = RECOVERY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    if (now - data.lastGuardianChange < cooldownMs && data.lastGuardianChange > 0) {
      const remaining = Math.ceil(
        (cooldownMs - (now - data.lastGuardianChange)) / (24 * 60 * 60 * 1000)
      );
      throw new Error(`Guardian changes are cooldown. Try again in ${remaining} days.`);
    }
  }

  // Check max guardians
  if (data.guardians.length >= 5) {
    throw new Error('Maximum 5 guardians allowed per wallet');
  }

  // Check for duplicates
  const existing = data.guardians.find(
    (g) => g.identifier === guardian.identifier && g.provider === guardian.provider
  );
  if (existing) {
    throw new Error(`Guardian already exists: ${guardian.displayName} (${guardian.provider}:${guardian.identifier})`);
  }

  const newGuardian: Guardian = {
    ...guardian,
    id: generateId(),
    addedAt: new Date().toISOString(),
  };

  data.guardians.push(newGuardian);
  data.lastGuardianChange = Date.now();

  return newGuardian;
}

/**
 * Remove a guardian from a wallet.
 *
 * @param walletId - Wallet to remove guardian from.
 * @param guardianId - Guardian ID to remove.
 * @throws Error if wallet would have fewer than minimum guardians.
 */
export async function removeGuardian(
  walletId: string,
  guardianId: string
): Promise<void> {
  const data = getWalletData(walletId);

  // Enforce minimum guardians
  if (data.guardians.length <= 2) {
    throw new Error('Minimum 2 guardians required. Cannot remove more.');
  }

  const idx = data.guardians.findIndex((g) => g.id === guardianId);
  if (idx === -1) {
    throw new Error('Guardian not found');
  }

  data.guardians.splice(idx, 1);
  data.lastGuardianChange = Date.now();
}

/**
 * List all guardians for a wallet.
 */
export async function listGuardians(walletId: string): Promise<Guardian[]> {
  const data = getWalletData(walletId);
  return [...data.guardians];
}

/**
 * Get recovery state for a wallet.
 */
export async function getRecoveryState(walletId: string): Promise<RecoveryState> {
  const data = getWalletData(walletId);
  const activeRequest = getActiveRequest(walletId);

  return {
    guardians: data.guardians,
    activeRequest,
    threshold: calculateThreshold(data.guardians.length),
  };
}

// ─── Recovery Flow ──────────────────────────────────────────────────────

/**
 * Calculate the required confirmation threshold.
 *
 * @param totalGuardians - Total number of guardians.
 * @returns Required number of confirmations.
 */
function calculateThreshold(totalGuardians: number): number {
  return Math.ceil(totalGuardians * DEFAULT_THRESHOLD_RATIO);
}

/**
 * Get the active (non-expired, non-cancelled) recovery request.
 */
function getActiveRequest(walletId: string): RecoveryRequest | null {
  const data = getWalletData(walletId);

  for (const [, request] of data.recoveryRequests) {
    if (request.status === 'pending' && new Date(request.expiresAt) > new Date()) {
      return request;
    }
  }

  return null;
}

/**
 * Initiate a wallet recovery request.
 *
 * This creates a recovery request that guardians can confirm.
 * The recovery completes when enough guardians have confirmed.
 *
 * @param walletId - Wallet to recover.
 * @param newIdentifier - New identity to recover to (e.g., new email).
 * @param newAuthMethod - New auth method (e.g., 'email', 'social').
 * @param expiryDays - Days until the request expires.
 * @returns The created recovery request.
 */
export async function initiateRecovery(
  walletId: string,
  newIdentifier: string,
  newAuthMethod: string,
  expiryDays = DEFAULT_EXPIRY_DAYS
): Promise<RecoveryRequest> {
  const data = getWalletData(walletId);

  // Check minimum guardians
  if (data.guardians.length < 2) {
    throw new Error('Recovery requires at least 2 guardians');
  }

  // Check for active request
  const active = getActiveRequest(walletId);
  if (active) {
    throw new Error(`Active recovery request exists: ${active.id}`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  const request: RecoveryRequest = {
    id: `rec_${generateId()}`,
    walletId,
    newIdentifier,
    newAuthMethod,
    confirmations: [],
    requiredConfirmations: calculateThreshold(data.guardians.length),
    totalGuardians: data.guardians.length,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  data.recoveryRequests.set(request.id, request);

  return request;
}

/**
 * A guardian confirms a recovery request.
 *
 * The guardian should verify the user's identity through an
 * out-of-band channel before confirming.
 *
 * @param walletId - Wallet being recovered.
 * @param recoveryId - Recovery request ID.
 * @param guardianId - Guardian confirming the request.
 * @param guardianVerificationToken - JWT from the guardian proving their identity.
 * @param guardianSecret - Optional secret for additional verification.
 * @returns Updated recovery request.
 */
export async function confirmRecovery(
  walletId: string,
  recoveryId: string,
  guardianId: string,
  guardianVerificationToken: string,
  guardianSecret?: string
): Promise<RecoveryRequest> {
  const data = getWalletData(walletId);

  // Find the request
  const request = data.recoveryRequests.get(recoveryId);
  if (!request || request.status !== 'pending') {
    throw new Error('Recovery request not found or already completed');
  }

  // Check expiry
  if (new Date(request.expiresAt) <= new Date()) {
    request.status = 'expired';
    throw new Error('Recovery request has expired');
  }

  // Verify guardian exists
  const guardian = data.guardians.find((g) => g.id === guardianId);
  if (!guardian) {
    throw new Error('Guardian not found for this wallet');
  }

  // Check guardian hasn't already confirmed
  if (request.confirmations.includes(guardianId)) {
    throw new Error('Guardian has already confirmed this request');
  }

  // Verify guardian's identity via JWT
  try {
    const { payload } = await jwtVerify(
      guardianVerificationToken,
      new TextEncoder().encode(guardianSecret || 'cinacoin-guardian-secret')
    );
    const tokenGuardianId = payload.sub as string;
    if (tokenGuardianId !== guardianId) {
      throw new Error('Guardian identity mismatch');
    }
  } catch (error) {
    throw new Error(`Guardian verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Add confirmation
  request.confirmations.push(guardianId);

  // Check if threshold is met
  if (request.confirmations.length >= request.requiredConfirmations) {
    request.status = 'confirmed';
  }

  return request;
}

/**
 * Complete a recovery after all guardians have confirmed.
 *
 * This transfers the wallet to the new identity.
 *
 * @param walletId - Wallet being recovered.
 * @param recoveryId - Recovery request ID.
 * @returns Recovery result with new wallet details.
 */
export async function completeRecovery(
  walletId: string,
  recoveryId: string
): Promise<RecoveryResult> {
  const data = getWalletData(walletId);

  const request = data.recoveryRequests.get(recoveryId);
  if (!request) {
    return { success: false, error: 'Recovery request not found' };
  }

  if (request.status !== 'confirmed') {
    return {
      success: false,
      error: `Recovery not confirmed. Status: ${request.status}`,
    };
  }

  // Mark as completed
  request.status = 'completed';

  // In production, this would:
  // 1. Transfer the wallet to the new identity
  // 2. Generate a new session
  // 3. Notify the user and guardians
  // 4. Log the recovery event

  return {
    success: true,
    walletId: request.walletId,
    walletAddress: '', // Would be derived from new identity
  };
}

/**
 * Cancel a recovery request.
 *
 * Can be called by the wallet owner (if they regain access) or by
 * an admin. Guardians cannot cancel.
 *
 * @param walletId - Wallet being recovered.
 * @param recoveryId - Recovery request ID.
 * @returns Whether the request was cancelled.
 */
export async function cancelRecovery(
  walletId: string,
  recoveryId: string
): Promise<boolean> {
  const data = getWalletData(walletId);

  const request = data.recoveryRequests.get(recoveryId);
  if (!request || request.status !== 'pending') {
    return false;
  }

  request.status = 'cancelled';
  return true;
}

// ─── Guardian Token Generation ──────────────────────────────────────────

/**
 * Generate a guardian verification JWT.
 *
 * This is sent to the guardian (e.g., via email) so they can
 * confirm a recovery request. The guardian must authenticate
 * themselves to use this token.
 *
 * @param guardianId - Guardian's ID.
 * @param recoveryId - Recovery request ID.
 * @param secret - Signing secret.
 * @param ttlHours - Token TTL in hours.
 * @returns JWT string.
 */
export async function generateGuardianToken(
  guardianId: string,
  recoveryId: string,
  secret: string,
  ttlHours = 168 // 7 days
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttlHours * 60 * 60;

  return new SignJWT({ recoveryId, purpose: 'guardian-confirmation' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(guardianId)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .setIssuer('cinacoin-social-recovery')
    .sign(new TextEncoder().encode(secret));
}
