/**
 * AccountPanel component — displays connected account info and actions
 */

import React, { useState, useCallback } from 'react';
import type { AccountPanelProps, ChainConfig } from '../types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  accountCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    borderRadius: '16px',
    backgroundColor: 'var(--cc-surface, #f5f5f5)',
    border: '1px solid var(--cc-border, rgba(0,0,0,0.08))',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--cc-accent, #3b82f6), #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#fff',
    fontWeight: 600,
  },
  address: {
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'monospace',
    color: 'var(--cc-ink, #1a1a2e)',
  },
  ensName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.7,
  },
  balance: {
    fontSize: '13px',
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.5,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid var(--cc-border, rgba(0,0,0,0.08))',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--cc-ink, #1a1a2e)',
    transition: 'all 0.15s ease',
  },
  chainSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  chainLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  chainSelect: {
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid var(--cc-border, rgba(0,0,0,0.08))',
    backgroundColor: 'var(--cc-surface, #f5f5f5)',
    color: 'var(--cc-ink, #1a1a2e)',
    fontSize: '14px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
    appearance: 'none' as const,
  },
  disconnectButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--cc-danger, #ef4444)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--cc-danger, #ef4444)',
    transition: 'all 0.15s ease',
    marginTop: '4px',
  },
  copied: {
    fontSize: '11px',
    color: 'var(--cc-success, #22c55e)',
    fontWeight: 500,
  },
} as const;

// ============================================================================
// Helpers
// ============================================================================

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function getInitials(address: string): string {
  return address.slice(2, 4).toUpperCase();
}

// ============================================================================
// Component
// ============================================================================

/**
 * Account panel — shows connected account details and management actions
 */
export function AccountPanel({
  account,
  onDisconnect,
  onCopyAddress,
  chains = [],
  onSwitchChain,
}: AccountPanelProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const [disconnectHover, setDisconnectHover] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      onCopyAddress?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      const textArea = document.createElement('textarea');
      textArea.value = account.address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [account.address, onCopyAddress]);

  const handleExplorerClick = () => {
    const chain = chains.find(c => c.id === account.chainId);
    if (chain?.explorerUrl) {
      window.open(`${chain.explorerUrl}/address/${account.address}`, '_blank');
    }
  };

  const currentChain = chains.find(c => c.id === account.chainId);

  return (
    <div style={styles.container}>
      {/* Account Card */}
      <div style={styles.accountCard}>
        <div style={styles.avatar}>{getInitials(account.address)}</div>
        {account.ensName && <div style={styles.ensName}>{account.ensName}</div>}
        <div style={styles.address}>{shortenAddress(account.address)}</div>
        {account.balance && <div style={styles.balance}>{account.balance}</div>}

        {/* Quick Actions */}
        <div style={styles.actions}>
          <button
            style={styles.actionButton}
            onClick={handleCopy}
            type="button"
          >
            {copied ? <span style={styles.copied}>Copied!</span> : '📋 Copy'}
          </button>
          {currentChain?.explorerUrl && (
            <button
              style={styles.actionButton}
              onClick={handleExplorerClick}
              type="button"
            >
              🔗 Explorer
            </button>
          )}
        </div>
      </div>

      {/* Chain Switcher */}
      {chains.length > 1 && onSwitchChain && (
        <div style={styles.chainSection}>
          <span style={styles.chainLabel}>Network</span>
          <select
            style={styles.chainSelect}
            value={account.chainId}
            onChange={e => onSwitchChain(Number(e.target.value))}
          >
            {chains.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name} {chain.testnet ? '(Testnet)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Disconnect */}
      <button
        style={{
          ...styles.disconnectButton,
          ...(disconnectHover
            ? {
                backgroundColor: 'var(--cc-danger, #ef4444)',
                color: '#fff',
              }
            : {}),
        }}
        onClick={onDisconnect}
        onMouseEnter={() => setDisconnectHover(true)}
        onMouseLeave={() => setDisconnectHover(false)}
        type="button"
      >
        Disconnect
      </button>
    </div>
  );
}

export default AccountPanel;
