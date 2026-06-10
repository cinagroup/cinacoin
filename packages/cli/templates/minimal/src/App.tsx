import React from 'react';
import { ConnectButton, useAccount } from '@cinacoin/react';

export default function App() {
  const { address, isConnected } = useAccount();

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🔢 Cinacoin Minimal</h1>
        <ConnectButton />
      </header>

      {isConnected ? (
        <main>
          <p style={{ color: '#666' }}>Connected as:</p>
          <code style={{
            display: 'block',
            background: '#f5f5f5',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
          }}>
            {address}
          </code>
        </main>
      ) : (
        <p style={{ textAlign: 'center', color: '#888', marginTop: '4rem' }}>
          Connect your wallet to get started
        </p>
      )}
    </div>
  );
}
