#!/usr/bin/env tsx
/**
 * Cinacoin Monorepo — Package Dependency Graph
 *
 * Analyzes internal workspace dependencies and outputs:
 *   - DOT format graph (for Graphviz)
 *   - Circular dependency detection
 *   - Topological sort for build order
 *
 * Usage:
 *   tsx scripts/package-graph.ts                # print DOT to stdout
 *   tsx scripts/package-graph.ts --output graph.dot  # write to file
 *   tsx scripts/package-graph.ts --check        # check for circular deps
 *   tsx scripts/package-graph.ts --format json  # JSON output
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PACKAGES_DIR = resolve(ROOT, "packages");
const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const OUTPUT = getArg("--output");
const FORMAT = getArg("--format") ?? "dot";
const CHECK = args.includes("--check");

interface PackageInfo {
  name: string;
  shortName: string;
  deps: string[];
}

// ── Collect packages and their internal deps ────────────────
const packages = new Map<string, PackageInfo>();

for (const dir of readdirSync(PACKAGES_DIR)) {
  const pkgPath = join(PACKAGES_DIR, dir, "package.json");
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    const internalDeps = Object.keys(allDeps ?? {}).filter(
      (d) => d.startsWith("@cinacoin/")
    );

    packages.set(pkg.name, {
      name: pkg.name,
      shortName: pkg.name.replace("@cinacoin/", ""),
      deps: internalDeps,
    });
  } catch {
    // skip
  }
}

console.error(`Analyzed ${packages.size} packages\n`);

// ── Circular dependency detection ───────────────────────────
function detectCycles(): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string) {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart).concat(node));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    path.push(node);

    const pkg = packages.get(node);
    if (pkg) {
      for (const dep of pkg.deps) {
        if (packages.has(dep)) {
          dfs(dep);
        }
      }
    }

    path.pop();
    stack.delete(node);
  }

  for (const name of packages.keys()) {
    dfs(name);
  }

  return cycles;
}

// ── Topological sort ────────────────────────────────────────
function topoSort(): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    const pkg = packages.get(name);
    if (pkg) {
      for (const dep of pkg.deps) {
        if (packages.has(dep)) visit(dep);
      }
    }
    sorted.push(name);
  }

  for (const name of packages.keys()) visit(name);
  return sorted;
}

// ── Output ──────────────────────────────────────────────────
if (CHECK) {
  const cycles = detectCycles();
  if (cycles.length > 0) {
    console.error("❌ Circular dependencies detected:\n");
    for (const cycle of cycles) {
      console.error(`  ${cycle.join(" → ")}`);
    }
    process.exit(1);
  } else {
    console.error("✅ No circular dependencies found.");
    console.error("\nBuild order (topological):");
    for (const [i, name] of topoSort().entries()) {
      console.error(`  ${i + 1}. ${name}`);
    }
  }
} else if (FORMAT === "json") {
  const graph = {
    nodes: Array.from(packages.values()).map((p) => ({
      name: p.name,
      shortName: p.shortName,
      deps: p.deps,
    })),
    buildOrder: topoSort(),
    cycles: detectCycles(),
  };
  const output = JSON.stringify(graph, null, 2);
  if (OUTPUT) {
    writeFileSync(resolve(ROOT, OUTPUT), output);
    console.error(`✅ Graph written to ${OUTPUT}`);
  } else {
    console.log(output);
  }
} else {
  // DOT format
  const lines: string[] = [];
  lines.push("digraph cinacoin_deps {");
  lines.push("  rankdir=LR;");
  lines.push('  node [shape=box, style=filled, fillcolor="#e8f4fd", fontname="Helvetica"];');
  lines.push('  edge [color="#666666"];');
  lines.push("");

  // Nodes
  for (const pkg of packages.values()) {
    const label = pkg.shortName;
    lines.push(`  "${pkg.name}" [label="${label}"];`);
  }

  lines.push("");

  // Edges
  for (const pkg of packages.values()) {
    for (const dep of pkg.deps) {
      if (packages.has(dep)) {
        lines.push(`  "${pkg.name}" -> "${dep}";`);
      }
    }
  }

  lines.push("}");

  const output = lines.join("\n") + "\n";
  if (OUTPUT) {
    writeFileSync(resolve(ROOT, OUTPUT), output);
    console.error(`✅ DOT graph written to ${OUTPUT}`);
    console.error(`   Render with: dot -Tpng ${OUTPUT} -o graph.png`);
  } else {
    console.log(output);
  }
}
