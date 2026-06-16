/**
 * CinacoinProvider — React Native context provider with real Cinacoin v2 integration.
 *
 * Wraps the app and provides chain state, connection methods, and theming.
 * TODO: Migrate to @reown/react-native for React Native wallet connections.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
// TODO: Replace with @reown/react-native when migrating React Native to Reown
// import type { Session, WcClientEvent } from '@reown/react-native';
import type { TransactionRequest, AppMetadata } from '@cinacoin/core-sdk';

// Temporary types until Reown migration
interface Session {
  topic?: string;
  pairingTopic?: string;
  peerMetadata?: {
    name?: string;
    description?: string;
    url?: string;
    icons?: string[];
  };
}

interface WcClientEvent {
  id?: number;
  pairingTopic?: string;
  proposer?: {
    metadata?: {
      name?: string;
      description?: string;
      url?: string;
      icons?: string[];
    };
  };
  params?: {
    requiredNamespaces?: Record<string, unknown>;
    optionalNamespaces?: Record<string, unknown>;
  };
}

// Stub implementations - TODO: Replace with @reown/react-native
const WcSessionManager = class {};
const WcRelay = class {};
const createPairing = async (): Promise<string> => '';
const parseWcUri = (uri: string): Record<string, unknown> => ({});
const formatWcUri = (uri: string | Record<string, unknown>): string => '';
const getDefaultRequiredNamespaces = (): Record<string, unknown> => ({});
const buildSendTransaction = (params: TransactionRequest): unknown[] => [];
const buildPersonalSign = (message: string, address: string): unknown[] => [message, address];

interface WalletRegistryEntry {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  rdns?: string;
  deepLink?: string;
  universalLink?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}

const getWalletById = (id: string): WalletRegistryEntry | null => null;
const WALLET_REGISTRY: WalletRegistryEntry[] = [];
const buildWalletDeepLink = (walletId: string, uri: string): string => '';
const buildWalletUniversalLink = (walletId: string, uri: string): string => '';
const WC_METHODS: Record<string, unknown> = {};

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

/** Wallet info with deep linking support. */
export interface WalletInfo {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  deepLink?: string;
  universalLink?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
  supportsCinacoin: boolean;
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
export interface CinacoinConfig {
  /** Relay server URL. */
  relayUrl?: string;
  /** Project ID. */
  projectId?: string;
  chains?: ChainConfig[];
  theme?: {
    mode?: ThemeMode;
    variables?: Record<string, string>;
  };
  metadata?: AppMetadata;
  recommendedWallets?: string[];
}

/** Context value. */
export interface CinacoinContextValue {
  config: CinacoinConfig;
  connectors: Connector[];
  wallets: WalletInfo[];
  account: AccountState;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Current WC v2 session, if connected. */
  session: Session | null;
  /** Active WC URI for QR display / deep linking. */
  wcUri: string | null;
  connect: (connectorId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  isSwitchingChain: boolean;
  themeMode: ThemeMode;
  themeColors: ThemeColors;
  /** Create a new pairing and return the WC URI. */
  createPairing: () => Promise<string>;
  /** Connect using a WC v2 URI. */
  connectWithUri: (uri: string) => Promise<void>;
  /** Send a JSON-RPC request to the connected wallet. */
  request: <T = unknown>(method: string, params: unknown) => Promise<T>;
  /** Open a wallet app using deep linking. */
  openWallet: (walletId: string, uri: string) => Promise<void>;
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

const CinacoinContext = createContext<CinacoinContextValue | null>(null);

/** Hook to access Cinacoin context. Throws if used outside provider. */
export function useCinacoinContext(): CinacoinContextValue {
  const ctx = useContext(CinacoinContext);
  if (!ctx) {
    throw new Error('useCinacoinContext must be used within <CinacoinProvider>');
  }
  return ctx;
}

/** Provider props. */
export interface CinacoinProviderProps {
  config: CinacoinConfig;
  children: ReactNode;
}

/**
 * Build wallet list from the registry + recommended wallets.
 */
function buildWalletList(recommendedIds?: string[]): WalletInfo[] {
  const wallets = WALLET_REGISTRY.map((w) => ({
    id: w.id,
    name: w.name,
    icon: w.imageUrl,
    description: w.homepage,
    deepLink: w.deepLink,
    universalLink: w.universalLink,
    appStoreUrl: w.appStoreUrl,
    playStoreUrl: w.playStoreUrl,
    supportsCinacoin: w.supportsWcV2,
  }));

  // Sort: recommended first
  if (recommendedIds?.length) {
    wallets.sort((a, b) => {
      const aIdx = recommendedIds.indexOf(a.id);
      const bIdx = recommendedIds.indexOf(b.id);
      if (aIdx !== -1 && bIdx === -1) return -1;
      if (bIdx !== -1 && aIdx === -1) return 1;
      return 0;
    });
  }

  return wallets;
}

/**
 * Extract address from a CAIP-10 account string.
 */
function extractAddress(caip10: string): string {
  const parts = caip10.split(':');
  return parts.length >= 3 ? parts[2] : caip10;
}

/**
 * Extract chain ID from a CAIP-2 chain string.
 */
function extractChainId(caip2: string): number {
  const parts = caip2.split(':');
  return parts.length >= 2 ? parseInt(parts[1], 10) : 1;
}

/**
 * CinacoinProvider for React Native with real WC v2 support.
 */
export function CinacoinProvider({ config, children }: CinacoinProviderProps): JSX.Element {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [account, setAccount] = useState<AccountState>({
    address: null,
    balance: '0.00',
    chainId: config.chains?.[0]?.id ?? 1,
    chainSymbol: config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
  });
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);

  // WC session manager ref
  const sessionManagerRef = useRef<WcSessionManager | null>(null);

  const themeMode = (config.theme?.mode ?? 'dark') as ThemeMode;
  const themeColors = THEME_COLORS[themeMode];
  const wallets = useMemo(() => buildWalletList(config.recommendedWallets), [config.recommendedWallets]);

  const connectors = useMemo<Connector[]>(
    () => [
      { id: 'metamask', name: 'MetaMask', icon: 'https://registry.walletconnect.com/api/v2/logo/md/metamask', type: 'walletconnect' },
      { id: 'walletconnect', name: 'Cinacoin', icon: 'https://registry.walletconnect.com/api/v2/logo/md/walletconnect', type: 'walletconnect' },
      { id: 'rainbow', name: 'Rainbow', icon: 'https://registry.walletconnect.com/api/v2/logo/md/rainbow', type: 'walletconnect' },
      { id: 'coinbase', name: 'Coinbase Wallet', icon: 'https://registry.walletconnect.com/api/v2/logo/md/coinbase', type: 'coinbase' },
      { id: 'trust', name: 'Trust Wallet', icon: 'https://registry.walletconnect.com/api/v2/logo/md/trust', type: 'walletconnect' },
      { id: 'phantom', name: 'Phantom', icon: 'https://registry.walletconnect.com/api/v2/logo/md/phantom', type: 'walletconnect' },
      { id: 'zerion', name: 'Zerion', icon: 'https://registry.walletconnect.com/api/v2/logo/md/zerion', type: 'walletconnect' },
      { id: 'email', name: 'Email', type: 'email' },
    ],
    [],
  );

  // Initialize session manager
  useEffect(() => {
    if (config.relayUrl && config.metadata) {
      const chainIds = config.chains?.map((c) => `eip155:${c.id}`) ?? ['eip155:1'];
      sessionManagerRef.current = new WcSessionManager({
        relayUrl: config.relayUrl,
        metadata: config.metadata,
        requiredChains: chainIds,
      });

      // Listen for WC events
      sessionManagerRef.current.on('wcEvent', (event: unknown) => {
        const evt = event as WcClientEvent;
        if (evt.type === 'connected') {
          const session = (evt as { session: Session }).session;
          setSessionData(session);
          const address = session.accounts.length > 0 ? extractAddress(session.accounts[0]) : null;
          const chainId = session.accounts.length > 0 ? extractChainId(session.accounts[0]) : (config.chains?.[0]?.id ?? 1);
          setAccount({
            address,
            balance: '0.00',
            chainId,
            chainSymbol: config.chains?.find((c) => c.id === chainId)?.nativeCurrency.symbol ?? 'ETH',
          });
          setStatus('connected');
        } else if (evt.type === 'disconnected') {
          setSessionData(null);
          setAccount({
            address: null,
            balance: '0.00',
            chainId: config.chains?.[0]?.id ?? 1,
            chainSymbol: config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
          });
          setStatus('disconnected');
        } else if (evt.type === 'error') {
          setStatus('error');
        }
      });
    }

    return () => {
      sessionManagerRef.current?.disconnect().catch(() => {});
      sessionManagerRef.current = null;
    };
  }, [config.relayUrl, config.metadata, config.chains]);

  /** Create a new pairing and return the WC v2 URI. */
  const createPairingUri = useCallback(async (): Promise<string> => {
    if (!sessionManagerRef.current) {
      throw new Error('Cinacoin not configured with relayUrl and metadata');
    }
    const uri = await sessionManagerRef.current.initiatePairing();
    setWcUri(uri);
    return uri;
  }, []);

  /** Connect using a WC v2 URI. */
  const connectWithUri = useCallback(async (uri: string): Promise<void> => {
    if (!sessionManagerRef.current) {
      throw new Error('Cinacoin not configured with relayUrl and metadata');
    }
    setStatus('connecting');
    try {
      const session = await sessionManagerRef.current.connectWithUri(uri);
      setSessionData(session);
      setWcUri(null);
    } catch (error) {
      setStatus('error');
      throw error;
    }
  }, []);

  /**
   * Connect to a wallet.
   * For WC v2 wallets: creates a pairing URI.
   * For email/social: uses mock flow.
   */
  const connect = useCallback(
    async (connectorId: string): Promise<void> => {
      // Check if it's a WC v2 wallet
      const wallet = getWalletById(connectorId);
      if (wallet?.supportsWcV2 && sessionManagerRef.current) {
        // Create pairing URI for QR or deep link
        await createPairingUri();
        setStatus('connecting');
        return;
      }

      // Non-WC connectors: mock flow
      setStatus('connecting');
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
    },
    [config.chains, createPairingUri],
  );

  /**
   * Open a wallet app with deep linking using the WC URI.
   */
  const openWallet = useCallback(
    async (walletId: string, uri: string): Promise<void> => {
      // In React Native, use Linking API
      const { Linking, Platform } = await import('react-native');

      const deepLink = buildWalletDeepLink(walletId, uri);
      const universalLink = buildWalletUniversalLink(walletId, uri);

      if (deepLink) {
        try {
          const canOpen = await Linking.canOpenURL(deepLink);
          if (canOpen) {
            await Linking.openURL(deepLink);
            return;
          }
        } catch {
          // Fall through
        }
      }

      // Try universal link
      if (universalLink) {
        try {
          await Linking.openURL(universalLink);
          return;
        } catch {
          // Fall through
        }
      }

      // Suggest app store
      const wallet = getWalletById(walletId);
      const storeUrl = Platform.OS === 'ios' ? wallet?.appStoreUrl : wallet?.playStoreUrl;
      if (storeUrl) {
        await Linking.openURL(storeUrl);
      }
    },
    [],
  );

  const disconnect = useCallback(async (): Promise<void> => {
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.disconnect();
    }
    setSessionData(null);
    setAccount({
      address: null,
      balance: '0.00',
      chainId: config.chains?.[0]?.id ?? 1,
      chainSymbol: config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
    });
    setWcUri(null);
    setStatus('disconnected');
  }, [config.chains]);

