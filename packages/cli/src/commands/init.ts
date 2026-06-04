#!/usr/bin/env node

/**
 * @cinacoin/cli — init command
 *
 * Interactive scaffolding for new Cinacoin dApp projects.
 *
 * Usage:
 *   npx @cinacoin/cli init            — Interactive mode
 *   npx @cinacoin/cli init my-app     — Quick scaffold
 *   npx @cinacoin/cli init --dry-run  — Preview only
 */

import type { Command } from 'commander';
import { join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { spinner, header, info, success, warn } from '../utils/logger.js';
import { copyDir } from '../utils/fs.js';

// ============================================================
// Configuration constants
// ============================================================

const FRAMEWORKS = ['react', 'vue', 'svelte', 'next', 'nuxt'] as const;
type Framework = (typeof FRAMEWORKS)[number];

const LANGUAGES = ['typescript', 'javascript'] as const;
type Language = (typeof LANGUAGES)[number];

const TEMPLATES = ['minimal', 'full-demo'] as const;
type Template = (typeof TEMPLATES)[number];

// ============================================================
// Interactive prompt helpers (simple readline-based)
// ============================================================

import * as readline from 'node:readline';

function createPrompt() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

async function ask(rl: readline.Interface, question: string, defaultVal?: string): Promise<string> {
  return new Promise((resolve) => {
    const prompt = defaultVal !== undefined ? `${question} [${defaultVal}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultVal || '');
    });
  });
}

async function pick(rl: readline.Interface, question: string, choices: readonly string[], defaultIdx?: number): Promise<string> {
  console.log(`  ${question}`);
  choices.forEach((c, i) => {
    const marker = defaultIdx === i ? ' ◀ default' : '';
    console.log(`    ${i + 1}. ${c}${marker}`);
  });
  const answer = await ask(rl, `  Choice (1-${choices.length})`);
  const idx = parseInt(answer, 10) - 1;
  if (idx >= 0 && idx < choices.length) return choices[idx];
  if (defaultIdx !== undefined) return choices[defaultIdx];
  return choices[0];
}

// ============================================================
// init command
// ============================================================

export function initCommand(cli: Command): void {
  cli
    .command('init')
    .description('Scaffold a new Cinacoin dApp project')
    .argument('[directory]', 'Project directory name', '')
    .option('--name <name>', 'Project name')
    .option('--framework <name>', 'Framework (react/vue/svelte/next/nuxt)')
    .option('--language <lang>', 'Language (typescript/javascript)')
    .option('--template <name>', 'Template (minimal/full-demo)')
    .option('--package-manager <pm>', 'Package manager (npm/yarn/pnpm)', 'pnpm')
    .option('--no-install', 'Skip dependency installation')
    .option('--dry-run', 'Show what would be created without writing files')
    .option('--yes', 'Skip interactive prompts, use defaults')
    .action(async (directory: string, opts: Record<string, string | boolean>) => {
      const rl = createPrompt();

      try {
        // ── Gather configuration ──────────────────────────────
        let projectName = (opts.name as string) || directory || '';
        let framework = (opts.framework as string) || '';
        let language = (opts.language as string) || '';
        let template = (opts.template as string) || '';
        const packageManager = (opts.packageManager as string) || 'pnpm';
        const skipInstall = opts.install === false;
        const dryRun = opts.dryRun === true;
        const yesMode = opts.yes === true;

        // Interactive mode when no flags provided
        if (!projectName || yesMode === false) {
          if (!projectName && !yesMode) {
            projectName = await ask(rl, 'Project name', 'my-cinacoin-app');
          }
          if (!framework) {
            framework = await pick(rl, 'Select framework:', FRAMEWORKS as readonly string[], 0);
          }
          if (!language) {
            language = await pick(rl, 'Language:', LANGUAGES as readonly string[], 0);
          }
          if (!template) {
            template = await pick(rl, 'Template:', TEMPLATES as readonly string[], 1);
          }
        }

        // Apply defaults
        projectName = projectName || 'my-cinacoin-app';
        framework = framework || 'react';
        language = language || 'typescript';
        template = template || 'full-demo';

        // Validate
        if (!FRAMEWORKS.includes(framework as Framework)) {
          warn(`Unknown framework '${framework}'. Available: ${FRAMEWORKS.join(', ')}`);
          rl.close();
          process.exit(1);
        }
        if (!LANGUAGES.includes(language as Language)) {
          warn(`Unknown language '${language}'. Available: ${LANGUAGES.join(', ')}`);
          rl.close();
          process.exit(1);
        }
        if (!TEMPLATES.includes(template as Template)) {
          warn(`Unknown template '${template}'. Available: ${TEMPLATES.join(', ')}`);
          rl.close();
          process.exit(1);
        }

        const targetDir = join(process.cwd(), projectName);

        // ── Dry run ───────────────────────────────────────────
        if (dryRun) {
          header('Dry Run — Would create:');
          console.log(`  Project:     ${projectName}`);
          console.log(`  Framework:   ${framework}`);
          console.log(`  Language:    ${language}`);
          console.log(`  Template:    ${template}`);
          console.log(`  Pkg Manager: ${packageManager}`);
          console.log(`  Location:    ${targetDir}\n`);

          const tree = generateFileTree(projectName, framework as Framework, template as Template, language as Language);
          console.log('  Files:');
          for (const f of tree) console.log(`    ${f}`);
          console.log();
          rl.close();
          return;
        }

        // ── Check existing directory ──────────────────────────
        if (existsSync(targetDir)) {
          warn(`Directory '${projectName}' already exists.`);
          rl.close();
          process.exit(1);
        }

        // ── Scaffold ──────────────────────────────────────────
        const s = spinner('Scaffolding Cinacoin project...');

        try {
          // Create directory structure
          const dirs = ['src', 'src/components', 'src/hooks', 'public'];
          if (['next', 'nuxt'].includes(framework)) {
            dirs.push('src/pages', 'src/layouts');
          }
          for (const d of dirs) {
            mkdirSync(join(targetDir, d), { recursive: true });
          }

          // Generate package.json
          const pkg = generatePackageJson(
            projectName,
            framework as Framework,
            packageManager,
            language as Language,
            template as Template,
          );
          writeFileSync(join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

          // Generate tsconfig or jsconfig
          const config = language === 'typescript'
            ? generateTsConfig(framework as Framework)
            : generateJsConfig(framework as Framework);
          writeFileSync(join(targetDir, language === 'typescript' ? 'tsconfig.json' : 'jsconfig.json'), JSON.stringify(config, null, 2) + '\n');

          // Generate environment template
          writeFileSync(join(targetDir, '.env.example'), generateEnvTemplate());

          // Generate gitignore
          writeFileSync(join(targetDir, '.gitignore'), generateGitignore());

          // Generate main entry files
          const ext = language === 'typescript' ? 'ts' : 'js';
          const mainFile = generateMainFile(framework as Framework, language as Language);
          writeFileSync(join(targetDir, 'src', `main.${ext}`), mainFile);

          // Generate App component
          const appContent = generateAppComponent(framework as Framework, language as Language, template as Template);
          writeFileSync(join(targetDir, 'src', `App.${ext === 'ts' ? 'tsx' : 'jsx'}`), appContent);

          // Generate config file
          const configContent = generateCinacoinConfig(framework as Framework, language as Language);
          writeFileSync(join(targetDir, 'src', `cinacoin.config.${ext}`), configContent);

          // Template-specific files
          if (template === 'full-demo') {
            const demoContent = generateDemoComponent(framework as Framework, language as Language);
            writeFileSync(join(targetDir, 'src', 'components', `DemoWallet.${ext === 'ts' ? 'tsx' : 'jsx'}`), demoContent);
          }

          // README
          writeFileSync(join(targetDir, 'README.md'), generateReadme(projectName, framework as Framework, packageManager));

          s.succeed(`Project '${projectName}' created successfully!`);

          // ── Install dependencies ────────────────────────────
          if (!skipInstall) {
            const installS = spinner('Installing dependencies...');
            try {
              const installCmd = getInstallCommand(packageManager);
              execSync(installCmd, { cwd: targetDir, stdio: 'pipe' });
              installS.succeed('Dependencies installed');
            } catch (installErr) {
              installS.warn(`Dependency install failed — run '${packageManager} install' manually`);
            }
          }

          // ── Show next steps ─────────────────────────────────
          header('Next Steps');
          console.log(`    cd ${projectName}`);
          if (skipInstall) {
            console.log(`    ${packageManager} install`);
          }
          console.log(`    ${packageManager} dev`);
          console.log();
          info(`Docs: https://cinacoin.dev/guide`);
          console.log();

        } catch (err) {
          s.fail(`Failed to scaffold project: ${err instanceof Error ? err.message : String(err)}`);
          rl.close();
          process.exit(1);
        }

      } finally {
        rl.close();
      }
    });
}

