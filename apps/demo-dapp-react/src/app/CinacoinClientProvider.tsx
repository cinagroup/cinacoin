'use client';

import React, { useEffect, useState, type ReactNode } from 'react';

/**
 * Lazy CinacoinProvider loader.
 * - Waits until client-side hydration completes before importing the SDK.
 * - If SDK fails to load, renders a static fallback with children.
 */
export default function CinacoinClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      import('@cinacoin/react')
        .then(() => setStatus('ready'))
        .catch(() => {
          console.warn('[CinacoinProvider] SDK unavailable — static demo mode');
          setStatus('failed');
        });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--cc-muted)' }}>Loading…</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div style={{ padding: '10px 20px', background: 'var(--cc-warning-bg)', color: 'var(--cc-warning)', fontSize: '13px', borderBottom: '1px solid var(--cc-warning)', textAlign: 'center' }}>
          ⚠️ CinaCoin SDK unavailable — running in static demo mode
        </div>
        {children}
      </div>
    );
  }

  // SDK loaded — wrap with provider
  return <SdkProvider>{children}</SdkProvider>;
}

function SdkProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<any>(null);

  useEffect(() => {
    import('@cinacoin/react').then((mod) => {
      setProvider(() => mod.CinacoinProvider);
    });
  }, []);

  if (!Provider) return null;

  return (
    <Provider
      config={{
        projectId: 'demo_project_id',
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
        theme: { mode: 'dark' as const },
      }}
    >
      {children}
    </Provider>
  );
}
