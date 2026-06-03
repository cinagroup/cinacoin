/**
 * LiquidityPool — AMM Tests
 */

import { describe, it, expect } from "vitest";
import { LiquidityPoolManager, type CreatePoolConfig, type SwapConfig } from "../src/LiquidityPool";

const ETH = { symbol: "ETH", address: "0xeth", decimals: 18 };
const USDC = { symbol: "USDC", address: "0xusdc", decimals: 6 };

function makePoolConfig(overrides: Partial<CreatePoolConfig> = {}): CreatePoolConfig {
  return {
    chainA: "evm",
    chainAId: 1,
    chainB: "evm",
    chainBId: 42161,
    tokenA: ETH,
    tokenB: USDC,
    ...overrides,
  };
}

// ============================================================
// Pool Creation
// ============================================================

describe("LiquidityPoolManager — createPool", () => {
  it("creates a pool with initial liquidity", () => {
    const manager = new LiquidityPoolManager();
    const config = makePoolConfig();
    const { pool, receipt } = manager.createPool(
      config,
      1000000000000000000n, // 1 ETH
      3000000000n, // 3000 USDC
      "0xlp1",
    );

    expect(pool.poolId).toMatch(/^pool-/);
    expect(pool.reserveA).toBe(1000000000000000000n);
    expect(pool.reserveB).toBe(3000000000n);
    expect(pool.k).toBe(1000000000000000000n * 3000000000n);
    expect(pool.status).toBe("active");
    expect(receipt.type).toBe("deposit");
    expect(receipt.lpTokensIssued > 0n).toBe(true);
  });

  it("rejects zero initial liquidity", () => {
    const manager = new LiquidityPoolManager();
    expect(() =>
      manager.createPool(makePoolConfig(), 0n, 1000n, "0xlp"),
    ).toThrow("must be positive");
  });

  it("rejects duplicate pool IDs", () => {
    const manager = new LiquidityPoolManager();
    const config = makePoolConfig();
    manager.createPool(config, 1000n, 2000n, "0xlp1");
    expect(() =>
      manager.createPool(config, 1000n, 2000n, "0xlp2"),
    ).toThrow("Pool already exists");
  });

  it("locks minimum liquidity", () => {
    const manager = new LiquidityPoolManager();
    const { pool, receipt } = manager.createPool(
      makePoolConfig(),
      1000000n,
      1000000n,
      "0xlp1",
    );
    // LP tokens should be k - MINIMUM_LIQUIDITY
    expect(pool.totalLpTokens).toBeLessThan(pool.k);
  });
});

// ============================================================
// Deposit
// ============================================================

describe("LiquidityPoolManager — deposit", () => {
  it("adds liquidity and mints LP tokens", () => {
    const manager = new LiquidityPoolManager();
    const config = makePoolConfig();
    const { pool } = manager.createPool(config, 1000n, 2000n, "0xlp1");

    const receipt = manager.deposit({
      poolId: pool.poolId,
      provider: "0xlp2",
      amountA: 500n,
      amountB: 1000n,
    });

    expect(receipt.lpTokensIssued > 0n).toBe(true);
    expect(receipt.amountA).toBe(500n);
    expect(receipt.amountB).toBe(1000n);

    const updatedPool = manager.getPool(pool.poolId)!;
    expect(updatedPool.reserveA).toBe(1500n);
    expect(updatedPool.reserveB).toBe(3000n);
  });

  it("rejects deposit to non-existent pool", () => {
    const manager = new LiquidityPoolManager();
    expect(() =>
      manager.deposit({ poolId: "nonexistent", provider: "0x", amountA: 1n, amountB: 1n }),
    ).toThrow("Pool not found");
  });

  it("rejects deposit to paused pool", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");
    manager.pausePool(pool.poolId);

    expect(() =>
      manager.deposit({ poolId: pool.poolId, provider: "0x", amountA: 1n, amountB: 1n }),
    ).toThrow("not active");
  });
});

// ============================================================
// Withdraw
// ============================================================

