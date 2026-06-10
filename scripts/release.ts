#!/usr/bin/env tsx
/**
 * Cinacoin Monorepo Release Script
 *
 * Orchestrates the full release pipeline:
 *   1. Validate working tree is clean
 *   2. Run quality checks (typecheck, lint, test, build)
 *   3. Apply changeset versions
 *   4. Build all packages
 *   5. Publish to npm
 *   6. Create git tag + GitHub release notes
 *
 * Usage:
 *   tsx scripts/release.ts              # full release
 *   tsx scripts/release.ts --dry-run    # simulate without publishing
 *   tsx scripts/release.ts --skip-check # skip quality checks
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SKIP_CHECK = args.includes("--skip-check");

function run(cmd: string, opts?: { cwd?: string; silent?: boolean }) {
  const cwd = opts?.cwd ?? ROOT;
  if (!opts?.silent) console.log(`\n$ ${cmd}`);
  if (DRY_RUN && cmd.includes("publish")) {
    console.log(`[dry-run] Would execute: ${cmd}`);
    return "";
  }
  return execSync(cmd, { cwd, stdio: opts?.silent ? "pipe" : "inherit", encoding: "utf-8" }) ?? "";
}

function step(msg: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${msg}`);
  console.log(`${"═".repeat(60)}\n`);
}

// ── 1. Validate ──────────────────────────────────────────────
step("1/6  Validating working tree");

const status = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf-8" }).trim();
if (status) {
  console.error("❌ Working tree is dirty. Commit or stash changes first:");
  console.error(status);
  process.exit(1);
}
console.log("✅ Working tree is clean");

// ── 2. Quality checks ───────────────────────────────────────
if (!SKIP_CHECK) {
  step("2/6  Running quality checks");
  run("pnpm run typecheck");
  run("pnpm run lint");
  run("pnpm run test");
  run("pnpm run build:all");
  console.log("✅ All quality checks passed");
} else {
  step("2/6  Skipping quality checks (--skip-check)");
}

// ── 3. Version ──────────────────────────────────────────────
step("3/6  Applying changeset versions");

const changesetDir = resolve(ROOT, ".changeset");
const hasChangesets = existsSync(changesetDir) &&
  existsSync(resolve(changesetDir, "config.json")) &&
  // Check for any .md files that aren't config or README
  (() => {
    const { readdirSync } = require("node:fs");
    const files = readdirSync(changesetDir).filter(
      (f: string) => f.endsWith(".md") && f !== "README.md"
    );
    return files.length > 0;
  })();

if (!hasChangesets) {
  console.log("⚠️  No changesets found. Nothing to version.");
  console.log("   Create one with: pnpm changeset");
  process.exit(0);
}

run("pnpm changeset version");
console.log("✅ Versions updated");

// ── 4. Build ────────────────────────────────────────────────
step("4/6  Building all packages");
run("pnpm run build:all");
console.log("✅ Build complete");

// ── 5. Publish ──────────────────────────────────────────────
step("5/6  Publishing to npm");

if (DRY_RUN) {
  run("pnpm -r publish --no-git-checks --dry-run");
} else {
  run("pnpm -r publish --no-git-checks");
}
console.log("✅ Published to npm");

// ── 6. Tag ──────────────────────────────────────────────────
step("6/6  Creating release tag");

const rootPkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const tagName = `release-${timestamp}`;

if (!DRY_RUN) {
  run("git add -A");
  run(`git commit -m "chore: release ${tagName}"`);
  run(`git tag -a ${tagName} -m "Release ${tagName}"`);
  console.log(`✅ Tagged: ${tagName}`);
  console.log(`   Push with: git push && git push --tags`);
} else {
  console.log(`[dry-run] Would tag: ${tagName}`);
}

step("🎉 Release complete!");