// ============================================================
// File tree generator (for dry-run)
// ============================================================

function generateFileTree(
  name: string,
  framework: Framework,
  template: Template,
  language: Language,
): string[] {
  const ext = language === 'typescript' ? 'ts' : 'js';
  const tsxExt = language === 'typescript' ? 'tsx' : 'jsx';
  const files: string[] = [
    `${name}/`,
    `├── package.json`,
    `├── ${language === 'typescript' ? 'tsconfig.json' : 'jsconfig.json'}`,
    `├── .env.example`,
    `├── .gitignore`,
    `├── README.md`,
    `├── src/`,
    `│   ├── main.${ext}`,
    `│   ├── App.${tsxExt}`,
    `│   ├── cinacoin.config.${ext}`,
    `│   ├── components/`,
  ];
  if (template === 'full-demo') {
    files.push(`│   │   └── DemoWallet.${tsxExt}`);
  } else {
    files.push(`│   │   └── (empty)`);
  }
  files.push(`│   └── hooks/`);
  if (['next', 'nuxt'].includes(framework)) {
    files.push(`│   ├── pages/`);
    files.push(`│   └── layouts/`);
  }
  return files;
}

// ============================================================
// Package.json generator
// ============================================================

function generatePackageJson(
  name: string,
  framework: Framework,
  pm: string,
  language: Language,
  template: Template,
): Record<string, unknown> {
  const runCmd = pm === 'npm' ? 'npm run' : pm;
  const isFramework = ['next', 'nuxt'].includes(framework);
  const isVite = !isFramework;

  const deps: Record<string, string> = {
    '@cinacoin/core-sdk': '^0.1.0',
  };
  if (framework === 'react' || framework === 'next') {
    deps['@cinacoin/react'] = '^0.1.0';
  } else if (framework === 'vue' || framework === 'nuxt') {
    deps['@cinacoin/vue'] = '^0.1.0';
  } else if (framework === 'svelte') {
    deps['@cinacoin/svelte'] = '^0.1.0';
  }
  deps['@cinacoin/ui'] = '^0.1.0';

  const devDeps: Record<string, string> = {};
  if (language === 'typescript') {
    devDeps['typescript'] = '^5.7.0';
  }
  if (isVite) {
    devDeps['vite'] = '^6.0.0';
  }
  if (framework === 'react') {
    deps['react'] = '^18.3.0';
    deps['react-dom'] = '^18.3.0';
    devDeps['@types/react'] = '^18.3.0';
    devDeps['@types/react-dom'] = '^18.3.0';
  } else if (framework === 'next') {
    deps['next'] = '^15.0.0';
    deps['react'] = '^18.3.0';
    deps['react-dom'] = '^18.3.0';
    devDeps['@types/react'] = '^18.3.0';
    devDeps['@types/react-dom'] = '^18.3.0';
  } else if (framework === 'vue' || framework === 'nuxt') {
    deps['vue'] = '^3.5.0';
  } else if (framework === 'svelte') {
    deps['svelte'] = '^5.0.0';
  }

  const scripts: Record<string, string> = {};
  if (framework === 'next') {
    scripts.dev = 'next dev';
    scripts.build = 'next build';
    scripts.start = 'next start';
    scripts.lint = 'next lint';
  } else if (framework === 'nuxt') {
    scripts.dev = 'nuxt dev';
    scripts.build = 'nuxt build';
    scripts.start = 'nuxt start';
    scripts.generate = 'nuxt generate';
  } else {
    scripts.dev = `${runCmd} vite`;
    scripts.build = `${runCmd} vite build`;
    scripts.preview = `${runCmd} vite preview`;
  }
  if (language === 'typescript') {
    scripts.typecheck = 'tsc --noEmit';
  }

  const pkg: Record<string, unknown> = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts,
    dependencies: deps,
  };
  if (Object.keys(devDeps).length > 0) {
    (pkg as Record<string, unknown>).devDependencies = devDeps;
  }
  return pkg;
}

