'use client';

import React from 'react';
import type { CinacoinConfig } from '@cinacoin/react';
import { CinacoinProvider } from '@cinacoin/react';

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID ?? 'demo_project_id';

const config: CinacoinConfig = {
  projectId,
  metadata: {
    name: 'CinaCoin Demo dApp',
    description: 'A comprehensive demo showcasing the full CinaCoin SDK.',
    url: 'https://cinacoin.dev',
    icons: ['https://cinacoin.dev/icon.png'],
  },
  chains: [
    {
      id: 11155111,
      name: 'Sepolia',
      rpcUrl: 'https://rpc.sepolia.org',
      nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://sepolia.etherscan.io',
      testnet: true,
    },
    {
      id: 80002,
      name: 'Amoy',
      rpcUrl: 'https://rpc-amoy.polygon.technology',
      nativeCurrency: { name: 'Polygon MATIC', symbol: 'MATIC', decimals: 18 },
      blockExplorerUrl: 'https://amoy.polygonscan.com',
      testnet: true,
    },
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: 'https://cloudflare-eth.com',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://etherscan.io',
    },
  ],
  theme: {
    mode: 'dark',
  },
};

class ProviderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CinacoinClientProvider] runtime error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            margin: '2rem auto',
            maxWidth: '600px',
            border: '1px solid var(--cc-hairline, #eaeaea)',
            borderRadius: '12px',
            background: 'var(--cc-canvas, #fff)',
            color: 'var(--cc-ink, #111)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
            CinaCoin SDK unavailable
          </h2>
          <p style={{ margin: '0 0 1rem', color: 'var(--cc-muted, #666)' }}>
            The demo provider failed to initialize. The static demo UI below is still viewable.
          </p>
          <pre
            style={{
              padding: '0.75rem',
              background: 'var(--cc-canvas-soft, #f5f5f5)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              overflow: 'auto',
            }}
          >
            {this.state.error?.message ?? 'Unknown error'}
          </pre>
          <div style={{ marginTop: '1rem' }}>{this.props.children}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CinacoinClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProviderErrorBoundary>
      <CinacoinProvider config={config}>{children}</CinacoinProvider>
    </ProviderErrorBoundary>
  );
}
