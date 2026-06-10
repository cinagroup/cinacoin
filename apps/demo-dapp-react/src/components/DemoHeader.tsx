'use client';

import React from 'react';
import { useCinacoinContext } from '@cinacoin/react';
import { ThemeToggle } from './ThemeToggle';

/** Truncate an Ethereum address for display. */
function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const STATUS_COLORS: Record<string, string> = {
  disconnected: 'var(--cc-status-disconnected)',
  connecting: 'var(--cc-status-connecting)',
  connected: 'var(--cc-status-connected)',
  error: 'var(--cc-status-error)',
};

/** DemoHeader — App header with Cinacoin branding and connection status. */
export function DemoHeader(): JSX.Element {
  const { account, status } = useCinacoinContext();
  const dotColor = STATUS_COLORS[status] ?? 'var(--cc-status-default)';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--cc-space-sm) var(--cc-space-lg)',
        background: 'var(--cc-canvas-soft)',
        borderBottom: '1px solid var(--cc-hairline)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        minHeight: 'var(--cc-touch-target)',
        gap: 'var(--cc-space-sm)',
        flexWrap: 'wrap',
      }}
      role="banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cc-space-xs)', flexWrap: 'wrap' }}>
        <h1
          style={{
            fontSize: 'var(--cc-text-lg)',
            fontWeight: 'var(--cc-weight-semibold)',
            letterSpacing: 'var(--cc-tracking-tight)',
            margin: 0,
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <span style={{ color: 'var(--cc-accent)' }}>Cinacoin</span>
          <span style={{ color: 'var(--cc-body)', fontWeight: 'var(--cc-weight-normal)' }}>Demo</span>
        </h1>
        <span className="cc-badge cc-badge--accent" aria-label="SDK version 0.2">
          SDK v0.2
        </span>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--cc-space-md)', flexWrap: 'wrap' }} aria-label="Connection status">
        <ThemeToggle />
        
        {status === 'connected' && account.address && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--cc-space-xs)',
              background: 'var(--cc-surface)',
              padding: '8px var(--cc-space-sm)',
              borderRadius: 'var(--cc-radius-md)',
              fontSize: 'var(--cc-text-xs)',
              fontFamily: 'var(--cc-font-mono)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: dotColor,
                boxShadow: `0 0 6px ${dotColor}`,
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            {truncateAddress(account.address)}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 'var(--cc-text-xs)',
            fontWeight: 'var(--cc-weight-medium)',
          }}
          role="status"
          aria-live="polite"
          aria-label={`Connection status: ${status}`}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: dotColor,
              boxShadow: `0 0 6px ${dotColor}`,
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          <span style={{ color: 'var(--cc-body)', textTransform: 'capitalize' }}>{status}</span>
        </div>
      </nav>
    </header>
  );
}
