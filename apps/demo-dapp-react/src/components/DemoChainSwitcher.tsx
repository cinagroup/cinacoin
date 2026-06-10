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
  11155111: { id: 11155111, name: 'Sepolia', symbol: 'ETH', color: 'var(--cc-chain-ethereum)' },
  80002: { id: 80002, name: 'Amoy (Polygon)', symbol: 'MATIC', color: 'var(--cc-chain-polygon)' },
  1: { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH', color: 'var(--cc-chain-ethereum)' },
  137: { id: 137, name: 'Polygon', symbol: 'MATIC', color: 'var(--cc-chain-polygon)' },
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
          <span className="text-[var(--cc-text-lg)]" aria-hidden="true">⛓️</span> Chain Switcher
        </h3>
        <p className="cc-section-desc">Connect a wallet to switch between chains.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="chain-heading">
      <h3 id="chain-heading" className="cc-section-title">
        <span className="text-[var(--cc-text-lg)]" aria-hidden="true">⛓️</span> Chain Switcher
      </h3>
      <p className="cc-section-desc">
        Switch between supported networks and view current chain details.
      </p>

      {/* ChainSwitcher Web Component */}
      <div className="mb-[var(--cc-space-lg)]">
        <label className="cc-label" id="chain-component-label">ChainSwitcher Component</label>
        <div className="mt-[var(--cc-space-xs)]">
          <ChainSwitcher />
        </div>
      </div>

      {/* Current chain info */}
      {currentInfo && (
        <div className="bg-[var(--cc-surface)] rounded-[var(--cc-radius-md)] p-[var(--cc-space-md)] mt-[var(--cc-space-sm)]" aria-label="Current chain information">
          <div className={infoRowClass}>
            <span className="text-[var(--cc-body)]">Current Chain</span>
            <div className="flex items-center gap-[var(--cc-space-xs)]">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{
                  background: currentInfo.color,
                  boxShadow: `0 0 8px ${currentInfo.color}`,
                }}
                aria-hidden="true"
              />
              <span className="font-semibold text-[var(--cc-ink)]">{currentInfo.name}</span>
            </div>
          </div>
          <div className={infoRowClass}>
            <span className="text-[var(--cc-body)]">Chain ID</span>
            <span className={monoClass}>{currentChainId}</span>
          </div>
          <div className={infoRowClass}>
            <span className="text-[var(--cc-body)]">Native Currency</span>
            <span className="text-[var(--cc-ink-soft)]">{currentInfo.symbol}</span>
          </div>
          <div className={`${infoRowClass} border-b-0`}>
            <span className="text-[var(--cc-body)]">Hex ID</span>
            <span className={monoClass}>0x{(currentChainId ?? 0).toString(16)}</span>
          </div>
        </div>
      )}

      {/* Quick switch buttons */}
      <div className="mt-[var(--cc-space-md)]">
        <label className="cc-label" id="chain-switch-label">Quick Switch</label>
        <div className="flex gap-[var(--cc-space-xs)] mt-[var(--cc-space-xs)] flex-wrap" role="group" aria-labelledby="chain-switch-label">
          {chains.map((chain) => {
            const isCurrent = chain.id === currentChainId;
            return (
              <button
                key={chain.id}
                className={`cc-btn ${isCurrent ? 'cc-btn--primary' : 'cc-btn--ghost'} min-w-[var(--cc-touch-target)]`}
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
        <div className="cc-error mt-[var(--cc-space-sm)]" role="alert">
          Switch error: {error.message}
        </div>
      )}
      {isSwitching && (
        <p className="mt-[var(--cc-space-xs)] text-[var(--cc-text-sm)] text-[var(--cc-warning)]" aria-live="polite">
          Switching chain...
        </p>
      )}
    </section>
  );
}

const infoRowClass = 'flex justify-between items-center py-2 text-[var(--cc-text-sm)] border-b border-[var(--cc-hairline)]';
const monoClass = 'font-mono text-[var(--cc-text-sm)] text-[var(--cc-ink-soft)]';
