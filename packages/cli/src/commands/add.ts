import type { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { spinner, warn } from '../utils/logger.js';

// ============================================================
// ocx add — Add adapters, plugins, or UI components to a project
// ============================================================

/** Registry of available add-on packages. */
const ADDONS: Record<string, { package: string; description: string; setup?: string }> = {
  // Core adapters
  '@cinaconnect/evm': { package: '@cinaconnect/core-sdk', description: 'EVM chain adapter' },
  '@cinaconnect/solana': { package: '@cinaconnect/core-sdk', description: 'Solana chain adapter' },
  '@cinaconnect/bitcoin': { package: '@cinaconnect/core-sdk', description: 'Bitcoin chain adapter' },
  // UI frameworks
  '@cinaconnect/react': { package: '@cinaconnect/react', description: 'React UI components' },
  '@cinaconnect/vue': { package: '@cinaconnect/vue', description: 'Vue UI components' },
  '@cinaconnect/react-native': { package: '@cinaconnect/react-native', description: 'React Native components' },
  // Features
  '@cinaconnect/swap-sdk': { package: '@cinaconnect/swap-sdk', description: 'DEX swap aggregator' },
  '@cinaconnect/siwe': { package: '@cinaconnect/siwe', description: 'Sign-In With Ethereum' },
  '@cinaconnect/onramp-sdk': { package: '@cinaconnect/onramp-sdk', description: 'Fiat on-ramp aggregator' },
  '@cinaconnect/walletconnect-v2': { package: '@cinaconnect/walletconnect-v2', description: 'WalletConnect v2 integration' },
  '@cinaconnect/session-keys': { package: '@cinaconnect/session-keys', description: 'ERC-4337 session keys' },
  '@cinaconnect/social-login': { package: '@cinaconnect/social-login', description: 'Social login providers' },
};

/** List all available addons. */
export function listCommand(cli: Command): void {
  cli
    .command('list')
    .alias('ls')
    .description('List all available CinaConnect addons')
    .action(() => {
      console.log('\n  Available CinaConnect addons:\n');
      for (const [name, info] of Object.entries(ADDONS)) {
        console.log(`    ${name.padEnd(32)} ${info.description}`);
      }
      console.log();
    });
}

export function addCommand(cli: Command): void {
  // Add 'list' subcommand
  listCommand(cli);

  // Add 'add' command
  cli
    .command('add')
    .description('Add an CinaConnect adapter, plugin, or component')
    .argument('<addon>', 'Addon to add (e.g., @cinaconnect/react)')
    .option('--dev', 'Add as dev dependency')
    .action(async (addon: string, opts: { dev?: boolean }) => {
      const info = ADDONS[addon];

      if (!info) {
        warn(`Unknown addon '${addon}'. Run 'cinaconnect list' to see available addons.`);
        process.exit(1);
      }

      const s = spinner(`Adding ${addon}...`);

      try {
        // Check if package.json exists
        const pkgPath = join(process.cwd(), 'package.json');
        if (!existsSync(pkgPath)) {
          s.fail('No package.json found. Run "cinaconnect init" first.');
          process.exit(1);
        }

        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const depKey = opts.dev ? 'devDependencies' : 'dependencies';
        if (!pkg[depKey]) pkg[depKey] = {};
        pkg[depKey][info.package] = '^0.1.0';

        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

        s.succeed(`Added ${addon} to ${depKey}`);

        if (info.setup) {
          console.log(`\n  ${info.setup}\n`);
        } else {
          console.log(`\n  Import and use ${addon} in your project.\n`);
        }
      } catch (err) {
        s.fail(`Failed to add ${addon}: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}
