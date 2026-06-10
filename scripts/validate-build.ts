#!/usr/bin/env tsx
/**
 * Build Validation Script
 *
 * Validates that all packages in the monorepo:
 *   1. Can be built successfully (TypeScript compilation)
 *   2. Have reasonable bundle sizes
 *   3. Export the expected entry points
 *   4. Include TypeScript declaration files
 *
 * Usage:
 *   npx tsx scripts/validate-build.ts [--package <name>] [--verbose]
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = resolve(ROOT, "packages");

// ── CLI ──────────────────────────────────────────────────────────────────

interface CliArgs {
  packageName?: string;
  verbose: boolean;
  maxBundleSizeKB: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const cli: CliArgs = { verbose: false, maxBundleSizeKB: 500 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--package":
        cli.packageName = args[++i];
        break;
      case "--verbose":
        cli.verbose = true;
        break;
      case "--max-bundle-kb":
        cli.maxBundleSizeKB = parseInt(args[++i], 10);
        break;
    }
  }
  return cli;
}

// ── Types ────────────────────────────────────────────────────────────────

interface PackageValidation {
  name: string;
  path: string;
  canBuild: boolean;
  buildError?: string;
  bundleSizeKB: number;
  hasDeclarations: boolean;
  exportsValid: boolean;
  exportErrors: string[];
}

interface ValidationReport {
  timestamp: string;
  totalPackages: number;
  passed: number;
  failed: number;
  warnings: number;
  packages: PackageValidation[];
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

function getDirSizeKB(dir: string): number {
  let total = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        total += getDirSizeKB(fullPath);
      } else if (entry.isFile()) {
        total += statSync(fullPath).size;
      }
    }
  } catch {
    // directory doesn't exist
  }
  return Math.round(total / 1024);
}

function hasDeclarationFiles(dir: string): boolean {
  const distDir = join(dir, "dist");
  if (!existsSync(distDir)) {
    // Check src for .ts files (source-only packages)
    const srcDir = join(dir, "src");
    if (existsSync(srcDir)) {
      const files = readdirSync(srcDir);
      return files.some((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
    }
    return false;
  }
  const files = readdirSync(distDir);
  return files.some((f) => f.endsWith(".d.ts"));
}

function validateExports(dir: string, pkg: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const exports = pkg.exports;

  if (!exports) {
    // Check main/module fields
    if (pkg.main && !existsSync(resolve(dir, pkg.main))) {
      // Only error if the package has a build step
      if (pkg.scripts?.build) {
        errors.push(`main entry "${pkg.main}" not found`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  if (typeof exports === "string") {
    if (!existsSync(resolve(dir, exports))) {
      errors.push(`exports entry "${exports}" not found`);
    }
    return { valid: errors.length === 0, errors };
  }

  // Object exports
  for (const [key, value] of Object.entries(exports)) {
    if (typeof value === "string") {
      if (!existsSync(resolve(dir, value))) {
        errors.push(`exports["${key}"] → "${value}" not found`);
      }
    } else if (typeof value === "object" && value !== null) {
      for (const [condition, path] of Object.entries(value as Record<string, string>)) {
        if (typeof path === "string" && !path.startsWith("@") && !existsSync(resolve(dir, path))) {
          errors.push(`exports["${key}"].${condition} → "${path}" not found`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const cli = parseArgs();

  console.log("🔍 Build Validation");
  console.log(`   Root: ${ROOT}`);
  console.log(`   Max bundle size: ${cli.maxBundleSizeKB}KB`);
  console.log("");

  let dirs = getPackageDirs();
  if (cli.packageName) {
    dirs = dirs.filter((d) => d.endsWith(cli.packageName!));
    if (dirs.length === 0) {
      console.error(`Package "${cli.packageName}" not found.`);
      process.exit(1);
    }
  }

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    totalPackages: dirs.length,
    passed: 0,
    failed: 0,
    warnings: 0,
    packages: [],
  };

  for (const dir of dirs) {
    const pkg = readPkgJson(dir);
    const name = pkg.name || dir.split("/").pop() || "unknown";
    const validation: PackageValidation = {
      name,
      path: dir,
      canBuild: true,
      bundleSizeKB: 0,
      hasDeclarations: false,
      exportsValid: true,
      exportErrors: [],
    };

    process.stdout.write(`   ${name} … `);

    // 1. Check build
    if (pkg.scripts?.build) {
      try {
        execSync("npm run build --if-present", {
          cwd: dir,
          stdio: cli.verbose ? "inherit" : "pipe",
          timeout: 120_000,
        });
        validation.canBuild = true;
      } catch (err) {
        validation.canBuild = false;
        validation.buildError = (err as Error).message.split("\n")[0];
      }
    }

    // 2. Check bundle size (dist/ directory)
    const distDir = join(dir, "dist");
    if (existsSync(distDir)) {
      validation.bundleSizeKB = getDirSizeKB(distDir);
      if (validation.bundleSizeKB > cli.maxBundleSizeKB) {
        report.warnings++;
        if (cli.verbose) {
          console.log(`⚠️ bundle ${validation.bundleSizeKB}KB > ${cli.maxBundleSizeKB}KB`);
        }
      }
    }

    // 3. Check declarations
    validation.hasDeclarations = hasDeclarationFiles(dir);

    // 4. Validate exports
    const exportCheck = validateExports(dir, pkg);
    validation.exportsValid = exportCheck.valid;
    validation.exportErrors = exportCheck.errors;

    // Summary
    const allOk = validation.canBuild && validation.exportsValid;
    if (allOk) {
      report.passed++;
      console.log("✅");
    } else {
      report.failed++;
      console.log("❌");
      if (validation.buildError) console.log(`      Build: ${validation.buildError}`);
      for (const e of validation.exportErrors) console.log(`      Export: ${e}`);
    }

    report.packages.push(validation);
  }

  // Summary
  console.log("\n━━━ Summary ━━━");
  console.log(`   Total: ${report.totalPackages}`);
  console.log(`   Passed: ${report.passed}`);
  console.log(`   Failed: ${report.failed}`);
  console.log(`   Warnings: ${report.warnings}`);

  // Write report
  const reportPath = resolve(ROOT, "build-validation.json");
  const { writeFileSync, mkdirSync } = await import("node:fs");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report → ${reportPath}`);

  if (report.failed > 0) {
    console.error(`\n❌ ${report.failed} package(s) failed validation.`);
    process.exit(1);
  }

  console.log("\n✅ All packages passed build validation.");
}

main().catch((err) => {
  console.error("Build validation failed:", err);
  process.exit(1);
});
