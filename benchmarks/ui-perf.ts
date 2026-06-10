/**
 * UI Component Rendering Performance Benchmarks
 *
 * Measures simulated React component render times for key Cinacoin UI components:
 *   - ConnectButton (first render + re-render)
 *   - ChainSelector (open + select + close)
 *   - TransactionModal (open + render list + close)
 *   - WalletCard (render with balance fetch stub)
 *   - TokenList (render 100-item virtualized list)
 *   - AddressDisplay (render + copy-to-clipboard stub)
 *
 * Note: These are CPU-only stubs that simulate render cost.
 * Real DOM rendering would require jsdom / browser harness.
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

// ── Config ───────────────────────────────────────────────────────────────

const ITERATIONS = 40;

// ── Helpers ──────────────────────────────────────────────────────────────

function spin(ms: number): void {
  const start = performance.now();
  while (performance.now() - start < ms) {
    /* spin */
  }
}

async function measure(label: string, fn: () => void): Promise<Sample> {
  const t0 = performance.now();
  fn();
  return { label, durationMs: performance.now() - t0 };
}

// ── Component benchmarks ─────────────────────────────────────────────────

async function benchConnectButton(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    samples.push(await measure("ConnectButton::first-render", () => spin(0.08)));
    samples.push(await measure("ConnectButton::re-render", () => spin(0.02)));
  }
  return samples;
}

async function benchChainSelector(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    samples.push(await measure("ChainSelector::open", () => spin(0.05)));
    samples.push(await measure("ChainSelector::select", () => spin(0.03)));
    samples.push(await measure("ChainSelector::close", () => spin(0.02)));
  }
  return samples;
}

async function benchTransactionModal(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    samples.push(await measure("TransactionModal::open", () => spin(0.06)));
    // Simulate rendering a list of 10 transactions
    samples.push(await measure("TransactionModal::render-list", () => spin(0.15)));
    samples.push(await measure("TransactionModal::close", () => spin(0.03)));
  }
  return samples;
}

async function benchWalletCard(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    samples.push(await measure("WalletCard::render", () => spin(0.04)));
    // Balance fetch stub
    samples.push(await measure("WalletCard::balance-fetch", () => spin(0.12)));
  }
  return samples;
}

async function benchTokenList(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    // Simulate virtualized list of 100 items
    samples.push(await measure("TokenList::render-100", () => spin(0.25)));
    // Scroll re-render (partial)
    samples.push(await measure("TokenList::scroll-rerender", () => spin(0.05)));
  }
  return samples;
}

async function benchAddressDisplay(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    samples.push(await measure("AddressDisplay::render", () => spin(0.02)));
    samples.push(await measure("AddressDisplay::copy", () => spin(0.01)));
  }
  return samples;
}

// ── Runner ───────────────────────────────────────────────────────────────

export async function run(): Promise<BenchResult> {
  const allSamples: Sample[] = [];

  console.log("   → ConnectButton …");
  allSamples.push(...(await benchConnectButton()));

  console.log("   → ChainSelector …");
  allSamples.push(...(await benchChainSelector()));

  console.log("   → TransactionModal …");
  allSamples.push(...(await benchTransactionModal()));

  console.log("   → WalletCard …");
  allSamples.push(...(await benchWalletCard()));

  console.log("   → TokenList …");
  allSamples.push(...(await benchTokenList()));

  console.log("   → AddressDisplay …");
  allSamples.push(...(await benchAddressDisplay()));

  return {
    name: "UI Component Performance",
    description:
      "Simulated React component render times for key Cinacoin UI components. " +
      `Each component measured ${ITERATIONS}×. CPU-only stubs (no real DOM).`,
    samples: allSamples,
  };
}

export default {
  name: "UI Component Performance",
  description:
    "Simulated React component render times for key Cinacoin UI components. " +
    `Each component measured ${ITERATIONS}×. CPU-only stubs (no real DOM).`,
  run,
};
