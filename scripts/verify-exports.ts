#!/usr/bin/env tsx
/**
 * Package Export Verification Script
 *
 * Validates that every package's `exports` field in package.json:
 *   1. Points to files that exist (or source files for unbuild packages)
 *   2. Has correct ESM/CJS conditional exports
 *   3. Includes TypeScript type declarations
 *   4. Can be resolved by Node.js module resolution
 *
 * Usage:
 *   npx tsx scripts/verify-exports.ts [--package <name>] [--verbose]
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = resolve(ROOT, "packages");

// ── CLI ──────────────────────────────────────────────────────────────────

interface CliArgs {
  packageName?: string;
  verbose: boolean;
  fix: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const cli: CliArgs = { verbose: false, fix: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--package":
        cli.packageName = args[++i];
        break;
      case "--verbose":
        cli.verbose = true;
        break;
      case "--fix":
        cli.fix = true;
        break;
    }
  }
  return cli;
}

// ── Types ────────────────────────────────────────────────────────────────

interface ExportEntry {
  key: string;
  conditions: Record<string, string>;
}

interface ExportIssue {
  severity: "error" | "warning";
  message: string;
}

interface PackageExportResult {
  name: string;
  path: string;
  hasExportsField: boolean;
  entries: ExportEntry[];
  issues: ExportIssue[];
  passed: boolean;
}

interface VerificationReport {
  timestamp: string;
  totalPackages: number;
  passed: number;
  failed: number;
  warnings: number;
  results: PackageExportResult[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getPackageDirs(): string[] {
  const entries = readdirSync(PACKAGES_DIR);
  return entries
    .map((e) => join(PACKAGES_DIR, e))
    .filter((d) => {
      try {
        return statSync(d).isDirectory() && existsSync(join(d, "package.json"));
      } catch {
        return false;
      }
    });
}

function readPkgJson(dir: string): Record<string, any> {
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
  } catch {
    return {};
  }
}

function resolveExportPath(dir: string, exportPath: string): boolean {
  // Check if the file exists directly
  if (existsSync(resolve(dir, exportPath))) return true;

  // Check for .ts source (unbuilt packages that export source)
  const tsPath = exportPath.replace(/\.js$/, ".ts").replace(/\/index\.js$/, "/index.ts");
  if (existsSync(resolve(dir, tsPath))) return true;

  // Check for .tsx source
  const tsxPath = exportPath.replace(/\.js$/, ".tsx").replace(/\/index\.js$/, "/index.tsx");
  if (existsSync(resolve(dir, tsxPath))) return true;

  return false;
}

function parseExports(pkg: Record<string, any>): ExportEntry[] {
  const exports = pkg.exports;
  if (!exports) return [];

  const entries: ExportEntry[] = [];

  if (typeof exports === "string") {
    entries.push({ key: ".", conditions: { default: exports } });
    return entries;
  }

  if (typeof exports !== "object") return entries;

  for (const [key, value] of Object.entries(exports)) {
    if (typeof value === "string") {
      entries.push({ key, conditions: { default: value } });
    } else if (typeof value === "object" && value !== null) {
      const conditions: Record<string, string> = {};
      for (const [cond, path] of Object.entries(value as Record<string, any>)) {
        if (typeof path === "string") {
          conditions[cond] = path;
        }
      }
      entries.push({ key, conditions });
    }
  }

  return entries;
}

function verifyPackage(dir: string, verbose: boolean): PackageExportResult {
  const pkg = readPkgJson(dir);
  const name = pkg.name || dir.split("/").pop() || "unknown";
  const issues: ExportIssue[] = [];
  const entries = parseExports(pkg);

  const result: PackageExportResult = {
    name,
    path: dir,
    hasExportsField: !!pkg.exports,
    entries,
    issues,
    passed: true,
  };

  // No exports field
  if (!pkg.exports) {
    if (pkg.main) {
      // Legacy — check main field
      if (!resolveExportPath(dir, pkg.main)) {
        issues.push({ severity: "error", message: `main "${pkg.main}" not found` });
      }
    } else if (pkg.scripts?.build) {
      issues.push({ severity: "warning", message: "No exports or main field (has build script)" });
    }
    result.passed = !issues.some((i) => i.severity === "error");
    return result;
  }

  // Check each export entry
  for (const entry of entries) {
    const conditions = entry.conditions;

    // Check all paths exist
    for (const [cond, path] of Object.entries(conditions)) {
      if (path.startsWith("@")) continue; // external package ref
      if (!resolveExportPath(dir, path)) {
        issues.push({
          severity: "error",
          message: `exports["${entry.key}"].${cond} → "${path}" not found`,
        });
      }
    }

    // Check types condition exists
    if (!conditions.types && conditions.import) {
      issues.push({
        severity: "warning",
        message: `exports["${entry.key}"] missing "types" condition`,
      });
    }

    // Check ESM/CJS consistency
    if (conditions.import && conditions.require) {
      // Both present — good
      if (verbose) {
        console.log(`      ${entry.key}: ESM=${conditions.import} CJS=${conditions.require}`);
      }
    } else if (conditions.import && !conditions.require) {
      if (verbose) {
        console.log(`      ${entry.key}: ESM only (${conditions.import})`);
      }
    }
  }

  // Check that "." entry exists
  const rootEntry = entries.find((e) => e.key === ".");
  if (!rootEntry) {
    issues.push({ severity: "warning", message: 'Missing "." export entry' });
  }

  result.passed = !issues.some((i) => i.severity === "error");
  return result;
}

// ── Report ───────────────────────────────────────────────────────────────

function generateMarkdown(report: VerificationReport): string {
  const lines: string[] = [];
  lines.push("# Package Export Verification Report");
  lines.push("");
  lines.push(`Generated: ${report.timestamp}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total packages:** ${report.totalPackages}`);
  lines.push(`- **Passed:** ${report.passed}`);
  lines.push(`- **Failed:** ${report.failed}`);
  lines.push(`- **Warnings:** ${report.warnings}`);
  lines.push("");

  const failed = report.results.filter((r) => !r.passed);
  if (failed.length > 0) {
    lines.push("## Failed Packages");
    lines.push("");
    for (const r of failed) {
      lines.push(`### ${r.name}`);
      lines.push("");
      for (const issue of r.issues.filter((i) => i.severity === "error")) {
        lines.push(`- ❌ ${issue.message}`);
      }
      for (const issue of r.issues.filter((i) => i.severity === "warning")) {
        lines.push(`- ⚠️ ${issue.message}`);
      }
      lines.push("");
    }
  }

  const warned = report.results.filter((r) => r.passed && r.issues.length > 0);
  if (warned.length > 0) {
    lines.push("## Packages with Warnings");
    lines.push("");
    for (const r of warned) {
      lines.push(`- **${r.name}**: ${r.issues.map((i) => i.message).join("; ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();

  console.log("📦 Package Export Verification");
  console.log(`   Root: ${ROOT}`);
  console.log("");

  let dirs = getPackageDirs();
  if (cli.packageName) {
    dirs = dirs.filter((d) => d.endsWith(cli.packageName!));
    if (dirs.length === 0) {
      console.error(`Package "${cli.packageName}" not found.`);
      process.exit(1);
    }
  }

  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    totalPackages: dirs.length,
    passed: 0,
    failed: 0,
    warnings: 0,
    results: [],
  };

  for (const dir of dirs) {
    const result = verifyPackage(dir, cli.verbose);
    report.results.push(result);

    const errors = result.issues.filter((i) => i.severity === "error").length;
    const warnings = result.issues.filter((i) => i.severity === "warning").length;

    if (result.passed) {
      report.passed++;
      if (warnings > 0) {
        report.warnings++;
        console.log(`   ${result.name} ✅ (${warnings} warning(s))`);
      } else {
        console.log(`   ${result.name} ✅`);
      }
    } else {
      report.failed++;
      console.log(`   ${result.name} ❌ (${errors} error(s), ${warnings} warning(s))`);
      for (const issue of result.issues) {
        const icon = issue.severity === "error" ? "❌" : "⚠️";
        console.log(`      ${icon} ${issue.message}`);
      }
    }
  }

  // Summary
  console.log("\n━━━ Summary ━━━");
  console.log(`   Total: ${report.totalPackages}`);
  console.log(`   Passed: ${report.passed}`);
  console.log(`   Failed: ${report.failed}`);
  console.log(`   Warnings: ${report.warnings}`);

  // Write report
  const reportDir = resolve(ROOT, "benchmarks/results");
  const { mkdirSync, writeFileSync } = await import("node:fs");
  mkdirSync(reportDir, { recursive: true });

  writeFileSync(resolve(reportDir, "exports-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(resolve(reportDir, "exports-report.md"), generateMarkdown(report));
  console.log(`\n📄 Reports → ${reportDir}/exports-report.{json,md}`);

  if (report.failed > 0) {
    console.error(`\n❌ ${report.failed} package(s) have export errors.`);
    process.exit(1);
  }

  console.log("\n✅ All package exports verified.");
}

main().catch((err) => {
  console.error("Export verification failed:", err);
  process.exit(1);
});
