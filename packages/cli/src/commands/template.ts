#!/usr/bin/env node

/**
 * @cinacoin/cli — template command
 *
 * Download pre-built Cinacoin templates into the current directory.
 *
 * Usage:
 *   npx @cinacoin/cli template minimal    — Bare minimum connection setup
 *   npx @cinacoin/cli template wallet      — Full wallet UI
 *   npx @cinacoin/cli template defi        — DeFi app with swap + liquidity
 *   npx @cinacoin/cli template nft         — NFT marketplace
 *   npx @cinacoin/cli template game        — GameFi with session keys
 */

import type { Command } from 'commander';
import { join, basename } from 'node:path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { spinner, header, info, warn, error } from '../utils/logger.js';

// ============================================================
// Template definitions
// ============================================================

interface TemplateFile {
  path: string;
  content: string;
}

interface TemplateDef {
  name: string;
  description: string;
  files: TemplateFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  readme: string;
}

const TEMPLATES: Record<string, TemplateDef> = {
  minimal: {
    name: 'minimal',
    description: 'Bare minimum Cinacoin connection setup',
    files: [
      {
        path: 'src/cinacoin.config.ts',
        content: `import type { CinacoinConfig } from '@cinacoin/core-sdk';

export const config: CinacoinConfig = {
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: 'https://eth.llamarpc.com',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    },
  ],
  metadata: {
    name: 'Cinacoin App',
    description: 'Built with Cinacoin',
    url: 'https://example.com',
  },
};
`,
      },
      {
        path: 'src/main.ts',
        content: `import { CinacoinProvider } from '@cinacoin/react';
import { createRoot } from 'react-dom/client';
import { config } from './cinacoin.config.js';
import App from './App.jsx';

createRoot(document.getElementById('root')!).render(
  <CinacoinProvider config={config}>
    <App />
  </CinacoinProvider>
);
`,
      },
      {
        path: 'src/App.jsx',
        content: `import { ConnectButton, useAccount } from '@cinacoin/react';

export default function App() {
  const { address, isConnected } = useAccount();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Cinacoin Minimal</h1>
      <ConnectButton />
      {isConnected && <p>Connected: {address}</p>}
    </div>
  );
}
`,
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cinacoin Minimal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
      },
    ],
    dependencies: {
      '@cinacoin/core-sdk': '^0.1.0',
      '@cinacoin/react': '^0.1.0',
      '@cinacoin/ui': '^0.1.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      vite: '^6.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.7.0',
    },
    readme: `# Cinacoin Minimal Template

Bare minimum setup to connect a wallet with Cinacoin.

## Quick Start

\`\`\`bash
pnpm install && pnpm dev
\`\`\`

## What's Included

- Single \`CinacoinProvider\` wrapping the app
- \`ConnectButton\` component for wallet connection
- \`useAccount\` hook to read connection state

That's it — no boilerplate, no extras.
`,
  },

  wallet: {
    name: 'wallet',
    description: 'Full wallet UI with balance, transactions, and network switching',
    files: [
      {
        path: 'src/cinacoin.config.ts',
        content: `import type { CinacoinConfig } from '@cinacoin/core-sdk';

export const config: CinacoinConfig = {
  chains: [
    { id: 1, name: 'Ethereum', rpcUrl: 'https://eth.llamarpc.com', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { id: 137, name: 'Polygon', rpcUrl: 'https://polygon-rpc.com', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
    { id: 42161, name: 'Arbitrum', rpcUrl: 'https://arb1.arbitrum.io/rpc', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { id: 10, name: 'Optimism', rpcUrl: 'https://mainnet.optimism.io', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  ],
  theme: { mode: 'dark', accentColor: '#6366f1' },
  metadata: { name: 'Cinacoin Wallet', description: 'Full-featured wallet UI', url: 'https://example.com' },
};
`,
      },
      {
        path: 'src/main.ts',
        content: `import { CinacoinProvider } from '@cinacoin/react';
import { createRoot } from 'react-dom/client';
import { config } from './cinacoin.config.js';
import App from './App.jsx';

createRoot(document.getElementById('root')!).render(
  <CinacoinProvider config={config}>
    <App />
  </CinacoinProvider>
);
`,
      },
      {
        path: 'src/App.jsx',
        content: `import { useState } from 'react';
import { ConnectButton, useAccount, useBalance, useChainId, useDisconnect, useSwitchChain } from '@cinacoin/react';
import { config } from './cinacoin.config.js';
import TransactionHistory from './components/TransactionHistory.jsx';

export default function App() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain, chains } = useSwitchChain();
  const [activeTab, setActiveTab] = useState('overview');

  const currentChain = config.chains.find(c => c.id === chainId);

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a1a' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', marginBottom: '2rem' }}>🔢 Cinacoin Wallet</h1>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', background: '#0a0a1a', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>🔢 Cinacoin Wallet</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={chainId}
            onChange={e => switchChain(parseInt(e.target.value))}
            style={{ background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.5rem', borderRadius: '4px' }}
          >
            {chains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ConnectButton />
        </div>
      </header>

      {/* Balance Card */}
      <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#888', margin: '0 0 0.5rem' }}>Total Balance</p>
        <h2 style={{ margin: 0, fontSize: '2.5rem' }}>
          {balance?.formatted || '0.0000'} {balance?.symbol || currentChain?.nativeCurrency.symbol}
        </h2>
        <p style={{ color: '#666', margin: '0.5rem 0 0', fontFamily: 'monospace' }}>{address}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
        {['overview', 'transactions', 'send'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', color: activeTab === tab ? '#6366f1' : '#888',
              padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === tab ? '600' : '400',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && <TransactionHistory address={address} chainId={chainId} />}
      {activeTab === 'send' && <SendForm chainId={chainId} />}
    </div>
  );
}

function SendForm({ chainId }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Send</h3>
      <input placeholder="Recipient address" value={to} onChange={e => setTo(e.target.value)}
        style={{ width: '100%', padding: '0.75rem', background: '#0d0d1a', border: '1px solid #333', borderRadius: '8px', color: 'white', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
      <input placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)}
        style={{ width: '100%', padding: '0.75rem', background: '#0d0d1a', border: '1px solid #333', borderRadius: '8px', color: 'white', marginBottom: '1rem', boxSizing: 'border-box' }} />
      <button style={{ width: '100%', padding: '0.75rem', background: '#6366f1', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
        Send
      </button>
    </div>
  );
}
`,
      },
      {
        path: 'src/components/TransactionHistory.jsx',
        content: `export default function TransactionHistory({ address, chainId }) {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>
      <p style={{ color: '#888' }}>No transactions yet</p>
    </div>
  );
}
`,
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cinacoin Wallet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
      },
    ],
    dependencies: {
      '@cinacoin/core-sdk': '^0.1.0',
      '@cinacoin/react': '^0.1.0',
      '@cinacoin/ui': '^0.1.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      vite: '^6.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.7.0',
    },
    readme: `# Cinacoin Wallet Template

Full-featured wallet UI with balance display, chain switching, and transaction history.

## Features

- Wallet connection via ConnectButton
- Multi-chain support (ETH, Polygon, Arbitrum, Optimism)
- Balance display
- Chain switcher dropdown
- Tab-based navigation (Overview, Transactions, Send)
- Dark theme

## Quick Start

\`\`\`bash
pnpm install && pnpm dev
\`\`\`
`,
  },

  defi: {
    name: 'defi',
    description: 'DeFi app with token swap and liquidity pool management',
    files: [
      {
        path: 'src/cinacoin.config.ts',
        content: `import type { CinacoinConfig } from '@cinacoin/core-sdk';

export const config: CinacoinConfig = {
  chains: [
    { id: 1, name: 'Ethereum', rpcUrl: 'https://eth.llamarpc.com', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { id: 137, name: 'Polygon', rpcUrl: 'https://polygon-rpc.com', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
    { id: 56, name: 'BNB Chain', rpcUrl: 'https://bsc-dataseed.binance.org', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 } },
  ],
  theme: { mode: 'dark', accentColor: '#10b981' },
  metadata: { name: 'Cinacoin DeFi', description: 'Swap, liquidity, and yield farming', url: 'https://example.com' },
};
`,
      },
      {
        path: 'src/main.ts',
        content: `import { CinacoinProvider } from '@cinacoin/react';
import { createRoot } from 'react-dom/client';
import { config } from './cinacoin.config.js';
import App from './App.jsx';

createRoot(document.getElementById('root')!).render(
  <CinacoinProvider config={config}>
    <App />
  </CinacoinProvider>
);
`,
      },
      {
        path: 'src/App.jsx',
        content: `import { useState } from 'react';
import { ConnectButton, useAccount } from '@cinacoin/react';
import SwapPanel from './components/SwapPanel.jsx';
import LiquidityPanel from './components/LiquidityPanel.jsx';

export default function App() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState('swap');

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '2rem', background: '#0a0a1a', minHeight: '100vh', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>💱 Cinacoin DeFi</h1>
        <ConnectButton />
      </header>

      {!isConnected ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: '#888', marginBottom: '1rem' }}>Connect your wallet to trade</p>
          <ConnectButton />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['swap', 'liquidity'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '0.75rem', background: tab === t ? '#10b981' : '#1a1a2e', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: tab === t ? '600' : '400' }}>
                {t === 'swap' ? '🔄 Swap' : '💧 Liquidity'}
              </button>
            ))}
          </div>
          {tab === 'swap' && <SwapPanel />}
          {tab === 'liquidity' && <LiquidityPanel />}
        </>
      )}
    </div>
  );
}
`,
      },
      {
        path: 'src/components/SwapPanel.jsx',
        content: `import { useState } from 'react';

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', decimals: 6 },
  { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
  { symbol: 'BNB', name: 'BNB Chain', decimals: 18 },
];

export default function SwapPanel() {
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');

  return (
    <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Swap Tokens</h3>

      {/* From */}
      <div style={{ background: '#0d0d1a', borderRadius: '12px', padding: '1rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>From</span>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Balance: 0.00</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="number" placeholder="0.0" value={fromAmount} onChange={e => setFromAmount(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', outline: 'none' }} />
          <select value={fromToken.symbol} onChange={e => setFromToken(TOKENS.find(t => t.symbol === e.target.value))}
            style={{ background: '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem' }}>
            {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
          </select>
        </div>
      </div>

      {/* Swap icon */}
      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
        <button onClick={() => { setFromToken(toToken); setToToken(fromToken); }}
          style={{ background: '#333', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', cursor: 'pointer', fontSize: '1rem' }}>⇅</button>
      </div>

      {/* To */}
      <div style={{ background: '#0d0d1a', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>To</span>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Balance: 0.00</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" placeholder="0.0" readOnly
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', outline: 'none' }} />
          <select value={toToken.symbol} onChange={e => setToToken(TOKENS.find(t => t.symbol === e.target.value))}
            style={{ background: '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem' }}>
            {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
          </select>
        </div>
      </div>

      {/* Settings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#888' }}>Slippage Tolerance</span>
        <select value={slippage} onChange={e => setSlippage(e.target.value)}
          style={{ background: '#333', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem' }}>
          <option value="0.1">0.1%</option>
          <option value="0.5">0.5%</option>
          <option value="1">1%</option>
        </select>
      </div>

      <button style={{ width: '100%', padding: '1rem', background: '#10b981', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'var(--weight-semibold)', fontSize: '1rem', cursor: 'pointer' }}>
        Swap
      </button>
    </div>
  );
}
`,
      },
      {
        path: 'src/components/LiquidityPanel.jsx',
        content: `import { useState } from 'react';

const POOLS = [
  { name: 'ETH/USDC', tvl: '$12.4M', apr: '18.2%' },
  { name: 'ETH/USDT', tvl: '$8.1M', apr: '14.7%' },
  { name: 'MATIC/ETH', tvl: '$3.2M', apr: '22.1%' },
  { name: 'BNB/USDC', tvl: '$5.6M', apr: '16.8%' },
];

export default function LiquidityPanel() {
  const [selectedPool, setSelectedPool] = useState(null);

  return (
    <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '1.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Liquidity Pools</h3>

      {!selectedPool ? (
        <>
          {POOLS.map(pool => (
            <div key={pool.name} onClick={() => setSelectedPool(pool)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#0d0d1a', borderRadius: '8px', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)' }}>{pool.name}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>TVL: {pool.tvl}</div>
                <div style={{ color: '#10b981', fontSize: '0.85rem' }}>APR: {pool.apr}</div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <button onClick={() => setSelectedPool(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', marginBottom: '1rem' }}>← Back to pools</button>
          <h4>{selectedPool.name} Pool</h4>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, background: '#0d0d1a', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>TVL</div>
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>{selectedPool.tvl}</div>
            </div>
            <div style={{ flex: 1, background: '#0d0d1a', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>APR</div>
              <div style={{ color: '#10b981', fontWeight: 'var(--weight-semibold)' }}>{selectedPool.apr}</div>
            </div>
          </div>
          <button style={{ width: '100%', padding: '1rem', background: '#10b981', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
            Add Liquidity
          </button>
        </>
      )}
    </div>
  );
}
`,
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Cinacoin DeFi</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.ts"></script></body>
</html>
`,
      },
    ],
    dependencies: {
      '@cinacoin/core-sdk': '^0.1.0',
      '@cinacoin/react': '^0.1.0',
      '@cinacoin/ui': '^0.1.0',
      '@cinacoin/swap-sdk': '^0.1.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      vite: '^6.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.7.0',
    },
    readme: `# Cinacoin DeFi Template

DeFi application with token swap and liquidity pool management.

## Features

- Token swap with slippage control
- Liquidity pool browsing and management
- Multi-chain support
- TVL and APR display

## Quick Start

\`\`\`bash
pnpm install && pnpm dev
\`\`\`
`,
  },

  nft: {
    name: 'nft',
    description: 'NFT marketplace with browsing, listing, and collection management',
    files: [
      {
        path: 'src/cinacoin.config.ts',
        content: `import type { CinacoinConfig } from '@cinacoin/core-sdk';

export const config: CinacoinConfig = {
  chains: [
    { id: 1, name: 'Ethereum', rpcUrl: 'https://eth.llamarpc.com', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { id: 137, name: 'Polygon', rpcUrl: 'https://polygon-rpc.com', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
  ],
  theme: { mode: 'dark', accentColor: '#f59e0b' },
  metadata: { name: 'Cinacoin NFT', description: 'NFT marketplace built with Cinacoin', url: 'https://example.com' },
};
`,
      },
      {
        path: 'src/main.ts',
        content: `import { CinacoinProvider } from '@cinacoin/react';
import { createRoot } from 'react-dom/client';
import { config } from './cinacoin.config.js';
import App from './App.jsx';

createRoot(document.getElementById('root')!).render(
  <CinacoinProvider config={config}>
    <App />
  </CinacoinProvider>
);
`,
      },
      {
        path: 'src/App.jsx',
        content: `import { useState } from 'react';
import { ConnectButton, useAccount } from '@cinacoin/react';
import NftGallery from './components/NftGallery.jsx';

const SAMPLE_NFTS = [
  { id: 1, name: 'Cinacoin Punk #001', collection: 'Cinacoin Punks', price: '0.5', image: '🎭' },
  { id: 2, name: 'Cinacoin Punk #042', collection: 'Cinacoin Punks', price: '1.2', image: '🎨' },
  { id: 3, name: 'Meta Ape #107', collection: 'Meta Apes', price: '0.8', image: '🦍' },
  { id: 4, name: 'Meta Ape #256', collection: 'Meta Apes', price: '2.0', image: '🐵' },
  { id: 5, name: 'Pixel World #33', collection: 'Pixel Worlds', price: '0.3', image: '🌍' },
  { id: 6, name: 'Pixel World #99', collection: 'Pixel Worlds', price: '0.7', image: '🏔️' },
];

export default function App() {
  const { isConnected } = useAccount();
  const [view, setView] = useState('market');

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #222' }}>
        <h1 style={{ margin: 0 }}>🖼️ Cinacoin NFT</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['market', 'my-nfts'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ background: view === v ? '#f59e0b' : '#1a1a2e', border: 'none', borderRadius: '6px', color: 'white', padding: '0.5rem 1rem', cursor: 'pointer' }}>
              {v === 'market' ? '🛒 Market' : '🎒 My NFTs'}
            </button>
          ))}
          <ConnectButton />
        </div>
      </header>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <NftGallery nfts={SAMPLE_NFTS} view={view} isConnected={isConnected} />
      </main>
    </div>
  );
}
`,
      },
      {
        path: 'src/components/NftGallery.jsx',
        content: `export default function NftGallery({ nfts, view, isConnected }) {
  if (!isConnected) {
    return <p style={{ textAlign: 'center', color: '#888', padding: '3rem' }}>Connect wallet to browse NFTs</p>;
  }

  const displayNfts = view === 'my-nfts' ? nfts.slice(0, 2) : nfts;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>{view === 'market' ? 'Browse NFTs' : 'My Collection'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {displayNfts.map(nft => (
          <div key={nft.id} style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', background: '#0d0d1a' }}>
              {nft.image}
            </div>
            <div style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.25rem' }}>{nft.name}</h4>
              <p style={{ color: '#888', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>{nft.collection}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--weight-semibold)' }}>{nft.price} ETH</span>
                {view === 'market' && (
                  <button style={{ background: '#f59e0b', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', color: 'black', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
                    Buy
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Cinacoin NFT</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.ts"></script></body>
</html>
`,
      },
    ],
    dependencies: {
      '@cinacoin/core-sdk': '^0.1.0',
      '@cinacoin/react': '^0.1.0',
      '@cinacoin/ui': '^0.1.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      vite: '^6.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.7.0',
    },
    readme: `# Cinacoin NFT Template

NFT marketplace with browsing, listing, and collection management.

## Features

- NFT gallery grid layout
- Market browsing and "My NFTs" views
- Buy button integration
- Multi-chain NFT support

## Quick Start

\`\`\`bash
pnpm install && pnpm dev
\`\`\`
`,
  },

  game: {
    name: 'game',
    description: 'GameFi template with session keys and on-chain game state',
    files: [
      {
        path: 'src/cinacoin.config.ts',
        content: `import type { CinacoinConfig } from '@cinacoin/core-sdk';

export const config: CinacoinConfig = {
  chains: [
    { id: 42161, name: 'Arbitrum', rpcUrl: 'https://arb1.arbitrum.io/rpc', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { id: 137, name: 'Polygon', rpcUrl: 'https://polygon-rpc.com', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
  ],
  theme: { mode: 'dark', accentColor: '#8b5cf6' },
  metadata: { name: 'Cinacoin GameFi', description: 'On-chain gaming with session keys', url: 'https://example.com' },
  sessionKeys: {
    enabled: true,
    ttl: 3600,
  },
};
`,
      },
      {
        path: 'src/main.ts',
        content: `import { CinacoinProvider } from '@cinacoin/react';
import { createRoot } from 'react-dom/client';
import { config } from './cinacoin.config.js';
import App from './App.jsx';

createRoot(document.getElementById('root')!).render(
  <CinacoinProvider config={config}>
    <App />
  </CinacoinProvider>
);
`,
      },
      {
        path: 'src/App.jsx',
        content: `import { useState } from 'react';
import { ConnectButton, useAccount } from '@cinacoin/react';
import GameBoard from './components/GameBoard.jsx';
import SessionKeyManager from './components/SessionKeyManager.jsx';
import { logger } from '@cinacoin/logger';

export default function App() {
  const { isConnected, address } = useAccount();
  const [screen, setScreen] = useState('menu');
  const [hasSessionKey, setHasSessionKey] = useState(false);

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a1a', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎮 Cinacoin GameFi</h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>On-chain gaming with session keys</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #222' }}>
        <h2 style={{ margin: 0 }}>🎮 GameFi</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {screen !== 'menu' && <button onClick={() => setScreen('menu')} style={{ background: '#333', border: 'none', color: 'white', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Menu</button>}
          <ConnectButton />
        </div>
      </header>

      {screen === 'menu' && (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 2rem' }}>
          <h3>Welcome, {address?.slice(0, 8)}...</h3>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={() => setScreen('play')} style={{ background: '#8b5cf6', border: 'none', borderRadius: '12px', padding: '1.5rem', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>
              🎯 Play Game
            </button>
            <button onClick={() => setScreen('sessions')} style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '12px', padding: '1.5rem', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>
              🔑 Session Keys {hasSessionKey ? '✓' : ''}
            </button>
          </div>
        </div>
      )}

      {screen === 'play' && <GameBoard />}
      {screen === 'sessions' && <SessionKeyManager onReady={() => setHasSessionKey(true)} />}
    </div>
  );
}
`,
      },
      {
        path: 'src/components/GameBoard.jsx',
        content: `import { useState } from 'react';

export default function GameBoard() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const winner = checkWinner(board);

  const handleClick = (index) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = isX ? 'X' : 'O';
    setBoard(newBoard);
    setIsX(!isX);
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '0 2rem' }}>
      <h3 style={{ textAlign: 'center' }}>Tic-Tac-Toe (On-Chain)</h3>
      {winner && <p style={{ textAlign: 'center', color: '#8b5cf6', fontSize: '1.5rem' }}>🏆 {winner} wins!</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', maxWidth: '300px', margin: '1rem auto' }}>
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)}
            style={{ width: '100%', aspectRatio: '1', background: cell ? '#1a1a2e' : '#0d0d1a', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '2rem', cursor: cell || winner ? 'default' : 'pointer' }}>
            {cell}
          </button>
        ))}
      </div>
      <button onClick={reset} style={{ display: 'block', margin: '1rem auto', background: '#333', border: 'none', color: 'white', borderRadius: '8px', padding: '0.5rem 2rem', cursor: 'pointer' }}>
        New Game (sign tx)
      </button>
    </div>
  );
}

function checkWinner(board) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}
`,
      },
      {
        path: 'src/components/SessionKeyManager.jsx',
        content: `import { useState } from 'react';

export default function SessionKeyManager({ onReady }) {
  const [status, setStatus] = useState('idle');
  const [sessionKey, setSessionKey] = useState('');

  const createSession = async () => {
    setStatus('creating');
    // Simulated session key creation
    await new Promise(r => setTimeout(r, 1500));
    const keyBytes = new Uint8Array(20);
    crypto.getRandomValues(keyBytes);
    const key = '0x' + Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setSessionKey(key);
    setStatus('active');
    onReady?.();
  };

  const revokeSession = () => {
    setSessionKey('');
    setStatus('idle');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 2rem' }}>
      <h3>Session Keys</h3>
      <p style={{ color: '#888' }}>Session keys enable gasless, signature-free transactions for a limited time.</p>

      {status === 'idle' && (
        <button onClick={createSession}
          style={{ background: '#8b5cf6', border: 'none', borderRadius: '8px', padding: '0.75rem 2rem', color: 'white', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', marginTop: '1rem' }}>
          Create Session Key
        </button>
      )}

      {status === 'creating' && <p style={{ color: '#8b5cf6', marginTop: '1rem' }}>⏳ Creating session key...</p>}

      {status === 'active' && (
        <div style={{ marginTop: '1rem', background: '#1a1a2e', borderRadius: '12px', padding: '1.5rem' }}>
          <p style={{ color: '#22c55e', fontWeight: 'var(--weight-semibold)' }}>✓ Session Key Active</p>
          <code style={{ display: 'block', background: '#0d0d1a', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.8rem', wordBreak: 'break-all' }}>
            {sessionKey}
          </code>
          <button onClick={revokeSession}
            style={{ marginTop: '1rem', background: '#ef4444', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', color: 'white', cursor: 'pointer' }}>
            Revoke
          </button>
        </div>
      )}
    </div>
  );
}
`,
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Cinacoin GameFi</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.ts"></script></body>
</html>
`,
      },
    ],
    dependencies: {
      '@cinacoin/core-sdk': '^0.1.0',
      '@cinacoin/react': '^0.1.0',
      '@cinacoin/ui': '^0.1.0',
      '@cinacoin/session-keys': '^0.1.0',
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      vite: '^6.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.7.0',
    },
    readme: `# Cinacoin GameFi Template

On-chain gaming template with session keys for gasless transactions.

## Features

- Game menu with play/session screens
- Tic-tac-toe demo game (on-chain state)
- Session key creation and revocation
- Session key UI for signature-free gameplay

## Quick Start

\`\`\`bash
pnpm install && pnpm dev
\`\`\`
`,
  },
};

// ============================================================
// template command
// ============================================================

export function templateCommand(cli: Command): void {
  cli
    .command('template')
    .alias('tpl')
    .description('Download a Cinacoin project template')
    .argument('<name>', 'Template name (minimal/wallet/defi/nft/game)')
    .option('--list', 'List all available templates')
    .option('--force', 'Overwrite existing files')
    .action(async (name: string, opts: { list?: boolean; force?: boolean }) => {
      if (opts.list) {
        header('Available Templates');
        for (const [key, tpl] of Object.entries(TEMPLATES)) {
          logger.info(`  ${key.padEnd(12)} ${tpl.description}`);
        }
        logger.info();
        return;
      }

      const def = TEMPLATES[name];
      if (!def) {
        error(`Unknown template '${name}'. Run 'cinacoin template --list' to see available templates.`);
        process.exit(1);
      }

      const cwd = process.cwd();
      const s = spinner(`Downloading '${def.name}' template...`);

      try {
        // Check for existing package.json (would overwrite)
        if (existsSync(join(cwd, 'package.json')) && !opts.force) {
          s.warn('package.json already exists. Use --force to overwrite.');
          process.exit(1);
        }

        // Create directories
        const dirs = new Set<string>();
        for (const file of def.files) {
          const dir = join(cwd, file.path.split('/').slice(0, -1).join('/'));
          if (dir !== cwd) dirs.add(dir);
        }
        for (const dir of dirs) {
          mkdirSync(dir, { recursive: true });
        }

        // Write files
        for (const file of def.files) {
          writeFileSync(join(cwd, file.path), file.content);
        }

        // Generate/update package.json
        const pkgPath = join(cwd, 'package.json');
        let pkg: Record<string, unknown> = {};
        if (existsSync(pkgPath)) {
          pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        }
        pkg.name = pkg.name || 'cinacoin-' + def.name;
        pkg.version = '0.1.0';
        pkg.private = true;
        pkg.type = 'module';
        pkg.scripts = pkg.scripts || {};
        (pkg.scripts as Record<string, string>).dev = 'vite';
        (pkg.scripts as Record<string, string>).build = 'vite build';
        (pkg.scripts as Record<string, string>).preview = 'vite preview';
        (pkg.dependencies as Record<string, string>) = { ...((pkg.dependencies as Record<string, string>) || {}), ...def.dependencies };
        (pkg.devDependencies as Record<string, string>) = { ...((pkg.devDependencies as Record<string, string>) || {}), ...def.devDependencies };
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

        // Write README
        writeFileSync(join(cwd, 'README.md'), def.readme);

        s.succeed(`Template '${def.name}' downloaded successfully!`);

        header('Next Steps');
        logger.info('    pnpm install');
        logger.info('    pnpm dev');
        logger.info();
        info(`Template: ${def.description}`);
        logger.info();

      } catch (err) {
        s.fail(`Failed to download template: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}

// ============================================================
// Export template definitions for programmatic access
// ============================================================

export function getTemplateNames(): string[] {
  return Object.keys(TEMPLATES);
}

export function getTemplate(name: string): TemplateDef | undefined {
  return TEMPLATES[name];
}
