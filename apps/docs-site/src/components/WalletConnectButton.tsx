import { useAccount } from 'wagmi';
import React from 'react';

export default function WalletConnectButton() {
  const { isConnected, address } = useAccount();

  const shortAddress =
    isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  const handleClick = () => {
    // AppKit modal will handle connection
  };

  return (
    <button
      onClick={handleClick}
      className="button button--primary navbar__link"
      aria-label={isConnected ? `Connected: ${shortAddress}` : 'Connect Wallet'}
      style={{
        padding: '6px 16px',
        borderRadius: '8px',
        border: 'none',
        background: isConnected ? 'var(--ifm-color-emphasis-200)' : 'var(--ifm-color-primary)',
        color: isConnected ? 'var(--ifm-font-color-base)' : '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
      }}
    >
      {shortAddress ?? 'Connect Wallet'}
    </button>
  );
}
