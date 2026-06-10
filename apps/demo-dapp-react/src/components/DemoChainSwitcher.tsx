'use client';

import React from 'react';
import { ChainSwitcher, useSwitchChain, useCinacoinContext } from '@cinacoin/react';

interface ChainInfo {
  id: number;
  name: string;
  symbol: string;
  color: string;
}

const CHAIN_DETAILS: Record<number, ChainInfo> = {
  11155111: { id: 11155111, name: 'Sepolia', symbol: 'ETH', color: '#627eea' },
  80002: { id: 80002, name: 'Amoy (Polygon)', symbol: 'MATIC', color: '#8247e5' },
  1: { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH', color: '#627eea' },
  137: { id: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247e5' },
};

/** DemoChainSwitcher — showcase chain switching and info display. */
export function DemoChainSwitcher(): JSX.Element {
  const { account, config, status } = useCinacoinContext();
  const { switchChain, isSwitching, error } = useSwitchChain();

  const chains = config.chains ?? [];
  const currentChainId = account.chainId;
  const currentInfo = currentChainId != null ? CHAIN_DETAILS[currentChainId] : null;

  const handleSwitch = async (chainId: number) => {
    try {
      await switchChain(chainId);
    } catch {
      // error handled by hook
    }
  };

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="chain-heading">
        <h3 id="chain-heading" className="cc-section-title">
          <span style={{ fontSize: '20px' }} aria-hidden="true">⛓️</span> Chain Switcher
        </h3>
        <p className="cc-section-desc">Connect a wallet to switch between chains.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="chain-heading">
      <h3 id="chain-heading" className="cc-section-title">
        <span style={{ fontSize: '20px' }} aria-hidden="true">⛓️</span> Chain Switcher
      </h3>
      <p className="cc-section-desc">
        Switch between supported networks and view current chain details.
      </p>

      {/* ChainSwitcher Web Component */}
      <div style={{ marginBottom: 'var(--cc-space-lg)' }}>
        <label className="cc-label" id="chain-component-label">ChainSwitcher Component</label>
        <div style={{ marginTop: 'var(--cc-space-xs)' }}>
          <ChainSwitcher />
        </div>
      </div>

      {/* Current chain info */}
      {currentInfo && (
        <div style={{ background: 'var(--cc-surface)', borderRadius: 'var(--cc-radius-md)', padding: 'var(--cc-space-md)', marginTop: 'var(--cc-space-sm)' }} aria-label="Current chain information">
          <div style={infoRowStyle}>
            <span style={{ color: 'var(--cc-body)' }}>Current Chain</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cc-space-xs)' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: currentInfo.color,
                  boxShadow: `0 0 8px ${currentInfo.color}`,
                  display: 'inline-block',
                }}
                aria-hidden="true"
              />
              <span style={{ fontWeight: 'var(--cc-weight-semibold)', color: 'var(--cc-ink)' }}>{currentInfo.name}</span>
            </div>
          </div>
          <div style={infoRowStyle}>
            <span style={{ color: 'var(--cc-body)' }}>Chain ID</span>
            <span style={monoStyle}>{currentChainId}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={{ color: 'var(--cc-body)' }}>Native Currency</span>
            <span style={{ color: 'var(--cc-ink-soft)' }}>{currentInfo.symbol}</span>
          </div>
          <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
            <span style={{ color: 'var(--cc-body)' }}>Hex ID</span>
            <span style={monoStyle}>0x{(currentChainId ?? 0).toString(16)}</span>
          </div>
        </div>
      )}

      {/* Quick switch buttons */}
      <div style={{ marginTop: 'var(--cc-space-md)' }}>
        <label className="cc-label" id="chain-switch-label">Quick Switch</label>
        <div style={{ display: 'flex', gap: 'var(--cc-space-xs)', marginTop: 'var(--cc-space-xs)', flexWrap: 'wrap' }} role="group" aria-labelledby="chain-switch-label">
          {chains.map((chain) => {
            const isCurrent = chain.id === currentChainId;
            return (
              <button
                key={chain.id}
                className={`cc-btn ${isCurrent ? 'cc-btn--primary' : 'cc-btn--ghost'}`}
                style={{ minWidth: 'var(--cc-touch-target)' }}
                onClick={() => handleSwitch(chain.id)}
                disabled={isSwitching || isCurrent}
                aria-label={`Switch to ${chain.name}${isCurrent ? ' (current)' : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
              >
                {chain.name}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="cc-error" role="alert" style={{ marginTop: 'var(--cc-space-sm)' }}>
          Switch error: {error.message}
        </div>
      )}
      {isSwitching && (
        <p style={{ marginTop: 'var(--cc-space-xs)', fontSize: 'var(--cc-text-[14px])', color: 'var(--cc-warning)' }} aria-live="polite">
          Switching chain...
        </p>
      )}
    </section>
  );
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  fontSize: 'var(--cc-text-[14px])',
  borderBottom: '1px solid var(--cc-hairline)',
};

const monoStyle: React.CSSProperties = {
  fontFamily: 'var(--cc-font-[var(--font-mono)])',
  fontSize: 'var(--cc-text-[14px])',
  color: 'var(--cc-ink-soft)',
};
