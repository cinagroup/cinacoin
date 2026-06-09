/**
 * SocialRecoveryManager — Guardian-based wallet recovery with time delays
 * and malicious activity detection.
 *
 * Provides a complete social recovery flow:
 * - Guardian set management (add/remove/set/list)
 * - Recovery request lifecycle (initiate → approve → execute/cancel)
 * - Security module with delay periods and risk scoring
 * - Event logging for audit trails
 */

import { randomBytes } from '@noble/hashes/utils.js';
import { bytesToHex } from '../WalletRecovery.js';
import type {
  Guardian,
  GuardianType,
  GuardianSetConfig,
  InitiateRecoveryParams,
  RecoveryEvent,
  RecoveryEventType,
  RecoveryRequest,
  RecoveryStatusResult,
  SetGuardiansResult,
  RecoveryStatus,
} from './types.js';

// ─── Constants ─────────────────────────────────────────────────────────

const DEFAULT_DELAY_SECONDS = 86400;       // 24 hours
const MIN_DELAY_SECONDS = 86400;           // 24 hours minimum
const MAX_DELAY_SECONDS = 172800;          // 48 hours maximum
const DEFAULT_TIMEOUT_SECONDS = 604800;    // 7 days
const MIN_TIMEOUT_SECONDS = 86400;         // 1 day minimum
const MAX_TIMEOUT_SECONDS = 1209600;       // 14 days maximum
const DEFAULT_THRESHOLD = 2;
const MAX_GUARDIANS = 10;
const MAX_RISK_SCORE = 100;

// ─── Helpers ───────────────────────────────────────────────────────────

