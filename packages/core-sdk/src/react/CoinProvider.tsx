/**
 * CoinProvider — React Context for wallet state management.
 *
 *对标 Reown AppKit's WagmiProvider + Coinbase OnchainKit Provider.
 * Provides wallet connection state, chain info, and actions to all child components.
 *
 * @example
 * ```tsx
 * import { CoinProvider } from '@cinacoin/core-sdk/react';
 *
 * function App() {
 *   return (
 *     <CoinProvider
 *       projectId="your-project-id"
 *       chains={[mainnet, polygon]}
 *       metadata={{ name: 'My App', ... }}
 *     >
 *       <MyDapp />
 *     </CoinProvider>
 *   );
 * }
 * ```
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { Chain, AppMetadata, TransactionRequest } from '../types.js';
import { Connector } from '../connector.js';
import { EventEmitter } from '../events.js';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface ConnectedAccount {
  address: string;
  chainId: number;
  connectorId: string;
  connectorName: string;
  namespace: string;
}

export interface CoinState {
  status: ConnectionStatus;
  account: ConnectedAccount | null;
  chains: Chain[];
  error: string | null;
  isModalOpen: boolean;
}

export interface CoinActions {
  connect: (connectorId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (tx: TransactionRequest) => Promise<string>;
  openModal: () => void;
  closeModal: () => void;
}

export interface CoinContextValue {
  state: CoinState;
  actions: CoinActions;
  connectors: ConnectorRegistry;
}

// ============================================================================
// Connector Registry
// ============================================================================

export interface ConnectorConfig {
  id: string;
  name: string;
  icon: string;
  type: 'injected' | 'walletconnect' | 'extension' | 'mobile';
  create: () => Connector;
}

export class ConnectorRegistry {
  private connectors = new Map<string, ConnectorConfig>();
  private instances = new Map<string, Connector>();

  register(config: ConnectorConfig): void {
    this.connectors.set(config.id, config);
  }

  unregister(id: string): void {
    this.connectors.delete(id);
    this.instances.delete(id);
  }

  get(id: string): ConnectorConfig | undefined {
    return this.connectors.get(id);
  }

  getAll(): ConnectorConfig[] {
    return Array.from(this.connectors.values());
  }

  async getInstance(id: string): Promise<Connector> {
    let instance = this.instances.get(id);
    if (!instance) {
      const config = this.connectors.get(id);
      if (!config) throw new Error(`Connector '${id}' not registered`);
      instance = config.create();
      this.instances.set(id, instance);
    }
    return instance;
  }

  async destroyAll(): Promise<void> {
    for (const [, instance] of this.instances) {
      try {
        await instance.disconnect();
      } catch {
        // ignore
      }
    }
    this.instances.clear();
  }
}

// ============================================================================
// Reducer
// ============================================================================

type CoinAction =
  | { type: 'SET_STATUS'; status: ConnectionStatus }
  | { type: 'SET_ACCOUNT'; account: ConnectedAccount | null }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CHAINS'; chains: Chain[] }
  | { type: 'SET_MODAL_OPEN'; isOpen: boolean }
  | { type: 'RESET' };

function coinReducer(state: CoinState, action: CoinAction): CoinState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_ACCOUNT':
      return { ...state, account: action.account, status: action.account ? 'connected' : 'disconnected' };
    case 'SET_ERROR':
      return { ...state, error: action.error, status: action.error ? 'disconnected' : state.status };
    case 'SET_CHAINS':
      return { ...state, chains: action.chains };
    case 'SET_MODAL_OPEN':
      return { ...state, isModalOpen: action.isOpen };
    case 'RESET':
      return { ...state, status: 'disconnected', account: null, error: null, isModalOpen: false };
    default:
      return state;
  }
}

// ============================================================================
// Provider Props
// ============================================================================

export interface CoinProviderProps {
  children: ReactNode;
  projectId?: string;
  chains: Chain[];
  metadata?: AppMetadata;
  connectors?: ConnectorConfig[];
  autoConnect?: boolean;
  defaultChainId?: number;
}

// ============================================================================
// Context
// ============================================================================

const CoinContext = createContext<CoinContextValue | null>(null);

// ============================================================================
// CoinProvider Component
// ============================================================================

export function CoinProvider({
  children,
  projectId,
  chains,
  metadata,
  connectors: connectorConfigs,
  autoConnect = true,
  defaultChainId,
}: CoinProviderProps) {
  const [state, dispatch] = useReducer(coinReducer, {
    status: 'disconnected',
    account: null,
    chains,
    error: null,
    isModalOpen: false,
  });

  const registry = useMemo(() => {
    const reg = new ConnectorRegistry();
    connectorConfigs?.forEach(c => reg.register(c));
    return reg;
  }, [connectorConfigs]);

  // Event emitter for cross-component communication
  const emitter = useMemo(() => new EventEmitter(), []);

  // ── Actions ──

  const connect = useCallback(async (connectorId: string) => {
    dispatch({ type: 'SET_STATUS', status: 'connecting' });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const connector = await registry.getInstance(connectorId);
      const result = await connector.connect({
        chains: chains.map(c => parseInt(c.reference || c.id.split(':')[1] || '1', 10)),
        metadata,
      });

      const account: ConnectedAccount = {
        address: result.accounts[0],
        chainId: result.chainId,
        connectorId: result.connectorId,
        connectorName: connector.name,
        namespace: chains[0]?.namespace || 'eip155',
      };

      dispatch({ type: 'SET_ACCOUNT', account });

      // Listen for account/chain changes
      connector.on('accountsChanged', (accounts: unknown) => {
        const addrs = accounts as string[];
        if (addrs.length === 0) {
          dispatch({ type: 'RESET' });
        } else {
          dispatch({
            type: 'SET_ACCOUNT',
            account: { ...account, address: addrs[0] },
          });
        }
      });

      connector.on('chainChanged', (chainId: unknown) => {
        dispatch({
          type: 'SET_ACCOUNT',
          account: { ...account, chainId: Number(chainId) },
        });
      });

      connector.on('disconnect', () => {
        dispatch({ type: 'RESET' });
      });

      emitter.emit('connect', account);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'SET_ERROR', error: message });
      dispatch({ type: 'SET_STATUS', status: 'disconnected' });
      emitter.emit('error', err);
    }
  }, [registry, chains, metadata, emitter]);

  const disconnect = useCallback(async () => {
    try {
      if (state.account) {
        const connector = await registry.getInstance(state.account.connectorId);
        await connector.disconnect();
      }
    } catch {
      // ignore disconnect errors
    }
    dispatch({ type: 'RESET' });
    emitter.emit('disconnect');
  }, [state.account, registry, emitter]);

  const switchChain = useCallback(async (chainId: number) => {
    if (!state.account) throw new Error('Not connected');
    const connector = await registry.getInstance(state.account.connectorId);
    await connector.switchChain(chainId);
    dispatch({
      type: 'SET_ACCOUNT',
      account: { ...state.account, chainId },
    });
    emitter.emit('chainChanged', chainId);
  }, [state.account, registry, emitter]);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.account) throw new Error('Not connected');
    const connector = await registry.getInstance(state.account.connectorId);
    return connector.signMessage(message);
  }, [state.account, registry]);

  const signTransaction = useCallback(async (tx: TransactionRequest): Promise<string> => {
    if (!state.account) throw new Error('Not connected');
    const connector = await registry.getInstance(state.account.connectorId);
    return connector.signTransaction(tx);
  }, [state.account, registry]);

  const openModal = useCallback(() => dispatch({ type: 'SET_MODAL_OPEN', isOpen: true }), []);
  const closeModal = useCallback(() => dispatch({ type: 'SET_MODAL_OPEN', isOpen: false }), []);

  const actions: CoinActions = useMemo(() => ({
    connect,
    disconnect,
    switchChain,
    signMessage,
    signTransaction,
    openModal,
    closeModal,
  }), [connect, disconnect, switchChain, signMessage, signTransaction, openModal, closeModal]);

  // ── Auto-connect from localStorage ──

  useEffect(() => {
    if (!autoConnect || typeof window === 'undefined') return;

    const saved = localStorage.getItem('cinacoin:lastConnector');
    if (saved && registry.get(saved)) {
      connect(saved).catch(() => {
        localStorage.removeItem('cinacoin:lastConnector');
      });
    }
  }, [autoConnect, registry, connect]);

  // Persist last connector
  useEffect(() => {
    if (state.account && typeof window !== 'undefined') {
      localStorage.setItem('cinacoin:lastConnector', state.account.connectorId);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('cinacoin:lastConnector');
    }
  }, [state.account]);

  // ── Cleanup ──

  useEffect(() => {
    return () => {
      registry.destroyAll();
    };
  }, [registry]);

  const value: CoinContextValue = useMemo(() => ({
    state,
    actions,
    connectors: registry,
  }), [state, actions, registry]);

  return (
    <CoinContext.Provider value={value}>
      {children}
    </CoinContext.Provider>
  );
}

// ============================================================================
// Hook: useCoinContext
// ============================================================================

export function useCoinContext(): CoinContextValue {
  const ctx = useContext(CoinContext);
  if (!ctx) {
    throw new Error('useCoinContext must be used within a <CoinProvider>');
  }
  return ctx;
}

export { CoinContext };
