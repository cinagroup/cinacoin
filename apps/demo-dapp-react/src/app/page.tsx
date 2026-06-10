'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import all SDK-dependent components to avoid SSR issues
// (@cinacoin/react accesses `window` at module level)
const DemoHeader = dynamic(
  () => import('@/components/DemoHeader').then((m) => ({ default: m.DemoHeader })),
  { ssr: false, loading: () => <div style={{ height: '64px' }} /> }
);
const DemoConnectSection = dynamic(
  () => import('@/components/DemoConnectSection').then((m) => ({ default: m.DemoConnectSection })),
  { ssr: false, loading: () => <SkeletonCard /> }
);
const DemoChainSwitcher = dynamic(
  () => import('@/components/DemoChainSwitcher').then((m) => ({ default: m.DemoChainSwitcher })),
  { ssr: false, loading: () => <SkeletonCard /> }
);
const DemoBalance = dynamic(
  () => import('@/components/DemoBalance').then((m) => ({ default: m.DemoBalance })),
  { ssr: false, loading: () => <SkeletonCard /> }
);
const DemoSignMessage = dynamic(
  () => import('@/components/DemoSignMessage').then((m) => ({ default: m.DemoSignMessage })),
  { ssr: false, loading: () => <SkeletonCard /> }
);
const DemoSendTransaction = dynamic(
  () => import('@/components/DemoSendTransaction').then((m) => ({ default: m.DemoSendTransaction })),
  { ssr: false, loading: () => <SkeletonCard /> }
);
const DemoBatchTransactions = dynamic(
  () => import('@/components/DemoBatchTransactions').then((m) => ({ default: m.DemoBatchTransactions })),
  { ssr: false, loading: () => <SkeletonCard /> }
);
const DemoNFTGallery = dynamic(
  () => import('@/components/DemoNFTGallery').then((m) => ({ default: m.DemoNFTGallery })),
  { ssr: false, loading: () => <SkeletonCard /> }
);

function SkeletonCard() {
  return (
    <div
      style={{
        minHeight: '200px',
        background: 'var(--cc-surface)',
        border: '1px solid var(--cc-hairline)',
        borderRadius: 'var(--cc-radius-lg)',
        padding: 'var(--cc-space-lg)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

export default function Home(): JSX.Element {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DemoHeader />

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--cc-space-xl) var(--cc-space-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--cc-space-lg)',
          width: '100%',
        }}
      >
        {/* Hero */}
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--cc-space-2xl) var(--cc-space-lg)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.08) 50%, rgba(236,72,153,0.05) 100%)',
            borderRadius: 'var(--cc-radius-xl)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 'var(--cc-weight-semibold)',
              margin: '0 0 var(--cc-space-sm) 0',
              letterSpacing: 'var(--cc-tracking-tight)',
              lineHeight: 'var(--cc-leading-tight)',
            }}
          >
            <span style={{ color: 'var(--cc-accent)' }}>Cinacoin</span>{' '}
            <span style={{ color: 'var(--cc-ink)' }}>SDK Demo</span>
          </h2>
          <p
            style={{
              fontSize: 'var(--cc-text-md)',
              color: 'var(--cc-body)',
              margin: '0 0 var(--cc-space-xs) 0',
              maxWidth: '600px',
              marginInline: 'auto',
            }}
          >
            A comprehensive demo showcasing the full Cinacoin SDK — connect, sign, send, batch, and display NFTs.
          </p>
          <p style={{ fontSize: 'var(--cc-text-[12px])', color: 'var(--cc-muted)' }}>
            8 components · Full wallet lifecycle · EIP-5792 support
          </p>
        </div>

        {/* Row 1: Connect + Chain */}
        <div style={gridStyle}>
          <DemoConnectSection />
          <DemoChainSwitcher />
        </div>

        {/* Row 2: Balance + Sign */}
        <div style={gridStyle}>
          <DemoBalance />
          <DemoSignMessage />
        </div>

        {/* Row 3: Send + Batch */}
        <div style={gridStyle}>
          <DemoSendTransaction />
          <DemoBatchTransactions />
        </div>

        {/* Row 4: NFT Gallery (full width) */}
        <DemoNFTGallery />

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: 'var(--cc-space-lg)',
            color: 'var(--cc-muted)',
            fontSize: 'var(--cc-text-[12px])',
            borderTop: '1px solid var(--cc-hairline)',
            marginTop: 'var(--cc-space-xs)',
          }}
        >
          Cinacoin SDK v0.2 · Self-hosted wallet connection toolkit ·{' '}
          <a
            href="https://github.com/cinagroup/Cinacoin"
            style={{ color: 'var(--cc-accent-soft)', textDecoration: 'none' }}
          >
            GitHub
          </a>
        </footer>
      </main>

      {/* Global keyframe for skeleton animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 'var(--cc-space-lg)',
};
