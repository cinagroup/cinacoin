import React, { useRef, useEffect, type CSSProperties } from 'react';
import { useCinacoinContext } from './CinacoinProvider.js';

/** Props for the React ConnectButton wrapper. */
export interface ConnectButtonProps {
  /** Button text when disconnected. */
  label?: string;
  /** Button visual variant. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Button size. */
  size?: 'sm' | 'md' | 'lg';
  /** Show account balance when connected. */
  showBalance?: boolean;
  /** Show avatar when connected. */
  showAvatar?: boolean;
  /** Show network badge when connected. */
  showNetwork?: boolean;
  /** CSS class name. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
  /** Click handler. */
  onClick?: () => void;
  /** Disconnect handler. */
  onDisconnect?: () => void;
}

/**
 * ConnectButton — React wrapper for the OCX ConnectButton Web Component.
 *
 * Automatically reads connection state from CinacoinProvider context.
 *
 * ```tsx
 * <ConnectButton variant="primary" size="md" />
 * ```
 */
export function ConnectButton({
  label = 'Connect Wallet',
  variant = 'primary',
  size = 'md',
  showBalance = false,
  showAvatar = false,
  showNetwork = false,
  className,
  style,
  onClick,
  onDisconnect,
}: ConnectButtonProps): JSX.Element {
  const ref = useRef<HTMLElement>(null);
  const { account, status, connect, disconnect } = useCinacoinContext();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleOCXClick = () => {
      if (status === 'disconnected' || status === 'error') {
        connect('metamask').catch((err) => console.error('[ConnectButton] connect failed:', err));
      }
      onClick?.();
    };
    const handleOCXDisconnect = () => {
      disconnect().catch((err) => console.error('[ConnectButton] disconnect failed:', err));
      onDisconnect?.();
    };

    el.addEventListener('ocx-click', handleOCXClick);
    el.addEventListener('ocx-disconnect', handleOCXDisconnect);
    return () => {
      el.removeEventListener('ocx-click', handleOCXClick);
      el.removeEventListener('ocx-disconnect', handleOCXDisconnect);
    };
  }, [status, connect, disconnect, onClick, onDisconnect]);

  const stateMap: Record<string, string> = {
    disconnected: 'disconnected',
    connecting: 'connecting',
    connected: 'connected',
    error: 'error',
  };

  return (
    <ocx-connect-button
      ref={ref as React.RefObject<HTMLElement>}
      variant={variant}
      size={size}
      label={label}
      state={stateMap[status] ?? 'disconnected'}
      address={account.address ?? ''}
      balance={showBalance ? account.balance : ''}
      chain-symbol={showBalance ? account.chainSymbol : ''}
      show-balance={showBalance}
      show-avatar={showAvatar}
      show-network={showNetwork}
      className={className}
      style={style}
    />
  );
}
