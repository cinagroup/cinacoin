/**
 * ConnectButton — ready-to-use wallet connect button
 *
 * Renders a styled button that opens the AppKit modal when disconnected,
 * or shows the connected account address when connected.
 */

import React, { useState, useEffect, useCallback, type CSSProperties } from 'react';
import type { ConnectionState } from '@cinacoin/appkit';
import { useCinacoinAppKit } from './CinacoinProvider';

// ============================================================================
// Types
// ============================================================================

export interface ConnectButtonProps {
  /** Label shown when disconnected (default: "Connect Wallet") */
  label?: string;
  /** Custom className for the button */
  className?: string;
  /** Inline style overrides */
  style?: CSSProperties;
  /** Custom render function for connected state */
  renderConnected?: (account: { address: string; chainId: number }) => React.ReactNode;
  /** Custom render function for disconnected state */
  renderDisconnected?: () => React.ReactNode;
  /** Called when the button is clicked (before default behavior) */
  onClick?: () => void;
}

// ============================================================================
// Default Styles
// ============================================================================

const defaultStyle: CSSProperties = {
  padding: '8px 20px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: 'var(--cc-accent, #3b82f6)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'opacity 0.15s, transform 0.1s',
  outline: 'none',
};

const connectedStyle: CSSProperties = {
  ...defaultStyle,
  backgroundColor: 'var(--cc-surface, #f3f4f6)',
  color: 'var(--cc-ink, #111827)',
  border: '1px solid var(--cc-border, rgba(0,0,0,0.08))',
  fontFamily: 'monospace',
};

// ============================================================================
// Helpers
// ============================================================================

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Drop-in connect button.
 *
 * @example
 * ```tsx
 * <ConnectButton label="Sign In" />
 *
 * // Custom rendering:
 * <ConnectButton
 *   renderConnected={({ address }) => <span>🟢 {shortenAddress(address)}</span>}
 *   renderDisconnected={() => <span>🔌 Connect</span>}
 * />
 * ```
 */
export function ConnectButton({
  label = 'Connect Wallet',
  className,
  style,
  renderConnected,
  renderDisconnected,
  onClick,
}: ConnectButtonProps): React.ReactElement {
  const appkit = useCinacoinAppKit();
  const [state, setState] = useState<ConnectionState>(appkit.getState());

  useEffect(() => {
    const unsub = appkit.subscribe(setState);
    return unsub;
  }, [appkit]);

  const handleClick = useCallback(() => {
    onClick?.();
    appkit.open();
  }, [appkit, onClick]);

  // Connected state
  if (state.status === 'connected' && state.account) {
    if (renderConnected) {
      return (
        <button
          className={className}
          style={{ ...connectedStyle, ...style }}
          onClick={handleClick}
          type="button"
        >
          {renderConnected({
            address: state.account.address,
            chainId: state.account.chainId,
          })}
        </button>
      );
    }

    return (
      <button
        className={className}
        style={{ ...connectedStyle, ...style }}
        onClick={handleClick}
        type="button"
      >
        {shortenAddress(state.account.address)}
      </button>
    );
  }

  // Disconnected / connecting / error state
  if (renderDisconnected) {
    return (
      <button
        className={className}
        style={{ ...defaultStyle, ...style }}
        onClick={handleClick}
        type="button"
      >
        {renderDisconnected()}
      </button>
    );
  }

  return (
    <button
      className={className}
      style={{ ...defaultStyle, ...style }}
      onClick={handleClick}
      type="button"
    >
      {state.status === 'connecting' ? 'Connecting...' : label}
    </button>
  );
}
