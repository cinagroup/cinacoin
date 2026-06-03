/**
 * LiquidityPool — Automated Market Maker (AMM) for Cross-Chain Liquidity
 *
 * Provides constant-product (x * y = k) AMM pools for cross-chain swaps
 * with slippage protection, fee distribution, and LP token management.
 *
 * Key features:
 *   - Pool creation for any supported token pair across chains
 *   - Deposit / withdraw liquidity (add/remove LP)
 *   - Swap rate calculation with dynamic fees
 *   - Slippage protection via price impact limits
 *   - Fee accrual and distribution to liquidity providers
 *   - Pool health monitoring (reserve ratios, utilization)
 */

import type { ChainFamily } from "./types";

// ============================================================
// Types
// ============================================================

/** Unique pool identifier. */
export type PoolId = string;

/** A liquidity pool for a token pair across two chains. */
export interface LiquidityPool {
  /** Unique pool ID */
  poolId: PoolId;
  /** Source chain */
  chainA: ChainFamily;
  chainAId: number;
  /** Destination chain */
  chainB: ChainFamily;
  chainBId: number;
  /** Token on chain A */
  tokenA: TokenInfo;
  /** Token on chain B */
  tokenB: TokenInfo;
  /** Reserve of token A (in smallest unit) */
  reserveA: bigint;
  /** Reserve of token B (in smallest unit) */
  reserveB: bigint;
  /** Constant product K = reserveA * reserveB */
  k: bigint;
  /** Swap fee in basis points (e.g., 30 = 0.30%) */
  feeBps: number;
  /** Protocol fee in basis points (taken from swap fee) */
  protocolFeeBps: number;
  /** Total LP tokens issued */
  totalLpTokens: bigint;
  /** Pool creation timestamp */
  createdAt: number;
  /** Last swap timestamp */
  lastSwapAt: number;
  /** Total swaps processed */
  swapCount: number;
  /** Total fees collected (in token A equivalent) */
  totalFeesCollected: bigint;
  /** Pool status */
  status: PoolStatus;
}

/** Token metadata. */
export interface TokenInfo {
  /** Token symbol */
  symbol: string;
  /** Token address on the chain */
  address: string;
  /** Token decimals */
  decimals: number;
}

/** Pool operational status. */
export type PoolStatus = "active" | "paused" | "draining" | "depleted";

/** LP position for a liquidity provider. */
export interface LpPosition {
  /** Pool ID */
  poolId: PoolId;
  /** LP address */
  provider: string;
  /** LP tokens held */
  lpTokens: bigint;
  /** Initial deposit amounts */
  depositedA: bigint;
  depositedB: bigint;
  /** Fees earned (in token A equivalent) */
  feesEarned: bigint;
  /** Deposit timestamp */
  depositedAt: number;
  /** Last withdrawal timestamp */
  lastWithdrawnAt: number;
}

/** Swap quote result. */
export interface SwapQuote {
  /** Input amount */
  inputAmount: bigint;
  /** Expected output amount (before fee) */
  outputAmountBeforeFee: bigint;
  /** Actual output amount (after fee) */
  outputAmount: bigint;
  /** Fee charged (in output token) */
  feeAmount: bigint;
  /** Protocol fee portion */
  protocolFeeAmount: bigint;
  /** Price impact in basis points */
  priceImpactBps: number;
  /** Effective exchange rate (output / input) */
  effectiveRate: number;
  /** Minimum output after slippage tolerance */
  minOutput: bigint;
}

/** Deposit/withdraw receipt. */
export interface LiquidityReceipt {
  poolId: PoolId;
  provider: string;
  lpTokensIssued: bigint;
  amountA: bigint;
  amountB: bigint;
  timestamp: number;
  type: "deposit" | "withdraw";
}

/** Pool configuration for creation. */
export interface CreatePoolConfig {
  chainA: ChainFamily;
  chainAId: number;
  chainB: ChainFamily;
  chainBId: number;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  /** Swap fee in basis points (default 30 = 0.30%) */
  feeBps?: number;
  /** Protocol fee in basis points (default 5 = ~16.7% of swap fee) */
  protocolFeeBps?: number;
}

/** Swap configuration. */
export interface SwapConfig {
  poolId: PoolId;
  /** Direction: A→B or B→A */
  direction: "A-to-B" | "B-to-A";
  /** Input amount */
  inputAmount: bigint;
  /** Maximum acceptable price impact in basis points (default 300 = 3%) */
  maxPriceImpactBps?: number;
}

/** Deposit configuration. */
export interface DepositConfig {
  poolId: PoolId;
  provider: string;
  amountA: bigint;
  amountB: bigint;
  /** Maximum LP token dilution tolerance (ratio, e.g., 0.01 = 1%) */
  maxDilution?: number;
}

