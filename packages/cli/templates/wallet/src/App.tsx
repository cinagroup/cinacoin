import React, { useState } from 'react';
import { ConnectButton, useAccount, useBalance, useChainId, useDisconnect } from '@cinacoin/react';

export default function App() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0a0a1a',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: 'white', marginBottom: '2rem' }}>🔢 Cinacoin Wallet</h1>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      background: '#0a0a1a',
      minHeight: '100vh',
      color: 'white',
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <h1 style={{ margin: 0 }}>🔢 Cinacoin Wallet</h1>
        <ConnectButton />
      </header>

      <div style={{
        background: '#1a1a2e',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center',
      }}>
        <p style={{ color: '#888', margin: '0 0 0.5rem' }}>Balance</p>
        <h2 style={{ margin: 0, fontSize: '2.5rem' }}>
          {balance?.formatted || '0.0000'} {balance?.symbol || 'ETH'}
        </h2>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <code style={{
            background: '#0d0d1a',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
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
        <p style={{ color: '#666', margin: '1rem 0 0', fontSize: '0.9rem' }}>
          Chain ID: {chainId}
        </p>
      </div>

      <button
        onClick={() => disconnect()}
        style={{
          background: '#ef4444',
          border: 'none',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'var(--weight-semibold)',
          width: '100%',
        }}
      >
        Disconnect
      </button>
    </div>
  );
}
