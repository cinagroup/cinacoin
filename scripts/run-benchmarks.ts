#!/usr/bin/env tsx
/**
 * Run all benchmark suites and generate reports.
 *
 * Usage:
 *   npx tsx scripts/run-benchmarks.ts [options]
 *
 * Options:
 *   --suite <name>           Run only this suite (sdk | adapter | ui)
 *   --ci                     CI mode: compare against baseline
 *   --baseline-file <path>   Path to baseline JSON (default: benchmarks/baseline.json)
 *   --regression-threshold <pct>  Fail if any metric regresses > N% (default: 20)
 *   --save-baseline <path>   Save current results as new baseline
 *   --output-dir <path>      Output directory (default: benchmarks/results)
 *   --iterations <n>         Override per-benchmark iteration count
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── CLI Parsing ──────────────────────────────────────────────────────────

interface CliArgs {
  suite?: string;
  ci: boolean;
  baselineFile: string;
  regressionThreshold: number;
  saveBaseline?: string;
  outputDir: string;
  iterations?: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const cli: CliArgs = {
    ci: false,
    baselineFile: resolve(ROOT, "benchmarks/baseline.json"),
    regressionThreshold: 20,
    outputDir: resolve(ROOT, "benchmarks/results"),
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--suite":
        cli.suite = args[++i];
        break;
      case "--ci":
        cli.ci = true;
        break;
      case "--baseline-file":
        cli.baselineFile = resolve(ROOT, args[++i]);
        break;
      case "--regression-threshold":
        cli.regressionThreshold = parseInt(args[++i], 10);
        break;
      case "--save-baseline":
        cli.saveBaseline = resolve(ROOT, args[++i]);
        break;
      case "--output-dir":
        cli.outputDir = resolve(ROOT, args[++i]);
        break;
      case "--iterations":
        cli.iterations = parseInt(args[++i], 10);
        break;
    }
  }
  return cli;
}

// ── Types ────────────────────────────────────────────────────────────────

interface BenchmarkSample {
  label: string;
  durationMs: number;
  meta?: Record<string, string | number | boolean>;
}

interface SuiteInput {
  name: string;
  description: string;
  samples: BenchmarkSample[];
}

interface Percentiles {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface LabelResult {
  label: string;
  stats: Percentiles;
}

interface SuiteResult {
  suiteName: string;
  description: string;
  totalDurationMs: number;
  byLabel: LabelResult[];
}

interface BaselineEntry {
  suiteName: string;
  label: string;
  p50: number;
  p95: number;
  p99: number;
}

interface Comparison {
  suite: string;
  label: string;
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  deltaPct: number;
  regression: boolean;
}

interface AllResults {
  timestamp: string;
  gitSha: string;
  nodeVersion: string;
  platform: string;
  suites: SuiteResult[];
  comparisons: Comparison[];
}

// ── Stats ────────────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeStats(values: number[]): Percentiles {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, count: 0 };
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

function aggregateSuite(suite: SuiteInput): SuiteResult {
  const grouped = new Map<string, number[]>();
  for (const s of suite.samples) {
    if (!grouped.has(s.label)) grouped.set(s.label, []);
    grouped.get(s.label)!.push(s.durationMs);
  }
  const byLabel: LabelResult[] = [];
  for (const [label, values] of grouped) {
    byLabel.push({ label, stats: computeStats(values) });
  }
  byLabel.sort((a, b) => a.label.localeCompare(b.label));
  return {
    suiteName: suite.name,
    description: suite.description,
    totalDurationMs: suite.samples.reduce((a, s) => a + s.durationMs, 0),
    byLabel,
  };
}

// ── Suite loader ─────────────────────────────────────────────────────────

interface SuiteModule {
  default: {
    name: string;
    description: string;
    run(): Promise<{ name: string; description: string; samples: BenchmarkSample[] }>;
  };
}

const SUITE_MAP: Record<string, string> = {
  sdk: "../benchmarks/sdk-perf.ts",
  adapter: "../benchmarks/adapter-perf.ts",
  ui: "../benchmarks/ui-perf.ts",
};

async function loadSuite(key: string): Promise<SuiteModule> {
  const path = SUITE_MAP[key];
  if (!path) throw new Error(`Unknown suite: ${key}. Available: ${Object.keys(SUITE_MAP).join(", ")}`);
  return await import(path);
}

// ── Git SHA ──────────────────────────────────────────────────────────────

function getGitSha(): string {
  try {
    const { execSync } = require("node:child_process");
    return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  } catch {
    return "unknown";
  }
}

// ── Report generation ────────────────────────────────────────────────────

function ms(v: number): string {
  if (v < 0) return `-${ms(-v)}`;
  if (v < 1) return `${(v * 1000).toFixed(1)}μs`;
  if (v < 1000) return `${v.toFixed(2)}ms`;
  return `${(v / 1000).toFixed(2)}s`;
}

function generateMarkdown(all: AllResults): string {
  const lines: string[] = [];
  lines.push("# Cinacoin Benchmark Report");
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Timestamp | ${all.timestamp} |`);
  lines.push(`| Commit | \`${all.gitSha}\` |`);
  lines.push(`| Node | ${all.nodeVersion} |`);
  lines.push(`| Platform | ${all.platform} |`);
  lines.push("");

  if (all.comparisons.length > 0) {
    const regressions = all.comparisons.filter((c) => c.regression);
    lines.push("## Regression Analysis");
    lines.push("");
    if (regressions.length > 0) {
      lines.push(`⚠️ **${regressions.length} regression(s) detected!**`);
    } else {
      lines.push("✅ No regressions detected.");
    }
    lines.push("");
    lines.push("| Suite | Label | Metric | Baseline | Current | Δ% |");
    lines.push("|-------|-------|--------|---------:|--------:|---:|");
    for (const c of all.comparisons) {
      const flag = c.regression ? "🔴" : "✅";
      lines.push(
        `| ${c.suite} | ${c.label} | ${c.metric} | ${ms(c.baseline)} | ${ms(c.current)} | ${c.deltaPct >= 0 ? "+" : ""}${c.deltaPct.toFixed(1)}% ${flag} |`,
      );
    }
    lines.push("");
  }

  for (const suite of all.suites) {
    lines.push(`## ${suite.suiteName}`);
    lines.push("");
    lines.push(`> ${suite.description}`);
    lines.push("");
    lines.push(`Total: **${ms(suite.totalDurationMs)}**`);
    lines.push("");
    lines.push("| Label | Count | Avg | P50 | P95 | P99 | Min | Max |");
    lines.push("|-------|------:|----:|----:|----:|----:|----:|----:|");
    for (const lr of suite.byLabel) {
      const s = lr.stats;
      lines.push(
        `| ${lr.label} | ${s.count} | ${ms(s.avg)} | ${ms(s.p50)} | ${ms(s.p95)} | ${ms(s.p99)} | ${ms(s.min)} | ${ms(s.max)} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();

  console.log("🔬 Cinacoin Benchmark Runner");
  console.log(`   Date: ${new Date().toISOString()}`);
  console.log(`   Node: ${process.version}`);
  console.log(`   Platform: ${process.platform} ${process.arch}`);
  if (cli.suite) console.log(`   Suite: ${cli.suite}`);
  if (cli.ci) console.log(`   CI mode: threshold=${cli.regressionThreshold}%`);
  console.log("");

  const suiteKeys = cli.suite ? [cli.suite] : Object.keys(SUITE_MAP);
  const allResults: AllResults = {
    timestamp: new Date().toISOString(),
    gitSha: getGitSha(),
    nodeVersion: process.version,
    platform: `${process.platform} ${process.arch}`,
    suites: [],
    comparisons: [],
  };

  for (const key of suiteKeys) {
    console.log(`\n━━━ Suite: ${key} ━━━`);
    const mod = await loadSuite(key);
    const t0 = performance.now();
    const result = await mod.default.run();
    const totalMs = performance.now() - t0;

    const aggregated = aggregateSuite({
      ...result,
      totalDurationMs: totalMs,
    });
    aggregated.totalDurationMs = totalMs;
    allResults.suites.push(aggregated);

    // Print summary
    for (const lr of aggregated.byLabel) {
      const s = lr.stats;
      console.log(
        `   ${lr.label}: P50=${ms(s.p50)}  P95=${ms(s.p95)}  P99=${ms(s.p99)}  (n=${s.count})`,
      );
    }
  }

  // Baseline comparison
  if (cli.ci && existsSync(cli.baselineFile)) {
    const baselineRaw = readFileSync(cli.baselineFile, "utf-8");
    const baseline: BaselineEntry[] = JSON.parse(baselineRaw);
    const blMap = new Map<string, BaselineEntry>();
    for (const b of baseline) {
      blMap.set(`${b.suiteName}::${b.label}`, b);
    }

    for (const suite of allResults.suites) {
      for (const lr of suite.byLabel) {
        const key = `${suite.suiteName}::${lr.label}`;
        const bl = blMap.get(key);
        if (!bl) continue;
        for (const metric of ["p50", "p95", "p99"] as const) {
          const baseVal = bl[metric];
          const curVal = lr.stats[metric];
          const delta = curVal - baseVal;
          const deltaPct = baseVal > 0 ? (delta / baseVal) * 100 : 0;
          allResults.comparisons.push({
            suite: suite.suiteName,
            label: lr.label,
            metric,
            baseline: baseVal,
            current: curVal,
            delta,
            deltaPct,
            regression: deltaPct > cli.regressionThreshold,
          });
        }
      }
    }

    const regressions = allResults.comparisons.filter((c) => c.regression);
    if (regressions.length > 0) {
      console.error(`\n❌ REGRESSION DETECTED (${regressions.length}):`);
      for (const r of regressions) {
        console.error(
          `   ${r.suite} / ${r.label} ${r.metric}: ${ms(r.baseline)} → ${ms(r.current)} (+${r.deltaPct.toFixed(1)}%)`,
        );
      }
    } else {
      console.log("\n✅ No regressions vs baseline.");
    }
  }

  // Write output
  mkdirSync(cli.outputDir, { recursive: true });

  const jsonPath = resolve(cli.outputDir, "latest.json");
  writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));
  console.log(`\n📄 JSON → ${jsonPath}`);

  const mdPath = resolve(cli.outputDir, "report.md");
  writeFileSync(mdPath, generateMarkdown(allResults));
  console.log(`📄 Markdown → ${mdPath}`);

  // Save baseline
  if (cli.saveBaseline) {
    const baseline: BaselineEntry[] = [];
    for (const suite of allResults.suites) {
      for (const lr of suite.byLabel) {
        baseline.push({
          suiteName: suite.suiteName,
          label: lr.label,
          p50: lr.stats.p50,
          p95: lr.stats.p95,
          p99: lr.stats.p99,
        });
      }
    }
    writeFileSync(cli.saveBaseline, JSON.stringify(baseline, null, 2));
    console.log(`💾 Baseline → ${cli.saveBaseline}`);
  }

  // Exit code
  if (cli.ci) {
    const regressions = allResults.comparisons.filter((c) => c.regression);
    if (regressions.length > 0) {
      console.error(`\n❌ ${regressions.length} regression(s) — failing CI.`);
      process.exit(1);
    }
  }

  console.log("\n✅ Benchmarks complete.");
}

main().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});
