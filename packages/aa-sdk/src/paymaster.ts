/**
 * PaymasterClient — Full ERC-4337 paymaster client with sponsorship policies,
 * validation, estimation, multi-paymaster failover, and event emission.
 *
 * Communicates with one or more paymaster endpoints over HTTP POST to:
 *   - Sponsor user operations (return paymasterAndData)
 *   - Get gas limits
 *   - Check sponsorship eligibility
 *   - Estimate sponsorship costs
 *   - Validate paymaster deposits
 *   - Emit events for sponsorship lifecycle
 *
 * Supports sponsorship policies:
 *   - free-tier: unlimited gasless sponsorship
 *   - gas-limit: cap total gas per operation
 *   - whitelist: only specific sender addresses eligible
 *   - blacklist: specific sender addresses excluded
 *
 * Designed for comparison with Reown's Paymaster integration.
 */

import type { Hex, Address } from 'viem';
import type {
import { logger } from '@cinacoin/logger';
  PaymasterConfig,
  PaymasterRequest,
  PaymasterResponse,
  UserOperation,
} from './types.js';

// ── Error Types ──────────────────────────────────────────────────────

/** Base error for all paymaster-related failures. */
export class PaymasterError extends Error {
  readonly code: string;
  readonly cause?: Error;

  constructor(code: string, message: string, cause?: Error) {
    super(message);
    this.name = 'PaymasterError';
    this.code = code;
    this.cause = cause;
  }
}

/** Paymaster has insufficient deposit to cover sponsorship. */
export class InsufficientDepositError extends PaymasterError {
  readonly required: bigint;
  readonly available: bigint;

  constructor(required: bigint, available: bigint) {
    super(
      'INSUFFICIENT_DEPOSIT',
      `Paymaster deposit insufficient: required ${required}, available ${available}`,
    );
    this.required = required;
    this.available = available;
  }
}

/** UserOperation is not eligible for sponsorship under current policy. */
export class SponsorshipIneligibleError extends PaymasterError {
  readonly reason: string;
  readonly sender?: Address;

  constructor(reason: string, sender?: Address) {
    super('SPONSORSHIP_INELIGIBLE', reason);
    this.reason = reason;
    this.sender = sender;
  }
}

/** No paymaster in the pool could handle the request. */
export class AllPaymastersFailedError extends PaymasterError {
  readonly errors: Error[];

  constructor(errors: Error[]) {
    super(
      'ALL_PAYMASTERS_FAILED',
      `All ${errors.length} paymaster(s) failed: ${errors.map((e) => e.message).join('; ')}`,
    );
    this.errors = errors;
  }
}

/** Paymaster RPC call failed with an unexpected status. */
export class PaymasterRpcError extends PaymasterError {
  readonly httpStatus?: number;
  readonly rpcCode?: number;

  constructor(message: string, httpStatus?: number, rpcCode?: number) {
    super('RPC_ERROR', message);
    this.httpStatus = httpStatus;
    this.rpcCode = rpcCode;
  }
}

/** Paymaster configuration is invalid. */
export class PaymasterConfigError extends PaymasterError {
  constructor(field: string, message: string) {
    super('CONFIG_ERROR', `Invalid config for "${field}": ${message}`);
  }
}

// ── Sponsorship Policies ─────────────────────────────────────────────

/** Type of sponsorship policy. */
export type SponsorshipPolicyType = 'free-tier' | 'gas-limit' | 'whitelist' | 'blacklist';

/** Base sponsorship policy. */
export interface BaseSponsorshipPolicy {
  type: SponsorshipPolicyType;
  /** Optional human-readable name for the policy. */
  name?: string;
}

/** Free-tier policy: no restrictions. */
export interface FreeTierPolicy extends BaseSponsorshipPolicy {
  type: 'free-tier';
}

/** Gas-limit policy: cap gas per operation or per time window. */
export interface GasLimitPolicy extends BaseSponsorshipPolicy {
  type: 'gas-limit';
  /** Maximum gas units allowed per UserOperation. */
  maxGasPerOp: bigint;
  /** Optional: maximum total gas per time window (in ms). */
  maxGasPerWindow?: bigint;
  /** Time window in milliseconds (default: 1 hour). */
  windowMs?: number;
}

/** Whitelist policy: only listed senders are eligible. */
export interface WhitelistPolicy extends BaseSponsorshipPolicy {
  type: 'whitelist';
  /** Addresses that are eligible for sponsorship. */
  allowedSenders: Set<Address>;
}

