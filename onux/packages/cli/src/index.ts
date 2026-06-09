#!/usr/bin/env node

/**
 * @cinacoin/cli
 *
 * Command-line interface for Cinacoin SDK.
 *
 * Commands:
 *   cinacoin init      — Scaffold a new dApp project (interactive)
 *   cinacoin template   — Download project templates
 *   cinacoin add        — Add components or packages
 *   cinacoin doctor     — Diagnose project setup
 *   cinacoin build      — Build the SDK packages
 *   cinacoin test       — Run unit + E2E tests
 *
 * Usage:
 *   npx @cinacoin/cli init
 *   npx @cinacoin/cli template wallet
 *   npx @cinacoin/cli add connect-button
 *   npx @cinacoin/cli doctor
 *   npx @cinacoin/cli build
 *   npx @cinacoin/cli test --e2e
 */

import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { templateCommand } from './commands/template.js';
import { addCommand } from './commands/add.js';
import { doctorCommand } from './commands/doctor.js';
import { buildCommand } from './commands/build.js';
import { testCommand } from './commands/test.js';
import { VERSION } from './utils/fs.js';

program
  .name('cinacoin')
  .description('Cinacoin SDK CLI — self-hosted wallet connection toolkit')
  .version(VERSION, '-v, --version');

// Register subcommands
initCommand(program);
templateCommand(program);
addCommand(program);
doctorCommand(program);
buildCommand(program);
testCommand(program);

// Handle unknown commands
program.on('command:*', (operands) => {
  const [cmd] = operands as string[];
  console.error(`\n  error: unknown command '${cmd}'\n`);
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);
