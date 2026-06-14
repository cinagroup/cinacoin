'use client';

import {
  ConnectButton,
  ConnectModal,
  useConnect,
  useDisconnect,
  useCinacoinContext,
} from '@cinacoin/react';
import React, { useState } from 'react';

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
    void connect(connectorId).catch(() => {
      // Connection rejected or failed — status will update via context
    });
  };

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="connect-heading">
      <p className="cc-eyebrow">Connection.</p>
      <h3 id="connect-heading" className="cc-section-title">
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
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Connect.
      </h3>
      <p className="cc-section-desc">
        Connect your wallet using any of the supported methods below.
      </p>

      {/* Web Component: ConnectButton (primary variant) */}
      <div className="cc-field">
        <label className="cc-label" id="connect-btn-primary-label">
          ConnectButton web component.
        </label>
        <div className="cc-field__content">
          <ConnectButton
            label="Connect Wallet"
            variant="primary"
            size="md"
            showAvatar
            showNetwork
          />
        </div>
      </div>

      {/* Web Component: ConnectButton (secondary variant) */}
      <div className="cc-field">
        <label className="cc-label" id="connect-btn-secondary-label">
          ConnectButton (secondary).
        </label>
        <div className="cc-field__content">
          <ConnectButton label="Connect" variant="secondary" size="sm" />
        </div>
      </div>

      {/* ConnectModal trigger */}
      <div className="cc-field">
        <label className="cc-label" id="connect-modal-label">
          ConnectModal.
        </label>
        <div className="cc-field__content">
          <button
            className="cc-btn cc-btn--primary"
            onClick={() => setModalOpen(true)}
            disabled={status === 'connected'}
            aria-labelledby="connect-modal-label"
          >
            Open connect modal.
          </button>
        </div>
        <ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>

      {/* Programmatic connect via useConnect hook */}
      <div className="cc-field">
        <label className="cc-label" id="connect-programmatic-label">
          Programmatic connect (useConnect).
        </label>
        <div className="cc-button-group" role="group" aria-labelledby="connect-programmatic-label">
          {(['metamask', 'walletconnect', 'coinbase'] as ConnectorId[]).map((id) => (
            <button
              key={id}
              className="cc-btn cc-btn--outline"
              onClick={() => handleQuickConnect(id)}
              aria-label={`Connect with ${id.charAt(0).toUpperCase() + id.slice(1)}`}
            >
              {id === 'metamask'
                ? 'MetaMask'
                : id === 'walletconnect'
                  ? 'Cinacoin'
                  : 'Coinbase'}
            </button>
          ))}
        </div>
        {selectedConnector && (
          <p className="cc-field__hint" aria-live="polite">
            Attempting: {selectedConnector}.
          </p>
        )}
      </div>

      {/* Disconnect */}
      {status === 'connected' && (
        <div className="cc-field">
          <button
            className="cc-btn cc-btn--danger"
            onClick={() => {
              void disconnect().catch(() => {});
            }}
            aria-label="Disconnect wallet."
          >
            Disconnect.
          </button>
        </div>
      )}

      {/* Connection status */}
      <div className="cc-status-box" aria-label="Connection details.">
        <strong>Status:</strong> {status}
        {account.address && (
          <>
            <br />
            <strong>Address:</strong> <code className="cc-code">{account.address}</code>
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
