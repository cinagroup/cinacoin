'use client';

import React, { useState } from 'react';
import { ConnectButton, ConnectModal, useConnect, useDisconnect, useCinacoinContext } from '@cinacoin/react';
import { Link } from 'lucide-react';

type ConnectorId = 'metamask' | 'walletconnect' | 'coinbase';

/** DemoConnectSection — showcase connection UI patterns. */
export function DemoConnectSection(): JSX.Element {
  const { status, account } = useCinacoinContext();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorId | null>(null);

  const handleQuickConnect = (connectorId: ConnectorId) => {
    setSelectedConnector(connectorId);
    connect(connectorId).catch(() => {
      // Connection rejected or failed — status will update via context
    });
  };

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="connect-heading">
      <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">CONNECTION</p>
      <h3 id="connect-heading" className="cc-section-title">
        <Link className="w-5 h-5" /> Connect
      </h3>
      <p className="cc-section-desc">
        Connect your wallet using any of the supported methods below.
      </p>

      {/* Web Component: ConnectButton (primary variant) */}
      <div style={{ marginBottom: 'var(--cc-space-md)' }}>
        <label className="cc-label" id="connect-btn-primary-label">ConnectButton Web Component</label>
        <div style={{ marginTop: 'var(--cc-space-xs)' }}>
          <ConnectButton label="Connect Wallet" variant="primary" size="md" showAvatar showNetwork />
        </div>
      </div>

      {/* Web Component: ConnectButton (secondary variant) */}
      <div style={{ marginBottom: 'var(--cc-space-md)' }}>
        <label className="cc-label" id="connect-btn-secondary-label">ConnectButton (Secondary)</label>
        <div style={{ marginTop: 'var(--cc-space-xs)' }}>
          <ConnectButton label="Connect" variant="secondary" size="sm" />
        </div>
      </div>

      {/* ConnectModal trigger */}
      <div style={{ marginBottom: 'var(--cc-space-md)' }}>
        <label className="cc-label" id="connect-modal-label">ConnectModal</label>
        <div style={{ marginTop: 'var(--cc-space-xs)' }}>
          <button
            className="cc-btn cc-btn--primary"
            onClick={() => setModalOpen(true)}
            disabled={status === 'connected'}
            aria-labelledby="connect-modal-label"
          >
            Open Connect Modal
          </button>
        </div>
        <ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>

      {/* Programmatic connect via useConnect hook */}
      <div style={{ marginBottom: 'var(--cc-space-md)' }}>
        <label className="cc-label" id="connect-programmatic-label">Programmatic Connect (useConnect)</label>
        <div style={{ display: 'flex', gap: 'var(--cc-space-xs)', marginTop: 'var(--cc-space-xs)', flexWrap: 'wrap' }} role="group" aria-labelledby="connect-programmatic-label">
          {(['metamask', 'walletconnect', 'coinbase'] as ConnectorId[]).map((id) => (
            <button
              key={id}
              className="cc-btn cc-btn--outline"
              onClick={() => handleQuickConnect(id)}
              aria-label={`Connect with ${id.charAt(0).toUpperCase() + id.slice(1)}`}
            >
              {id === 'metamask' ? 'MetaMask' : id === 'walletconnect' ? 'WalletConnect' : 'Coinbase'}
            </button>
          ))}
        </div>
        {selectedConnector && (
          <p style={{ fontSize: 'var(--cc-text-xs)', color: 'var(--cc-body)', marginTop: 'var(--cc-space-xxs)' }} aria-live="polite">
            Attempting: {selectedConnector}
          </p>
        )}
      </div>

      {/* Disconnect */}
      {status === 'connected' && (
        <div>
          <button
            className="cc-btn"
            style={{ background: 'var(--cc-danger)', color: 'var(--cc-danger-on)' }}
            onClick={() => disconnect().catch(() => {})}
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Connection status */}
      <div style={{ marginTop: 'var(--cc-space-md)', padding: 'var(--cc-space-sm)', background: 'var(--cc-surface)', borderRadius: 'var(--cc-radius-md)', fontSize: 'var(--cc-text-sm)' }} aria-label="Connection details">
        <strong>Status:</strong> {status}
        {account.address && (
          <>
            <br />
            <strong>Address:</strong> <code style={monoStyle}>{account.address}</code>
          </>
        )}
        {account.chainId && (
          <>
            <br />
            <strong>Chain ID:</strong> {account.chainId}
          </>
        )}
      </div>
    </section>
  );
}

const monoStyle: React.CSSProperties = {
  fontFamily: 'var(--cc-font-mono)',
  fontSize: 'var(--cc-text-xs)',
};
