/**
 * WalletList component — displays the list of available wallets
 */

import React, { useMemo } from 'react';
import type { WalletListProps, WalletInfo, RecentWallet } from '../types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0px',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
    paddingLeft: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0px',
  },
  walletButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '12px 8px',
    borderRadius: '12px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    color: 'var(--cc-ink, #1a1a2e)',
    position: 'relative' as const,
  },
  walletButtonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    color: 'var(--cc-ink, #1a1a2e)',
    width: '100%',
    position: 'relative' as const,
  },
  walletIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    objectFit: 'cover' as const,
    backgroundColor: 'var(--cc-surface, #f5f5f5)',
  },
  walletIconSmall: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    objectFit: 'cover' as const,
    backgroundColor: 'var(--cc-surface, #f5f5f5)',
  },
  walletName: {
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'center' as const,
    lineHeight: 1.2,
    wordBreak: 'break-word' as const,
  },
  walletNameRow: {
    fontSize: '14px',
    fontWeight: 500,
    flex: 1,
    textAlign: 'left' as const,
  },
  recentBadge: {
    position: 'absolute' as const,
    top: '6px',
    right: '6px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--cc-success, #22c55e)',
  },
  installedBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--cc-success, #22c55e)',
    backgroundColor: 'color-mix(in srgb, var(--cc-success, #22c55e) 12%, transparent)',
    padding: '0px 4px',
    borderRadius: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid var(--cc-border, rgba(0,0,0,0.1))',
    borderTopColor: 'var(--cc-accent, #3b82f6)',
    borderRadius: '50%',
    animation: 'cinacoin-spin 0.6s linear infinite',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '24px 16px',
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.5,
    fontSize: '14px',
  },
  footer: {
    textAlign: 'center' as const,
    padding: '16px 0 0',
    borderTop: '1px solid var(--cc-border, rgba(0,0,0,0.08))',
    marginTop: '12px',
  },
  footerText: {
    fontSize: '13px',
    color: 'var(--cc-ink, #1a1a2e)',
    opacity: 0.5,
    margin: 0,
  },
  footerLink: {
    color: 'var(--cc-accent, #3b82f6)',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
    padding: 0,
  },
} as const;

// ============================================================================
// Sub-components
// ============================================================================

function WalletGridItem({
  wallet,
  isRecent,
  isConnecting,
  onSelect,
}: {
  wallet: WalletInfo;
  isRecent: boolean;
  isConnecting: boolean;
  onSelect: (wallet: WalletInfo) => void;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  return (
    <button
      style={{
        ...styles.walletButton,
        ...(hovered ? { backgroundColor: 'var(--cc-surface, #f5f5f5)' } : {}),
        ...(isConnecting
          ? { borderColor: 'var(--cc-accent, #3b82f6)', backgroundColor: 'var(--cc-surface, #f5f5f5)' }
          : {}),
      }}
      onClick={() => onSelect(wallet)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      type="button"
      disabled={isConnecting}
    >
      {isRecent && <div style={styles.recentBadge} />}
      {isConnecting ? (
        <div style={styles.spinner} />
      ) : imgError ? (
        <div style={{ ...styles.walletIcon, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          🦊
        </div>
      ) : (
        <img
          src={wallet.icon}
          alt={wallet.name}
          style={styles.walletIcon}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
      <span style={styles.walletName}>{wallet.name}</span>
    </button>
  );
}

function WalletListItem({
  wallet,
  isRecent,
  isConnecting,
  onSelect,
}: {
  wallet: WalletInfo;
  isRecent: boolean;
  isConnecting: boolean;
  onSelect: (wallet: WalletInfo) => void;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  return (
    <button
      style={{
        ...styles.walletButtonRow,
        ...(hovered ? { backgroundColor: 'var(--cc-surface, #f5f5f5)' } : {}),
        ...(isConnecting
          ? { borderColor: 'var(--cc-accent, #3b82f6)', backgroundColor: 'var(--cc-surface, #f5f5f5)' }
          : {}),
      }}
      onClick={() => onSelect(wallet)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      type="button"
      disabled={isConnecting}
    >
      {isConnecting ? (
        <div style={{ ...styles.walletIconSmall, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={styles.spinner} />
        </div>
      ) : imgError ? (
        <div style={{ ...styles.walletIconSmall, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
          🦊
        </div>
      ) : (
        <img
          src={wallet.icon}
          alt={wallet.name}
          style={styles.walletIconSmall}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      )}
      <span style={styles.walletNameRow}>{wallet.name}</span>
      {isRecent && <span style={styles.installedBadge}>Recent</span>}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Wallet list component — displays wallets in grid (featured) and list (all)
 */
export function WalletList({
  wallets,
  recentWallets = [],
  onSelect,
  isLoading = false,
  connectingWalletId = null,
}: WalletListProps): React.ReactElement {
  const recentIds = useMemo(
    () => new Set(recentWallets.map(r => r.id)),
    [recentWallets],
  );

  const featuredWallets = useMemo(
    () => wallets.filter(w => w.featured),
    [wallets],
  );

  const allWallets = wallets;

  if (wallets.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No wallets found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Recent wallets */}
      {recentWallets.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Recent</div>
          <div style={styles.list}>
            {recentWallets
              .map(recent => wallets.find(w => w.id === recent.id))
              .filter((w): w is WalletInfo => w !== undefined)
              .map(wallet => (
                <WalletListItem
                  key={`recent-${wallet.id}`}
                  wallet={wallet}
                  isRecent
                  isConnecting={isLoading && connectingWalletId === wallet.id}
                  onSelect={onSelect}
                />
              ))}
          </div>
        </div>
      )}

      {/* Featured wallets (grid) */}
      {featuredWallets.length > 0 && !recentWallets.length && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Popular</div>
          <div style={styles.grid}>
            {featuredWallets.map(wallet => (
              <WalletGridItem
                key={`featured-${wallet.id}`}
                wallet={wallet}
                isRecent={recentIds.has(wallet.id)}
                isConnecting={isLoading && connectingWalletId === wallet.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* All wallets (list) */}
      <div style={styles.section}>
        {featuredWallets.length > 0 && !recentWallets.length && (
          <div style={styles.sectionTitle}>All Wallets</div>
        )}
        <div style={styles.list}>
          {allWallets.map(wallet => (
            <WalletListItem
              key={wallet.id}
              wallet={wallet}
              isRecent={recentIds.has(wallet.id)}
              isConnecting={isLoading && connectingWalletId === wallet.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Don&apos;t have a wallet?{' '}
          <a
            href="https://walletconnect.com/wallets"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            Get one →
          </a>
        </p>
      </div>
    </div>
  );
}

export default WalletList;