/** Blacklist policy: listed senders are excluded. */
export interface BlacklistPolicy extends BaseSponsorshipPolicy {
  type: 'blacklist';
  /** Addresses that are NOT eligible for sponsorship. */
  blockedSenders: Set<Address>;
}

/** Union of all sponsorship policy types. */
export type SponsorshipPolicy =
  | FreeTierPolicy
  | GasLimitPolicy
  | WhitelistPolicy
  | BlacklistPolicy;

// ── Events ───────────────────────────────────────────────────────────

/** Event types emitted by PaymasterClient. */
export type PaymasterEventType =
  | 'sponsorship_requested'
  | 'sponsorship_approved'
  | 'sponsorship_rejected'
  | 'sponsorship_failed'
  | 'deposit_checked'
  | 'policy_evaluated'
  | 'paymaster_activated'
  | 'paymaster_deactivated';

/** Base event emitted by the paymaster client. */
export interface PaymasterEvent<T = unknown> {
  type: PaymasterEventType;
  timestamp: number;
  data: T;
}

/** Sponsorship was requested. */
export interface SponsorshipRequestedEvent
  extends PaymasterEvent<{ userOp: UserOperation; chainId: number }> {}

/** Sponsorship was approved and paymasterAndData filled. */
export interface SponsorshipApprovedEvent
  extends PaymasterEvent<{
    userOpHash: Hex;
    paymasterAndData: Hex;
    estimatedCost: bigint;
    policyType: SponsorshipPolicyType;
  }> {}

/** Sponsorship was rejected due to policy. */
export interface SponsorshipRejectedEvent
  extends PaymasterEvent<{
    userOp: UserOperation;
    reason: string;
    policyType: SponsorshipPolicyType;
  }> {}

/** Sponsorship failed due to RPC or other error. */
export interface SponsorshipFailedEvent
  extends PaymasterEvent<{
    error: Error;
    userOp: UserOperation;
  }> {}

/** Paymaster deposit check result. */
export interface DepositCheckedEvent
  extends PaymasterEvent<{
    available: bigint;
    required: bigint;
    sufficient: boolean;
  }> {}

/** Policy evaluation result. */
export interface PolicyEvaluatedEvent
  extends PaymasterEvent<{
    policyType: SponsorshipPolicyType;
    eligible: boolean;
    sender: Address;
  }> {}

/** Callback type for event listeners. */
export type PaymasterEventListener = (event: PaymasterEvent) => void;

// ── Gas Tracking (for gas-limit policy) ──────────────────────────────

interface GasWindowEntry {
  used: bigint;
  windowStart: number;
}

// ── Paymaster Entry (for multi-paymaster) ────────────────────────────

/** Paymaster entry for the router. */
export interface PmRouterEntry {
  /** Unique identifier for this paymaster. */
  id: string;
  /** PaymasterClient instance. */
  client: PaymasterClient;
  /** Whether currently active. */
  active: boolean;
  /** Supported chain IDs (empty = all). */
  chains: number[];
  /** Priority weight (higher = preferred). */
  priority: number;
}

/** Routing result from the PaymasterRouter. */
export interface PmRoutingResult {
  /** Selected paymaster ID. */
  id: string;
  /** Response from the selected paymaster. */
  response: PaymasterResponse;
  /** Whether fallback was used. */
  usedFallback: boolean;
}

// ── Extended Paymaster Config ────────────────────────────────────────

/** Extended configuration for PaymasterClient. */
export interface ExtendedPaymasterConfig extends PaymasterConfig {
  /** Sponsorship policies to apply (order matters — first match wins). */
  policies?: SponsorshipPolicy[];
  /** Enable deposit validation before sponsoring. */
  validateDeposit?: boolean;
  /** Minimum deposit required (in wei). Only checked if validateDeposit is true. */
  minDeposit?: bigint;
  /** Enable event emission. */
  emitEvents?: boolean;
  /** Optional RPC request timeout in milliseconds. */
  requestTimeoutMs?: number;
  /** Number of retries on transient failures. */
  maxRetries?: number;
  /** Delay between retries in milliseconds. */
  retryDelayMs?: number;
}

// ── Sponsorship Estimate ─────────────────────────────────────────────

/** Result of sponsorship cost estimation. */
export interface SponsorshipEstimate {
  /** Estimated preVerificationGas. */
  preVerificationGas: bigint;
  /** Estimated verificationGasLimit. */
  verificationGasLimit: bigint;
  /** Estimated callGasLimit. */
  callGasLimit: bigint;
  /** Total gas units (sum of all three). */
  totalGas: bigint;
  /** Estimated cost in wei (totalGas × maxFeePerGas from the userOp). */
  estimatedCostWei: bigint;
  /** Estimated cost in the paymaster's native token (same as wei for ETH-like chains). */
  estimatedCostNative: bigint;
}

