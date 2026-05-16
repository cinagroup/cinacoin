import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode, type CSSProperties } from 'react';

/** Supported theme modes. */
export type ThemeMode = 'dark' | 'light' | 'minimal';

/** Chain configuration. */
export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl?: string;
  iconUrl?: string;
  testnet?: boolean;
}

/** Wallet connector interface. */
export interface Connector {
  id: string;
  name: string;
  icon?: string;
  type: 'injected' | 'walletconnect' | 'coinbase' | 'email' | 'social';
  installed?: boolean;
}

/** Account information. */
export interface AccountState {
  address: string | null;
  balance: string;
  chainId: number | null;
  chainSymbol: string;
  ensName?: string;
}

/** OnChainUX configuration passed to the provider. */
export interface OnChainUXConfig {
  /** Project ID (for analytics / relay). */
  projectId?: string;

  /** Supported chains. */
  chains?: ChainConfig[];

  /** Theme configuration. */
  theme?: {
    mode?: ThemeMode;
    /** Optional CSS variable overrides. */
    variables?: Record<string, string>;
  };

  /** App metadata. */
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons?: string[];
  };

  /** Recommended wallet IDs (for ordering in UI). */
  recommendedWallets?: string[];
}

/** Context value exposed by OnChainUXProvider. */
export interface OnChainUXContextValue {
  /** Current configuration. */
  config: OnChainUXConfig;

  /** Available connectors. */
  connectors: Connector[];

  /** Current account state. */
  account: AccountState;

  /** Current connection status. */
  status: 'disconnected' | 'connecting' | 'connected' | 'error';

  /** Connect to a wallet by connector ID. */
  connect: (connectorId: string) => Promise<void>;

  /** Disconnect the current wallet. */
  disconnect: () => Promise<void>;

  /** Switch the active chain. */
  switchChain: (chainId: number) => Promise<void>;

  /** Whether a chain switch is in progress. */
  isSwitchingChain: boolean;
}

const OnChainUXContext = createContext<OnChainUXContextValue | null>(null);

/** Hook to access the OnChainUX context. Throws if used outside provider. */
export function useOnChainUXContext(): OnChainUXContextValue {
  const ctx = useContext(OnChainUXContext);
  if (!ctx) {
    throw new Error('useOnChainUXContext must be used within <OnChainUXProvider>');
  }
  return ctx;
}

/** Provider props. */
export interface OnChainUXProviderProps {
  config: OnChainUXConfig;
  children: ReactNode;
}

/**
 * OnChainUXProvider — React context provider for OnChainUX.
 *
 * Wraps the app and provides chain state, connection methods, and theming.
 *
 * ```tsx
 * <OnChainUXProvider config={{ chains: [...], theme: { mode: 'dark' } }}>
 *   <App />
 * </OnChainUXProvider>
 * ```
 */
export function OnChainUXProvider({ config, children }: OnChainUXProviderProps): JSX.Element {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [account, setAccount] = useState<AccountState>({
    address: null,
    balance: '0.00',
    chainId: config.chains?.[0]?.id ?? 1,
    chainSymbol: config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
  });
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  // Build default connectors list
  const defaultConnectors: Connector[] = useMemo(
    () => [
      { id: 'metamask', name: 'MetaMask', type: 'injected', installed: false },
      { id: 'walletconnect', name: 'WalletConnect', type: 'walletconnect' },
      { id: 'coinbase', name: 'Coinbase Wallet', type: 'coinbase' },
      { id: 'rabby', name: 'Rabby', type: 'injected', installed: false },
      { id: 'email', name: 'Email', type: 'email' },
    ],
    []
  );

  const connectors = useMemo(
    () => defaultConnectors,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const connect = useCallback(async (connectorId: string): Promise<void> => {
    setStatus('connecting');
    try {
      // TODO: implement actual connection logic
      // For now, simulate a connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAccount({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        balance: '1.234',
        chainId: config.chains?.[0]?.id ?? 1,
        chainSymbol: config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
      });
      setStatus('connected');
    } catch {
      setStatus('error');
    }
  }, [config.chains]);

  const disconnect = useCallback(async (): Promise<void> => {
    setAccount({
      address: null,
      balance: '0.00',
      chainId: config.chains?.[0]?.id ?? 1,
      chainSymbol: config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
    });
    setStatus('disconnected');
  }, [config.chains]);

  const switchChain = useCallback(async (chainId: number): Promise<void> => {
    setIsSwitchingChain(true);
    try {
      // TODO: implement actual chain switch
      await new Promise(resolve => setTimeout(resolve, 500));
      const chain = config.chains?.find(c => c.id === chainId);
      if (chain) {
        setAccount(prev => ({
          ...prev,
          chainId,
          chainSymbol: chain.nativeCurrency.symbol,
        }));
      }
    } finally {
      setIsSwitchingChain(false);
    }
  }, [config.chains]);

  const value = useMemo<OnChainUXContextValue>(
    () => ({
      config,
      connectors,
      account,
      status,
      connect,
      disconnect,
      switchChain,
      isSwitchingChain,
    }),
    [config, connectors, account, status, connect, disconnect, switchChain, isSwitchingChain]
  );

  // Apply theme CSS variables
  const themeStyle: CSSProperties = useMemo(() => {
    const themeVars: CSSProperties = {};
    if (config.theme?.variables) {
      for (const [key, val] of Object.entries(config.theme.variables)) {
        (themeVars as Record<string, string>)[key] = val;
      }
    }
    return themeVars;
  }, [config.theme?.variables]);

  return (
    <OnChainUXContext.Provider value={value}>
      <div className={`ocx-root ocx-theme-${config.theme?.mode ?? 'dark'}`} style={themeStyle}>
        {children}
      </div>
    </OnChainUXContext.Provider>
  );
}
