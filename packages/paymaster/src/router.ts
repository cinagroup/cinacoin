/**
 * Multi-Paymaster Router
 *
 * Routes UserOperations to the optimal paymaster based on:
 * - Gas cost strategy
 * - Paymaster availability & health
 * - Chain ID compatibility
 * - Sponsorship policy
 *
 * Supports round-robin, cost-optimized, and policy-based routing.
 *
 * @packageDocumentation
 */

import { logger } from '@cinacoin/logger';
import type { Address, Hex } from 'viem';
import type {
  PaymasterData,
  PaymasterConfig,
  SponsorRequest,
  SponsorResult,
} from './types.js';
import { PaymasterClient } from './PaymasterClient.js';
import { PaymasterBalanceManager, type PaymasterBalance } from './balance-manager.js';

/** Routing strategy types. */
export type RoutingStrategy = 'round-robin' | 'cost-optimized' | 'health-first' | 'static';

/** Configuration for a single paymaster in the router. */
export interface PaymasterEntry {
  /** Paymaster address. */
  address: Address;
  /** PaymasterClient for RPC communication. */
  client: PaymasterClient;
  /** Whether this paymaster is currently active. */
  isActive: boolean;
  /** Supported chain IDs. Empty = all chains. */
  supportedChains: number[];
  /** Sponsor type. */
  sponsorType: 'gasless' | 'partial' | 'post-pay';
  /** Priority weight (higher = more preferred). */
  priority: number;
  /** Maximum gas cost per operation (wei, 0 = uncapped). */
  maxGasCostPerOp: bigint;
}

/** Router configuration. */
export interface PaymasterRouterConfig {
  /** Routing strategy. */
  strategy: RoutingStrategy;
  /** List of paymaster entries. */
  paymasters: PaymasterEntry[];
  /** Optional balance manager for health-based routing. */
  balanceManager?: PaymasterBalanceManager;
  /** Fallback paymaster client when no primary is available. */
  fallbackClient?: PaymasterClient;
  /** Health check interval in ms (default: 60000). */
  healthCheckInterval?: number;
}

/** Routing result. */
export interface RoutingResult {
  /** Selected paymaster address. */
  paymaster: Address;
  /** Paymaster data for UserOp. */
  data: PaymasterData;
  /** Strategy used for selection. */
  strategy: RoutingStrategy;
  /** Whether a fallback was used. */
  usedFallback: boolean;
}

/**
 * Multi-Paymaster Router.
 *
 * Selects the best paymaster for each UserOperation based on the configured
 * strategy, paymaster health, and chain compatibility.
 *
 * ```ts
 * const router = new PaymasterRouter({
 *   strategy: 'cost-optimized',
 *   paymasters: [
 *     {
 *       address: '0x...',
 *       client: new PaymasterClient({ paymasterUrl: 'https://pm1.example.com' }),
 *       isActive: true,
 *       supportedChains: [1, 11155111],
 *       sponsorType: 'gasless',
 *       priority: 10,
 *       maxGasCostPerOp: 50_000_000_000_000_000n,
 *     },
 *   ],
 * });
 *
 * const result = await router.route(request);
 * ```
 */
export class PaymasterRouter {
  private config: PaymasterRouterConfig;
  private roundRobinIndex = 0;
  private healthCheckTimer?: ReturnType<typeof setTimeout>;

  constructor(config: PaymasterRouterConfig) {
    this.config = config;
    this.startHealthChecks();
  }

  /**
   * Route a sponsorship request to the best available paymaster.
   */
  async route(request: SponsorRequest): Promise<RoutingResult> {
    const eligible = this.getEligiblePaymasters(request.chainId);

    if (eligible.length === 0) {
      if (this.config.fallbackClient) {
        const data = await this.config.fallbackClient.getPaymasterData({
          sender: request.sender,
          callData: request.callData,
          chainId: request.chainId,
        });
        return {
          paymaster: '0x0000000000000000000000000000000000000000' as Address,
          data,
          strategy: this.config.strategy,
          usedFallback: true,
        };
      }
      throw new Error('No eligible paymasters available');
    }

    let selected: PaymasterEntry;
    switch (this.config.strategy) {
      case 'round-robin':
        selected = this.selectRoundRobin(eligible);
        break;
      case 'cost-optimized':
        selected = await this.selectCostOptimized(eligible, request);
        break;
      case 'health-first':
        selected = await this.selectHealthFirst(eligible);
        break;
      case 'static':
        selected = this.selectStatic(eligible);
        break;
      default:
        selected = eligible[0];
    }

    const data = await selected.client.getPaymasterData({
      sender: request.sender,
      callData: request.callData,
      chainId: request.chainId,
    });

    return {
      paymaster: selected.address,
      data,
      strategy: this.config.strategy,
      usedFallback: false,
    };
  }