// ── Deposit Info ─────────────────────────────────────────────────────

/** Paymaster deposit information. */
export interface PaymasterDepositInfo {
  /** Available deposit balance (wei). */
  balance: bigint;
  /** Whether the deposit meets the configured minimum. */
  sufficient: boolean;
  /** Configured minimum deposit (wei). */
  minRequired: bigint;
}

// ── Main Client ──────────────────────────────────────────────────────

/**
 * PaymasterClient — full-featured ERC-4337 paymaster client.
 *
 * Features:
 * - Sponsorship policies (free-tier, gas-limit, whitelist, blacklist)
 * - Paymaster deposit validation
 * - UserOperation paymasterAndData filling
 * - Multi-paymaster failover (via PaymasterRouter)
 * - Sponsorship cost estimation
 * - Typed error classes
 * - Event emission for sponsorship lifecycle
 *
 * ```ts
 * const pm = new PaymasterClient({
 *   url: 'https://paymaster.example.com/rpc',
 *   apiKey: 'pk_...',
 *   sponsorType: 'gasless',
 *   policies: [{ type: 'whitelist', allowedSenders: new Set(['0x...']) }],
 *   validateDeposit: true,
 *   minDeposit: 10n * 10n ** 18n, // 10 ETH
 *   emitEvents: true,
 * });
 *
 * pm.on('sponsorship_approved', (e) => logger.info('Sponsored!', e.data));
 *
 * const result = await pm.sponsor({ userOperation, entryPoint, chainId });
 * ```
 */
export class PaymasterClient {
  private readonly url: string;
  private readonly apiKey?: string;
  readonly sponsorType: 'gasless' | 'partial' | 'post-pay';

  // Policies
  private policies: SponsorshipPolicy[];

  // Deposit validation
  private validateDeposit: boolean;
  private minDeposit: bigint;
  private cachedDeposit: PaymasterDepositInfo | null = null;
  private depositLastChecked = 0;
  private depositCacheTtlMs = 60_000; // 1 minute cache

  // Events
  private emitEvents: boolean;
  private listeners = new Map<PaymasterEventType, Set<PaymasterEventListener>>();

  // Retry
  private maxRetries: number;
  private retryDelayMs: number;
  private requestTimeoutMs: number;

  // Gas tracking (for gas-limit policy)
  private gasWindows = new Map<string, GasWindowEntry>();

  constructor(config: ExtendedPaymasterConfig) {
    this.url = config.url;
    this.apiKey = config.apiKey;
    this.sponsorType = config.sponsorType;

    // Policies
    this.policies = config.policies ?? [{ type: 'free-tier' }];

    // Deposit validation
    this.validateDeposit = config.validateDeposit ?? false;
    this.minDeposit = config.minDeposit ?? 0n;

    // Events
    this.emitEvents = config.emitEvents ?? false;

    // Retry
    this.maxRetries = config.maxRetries ?? 0;
    this.retryDelayMs = config.retryDelayMs ?? 1_000;
    this.requestTimeoutMs = config.requestTimeoutMs ?? 30_000;

    // Validate config
    if (!this.url) {
      throw new PaymasterConfigError('url', 'Paymaster URL is required');
    }
    if (this.policies.length === 0) {
      throw new PaymasterConfigError('policies', 'At least one policy is required');
    }
  }

  // ── Sponsorship ──────────────────────────────────────────────────

