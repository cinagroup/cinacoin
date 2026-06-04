'use client';

import React, { useState } from 'react';
import { ConnectButton, ConnectModal, useConnect, useDisconnect, useCinaCoinContext } from '@cinacoin/react';

/** DemoConnectSection — showcase connection UI patterns. */
export function DemoConnectSection(): JSX.Element {
  const { status, account } = useCinaCoinContext();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  const handleQuickConnect = (connectorId: string) => {
    setSelectedConnector(connectorId);
    connect(connectorId).catch(() => {});
  };

  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>
        <span style={iconStyle}>🔗</span> Connect
      </h3>
      <p style={descStyle}>
        Connect your wallet using any of the supported methods below.
      </p>

      {/* Web Component: ConnectButton (primary variant) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>ConnectButton Web Component</label>
        <div style={{ marginTop: '8px' }}>
          <ConnectButton label="Connect Wallet" variant="primary" size="md" showAvatar showNetwork />
        </div>
      </div>

      {/* Web Component: ConnectButton (secondary variant) */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>ConnectButton (Secondary)</label>
        <div style={{ marginTop: '8px' }}>
          <ConnectButton label="Connect" variant="secondary" size="sm" />
        </div>
      </div>

      {/* ConnectModal trigger */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>ConnectModal</label>
        <div style={{ marginTop: '8px' }}>
          <button
            style={btnStyle}
            onClick={() => setModalOpen(true)}
            disabled={status === 'connected'}
          >
            Open Connect Modal
          </button>
        </div>
        <ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>

      {/* Programmatic connect via useConnect hook */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Programmatic Connect (useConnect)</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button style={btnOutlineStyle} onClick={() => handleQuickConnect('metamask')}>
            MetaMask
          </button>
          <button style={btnOutlineStyle} onClick={() => handleQuickConnect('walletconnect')}>
            WalletConnect
          </button>
          <button style={btnOutlineStyle} onClick={() => handleQuickConnect('coinbase')}>
            Coinbase
          </button>
        </div>
        {selectedConnector && (
          <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
            Attempting: {selectedConnector}
          </span>
        )}
      </div>

      {/* Disconnect */}
      {status === 'connected' && (
        <div>
          <button
            style={{ ...btnStyle, background: '#dc2626' }}
            onClick={() => disconnect().catch(() => {})}
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Connection status */}
      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '13px' }}>
        <strong>Status:</strong> {status}<br />
        {account.address && <><strong>Address:</strong> {account.address}<br /></>}
        {account.chainId && <><strong>Chain ID:</strong> {account.chainId}</>}
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

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#818cf8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const btnStyle: React.CSSProperties = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnOutlineStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#e0e0e0',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};
