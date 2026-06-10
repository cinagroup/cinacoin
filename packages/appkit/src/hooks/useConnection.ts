/**
 * useConnection hook — manages wallet connection state and actions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ConnectionState,
  ConnectionActions,
  ConnectedAccount,
  ChainConfig,
  CinacoinAppKitConfig,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseConnectionOptions {
  /** AppKit configuration */
  config: CinacoinAppKitConfig;
  /** Callback on successful connection */
  onConnect?: (account: ConnectedAccount) => void;
  /** Callback on disconnect */
  onDisconnect?: () => void;
  /** Callback on chain switch */
  onChainSwitch?: (chainId: number) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseConnectionReturn extends ConnectionState, ConnectionActions {
  /** Whether a connection is being established */
  isConnecting: boolean;
  /** Currently connecting wallet ID */
  connectingWalletId: string | null;
  /** WalletConnect URI (for QR code) */
  wcUri: string | null;
  /** Set the WC URI (called internally) */
  setWcUri: (uri: string | null) => void;
}

// ============================================================================
// Connection State Storage
// ============================================================================

const STATE_KEY = 'cinacoin-appkit-connection';

interface StoredState {
  account: ConnectedAccount | null;
  walletId: string | null;
}

function loadStoredState(): StoredState {
  if (typeof window === 'undefined') {
    return { account: null, walletId: null };
  }
  try {
    const stored = localStorage.getItem(STATE_KEY);
    return stored ? JSON.parse(stored) : { account: null, walletId: null };
  } catch {
    return { account: null, walletId: null };
  }
}

function saveStoredState(state: StoredState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing wallet connection lifecycle
 */
export function useConnection(options: UseConnectionOptions): UseConnectionReturn {
  const { config, onConnect, onDisconnect, onChainSwitch, onError } = options;

  const stored = loadStoredState();

  const [status, setStatus] = useState<ConnectionState['status']>(
    stored.account ? 'connected' : 'disconnected',
  );
  const [account, setAccount] = useState<ConnectedAccount | null>(stored.account);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);
  const [wcUri, setWcUri] = useState<string | null>(null);

  const configRef = useRef(config);
  configRef.current = config;

  // Open modal
  const open = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  // Close modal
  const close = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, []);

  // Connect to a wallet
  const connect = useCallback(
    async (walletId: string): Promise<void> => {
      setStatus('connecting');
      setConnectingWalletId(walletId);
      setError(null);

      try {
        // Simulate connection flow
        // In real implementation, this would use @cinacoin/walletconnect-v2
        // and @cinacoin/core-sdk to establish the actual connection

        // For now, we simulate the connection process
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simulate getting an account
        const mockAccount: ConnectedAccount = {
          address: '0x' + Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16),
          ).join(''),
          chainId: config.defaultChain ?? config.chains[0]?.id ?? 1,
          walletId,
        };

        setAccount(mockAccount);
        setStatus('connected');
        saveStoredState({ account: mockAccount, walletId });
        onConnect?.(mockAccount);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Connection failed';
        setError(errorMsg);
        setStatus('error');
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setConnectingWalletId(null);
      }
    },
    [config, onConnect, onError],
  );

  // Disconnect
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      // In real implementation, this would close the WalletConnect session
      await new Promise(resolve => setTimeout(resolve, 300));

      setAccount(null);
      setStatus('disconnected');
      setWcUri(null);
      saveStoredState({ account: null, walletId: null });
      onDisconnect?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Disconnect failed';
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    }
  }, [onDisconnect, onError]);

  // Switch chain
  const switchChain = useCallback(
    async (chainId: number): Promise<void> => {
      if (!account) {
        throw new Error('Not connected');
      }

      const chain = config.chains.find(c => c.id === chainId);
      if (!chain) {
        throw new Error(`Chain ${chainId} not supported`);
      }

      try {
        // In real implementation, this would use wallet_switchEthereumChain
        await new Promise(resolve => setTimeout(resolve, 800));

        const updatedAccount: ConnectedAccount = {
          ...account,
          chainId,
        };
        setAccount(updatedAccount);
        saveStoredState({ account: updatedAccount, walletId: account.walletId });
        onChainSwitch?.(chainId);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Chain switch failed';
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      }
    },
    [account, config.chains, onChainSwitch, onError],
  );

  // Restore session on mount
  useEffect(() => {
    const stored = loadStoredState();
    if (stored.account) {
      setAccount(stored.account);
      setStatus('connected');
    }
  }, []);

  return {
    status,
    account,
    error,
    isOpen,
    isConnecting: status === 'connecting',
    connectingWalletId,
    wcUri,
    setWcUri,
    open,
    close,
    connect,
    disconnect,
    switchChain,
  };
}
