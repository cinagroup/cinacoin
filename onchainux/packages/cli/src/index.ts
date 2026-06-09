#!/usr/bin/env node

/**
 * @onchainux/cli
 *
 * Command-line interface for OnChainUX SDK.
 *
 * Commands:
 *   ocx init    — Scaffold a new OnChainUX project
 *   ocx add     — Add adapters, plugins, or UI components
 *   ocx build   — Build the SDK packages
 *   ocx test    — Run unit + E2E tests
 *
 * Usage:
 *   npx @onchainux/cli init my-app
 *   npx @onchainux/cli add @onchainux/swap-sdk
 *   npx @onchainux/cli build
 *   npx @onchainux/cli test --e2e
 */

import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { buildCommand } from './commands/build.js';
import { testCommand } from './commands/test.js';
import { VERSION } from './utils/fs.js';

program
  .name('onchainux')
  .description('OnChainUX SDK CLI — self-hosted wallet connection toolkit')
  .version(VERSION, '-v, --version');

// Register subcommands
initCommand(program);
addCommand(program);
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