// ============================================================
// Config generators
// ============================================================

function generateTsConfig(framework: Framework): Record<string, unknown> {
  const base: Record<string, unknown> = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: 'dist',
      rootDir: 'src',
      jsx: framework === 'react' || framework === 'next' ? 'react-jsx' : 'preserve',
    },
    include: ['src'],
  };
  return base;
}

function generateJsConfig(framework: Framework): Record<string, unknown> {
  return {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowJs: true,
      checkJs: false,
      jsx: framework === 'react' || framework === 'next' ? 'react-jsx' : 'preserve',
    },
    include: ['src'],
  };
}

function generateEnvTemplate(): string {
  return [
    '# Cinacoin Environment Configuration',
    '# Copy to .env.local and fill in your values',
    '',
    'VITE_CINACOIN_RPC_URL=https://eth.llamarpc.com',
    'VITE_CINACOIN_CHAIN_ID=1',
    'VITE_CINACOIN_PROJECT_NAME=My Cinacoin App',
    'VITE_CINACOIN_PROJECT_DESCRIPTION=A decentralized application built with Cinacoin',
    'VITE_CINACOIN_PROJECT_URL=https://example.com',
    '',
    '# Optional: WalletConnect Project ID (https://cloud.walletconnect.com)',
    'VITE_WALLETCONNECT_PROJECT_ID=',
    '',
    '# Optional: Custom RPC endpoints',
    'VITE_RPC_ETH_MAINNET=https://eth.llamarpc.com',
    'VITE_RPC_POLYGON=https://polygon-rpc.com',
    'VITE_RPC_ARBITRUM=https://arb1.arbitrum.io/rpc',
  ].join('\n') + '\n';
}

