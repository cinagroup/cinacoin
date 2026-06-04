'use client';

import React, { useEffect, useState } from 'react';
import { useBalance, useCinaCoinContext } from '@cinacoin/react';

/** DemoBalance — display connected account balance with auto-refresh. */
export function DemoBalance(): JSX.Element {
  const { account, status } = useCinaCoinContext();
  const { balance, isLoading, error, refetch } = useBalance();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    setLastRefresh(new Date().toLocaleTimeString());
  }, [account.address]);

  if (status !== 'connected') {
    return (
      <section style={sectionStyle}>
        <h3 style={titleStyle}>
          <span style={iconStyle}>💰</span> Balance
        </h3>
        <p style={descStyle}>Connect a wallet to view your balance.</p>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>
        <span style={iconStyle}>💰</span> Balance
      </h3>
      <p style={descStyle}>
        Real-time native token balance for the connected account.
      </p>

      {/* Balance display */}
      <div style={balanceCardStyle}>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
          {account.chainSymbol ?? 'ETH'} Balance
        </div>
        <div style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-1px' }}>
          {isLoading ? (
            <span style={{ color: '#64748b' }}>...</span>
          ) : error ? (
            <span style={{ color: '#f87171', fontSize: '16px' }}>Failed to fetch</span>
          ) : balance ? (
            <>
              {balance}{' '}
              <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 400 }}>
                {account.chainSymbol ?? 'ETH'}
              </span>
            </>
          ) : (
            <span style={{ color: '#64748b' }}>—</span>
          )}
        </div>
      </div>

      {/* Address */}
      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b', marginTop: '8px' }}>
        {account.address}
      </div>

      {/* Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <button style={btnStyle} onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : '↻ Refresh'}
        </button>
        {lastRefresh && (
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Last refreshed: {lastRefresh}
          </span>
        )}
      </div>

      {/* Auto-refresh notice */}
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
        Auto-refreshes when account or chain changes.
      </div>
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  margin: '0 0 8px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const iconStyle: React.CSSProperties = { fontSize: '20px' };

const descStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#94a3b8',
  margin: '0 0 20px 0',
};

const balanceCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.02) 100%)',
  border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center',
};

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};
