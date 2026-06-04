'use client';

import React from 'react';
import { useCinaCoinContext } from '@cinacoin/react';

/** Truncate an Ethereum address for display. */
function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** DemoHeader — App header with Cinacoin branding and connection status. */
export function DemoHeader(): JSX.Element {
  const { account, status } = useCinaCoinContext();

  const statusColors: Record<string, string> = {
    disconnected: '#f87171',
    connecting: '#facc15',
    connected: '#34d399',
    error: '#f87171',
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
          <span style={{ color: '#6366f1' }}>Cinacoin</span>
          <span style={{ color: '#94a3b8', fontWeight: 400 }}> Demo</span>
        </span>
        <span
          style={{
            background: 'rgba(99,102,241,0.15)',
            color: '#818cf8',
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '99px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          SDK v0.2
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {status === 'connected' && account.address && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: statusColors[status] ?? '#94a3b8',
                boxShadow: `0 0 6px ${statusColors[status] ?? '#94a3b8'}`,
              }}
            />
            {truncateAddress(account.address)}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusColors[status] ?? '#94a3b8',
              boxShadow: `0 0 6px ${statusColors[status] ?? '#94a3b8'}`,
            }}
          />
          <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{status}</span>
        </div>
      </div>
    </header>
  );
}
