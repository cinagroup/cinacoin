/**
 * Benchmark runner engine.
 * Executes individual benchmark suites, aggregates results,
 * and optionally compares against baselines.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

import type {
  AllResults,
  BaselineEntry,
  BenchmarkSample,
  BenchmarkSuite,
} from "./results.ts";
import {
import { logger } from '@cinacoin/logger';
  aggregateSuite,
  allResultsToMarkdown,
  compareAgainstBaseline,
  compareAgainstReown,
  serializeResults,
} from "./results.ts";

// ── Benchmark modules ──────────────────────────────────────────────────

interface BenchmarkModule {
  name: string;
  description: string;
  run(): Promise<BenchmarkSample[]>;
}

const modules: BenchmarkModule[] = [];

// Register modules dynamically
async function loadModule(path: string): Promise<BenchmarkModule> {
  const mod = await import(path);
  return mod.default as BenchmarkModule;
}

// ── CLI argument parsing ───────────────────────────────────────────────

interface CliArgs {
  filter?: string;
  ci: boolean;
  baselineFile?: string;
  regressionThreshold: number;
  saveBaseline?: string;
  outputDir: string;
  iterations?: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const cli: CliArgs = {
    ci: false,
    regressionThreshold: 20,
    outputDir: "./results",
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--filter":
        cli.filter = args[++i];
        break;
      case "--ci":
        cli.ci = true;
        break;
      case "--baseline-file":
        cli.baselineFile = args[++i];
        break;
      case "--regression-threshold":
        cli.regressionThreshold = parseInt(args[++i], 10);
        break;
      case "--save-baseline":
        cli.saveBaseline = args[++i];
        break;
      case "--output-dir":
        cli.outputDir = args[++i];
        break;
      case "--iterations":
        cli.iterations = parseInt(args[++i], 10);
        break;
    }
  }
  return cli;
}

// ── Main runner ────────────────────────────────────────────────────────

async function getGitSha(): Promise<string> {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

async function runAll(cli: CliArgs): Promise<AllResults> {
  // Import benchmark modules
  const benchmarkFiles = [
    "../benchmarks/sdk-init.bench.ts",
    "../benchmarks/wallet-connect.bench.ts",
    "../benchmarks/chain-switch.bench.ts",
    "../benchmarks/transaction-build.bench.ts",
  ];

  const allModules: BenchmarkModule[] = [];
  for (const file of benchmarkFiles) {
    try {
      const mod = await loadModule(file);
      allModules.push(mod);
    } catch (e) {
      logger.warn(`⚠️  Could not load ${file}:`, (e as Error).message);
    }
  }

  // Filter if requested
  const filtered = cli.filter
    ? allModules.filter((m) => m.name.includes(cli.filter!))
    : allModules;

  if (filtered.length === 0) {
    logger.error("No benchmark modules found matching filter.");
    process.exit(1);
  }

  const allResults: AllResults = {
    timestamp: new Date().toISOString(),
    gitSha: await getGitSha(),
    nodeVersion: process.version,
    platform: `${process.platform} ${process.arch}`,
    suites: [],
    comparisons: [],
  };

  for (const mod of filtered) {
    logger.info(`\n🏃 Running: ${mod.name}`);
    logger.info(`   ${mod.description}`);

    const startedAt = new Date().toISOString();
    const t0 = performance.now();

    const samples = await mod.run();

    const finishedAt = new Date().toISOString();
    const totalDurationMs = performance.now() - t0;

    const suite: BenchmarkSuite = {
      name: mod.name,
      description: mod.description,
      samples,
      startedAt,
      finishedAt,
      totalDurationMs,
    };

    const result = aggregateSuite(suite);
    allResults.suites.push(result);

    // Print summary
    for (const lr of result.byLabel) {
      logger.info(
        `   ${lr.label}: P50=${lr.stats.p50.toFixed(1)}ms  P95=${lr.stats.p95.toFixed(1)}ms  P99=${lr.stats.p99.toFixed(1)}ms  (n=${lr.stats.count})`,
      );
    }
  }

  // Reown target comparison
  const reownComparisons = compareAgainstReown(allResults.suites);
  allResults.comparisons.push(...reownComparisons);

  // Print Reown comparison
  if (reownComparisons.length > 0) {
    logger.info("\n📊 vs Reown AppKit targets:");
    for (const c of reownComparisons) {
      const flag = c.regression ? "🔴" : "✅";
      logger.info(
        `   ${c.label} P50: ${c.current.toFixed(1)}ms / ${c.baseline}ms target ${flag}`,
      );
    }
  }

  // Baseline comparison if available
  if (cli.ci && cli.baselineFile && existsSync(cli.baselineFile)) {
    const baselineRaw = readFileSync(cli.baselineFile, "utf-8");
    const baseline: BaselineEntry[] = JSON.parse(baselineRaw);
    const blComparisons = compareAgainstBaseline(
      allResults.suites,
      baseline,
      cli.regressionThreshold,
    );
    allResults.comparisons.push(...blComparisons);

    const regressions = blComparisons.filter((c) => c.regression);
    if (regressions.length > 0) {
      logger.error("\n❌ REGRESSION DETECTED:");
      for (const r of regressions) {
        logger.error(
          `   ${r.label} ${r.metric.toUpperCase()}: ${r.baseline.toFixed(1)}ms → ${r.current.toFixed(1)}ms (+${r.deltaPct.toFixed(1)}%)`,
        );
      }
      // Don't exit immediately — we still want to save results
    } else {
      logger.info("\n✅ No regressions vs baseline.");
    }
  }

  return allResults;
}

// ── Entry point ────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();

  logger.info("🔬 Cinacoin Performance Benchmarks");
  logger.info(`   Date: ${new Date().toISOString()}`);
  logger.info(`   Node: ${process.version}`);
  logger.info(`   Platform: ${process.platform} ${process.arch}`);
  if (cli.filter) logger.info(`   Filter: ${cli.filter}`);
  if (cli.ci) logger.info(`   CI mode: threshold=${cli.regressionThreshold}%`);

  const allResults = await runAll(cli);

  // Write results
  mkdirSync(cli.outputDir, { recursive: true });

  const jsonPath = `${cli.outputDir}/latest.json`;
  writeFileSync(jsonPath, serializeResults(allResults));
  logger.info(`\n📄 Results written to ${jsonPath}`);

  const mdPath = `${cli.outputDir}/report.md`;
  writeFileSync(mdPath, allResultsToMarkdown(allResults));
  logger.info(`📄 Markdown report written to ${mdPath}`);

  // Save baseline if requested
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
    logger.info(`💾 Baseline saved to ${cli.saveBaseline}`);
  }

  // Exit with error if CI mode has regressions
  if (cli.ci) {
    const regressions = allResults.comparisons.filter((c) => c.regression);
    if (regressions.length > 0) {
      logger.error(`\n❌ ${regressions.length} regression(s) detected. Failing CI.`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  logger.error("Benchmark runner failed:", err);
  process.exit(1);
});