/** Withdraw configuration. */
export interface WithdrawConfig {
  poolId: PoolId;
  provider: string;
  /** LP tokens to burn */
  lpTokens: bigint;
  /** Minimum amounts to receive */
  minAmountA: bigint;
  minAmountB: bigint;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_FEE_BPS = 30; // 0.30%
const DEFAULT_PROTOCOL_FEE_BPS = 5; // ~16.7% of swap fee goes to protocol
const DEFAULT_MAX_PRICE_IMPACT_BPS = 300; // 3%
const MINIMUM_LIQUIDITY = 1000n; // Prevents first depositor from being exploited

// ============================================================
// LiquidityPoolManager
// ============================================================

export class LiquidityPoolManager {
  private pools: Map<PoolId, LiquidityPool> = new Map();
  private positions: Map<string, LpPosition[]> = new Map(); // provider → positions
  private poolPositions: Map<PoolId, Map<string, LpPosition>> = new Map(); // pool → (provider → position)

  // ---- Pool Creation ----

  /**
   * Create a new liquidity pool with initial liquidity.
   * The creator must provide initial amounts for both tokens.
   */
  createPool(
    config: CreatePoolConfig,
    initialAmountA: bigint,
    initialAmountB: bigint,
    provider: string,
  ): { pool: LiquidityPool; receipt: LiquidityReceipt } {
    if (initialAmountA <= 0n || initialAmountB <= 0n) {
      throw new Error("Initial liquidity amounts must be positive");
    }

    const poolId = this.generatePoolId(config);

    if (this.pools.has(poolId)) {
      throw new Error(`Pool already exists: ${poolId}`);
    }

    const feeBps = config.feeBps ?? DEFAULT_FEE_BPS;
    const protocolFeeBps = config.protocolFeeBps ?? DEFAULT_PROTOCOL_FEE_BPS;

    const k = initialAmountA * initialAmountB;
    const totalLp = k - MINIMUM_LIQUIDITY; // Minimum liquidity locked

    if (totalLp <= 0n) {
      throw new Error("Initial liquidity too small");
    }

    const now = Math.floor(Date.now() / 1000);

    const pool: LiquidityPool = {
      poolId,
      chainA: config.chainA,
      chainAId: config.chainAId,
      chainB: config.chainB,
      chainBId: config.chainBId,
      tokenA: config.tokenA,
      tokenB: config.tokenB,
      reserveA: initialAmountA,
      reserveB: initialAmountB,
      k,
      feeBps,
      protocolFeeBps,
      totalLpTokens: totalLp,
      createdAt: now,
      lastSwapAt: now,
      swapCount: 0,
      totalFeesCollected: 0n,
      status: "active",
    };

    this.pools.set(poolId, pool);

    // Record LP position
    const position: LpPosition = {
      poolId,
      provider,
      lpTokens: totalLp,
      depositedA: initialAmountA,
      depositedB: initialAmountB,
      feesEarned: 0n,
      depositedAt: now,
      lastWithdrawnAt: 0,
    };
    this.addPosition(position);

    const receipt: LiquidityReceipt = {
      poolId,
      provider,
      lpTokensIssued: totalLp,
      amountA: initialAmountA,
      amountB: initialAmountB,
      timestamp: now,
      type: "deposit",
    };

    return { pool, receipt };
  }

  // ---- Deposit ----

  /**
   * Add liquidity to an existing pool.
   * LP tokens are issued proportional to the contribution.
   */
  deposit(config: DepositConfig): LiquidityReceipt {
    const pool = this.getPoolOrThrow(config.poolId);
    if (pool.status !== "active") {
      throw new Error(`Pool ${config.poolId} is not active (status: ${pool.status})`);
    }

    if (config.amountA <= 0n || config.amountB <= 0n) {
      throw new Error("Deposit amounts must be positive");
    }

    // Calculate LP tokens proportional to contribution
    const lpTokensA = (config.amountA * pool.totalLpTokens) / pool.reserveA;
    const lpTokensB = (config.amountB * pool.totalLpTokens) / pool.reserveB;
    const lpTokens = lpTokensA < lpTokensB ? lpTokensA : lpTokensB;

    if (lpTokens <= 0n) {
      throw new Error("Deposit too small to mint LP tokens");
    }

    // Update pool reserves
    pool.reserveA += config.amountA;
    pool.reserveB += config.amountB;
    pool.totalLpTokens += lpTokens;
    pool.k = pool.reserveA * pool.reserveB;

    // Update or create LP position
    const now = Math.floor(Date.now() / 1000);
    const existing = this.getPosition(config.poolId, config.provider);
    if (existing) {
      existing.lpTokens += lpTokens;
      existing.depositedA += config.amountA;
      existing.depositedB += config.amountB;
    } else {
      this.addPosition({
        poolId: config.poolId,
        provider: config.provider,
        lpTokens,
        depositedA: config.amountA,
        depositedB: config.amountB,
        feesEarned: 0n,
        depositedAt: now,
        lastWithdrawnAt: 0,
      });
    }

    return {
      poolId: config.poolId,
      provider: config.provider,
      lpTokensIssued: lpTokens,
      amountA: config.amountA,
      amountB: config.amountB,
      timestamp: now,
      type: "deposit",
    };
  }

