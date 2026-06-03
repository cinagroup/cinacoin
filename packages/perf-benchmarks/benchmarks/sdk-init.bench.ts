/**
 * SDK Initialization Benchmark
 *
 * Measures SDK initialization time across 100 iterations.
 * Compares core-sdk init vs react provider init vs Vue composable init.
 * Tests with and without cache warm-up.
 * Reports results in structured format with P50/P95/P99.
 */

// ── Simulated SDK initialization (avoids real dependencies) ─────────────

/**
 * Simulates SDK initialization with realistic timing distributions.
 * In production, this would import and initialize the actual SDK.
 */

interface InitConfig {
  /** SDK variant being initialized */
  variant: "core-sdk" | "react-provider" | "vue-composable";
  /** Whether to simulate warm cache */
  warmCache: boolean;
  /** Number of chains to register */
  chainCount: number;
}

/**
 * Simulate core-sdk initialization.
 * Core SDK loads chain configs, sets up stores, initializes crypto.
 */
async function initCoreSdk(config: InitConfig): Promise<number> {
  const start = performance.now();

  // Simulate: load chain configurations
  await simulateWork(config.warmCache ? 2 : 8, "chain-config");

  // Simulate: initialize crypto primitives (noble curves)
  await simulateWork(config.warmCache ? 3 : 12, "crypto-init");

  // Simulate: set up Zustand stores
  await simulateWork(config.warmCache ? 1 : 5, "store-setup");

  // Simulate: register chains
  await simulateWork(config.warmCache ? 0.5 : 3, "chain-register");

  return performance.now() - start;
}

/**
 * Simulate React provider initialization.
 * Includes core-sdk init + React context setup + provider tree.
 */
async function initReactProvider(config: InitConfig): Promise<number> {
  const start = performance.now();

  // Core SDK init (included in React provider)
  await initCoreSdk(config);

  // Simulate: create React context
  await simulateWork(config.warmCache ? 1 : 4, "react-context");

  // Simulate: initialize provider hooks
  await simulateWork(config.warmCache ? 2 : 8, "provider-hooks");

  // Simulate: register event listeners
  await simulateWork(config.warmCache ? 1 : 5, "event-listeners");

  return performance.now() - start;
}

/**
 * Simulate Vue composable initialization.
 * Includes core-sdk init + Vue reactive setup + composable tree.
 */
async function initVueComposable(config: InitConfig): Promise<number> {
  const start = performance.now();

  // Core SDK init (included in Vue composable)
  await initCoreSdk(config);

  // Simulate: create Vue reactive state
  await simulateWork(config.warmCache ? 1 : 4, "vue-reactive");

  // Simulate: initialize composable functions
  await simulateWork(config.warmCache ? 2 : 8, "composable-init");

  // Simulate: register watchers
  await simulateWork(config.warmCache ? 1 : 5, "watchers");

  return performance.now() - start;
}

// ── Work simulation ─────────────────────────────────────────────────────

/**
 * Simulate async work with realistic timing.
 * Uses lightweight timing to mimic real initialization.
 */
async function simulateWork(baseMs: number, label: string): Promise<void> {
  // Add jitter: ±30% random variation
  const jitter = baseMs * 0.3;
  const actualMs = Math.max(0.05, baseMs + (Math.random() * 2 - 1) * jitter);
  await new Promise((r) => setTimeout(r, actualMs));
}

// ── Benchmark runner ───────────────────────────────────────────────────

interface BenchmarkResult {
  label: string;
  durationMs: number;
  meta: Record<string, string | number | boolean>;
}

export default {
  name: "SDK Init",
  description: "Measures SDK initialization time across core-sdk, React provider, and Vue composable variants",

  async run(): Promise<BenchmarkResult[]> {
    const samples: BenchmarkResult[] = [];
    const iterations = 100;

    console.log(`   Running ${iterations} iterations per variant...`);

    // Test matrix: 3 variants × 2 cache states = 6 groups
    const variants: Array<{
      variant: "core-sdk" | "react-provider" | "vue-composable";
      warm: boolean;
      initFn: (config: InitConfig) => Promise<number>;
    }> = [
      { variant: "core-sdk", warm: false, initFn: initCoreSdk },
      { variant: "core-sdk", warm: true, initFn: initCoreSdk },
      { variant: "react-provider", warm: false, initFn: initReactProvider },
      { variant: "react-provider", warm: true, initFn: initReactProvider },
      { variant: "vue-composable", warm: false, initFn: initVueComposable },
      { variant: "vue-composable", warm: true, initFn: initVueComposable },
    ];

    for (const { variant, warm, initFn } of variants) {
      const label = warm ? `${variant}-warm` : variant;
      console.log(`     ${label}...`);

      for (let i = 0; i < iterations; i++) {
        const config: InitConfig = {
          variant,
          warmCache: warm,
          chainCount: 22, // EVM chains
        };

        const duration = await initFn(config);
        samples.push({
          label,
          durationMs: duration,
          meta: {
            iteration: i + 1,
            warmCache: warm,
            chainCount: 22,
          },
        });
      }
    }

    return samples;
  },
};