  /**
   * Sponsor a user operation.
   *
   * Pipeline:
   * 1. Evaluate sponsorship policies — reject if ineligible
   * 2. Optionally validate paymaster deposit
   * 3. Call the paymaster RPC to get paymasterAndData
   * 4. Emit sponsorship events
   *
   * Sends a POST request to the paymaster endpoint with the UserOperation
   * and returns paymasterAndData to embed in the UserOperation.
   */
  async sponsor(request: PaymasterRequest): Promise<PaymasterResponse> {
    const userOp = request.userOperation;
    const policyType = this.policies[0]?.type ?? 'free-tier';

    // Emit: sponsorship requested
    this._emit('sponsorship_requested', {
      userOp,
      chainId: request.chainId,
    });

    // Step 1: Policy evaluation
    const eligible = this._evaluatePolicies(userOp);
    if (!eligible) {
      const activePolicy = this._getActivePolicy(userOp);
      const reason = this._getRejectionReason(userOp, activePolicy);

      this._emit('sponsorship_rejected', {
        userOp,
        reason,
        policyType: activePolicy.type,
      });

      throw new SponsorshipIneligibleError(reason, userOp.sender);
    }

    this._emit('policy_evaluated', {
      policyType,
      eligible: true,
      sender: userOp.sender,
    });

    // Step 2: Deposit validation (if enabled)
    if (this.validateDeposit) {
      const deposit = await this.checkDeposit();
      if (!deposit.sufficient) {
        this._emit('deposit_checked', {
          available: deposit.balance,
          required: deposit.minRequired,
          sufficient: false,
        });
        throw new InsufficientDepositError(deposit.minRequired, deposit.balance);
      }
    }

    // Step 3: RPC call (with retries)
    let result: {
      paymasterAndData: Hex;
      preVerificationGas?: Hex;
      verificationGasLimit?: Hex;
      callGasLimit?: Hex;
    };

    try {
      result = await this._rpcWithRetry<{
        paymasterAndData: Hex;
        preVerificationGas?: Hex;
        verificationGasLimit?: Hex;
        callGasLimit?: Hex;
      }>('pm_sponsorUserOperation', [
        serializeUserOp(request.userOperation),
        request.entryPoint,
        request.chainId,
      ]);
    } catch (err) {
      this._emit('sponsorship_failed', {
        error: err instanceof Error ? err : new Error(String(err)),
        userOp,
      });
      throw err;
    }

    // Step 4: Build response
    const response: PaymasterResponse = {
      paymasterAndData: result.paymasterAndData,
    };
    if (result.preVerificationGas)
      response.preVerificationGas = BigInt(result.preVerificationGas);
    if (result.verificationGasLimit)
      response.verificationGasLimit = BigInt(result.verificationGasLimit);
    if (result.callGasLimit)
      response.callGasLimit = BigInt(result.callGasLimit);

    // Track gas usage for gas-limit policy
    this._trackGasUsage(userOp.sender, response);

    // Calculate estimated cost for event
    const estimatedCost = this._calculateCost(response, userOp);

    // Emit: sponsorship approved
    this._emit('sponsorship_approved', {
      userOpHash: this._hashUserOp(userOp),
      paymasterAndData: response.paymasterAndData,
      estimatedCost,
      policyType,
    });

    return response;
  }

  /**
   * Check whether the paymaster can sponsor a given operation.
   * Evaluates policies without making an RPC call.
   */
  canSponsor(request: PaymasterRequest): boolean {
    return this._evaluatePolicies(request.userOperation);
  }

  // ── Gas Limits ───────────────────────────────────────────────────

  /**
   * Get paymaster gas limits for a user operation.
   */
  async getGasLimits(
    userOp: UserOperation,
    entryPoint: Address,
    chainId: number,
  ): Promise<{
    verificationGasLimit: bigint;
    callGasLimit: bigint;
    preVerificationGas: bigint;
  }> {
    const result = await this._rpcWithRetry<{
      preVerificationGas: Hex;
      verificationGasLimit: Hex;
      callGasLimit: Hex;
    }>('pm_getGasLimits', [
      serializeUserOp(userOp),
      entryPoint,
      chainId,
    ]);
    return {
      preVerificationGas: BigInt(result.preVerificationGas),
      verificationGasLimit: BigInt(result.verificationGasLimit),
      callGasLimit: BigInt(result.callGasLimit),
    };
  }

  // ── Sponsorship Estimation ───────────────────────────────────────

  /**
   * Estimate sponsorship cost before actually sponsoring.
   *
   * Calls pm_getGasLimits to get the paymaster's gas estimates,
   * then calculates the expected cost in wei.
   *
   * This allows the caller to check affordability before committing.
   */
  async estimateSponsorship(
    userOp: Partial<UserOperation> & { sender: Address },
    entryPoint: Address,
    chainId: number,
  ): Promise<SponsorshipEstimate> {
    const result = await this._rpcWithRetry<{
      preVerificationGas: Hex;
      verificationGasLimit: Hex;
      callGasLimit: Hex;
    }>('pm_getGasLimits', [
      serializePartialUserOp(userOp),
      entryPoint,
      chainId,
    ]);

    const preVerificationGas = BigInt(result.preVerificationGas);
    const verificationGasLimit = BigInt(result.verificationGasLimit);
    const callGasLimit = BigInt(result.callGasLimit);
    const totalGas = preVerificationGas + verificationGasLimit + callGasLimit;

    // Use provided gas prices or defaults
    const maxFeePerGas = userOp.maxFeePerGas ?? 20_000_000_000n;
    const estimatedCostWei = totalGas * maxFeePerGas;

    return {
      preVerificationGas,
      verificationGasLimit,
      callGasLimit,
      totalGas,
      estimatedCostWei,
      estimatedCostNative: estimatedCostWei,
    };
  }

