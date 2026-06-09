#!/usr/bin/env node

/**
 * @cinacoin/cli — doctor command
 *
 * Diagnose project setup and connectivity.
 *
 * Usage:
 *   npx @cinacoin/cli doctor
 */

import type { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { header, success, error, warn, info } from '../utils/logger.js';

// ============================================================
// doctor command
// ============================================================

export function doctorCommand(cli: Command): void {
  cli
    .command('doctor')
    .description('Diagnose project setup and Cinacoin connectivity')
    .action(async () => {
      header('Cinacoin Doctor — Diagnostic Report');
      console.log();

      const cwd = process.cwd();
      let issues = 0;
      let warnings = 0;

      // ── Node.js version ───────────────────────────────────
      process.stdout.write('  Node.js version    ');
      try {
        const nodeVersion = process.version;
        const major = parseInt(nodeVersion.slice(1), 10);
        if (major >= 18) {
          success(nodeVersion);
        } else {
          error(`${nodeVersion} — Node 18+ required`);
          issues++;
        }
      } catch {
        error('Could not detect Node.js');
        issues++;
      }

      // ── Package manager ───────────────────────────────────
      process.stdout.write('  Package manager    ');
      const pm = detectPackageManager(cwd);
      if (pm) {
        try {
          const pmVersion = execSync(`${pm} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
          success(`${pm} ${pmVersion}`);
        } catch {
          warn(`${pm} detected but version check failed`);
          warnings++;
        }
      } else {
        warn('No package manager detected (npm/yarn/pnpm)');
        warnings++;
      }

      // ── package.json ──────────────────────────────────────
      process.stdout.write('  package.json       ');
      const pkgPath = join(cwd, 'package.json');
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
          success(`✓ (${pkg.name || 'unnamed'} v${pkg.version || '0.0.0'})`);
        } catch {
          error('Invalid JSON');
          issues++;
        }
      } else {
        warn('Not found — not in a project directory');
        warnings++;
      }

      // ── @cinacoin packages ────────────────────────────────
      process.stdout.write('  @cinacoin packages ');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        const cinacoinPkgs = Object.keys(allDeps).filter(d => d.startsWith('@cinacoin'));
        if (cinacoinPkgs.length > 0) {
          success(`${cinacoinPkgs.length} found: ${cinacoinPkgs.join(', ')}`);
        } else {
          warn('No @cinacoin packages in dependencies');
          warnings++;
        }
      } else {
        warn('Cannot check — no package.json');
        warnings++;
      }

      // ── node_modules ──────────────────────────────────────
      process.stdout.write('  node_modules       ');
      const nmPath = join(cwd, 'node_modules');
      if (existsSync(nmPath)) {
        const hasCinacoin = existsSync(join(nmPath, '@cinacoin'));
        if (hasCinacoin) {
          success('✓ @cinacoin modules installed');
        } else {
          warn('Exists but no @cinacoin modules — run install');
          warnings++;
        }
      } else {
        warn('Not found — run install first');
        warnings++;
      }

      // ── Environment variables ─────────────────────────────
      process.stdout.write('  Environment vars   ');
      const envFile = findEnvFile(cwd);
      if (envFile) {
        const content = readFileSync(envFile, 'utf-8');
        const hasRpc = /RPC_URL/i.test(content);
        const hasProjectName = /PROJECT_NAME/i.test(content);
        if (hasRpc) {
          success(`Found ${envFile.split('/').pop()} with RPC config`);
        } else {
          warn(`${envFile.split('/').pop()} exists but no RPC_URL configured`);
          warnings++;
        }
      } else {
        warn('No .env file found');
        warnings++;
      }

      // ── Network connectivity ──────────────────────────────
      console.log();
      info('Testing RPC connectivity...');

      const rpcEndpoints = [
        { name: 'Ethereum Mainnet', url: 'https://eth.llamarpc.com' },
        { name: 'Polygon', url: 'https://polygon-rpc.com' },
        { name: 'Arbitrum', url: 'https://arb1.arbitrum.io/rpc' },
      ];

      for (const rpc of rpcEndpoints) {
        process.stdout.write(`    ${rpc.name.padEnd(22)} `);
        try {
          const start = Date.now();
          const response = execSync(
            `curl -s -o /dev/null -w "%{http_code}" -m 5 -X POST ${rpc.url} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'`,
            { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
          ).trim();
          const elapsed = Date.now() - start;
          if (response === '200') {
            success(`OK (${elapsed}ms)`);
          } else {
            error(`HTTP ${response}`);
            issues++;
          }
        } catch {
          error('Failed to connect');
          issues++;
        }
      }

      // ── TypeScript config ─────────────────────────────────
      console.log();
      process.stdout.write('  tsconfig.json      ');
      if (existsSync(join(cwd, 'tsconfig.json'))) {
        success('✓ Found');
      } else if (existsSync(join(cwd, 'jsconfig.json'))) {
        success('✓ Found (jsconfig)');
      } else {
        warn('Not found');
        warnings++;
      }

      // ── Summary ───────────────────────────────────────────
      console.log();
      console.log('  ── Summary ──');
      if (issues === 0 && warnings === 0) {
        success('All checks passed! 🎉');
      } else {
        if (issues > 0) {
          error(`${issues} issue(s) found — review above`);
        }
        if (warnings > 0) {
          warn(`${warnings} warning(s) — consider addressing`);
        }
      }
      console.log();
    });
}

// ============================================================
// Helpers
// ============================================================

function detectPackageManager(cwd: string): string | null {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm';
  // Fallback: check which is available
  for (const pm of ['pnpm', 'yarn', 'npm']) {
    try {
      execSync(`${pm} --version`, { stdio: 'pipe' });
      return pm;
    } catch {
      // continue
    }
  }
  return null;
}

function findEnvFile(cwd: string): string | null {
  const candidates = ['.env.local', '.env.development.local', '.env.development', '.env'];
  for (const f of candidates) {
    const path = join(cwd, f);
    if (existsSync(path)) return path;
  }
  return null;
}
