/**
 * SDK Performance Benchmarks
 *
 * Measures core SDK operations:
 *   - Cold init (first-time SDK instantiation)
 *   - Warm init (subsequent instantiation with cached state)
 *   - Sign message (ECDSA signature)
 *   - Send transaction (build + sign + broadcast stub)
 *   - Connect (full wallet-connect handshake stub)
 *
 * Each operation is run N times; results report P50 / P95 / P99.
 */

// ── Types ────────────────────────────────────────────────────────────────

interface Sample {
  label: string;
  durationMs: number;
  meta?: Record<string, string | number | boolean>;
}

interface BenchResult {
  name: string;
  description: string;
  samples: Sample[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

const ITERATIONS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Simulate crypto work proportional to `complexity` (0–1). */
function fakeCryptoWork(complexity: number): void {
  // Busy-wait for a deterministic duration to simulate signing / hashing.
  const target = complexity * 0.5; // max 0.5 ms
  const start = performance.now();
  while (performance.now() - start < target) {
    /* spin */
  }
}

async function measure(label: string, fn: () => void | Promise<void>): Promise<Sample> {
  const t0 = performance.now();
  await fn();
  return { label, durationMs: performance.now() - t0 };
}

// ── Benchmark: Cold Init ─────────────────────────────────────────────────

async function benchColdInit(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    // Simulate module resolution + config parse + transport bootstrap
    const s = await measure("cold-init", () => {
      fakeCryptoWork(0.3);
    });
    samples.push(s);
  }
  return samples;
}

// ── Benchmark: Warm Init ─────────────────────────────────────────────────

async function benchWarmInit(): Promise<Sample[]> {
  // "Warm" = state already cached from a prior init
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const s = await measure("warm-init", () => {
      fakeCryptoWork(0.05);
    });
    samples.push(s);
  }
  return samples;
}

// ── Benchmark: Sign Message ──────────────────────────────────────────────

async function benchSign(): Promise<Sample[]> {
  const samples: Sample[] = [];
  const msg = "0x" + "ab".repeat(32); // 32-byte message
  for (let i = 0; i < ITERATIONS; i++) {
    const s = await measure("sign-message", () => {
      fakeCryptoWork(0.4); // simulate secp256k1 sign
    });
    s.meta = { messageLength: msg.length };
    samples.push(s);
  }
  return samples;
}

// ── Benchmark: Send Transaction ──────────────────────────────────────────

async function benchSend(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const s = await measure("send-transaction", async () => {
      // 1. Build tx
      fakeCryptoWork(0.15);
      // 2. Estimate gas
      fakeCryptoWork(0.1);
      // 3. Sign
      fakeCryptoWork(0.4);
      // 4. Broadcast (network I/O stub)
      await sleep(0.2);
    });
    samples.push(s);
  }
  return samples;
}

// ── Benchmark: Connect ───────────────────────────────────────────────────

async function benchConnect(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const s = await measure("connect", async () => {
      // 1. Create pairing URI
      fakeCryptoWork(0.1);
      // 2. Wait for wallet approval (stub)
      await sleep(0.5);
      // 3. Session establishment
      fakeCryptoWork(0.15);
    });
    samples.push(s);
  }
  return samples;
}

// ── Runner ───────────────────────────────────────────────────────────────

export async function run(): Promise<BenchResult> {
  const allSamples: Sample[] = [];

  console.log("   → cold-init …");
  allSamples.push(...(await benchColdInit()));

  console.log("   → warm-init …");
  allSamples.push(...(await benchWarmInit()));

  console.log("   → sign-message …");
  allSamples.push(...(await benchSign()));

  console.log("   → send-transaction …");
  allSamples.push(...(await benchSend()));

  console.log("   → connect …");
  allSamples.push(...(await benchConnect()));

  return {
    name: "SDK Performance",
    description:
      "Core SDK operations — init, sign, send, connect. Each operation measured " +
      `${ITERATIONS}×. Simulated crypto/network work for deterministic CI runs.`,
    samples: allSamples,
  };
}

export default {
  name: "SDK Performance",
  description:
    "Core SDK operations — init, sign, send, connect. Each operation measured " +
    `${ITERATIONS}×. Simulated crypto/network work for deterministic CI runs.`,
  run,
};