  // ── Paymaster Validation ─────────────────────────────────────────

  /**
   * Check the paymaster's deposit balance.
   *
   * Calls pm_getDepositBalance on the paymaster endpoint.
   * Results are cached for depositCacheTtlMs to avoid excessive RPC calls.
   */
  async checkDeposit(): Promise<PaymasterDepositInfo> {
    const now = Date.now();

    // Return cached result if still valid
    if (
      this.cachedDeposit &&
      now - this.depositLastChecked < this.depositCacheTtlMs
    ) {
      return this.cachedDeposit;
    }

    let balance: bigint;
    try {
      const result = await this._rpcWithRetry<{ balance: Hex }>(
        'pm_getDepositBalance',
        [],
      );
      balance = BigInt(result.balance);
    } catch {
      // If the paymaster doesn't support this method, assume sufficient
      // (degrades gracefully)
      balance = this.minDeposit + 1n;
    }

    const sufficient = balance >= this.minDeposit;
    this.cachedDeposit = {
      balance,
      sufficient,
      minRequired: this.minDeposit,
    };
    this.depositLastChecked = now;

    this._emit('deposit_checked', {
      available: balance,
      required: this.minDeposit,
      sufficient,
    });

    return this.cachedDeposit;
  }

  /**
   * Verify that the paymaster's paymasterAndData is valid for a userOp.
   * Checks that paymasterAndData is non-empty and properly formatted.
   */
  verifyPaymasterData(paymasterAndData: Hex): boolean {
    if (!paymasterAndData || paymasterAndData === '0x') {
      return false;
    }
    // paymasterAndData should be at least 20 bytes (paymaster address)
    return paymasterAndData.length >= 42; // 0x + 40 hex chars
  }

  /**
   * Verify a userOp's signature is present and non-empty.
   */
  verifyUserOpSignature(userOp: UserOperation): boolean {
    if (!userOp.signature || userOp.signature === '0x') {
      return false;
    }
    return true;
  }

  /**
   * Fill the paymasterAndData field on a UserOperation.
   * Returns a new UserOperation with the field populated.
   */
  fillPaymasterData(
    userOp: UserOperation,
    paymasterAndData: Hex,
  ): UserOperation {
    return {
      ...userOp,
      paymasterAndData,
    };
  }

  // ── Policy Management ────────────────────────────────────────────

  /**
   * Add a sponsorship policy. New policies are appended and evaluated
   * after existing ones.
   */
  addPolicy(policy: SponsorshipPolicy): void {
    this.policies.push(policy);
  }

  /**
   * Remove all policies and set a new set.
   */
  setPolicies(policies: SponsorshipPolicy[]): void {
    if (policies.length === 0) {
      throw new PaymasterConfigError('policies', 'At least one policy is required');
    }
    this.policies = policies;
  }

  /**
   * Get all configured policies.
   */
  getPolicies(): ReadonlyArray<SponsorshipPolicy> {
    return [...this.policies];
  }

  /**
   * Get the active (first matching) policy for a given sender.
   */
  getActivePolicy(sender: Address): SponsorshipPolicy | null {
    return this._getActivePolicy({ sender } as UserOperation);
  }

  /**
   * Clear gas usage tracking for a specific sender.
   */
  clearGasTracking(sender: Address): void {
    this.gasWindows.delete(sender.toLowerCase() as Address);
  }

  /**
   * Clear all gas usage tracking.
   */
  clearAllGasTracking(): void {
    this.gasWindows.clear();
  }

  /**
   * Set the deposit cache TTL (in milliseconds).
   */
  setDepositCacheTtlMs(ms: number): void {
    this.depositCacheTtlMs = ms;
    this.cachedDeposit = null; // invalidate cache
  }

  // ── Event System ─────────────────────────────────────────────────

