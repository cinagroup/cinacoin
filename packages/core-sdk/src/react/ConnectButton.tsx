/**
 * ConnectButton — Unified wallet connection button component.
 *
 * 对标 Reown <w3m-connect-button /> 和 Coinbase OnchainKit <ConnectButton />.
 * Renders a button that opens the wallet modal or shows the connected account.
 *
 * @example
 * ```tsx
 * import { ConnectButton } from '@cinacoin/core-sdk/react';
 *
 * function Header() {
 *   return <ConnectButton label="Connect Wallet" />;
 * }
 * ```
 */

import React, { useCallback } from 'react';
import { useCoinContext } from './CoinProvider.js';
import type { ConnectedAccount } from './CoinProvider.js';

// ============================================================================
// Types
// ============================================================================

export interface ConnectButtonProps {
  /** Button label when disconnected */
  label?: string;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Show balance when connected */
  showBalance?: boolean;
  /** Show chain name when connected */
  showChain?: boolean;
  /** Avatar size in pixels */
  avatarSize?: number;
  /** Custom render function for connected state */
  children?: (props: {
    account: ConnectedAccount;
    disconnect: () => void;
    openModal: () => void;
  }) => React.ReactNode;
  /** Variant: 'primary' | 'outline' | 'ghost' */
  variant?: 'primary' | 'outline' | 'ghost';
  /** Size: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// Helpers
// ============================================================================

function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'connected': return '#22c55e';
    case 'connecting': return '#f59e0b';
    case 'reconnecting': return '#f59e0b';
    default: return '#6b7280';
  }
}

// ============================================================================
// Size/Variant Styles
// ============================================================================

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: 'var(--text-caption)', borderRadius: '4px' },
  md: { padding: '8px 16px', fontSize: 'var(--text-caption)', borderRadius: '8px' },
  lg: { padding: '8px 20px', fontSize: 'var(--text-body-md)', borderRadius: '8px' },
};

function getVariantStyles(variant: string): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--cc-primary, #58a6ff)',
        color: '#ffffff',
        border: 'none',
      };
    case 'outline':
      return {
        background: 'transparent',
        color: 'var(--cc-primary, #58a6ff)',
        border: '1px solid var(--cc-primary, #58a6ff)',
      };
    case 'ghost':
      return {
        background: 'var(--cc-surface, rgba(255,255,255,0.05))',
        color: 'var(--cc-body, #e6edf3)',
        border: '1px solid var(--cc-hairline, rgba(255,255,255,0.1))',
      };
    default:
      return {};
  }
}

// ============================================================================
// ConnectButton Component
// ============================================================================

export function ConnectButton({
  label = 'Connect Wallet',
  className,
  style,
  showBalance = false,
  showChain = false,
  avatarSize = 24,
  children,
  variant = 'primary',
  size = 'md',
}: ConnectButtonProps) {
  const { state, actions } = useCoinContext();

  const handleClick = useCallback(() => {
    if (state.status === 'connected') {
      actions.openModal();
    } else {
      actions.openModal();
    }
  }, [state.status, actions]);

  // ── Custom render ──
  if (children && state.status === 'connected' && state.account) {
    return (
      <>
        {children({
          account: state.account,
          disconnect: actions.disconnect,
          openModal: actions.openModal,
        })}
      </>
    );
  }

  // ── Disconnected state ──
  if (state.status !== 'connected' || !state.account) {
    return (
      <button
        className={`cinacoin-connect-btn ${className ?? ''}`}
        style={{
          ...SIZE_STYLES[size],
          ...getVariantStyles(variant),
          cursor: 'pointer',
          fontWeight: "var(--weight-semibold)",
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
          fontFamily: 'inherit',
          ...style,
        }}
        onClick={handleClick}
        disabled={state.status === 'connecting'}
      >
        {state.status === 'connecting' && (
          <span className="cinacoin-connect-spinner" style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'cinacoin-spin 0.8s linear infinite',
            display: 'inline-block',
          }} />
        )}
        {state.status === 'connecting' ? 'Connecting...' : label}
      </button>
    );
  }

  // ── Connected state ──
  const account = state.account;

  return (
    <button
      className={`cinacoin-connect-btn cinacoin-connect-btn--connected ${className ?? ''}`}
      style={{
        ...SIZE_STYLES[size],
        ...getVariantStyles('ghost'),
        cursor: 'pointer',
        fontWeight: "var(--weight-medium)",
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        ...style,
      }}
      onClick={handleClick}
    >
      {/* Status dot */}
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: getStatusColor(state.status),
        flexShrink: 0,
      }} />

      {/* Avatar placeholder */}
      <span style={{
        width: `${avatarSize}px`,
        height: `${avatarSize}px`,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${account.address.slice(2, 8) || '58a6ff'}, ${account.address.slice(8, 14) || '3fb950'})`,
        flexShrink: 0,
      }} />

      {/* Address */}
      <span style={{ fontFamily: 'monospace' }}>
        {truncateAddress(account.address)}
      </span>

      {/* Chain name */}
      {showChain && (
        <span style={{
          fontSize: 'var(--text-caption)',
          opacity: 0.6,
          background: 'var(--cc-surface, rgba(255,255,255,0.05))',
          padding: '0px 4px',
          borderRadius: '4px',
        }}>
          Chain {account.chainId}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// CSS injection
// ============================================================================

if (typeof document !== 'undefined') {
  const styleId = 'cinacoin-connect-btn-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes cinacoin-spin {
        to { transform: rotate(360deg); }
      }
      .cinacoin-connect-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      .cinacoin-connect-btn:active {
        transform: translateY(0);
      }
      .cinacoin-connect-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    `;
    document.head.appendChild(style);
  }
}
