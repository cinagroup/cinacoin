'use client';

import { useCinacoinContext } from '@cinacoin/react';
import { Terminal } from 'lucide-react';
import React from 'react';

import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

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
    <header className="demo-header" role="banner">
      <div className="demo-header__brand">
        <h1 className="demo-header__title">
          <Terminal className="demo-header__icon" aria-hidden="true" />
          <span className="demo-header__accent">Cinacoin</span>
          <span className="demo-header__subtitle">Demo.</span>
        </h1>
        <span className="cc-badge cc-badge--accent" aria-label="SDK version 0.2">
          SDK v0.2
        </span>
      </div>

      <nav className="demo-header__nav" aria-label="Connection status">
        <ThemeToggle />
        <LanguageToggle />

        {status === 'connected' && account.address && (
          <div className="demo-header__address">
            <span
              className="demo-header__status-dot"
              style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
              aria-hidden="true"
            />
            {truncateAddress(account.address)}
          </div>
        )}

        <div
          className="demo-header__status"
          role="status"
          aria-live="polite"
          aria-label={`Connection status: ${status}`}
        >
          <span
            className="demo-header__status-dot"
            style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
            aria-hidden="true"
          />
          <span className="demo-header__status-text">{status}</span>
        </div>
      </nav>
    </header>
  );
}
