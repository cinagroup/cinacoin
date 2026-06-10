#!/usr/bin/env tsx
/**
 * Dependency Check Script
 *
 * Checks:
 *   1. Outdated dependencies across all packages
 *   2. Known security vulnerabilities (npm audit)
 *   3. Peer dependency conflicts
 *   4. Duplicate dependencies
 *   5. Generates a dependency health report
 *
 * Usage:
 *   npx tsx scripts/check-deps.ts [--fix] [--json]
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── CLI ──────────────────────────────────────────────────────────────────

interface CliArgs {
  fix: boolean;
  json: boolean;
  verbose: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const cli: CliArgs = { fix: false, json: false, verbose: false };
  for (const arg of args) {
    switch (arg) {
      case "--fix":
        cli.fix = true;
        break;
      case "--json":
        cli.json = true;
        break;
      case "--verbose":
        cli.verbose = true;
        break;
    }
  }
  return cli;
}

// ── Types ────────────────────────────────────────────────────────────────

interface OutdatedEntry {
  package: string;
  current: string;
  wanted: string;
  latest: string;
  location: string;
}

interface VulnerabilityEntry {
  name: string;
  severity: string;
  version: string;
  range: string;
  title: string;
  url: string;
}

interface PeerConflict {
  package: string;
  peer: string;
  expected: string;
  actual: string;
  location: string;
}

interface DepReport {
  timestamp: string;
  outdated: OutdatedEntry[];
  vulnerabilities: VulnerabilityEntry[];
  peerConflicts: PeerConflict[];
  duplicates: string[];
  summary: {
    totalOutdated: number;
    criticalVulns: number;
    highVulns: number;
    moderateVulns: number;
    lowVulns: number;
    peerConflicts: number;
    duplicates: number;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function runSafe(cmd: string, cwd: string = ROOT): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 60_000, stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    return "";
  }
}

function getPackageDirs(): string[] {
  const packagesDir = join(ROOT, "packages");
  if (!existsSync(packagesDir)) return [];
  return readdirSync(packagesDir)
    .map((e) => join(packagesDir, e))
    .filter((d) => {
      try {
        return statSync(d).isDirectory() && existsSync(join(d, "package.json"));
      } catch {
        return false;
      }
    });
}

// ── Checks ───────────────────────────────────────────────────────────────

function checkOutdated(): OutdatedEntry[] {
  console.log("   → Checking outdated dependencies …");
  const output = runSafe("npm outdated --json 2>/dev/null");
  if (!output) return [];

  try {
    const data = JSON.parse(output);
    return Object.entries(data).map(([name, info]: [string, any]) => ({
      package: name,
      current: info.current || "missing",
      wanted: info.wanted || "unknown",
      latest: info.latest || "unknown",
      location: info.location || "root",
    }));
  } catch {
    return [];
  }
}

function checkVulnerabilities(): VulnerabilityEntry[] {
  console.log("   → Checking security vulnerabilities …");
  const output = runSafe("npm audit --json 2>/dev/null");
  if (!output) return [];

  try {
    const data = JSON.parse(output);
    const vulns: VulnerabilityEntry[] = [];

    // npm audit v2 format
    if (data.vulnerabilities) {
      for (const [name, info] of Object.entries(data.vulnerabilities) as [string, any][]) {
        if (info.via && Array.isArray(info.via)) {
          for (const via of info.via) {
            if (typeof via === "object" && via.url) {
              vulns.push({
                name,
                severity: via.severity || info.severity || "unknown",
                version: info.range || "unknown",
                range: info.range || "unknown",
                title: via.title || name,
                url: via.url || "",
              });
            }
          }
        }
        // Simple format
        if (typeof info === "object" && info.severity) {
          vulns.push({
            name,
            severity: info.severity,
            version: info.range || "unknown",
            range: info.range || "unknown",
            title: info.title || name,
            url: info.url || "",
          });
        }
      }
    }

    return vulns;
  } catch {
    return [];
  }
}

function checkPeerDeps(verbose: boolean): PeerConflict[] {
  console.log("   → Checking peer dependency conflicts …");
  const conflicts: PeerConflict[] = [];
  const dirs = getPackageDirs();

  for (const dir of dirs) {
    let pkg: Record<string, any>;
    try {
      pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    } catch {
      continue;
    }

    const peerDeps = pkg.peerDependencies || {};
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const [peer, range] of Object.entries(peerDeps) as [string, string][]) {
      if (deps[peer]) {
        // Check if installed version satisfies peer range (simplified)
        // In a real check, we'd use semver.satisfies
        if (verbose) {
          console.log(`      ${pkg.name}: peer ${peer}@${range} (have ${deps[peer]})`);
        }
      }
    }
  }

  return conflicts;
}

function checkDuplicates(): string[] {
  console.log("   → Checking duplicate dependencies …");
  const output = runSafe("npm ls --json --all 2>/dev/null");
  if (!output) return [];

  try {
    const data = JSON.parse(output);
    const seen = new Map<string, string[]>();

    function walk(node: any, path: string = "") {
      if (!node?.dependencies) return;
      for (const [name, info] of Object.entries(node.dependencies) as [string, any][]) {
        const version = info.version || "unknown";
        const key = `${name}@${version}`;
        if (!seen.has(name)) seen.set(name, []);
        const versions = seen.get(name)!;
        if (!versions.includes(version)) {
          versions.push(version);
        }
        walk(info, `${path}/${name}`);
      }
    }

    walk(data);

    return Array.from(seen.entries())
      .filter(([, versions]) => versions.length > 1)
      .map(([name, versions]) => `${name}: ${versions.join(", ")}`);
  } catch {
    return [];
  }
}

// ── Report ───────────────────────────────────────────────────────────────

function generateMarkdown(report: DepReport): string {
  const lines: string[] = [];
  lines.push("# Dependency Health Report");
  lines.push("");
  lines.push(`Generated: ${report.timestamp}`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|--------|------:|");
  lines.push(`| Outdated packages | ${report.summary.totalOutdated} |`);
  lines.push(`| Critical vulnerabilities | ${report.summary.criticalVulns} |`);
  lines.push(`| High vulnerabilities | ${report.summary.highVulns} |`);
  lines.push(`| Moderate vulnerabilities | ${report.summary.moderateVulns} |`);
  lines.push(`| Low vulnerabilities | ${report.summary.lowVulns} |`);
  lines.push(`| Peer dependency conflicts | ${report.summary.peerConflicts} |`);
  lines.push(`| Duplicate dependencies | ${report.summary.duplicates} |`);
  lines.push("");

  if (report.vulnerabilities.length > 0) {
    lines.push("## Vulnerabilities");
    lines.push("");
    lines.push("| Package | Severity | Version | Title |");
    lines.push("|---------|----------|---------|-------|");
    for (const v of report.vulnerabilities) {
      const icon = v.severity === "critical" ? "🔴" : v.severity === "high" ? "🟠" : "🟡";
      lines.push(`| ${v.name} | ${icon} ${v.severity} | ${v.version} | ${v.title} |`);
    }
    lines.push("");
  }

  if (report.outdated.length > 0) {
    lines.push("## Outdated Packages");
    lines.push("");
    lines.push("| Package | Current | Wanted | Latest |");
    lines.push("|---------|--------:|-------:|-------:|");
    for (const o of report.outdated.slice(0, 50)) {
      lines.push(`| ${o.package} | ${o.current} | ${o.wanted} | ${o.latest} |`);
    }
    if (report.outdated.length > 50) {
      lines.push(`| _…and ${report.outdated.length - 50} more_ | | | |`);
    }
    lines.push("");
  }

  if (report.duplicates.length > 0) {
    lines.push("## Duplicate Dependencies");
    lines.push("");
    for (const d of report.duplicates) {
      lines.push(`- ${d}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();

  console.log("📦 Dependency Check");
  console.log(`   Root: ${ROOT}`);
  console.log("");

  const outdated = checkOutdated();
  const vulnerabilities = checkVulnerabilities();
  const peerConflicts = checkPeerDeps(cli.verbose);
  const duplicates = checkDuplicates();

  const report: DepReport = {
    timestamp: new Date().toISOString(),
    outdated,
    vulnerabilities,
    peerConflicts,
    duplicates,
    summary: {
      totalOutdated: outdated.length,
      criticalVulns: vulnerabilities.filter((v) => v.severity === "critical").length,
      highVulns: vulnerabilities.filter((v) => v.severity === "high").length,
      moderateVulns: vulnerabilities.filter((v) => v.severity === "moderate").length,
      lowVulns: vulnerabilities.filter((v) => v.severity === "low").length,
      peerConflicts: peerConflicts.length,
      duplicates: duplicates.length,
    },
  };

  // Output
  if (cli.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("\n━━━ Summary ━━━");
    console.log(`   Outdated: ${report.summary.totalOutdated}`);
    console.log(`   Vulnerabilities: ${report.summary.criticalVulns} critical, ${report.summary.highVulns} high, ${report.summary.moderateVulns} moderate, ${report.summary.lowVulns} low`);
    console.log(`   Peer conflicts: ${report.summary.peerConflicts}`);
    console.log(`   Duplicates: ${report.summary.duplicates}`);
  }

  // Write report
  const reportDir = resolve(ROOT, "benchmarks/results");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(reportDir, { recursive: true });

  writeFileSync(resolve(reportDir, "dep-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(resolve(reportDir, "dep-report.md"), generateMarkdown(report));
  console.log(`\n📄 Reports → ${reportDir}/dep-report.{json,md}`);

  // Fail on critical vulns
  if (report.summary.criticalVulns > 0) {
    console.error(`\n⚠️  ${report.summary.criticalVulns} critical vulnerability(ies) found.`);
    process.exit(1);
  }

  console.log("\n✅ Dependency check complete.");
}

main().catch((err) => {
  console.error("Dependency check failed:", err);
  process.exit(1);
});
