#!/usr/bin/env node

/**
 * CLI entry point for @cinacoin/codemod
 *
 * Usage:
 *   npx @cinacoin/codemod <transform> <path>
 *   npx @cinacoin/codemod appkit-to-cinacoin ./src
 *   npx @cinacoin/codemod ethers-v5-to-viem ./src --dry-run
 *   npx @cinacoin/codemod --list
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { readFileSync, writeFileSync, statSync } from "fs";
import { join, relative, extname, dirname } from "path";
import { sync as globSync } from "glob";
import { TRANSFORMS, listTransforms, applyTransforms } from "./index.js";

interface CliOptions {
  srcDir: string;
  transform: string[];
  dryRun: boolean;
  verbose: boolean;
  list: boolean;
  pattern: string;
}

const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/** Check if a transform name is valid */
function isValidTransform(name: string): boolean {
  return name in TRANSFORMS;
}

/** Recursively find all JS/TS files in a directory */
function findFiles(dir: string, pattern: string): string[] {
  // If it's a single file, return it
  try {
    const stat = statSync(dir);
    if (stat.isFile() && FILE_EXTENSIONS.has(extname(dir))) {
      return [dir];
    }
  } catch {
    // Not a valid path, try glob
  }

  return globSync(join(dir, pattern), { nodir: true }).filter((f) =>
    FILE_EXTENSIONS.has(extname(f))
  );
}

function main(): void {
  const argv = yargs(hideBin(process.argv))
    .command("$0 <transform> [path]", "Run a codemod transform", (y) => {
      return y
        .positional("transform", {
          type: "string",
          describe: "Transform to apply (e.g. appkit-to-cinacoin)",
        })
        .positional("path", {
          type: "string",
          default: "src",
          describe: "File or directory to process",
        });
    })
    .option("transform", {
      alias: "t",
      type: "array",
      default: [],
      describe: "Additional transform(s) to apply",
    })
    .option("dry-run", {
      type: "boolean",
      default: false,
      describe: "Show changes without writing files",
    })
    .option("verbose", {
      type: "boolean",
      default: false,
      describe: "Show detailed output",
    })
    .option("list", {
      alias: "l",
      type: "boolean",
      default: false,
      describe: "List available transforms and exit",
    })
    .option("pattern", {
      type: "string",
      default: "**/*.{ts,tsx,js,jsx,mjs,cjs}",
      describe: "Glob pattern for files to process",
    })
    .help()
    .alias("h", "help")
    .strict(false) // Allow positional args
    .parseSync() as unknown as CliOptions & {
      transform?: string;
      path?: string;
    };

  // --list
  if (argv.list) {
    console.log("Available transforms:\n");
    for (const name of listTransforms()) {
      const fn = TRANSFORMS[name];
      // Try to get description from the function name
      const desc = name
        .replace(/-/g, " → ")
        .replace(/to/g, "to");
      console.log(`  ${name.padEnd(30)} ${desc}`);
    }
    console.log();
    return;
  }

  // Get transform from positional arg or --transform flag
  const positionalTransform = (argv as Record<string, unknown>)._?.[0] as string | undefined;
  const transforms = [
    ...(positionalTransform ? [positionalTransform] : []),
    ...(Array.isArray(argv.transform) ? argv.transform : []),
  ].filter(Boolean) as string[];

  if (transforms.length === 0) {
    console.error("Error: A transform is required. Use --list to see available transforms.");
    console.error("Usage: npx @cinacoin/codemod <transform> <path>");
    process.exit(1);
  }

  // Validate transforms
  for (const t of transforms) {
    if (!isValidTransform(t)) {
      console.error(`Error: Unknown transform "${t}". Available: ${listTransforms().join(", ")}`);
      process.exit(1);
    }
  }

  // Discover files
  const targetPath = (argv as Record<string, unknown>)._?.[1] as string | undefined || argv.srcDir || "src";
  const absPath = join(process.cwd(), targetPath);
  const files = findFiles(absPath, argv.pattern);

  if (files.length === 0) {
    console.log(`No files matching "${argv.pattern}" found in ${absPath}`);
    return;
  }

  console.log(`Found ${files.length} file(s) in ${targetPath}\n`);

  let totalChanges = 0;
  let modifiedFiles = 0;

  for (const filePath of files) {
    let source: string;
    try {
      source = readFileSync(filePath, "utf-8");
    } catch (err) {
      console.warn(`⚠ Skipping unreadable: ${filePath}`);
      continue;
    }

    const result = applyTransforms(transforms, source);

    if (result.changes.length > 0) {
      modifiedFiles++;
      totalChanges += result.changes.length;

      const relPath = relative(process.cwd(), filePath);

      if (argv.dryRun) {
        console.log(`🔍 ${relPath} (${result.changes.length} change(s))`);
      } else {
        writeFileSync(filePath, result.output, "utf-8");
        console.log(`✅ ${relPath} (${result.changes.length} change(s))`);
      }

      if (argv.verbose) {
        for (const change of result.changes) {
          console.log(`   ${change}`);
        }
        console.log();
      }
    } else {
      if (argv.verbose) {
        console.log(`   ${relative(process.cwd(), filePath)} — no changes`);
      }
    }
  }

  // Summary
  console.log();
  if (argv.dryRun) {
    console.log(`📋 Dry run complete: ${totalChanges} change(s) in ${modifiedFiles} file(s)`);
  } else {
    console.log(`✅ Done: ${totalChanges} change(s) in ${modifiedFiles} file(s)`);
  }
}

main();
