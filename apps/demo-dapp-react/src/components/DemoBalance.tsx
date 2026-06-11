'use client';

import React, { useEffect, useState } from 'react';
import { useBalance, useCinacoinContext } from '@cinacoin/react';
import { Wallet } from 'lucide-react';

/** DemoBalance — display connected account balance with auto-refresh. */
export function DemoBalance(): JSX.Element {
  const { account, status } = useCinacoinContext();
  const { balance, isLoading, error, refetch } = useBalance();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    setLastRefresh(new Date().toLocaleTimeString());
  }, [account.address]);

  const symbol = account.chainSymbol ?? 'ETH';

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="balance-heading">
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">WALLET</p>
        <h3 id="balance-heading" className="cc-section-title">
          <Wallet className="w-5 h-5" /> Balance
        </h3>
        <p className="cc-section-desc">Connect a wallet to view your balance.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="balance-heading">
      <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">WALLET</p>
      <h3 id="balance-heading" className="cc-section-title">
        <Wallet className="w-5 h-5" /> Balance
      </h3>
      <p className="cc-section-desc">
        Real-time native token balance for the connected account.
      </p>

      {/* Balance display */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--cc-balance-gradient-1) 0%, var(--cc-balance-gradient-2) 100%)',
          border: '1px solid var(--cc-balance-border)',
          borderRadius: 'var(--cc-radius-lg)',
          padding: 'var(--cc-space-lg)',
          textAlign: 'center',
        }}
        role="status"
        aria-live="polite"
        aria-label={`${symbol} balance`}
      >
        <div style={{ fontSize: 'var(--cc-text-xs)', color: 'var(--cc-body)', marginBottom: 'var(--cc-space-xxs)' }}>
          {symbol} Balance
        </div>
        <div
          style={{
            fontSize: 'var(--cc-text-2xl)',
            fontWeight: 'var(--cc-weight-semibold)',
            letterSpacing: 'var(--cc-tracking-tight)',
            color: 'var(--cc-ink)',
            lineHeight: 'var(--cc-leading-tight)',
          }}
        >
          {isLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--cc-space-xs)', color: 'var(--cc-muted)' }}>
              <span className="cc-spinner" /> Loading
            </span>
          ) : error ? (
            <span style={{ color: 'var(--cc-error)', fontSize: 'var(--cc-text-md)', fontWeight: 'var(--cc-weight-normal)' }}>Failed to fetch</span>
          ) : balance ? (
            <>
              {balance}{' '}
              <span style={{ fontSize: 'var(--cc-text-lg)', color: 'var(--cc-body)', fontWeight: 'var(--cc-weight-normal)' }}>
                {symbol}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--cc-muted)' }}>—</span>
          )}
        </div>
      </div>

      {/* Address */}
      <p style={{ fontSize: 'var(--cc-text-xs)', fontFamily: 'var(--cc-font-mono)', color: 'var(--cc-muted)', marginTop: 'var(--cc-space-xs)', wordBreak: 'break-all' }}>
        {account.address}
      </p>

      {/* Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cc-space-sm)', marginTop: 'var(--cc-space-md)', flexWrap: 'wrap' }}>
        <button
          className="cc-btn cc-btn--ghost"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label="Refresh balance"
        >
          {isLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--cc-space-xs)' }}>
              <span className="cc-spinner" /> Refreshing
            </span>
          ) : (
            '↻ Refresh'
          )}
        </button>
        {lastRefresh && (
          <span style={{ fontSize: 'var(--cc-text-xs)', color: 'var(--cc-muted)' }}>
            Last refreshed: {lastRefresh}
          </span>
        )}
      </div>

      {/* Auto-refresh notice */}
      <p style={{ marginTop: 'var(--cc-space-sm)', fontSize: 'var(--cc-text-xs)', color: 'var(--cc-muted)' }}>
        Auto-refreshes when account or chain changes.
      </p>
    </section>
  );
}
