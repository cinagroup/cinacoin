/**
 * Benchmark result aggregation and reporting.
 * Provides P50/P95/P99/Avg/Min/Max computation, JSON output,
 * Markdown table generation, and baseline comparison.
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface BenchmarkSample {
  /** Label for this measurement (e.g. "warm", "cold", "core-sdk") */
  label: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Optional metadata */
  meta?: Record<string, string | number | boolean>;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  /** All samples collected during the run */
  samples: BenchmarkSample[];
  /** ISO timestamp when suite started */
  startedAt: string;
  /** ISO timestamp when suite finished */
  finishedAt: string;
  /** Total duration of the entire suite in ms */
  totalDurationMs: number;
}

export interface Percentiles {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export interface LabelResult {
  label: string;
  samples: number[];
  stats: Percentiles;
}

export interface SuiteResult {
  suiteName: string;
  description: string;
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  byLabel: LabelResult[];
}

export interface BaselineComparison {
  label: string;
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  deltaPct: number;
  regression: boolean;
}

export interface AllResults {
  timestamp: string;
  gitSha: string;
  nodeVersion: string;
  platform: string;
  suites: SuiteResult[];
  comparisons: BaselineComparison[];
}

// ── Stat helpers ────────────────────────────────────────────────────────

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function computeStats(values: number[]): Percentiles {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, count: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    avg: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}

export function aggregateSuite(suite: BenchmarkSuite): SuiteResult {
  const grouped = new Map<string, number[]>();
  for (const s of suite.samples) {
    if (!grouped.has(s.label)) grouped.set(s.label, []);
    grouped.get(s.label)!.push(s.durationMs);
  }
  const byLabel: LabelResult[] = [];
  for (const [label, values] of grouped) {
    byLabel.push({ label, samples: values, stats: computeStats(values) });
  }
  // Sort by label for deterministic output
  byLabel.sort((a, b) => a.label.localeCompare(b.label));
  return {
    suiteName: suite.name,
    description: suite.description,
    startedAt: suite.startedAt,
    finishedAt: suite.finishedAt,
    totalDurationMs: suite.totalDurationMs,
    byLabel,
  };
}

// ── Baseline comparison ─────────────────────────────────────────────────

export interface BaselineEntry {
  suiteName: string;
  label: string;
  p50: number;
  p95: number;
  p99: number;
}

export function compareAgainstBaseline(
  results: SuiteResult[],
  baseline: BaselineEntry[],
  thresholdPct: number,
): BaselineComparison[] {
  const comparisons: BaselineComparison[] = [];
  const baselineMap = new Map<string, BaselineEntry>();
  for (const b of baseline) {
    baselineMap.set(`${b.suiteName}::${b.label}`, b);
  }
  for (const suite of results) {
    for (const lr of suite.byLabel) {
      const key = `${suite.suiteName}::${lr.label}`;
      const bl = baselineMap.get(key);
      if (!bl) continue;
      for (const metric of ["p50", "p95", "p99"] as const) {
        const baseVal = bl[metric];
        const curVal = lr.stats[metric];
        const delta = curVal - baseVal;
        const deltaPct = baseVal > 0 ? (delta / baseVal) * 100 : 0;
        comparisons.push({
          label: lr.label,
          metric,
          baseline: baseVal,
          current: curVal,
          delta,
          deltaPct,
          regression: deltaPct > thresholdPct,
        });
      }
    }
  }
  return comparisons;
}

// ── Markdown table generation ──────────────────────────────────────────

function ms(v: number): string {
  if (v < 0) return `-${ms(-v)}`;
  if (v < 1) return `${(v * 1000).toFixed(1)}μs`;
  if (v < 1000) return `${v.toFixed(1)}ms`;
  return `${(v / 1000).toFixed(2)}s`;
}

export function suiteToMarkdown(result: SuiteResult): string {
  const lines: string[] = [];
  lines.push(`## ${result.suiteName}`);
  lines.push("");
  lines.push(`> ${result.description}`);
  lines.push("");
  lines.push(`Total suite time: **${ms(result.totalDurationMs)}**`);
  lines.push("");
  lines.push("| Group | Count | Avg | Min | P50 | P95 | P99 | Max |");
  lines.push("|-------|------:|----:|----:|----:|----:|----:|----:|");
  for (const lr of result.byLabel) {
    lines.push(
      `| ${lr.label} | ${lr.stats.count} | ${ms(lr.stats.avg)} | ${ms(lr.stats.min)} | ${ms(lr.stats.p50)} | ${ms(lr.stats.p95)} | ${ms(lr.stats.p99)} | ${ms(lr.stats.max)} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

export function allResultsToMarkdown(all: AllResults): string {
  const lines: string[] = [];
  lines.push("# Performance Benchmark Results");
  lines.push("");
  lines.push(`Generated: ${all.timestamp}`);
  lines.push(`Commit: ${all.gitSha}`);
  lines.push(`Node: ${all.nodeVersion}`);
  lines.push(`Platform: ${all.platform}`);
  lines.push("");

  if (all.comparisons.length > 0) {
    lines.push("## Baseline Comparison");
    lines.push("");
    const regressions = all.comparisons.filter((c) => c.regression);
    if (regressions.length > 0) {
      lines.push(`⚠️ **${regressions.length} regression(s) detected!**`);
      lines.push("");
    } else {
      lines.push("✅ No regressions detected.");
      lines.push("");
    }
    lines.push("| Suite | Group | Metric | Baseline | Current | Δ | Δ% |");
    lines.push("|-------|-------|--------|---------:|--------:|--:|---:|");
    for (const c of all.comparisons) {
      const flag = c.regression ? "🔴" : "✅";
      lines.push(
        `| ${c.label} | ${c.metric.toUpperCase()} | ${ms(c.baseline)} | ${ms(c.current)} | ${c.delta >= 0 ? "+" : ""}${ms(c.delta)} | ${c.deltaPct >= 0 ? "+" : ""}${c.deltaPct.toFixed(1)}% ${flag} |`,
      );
    }
    lines.push("");
  }

  for (const suite of all.suites) {
    lines.push(suiteToMarkdown(suite));
  }
  return lines.join("\n");
}

// ── Reown target comparison ────────────────────────────────────────────

export interface ReownTarget {
  suiteName: string;
  label: string;
  targetMs: number;
}

export const REOWN_TARGETS: ReownTarget[] = [
  { suiteName: "SDK Init", label: "core-sdk", targetMs: 100 },
  { suiteName: "SDK Init", label: "react-provider", targetMs: 150 },
  { suiteName: "SDK Init", label: "vue-composable", targetMs: 150 },
  { suiteName: "SDK Init", label: "core-sdk-warm", targetMs: 50 },
  { suiteName: "WalletConnect", label: "pairing", targetMs: 400 },
  { suiteName: "WalletConnect", label: "session-proposal", targetMs: 300 },
  { suiteName: "WalletConnect", label: "session-approval", targetMs: 300 },
  { suiteName: "WalletConnect", label: "total-connect", targetMs: 1000 },
  { suiteName: "Chain Switch", label: "switch", targetMs: 50 },
  { suiteName: "Chain Switch", label: "rapid-switch", targetMs: 80 },
  { suiteName: "Chain Switch", label: "rpc-response", targetMs: 200 },
  { suiteName: "Transaction Build", label: "build", targetMs: 50 },
  { suiteName: "Transaction Build", label: "gas-estimate", targetMs: 100 },
  { suiteName: "Transaction Build", label: "sign", targetMs: 50 },
];

export function compareAgainstReown(results: SuiteResult[]): BaselineComparison[] {
  const comparisons: BaselineComparison[] = [];
  for (const target of REOWN_TARGETS) {
    const suite = results.find((r) => r.suiteName === target.suiteName);
    if (!suite) continue;
    const lr = suite.byLabel.find((l) => l.label === target.label);
    if (!lr) continue;
    const current = lr.stats.p50;
    const delta = current - target.targetMs;
    const deltaPct = target.targetMs > 0 ? (delta / target.targetMs) * 100 : 0;
    comparisons.push({
      label: target.label,
      metric: "p50 vs reown target",
      baseline: target.targetMs,
      current,
      delta,
      deltaPct,
      regression: deltaPct > 0, // any overshoot is flagged
    });
  }
  return comparisons;
}

// ── JSON serialization helpers ─────────────────────────────────────────

export function serializeResults(all: AllResults): string {
  return JSON.stringify(all, null, 2);
}

export function parseResults(json: string): AllResults {
  return JSON.parse(json) as AllResults;
}
