/**
 * PaymasterClient - Main client class for interacting with paymaster RPC
 */

import type { Hex, Address } from 'viem';
import type {
  UserOperation,
  PaymasterConfig,
  PaymasterRequest,
  PaymasterResponse,
  PaymasterDepositInfo,
  SponsorshipEstimate,
  GasWindowEntry,
} from './types.js';
import type { AnySponsorshipPolicy } from './policies.js';
import type { PaymasterEventMap, PaymasterEventType } from './events.js';
import {
  PaymasterConfigError,
  PaymasterRpcError,
  PaymasterDepositError,
  PaymasterPolicyError,
} from './errors.js';
import { serializeUserOp, serializePartialUserOp } from './serialization.js';

export interface ExtendedPaymasterConfig extends PaymasterConfig {
  policies?: AnySponsorshipPolicy[];
  validateDeposit?: boolean;
  minDeposit?: bigint;
  emitEvents?: boolean;
  requestTimeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class PaymasterClient {
  private readonly url: string;
  private readonly apiKey?: string;
  readonly sponsorType: 'gasless' | 'partial' | 'post-pay';

  // Policies
  private policies: AnySponsorshipPolicy[];

  // Deposit validation
  private validateDeposit: boolean;
  private minDeposit: bigint;
  private cachedDeposit: PaymasterDepositInfo | null = null;
  private depositLastChecked = 0;
  private depositCacheTtlMs = 60_000; // 1 minute cache

  // Events
  private emitEvents: boolean;
  private listeners = new Map<PaymasterEventType, Set<(event: any) => void>>();

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
      throw new PaymasterConfigError('url is required');
    }
  }

  // ── Public API ──────────────────────────────────────────────────────

  async sponsor(request: PaymasterRequest): Promise<PaymasterResponse> {
    this.emit('sponsorship_requested', {
      userOp: request.userOperation,
      entryPoint: request.entryPoint,
      chainId: request.chainId,
    });

    // Evaluate policies
    const policyResult = this.evaluatePolicies(request.userOperation);
    if (!policyResult.eligible) {
      this.emit('policy_evaluated', {
        policyType: policyResult.policyType,
        eligible: false,
        sender: request.userOperation.sender,
      });
      this.emit('sponsorship_rejected', {
        reason: policyResult.reason,
        policyType: policyResult.policyType,
      });
      throw new PaymasterPolicyError(
        `Sponsorship rejected: ${policyResult.reason}`
      );
    }

    this.emit('policy_evaluated', {
      policyType: policyResult.policyType,
      eligible: true,
      sender: request.userOperation.sender,
    });

    // Check deposit if enabled
    if (this.validateDeposit) {
      const deposit = await this.checkDeposit();
      this.emit('deposit_checked', deposit);
      if (!deposit.sufficient) {
        throw new PaymasterDepositError(
          `Insufficient deposit: ${deposit.available} < ${deposit.required}`
        );
      }
    }

    // Call paymaster RPC with retry
    const result = await this.rpcWithRetry<{
      paymasterAndData: Hex;
      preVerificationGas?: Hex;
      verificationGasLimit?: Hex;
      callGasLimit?: Hex;
    }>('pm_sponsorUserOperation', [
      serializeUserOp(request.userOperation),
      request.entryPoint,
      request.chainId,
    ]);

    const response: PaymasterResponse = {
      paymasterAndData: result.paymasterAndData,
    };
    if (result.preVerificationGas) {
      response.preVerificationGas = BigInt(result.preVerificationGas);
    }
    if (result.verificationGasLimit) {
      response.verificationGasLimit = BigInt(result.verificationGasLimit);
    }
    if (result.callGasLimit) {
      response.callGasLimit = BigInt(result.callGasLimit);
    }

    // Track gas usage
    this.trackGasUsage(
      request.userOperation.sender,
      request.userOperation.callGasLimit +
        request.userOperation.verificationGasLimit +
        request.userOperation.preVerificationGas
    );

    const estimatedCost = this.calculateEstimatedCost(
      request.userOperation,
      response
    );

    this.emit('sponsorship_approved', {
      userOpHash: this.hashUserOp(request.userOperation),
      paymasterAndData: response.paymasterAndData,
      estimatedCost,
    });

    return response;
  }

  canSponsor(request: PaymasterRequest): boolean {
    return this.evaluatePolicies(request.userOperation).eligible;
  }

  async getGasLimits(
    userOp: UserOperation,
    entryPoint: Address,
    chainId: number
  ): Promise<{
    verificationGasLimit: bigint;
    callGasLimit: bigint;
    preVerificationGas: bigint;
  }> {
    const result = await this.rpcWithRetry<{
      verificationGasLimit: Hex;
      callGasLimit: Hex;
      preVerificationGas: Hex;
    }>('pm_getGasLimits', [
      serializeUserOp(userOp),
      entryPoint,
      chainId,
    ]);

    return {
      verificationGasLimit: BigInt(result.verificationGasLimit),
      callGasLimit: BigInt(result.callGasLimit),
      preVerificationGas: BigInt(result.preVerificationGas),
    };
  }

  async estimateSponsorship(
    userOp: Partial<UserOperation> & { sender: Address },
    entryPoint: Address,
    chainId: number
  ): Promise<SponsorshipEstimate> {
    const result = await this.rpcWithRetry<{
      preVerificationGas: Hex;
      verificationGasLimit: Hex;
      callGasLimit: Hex;
    }>('pm_estimateSponsorship', [
      serializePartialUserOp(userOp),
      entryPoint,
      chainId,
    ]);

    const preVerificationGas = BigInt(result.preVerificationGas);
    const verificationGasLimit = BigInt(result.verificationGasLimit);
    const callGasLimit = BigInt(result.callGasLimit);
    const totalGas = preVerificationGas + verificationGasLimit + callGasLimit;

    const maxFeePerGas =
      userOp.maxFeePerGas ?? BigInt(20_000_000_000); // 20 gwei default
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

  async checkDeposit(): Promise<PaymasterDepositInfo> {
    const now = Date.now();
    if (this.cachedDeposit && now - this.depositLastChecked < this.depositCacheTtlMs) {
      return this.cachedDeposit;
    }

    try {
      const result = await this.rpcWithRetry<{
        balance: Hex;
        minRequired: Hex;
      }>('pm_getDeposit', []);

      const balance = BigInt(result.balance);
      const minRequired = BigInt(result.minRequired);
      const sufficient = balance >= minRequired;

      this.cachedDeposit = { balance, sufficient, minRequired };
      this.depositLastChecked = now;

      return this.cachedDeposit;
    } catch (err) {
      throw new PaymasterRpcError(
        `Failed to check deposit: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  verifyPaymasterData(paymasterAndData: Hex): boolean {
    return paymasterAndData && paymasterAndData !== '0x';
  }

  verifyUserOpSignature(userOp: UserOperation): boolean {
    return userOp.signature && userOp.signature !== '0x';
  }

  fillPaymasterData(
    userOp: UserOperation,
    paymasterAndData: Hex
  ): UserOperation {
    return { ...userOp, paymasterAndData };
  }

  addPolicy(policy: AnySponsorshipPolicy): void {
    this.policies.push(policy);
  }

  setPolicies(policies: AnySponsorshipPolicy[]): void {
    this.policies = [...policies];
  }

  getPolicies(): readonly AnySponsorshipPolicy[] {
    return this.policies;
  }

  getActivePolicy(sender: Address): AnySponsorshipPolicy | null {
    const dummyOp = { sender } as UserOperation;
    return this.evaluatePolicies(dummyOp).policyType
      ? this.policies.find(p => p.type === this.evaluatePolicies(dummyOp).policyType) || null
      : null;
  }

  clearGasTracking(sender: Address): void {
    this.gasWindows.delete(sender.toLowerCase());
  }

  clearAllGasTracking(): void {
    this.gasWindows.clear();
  }

  setDepositCacheTtlMs(ms: number): void {
    this.depositCacheTtlMs = ms;
  }

  // ── Event System ────────────────────────────────────────────────────

  on<T extends PaymasterEventType>(
    type: T,
    listener: (event: PaymasterEventMap[T]) => void
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as any);
  }

  off<T extends PaymasterEventType>(
    type: T,
    listener: (event: PaymasterEventMap[T]) => void
  ): void {
    this.listeners.get(type)?.delete(listener as any);
  }

  offAll(type?: PaymasterEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  // ── Private Methods ─────────────────────────────────────────────────

  private emit<T extends PaymasterEventType>(
    type: T,
    data: PaymasterEventMap[T]
  ): void {
    if (!this.emitEvents) return;

    const listeners = this.listeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          (listener as any)(data);
        } catch (err) {
          console.error(`[PaymasterClient] Event listener error:`, err);
        }
      }
    }
  }

  private evaluatePolicies(userOp: UserOperation): {
    eligible: boolean;
    policyType: string;
    reason?: string;
  } {
    for (const policy of this.policies) {
      switch (policy.type) {
        case 'free-tier':
          return { eligible: true, policyType: 'free-tier' };

        case 'whitelist': {
          const wp = policy as any;
          if (wp.allowedAddresses.includes(userOp.sender)) {
            return { eligible: true, policyType: 'whitelist' };
          }
          return {
            eligible: false,
            policyType: 'whitelist',
            reason: `Sender ${userOp.sender} not in whitelist`,
          };
        }

        case 'blacklist': {
          const bp = policy as any;
          if (bp.blockedAddresses.includes(userOp.sender)) {
            return {
              eligible: false,
              policyType: 'blacklist',
              reason: `Sender ${userOp.sender} is blacklisted`,
            };
          }
          return { eligible: true, policyType: 'blacklist' };
        }

        case 'gas-limit': {
          const gp = policy as any;
          const totalGas =
            userOp.callGasLimit +
            userOp.verificationGasLimit +
            userOp.preVerificationGas;

          if (gp.maxGasPerOp && totalGas > gp.maxGasPerOp) {
            return {
              eligible: false,
              policyType: 'gas-limit',
              reason: `Gas ${totalGas} exceeds max ${gp.maxGasPerOp}`,
            };
          }

          if (gp.maxGasPerWindow && gp.windowMs) {
            const sender = userOp.sender.toLowerCase();
            const now = Date.now();
            const entry = this.gasWindows.get(sender);

            if (entry && now - entry.windowStart < gp.windowMs) {
              if (entry.used + totalGas > gp.maxGasPerWindow) {
                return {
                  eligible: false,
                  policyType: 'gas-limit',
                  reason: `Window gas limit exceeded`,
                };
              }
            }
          }

          return { eligible: true, policyType: 'gas-limit' };
        }

        default:
          return { eligible: false, policyType: policy.type, reason: 'Unknown policy type' };
      }
    }

    return { eligible: false, policyType: 'none', reason: 'No policies configured' };
  }

  private trackGasUsage(sender: Address, gasUsed: bigint): void {
    const key = sender.toLowerCase();
    const now = Date.now();
    const entry = this.gasWindows.get(key);

    if (!entry || now - entry.windowStart > 3600000) {
      // New window (1 hour)
      this.gasWindows.set(key, { used: gasUsed, windowStart: now });
    } else {
      entry.used += gasUsed;
    }
  }

  private calculateEstimatedCost(
    userOp: UserOperation,
    response: PaymasterResponse
  ): bigint {
    const totalGas =
      (response.preVerificationGas ?? userOp.preVerificationGas) +
      (response.verificationGasLimit ?? userOp.verificationGasLimit) +
      (response.callGasLimit ?? userOp.callGasLimit);
    return totalGas * userOp.maxFeePerGas;
  }

  private hashUserOp(userOp: UserOperation): string {
    const data = `${userOp.sender}:${userOp.nonce}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  private async rpcWithRetry<T>(
    method: string,
    params: any[]
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.rpc<T>(method, params);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  private async rpc<T>(method: string, params: any[]): Promise<T> {
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
          method,
          params,
          id: Date.now(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new PaymasterRpcError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const json = (await response.json()) as {
        result?: T;
        error?: { code: number; message: string };
      };

      if (json.error) {
        throw new PaymasterRpcError(
          `RPC error ${json.error.code}: ${json.error.message}`
        );
      }

      if (!json.result) {
        throw new PaymasterRpcError('No result in response');
      }

      return json.result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
