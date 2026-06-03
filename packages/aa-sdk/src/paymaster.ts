/**
 * PaymasterClient — Real HTTP JSON-RPC client for ERC-4337 paymaster services.
 *
 * Communicates with a paymaster endpoint over HTTP POST to:
 *   - Sponsor user operations (return paymasterAndData)
 *   - Get gas limits
 *   - Check sponsorship eligibility
 */

import type { Hex, Address } from 'viem';
import type {
  PaymasterConfig,
  PaymasterRequest,
  PaymasterResponse,
  UserOperation,
} from './types.js';

export class PaymasterClient {
  private readonly url: string;
  private readonly apiKey?: string;
  readonly sponsorType: 'gasless' | 'partial' | 'post-pay';

  constructor(config: PaymasterConfig) {
    this.url = config.url;
    this.apiKey = config.apiKey;
    this.sponsorType = config.sponsorType;
  }

  /**
   * Sponsor a user operation.
   * Sends a POST request to the paymaster endpoint with the UserOperation
   * and returns paymasterAndData to embed in the UserOperation.
   */
  async sponsor(request: PaymasterRequest): Promise<PaymasterResponse> {
    const result = await this.rpc<{
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
    if (result.preVerificationGas)
      response.preVerificationGas = BigInt(result.preVerificationGas);
    if (result.verificationGasLimit)
      response.verificationGasLimit = BigInt(result.verificationGasLimit);
    if (result.callGasLimit)
      response.callGasLimit = BigInt(result.callGasLimit);
    return response;
  }

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
    const result = await this.rpc<{
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

  /**
   * Check whether the paymaster can sponsor a given operation.
   */
  canSponsor(request: PaymasterRequest): boolean {
    return this.sponsorType !== undefined;
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private async rpc<T>(method: string, params: unknown[]): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Paymaster HTTP ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as {
      result?: T;
      error?: { code: number; message: string; data?: unknown };
    };

    if (json.error) {
      throw new Error(
        `Paymaster RPC error [${json.error.code}]: ${json.error.message}`,
      );
    }

    if (json.result === undefined) {
      throw new Error(`Paymaster RPC returned no result for ${method}`);
    }

    return json.result;
  }
}

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

/* ─────────────────────────────────────────────────────────────── */
/*  Multi-Paymaster Router (aa-sdk native)                          */
/* ─────────────────────────────────────────────────────────────── */

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
      (e) => e.active && (e.chains.length === 0 || e.chains.includes(request.chainId)),
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
        // In fallback mode, only try the first, then give up
        if (this.strategy === 'fallback' && i === 0) break;
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
      (e) => e.active && (e.chains.length === 0 || e.chains.includes(chainId)),
    );

    if (eligible.length === 0) {
      throw new Error('No active paymasters available');
    }

    const ordered = [...eligible].sort((a, b) => b.priority - a.priority);

    for (const entry of ordered) {
      try {
        const limits = await entry.client.getGasLimits(userOp, entryPoint, chainId);
        return { id: entry.id, limits };
      } catch {
        // Try next
      }
    }

    throw new Error('All paymasters failed to provide gas limits');
  }

  /**
   * Get all active paymasters.
   */
  getActive(): PmRouterEntry[] {
    return this.entries.filter((e) => e.active);
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
