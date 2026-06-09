/**
 * AtomicSwap — HTLC Implementation Tests
 */

import { describe, it, expect } from "vitest";
import {
  AtomicSwapManager,
  generateSecret,
  computeHash,
  verifySecret,
  type InitiateSwapConfig,
} from "../src/AtomicSwap";

// ============================================================
// Crypto Helpers
// ============================================================

describe("generateSecret", () => {
  it("generates a 64-character hex string", () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique secrets", () => {
    const s1 = generateSecret();
    const s2 = generateSecret();
    expect(s1).not.toBe(s2);
  });
});

describe("computeHash & verifySecret", () => {
  it("computes a hash from a secret", async () => {
    const secret = generateSecret();
    const hash = await computeHash(secret);
    expect(hash.length).toBeGreaterThan(0);
    expect(typeof hash).toBe("string");
  });

  it("verifies correct secret", async () => {
    const secret = "abc123";
    const hash = await computeHash(secret);
    const valid = await verifySecret(secret, hash);
    expect(valid).toBe(true);
  });

  it("rejects wrong secret", async () => {
    const hash = await computeHash("correct");
    const valid = await verifySecret("wrong", hash);
    expect(valid).toBe(false);
  });
});

// ============================================================
// AtomicSwapManager
// ============================================================

function makeSwapConfig(overrides: Partial<InitiateSwapConfig> = {}): InitiateSwapConfig {
  return {
    chainA: "evm",
    chainAId: 1,
    chainB: "evm",
    chainBId: 42161,
    initiatorAddressA: "0xinitiator",
    participantAddressB: "0xparticipant",
    participantReceiveAddressA: "0xparticipantRecv",
    initiatorReceiveAddressB: "0xinitiatorRecv",
    amountA: 1000000000000000000n, // 1 ETH
    amountB: 1000000000000000000n,
    tokenSymbolA: "ETH",
    tokenSymbolB: "ETH",
    timeLockA: 7200,
    timeLockB: 3600,
    ...overrides,
  };
}

describe("AtomicSwapManager — initiate", () => {
  it("creates a swap with generated secret", async () => {
    const manager = new AtomicSwapManager();
    const config = makeSwapConfig();
    const { swapId, secret, swap } = await manager.initiate(config);

    expect(swapId).toMatch(/^htlc-/);
    expect(secret.length).toBe(64);
    expect(swap.hashLock.length).toBeGreaterThan(0);
    expect(swap.status).toBe("initiated");
    expect(swap.legA.state).toBe("created");
    expect(swap.legB.state).toBe("created");
  });

  it("rejects invalid time lock ordering", async () => {
    const manager = new AtomicSwapManager();
    const config = makeSwapConfig({
      timeLockA: 1000,
      timeLockB: 2000, // B > A — invalid
    });
    await expect(manager.initiate(config)).rejects.toThrow("Time lock B");
  });

  it("uses provided secret when given", async () => {
    const manager = new AtomicSwapManager();
    const config = makeSwapConfig({ secret: "deadbeef".repeat(8) });
    const { secret, swap } = await manager.initiate(config);

    expect(secret).toBe("deadbeef".repeat(8));
    const hash = await computeHash(secret);
    expect(swap.hashLock).toBe(hash);
  });
});

describe("AtomicSwapManager — lock", () => {
  it("locks leg A then leg B", async () => {
    const manager = new AtomicSwapManager();
    const { swapId } = await manager.initiate(makeSwapConfig());

    const swapA = manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");
    expect(swapA.legA.state).toBe("locked");
    expect(swapA.status).toBe("lockedA");

    const swapB = manager.lock(swapId, "B", "0xhtlcB", 2000, "0xtxB");
    expect(swapB.legB.state).toBe("locked");
    expect(swapB.status).toBe("lockedB");
  });

  it("rejects locking B before A", async () => {
    const manager = new AtomicSwapManager();
    const { swapId } = await manager.initiate(makeSwapConfig());

    expect(() => manager.lock(swapId, "B", "0xhtlcB", 2000, "0xtxB")).toThrow(
      "Leg A must be locked",
    );
  });

  it("rejects double lock", async () => {
    const manager = new AtomicSwapManager();
    const { swapId } = await manager.initiate(makeSwapConfig());

    manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");
    expect(() => manager.lock(swapId, "A", "0xhtlcA2", 1001, "0xtxA2")).toThrow(
      "state is locked",
    );
  });
});

