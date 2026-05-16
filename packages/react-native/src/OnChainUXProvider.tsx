/**
 * OnChainUXProvider — React Native context provider.
 *
 * Wraps the app and provides chain state, connection methods, and theming.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

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

/** Wallet connector. */
export interface Connector {
  id: string;
  name: string;
  icon?: string;
  type: 'injected' | 'walletconnect' | 'coinbase' | 'email' | 'social';
}

/** Account state. */
export interface AccountState {
  address: string | null;
  balance: string;
  chainId: number | null;
  chainSymbol: string;
  ensName?: string;
}

/** Configuration passed to provider. */
export interface OnChainUXConfig {
  projectId?: string;
  chains?: ChainConfig[];
  theme?: {
    mode?: ThemeMode;
    variables?: Record<string, string>;
  };
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons?: string[];
  };
  recommendedWallets?: string[];
}

/** Context value. */
export interface OnChainUXContextValue {
  config: OnChainUXConfig;
  connectors: Connector[];
  account: AccountState;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  connect: (connectorId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  isSwitchingChain: boolean;
  themeMode: ThemeMode;
  themeColors: ThemeColors;
}

/** Resolved theme color tokens. */
export interface ThemeColors {
  accent500: string;
  accentGlow: string;
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgCardHover: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

const THEME_COLORS: Record<ThemeMode, ThemeColors> = {
  dark: {
    accent500: '#3B82F6',
    accentGlow: 'rgba(59, 130, 246, 0.3)',
    bgPrimary: '#0F172A',
    bgSecondary: '#111827',
    bgCard: '#1E293B',
    bgCardHover: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#334155',
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
  },
  light: {
    accent500: '#2563EB',
    accentGlow: 'rgba(37, 99, 235, 0.15)',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F8FAFC',
    bgCard: '#F8FAFC',
    bgCardHover: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    success: '#16A34A',
    warning: '#CA8A04',
    error: '#DC2626',
  },
  minimal: {
    accent500: '#94A3B8',
    accentGlow: 'transparent',
    bgPrimary: '#000000',
    bgSecondary: '#0A0A0A',
    bgCard: '#0A0A0A',
    bgCardHover: '#171717',
    textPrimary: '#FAFAFA',
    textSecondary: '#A3A3A3',
    textTertiary: '#737373',
    border: '#262626',
    success: '#4ADE80',
    warning: '#FACC15',
    error: '#F87171',
  },
};

const OnChainUXContext = createContext<OnChainUXContextValue | null>(null);

/** Hook to access OnChainUX context. Throws if used outside provider. */
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
 * OnChainUXProvider for React Native.
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

  const themeMode = (config.theme?.mode ?? 'dark') as ThemeMode;
  const themeColors = THEME_COLORS[themeMode];

  const connectors = useMemo<Connector[]>(
    () => [
      { id: 'metamask', name: 'MetaMask', type: 'injected' },
      { id: 'walletconnect', name: 'WalletConnect', type: 'walletconnect' },
      { id: 'coinbase', name: 'Coinbase Wallet', type: 'coinbase' },
      { id: 'rabby', name: 'Rabby', type: 'injected' },
      { id: 'email', name: 'Email', type: 'email' },
    ],
    []
  );

  const connect = useCallback(async (connectorId: string): Promise<void> => {
    setStatus('connecting');
    try {
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
      themeMode,
      themeColors,
    }),
    [config, connectors, account, status, connect, disconnect, switchChain, isSwitchingChain, themeMode, themeColors]
  );

  return (
    <OnChainUXContext.Provider value={value}>
      {children}
    </OnChainUXContext.Provider>
  );
}
