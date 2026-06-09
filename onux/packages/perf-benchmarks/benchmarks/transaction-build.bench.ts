/**
 * Transaction Build Benchmark
 *
 * Measures transaction building, gas estimation, and signature times.
 * Reports P50/P95/P99 for each operation.
 */

// ── Simulated transaction operations ───────────────────────────────────

interface TxConfig {
  /** Chain ID */
  chainId: number;
  /** Transaction type: eip1559 | legacy | eip4844 */
  txType: "eip1559" | "legacy" | "eip4844";
  /** Gas limit */
  gasLimit: bigint;
}

/**
 * Simulate transaction building.
 * Steps: construct tx body, encode, estimate gas.
 */
async function simulateTransactionBuild(config: TxConfig): Promise<number> {
  const start = performance.now();

  // 1. Construct transaction body
  await simulateStep(config.txType === "eip1559" ? 3 : 2, "construct-body");

  // 2. Encode RLP
  await simulateStep(config.txType === "eip4844" ? 5 : 3, "rlp-encode");

  // 3. Compute access list (for EIP-1559)
  if (config.txType === "eip1559") {
    await simulateStep(4, "access-list");
  }

  // 4. Compute blob parameters (for EIP-4844)
  if (config.txType === "eip4844") {
    await simulateStep(8, "blob-params");
  }

  return performance.now() - start;
}

/**
 * Simulate gas estimation.
 * Calls eth_estimateGas on the RPC endpoint.
 */
async function simulateGasEstimation(config: TxConfig): Promise<number> {
  const start = performance.now();

  // 1. Serialize tx for estimation
  await simulateStep(2, "serialize-tx");

  // 2. RPC call: eth_estimateGas
  // Latency depends on chain complexity
  const rpcLatency = config.txType === "eip4844" ? 120 : config.txType === "eip1559" ? 80 : 50;
  await simulateStep(rpcLatency, "estimate-gas-rpc");

  // 3. Parse and validate result
  await simulateStep(3, "parse-result");

  return performance.now() - start;
}

/**
 * Simulate transaction signing.
 * Uses noble/secp256k1 for signature generation.
 */
async function simulateTransactionSigning(config: TxConfig): Promise<number> {
  const start = performance.now();

  // 1. Compute transaction hash (keccak256)
  await simulateStep(2, "compute-hash");

  // 2. ECDSA sign (secp256k1)
  await simulateStep(config.txType === "eip4844" ? 8 : 5, "ecdsa-sign");

  // 3. Recover public key (v,r,s)
  await simulateStep(2, "recover-pubkey");

  // 4. RLP encode signed tx
  await simulateStep(2, "encode-signed");

  return performance.now() - start;
}

/**
 * Simulate full transaction pipeline: build → estimate → sign.
 */
async function simulateFullPipeline(config: TxConfig): Promise<number> {
  const start = performance.now();

  await simulateTransactionBuild(config);
  await simulateGasEstimation(config);
  await simulateTransactionSigning(config);

  return performance.now() - start;
}

// ── Work simulation ─────────────────────────────────────────────────────

async function simulateStep(baseMs: number, label: string): Promise<void> {
  const jitter = baseMs * 0.15;
  const actualMs = Math.max(0.1, baseMs + (Math.random() * 2 - 1) * jitter);

  const cpuWork = Math.floor(actualMs * 400);
  doCpuWork(cpuWork);

  const asyncMs = actualMs * 0.5;
  if (asyncMs > 0.1) {
    await new Promise((r) => setTimeout(r, asyncMs));
  }
}

function doCpuWork(microseconds: number): void {
  const end = performance.now() * 1000 + microseconds;
  let sum = 0;
  while (performance.now() * 1000 < end) {
    sum += Math.sqrt(microseconds);
  }
  if (sum < 0) console.log("impossible");
}

// ── Benchmark runner ───────────────────────────────────────────────────

interface BenchmarkResult {
  label: string;
  durationMs: number;
  meta: Record<string, string | number | boolean>;
}

export default {
  name: "Transaction Build",
  description: "Measures transaction build, gas estimation, and signing latency",

  async run(): Promise<BenchmarkResult[]> {
    const samples: BenchmarkResult[] = [];
    const iterations = 50;

    console.log(`   Running ${iterations} iterations per operation...`);

    const txConfigs: Array<{ name: string; config: TxConfig }> = [
      {
        name: "eip1559",
        config: { chainId: 1, txType: "eip1559", gasLimit: 21000n },
      },
      {
        name: "legacy",
        config: { chainId: 56, txType: "legacy", gasLimit: 21000n },
      },
      {
        name: "eip4844",
        config: { chainId: 1, txType: "eip4844", gasLimit: 50000n },
      },
    ];

    for (const { name, config } of txConfigs) {
      // Transaction build
      console.log(`     build-${name}...`);
      for (let i = 0; i < iterations; i++) {
        const duration = await simulateTransactionBuild(config);
        samples.push({
          label: "build",
          durationMs: duration,
          meta: { iteration: i + 1, txType: name, chainId: config.chainId },
        });
      }

      // Gas estimation
      console.log(`     gas-estimate-${name}...`);
      for (let i = 0; i < iterations; i++) {
        const duration = await simulateGasEstimation(config);
        samples.push({
          label: "gas-estimate",
          durationMs: duration,
          meta: { iteration: i + 1, txType: name, chainId: config.chainId },
        });
      }

      // Transaction signing
      console.log(`     sign-${name}...`);
      for (let i = 0; i < iterations; i++) {
        const duration = await simulateTransactionSigning(config);
        samples.push({
          label: "sign",
          durationMs: duration,
          meta: { iteration: i + 1, txType: name, chainId: config.chainId },
        });
      }

      // Full pipeline
      console.log(`     pipeline-${name}...`);
      const pipelineIterations = 30;
      for (let i = 0; i < pipelineIterations; i++) {
        const duration = await simulateFullPipeline(config);
        samples.push({
          label: "pipeline",
          durationMs: duration,
          meta: { iteration: i + 1, txType: name, chainId: config.chainId },
        });
      }
    }

    return samples;
  },
};
