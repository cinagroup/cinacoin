/**
 * BridgeStateManager — Bridge State Tracking & Health Monitoring
 *
 * Monitors the state of all bridge components across chains:
 *   - Pool balances and liquidity levels
 *   - Swap rates and price feeds
 *   - Bridge transfer states
 *   - Health monitoring and alerting
 *   - Aggregated bridge statistics
 *
 * This complements the existing bridge-state-manager.ts by focusing on
 * aggregate bridge health rather than individual transfer lifecycle.
 */

import type { ChainFamily } from "./types";
import type { LiquidityPool, PoolStatus } from "./LiquidityPool";
import type { AtomicSwap, SwapStatus } from "./AtomicSwap";

// ============================================================
// State Types
// ============================================================

/** Aggregate bridge state snapshot. */
export interface BridgeStateSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Total value locked across all pools (in USD equivalent) */
  totalValueLocked: number;
  /** Total volume in last 24h (in USD equivalent) */
  volume24h: number;
  /** Total fees collected in last 24h (in USD equivalent) */
  fees24h: number;
  /** Number of active pools */
  activePoolCount: number;
  /** Number of pending transfers */
  pendingTransferCount: number;
  /** Number of active swaps */
  activeSwapCount: number;
  /** Bridge health score (0–100) */
  healthScore: number;
  /** Active alerts */
  alerts: BridgeAlert[];
  /** Per-chain stats */
  chainStats: ChainStats[];
}

/** Per-chain statistics. */
export interface ChainStats {
  chain: ChainFamily;
  chainId: number;
  /** Total liquidity on this chain */
  totalLiquidity: bigint;
  /** Number of active pools involving this chain */
  poolCount: number;
  /** Volume in last 24h */
  volume24h: bigint;
  /** Pending transfers from this chain */
  pendingTransfers: number;
  /** Average swap time (seconds) */
  avgSwapTimeSeconds: number;
  /** Success rate in last 24h (0–1) */
  successRate: number;
}

/** Bridge alert. */
export interface BridgeAlert {
  /** Alert ID */
  id: string;
  /** Severity level */
  severity: AlertSeverity;
  /** Alert type */
  type: AlertType;
  /** Human-readable message */
  message: string;
  /** Affected chain */
  chain?: ChainFamily;
  /** Affected pool ID */
  poolId?: string;
  /** Timestamp when alert was raised */
  createdAt: number;
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
}

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertType =
  | "low_liquidity"       // Pool liquidity below threshold
  | "high_slippage"       // Swap price impact exceeds threshold
  | "bridge_delay"        // Transfer taking longer than expected
  | "bridge_failure"      // Transfer failed
  | "pool_paused"         // Pool has been paused
  | "chain_outage"        // Chain appears unresponsive
  | "rate_anomaly"        // Exchange rate deviates significantly
  | "system";             // General system alert

/** Pool health status. */
export interface PoolHealth {
  poolId: string;
  status: PoolStatus;
  reserveA: bigint;
  reserveB: bigint;
  utilization: number;
  feeApy: number;
  lastSwapAge: number; // seconds since last swap
  healthScore: number; // 0-100
}

/** Swap rate between two tokens. */
export interface SwapRate {
  /** Source token symbol */
  fromToken: string;
  /** Destination token symbol */
  toToken: string;
  /** Current exchange rate (toToken per fromToken) */
  rate: number;
  /** 24h high */
  high24h: number;
  /** 24h low */
  low24h: number;
  /** 24h volume */
  volume24h: bigint;
  /** Last updated timestamp */
  updatedAt: number;
}

/** Configuration for the state manager. */
export interface BridgeStateManagerConfig {
  /** Health check interval in milliseconds */
  healthCheckIntervalMs: number;
  /** Alert callback */
  onAlert?: (alert: BridgeAlert) => void;
  /** Low liquidity threshold (percentage) */
  lowLiquidityThreshold: number;
  /** High slippage threshold (basis points) */
  highSlippageThresholdBps: number;
  /** Bridge delay threshold (seconds) */
  bridgeDelayThresholdSeconds: number;
}

// ============================================================
// BridgeStateManager
// ============================================================

