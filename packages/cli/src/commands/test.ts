import type { Command } from 'commander';
import { spawnSync } from 'node:child_process';
import { spinner, warn } from '../utils/logger.js';

// ============================================================
// ocx test — Run unit and E2E tests
// ============================================================

export function testCommand(cli: Command): void {
  cli
    .command('test')
    .description('Run Cinacoin tests')
    .option('--unit', 'Run unit tests only (vitest)')
    .option('--e2e', 'Run E2E tests only (playwright)')
    .option('--coverage', 'Generate coverage report')
    .option('--watch', 'Run in watch mode (unit tests only)')
    .option('--project <name>', 'Playwright project to test (chromium, firefox, webkit)')
    .option('--ui', 'Run Playwright in UI mode')
    .action(async (opts: {
      unit?: boolean;
      e2e?: boolean;
      coverage?: boolean;
      watch?: boolean;
      project?: string;
      ui?: boolean;
    }) => {
      // Default to all tests if no flag specified
      const runUnit = !opts.e2e; // run unit unless only e2e requested
      const runE2e = !opts.unit; // run e2e unless only unit requested

      if (runUnit) {
        const s = spinner('Running unit tests...');
        try {
          const args = ['vitest'];
          if (!opts.watch) {
            args.push('run');
          }
          if (opts.coverage) {
            args.push('--coverage');
          }
          const result = spawnSync('npx', args, { stdio: 'inherit' });
          if (result.status !== 0) throw new Error('vitest failed');
          s.succeed('Unit tests passed');
        } catch (err) {
          s.fail(`Unit tests failed`);
          if (!opts.unit) {
            process.exit(1);
          }
        }
      }

      if (runE2e) {
        const s = spinner('Running E2E tests...');
        try {
          const args = ['playwright', 'test'];
          if (opts.project) {
            // Validate project name to prevent injection
            const safeProject = opts.project.replace(/[^a-zA-Z0-9_-]/g, '');
            if (safeProject !== opts.project) {
              throw new Error('Invalid project name: only alphanumeric, hyphens, and underscores allowed');
            }
            args.push(`--project=${safeProject}`);
          }
          if (opts.ui) {
            args.push('--ui');
          }
          if (opts.coverage) {
            args.push('--reporter=html');
          }
          const result = spawnSync('npx', args, { stdio: 'inherit' });
          if (result.status !== 0) throw new Error('playwright failed');
          s.succeed('E2E tests passed');
        } catch (err) {
          s.fail(`E2E tests failed`);
          process.exit(1);
        }
      }
    });
}