describe("AtomicSwapManager — claim", () => {
  it("claims both legs with correct secret", async () => {
    const manager = new AtomicSwapManager();
    const { swapId, secret } = await manager.initiate(makeSwapConfig());

    manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");
    manager.lock(swapId, "B", "0xhtlcB", 2000, "0xtxB");

    // Claim B first (reveals secret)
    const swapB = await manager.claim(swapId, "B", secret, "0xclaimB");
    expect(swapB.legB.state).toBe("claimed");
    expect(swapB.legB.secret).toBe(secret);
    expect(swapB.status).toBe("claimedB");

    // Claim A (uses same secret)
    const swapA = await manager.claim(swapId, "A", secret, "0xclaimA");
    expect(swapA.legA.state).toBe("claimed");
    expect(swapA.status).toBe("completed");
  });

  it("rejects wrong secret", async () => {
    const manager = new AtomicSwapManager();
    const { swapId } = await manager.initiate(makeSwapConfig());

    manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");
    manager.lock(swapId, "B", "0xhtlcB", 2000, "0xtxB");

    await expect(manager.claim(swapId, "B", "wrongsecret", "0xtx")).rejects.toThrow(
      "Secret does not match",
    );
  });

  it("rejects claim on un-locked leg", async () => {
    const manager = new AtomicSwapManager();
    const { swapId, secret } = await manager.initiate(makeSwapConfig());

    await expect(manager.claim(swapId, "A", secret, "0xtx")).rejects.toThrow(
      'state is created, expected "locked"',
    );
  });
});

describe("AtomicSwapManager — refund", () => {
  it("refunds expired leg", async () => {
    const manager = new AtomicSwapManager();
    // Use very short timelock for test
    const { swapId } = await manager.initiate(
      makeSwapConfig({ timeLockA: 1, timeLockB: 0 }),
    );

    manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");

    // Wait for expiry
    await new Promise((r) => setTimeout(r, 1100));

    const swap = manager.refund(swapId, "A", "0xrefundA");
    expect(swap.legA.state).toBe("refunded");
    expect(swap.status).toBe("refundedA");
  });

  it("rejects refund before expiry", async () => {
    const manager = new AtomicSwapManager();
    const { swapId } = await manager.initiate(makeSwapConfig());

    manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");

    expect(() => manager.refund(swapId, "A", "0xrefundA")).toThrow(
      "timelock has not yet expired",
    );
  });
});

describe("AtomicSwapManager — queries", () => {
  it("retrieves swap by ID", async () => {
    const manager = new AtomicSwapManager();
    const { swapId } = await manager.initiate(makeSwapConfig());

    const swap = manager.getSwap(swapId);
    expect(swap).not.toBeNull();
    expect(swap!.swapId).toBe(swapId);
  });

  it("returns null for unknown swap", () => {
    const manager = new AtomicSwapManager();
    expect(manager.getSwap("nonexistent")).toBeNull();
  });

  it("filters by status", async () => {
    const manager = new AtomicSwapManager();
    await manager.initiate(makeSwapConfig());
    await manager.initiate(makeSwapConfig());

    const initiated = manager.getSwapsByStatus("initiated");
    expect(initiated.length).toBe(2);
  });

  it("returns pending secret", async () => {
    const manager = new AtomicSwapManager();
    const { swapId, secret } = await manager.initiate(makeSwapConfig());

    expect(manager.getSecret(swapId)).toBe(secret);
  });

  it("clears secret after claim", async () => {
    const manager = new AtomicSwapManager();
    const { swapId, secret } = await manager.initiate(makeSwapConfig());

    manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");
    manager.lock(swapId, "B", "0xhtlcB", 2000, "0xtxB");
    await manager.claim(swapId, "B", secret, "0xclaimB");

    expect(manager.getSecret(swapId)).toBeNull();
  });
});

describe("AtomicSwapManager — events", () => {
  it("emits events on state changes", async () => {
    const manager = new AtomicSwapManager();
    const { swapId } = await manager.initiate(makeSwapConfig());

    const events: string[] = [];
    manager.on(swapId, (_swap, event) => events.push(event.type));

    manager.lock(swapId, "A", "0xhtlcA", 1000, "0xtxA");
    expect(events).toContain("leg_locked");
  });

  it("global listener receives all events", async () => {
    const manager = new AtomicSwapManager();
    const events: string[] = [];
    manager.onGlobal((_swap, event) => events.push(event.type));

    const { swapId } = await manager.initiate(makeSwapConfig());
    expect(events).toContain("swap_created");
  });
});
