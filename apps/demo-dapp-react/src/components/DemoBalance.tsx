'use client';

import { useBalance, useCinacoinContext } from '@cinacoin/react';
import React, { useEffect, useState } from 'react';

/** DemoBalance — display connected account balance with auto-refresh. */
export function DemoBalance(): JSX.Element {
  const { account, status } = useCinacoinContext();
  const { balance, isLoading, error, refetch } = useBalance();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const handleRefresh = () => {
    void refetch().then(() => {
      setLastRefresh(new Date().toLocaleTimeString());
    });
  };

  useEffect(() => {
    setLastRefresh(new Date().toLocaleTimeString());
  }, [account.address]);

  const symbol = account.chainSymbol ?? 'ETH';

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="balance-heading">
        <p className="cc-eyebrow">Wallet.</p>
        <h3 id="balance-heading" className="cc-section-title">
          <svg
            className="cc-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
            <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
          </svg>
          Balance.
        </h3>
        <p className="cc-section-desc">Connect a wallet to view your balance.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="balance-heading">
      <p className="cc-eyebrow">Wallet.</p>
      <h3 id="balance-heading" className="cc-section-title">
        <svg
          className="cc-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
          <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
        </svg>
        Balance.
      </h3>
      <p className="cc-section-desc">Real-time native token balance for the connected account.</p>

      {/* Balance display */}
      <div
        className="cc-balance-card"
        role="status"
        aria-live="polite"
        aria-label={`${symbol} balance.`}
      >
        <div className="cc-balance-label">{symbol} Balance.</div>
        <div className="cc-balance-amount">
          {isLoading ? (
            <span className="cc-balance-loading">
              <span className="cc-spinner" /> Loading...
            </span>
          ) : error ? (
            <span className="cc-balance-error">Failed to fetch.</span>
          ) : balance ? (
            <>
              {balance} <span className="cc-balance-symbol">{symbol}</span>
            </>
          ) : (
            <span className="cc-balance-empty">—</span>
          )}
        </div>
      </div>

      {/* Address */}
      <p className="cc-address-mono">{account.address}</p>

      {/* Refresh */}
      <div className="cc-refresh-row">
        <button
          className="cc-btn cc-btn--ghost"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label="Refresh balance."
        >
          {isLoading ? (
            <span className="cc-balance-loading">
              <span className="cc-spinner" /> Refreshing...
            </span>
          ) : (
            '↻ Refresh.'
          )}
        </button>
        {lastRefresh && <span className="cc-refresh-meta">Last refreshed: {lastRefresh}.</span>}
      </div>

      {/* Auto-refresh notice */}
      <p className="cc-auto-refresh-note">Auto-refreshes when account or chain changes.</p>
    </section>
  );
}