function generateGitignore(): string {
  return [
    '# Dependencies',
    'node_modules/',
    '',
    '# Build outputs',
    'dist/',
    '.next/',
    '.nuxt/',
    '.output/',
    '',
    '# Environment files',
    '.env.local',
    '.env.*.local',
    '!.env.example',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Logs',
    '*.log',
    'npm-debug.log*',
    'pnpm-debug.log*',
  ].join('\n') + '\n';
}

// ============================================================
// Source file generators
// ============================================================

function generateMainFile(framework: Framework, language: Language): string {
  const isTs = language === 'typescript';
  const ext = isTs ? 'ts' : 'js';

  if (framework === 'react') {
    return `import React from 'react';
import { createRoot } from 'react-dom/client';
import { CinacoinProvider } from '@cinacoin/react';
import { config } from './cinacoin.config.${ext}';
import App from './App.${isTs ? 'tsx' : 'jsx'}';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <CinacoinProvider config={config}>
      <App />
    </CinacoinProvider>
  </React.StrictMode>
);
`;
  }

  if (framework === 'next') {
    return `// Next.js uses layout.tsx and page.tsx as entry points
// See src/pages for routing configuration
// CinacoinProvider is configured in src/cinacoin.config.${ext}
export { default } from './App.${isTs ? 'tsx' : 'jsx'}';
`;
  }

  if (framework === 'vue') {
    return `import { createApp } from 'vue';
import { CinacoinPlugin } from '@cinacoin/vue';
import { config } from './cinacoin.config.${ext}';
import App from './App.${isTs ? 'vue' : 'vue'}';

const app = createApp(App);
app.use(CinacoinPlugin, config);
app.mount('#app');
`;
  }

  if (framework === 'nuxt') {
    return `// Nuxt uses nuxt.config.ts for plugin registration
// Cinacoin is configured in src/cinacoin.config.${ext}
// See https://nuxt.com/docs for details
`;
  }

  // svelte / vanilla
  return `import { Cinacoin } from '@cinacoin/core-sdk';
import { config } from './cinacoin.config.${ext}';

const cinacoin = new Cinacoin(config);

// Initialize and connect
async function main() {
  console.log('Cinacoin initialized');
  const chains = cinacoin.getChains();
  console.log('Available chains:', chains);
}

main().catch(console.error);
`;
}

function generateAppComponent(
  framework: Framework,
  language: Language,
  template: Template,
): string {
  const isTs = language === 'typescript';
  const isReact = framework === 'react' || framework === 'next';

  if (isReact) {
    const demoImport = template === 'full-demo'
      ? `import DemoWallet from './components/DemoWallet.${isTs ? 'tsx' : 'jsx'}';\n`
      : '';
    const demoComponent = template === 'full-demo'
      ? `      <DemoWallet />\n`
      : '';

    return `import React from 'react';
import { ConnectButton, useAccount, useChainId } from '@cinacoin/react';
${demoImport}
export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>🔢 Cinacoin App</h1>
        <ConnectButton />
      </header>

      {isConnected ? (
        <main>
          <p>Connected: <code>{address}</code></p>
          <p>Chain ID: <code>{chainId}</code></p>
${demoComponent}        </main>
      ) : (
        <p style={{ textAlign: 'center', color: '#888' }}>
          Connect your wallet to get started
        </p>
      )}
    </div>
  );
}
`;
  }

  if (framework === 'vue' || framework === 'nuxt') {
    return `<template>
  <div style="padding: 2rem; font-family: system-ui">
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem">
      <h1 style="margin: 0">🔢 Cinacoin App</h1>
      <ConnectButton />
    </header>
    <p v-if="isConnected">Connected: {{ address }}</p>
    <p v-else>Connect your wallet to get started</p>
  </div>
</template>

<script setup>
import { ConnectButton, useAccount } from '@cinacoin/vue'
const { address, isConnected } = useAccount()
</script>
`;
  }

  // svelte / vanilla
  return `// Cinacoin ${framework} app
// Connect wallet and interact with chains
// See docs: https://cinacoin.dev/guide/quick-start

import { ConnectButton } from '@cinacoin/ui';

document.body.innerHTML = \`
  <div style="padding: 2rem; font-family: system-ui">
    <h1>🔢 Cinacoin App</h1>
    <p>Connect your wallet to get started</p>
  </div>
\`;

const btn = new ConnectButton(document.body);
`;
}

