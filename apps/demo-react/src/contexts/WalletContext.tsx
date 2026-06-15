/**
 * WalletContext — Reown AppKit 集成
 *
 * 使用 wagmi hooks 封装钱包状态。
 */
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import React, { createContext, useContext, useCallback } from 'react';

export interface WalletState {
  connected: boolean;
  address: string;
  chainId: number | string | undefined;
  walletId: string | null;
  connecting: boolean;
  error: string | null;
}

interface WalletContextValue extends WalletState {
  openConnectModal: () => void | Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { isPending } = useConnect();

  const state: WalletState = {
    connected: isConnected,
    address: address ?? '',
    chainId,
    walletId: isConnected ? 'appkit' : null,
    connecting: isPending,
    error: null,
  };

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const clearError = useCallback(() => {
    // No-op
  }, []);

  const openConnectModal = useCallback(async () => {
    // AppKit modal handles connection
    // This is a placeholder for compatibility
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        openConnectModal,
        disconnect,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