  // ---- Withdraw ----

  /**
   * Remove liquidity by burning LP tokens.
   * Proportional share of reserves is returned.
   */
  withdraw(config: WithdrawConfig): LiquidityReceipt {
    const pool = this.getPoolOrThrow(config.poolId);
    if (config.lpTokens <= 0n) {
      throw new Error("LP tokens must be positive");
    }

    // Calculate proportional withdrawal
    const amountA = (config.lpTokens * pool.reserveA) / pool.totalLpTokens;
    const amountB = (config.lpTokens * pool.reserveB) / pool.totalLpTokens;

    if (amountA < config.minAmountA || amountB < config.minAmountB) {
      throw new Error(
        `Withdrawal amounts (${amountA}, ${amountB}) below minimums (${config.minAmountA}, ${config.minAmountB})`,
      );
    }

    // Check sufficient balance
    const position = this.getPosition(config.poolId, config.provider);
    if (!position || position.lpTokens < config.lpTokens) {
      throw new Error("Insufficient LP token balance");
    }

    // Update pool reserves
    pool.reserveA -= amountA;
    pool.reserveB -= amountB;
    pool.totalLpTokens -= config.lpTokens;
    pool.k = pool.reserveA * pool.reserveB;

    // Check if pool is depleted
    if (pool.reserveA === 0n || pool.reserveB === 0n) {
      pool.status = "depleted";
    }

    // Update LP position
    const now = Math.floor(Date.now() / 1000);
    position.lpTokens -= config.lpTokens;
    position.lastWithdrawnAt = now;

    // Remove position if fully withdrawn
    if (position.lpTokens === 0n) {
      this.removePosition(config.poolId, config.provider);
    }

    return {
      poolId: config.poolId,
      provider: config.provider,
      lpTokensIssued: config.lpTokens,
      amountA,
      amountB,
      timestamp: now,
      type: "withdraw",
    };
  }

  // ---- Swap / Quote ----

  /**
   * Calculate a swap quote without executing the swap.
   * Uses constant-product formula: output = (input * reserve_out * (1 - fee)) / (reserve_in + input * (1 - fee))
   */
  getQuote(config: SwapConfig): SwapQuote {
    const pool = this.getPoolOrThrow(config.poolId);
    const maxPriceImpactBps = config.maxPriceImpactBps ?? DEFAULT_MAX_PRICE_IMPACT_BPS;

    if (config.inputAmount <= 0n) {
      throw new Error("Input amount must be positive");
    }

    if (pool.status === "depleted" || pool.status === "paused") {
      throw new Error(`Pool ${config.poolId} cannot process swaps (status: ${pool.status})`);
    }

    const isAtoB = config.direction === "A-to-B";
    const reserveIn = isAtoB ? pool.reserveA : pool.reserveB;
    const reserveOut = isAtoB ? pool.reserveB : pool.reserveA;

    // Fee calculation
    const fee = (config.inputAmount * BigInt(pool.feeBps)) / 10000n;
    const inputAfterFee = config.inputAmount - fee;

    // Protocol fee (portion of swap fee)
    const protocolFee = (fee * BigInt(pool.protocolFeeBps)) / 10000n;

    // Constant product formula
    const numerator = inputAfterFee * reserveOut;
    const denominator = reserveIn + inputAfterFee;
    const outputAmount = numerator / denominator;

    // Price impact calculation
    const spotPrice = Number(reserveOut) / Number(reserveIn);
    const effectivePrice = Number(outputAmount) / Number(config.inputAmount);
    const priceImpactBps = Math.round(
      ((spotPrice - effectivePrice) / spotPrice) * 10000,
    );

    if (priceImpactBps > maxPriceImpactBps) {
      throw new Error(
        `Price impact ${priceImpactBps} bps exceeds maximum ${maxPriceImpactBps} bps`,
      );
    }

    // Calculate minimum output (with 0.5% slippage tolerance)
    const minOutput = (outputAmount * 9950n) / 10000n;

    return {
      inputAmount: config.inputAmount,
      outputAmountBeforeFee: numerator / reserveIn,
      outputAmount,
      feeAmount: fee,
      protocolFeeAmount: protocolFee,
      priceImpactBps,
      effectiveRate: Number(outputAmount) / Number(config.inputAmount),
      minOutput,
    };
  }