  /**
   * Get all paymasters eligible for a chain.
   */
  private getEligiblePaymasters(chainId: number): PaymasterEntry[] {
    return this.config.paymasters.filter(
      (pm) =>
        pm.isActive &&
        (pm.supportedChains.length === 0 || pm.supportedChains.includes(chainId)),
    );
  }

  /**
   * Round-robin selection.
   */
  private selectRoundRobin(eligible: PaymasterEntry[]): PaymasterEntry {
    if (eligible.length === 0) {
      throw new Error('No eligible paymasters');
    }
    const selected = eligible[this.roundRobinIndex % eligible.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % eligible.length;
    return selected;
  }

  /**
   * Cost-optimized selection — picks the paymaster with lowest estimated cost.
   */
  private async selectCostOptimized(
    eligible: PaymasterEntry[],
    request: SponsorRequest,
  ): Promise<PaymasterEntry> {
    const costs = await Promise.all(
      eligible.map(async (pm) => {
        try {
          const data = await pm.client.getPaymasterData({
            sender: request.sender,
            callData: request.callData,
            chainId: request.chainId,
          });
          // Total gas cost = verification + postOp gas limits
          const totalGas =
            data.paymasterVerificationGasLimit + data.paymasterPostOpGasLimit;
          return { pm, totalGas };
        } catch {
          return { pm, totalGas: BigInt(Number.MAX_SAFE_INTEGER) };
        }
      }),
    );

    costs.sort((a, b) => Number(a.totalGas - b.totalGas));
    return costs[0].pm;
  }

  /**
   * Health-first selection — picks the healthiest paymaster with highest priority.
   */
  private async selectHealthFirst(
    eligible: PaymasterEntry[],
  ): Promise<PaymasterEntry> {
    if (!this.config.balanceManager) {
      // Fall back to priority-based selection
      return this.selectStatic(eligible);
    }

    const healthChecks = await Promise.all(
      eligible.map((pm) =>
        this.config.balanceManager!.checkBalance(pm.address).catch(() => null),
      ),
    );

    // Sort by health (healthy first), then by priority
    const sorted = eligible
      .map((pm, i) => ({ pm, health: healthChecks[i] }))
      .sort((a, b) => {
        if (a.health?.isHealthy !== b.health?.isHealthy) {
          return a.health?.isHealthy ? -1 : 1;
        }
        return b.pm.priority - a.pm.priority;
      });

    return sorted[0].pm;
  }

  /**
   * Static selection — picks highest priority active paymaster.
   */
  private selectStatic(eligible: PaymasterEntry[]): PaymasterEntry {
    return eligible.reduce((best, pm) =>
      pm.priority > best.priority ? pm : best,
    );
  }

  /**
   * Add a new paymaster to the router.
   */
  addPaymaster(entry: PaymasterEntry): void {
    this.config.paymasters.push(entry);
  }

  /**
   * Remove a paymaster by address.
   */
  removePaymaster(address: Address): void {
    this.config.paymasters = this.config.paymasters.filter(
      (pm) => pm.address.toLowerCase() !== address.toLowerCase(),
    );
  }

  /**
   * Set the routing strategy.
   */
  setStrategy(strategy: RoutingStrategy): void {
    this.config.strategy = strategy;
    this.roundRobinIndex = 0;
  }

  /**
   * Deactivate a paymaster temporarily.
   */
  deactivatePaymaster(address: Address): void {
    const pm = this.config.paymasters.find(
      (p) => p.address.toLowerCase() === address.toLowerCase(),
    );
    if (pm) pm.isActive = false;
  }

  /**
   * Reactivate a paymaster.
   */
  activatePaymaster(address: Address): void {
    const pm = this.config.paymasters.find(
      (p) => p.address.toLowerCase() === address.toLowerCase(),
    );
    if (pm) pm.isActive = true;
  }

  /**
   * Get all active paymasters.
   */
  getActivePaymasters(): PaymasterEntry[] {
    return this.config.paymasters.filter((pm) => pm.isActive);
  }

  /**
   * Start periodic health checks.
   */
  private startHealthChecks(): void {
    const interval = this.config.healthCheckInterval ?? 60_000;
    if (!this.config.balanceManager) return;

    const check = async () => {
      const activePaymasters = this.getActivePaymasters();
      await Promise.all(
        activePaymasters.map(async (pm) => {
          try {
            const balance = await this.config.balanceManager!.checkBalance(pm.address);
            if (!balance.isHealthy) {
              pm.isActive = false;
              logger.warn(
                `[PaymasterRouter] Deactivated unhealthy paymaster: ${pm.address}`,
              );
            }
          } catch {
            pm.isActive = false;
            logger.warn(
              `[PaymasterRouter] Deactivated unreachable paymaster: ${pm.address}`,
            );
          }
        }),
      );
    };

    // Run initial check
    check().catch(() => {});

    this.healthCheckTimer = setInterval(check, interval);
  }

  /**
   * Stop health checks and clean up.
   */
  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}

export default PaymasterRouter;
