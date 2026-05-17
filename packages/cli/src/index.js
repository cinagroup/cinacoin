#!/usr/bin/env node
/**
 * @cinaconnect/cli
 *
 * Command-line interface for CinaConnect SDK.
 *
 * Commands:
 *   ocx init    — Scaffold a new CinaConnect project
 *   ocx add     — Add adapters, plugins, or UI components
 *   ocx build   — Build the SDK packages
 *   ocx test    — Run unit + E2E tests
 *
 * Usage:
 *   npx @cinaconnect/cli init my-app
 *   npx @cinaconnect/cli add @cinaconnect/swap-sdk
 *   npx @cinaconnect/cli build
 *   npx @cinaconnect/cli test --e2e
 */
import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { buildCommand } from './commands/build.js';
import { testCommand } from './commands/test.js';
import { VERSION } from './utils/fs.js';
program
    .name('cinaconnect')
    .description('CinaConnect SDK CLI — self-hosted wallet connection toolkit')
    .version(VERSION, '-v, --version');
// Register subcommands
initCommand(program);
addCommand(program);
buildCommand(program);
testCommand(program);
// Handle unknown commands
program.on('command:*', (operands) => {
    const [cmd] = operands;
    console.error(`\n  error: unknown command '${cmd}'\n`);
    program.outputHelp();
    process.exit(1);
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map