function generateRecoveryId(): string {
  return 'rec-' + bytesToHex(randomBytes(8)).slice(2);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function validateThreshold(threshold: number, guardianCount: number): void {
  if (threshold < 1) throw new Error('Threshold must be at least 1');
  if (threshold > guardianCount) {
    throw new Error(
      `Threshold (${threshold}) cannot exceed guardian count (${guardianCount})`
    );
  }
  // Warn if threshold == guardianCount (no redundancy)
}

function validateGuardian(guardian: Guardian): void {
  if (!guardian.id) throw new Error('Guardian ID is required');
  if (!guardian.type) throw new Error('Guardian type is required');
  if (!guardian.label) throw new Error('Guardian label is required');
  if (!['eoa', 'smart-account', 'passkey', 'social-login'].includes(guardian.type)) {
    throw new Error(`Invalid guardian type: ${guardian.type}`);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Risk Scoring ─────────────────────────────────────────────────────

interface RiskFactors {
  /** New owner is very different from current owner pattern. */
  newOwnerAnomaly: number;
  /** Recovery initiated outside normal hours. */
  offHoursInitiation: number;
  /** Rapid consecutive recovery attempts. */
  rapidAttempts: number;
  /** High-risk guardian (newly added). */
  newGuardianApproval: number;
  /** Geographic anomaly (if location data available). */
  geoAnomaly: number;
}

const RISK_WEIGHTS: RiskFactors = {
  newOwnerAnomaly: 20,
  offHoursInitiation: 10,
  rapidAttempts: 25,
  newGuardianApproval: 30,
  geoAnomaly: 15,
};

const BLOCK_THRESHOLD = 80;

function calculateRiskScore(
  request: RecoveryRequest,
  config: GuardianSetConfig,
  recentAttempts: number,
  initiatedByGuardianAge: Map<string, number>,
): number {
  let score = 0;

  // Check if new owner pattern looks anomalous (simple heuristic)
  // In production this would use on-chain analytics
  if (request.newOwner === '0x' + '0'.repeat(40)) {
    score += RISK_WEIGHTS.newOwnerAnomaly;
  }

  // Off-hours initiation (between midnight and 6 AM UTC)
  const hour = new Date(request.initiatedAt * 1000).getUTCHours();
  if (hour >= 0 && hour < 6) {
    score += RISK_WEIGHTS.offHoursInitiation;
  }

  // Rapid consecutive attempts
  if (recentAttempts >= 3) {
    score += RISK_WEIGHTS.rapidAttempts;
  } else if (recentAttempts >= 2) {
    score += Math.floor(RISK_WEIGHTS.rapidAttempts * 0.6);
  }

  // Check if any newly added guardian (added < 48h ago) approved
  for (const approvalId of request.approvals) {
    const age = initiatedByGuardianAge.get(approvalId);
    if (age !== undefined && (nowSeconds() - age) < 172800) {
      score += RISK_WEIGHTS.newGuardianApproval;
      break;
    }
  }

  return clamp(score, 0, MAX_RISK_SCORE);
}

// ─── Notification Callback ────────────────────────────────────────────

export type NotificationCallback = (
  type: 'recovery-initiated' | 'guardian-approval-needed' | 'recovery-executed' | 'recovery-cancelled' | 'recovery-blocked',
  guardian: Guardian,
  details: Record<string, unknown>
) => void;

// ─── SocialRecoveryManager ────────────────────────────────────────────

export interface SocialRecoveryManagerOptions {
  /** Custom delay period in seconds (default: 86400 = 24h). */
  delaySeconds?: number;
  /** Custom timeout in seconds (default: 604800 = 7 days). */
  timeoutSeconds?: number;
  /** Default threshold if not specified in setGuardians (default: 2). */
  defaultThreshold?: number;
  /** Optional notification callback for Guardian alerts. */
  notify?: NotificationCallback;
}

/**
 * Manages Guardian-based social wallet recovery.
 *
 * Each wallet has a configurable Guardian set with a threshold.
 * Recovery requests require threshold Guardian approvals and enforce
 * a time delay before execution to prevent unauthorized takeovers.
 */
export class SocialRecoveryManager {
  /** Guardian sets per wallet. */
  private guardianSets: Map<string, GuardianSetConfig>;

  /** Recovery requests indexed by recoveryId. */
  private requests: Map<string, RecoveryRequest>;

  /** Recovery events indexed by recoveryId. */
  private events: Map<string, RecoveryEvent[]>;

  /** Track recent recovery attempts per wallet for risk scoring. */
  private recentAttempts: Map<string, number[]>;

  /** Track when each guardian was added (for new guardian detection). */
  private guardianAddedAt: Map<string, Map<string, number>>; // walletId -> (guardianId -> timestamp)

  /** Options. */
  private options: Required<SocialRecoveryManagerOptions>;

  constructor(options?: SocialRecoveryManagerOptions) {
    this.guardianSets = new Map();
    this.requests = new Map();
    this.events = new Map();
    this.recentAttempts = new Map();
    this.guardianAddedAt = new Map();

    this.options = {
      delaySeconds: options?.delaySeconds ?? DEFAULT_DELAY_SECONDS,
      timeoutSeconds: options?.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS,
      defaultThreshold: options?.defaultThreshold ?? DEFAULT_THRESHOLD,
      notify: options?.notify ?? (() => {}),
    };
  }

  // ─── Guardian Management ────────────────────────────────────────────

  /**
   * Set the Guardian list for a wallet.
   *
   * Replaces any existing Guardian set. Requires threshold <= active guardian count.
   *
   * @param walletId - Wallet identifier.
   * @param guardians - Array of Guardian objects.
   * @param threshold - Minimum approvals needed (default: 2 or defaultThreshold).
   * @returns Result with guardian count and threshold.
   */
  setGuardians(
    walletId: string,
    guardians: Guardian[],
    threshold?: number
  ): SetGuardiansResult {
    if (guardians.length === 0) throw new Error('Guardian list cannot be empty');
    if (guardians.length > MAX_GUARDIANS) {
      throw new Error(`Maximum ${MAX_GUARDIANS} guardians allowed`);
    }

    // Validate each guardian
    for (const g of guardians) {
      validateGuardian(g);
    }

    // Check for duplicate IDs
    const ids = new Set(guardians.map((g) => g.id));
    if (ids.size !== guardians.length) {
      throw new Error('Duplicate guardian IDs are not allowed');
    }

    const effectiveThreshold = threshold ?? this.options.defaultThreshold;
    const activeGuardians = guardians.filter((g) => g.active);

    validateThreshold(effectiveThreshold, activeGuardians.length);

    const now = nowSeconds();
    const config: GuardianSetConfig = {
      guardians: guardians.map((g) => ({ ...g, active: g.active ?? true })),
      threshold: effectiveThreshold,
      delaySeconds: this.options.delaySeconds,
      timeoutSeconds: this.options.timeoutSeconds,
    };

    // Track guardian addition timestamps
    const addedMap = new Map<string, number>();
    for (const g of guardians) {
      const existing = this.guardianAddedAt.get(walletId);
      if (existing?.has(g.id)) {
        addedMap.set(g.id, existing.get(g.id)!);
      } else {
        addedMap.set(g.id, now);
      }
    }
    this.guardianAddedAt.set(walletId, addedMap);

    this.guardianSets.set(walletId, config);

    // Log events
    this.logEvent({
      type: 'guardian-set',
      recoveryId: null,
      actor: 'system',
      timestamp: now,
      data: {
        walletId,
        guardianCount: activeGuardians.length,
        threshold: effectiveThreshold,
        guardianIds: activeGuardians.map((g) => g.id),
      },
    }, null);

    // Notify guardians
    for (const guardian of activeGuardians) {
      this.options.notify('recovery-initiated', guardian, {
        walletId,
        guardianCount: activeGuardians.length,
        threshold: effectiveThreshold,
      });
    }

    return {
      walletId,
      guardianCount: activeGuardians.length,
      threshold: effectiveThreshold,
    };
  }

  /**
   * Add a new Guardian to a wallet's Guardian set.
   *
   * @param walletId - Wallet identifier.
   * @param guardian - Guardian to add.
   * @returns Updated Guardian count.
   */
  addGuardian(walletId: string, guardian: Guardian): number {
    const config = this.getConfig(walletId);
    validateGuardian(guardian);

    if (config.guardians.some((g) => g.id === guardian.id)) {
      throw new Error(`Guardian ${guardian.id} already exists`);
    }

    if (config.guardians.length >= MAX_GUARDIANS) {
      throw new Error(`Maximum ${MAX_GUARDIANS} guardians allowed`);
    }

    const now = nowSeconds();
    const newGuardian: Guardian = { ...guardian, active: true, addedAt: now };
    config.guardians.push(newGuardian);

    const activeCount = config.guardians.filter((g) => g.active).length;
    if (config.threshold > activeCount) {
      // Auto-adjust threshold if it exceeds active count
      config.threshold = Math.max(1, activeCount);
    }

    // Track addition
    let addedMap = this.guardianAddedAt.get(walletId);
    if (!addedMap) {
      addedMap = new Map();
      this.guardianAddedAt.set(walletId, addedMap);
    }
    addedMap.set(newGuardian.id, now);

    this.logEvent({
      type: 'guardian-added',
      recoveryId: null,
      actor: guardian.id,
      timestamp: now,
      data: { walletId, guardianId: guardian.id, guardianType: guardian.type },
    }, null);

    // Notify the new guardian
    this.options.notify('recovery-initiated', newGuardian, {
      walletId,
      action: 'added-as-guardian',
    });

    return activeCount;
  }

  /**
   * Remove a Guardian from a wallet's Guardian set.
   *
   * @param walletId - Wallet identifier.
   * @param guardianId - Guardian ID to remove.
   * @returns Remaining active Guardian count.
   */
  removeGuardian(walletId: string, guardianId: string): number {
    const config = this.getConfig(walletId);

    const idx = config.guardians.findIndex((g) => g.id === guardianId);
    if (idx === -1) {
      throw new Error(`Guardian ${guardianId} not found`);
    }

    const activeCount = config.guardians.filter((g) => g.active && g.id !== guardianId).length;
    if (config.threshold > activeCount) {
      throw new Error(
        `Cannot remove: would leave ${activeCount} active guardians, below threshold of ${config.threshold}`
      );
    }

    config.guardians.splice(idx, 1);

    this.logEvent({
      type: 'guardian-removed',
      recoveryId: null,
      actor: guardianId,
      timestamp: nowSeconds(),
      data: { walletId, guardianId },
    }, null);

    return activeCount;
  }

  /**
   * Get the Guardian list for a wallet.
   *
   * @param walletId - Wallet identifier.
   * @returns Array of Guardians (active first).
   */
  getGuardians(walletId: string): Guardian[] {
    const config = this.getConfig(walletId);
    return [...config.guardians].sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      return 0;
    });
  }

  /**
   * Deactivate a Guardian (soft removal, keeps in history).
   *
   * @param walletId - Wallet identifier.
   * @param guardianId - Guardian ID to deactivate.
   */
  deactivateGuardian(walletId: string, guardianId: string): void {
    const config = this.getConfig(walletId);
    const guardian = config.guardians.find((g) => g.id === guardianId);
    if (!guardian) {
      throw new Error(`Guardian ${guardianId} not found`);
    }

    const activeCount = config.guardians.filter((g) => g.active && g.id !== guardianId).length;
    if (config.threshold > activeCount) {
      throw new Error(
        `Cannot deactivate: would leave ${activeCount} active guardians, below threshold of ${config.threshold}`
      );
    }

    guardian.active = false;

    this.logEvent({
      type: 'guardian-removed',
      recoveryId: null,
      actor: guardianId,
      timestamp: nowSeconds(),
      data: { walletId, guardianId, action: 'deactivated' },
    }, null);
  }

  /**
   * Get Guardian count for a wallet.
   */
  getGuardianCount(walletId: string): number {
    const config = this.getConfig(walletId);
    return config.guardians.filter((g) => g.active).length;
  }

  /**
   * Get Guardian configuration for a wallet.
   */
  getGuardianConfig(walletId: string): GuardianSetConfig {
    return { ...this.getConfig(walletId), guardians: [...this.getConfig(walletId).guardians] };
  }

  // ─── Recovery Lifecycle ─────────────────────────────────────────────

  /**
   * Initiate a wallet recovery request.
   *
   * Creates a new recovery request that Guardians must approve.
   * The request starts in 'initiated' status.
   *
   * @param params - Recovery initiation parameters.
   * @returns The created RecoveryRequest.
   */
  initiateRecovery(params: InitiateRecoveryParams): RecoveryRequest {
    const config = this.getConfig(params.walletId);
    const activeGuardians = config.guardians.filter((g) => g.active);

    if (activeGuardians.length === 0) {
      throw new Error('No active guardians for this wallet');
    }

    const now = nowSeconds();

    // Check for existing active recovery
    for (const [, req] of this.requests) {
      if (
        req.walletId === params.walletId &&
        req.status === 'initiated'
      ) {
        throw new Error(
          `Recovery already in progress for wallet ${params.walletId}: ${req.recoveryId}`
        );
      }
    }

    const recoveryId = generateRecoveryId();
    const request: RecoveryRequest = {
      recoveryId,
      walletId: params.walletId,
      currentOwner: params.currentOwner,
      newOwner: params.newOwner,
      status: 'initiated',
      approvals: [],
      threshold: config.threshold,
      totalGuardians: activeGuardians.length,
      initiatedAt: now,
      approvedAt: null,
      completedAt: null,
      delaySeconds: config.delaySeconds,
      timeoutSeconds: config.timeoutSeconds,
      riskScore: 0,
    };

    this.requests.set(recoveryId, request);
    this.events.set(recoveryId, []);

    // Track attempt
    this.trackAttempt(params.walletId, now);

    // Initial risk assessment
    request.riskScore = this.assessRisk(request, config);

    this.logEvent({
      type: 'recovery-initiated',
      recoveryId,
      actor: params.initiatedBy,
      timestamp: now,
      data: {
        walletId: params.walletId,
        newOwner: params.newOwner,
        threshold: config.threshold,
        totalGuardians: activeGuardians.length,
      },
    }, recoveryId);

    // Notify all guardians
    for (const guardian of activeGuardians) {
      this.options.notify('recovery-initiated', guardian, {
        recoveryId,
        walletId: params.walletId,
        currentOwner: params.currentOwner,
        newOwner: params.newOwner,
      });
    }

    // Check if already blocked by risk
    if (request.riskScore >= BLOCK_THRESHOLD) {
      request.status = 'blocked';
      this.logEvent({
        type: 'recovery-blocked',
        recoveryId,
        actor: 'security-module',
        timestamp: now,
        data: { riskScore: request.riskScore, reason: 'high_risk_score' },
      }, recoveryId);
    }

    return { ...request };
  }

  /**
   * Guardian approves a recovery request.
   *
   * @param recoveryId - Recovery request ID.
   * @param guardianId - Approving Guardian ID.
   * @param signature - Guardian's signature (hex-encoded).
   * @returns Updated RecoveryRequest.
   */
  guardianApprove(recoveryId: string, guardianId: string, signature: string): RecoveryRequest {
    const request = this.getRequest(recoveryId);
    const config = this.getConfig(request.walletId);

    if (request.status !== 'initiated') {
      throw new Error(
        `Cannot approve: recovery is ${request.status}, not initiated`
      );
    }

    // Verify guardian is in the set
    const guardian = config.guardians.find((g) => g.id === guardianId);
    if (!guardian) {
      throw new Error(`Guardian ${guardianId} is not in the guardian set`);
    }
    if (!guardian.active) {
      throw new Error(`Guardian ${guardianId} is not active`);
    }

    // Check for duplicate approval
    if (request.approvals.includes(guardianId)) {
      throw new Error(`Guardian ${guardianId} has already approved`);
    }

    // Signature validation (basic: non-empty)
    if (!signature || signature.length < 2) {
      throw new Error('Invalid signature');
    }

    request.approvals.push(guardianId);

    this.logEvent({
      type: 'guardian-approved',
      recoveryId,
      actor: guardianId,
      timestamp: nowSeconds(),
      data: { guardianType: guardian.type, totalApprovals: request.approvals.length },
    }, recoveryId);

    // Notify remaining guardians
    const activeGuardians = config.guardians.filter(
      (g) => g.active && !request.approvals.includes(g.id)
    );
    for (const g of activeGuardians) {
      this.options.notify('guardian-approval-needed', g, {
        recoveryId,
        approvalsSoFar: request.approvals.length,
        threshold: request.threshold,
      });
    }

    // Check threshold
    if (request.approvals.length >= request.threshold) {
      request.status = 'approved';
      request.approvedAt = nowSeconds();

      // Re-assess risk after threshold reached
      request.riskScore = this.assessRisk(request, config);

      this.logEvent({
        type: 'threshold-reached',
        recoveryId,
        actor: 'system',
        timestamp: request.approvedAt,
        data: { approvals: request.approvals.length, threshold: request.threshold },
      }, recoveryId);
    }

    return { ...request };
  }

  /**
   * Execute a recovery after the delay period has passed.
   *
   * @param recoveryId - Recovery request ID.
   * @param newOwner - Confirmed new owner address.
   * @returns Updated RecoveryRequest.
   */
  executeRecovery(recoveryId: string, newOwner: string): RecoveryRequest {
    const request = this.getRequest(recoveryId);

    if (request.status !== 'approved') {
      throw new Error(
        `Cannot execute: recovery is ${request.status}, not approved`
      );
    }

    // Verify delay period has passed
    const canExec = this.checkCanExecute(request);
    if (!canExec) {
      throw new Error(
        `Delay period not yet complete. ${this.getTimeRemaining(request)} seconds remaining.`
      );
    }

    // Verify new owner matches
    if (request.newOwner.toLowerCase() !== newOwner.toLowerCase()) {
      throw new Error('New owner address does not match recovery request');
    }

    request.status = 'executed';
    request.completedAt = nowSeconds();

    this.logEvent({
      type: 'recovery-executed',
      recoveryId,
      actor: newOwner,
      timestamp: request.completedAt,
      data: { walletId: request.walletId, previousOwner: request.currentOwner },
    }, recoveryId);

    // Notify all guardians
    const config = this.getConfig(request.walletId);
    for (const guardian of config.guardians.filter((g) => g.active)) {
      this.options.notify('recovery-executed', guardian, {
        recoveryId,
        walletId: request.walletId,
        newOwner,
      });
    }

    return { ...request };
  }

  /**
   * Cancel a recovery request.
   *
   * Can be called by the current owner or any guardian.
   *
   * @param recoveryId - Recovery request ID.
   * @param cancelledBy - Actor cancelling the recovery.
   * @returns Updated RecoveryRequest.
   */
  cancelRecovery(recoveryId: string, cancelledBy: string): RecoveryRequest {
    const request = this.getRequest(recoveryId);

    if (request.status === 'executed' || request.status === 'cancelled') {
      throw new Error(`Cannot cancel: recovery is ${request.status}`);
    }

    request.status = 'cancelled';
    request.completedAt = nowSeconds();

    this.logEvent({
      type: 'recovery-cancelled',
      recoveryId,
      actor: cancelledBy,
      timestamp: request.completedAt,
    }, recoveryId);

    return { ...request };
  }

  /**
   * Query the status of a recovery request.
   *
   * Includes delay/timeout remaining and whether execution is currently possible.
   * Also checks for timeout and auto-cancels if expired.
   *
   * @param recoveryId - Recovery request ID.
   * @returns RecoveryStatusResult with request details and execution eligibility.
   */
  getRecoveryStatus(recoveryId: string): RecoveryStatusResult {
    const request = this.getRequest(recoveryId);

    // Check for timeout
    this.checkTimeout(request);

    // Recalculate risk score
    const config = this.getConfig(request.walletId);
    request.riskScore = this.assessRisk(request, config);

    const events = this.events.get(recoveryId) || [];
    const delayRemaining = request.approvedAt
      ? Math.max(0, request.delaySeconds - (nowSeconds() - request.approvedAt))
      : 0;
    const timeoutRemaining = Math.max(
      0,
      request.timeoutSeconds - (nowSeconds() - request.initiatedAt)
    );
    const canExecute =
      request.status === 'approved' &&
      delayRemaining === 0 &&
      timeoutRemaining > 0;

    return {
      request: { ...request },
      events: [...events],
      delayRemaining,
      timeoutRemaining,
      canExecute,
    };
  }

  /**
   * List all active recovery requests for a wallet.
   *
   * @param walletId - Wallet identifier.
   * @returns Array of non-terminal recovery requests.
   */
  listActiveRecoveries(walletId: string): RecoveryRequest[] {
    const results: RecoveryRequest[] = [];
    for (const [, req] of this.requests) {
      if (
        req.walletId === walletId &&
        req.status !== 'executed' &&
        req.status !== 'cancelled' &&
        req.status !== 'blocked'
      ) {
        this.checkTimeout(req);
        results.push({ ...req });
      }
    }
    return results;
  }

  // ─── Security Module ────────────────────────────────────────────────

  /**
   * Check and auto-cancel any recovery requests that have timed out.
   *
   * Should be called periodically or before any recovery operation.
   *
   * @param walletId - Optional: only check this wallet.
   * @returns Number of timed-out recoveries cancelled.
   */
  processTimeouts(walletId?: string): number {
    let cancelled = 0;
    const now = nowSeconds();

    for (const [id, req] of this.requests) {
      if (walletId && req.walletId !== walletId) continue;
      if (
        req.status === 'initiated' ||
        req.status === 'approved'
      ) {
        if (now - req.initiatedAt >= req.timeoutSeconds) {
          req.status = 'cancelled';
          req.completedAt = now;
          cancelled++;

          this.logEvent({
            type: 'recovery-timed-out',
            recoveryId: id,
            actor: 'system',
            timestamp: now,
            data: {
              walletId: req.walletId,
              elapsedSeconds: now - req.initiatedAt,
              timeoutSeconds: req.timeoutSeconds,
            },
          }, id);
        }
      }
    }

    return cancelled;
  }

  /**
   * Block a recovery request due to security concerns.
   *
   * @param recoveryId - Recovery request ID.
   * @param reason - Reason for blocking.
   */
  blockRecovery(recoveryId: string, reason: string): void {
    const request = this.getRequest(recoveryId);

    if (request.status === 'executed' || request.status === 'cancelled') {
      throw new Error(`Cannot block: recovery is ${request.status}`);
    }

    request.status = 'blocked';
    request.completedAt = nowSeconds();
    request.riskScore = MAX_RISK_SCORE;

    this.logEvent({
      type: 'recovery-blocked',
      recoveryId,
      actor: 'security-module',
      timestamp: request.completedAt,
      data: { reason, walletId: request.walletId },
    }, recoveryId);

    const config = this.getConfig(request.walletId);
    for (const guardian of config.guardians.filter((g) => g.active)) {
      this.options.notify('recovery-blocked', guardian, {
        recoveryId,
        reason,
        walletId: request.walletId,
      });
    }
  }

  /**
   * Get the event log for a recovery request.
   *
   * @param recoveryId - Recovery request ID.
   * @returns Array of events (empty array if not found).
   */
  getEvents(recoveryId: string): RecoveryEvent[] {
    return [...(this.events.get(recoveryId) || [])];
  }

  /**
   * Update the delay period for future recovery requests.
   *
   * @param walletId - Wallet identifier.
   * @param delaySeconds - New delay period in seconds.
   */
  setDelayPeriod(walletId: string, delaySeconds: number): void {
    const config = this.getConfig(walletId);
    config.delaySeconds = clamp(delaySeconds, MIN_DELAY_SECONDS, MAX_DELAY_SECONDS);
  }

  // ─── Internal Methods ───────────────────────────────────────────────

  private getConfig(walletId: string): GuardianSetConfig {
    const config = this.guardianSets.get(walletId);
    if (!config) {
      throw new Error(`No guardian set configured for wallet: ${walletId}`);
    }
    return config;
  }

  private getRequest(recoveryId: string): RecoveryRequest {
    const request = this.requests.get(recoveryId);
    if (!request) {
      throw new Error(`Recovery request not found: ${recoveryId}`);
    }
    return request;
  }

  private logEvent(event: RecoveryEvent, recoveryId: string | null): void {
    if (recoveryId) {
      let eventList = this.events.get(recoveryId);
      if (!eventList) {
        eventList = [];
        this.events.set(recoveryId, eventList);
      }
      eventList.push(event);
    } else {
      // Wallet-level events don't have a recoveryId
      // Store with a special key
      const walletKey = event.data?.walletId as string | undefined;
      if (walletKey) {
        const walletEventsKey = `wallet:${walletKey}`;
        let eventList = this.events.get(walletEventsKey);
        if (!eventList) {
          eventList = [];
          this.events.set(walletEventsKey, eventList);
        }
        eventList.push(event);
      }
    }
  }

  private trackAttempt(walletId: string, timestamp: number): void {
    let attempts = this.recentAttempts.get(walletId) || [];
    // Keep last 24 hours of attempts
    const cutoff = timestamp - 86400;
    attempts = attempts.filter((t) => t > cutoff);
    attempts.push(timestamp);
    this.recentAttempts.set(walletId, attempts);
  }

  private assessRisk(request: RecoveryRequest, config: GuardianSetConfig): number {
    // Don't recalculate for terminal states
    if (request.status === 'executed' || request.status === 'cancelled' || request.status === 'blocked') {
      return request.riskScore;
    }

    const walletAttempts = this.recentAttempts.get(request.walletId) || [];
    const recentCount = walletAttempts.filter(
      (t) => nowSeconds() - t < 86400
    ).length;

    const guardianAgeMap = this.guardianAddedAt.get(request.walletId) || new Map();

    return calculateRiskScore(request, config, recentCount, guardianAgeMap);
  }

  private checkCanExecute(request: RecoveryRequest): boolean {
    if (request.status !== 'approved' || !request.approvedAt) return false;
    const elapsed = nowSeconds() - request.approvedAt;
    return elapsed >= request.delaySeconds;
  }

  private getTimeRemaining(request: RecoveryRequest): number {
    if (!request.approvedAt) return 0;
    const elapsed = nowSeconds() - request.approvedAt;
    return Math.max(0, request.delaySeconds - elapsed);
  }

  private checkTimeout(request: RecoveryRequest): void {
    if (
      (request.status === 'initiated' || request.status === 'approved') &&
      nowSeconds() - request.initiatedAt > request.timeoutSeconds
    ) {
      request.status = 'cancelled';
      request.completedAt = nowSeconds();

      this.logEvent({
        type: 'recovery-timed-out',
        recoveryId: request.recoveryId,
        actor: 'system',
        timestamp: request.completedAt!,
        data: { walletId: request.walletId },
      }, request.recoveryId);
    }
  }
}