const DEFAULT_CONFIG: BridgeStateManagerConfig = {
  healthCheckIntervalMs: 30000,
  lowLiquidityThreshold: 0.1, // 10% of initial
  highSlippageThresholdBps: 500, // 5%
  bridgeDelayThresholdSeconds: 3600, // 1 hour
};

export class BridgeStateManager {
  private config: BridgeStateManagerConfig;
  private pools: Map<string, LiquidityPool> = new Map();
  private swaps: Map<string, AtomicSwap> = new Map();
  private transferStates: Map<string, Record<string, unknown>> = new Map();
  private alerts: BridgeAlert[] = [];
  private swapRates: Map<string, SwapRate> = new Map();
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private alertCounter = 0;

  constructor(config?: Partial<BridgeStateManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---- Pool Registration ----

  /**
   * Register a pool for monitoring.
   */
  registerPool(pool: LiquidityPool): void {
    this.pools.set(pool.poolId, pool);
    this.checkPoolHealth(pool);
  }

  /**
   * Update a pool's state.
   */
  updatePool(pool: LiquidityPool): void {
    this.pools.set(pool.poolId, pool);
    this.checkPoolHealth(pool);
  }

  /**
   * Get health status for a pool.
   */
  getPoolHealth(poolId: string): PoolHealth | null {
    const pool = this.pools.get(poolId);
    if (!pool) return null;

    const now = Math.floor(Date.now() / 1000);
    const lastSwapAge = pool.lastSwapAt > 0 ? now - pool.lastSwapAt : now - pool.createdAt;

    // Calculate health score
    let score = 100;

    // Deduct for inactive status
    if (pool.status !== "active") score -= 30;

    // Deduct for low utilization (stagnant pool)
    if (lastSwapAge > 86400) score -= 20; // No swaps in 24h

    // Deduct for high fees
    if (pool.feeBps > 100) score -= 10;

    // Deduct for low reserves
    const minReserve = 1000000n; // Arbitrary minimum
    if (pool.reserveA < minReserve || pool.reserveB < minReserve) {
      score -= 20;
    }

    return {
      poolId,
      status: pool.status,
      reserveA: pool.reserveA,
      reserveB: pool.reserveB,
      utilization: this.calculateUtilization(pool),
      feeApy: this.estimateFeeApy(pool),
      lastSwapAge,
      healthScore: Math.max(0, score),
    };
  }

  // ---- Swap Registration ----

  /**
   * Register a swap for monitoring.
   */
  registerSwap(swap: AtomicSwap): void {
    this.swaps.set(swap.swapId, swap);
    this.checkSwapHealth(swap);
  }

  /**
   * Update a swap's state.
   */
  updateSwap(swap: AtomicSwap): void {
    this.swaps.set(swap.swapId, swap);
    this.checkSwapHealth(swap);
  }

  /**
   * Get active swaps count.
   */
  getActiveSwapCount(): number {
    let count = 0;
    for (const swap of this.swaps.values()) {
      if (swap.status !== "completed" && swap.status !== "aborted") {
        count++;
      }
    }
    return count;
  }

  // ---- Transfer State Tracking ----

  /**
   * Track a transfer's state.
   */
  trackTransfer(transferId: string, state: Record<string, unknown>): void {
    this.transferStates.set(transferId, {
      ...state,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get tracked transfer state.
   */
  getTransferState(transferId: string): Record<string, unknown> | null {
    return this.transferStates.get(transferId) ?? null;
  }

  /**
   * Get pending transfer count.
   */
  getPendingTransferCount(): number {
    let count = 0;
    for (const state of this.transferStates.values()) {
      if (state.state === "pending" || state.state === "relaying") {
        count++;
      }
    }
    return count;
  }

  // ---- Swap Rates ----

  /**
   * Update a swap rate.
   */
  updateSwapRate(fromToken: string, toToken: string, rate: number): void {
    const key = `${fromToken}-${toToken}`;
    const existing = this.swapRates.get(key);
    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      existing.rate = rate;
      existing.high24h = Math.max(existing.high24h, rate);
      existing.low24h = Math.min(existing.low24h, rate);
      existing.updatedAt = now;

      // Check for rate anomaly
      const deviation = Math.abs(rate - existing.rate) / existing.rate;
      if (deviation > 0.1) {
        this.raiseAlert({
          severity: "warning",
          type: "rate_anomaly",
          message: `Swap rate ${fromToken}/${toToken} deviated by ${(deviation * 100).toFixed(1)}%`,
        });
      }
    } else {
      this.swapRates.set(key, {
        fromToken,
        toToken,
        rate,
        high24h: rate,
        low24h: rate,
        volume24h: 0n,
        updatedAt: now,
      });
    }
  }

  /**
   * Get swap rate for a token pair.
   */
  getSwapRate(fromToken: string, toToken: string): SwapRate | null {
    return this.swapRates.get(`${fromToken}-${toToken}`) ?? null;
  }

  // ---- Health Monitoring ----

  /**
   * Start periodic health checks.
   */
  startHealthChecks(): void {
    if (this.healthTimer) return;
    this.healthTimer = setInterval(() => {
      this.runHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Stop periodic health checks.
   */
  stopHealthChecks(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }

  /**
   * Run a manual health check.
   */
  runHealthCheck(): BridgeStateSnapshot {
    const now = Math.floor(Date.now() / 1000);

    // Check all pools
    for (const pool of this.pools.values()) {
      this.checkPoolHealth(pool);
    }

    // Check all swaps
    for (const swap of this.swaps.values()) {
      this.checkSwapHealth(swap);
    }

    // Check transfers
    for (const [id, state] of this.transferStates.entries()) {
      if (state.updatedAt && now - (state.updatedAt as number) / 1000 > this.config.bridgeDelayThresholdSeconds) {
        this.raiseAlert({
          severity: "warning",
          type: "bridge_delay",
          message: `Transfer ${id} has been pending for over ${this.config.bridgeDelayThresholdSeconds}s`,
        });
      }
    }

    return this.getSnapshot();
  }

  /**
   * Get aggregate bridge state snapshot.
   */
  getSnapshot(): BridgeStateSnapshot {
    const now = Math.floor(Date.now() / 1000);
    const activePools = Array.from(this.pools.values()).filter((p) => p.status === "active");

    // Calculate per-chain stats
    const chainMap = new Map<string, ChainStats>();

    for (const pool of activePools) {
      const addChain = (chain: ChainFamily, chainId: number, liquidity: bigint) => {
        const key = `${chain}:${chainId}`;
        const existing = chainMap.get(key);
        if (existing) {
          existing.totalLiquidity += liquidity;
          existing.poolCount += 1;
        } else {
          chainMap.set(key, {
            chain,
            chainId,
            totalLiquidity: liquidity,
            poolCount: 1,
            volume24h: 0n,
            pendingTransfers: 0,
            avgSwapTimeSeconds: 600,
            successRate: 0.95,
          });
        }
      };

      addChain(pool.chainA, pool.chainAId, pool.reserveA);
      addChain(pool.chainB, pool.chainBId, pool.reserveB);
    }

    // Calculate health score
    let healthScore = 100;
    const criticalAlerts = this.alerts.filter((a) => !a.acknowledged && a.severity === "critical");
    const warningAlerts = this.alerts.filter((a) => !a.acknowledged && a.severity === "warning");
    healthScore -= criticalAlerts.length * 20;
    healthScore -= warningAlerts.length * 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      timestamp: now,
      totalValueLocked: this.calculateTvl(),
      volume24h: 0, // Would be populated from real data
      fees24h: 0, // Would be populated from real data
      activePoolCount: activePools.length,
      pendingTransferCount: this.getPendingTransferCount(),
      activeSwapCount: this.getActiveSwapCount(),
      healthScore,
      alerts: this.alerts.filter((a) => !a.acknowledged),
      chainStats: Array.from(chainMap.values()),
    };
  }

  // ---- Alerts ----

  /**
   * Get all unacknowledged alerts.
   */
  getActiveAlerts(): BridgeAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge an alert.
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.acknowledged = true;
    return true;
  }

  /**
   * Clear all acknowledged alerts.
   */
  clearAcknowledgedAlerts(): void {
    this.alerts = this.alerts.filter((a) => !a.acknowledged);
  }

  // ---- Cleanup ----

  /** Dispose of the state manager. */
  dispose(): void {
    this.stopHealthChecks();
    this.pools.clear();
    this.swaps.clear();
    this.transferStates.clear();
    this.swapRates.clear();
    this.alerts = [];
  }

  // ---- Internal ----

  private checkPoolHealth(pool: LiquidityPool): void {
    // Check low liquidity
    const minLiquidity = 1000000n; // Arbitrary threshold
    if (pool.reserveA < minLiquidity || pool.reserveB < minLiquidity) {
      this.raiseAlert({
        severity: "warning",
        type: "low_liquidity",
        message: `Pool ${pool.poolId} has low liquidity: ${pool.reserveA} ${pool.tokenA.symbol}, ${pool.reserveB} ${pool.tokenB.symbol}`,
        poolId: pool.poolId,
      });
    }

    // Check paused pool
    if (pool.status === "paused") {
      this.raiseAlert({
        severity: "warning",
        type: "pool_paused",
        message: `Pool ${pool.poolId} is paused`,
        poolId: pool.poolId,
      });
    }

    // Check depleted pool
    if (pool.status === "depleted") {
      this.raiseAlert({
        severity: "critical",
        type: "low_liquidity",
        message: `Pool ${pool.poolId} is depleted`,
        poolId: pool.poolId,
      });
    }
  }

  private checkSwapHealth(swap: AtomicSwap): void {
    const now = Math.floor(Date.now() / 1000);

    // Check for expired swaps that haven't been refunded
    if (swap.status === "lockedA" || swap.status === "lockedB" || swap.status === "lockedB") {
      const legAExpired = now > swap.legA.timeLockExpiry && swap.legA.state === "locked";
      const legBExpired = now > swap.legB.timeLockExpiry && swap.legB.state === "locked";

      if (legAExpired || legBExpired) {
        this.raiseAlert({
          severity: "critical",
          type: "bridge_failure",
          message: `HTLC swap ${swap.swapId} has expired leg(s)`,
        });
      }
    }

    // Check for stuck swaps
    const age = now - swap.createdAt;
    if (age > 7200 && swap.status !== "completed" && swap.status !== "aborted") {
      this.raiseAlert({
        severity: "warning",
        type: "bridge_delay",
        message: `HTLC swap ${swap.swapId} has been active for ${age}s`,
      });
    }
  }

  private raiseAlert(
    config: Omit<BridgeAlert, "id" | "createdAt" | "acknowledged">,
  ): BridgeAlert {
    this.alertCounter++;
    const alert: BridgeAlert = {
      ...config,
      id: `alert-${this.alertCounter}`,
      createdAt: Math.floor(Date.now() / 1000),
      acknowledged: false,
    };
    this.alerts.push(alert);

    if (this.config.onAlert) {
      try {
        this.config.onAlert(alert);
      } catch {
        // Don't let alert handler errors break the system
      }
    }

    return alert;
  }

  private calculateUtilization(pool: LiquidityPool): number {
    if (pool.k === 0n) return 0;
    // Rough estimate based on fee accumulation vs reserves
    const totalVolume = pool.swapCount > 0 ? pool.totalFeesCollected * BigInt(10000 / pool.feeBps) : 0n;
    const avgReserve = (pool.reserveA + pool.reserveB) / 2n;
    if (avgReserve === 0n) return 0;
    return Math.min(1, Number(totalVolume) / Number(avgReserve));
  }

  private estimateFeeApy(pool: LiquidityPool): number {
    if (pool.totalFeesCollected === 0n || pool.createdAt === 0) return 0;
    const now = Math.floor(Date.now() / 1000);
    const ageSeconds = now - pool.createdAt;
    if (ageSeconds === 0) return 0;

    // Annualized fee rate
    const annualized = (Number(pool.totalFeesCollected) / ageSeconds) * 31536000;
    const avgReserve = Number((pool.reserveA + pool.reserveB) / 2n);
    if (avgReserve === 0) return 0;
    return (annualized / avgReserve) * 100;
  }

  private calculateTvl(): number {
    let tvl = 0;
    for (const pool of this.pools.values()) {
      // Simplified: sum of reserves (in real implementation, would use price oracles)
      tvl += Number(pool.reserveA) + Number(pool.reserveB);
    }
    return tvl;
  }
}
