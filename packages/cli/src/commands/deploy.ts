#!/usr/bin/env node

/**
 * @cinacoin/cli — deploy command
 *
 * One-click deployment for Cinacoin dApps.
 *
 * Usage:
 *   npx @cinacoin/cli deploy              — Auto-detect & deploy
 *   npx @cinacoin/cli deploy --platform cloudflare
 *   npx @cinacoin/cli deploy --env prod
 */

import type { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { spinner, header, info, success, warn, error } from '../utils/logger.js';

// ============================================================
// Platform Detection
// ============================================================

type Platform = 'cloudflare' | 'vercel' | 'netlify' | 'auto';

interface ProjectConfig {
  framework: string;
  buildCommand: string;
  outputDir: string;
  platform: Platform;
  envVars: Record<string, string>;
}

function detectFramework(cwd: string): string {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return 'unknown';

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.next) return 'next';
    if (deps.nuxt) return 'nuxt';
    if (deps['@cinacoin/react'] || deps.react) return 'react';
    if (deps.vue) return 'vue';
    if (deps.svelte) return 'svelte';
    if (deps.vite) return 'vite';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function detectPlatform(cwd: string): Platform {
  if (existsSync(join(cwd, 'wrangler.toml'))) return 'cloudflare';
  if (existsSync(join(cwd, 'vercel.json')) || existsSync(join(cwd, '.vercel'))) return 'vercel';
  if (existsSync(join(cwd, 'netlify.toml')) || existsSync(join(cwd, '.netlify'))) return 'netlify';
  return 'auto';
}

function getProjectConfig(cwd: string, platform: Platform): ProjectConfig {
  const framework = detectFramework(cwd);
  const detectedPlatform = platform === 'auto' ? detectPlatform(cwd) : platform;

  let buildCommand = 'npm run build';
  let outputDir = 'dist';
  const envVars: Record<string, string> = {};

  switch (framework) {
    case 'next':
      buildCommand = 'npm run build';
      outputDir = '.next';
      break;
    case 'nuxt':
      buildCommand = 'npm run build';
      outputDir = '.output';
      break;
    case 'react':
    case 'vite':
      buildCommand = 'npm run build';
      outputDir = 'dist';
      break;
    case 'vue':
      buildCommand = 'npm run build';
      outputDir = 'dist';
      break;
    case 'svelte':
      buildCommand = 'npm run build';
      outputDir = 'build';
      break;
  }

  // Platform-specific adjustments
  if (detectedPlatform === 'cloudflare' && framework === 'next') {
    outputDir = '.next';
  }

  return {
    framework,
    buildCommand,
    outputDir,
    platform: detectedPlatform,
    envVars,
  };
}

// ============================================================
// Platform Deployers
// ============================================================

async function deployCloudflare(config: ProjectConfig, cwd: string, env: string): Promise<void> {
  const s = spinner('Deploying to Cloudflare Pages...');

  try {
    // Ensure wrangler.toml exists
    const wranglerPath = join(cwd, 'wrangler.toml');
    if (!existsSync(wranglerPath)) {
      const wranglerContent = `name = "cinacoin-app"
compatibility_date = "2025-01-01"
pages_build_output_dir = "${config.outputDir}"
`;
      writeFileSync(wranglerPath, wranglerContent);
    }

    // Update wrangler.toml with env-specific settings
    if (env === 'prod') {
      const wranglerContent = `name = "cinacoin-app-prod"
compatibility_date = "2025-01-01"
pages_build_output_dir = "${config.outputDir}"
`;
      writeFileSync(wranglerPath, wranglerContent);
    }

    // Build
    const buildS = spinner('Building project...');
    try {
      execSync('npm run build', { cwd, stdio: 'pipe' });
      buildS.succeed('Build completed');
    } catch (buildErr) {
      buildS.fail('Build failed');
      throw buildErr;
    }

    // Deploy
    const deployCmd = env === 'prod'
      ? 'npx wrangler pages deploy'
      : 'npx wrangler pages deploy --branch preview';

    execSync(deployCmd, { cwd, stdio: 'pipe' });
    s.succeed(`Deployed to Cloudflare Pages (${env})`);

    console.log('');
    info(`Preview: https://cinacoin-app.pages.dev`);
    if (env === 'prod') {
      info(`Production: https://cinacoin.com`);
    }
    console.log('');

  } catch (err) {
    s.fail(`Cloudflare deployment failed: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

async function deployVercel(config: ProjectConfig, cwd: string, env: string): Promise<void> {
  const s = spinner('Deploying to Vercel...');

  try {
    // Build
    const buildS = spinner('Building project...');
    try {
      execSync('npm run build', { cwd, stdio: 'pipe' });
      buildS.succeed('Build completed');
    } catch (buildErr) {
      buildS.fail('Build failed');
      throw buildErr;
    }

    // Deploy
    const deployCmd = env === 'prod'
      ? 'npx vercel --prod --yes'
      : 'npx vercel --yes';

    execSync(deployCmd, { cwd, stdio: 'pipe' });
    s.succeed(`Deployed to Vercel (${env})`);

  } catch (err) {
    s.fail(`Vercel deployment failed: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

async function deployAuto(config: ProjectConfig, cwd: string, env: string): Promise<void> {
  // Try Cloudflare first, then Vercel
  if (existsSync(join(cwd, 'wrangler.toml'))) {
    await deployCloudflare(config, cwd, env);
  } else if (existsSync(join(cwd, 'vercel.json'))) {
    await deployVercel(config, cwd, env);
  } else {
    warn('No deployment platform detected. Defaulting to Cloudflare Pages.');
    await deployCloudflare(config, cwd, env);
  }
}

// ============================================================
// deploy command
// ============================================================

export function deployCommand(cli: Command): void {
  cli
    .command('deploy')
    .description('Deploy Cinacoin dApp to hosting platform')
    .option('--platform <name>', 'Platform: cloudflare/vercel/netlify/auto', 'auto')
    .option('--env <env>', 'Environment: dev/staging/prod', 'dev')
    .option('--dir <dir>', 'Project directory', process.cwd())
    .option('--skip-build', 'Skip build step')
    .option('--dry-run', 'Show deployment plan without executing')
    .action(async (opts: {
      platform: string;
      env: string;
      dir: string;
      skipBuild?: boolean;
      dryRun?: boolean;
    }) => {
      const cwd = opts.dir;
      const platform = opts.platform as Platform;
      const env = opts.env;

      header('Cinacoin Deployment');
      console.log(`  Directory:  ${cwd}`);
      console.log(`  Platform:   ${platform}`);
      console.log(`  Environment: ${env}`);
      console.log('');

      // Detect project config
      const config = getProjectConfig(cwd, platform);
      console.log(`  Framework:  ${config.framework}`);
      console.log(`  Build Cmd:  ${config.buildCommand}`);
      console.log(`  Output Dir: ${config.outputDir}`);
      console.log(`  Detected:   ${config.platform}`);
      console.log('');

      // Dry run
      if (opts.dryRun) {
        header('Dry Run — Deployment Plan');
        if (!opts.skipBuild) {
          console.log(`  1. Run: ${config.buildCommand}`);
        }
        console.log(`  2. Deploy to ${config.platform} (${env})`);
        console.log(`  3. Output: ${config.outputDir}`);
        console.log('');
        info('Run without --dry-run to execute');
        return;
      }

      // Deploy
      try {
        if (!opts.skipBuild) {
          const buildS = spinner('Building project...');
          try {
            execSync(config.buildCommand, { cwd, stdio: 'pipe' });
            buildS.succeed('Build completed');
          } catch (buildErr) {
            buildS.fail(`Build failed: ${buildErr instanceof Error ? buildErr.message : String(buildErr)}`);
            process.exit(1);
          }
        }

        switch (config.platform) {
          case 'cloudflare':
            await deployCloudflare(config, cwd, env);
            break;
          case 'vercel':
            await deployVercel(config, cwd, env);
            break;
          default:
            await deployAuto(config, cwd, env);
            break;
        }

        success('Deployment completed!');
      } catch (err) {
        error(`Deployment failed: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}