  const switchChain = useCallback(
    async (chainId: number): Promise<void> => {
      setIsSwitchingChain(true);
      try {
        if (sessionManagerRef.current?.isConnected()) {
          // Send real wc_sessionUpdate request
          await sessionManagerRef.current.request('wallet_switchEthereumChain', {
            chainId: '0x' + chainId.toString(16),
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        const chain = config.chains?.find((c) => c.id === chainId);
        if (chain) {
          setAccount((prev) => ({
            ...prev,
            chainId,
            chainSymbol: chain.nativeCurrency.symbol,
          }));
        }
      } finally {
        setIsSwitchingChain(false);
      }
    },
    [config.chains],
  );

  /**
   * Send a JSON-RPC request to the connected wallet.
   */
  const request = useCallback(
    async <T = unknown>(method: string, params: unknown): Promise<T> => {
      if (!sessionManagerRef.current?.isConnected()) {
        throw new Error('No active session — connect first');
      }
      return sessionManagerRef.current.request<T>(method, params);
    },
    [],
  );

  const value = useMemo<CinacoinContextValue>(
    () => ({
      config,
      connectors,
      wallets,
      account,
      status,
      session: sessionData,
      wcUri,
      connect,
      disconnect,
      switchChain,
      isSwitchingChain,
      themeMode,
      themeColors,
      createPairing: createPairingUri,
      connectWithUri,
      request,
      openWallet,
    }),
    [
      config,
      connectors,
      wallets,
      account,
      status,
      sessionData,
      wcUri,
      connect,
      disconnect,
      switchChain,
      isSwitchingChain,
      themeMode,
      themeColors,
      createPairingUri,
      connectWithUri,
      request,
      openWallet,
    ],
  );

  return (
    <CinacoinContext.Provider value={value}>{children}</CinacoinContext.Provider>
  );
}
