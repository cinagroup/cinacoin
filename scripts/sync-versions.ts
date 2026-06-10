#!/usr/bin/env tsx
/**
 * Cinacoin Monorepo — Sync Versions Script
 *
 * Ensures all packages in the monorepo have consistent internal
 * dependency versions and optionally syncs to a target version.
 *
 * Usage:
 *   tsx scripts/sync-versions.ts              # sync internal deps to current versions
 *   tsx scripts/sync-versions.ts --target 1.0.0  # set all packages to version
 *   tsx scripts/sync-versions.ts --check      # check without writing (CI mode)
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PACKAGES_DIR = resolve(ROOT, "packages");
const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const TARGET_IDX = args.indexOf("--target");
const TARGET_VERSION = TARGET_IDX >= 0 ? args[TARGET_IDX + 1] : null;

interface PackageJson {
  name: string;
  version: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

// ── Collect all workspace packages ──────────────────────────
const packages = new Map<string, { path: string; pkg: PackageJson }>();

for (const dir of readdirSync(PACKAGES_DIR)) {
  const pkgPath = join(PACKAGES_DIR, dir, "package.json");
  try {
    const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
    packages.set(pkg.name, { path: pkgPath, pkg });
  } catch {
    // skip non-package dirs
  }
}

console.log(`Found ${packages.size} packages in monorepo\n`);

// ── Build version map ───────────────────────────────────────
const versionMap = new Map<string, string>();
for (const [name, { pkg }] of packages) {
  versionMap.set(name, TARGET_VERSION ?? pkg.version);
}

// ── Sync ────────────────────────────────────────────────────
let changed = 0;
let issues = 0;
const depFields = ["dependencies", "devDependencies", "peerDependencies"] as const;

for (const [name, { path: pkgPath, pkg }] of packages) {
  let modified = false;

  // Update own version if target specified
  if (TARGET_VERSION && pkg.version !== TARGET_VERSION) {
    console.log(`  ${name}: ${pkg.version} → ${TARGET_VERSION}`);
    pkg.version = TARGET_VERSION;
    modified = true;
  }

  // Sync internal workspace deps
  for (const field of depFields) {
    const deps = pkg[field];
    if (!deps) continue;

    for (const [depName, depRange] of Object.entries(deps)) {
      const currentVersion = versionMap.get(depName);
      if (!currentVersion) continue; // not a workspace dep

      // Determine the range prefix
      const prefix = depRange.startsWith("workspace:")
        ? "workspace:"
        : depRange.startsWith("^") ? "^" : depRange.startsWith("~") ? "~" : "";

      const bareVersion = depRange.replace(/^(workspace:[~^]?)?[~^]?/, "");
      const expectedRange = `${prefix}${currentVersion}`;

      if (depRange !== expectedRange && bareVersion !== currentVersion) {
        console.log(`  ${name}.${field}.${depName}: ${depRange} → ${expectedRange}`);
        deps[depName] = expectedRange;
        modified = true;
      }
    }
  }

  if (modified) {
    if (!CHECK_ONLY) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    }
    changed++;
  }
}

console.log(`\n${changed} package(s) ${CHECK_ONLY ? "would be" : ""} updated.`);

if (CHECK_ONLY && changed > 0) {
  console.error("\n❌ Version sync needed. Run: pnpm sync-versions");
  process.exit(1);
}

console.log("✅ Versions are in sync.");
