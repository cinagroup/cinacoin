'use client';

import React from 'react';
import { DemoHeader } from '@/components/DemoHeader';
import { DemoConnectSection } from '@/components/DemoConnectSection';
import { DemoChainSwitcher } from '@/components/DemoChainSwitcher';
import { DemoBalance } from '@/components/DemoBalance';
import { DemoSignMessage } from '@/components/DemoSignMessage';
import { DemoSendTransaction } from '@/components/DemoSendTransaction';
import { DemoBatchTransactions } from '@/components/DemoBatchTransactions';
import { DemoNFTGallery } from '@/components/DemoNFTGallery';

export default function Home(): JSX.Element {
  return (
    <div style={{ minHeight: '100vh' }}>
      <DemoHeader />

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Hero */}
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-1px' }}>
            <span style={{ color: '#6366f1' }}>Cinacoin</span>{' '}
            <span style={{ color: '#e0e0e0' }}>SDK Demo</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 8px 0', maxWidth: '600px', marginInline: 'auto' }}>
            A comprehensive demo showcasing the full Cinacoin SDK — connect, sign, send, batch, and display NFTs.
          </p>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            8 components · Full wallet lifecycle · EIP-5792 support
          </div>
        </div>

        {/* Row 1: Connect + Chain */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          <DemoConnectSection />
          <DemoChainSwitcher />
        </div>

        {/* Row 2: Balance + Sign */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          <DemoBalance />
          <DemoSignMessage />
        </div>

        {/* Row 3: Send + Batch */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          <DemoSendTransaction />
          <DemoBatchTransactions />
        </div>

        {/* Row 4: NFT Gallery (full width) */}
        <DemoNFTGallery />

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: '24px',
            color: '#64748b',
            fontSize: '12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            marginTop: '16px',
          }}
        >
          Cinacoin SDK v0.2 · Self-hosted wallet connection toolkit ·{' '}
          <a
            href="https://github.com/cinagroup/Cinacoin"
            style={{ color: '#818cf8', textDecoration: 'none' }}
          >
            GitHub
          </a>
        </footer>
      </main>
    </div>
  );
}
