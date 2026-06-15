'use client';

import { useAccount } from 'wagmi';

/**
 * WalletConnectButton - Displays wallet connection status and opens the AppKit modal
 */
export function WalletConnectButton() {
  const { address, isConnected } = useAccount();

  const handleClick = () => {
    // AppKit modal will be opened via wagmi connection
  };

  if (isConnected && address) {
    return (
      <button
        onClick={handleClick}
        className="px-4 py-2 text-body-sm font-medium bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] rounded-[var(--cc-radius-sm)] hover:opacity-80 transition-opacity duration-150"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 text-body-sm font-medium bg-[var(--cc-ink)] text-[var(--cc-canvas)] rounded-[var(--cc-radius-sm)] hover:opacity-90 transition-opacity duration-150"
    >
      Connect Wallet
    </button>
  );
}