  /**
   * Execute a swap through the pool.
   * Returns the quote and updates pool reserves.
   */
  executeSwap(config: SwapConfig): { quote: SwapQuote; pool: LiquidityPool } {
    const pool = this.getPoolOrThrow(config.poolId);
    const quote = this.getQuote(config);

    const isAtoB = config.direction === "A-to-B";

    // Update reserves
    if (isAtoB) {
      pool.reserveA += config.inputAmount;
      pool.reserveB -= quote.outputAmount;
    } else {
      pool.reserveB += config.inputAmount;
      pool.reserveA -= quote.outputAmount;
    }

    pool.k = pool.reserveA * pool.reserveB;
    pool.lastSwapAt = Math.floor(Date.now() / 1000);
    pool.swapCount += 1;
    pool.totalFeesCollected += quote.feeAmount;

    // Distribute fees to LPs proportional to their share
    this.distributeFees(pool, quote.feeAmount - quote.protocolFeeAmount);

    return { quote, pool };
  }

  // ---- Pool Queries ----

  /** Get pool by ID. */
  getPool(poolId: PoolId): LiquidityPool | null {
    return this.pools.get(poolId) ?? null;
  }

  /** Get all active pools. */
  getAllPools(): LiquidityPool[] {
    return Array.from(this.pools.values());
  }

  /** Get pools for a specific chain pair. */
  getPoolsForPair(chainA: ChainFamily, chainB: ChainFamily): LiquidityPool[] {
    return this.getAllPools().filter(
      (p) =>
        (p.chainA === chainA && p.chainB === chainB) ||
        (p.chainA === chainB && p.chainB === chainA),
    );
  }

  /** Get LP position for a provider in a pool. */
  getPosition(poolId: PoolId, provider: string): LpPosition | null {
    const poolMap = this.poolPositions.get(poolId);
    return poolMap?.get(provider) ?? null;
  }

  /** Get all positions for a provider. */
  getProviderPositions(provider: string): LpPosition[] {
    return this.positions.get(provider) ?? [];
  }

  /**
   * Get pool utilization (how much of reserves have been swapped recently).
   * Returns a ratio 0–1.
   */
  getUtilization(poolId: PoolId): number {
    const pool = this.getPoolOrThrow(poolId);
    const initialA = pool.reserveA + (pool.totalFeesCollected * 2n); // rough estimate
    const initialB = pool.reserveB + (pool.totalFeesCollected * 2n);
    if (initialA === 0n || initialB === 0n) return 0;

    const currentRatio = Number(pool.reserveA) / Number(initialA);
    return Math.max(0, 1 - currentRatio);
  }

  /** Pause a pool (halts swaps but allows withdrawals). */
  pausePool(poolId: PoolId): void {
    const pool = this.getPoolOrThrow(poolId);
    pool.status = "paused";
  }

  /** Resume a paused pool. */
  resumePool(poolId: PoolId): void {
    const pool = this.getPoolOrThrow(poolId);
    if (pool.status === "paused") {
      pool.status = "active";
    }
  }

  // ---- Internal ----

  private getPoolOrThrow(poolId: PoolId): LiquidityPool {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error(`Pool not found: ${poolId}`);
    return pool;
  }

  private addPosition(position: LpPosition): void {
    if (!this.positions.has(position.provider)) {
      this.positions.set(position.provider, []);
    }
    this.positions.get(position.provider)!.push(position);

    if (!this.poolPositions.has(position.poolId)) {
      this.poolPositions.set(position.poolId, new Map());
    }
    this.poolPositions.get(position.poolId)!.set(position.provider, position);
  }

  private removePosition(poolId: PoolId, provider: string): void {
    const poolMap = this.poolPositions.get(poolId);
    poolMap?.delete(provider);

    const providerPositions = this.positions.get(provider);
    if (providerPositions) {
      const idx = providerPositions.findIndex(
        (p) => p.poolId === poolId && p.lpTokens === 0n,
      );
      if (idx >= 0) providerPositions.splice(idx, 1);
    }
  }

  private distributeFees(pool: LiquidityPool, feeAmount: bigint): void {
    const positions = this.poolPositions.get(pool.poolId);
    if (!positions || pool.totalLpTokens === 0n) return;

    for (const position of positions.values()) {
      const share = (position.lpTokens * feeAmount) / pool.totalLpTokens;
      position.feesEarned += share;
    }
  }

  private generatePoolId(config: CreatePoolConfig): PoolId {
    const chains = [config.chainA, config.chainB].sort().join("-");
    const tokens = [config.tokenA.symbol, config.tokenB.symbol].sort().join("-");
    return `pool-${chains}-${tokens}-${config.chainAId}-${config.chainBId}`;
  }
}
