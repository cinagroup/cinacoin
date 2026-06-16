/**
 * PaymasterRouter - Routes requests across multiple paymasters
 */

import type { Address } from 'viem';
import type { UserOperation, PaymasterRequest, PmRouterEntry } from './types.js';
import type { SponsorshipEstimate } from './types.js';
import type { PaymasterClient } from './client.js';

export type RoutingStrategy = 'round-robin' | 'priority' | 'fallback';

export interface PmRoutingResult {
  id: string;
  response: any;
  usedFallback: boolean;
}

export class PaymasterRouter {
  private entries: PmRouterEntry[] = [];
  private strategy: RoutingStrategy;
  private rrIndex = 0;

  constructor(strategy: RoutingStrategy = 'priority') {
    this.strategy = strategy;
  }

  // ── Management ──────────────────────────────────────────────────────

  add(
    id: string,
    client: PaymasterClient,
    chains: number[] = [],
    priority: number = 1
  ): void {
    if (this.entries.find(e => e.id === id)) {
      throw new Error(`Paymaster ${id} already exists`);
    }
    this.entries.push({ id, client, chains, priority, active: true });
  }

  remove(id: string): void {
    this.entries = this.entries.filter(e => e.id !== id);
  }

  activate(id: string): void {
    const entry = this.entries.find(e => e.id === id);
    if (entry) entry.active = true;
  }

  deactivate(id: string): void {
    const entry = this.entries.find(e => e.id === id);
    if (entry) entry.active = false;
  }

  getActive(): PmRouterEntry[] {
    return this.entries.filter(e => e.active);
  }

  getAll(): readonly PmRouterEntry[] {
    return this.entries;
  }

  setStrategy(strategy: RoutingStrategy): void {
    this.strategy = strategy;
    this.rrIndex = 0;
  }

  // ── Routing ─────────────────────────────────────────────────────────

  async route(request: PaymasterRequest): Promise<PmRoutingResult> {
    const eligible = this.getEligiblePaymasters(request.chainId);

    if (eligible.length === 0) {
      throw new Error('No eligible paymasters for chain ' + request.chainId);
    }

    const ordered = this.orderByStrategy(eligible);

    let lastError: Error | undefined;
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
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[PaymasterRouter] ${entry.id} failed:`, lastError.message);
      }
    }

    throw lastError || new Error('All paymasters failed');
  }

  async getGasLimits(
    userOp: UserOperation,
    entryPoint: Address,
    chainId: number
  ): Promise<{
    id: string;
    limits: {
      verificationGasLimit: bigint;
      callGasLimit: bigint;
      preVerificationGas: bigint;
    };
  }> {
    const eligible = this.getEligiblePaymasters(chainId);
    const ordered = this.orderByStrategy(eligible);

    let lastError: Error | undefined;
    for (const entry of ordered) {
      try {
        const limits = await entry.client.getGasLimits(userOp, entryPoint, chainId);
        return { id: entry.id, limits };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error('All paymasters failed to get gas limits');
  }

  async estimateSponsorship(
    userOp: Partial<UserOperation> & { sender: Address },
    entryPoint: Address,
    chainId: number
  ): Promise<{
    id: string;
    estimate: SponsorshipEstimate;
  }> {
    const eligible = this.getEligiblePaymasters(chainId);
    const ordered = this.orderByStrategy(eligible);

    let lastError: Error | undefined;
    for (const entry of ordered) {
      try {
        const estimate = await entry.client.estimateSponsorship(
          userOp,
          entryPoint,
          chainId
        );
        return { id: entry.id, estimate };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error('All paymasters failed to estimate');
  }

  // ── Private ─────────────────────────────────────────────────────────

  private getEligiblePaymasters(chainId: number): PmRouterEntry[] {
    return this.entries.filter(e => {
      if (!e.active) return false;
      if (e.chains.length === 0) return true;
      return e.chains.includes(chainId);
    });
  }

  private orderByStrategy(entries: PmRouterEntry[]): PmRouterEntry[] {
    switch (this.strategy) {
      case 'priority':
        return [...entries].sort((a, b) => b.priority - a.priority);

      case 'round-robin': {
        const rotated = [
          ...entries.slice(this.rrIndex),
          ...entries.slice(0, this.rrIndex),
        ];
        this.rrIndex = (this.rrIndex + 1) % entries.length;
        return rotated;
      }

      case 'fallback':
        // Sort by priority, but only use the first one unless it fails
        return [...entries].sort((a, b) => b.priority - a.priority);

      default:
        return entries;
    }
  }
}
