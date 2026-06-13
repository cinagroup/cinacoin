'use client';

import { ChainSwitcher, useSwitchChain, useCinacoinContext } from '@cinacoin/react';
import React from 'react';

interface ChainInfo {
  id: number;
  name: string;
  symbol: string;
  color: string;
}

const CHAIN_DETAILS: Record<number, ChainInfo> = {
  11155111: { id: 11155111, name: 'Sepolia', symbol: 'ETH', color: 'var(--cc-muted)' },
  80002: { id: 80002, name: 'Amoy (Polygon)', symbol: 'MATIC', color: 'var(--cc-body)' },
  1: { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH', color: 'var(--cc-ink)' },
  137: { id: 137, name: 'Polygon', symbol: 'MATIC', color: 'var(--cc-body)' },
};

/** DemoChainSwitcher — showcase chain switching and info display. */
export function DemoChainSwitcher(): JSX.Element {
  const { account, config, status } = useCinacoinContext();
  const { switchChain, isSwitching, error } = useSwitchChain();

  const chains = config.chains ?? [];
  const currentChainId = account.chainId;
  const currentInfo = currentChainId != null ? CHAIN_DETAILS[currentChainId] : null;

  const handleSwitch = (chainId: number) => {
    switchChain(chainId).catch(() => {
      // error handled by hook
    });
  };

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="chain-heading">
        <h3 id="chain-heading" className="cc-section-title">
          <span className="cc-section-title__icon" aria-hidden="true">
            ⛓️
          </span>{' '}
          Chain switcher.
        </h3>
        <p className="cc-section-desc">Connect a wallet to switch between chains.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="chain-heading">
      <h3 id="chain-heading" className="cc-section-title">
        <span className="cc-section-title__icon" aria-hidden="true">
          ⛓️
        </span>{' '}
        Chain switcher.
      </h3>
      <p className="cc-section-desc">
        Switch between supported networks and view current chain details.
      </p>

      {/* ChainSwitcher Web Component */}
      <div className="cc-field">
        <label className="cc-label" id="chain-component-label">
          ChainSwitcher component.
        </label>
        <div className="cc-field__content">
          <ChainSwitcher />
        </div>
      </div>

      {/* Current chain info */}
      {currentInfo && (
        <div className="cc-info-box" aria-label="Current chain information.">
          <div className="cc-info-row">
            <span className="cc-info-row__label">Current chain.</span>
            <div className="cc-info-row__value--accent">
              <span
                className="cc-chain-dot"
                style={{ background: currentInfo.color, boxShadow: `0 0 8px ${currentInfo.color}` }}
                aria-hidden="true"
              />
              <span>{currentInfo.name}</span>
            </div>
          </div>
          <div className="cc-info-row">
            <span className="cc-info-row__label">Chain ID.</span>
            <span className="cc-info-row__value">{currentChainId}</span>
          </div>
          <div className="cc-info-row">
            <span className="cc-info-row__label">Native currency.</span>
            <span className="cc-info-row__value">{currentInfo.symbol}</span>
          </div>
          <div className="cc-info-row">
            <span className="cc-info-row__label">Hex ID.</span>
            <span className="cc-info-row__value">0x{(currentChainId ?? 0).toString(16)}</span>
          </div>
        </div>
      )}

      {/* Quick switch buttons */}
      <div className="cc-field">
        <label className="cc-label" id="chain-switch-label">
          Quick switch.
        </label>
        <div className="cc-button-group" role="group" aria-labelledby="chain-switch-label">
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
        <div className="cc-error" style={{ marginTop: 'var(--cc-space-sm)' }} role="alert">
          Switch error: {error.message}
        </div>
      )}
      {isSwitching && (
        <p
          className="cc-progress-bar__text"
          style={{ marginTop: 'var(--cc-space-xs)', color: 'var(--cc-warning)' }}
          aria-live="polite"
        >
          Switching chain...
        </p>
      )}
    </section>
  );
}