describe("LiquidityPoolManager — withdraw", () => {
  it("burns LP tokens and returns proportional reserves", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");

    // Get the LP tokens from creation receipt
    const position = manager.getPosition(pool.poolId, "0xlp1")!;
    const lpToWithdraw = position.lpTokens / 2n;

    const receipt = manager.withdraw({
      poolId: pool.poolId,
      provider: "0xlp1",
      lpTokens: lpToWithdraw,
      minAmountA: 0n,
      minAmountB: 0n,
    });

    expect(receipt.type).toBe("withdraw");
    expect(receipt.amountA > 0n).toBe(true);
    expect(receipt.amountB > 0n).toBe(true);
  });

  it("respects minimum amounts", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");

    const position = manager.getPosition(pool.poolId, "0xlp1")!;

    expect(() =>
      manager.withdraw({
        poolId: pool.poolId,
        provider: "0xlp1",
        lpTokens: position.lpTokens,
        minAmountA: 999999999999n, // Unrealistic minimum
        minAmountB: 0n,
      }),
    ).toThrow("below minimums");
  });

  it("marks pool depleted when reserves hit zero", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");

    const position = manager.getPosition(pool.poolId, "0xlp1")!;

    manager.withdraw({
      poolId: pool.poolId,
      provider: "0xlp1",
      lpTokens: position.lpTokens,
      minAmountA: 0n,
      minAmountB: 0n,
    });

    // Pool should be near depleted (within rounding)
    const updated = manager.getPool(pool.poolId)!;
    expect(updated.status).toBe("depleted");
  });
});

// ============================================================
// Swap / Quote
// ============================================================

describe("LiquidityPoolManager — getQuote", () => {
  it("calculates correct output amount", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(
      makePoolConfig(),
      1000000000000000000n, // 1 ETH
      3000000000n, // 3000 USDC
      "0xlp1",
    );

    const quote = manager.getQuote({
      poolId: pool.poolId,
      direction: "A-to-B",
      inputAmount: 100000000000000000n, // 0.1 ETH
    });

    expect(quote.inputAmount).toBe(100000000000000000n);
    expect(quote.outputAmount > 0n).toBe(true);
    expect(quote.feeAmount > 0n).toBe(true);
    expect(quote.effectiveRate > 0).toBe(true);
    expect(quote.minOutput <= quote.outputAmount).toBe(true);
  });

  it("rejects swap with excessive price impact", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(
      makePoolConfig(),
      1000n,
      2000n,
      "0xlp1",
    );

    // Try to swap a huge amount — should exceed price impact limit
    expect(() =>
      manager.getQuote({
        poolId: pool.poolId,
        direction: "A-to-B",
        inputAmount: 900n, // 90% of reserves
        maxPriceImpactBps: 300,
      }),
    ).toThrow("Price impact");
  });

  it("rejects swap on paused pool", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");
    manager.pausePool(pool.poolId);

    expect(() =>
      manager.getQuote({
        poolId: pool.poolId,
        direction: "A-to-B",
        inputAmount: 100n,
      }),
    ).toThrow("cannot process swaps");
  });
});

describe("LiquidityPoolManager — executeSwap", () => {
  it("executes swap and updates reserves", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(
      makePoolConfig(),
      1000000000000000000n,
      3000000000n,
      "0xlp1",
    );

    const { quote, pool: updatedPool } = manager.executeSwap({
      poolId: pool.poolId,
      direction: "A-to-B",
      inputAmount: 100000000000000000n, // 0.1 ETH
    });

    expect(updatedPool.reserveA > pool.reserveA).toBe(true); // More ETH in
    expect(updatedPool.reserveB < pool.reserveB).toBe(true); // USDC out
    expect(updatedPool.swapCount).toBe(1);
    expect(updatedPool.totalFeesCollected > 0n).toBe(true);
  });
});

// ============================================================
// Pool Queries
// ============================================================

describe("LiquidityPoolManager — queries", () => {
  it("finds pools for a chain pair", () => {
    const manager = new LiquidityPoolManager();
    manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");
    manager.createPool(makePoolConfig({ feeBps: 50 }), 500n, 1500n, "0xlp2");

    const pools = manager.getPoolsForPair("evm", "evm");
    expect(pools.length).toBe(2);
  });

  it("tracks provider positions", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");
    manager.deposit({ poolId: pool.poolId, provider: "0xlp2", amountA: 100n, amountB: 200n });

    const positions = manager.getProviderPositions("0xlp2");
    expect(positions.length).toBe(1);
    expect(positions[0].poolId).toBe(pool.poolId);
  });

  it("pause and resume", () => {
    const manager = new LiquidityPoolManager();
    const { pool } = manager.createPool(makePoolConfig(), 1000n, 2000n, "0xlp1");

    manager.pausePool(pool.poolId);
    expect(manager.getPool(pool.poolId)!.status).toBe("paused");

    manager.resumePool(pool.poolId);
    expect(manager.getPool(pool.poolId)!.status).toBe("active");
  });
});