  /**
   * Subscribe to paymaster events.
   *
   * ```ts
   * pm.on('sponsorship_approved', (e) => {
   *   logger.info(`Sponsored: ${e.data.paymasterAndData}`);
   * });
   * ```
   */
  on<T extends PaymasterEventType>(
    type: T,
    listener: PaymasterEventListener,
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  /**
   * Unsubscribe from paymaster events.
   */
  off<T extends PaymasterEventType>(
    type: T,
    listener: PaymasterEventListener,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  /**
   * Remove all event listeners (optionally for a specific type).
   */
  offAll(type?: PaymasterEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  // ── Private: Policy Evaluation ───────────────────────────────────

  /**
   * Evaluate all policies against a UserOperation.
   * Returns true if the operation is eligible for sponsorship.
   */
  private _evaluatePolicies(userOp: UserOperation): boolean {
    for (const policy of this.policies) {
      switch (policy.type) {
        case 'free-tier':
          return true;

        case 'whitelist': {
          const wp = policy as WhitelistPolicy;
          return wp.allowedSenders.has(userOp.sender);
        }

        case 'blacklist': {
          const bp = policy as BlacklistPolicy;
          return !bp.blockedSenders.has(userOp.sender);
        }

        case 'gas-limit': {
          const gp = policy as GasLimitPolicy;

          // Check per-operation gas limit
          const totalGas =
            userOp.callGasLimit +
            userOp.verificationGasLimit +
            userOp.preVerificationGas;
          if (totalGas > gp.maxGasPerOp) {
            return false;
          }

          // Check window-based gas limit (if configured)
          if (gp.maxGasPerWindow !== undefined) {
            const key = userOp.sender.toLowerCase() as Address;
            const now = Date.now();
            const entry = this.gasWindows.get(key);

            if (entry && now - entry.windowStart < (gp.windowMs ?? 3_600_000)) {
              // Within window — check total
              if (entry.used + totalGas > gp.maxGasPerWindow) {
                return false;
              }
            }
          }

          return true;
        }

        default:
          // Unknown policy type — default to allowing
          return true;
      }
    }

    // No policies matched — deny by default
    return false;
  }

  /**
   * Get the first matching (active) policy for a sender.
   */
  private _getActivePolicy(userOp: UserOperation): SponsorshipPolicy {
    for (const policy of this.policies) {
      switch (policy.type) {
        case 'free-tier':
          return policy;
        case 'whitelist':
          if ((policy as WhitelistPolicy).allowedSenders.has(userOp.sender))
            return policy;
          break;
        case 'blacklist':
          if (!(policy as BlacklistPolicy).blockedSenders.has(userOp.sender))
            return policy;
          break;
        case 'gas-limit':
          return policy; // always active, just checks limits
      }
    }
    // Fallback
    return { type: 'free-tier' };
  }

  /**
   * Get a human-readable rejection reason.
   */
  private _getRejectionReason(
    userOp: UserOperation,
    policy: SponsorshipPolicy,
  ): string {
    switch (policy.type) {
      case 'whitelist':
        return `Sender ${userOp.sender} is not in the whitelist`;
      case 'blacklist':
        return `Sender ${userOp.sender} is blacklisted`;
      case 'gas-limit':
        return `UserOperation exceeds gas limit policy`;
      default:
        return 'No matching sponsorship policy';
    }
  }

  /**
   * Track gas usage for a sender (used by gas-limit policy).
   */
  private _trackGasUsage(sender: Address, response: PaymasterResponse): void {
    const totalGas =
      (response.callGasLimit ?? 0n) +
      (response.verificationGasLimit ?? 0n) +
      (response.preVerificationGas ?? 0n);

    if (totalGas === 0n) return;

    const key = sender.toLowerCase() as Address;
    const now = Date.now();
    const entry = this.gasWindows.get(key);

    if (!entry || now - entry.windowStart > 3_600_000) {
      // New window (default 1 hour)
      this.gasWindows.set(key, { used: totalGas, windowStart: now });
    } else {
      entry.used += totalGas;
    }
  }

  /**
   * Calculate the estimated sponsorship cost in wei.
   */
  private _calculateCost(
    response: PaymasterResponse,
    userOp: UserOperation,
  ): bigint {
    const totalGas =
      (response.callGasLimit ?? userOp.callGasLimit) +
      (response.verificationGasLimit ?? userOp.verificationGasLimit) +
      (response.preVerificationGas ?? userOp.preVerificationGas);
    return totalGas * userOp.maxFeePerGas;
  }

  /**
   * Compute a simple hash of a UserOperation for event tracking.
   */
  private _hashUserOp(userOp: UserOperation): Hex {
    // Simple hash: hash of sender + nonce
    const combined = `${userOp.sender}:${userOp.nonce.toString()}`;
    let h = 0;
    for (let i = 0; i < combined.length; i++) {
      h = (Math.imul(31, h) + combined.charCodeAt(i)) | 0;
    }
    return `0x${(h >>> 0).toString(16).padStart(8, '0')}` as Hex;
  }

  // ── Private: Event Emission ──────────────────────────────────────

  private _emit<T extends PaymasterEventType>(
    type: T,
    data: PaymasterEvent['data'],
  ): void {
    if (!this.emitEvents) return;

    const event: PaymasterEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          listener(event);
        } catch (err) {
          // Don't let listener errors break the sponsorship flow
          console.warn('[PaymasterClient] Event listener error:', err);
        }
      }
    }
  }

