'use client';

import React from 'react';
import { ChainSwitcher, useSwitchChain, useCinaCoinContext } from '@cinacoin/react';

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
  const { account, config, status } = useCinaCoinContext();
  const { switchChain, isSwitching, error } = useSwitchChain();

  const chains = config.chains ?? [];
  const currentChainId = account.chainId;
  const currentInfo = currentChainId ? CHAIN_DETAILS[currentChainId] : null;

  if (status !== 'connected') {
    return (
      <section style={sectionStyle}>
        <h3 style={titleStyle}>
          <span style={iconStyle}>⛓️</span> Chain Switcher
        </h3>
        <p style={descStyle}>Connect a wallet to switch between chains.</p>
      </section>
    );
  }

  const handleSwitch = async (chainId: number) => {
    try {
      await switchChain(chainId);
    } catch {
      // error handled by hook
    }
  };

  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>
        <span style={iconStyle}>⛓️</span> Chain Switcher
      </h3>
      <p style={descStyle}>
        Switch between supported networks and view current chain details.
      </p>

      {/* ChainSwitcher Web Component */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>ChainSwitcher Component</label>
        <div style={{ marginTop: '8px' }}>
          <ChainSwitcher />
        </div>
      </div>

      {/* Current chain info */}
      {currentInfo && (
        <div style={infoCardStyle}>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Current Chain</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: currentInfo.color,
                  boxShadow: `0 0 8px ${currentInfo.color}`,
                }}
              />
              <span style={{ fontWeight: 600 }}>{currentInfo.name}</span>
            </div>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Chain ID</span>
            <span style={monoStyle}>{currentChainId}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Native Currency</span>
            <span>{currentInfo.symbol}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Hex ID</span>
            <span style={monoStyle}>0x{currentChainId.toString(16)}</span>
          </div>
        </div>
      )}

      {/* Quick switch buttons */}
      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Quick Switch</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          {chains.map((chain) => (
            <button
              key={chain.id}
              style={{
                ...btnStyle,
                background: chain.id === currentChainId ? '#6366f1' : 'rgba(255,255,255,0.06)',
                opacity: chain.id === currentChainId ? 1 : isSwitching ? 0.6 : 1,
              }}
              onClick={() => handleSwitch(chain.id)}
              disabled={isSwitching || chain.id === currentChainId}
            >
              {chain.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
          Switch error: {error.message}
        </div>
      )}
      {isSwitching && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#facc15' }}>
          Switching chain...
        </div>
      )}
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

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#818cf8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const infoCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '12px',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  fontSize: '14px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const infoLabelStyle: React.CSSProperties = { color: '#94a3b8' };

const monoStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '13px',
};

const btnStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#e0e0e0',
  cursor: 'pointer',
};