function generateCinacoinConfig(framework: Framework, language: Language): string {
  const isTs = language === 'typescript';
  const typeExport = isTs ? ': CinacoinConfig' : '';

  return `import type { CinacoinConfig${isTs ? '' : '' } } from '@cinacoin/core-sdk';

export const config${typeExport} = {
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: import.meta.env.VITE_CINACOIN_RPC_URL || 'https://eth.llamarpc.com',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
    {
      id: 137,
      name: 'Polygon',
      rpcUrl: import.meta.env.VITE_RPC_POLYGON || 'https://polygon-rpc.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    },
    {
      id: 42161,
      name: 'Arbitrum',
      rpcUrl: import.meta.env.VITE_RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
  ],
  theme: {
    mode: 'dark',
    accentColor: '#6366f1',
  },
  metadata: {
    name: import.meta.env.VITE_CINACOIN_PROJECT_NAME || 'Cinacoin App',
    description: import.meta.env.VITE_CINACOIN_PROJECT_DESCRIPTION || 'Built with Cinacoin',
    url: import.meta.env.VITE_CINACOIN_PROJECT_URL || 'https://example.com',
    iconUrl: '/favicon.ico',
  },
  walletConnect: {
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  },
};
`;
}

function generateDemoComponent(framework: Framework, language: Language): string {
  const isReact = framework === 'react' || framework === 'next';

  if (isReact) {
    return `import React, { useState } from 'react';
import { useAccount, useBalance, useDisconnect } from '@cinacoin/react';

export default function DemoWallet() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) return null;

  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1rem',
    }}>
      <h3 style={{ margin: '0 0 1rem' }}>Wallet</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <code style={{
          background: '#0d0d1a',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          flex: 1,
        }}>
          {address}
        </code>
        <button
          onClick={copyAddress}
          style={{
            background: copied ? '#22c55e' : '#333',
            border: 'none',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>

      {balance && (
        <p style={{ margin: '0 0 1rem', color: '#888' }}>
          Balance: {balance.formatted} {balance.symbol}
        </p>
      )}

      <button
        onClick={() => disconnect()}
        style={{
          background: '#ef4444',
          border: 'none',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Disconnect
      </button>
    </div>
  );
}
`;
  }

  return `// DemoWallet component for ${framework}
// See React version for full implementation
`;
}

function generateReadme(name: string, framework: Framework, pm: string): string {
  const runCmd = pm === 'npm' ? 'npm run' : pm;
  return `# ${name}

A decentralized application built with [Cinacoin](https://cinacoin.dev).

## Stack

- Framework: ${framework}
- SDK: @cinacoin/core-sdk
- UI: @cinacoin/${framework === 'next' ? 'react' : framework === 'nuxt' ? 'vue' : framework}

## Getting Started

\`\`\`bash
${pm} install
${runCmd} dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

## Project Structure

\`\`\`
src/
├── main.${framework === 'next' ? 'tsx' : 'ts'}          # Entry point
├── App.${framework === 'next' ? 'tsx' : framework === 'vue' ? 'vue' : 'tsx'}             # Root component
├── cinacoin.config.ts       # Cinacoin SDK configuration
├── components/              # UI components
└── hooks/                   # Custom React hooks
\`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env.local\` and configure your RPC endpoints.

## Resources

- [Cinacoin Docs](https://cinacoin.dev)
- [Cinacoin SDK Reference](https://cinacoin.dev/sdk)
- [GitHub](https://github.com/cinacoin)
`;
}

// ============================================================
// Utility helpers
// ============================================================

function getInstallCommand(pm: string): string {
  switch (pm) {
    case 'pnpm': return 'pnpm install';
    case 'yarn': return 'yarn install';
    default: return 'npm install';
  }
}