  // ── Private: RPC with Retries ────────────────────────────────────

  private async _rpcWithRetry<T>(
    method: string,
    params: unknown[],
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await this._delay(this.retryDelayMs * attempt); // exponential-ish backoff
      }

      try {
        return await this._rpc<T>(method, params);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Don't retry config errors
        if (err instanceof PaymasterConfigError) throw err;
      }
    }

    throw lastError!;
  }

  // ── Private: Core RPC ────────────────────────────────────────────

  private async _rpc<T>(method: string, params: unknown[]): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(), // unique id per request
          method,
          params,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new PaymasterRpcError(
          `Paymaster HTTP ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      const json = (await response.json()) as {
        result?: T;
        error?: { code: number; message: string; data?: unknown };
      };

      if (json.error) {
        throw new PaymasterRpcError(
          `Paymaster RPC error [${json.error.code}]: ${json.error.message}`,
          undefined,
          json.error.code,
        );
      }

      if (json.result === undefined) {
        throw new PaymasterRpcError(
          `Paymaster RPC returned no result for ${method}`,
        );
      }

      return json.result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ── Serialization Helpers ────────────────────────────────────────────

/** Convert a UserOperation to the hex-serialised shape the paymaster expects. */
function serializeUserOp(op: UserOperation): Record<string, string> {
  return {
    sender: op.sender,
    nonce: `0x${op.nonce.toString(16)}`,
    initCode: op.initCode,
    callData: op.callData,
    callGasLimit: `0x${op.callGasLimit.toString(16)}`,
    verificationGasLimit: `0x${op.verificationGasLimit.toString(16)}`,
    preVerificationGas: `0x${op.preVerificationGas.toString(16)}`,
    maxFeePerGas: `0x${op.maxFeePerGas.toString(16)}`,
    maxPriorityFeePerGas: `0x${op.maxPriorityFeePerGas.toString(16)}`,
    paymasterAndData: op.paymasterAndData,
    signature: op.signature,
  };
}

/** Convert a partial UserOperation for estimation requests. */
function serializePartialUserOp(
  op: Partial<UserOperation> & { sender: Address },
): Record<string, string> {
  const out: Record<string, string> = { sender: op.sender };
  if (op.nonce !== undefined) out.nonce = `0x${op.nonce.toString(16)}`;
  if (op.initCode) out.initCode = op.initCode;
  if (op.callData) out.callData = op.callData;
  if (op.callGasLimit !== undefined)
    out.callGasLimit = `0x${op.callGasLimit.toString(16)}`;
  if (op.verificationGasLimit !== undefined)
    out.verificationGasLimit = `0x${op.verificationGasLimit.toString(16)}`;
  if (op.preVerificationGas !== undefined)
    out.preVerificationGas = `0x${op.preVerificationGas.toString(16)}`;
  if (op.maxFeePerGas !== undefined)
    out.maxFeePerGas = `0x${op.maxFeePerGas.toString(16)}`;
  if (op.maxPriorityFeePerGas !== undefined)
    out.maxPriorityFeePerGas = `0x${op.maxPriorityFeePerGas.toString(16)}`;
  if (op.paymasterAndData) out.paymasterAndData = op.paymasterAndData;
  if (op.signature) out.signature = op.signature;
  return out;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Multi-Paymaster Router (aa-sdk native)                          */
/* ─────────────────────────────────────────────────────────────── */

/**
 * PaymasterRouter — routes sponsorship requests across multiple paymasters.
 *
 * Supports three strategies:
 * - `round-robin`: Distribute evenly across active paymasters
 * - `priority`: Always use highest-priority available paymaster
 * - `fallback`: Use primary, fall back to secondary on failure
 *
 * ```ts
 * const router = new PaymasterRouter('priority');
 * router.add('primary', primaryClient, [1, 11155111], 10);
 * router.add('backup', backupClient, [1, 11155111], 5);
 *
 * const { id, response } = await router.route(request);
 * ```
 */
export class PaymasterRouter {
  private entries: PmRouterEntry[] = [];
  private strategy: 'round-robin' | 'priority' | 'fallback';
  private rrIndex = 0;

  constructor(strategy: 'round-robin' | 'priority' | 'fallback' = 'priority') {
    this.strategy = strategy;
  }

  /**
   * Add a paymaster to the router.
   */
  add(
    id: string,
    client: PaymasterClient,
    chains: number[] = [],
    priority: number = 1,
  ): void {
    if (this.entries.some((e) => e.id === id)) {
      throw new Error(`Paymaster "${id}" already registered`);
    }
    this.entries.push({ id, client, active: true, chains, priority });
  }

  /**
   * Remove a paymaster by ID.
   */
  remove(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  /**
   * Deactivate a paymaster (keeps config, stops routing to it).
   */
  deactivate(id: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) entry.active = false;
  }

  /**
   * Reactivate a paymaster.
   */
  activate(id: string): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) entry.active = true;
  }

  /**
   * Route a sponsorship request to the best paymaster.
   */
  async route(request: PaymasterRequest): Promise<PmRoutingResult> {
    const eligible = this.entries.filter(
      (e) =>
        e.active &&
        (e.chains.length === 0 || e.chains.includes(request.chainId)),
    );

    if (eligible.length === 0) {
      throw new Error('No active paymasters available for this chain');
    }

    // Sort by strategy
    let ordered: PmRouterEntry[];
    switch (this.strategy) {
      case 'priority':
        ordered = [...eligible].sort((a, b) => b.priority - a.priority);
        break;
      case 'round-robin':
        ordered = this._roundRobinOrder(eligible);
        break;
      case 'fallback':
        ordered = [...eligible].sort((a, b) => b.priority - a.priority);
        break;
      default:
        ordered = eligible;
    }

    // Try each paymaster in order
    const errors: Error[] = [];
    for (let i = 0; i < ordered.length; i++) {
      const entry = ordered[i];
      try {
        const response = await entry.client.sponsor(request);
        return {
          id: entry.id,
          response,
          usedFallback: i > 0,
        };
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
        // In fallback mode, only try the first two, then give up
        if (this.strategy === 'fallback' && i >= 1) break;
      }
    }

    throw new Error(
      `All paymasters failed: ${errors.map((e) => e.message).join('; ')}`,
    );
  }

  /**
   * Get the gas limits from the best paymaster.
   */
  async getGasLimits(
    userOp: UserOperation,
    entryPoint: Address,
    chainId: number,
  ): Promise<{
    id: string;
    limits: {
      verificationGasLimit: bigint;
      callGasLimit: bigint;
      preVerificationGas: bigint;
    };
  }> {
    const eligible = this.entries.filter(
      (e) =>
        e.active && (e.chains.length === 0 || e.chains.includes(chainId)),
    );

    if (eligible.length === 0) {
      throw new Error('No active paymasters available');
    }

    const ordered = [...eligible].sort((a, b) => b.priority - a.priority);

    for (const entry of ordered) {
      try {
        const limits = await entry.client.getGasLimits(
          userOp,
          entryPoint,
          chainId,
        );
        return { id: entry.id, limits };
      } catch {
        // Try next
      }
    }

    throw new Error('All paymasters failed to provide gas limits');
  }

  /**
   * Estimate sponsorship cost from the best paymaster.
   */
  async estimateSponsorship(
    userOp: Partial<UserOperation> & { sender: Address },
    entryPoint: Address,
    chainId: number,
  ): Promise<{
    id: string;
    estimate: SponsorshipEstimate;
  }> {
    const eligible = this.entries.filter(
      (e) =>
        e.active && (e.chains.length === 0 || e.chains.includes(chainId)),
    );

    if (eligible.length === 0) {
      throw new Error('No active paymasters available');
    }

    const ordered = [...eligible].sort((a, b) => b.priority - a.priority);

    for (const entry of ordered) {
      try {
        const estimate = await entry.client.estimateSponsorship(
          userOp,
          entryPoint,
          chainId,
        );
        return { id: entry.id, estimate };
      } catch {
        // Try next
      }
    }

    throw new Error('All paymasters failed to provide sponsorship estimate');
  }

  /**
   * Get all active paymasters.
   */
  getActive(): PmRouterEntry[] {
    return this.entries.filter((e) => e.active);
  }

  /**
   * Get all registered paymasters (active + inactive).
   */
  getAll(): ReadonlyArray<PmRouterEntry> {
    return [...this.entries];
  }

  /**
   * Set routing strategy.
   */
  setStrategy(strategy: 'round-robin' | 'priority' | 'fallback'): void {
    this.strategy = strategy;
    this.rrIndex = 0;
  }

  private _roundRobinOrder(eligible: PmRouterEntry[]): PmRouterEntry[] {
    const ordered = [...eligible];
    // Rotate: start from rrIndex
    const rotated = [
      ...ordered.slice(this.rrIndex % ordered.length),
      ...ordered.slice(0, this.rrIndex % ordered.length),
    ];
    this.rrIndex = (this.rrIndex + 1) % ordered.length;
    return rotated;
  }
}
