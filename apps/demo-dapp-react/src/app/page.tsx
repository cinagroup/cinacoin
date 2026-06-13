'use client';

import React from 'react';

export default function Home(): JSX.Element {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#171717', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 14 }}>C</div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: -0.3 }}>CinaCoin SDK Demo</span>
        </div>
        <a href="https://docs.cinacoin.com" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none' }}>Docs ↗</a>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 60px', textAlign: 'center', background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)' }}>
        <div style={{
          padding: '8px 16px',
          background: '#f0f0ff',
          borderRadius: 999,
          fontSize: 13,
          color: '#6366f1',
          fontWeight: 500,
          marginBottom: 24,
        }}>
          CinaCoin React SDK
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.2, margin: '0 0 16px', color: '#171717' }}>
          Multi-chain wallet toolkit.
        </h1>

        <p style={{ fontSize: 17, color: '#525252', maxWidth: 540, lineHeight: 1.6, margin: '0 0 40px' }}>
          The CinaCoin SDK provides a unified interface for wallet connections, transaction signing, chain switching, batch operations, and NFT management across 16+ blockchains.
        </p>

        {/* SDK Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          maxWidth: 900,
          width: '100%',
          textAlign: 'left',
          marginBottom: 48,
        }}>
          {[
            { title: 'Connect Wallet', desc: 'MetaMask, WalletConnect, Coinbase, Rabby, and email-based auth.', icon: '🔗' },
            { title: 'Multi-chain', desc: 'EVM, Solana, Sui, TON, Cosmos, Polkadot, Hedera, NEAR, XRPL adapters.', icon: '⛓️' },
            { title: 'Sign & Send', desc: 'Message signing, transaction building, gas estimation, and batch sends.', icon: '✍️' },
            { title: 'EIP-5792', desc: 'Atomic batch transactions, capabilities detection, and status polling.', icon: '📦' },
            { title: 'NFT Gallery', desc: 'Display and manage NFTs with metadata resolution and image caching.', icon: '🖼️' },
            { title: 'Chain Switcher', desc: 'Seamless network switching with automatic balance refresh.', icon: '🔄' },
            { title: 'Balance API', desc: 'Native and token balance queries with formatted display.', icon: '💰' },
            { title: 'SSR Compatible', desc: 'Server-side rendering support with hydration-safe provider.', icon: '⚡' },
          ].map((f) => (
            <div key={f.title} style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#fff',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: '#171717' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#737373', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Code Example */}
        <div style={{
          maxWidth: 700,
          width: '100%',
          background: '#1a1a2e',
          borderRadius: 12,
          padding: 24,
          textAlign: 'left',
          marginBottom: 40,
        }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12, fontFamily: 'monospace' }}>Quick Start</div>
          <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e2e8f0', fontFamily: "'Geist Mono', 'Fira Code', monospace", overflow: 'auto' }}>
{`import { CinacoinProvider, ConnectButton } from '@cinacoin/react'

function App() {
  return (
    <CinacoinProvider config={config}>
      <ConnectButton label="Connect Wallet" />
    </CinacoinProvider>
  )
}`}
          </pre>
        </div>

        {/* Installation */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <code style={{ padding: '10px 20px', background: '#f5f5f5', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', color: '#333' }}>
            npm install @cinacoin/react @cinacoin/core-sdk
          </code>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        fontSize: 13,
        color: '#999',
      }}>
        CinaCoin SDK v0.2 — Self-hosted wallet connection toolkit.{' '}
        <a href="https://github.com/cinagroup/cinacoin" style={{ color: '#6366f1', textDecoration: 'none' }}>GitHub</a>
      </footer>
    </div>
  );
}
