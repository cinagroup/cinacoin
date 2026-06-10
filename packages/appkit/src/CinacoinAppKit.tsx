/**
 * @cinacoin/appkit — 统一钱包连接弹窗组件
 * Main component: createCinacoinAppKit
 *
 *对标 Reown AppKit，提供一键式钱包连接弹窗 UI
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type {
  CinacoinAppKitConfig,
  CinacoinAppKitInstance,
  ConnectionState,
  ConnectedAccount,
  ThemeMode,
  ThemeVariables,
  ChainConfig,
  ConnectionStatus,
} from './types';
import { useConnection } from './hooks/useConnection';
import { useWallets } from './hooks/useWallets';
import { Modal } from './components/Modal';
import { WalletList } from './components/WalletList';
import { WalletSearch } from './components/WalletSearch';
import { ChainSelector } from './components/ChainSelector';
import { AccountPanel } from './components/AccountPanel';
import { QRCode } from './components/QRCode';

// ============================================================================
// Context
// ============================================================================

interface AppKitContextValue {
  config: CinacoinAppKitConfig;
  connection: ReturnType<typeof useConnection>;
  wallets: ReturnType<typeof useWallets>;
}

const AppKitContext = createContext<AppKitContextValue | null>(null);

/**
 * Hook to access the AppKit context from child components
 */
export function useCinacoinAppKit() {
  const ctx = useContext(AppKitContext);
  if (!ctx) {
    throw new Error('useCinacoinAppKit must be used within a CinacoinAppKit provider');
  }
  return ctx;
}

// ============================================================================
// Modal View Types
// ============================================================================

type ModalView = 'wallets' | 'connecting' | 'account' | 'chains' | 'qr';

// ============================================================================
// CinacoinAppKit Component
// ============================================================================

interface CinacoinAppKitComponentProps {
  config: CinacoinAppKitConfig;
}

/**
 * Internal React component that renders the AppKit modal
 */
function CinacoinAppKitComponent({ config }: CinacoinAppKitComponentProps) {
  const [currentView, setCurrentView] = useState<ModalView>('wallets');
  const [searchQuery, setSearchQuery] = useState('');

  const connection = useConnection({
    config,
    onConnect: () => {
      setCurrentView('account');
    },
    onDisconnect: () => {
      setCurrentView('wallets');
    },
  });

  const wallets = useWallets({
    config,
    searchQuery,
    connectingWalletId: connection.connectingWalletId,
  });

  // Auto-detect theme
  const effectiveTheme = useMemo<ThemeMode>(() => {
    if (config.themeMode === 'auto' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return config.themeMode ?? 'light';
  }, [config.themeMode]);

  // Sync connection state to view
  useEffect(() => {
    if (connection.status === 'connected' && connection.account) {
      setCurrentView('account');
    } else if (connection.status === 'connecting') {
      setCurrentView('connecting');
    } else if (connection.status === 'disconnected') {
      setCurrentView('wallets');
    }
  }, [connection.status, connection.account]);

  // ── View Renderers ──

  const renderWalletsView = () => (
    <div className="cinacoin-appkit-view">
      <WalletSearch value={searchQuery} onChange={setSearchQuery} />
      <WalletList
        wallets={wallets.displayed}
        recentWallets={wallets.recent}
        onSelect={(wallet) => {
          if (wallet.platforms.includes('mobile') || wallet.platforms.includes('desktop')) {
            setCurrentView('qr');
          } else {
            connection.connect(wallet.id);
          }
        }}
        isLoading={connection.isConnecting}
        connectingWalletId={connection.connectingWalletId}
      />
      {!searchQuery && wallets.featured.length > 0 && (
        <div className="cinacoin-appkit-section">
          <h3 className="cinacoin-appkit-section-title">Featured Wallets</h3>
          <WalletList
            wallets={wallets.featured}
            onSelect={(wallet) => connection.connect(wallet.id)}
          />
        </div>
      )}
      <div className="cinacoin-appkit-footer">
        <a href="https://cinacoin.com/docs" target="_blank" rel="noopener noreferrer">
          Don&apos;t have a wallet? Get started →
        </a>
      </div>
    </div>
  );

  const renderConnectingView = () => {
    const connectingWallet = wallets.displayed.find(
      w => w.id === connection.connectingWalletId
    );

    return (
      <div className="cinacoin-appkit-view cinacoin-appkit-view--connecting">
        <div className="cinacoin-appkit-spinner" />
        <p className="cinacoin-appkit-connecting-text">
          Connecting to {connectingWallet?.name ?? 'wallet'}...
        </p>
        <p className="cinacoin-appkit-connecting-subtext">
          Approve the connection in your wallet
        </p>
        {connection.wcUri && (
          <div className="cinacoin-appkit-qr-fallback">
            <button
              className="cinacoin-appkit-btn cinacoin-appkit-btn--secondary"
              onClick={() => setCurrentView('qr')}
            >
              Show QR Code
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAccountView = () => {
    if (!connection.account) return null;

    return (
      <div className="cinacoin-appkit-view">
        <AccountPanel
          account={connection.account}
          onDisconnect={() => {
            connection.disconnect();
          }}
          chains={config.chains}
          onSwitchChain={(chainId) => {
            connection.switchChain(chainId);
          }}
          onCopyAddress={() => {
            if (connection.account) {
              navigator.clipboard.writeText(connection.account.address);
            }
          }}
        />
        <div className="cinacoin-appkit-actions">
          <button
            className="cinacoin-appkit-btn cinacoin-appkit-btn--secondary"
            onClick={() => setCurrentView('chains')}
          >
            Switch Network
          </button>
          <button
            className="cinacoin-appkit-btn cinacoin-appkit-btn--secondary"
            onClick={() => {
              connection.disconnect();
              setCurrentView('wallets');
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  };

  const renderChainsView = () => (
    <div className="cinacoin-appkit-view">
      <ChainSelector
        chains={config.chains}
        selectedChainId={connection.account?.chainId ?? config.chains[0]?.id ?? 1}
        onSelect={(chainId) => {
          connection.switchChain(chainId);
          setCurrentView('account');
        }}
      />
      <div className="cinacoin-appkit-actions">
        <button
          className="cinacoin-appkit-btn cinacoin-appkit-btn--secondary"
          onClick={() => setCurrentView('account')}
        >
          Back
        </button>
      </div>
    </div>
  );

  const renderQrView = () => {
    if (!connection.wcUri) return null;

    return (
      <div className="cinacoin-appkit-view cinacoin-appkit-view--qr">
        <QRCode
          uri={connection.wcUri}
          size={240}
          logoUrl={config.metadata.icons[0]}
        />
        <p className="cinacoin-appkit-qr-text">
          Scan with your mobile wallet
        </p>
        <div className="cinacoin-appkit-actions">
          <button
            className="cinacoin-appkit-btn cinacoin-appkit-btn--secondary"
            onClick={() => setCurrentView('wallets')}
          >
            Back
          </button>
        </div>
      </div>
    );
  };

  const viewTitles: Record<ModalView, string> = {
    wallets: 'Connect Wallet',
    connecting: 'Connecting...',
    account: 'Account',
    chains: 'Switch Network',
    qr: 'Scan QR Code',
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'wallets': return renderWalletsView();
      case 'connecting': return renderConnectingView();
      case 'account': return renderAccountView();
      case 'chains': return renderChainsView();
      case 'qr': return renderQrView();
      default: return renderWalletsView();
    }
  };

  return (
    <AppKitContext.Provider value={{ config, connection, wallets }}>
      <Modal
        isOpen={connection.isOpen}
        onClose={() => {
          connection.close();
          setCurrentView('wallets');
        }}
        title={viewTitles[currentView]}
        themeMode={effectiveTheme}
        themeVariables={config.themeVariables}
      >
        <div
          className="cinacoin-appkit-content"
          style={config.themeVariables as React.CSSProperties}
        >
          {renderCurrentView()}
        </div>
      </Modal>
    </AppKitContext.Provider>
  );
}

// ============================================================================
// createCinacoinAppKit — Factory Function
// ============================================================================

/**
 * Create a CinacoinAppKit instance.
 *
 * @example
 * ```typescript
 * import { createCinacoinAppKit } from '@cinacoin/appkit';
 * import { mainnet, polygon } from '@cinacoin/core-sdk/chains';
 *
 * const appkit = createCinacoinAppKit({
 *   projectId: 'your-project-id',
 *   chains: [mainnet, polygon],
 *   metadata: {
 *     name: 'My App',
 *     description: 'My awesome dApp',
 *     url: 'https://myapp.com',
 *     icons: ['https://myapp.com/icon.png'],
 *   },
 *   themeMode: 'dark',
 * });
 *
 * // Use in React
 * function App() {
 *   return <appkit.Component />;
 * }
 *
 * // Or use imperatively
 * appkit.open();
 * ```
 */
export function createCinacoinAppKit(config: CinacoinAppKitConfig): CinacoinAppKitInstance {
  const subscribers = new Set<(state: ConnectionState) => void>();
  let lastState: ConnectionState = {
    status: 'disconnected',
    account: null,
    error: null,
    isOpen: false,
  };

  // Imperative API bridge
  const api = {
    open: () => {
      // Triggered via component ref
      openFn?.();
    },
    close: () => {
      closeFn?.();
    },
    getState: () => lastState,
    subscribe: (callback: (state: ConnectionState) => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    connect: async (walletId: string) => {
      openFn?.();
      // Connection handled by component
      return new Promise<ConnectedAccount>((resolve, reject) => {
        const unsub = subscribers.add((state) => {
          if (state.status === 'connected' && state.account) {
            unsub();
            resolve(state.account);
          } else if (state.status === 'error') {
            unsub();
            reject(new Error(state.error ?? 'Connection failed'));
          }
        });
      });
    },
    disconnect: async () => {
      disconnectFn?.();
    },
    switchChain: async (chainId: number) => {
      switchChainFn?.(chainId);
    },
    Component: () => <CinacoinAppKitComponent config={config} />,
  } as CinacoinAppKitInstance;

  // Imperative function refs (set by component mount)
  let openFn: (() => void) | null = null;
  let closeFn: (() => void) | null = null;
  let disconnectFn: (() => void) | null = null;
  let switchChainFn: ((chainId: number) => void) | null = null;

  // Mount imperative bridge component
  function ImperativeBridge() {
    const connection = useConnection({ config });

    useEffect(() => {
      openFn = () => connection.open();
      closeFn = () => connection.close();
      disconnectFn = () => connection.disconnect();
      switchChainFn = (chainId: number) => connection.switchChain(chainId);

      return () => {
        openFn = null;
        closeFn = null;
        disconnectFn = null;
        switchChainFn = null;
      };
    }, [connection]);

    // Notify subscribers
    useEffect(() => {
      const state: ConnectionState = {
        status: connection.status,
        account: connection.account,
        error: connection.error,
        isOpen: connection.isOpen,
      };
      lastState = state;
      subscribers.forEach(cb => cb(state));
    }, [connection.status, connection.account, connection.error, connection.isOpen]);

    return null;
  }

  // Enhanced component that includes the bridge
  const EnhancedComponent: () => ReactNode = () => (
    <>
      <CinacoinAppKitComponent config={config} />
      <ImperativeBridge />
    </>
  );

  api.Component = EnhancedComponent;

  return api;
}

// ============================================================================
// Standalone Provider Component
// ============================================================================

interface CinacoinAppKitProviderProps {
  config: CinacoinAppKitConfig;
  children?: ReactNode;
}

/**
 * Provider component for manual integration
 *
 * @example
 * ```tsx
 * <CinacoinAppKitProvider config={config}>
 *   <App />
 * </CinacoinAppKitProvider>
 * ```
 */
export function CinacoinAppKitProvider({ config, children }: CinacoinAppKitProviderProps) {
  return (
    <>
      <CinacoinAppKitComponent config={config} />
      {children}
    </>
  );
}

// ============================================================================
// CSS-in-JS: Inject base styles on module load
// ============================================================================

if (typeof document !== 'undefined') {
  const styleId = 'cinacoin-appkit-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .cinacoin-appkit-content {
        padding: 16px;
        min-height: 400px;
        display: flex;
        flex-direction: column;
      }
      .cinacoin-appkit-view {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 12px;
      }
      .cinacoin-appkit-view--connecting {
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .cinacoin-appkit-view--qr {
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      .cinacoin-appkit-section {
        margin-top: 8px;
      }
      .cinacoin-appkit-section-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--cc-muted, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }
      .cinacoin-appkit-footer {
        margin-top: auto;
        padding-top: 12px;
        text-align: center;
      }
      .cinacoin-appkit-footer a {
        font-size: 13px;
        color: var(--cc-link, #3b82f6);
        text-decoration: none;
      }
      .cinacoin-appkit-footer a:hover {
        text-decoration: underline;
      }
      .cinacoin-appkit-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--cc-hairline, #e5e7eb);
        border-top-color: var(--cc-accent, #3b82f6);
        border-radius: 50%;
        animation: cinacoin-spin 0.8s linear infinite;
      }
      @keyframes cinacoin-spin {
        to { transform: rotate(360deg); }
      }
      .cinacoin-appkit-connecting-text {
        font-size: 16px;
        font-weight: 500;
        color: var(--cc-ink, #111827);
        margin: 0;
      }
      .cinacoin-appkit-connecting-subtext {
        font-size: 13px;
        color: var(--cc-muted, #6b7280);
        margin: 4px 0 0;
      }
      .cinacoin-appkit-qr-text {
        font-size: 14px;
        color: var(--cc-body, #374151);
        text-align: center;
      }
      .cinacoin-appkit-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
      .cinacoin-appkit-btn {
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s, color 0.15s;
        border: 1px solid transparent;
        flex: 1;
      }
      .cinacoin-appkit-btn--secondary {
        background: var(--cc-canvas-soft, #f3f4f6);
        color: var(--cc-body, #374151);
        border-color: var(--cc-hairline, #e5e7eb);
      }
      .cinacoin-appkit-btn--secondary:hover {
        background: var(--cc-surface, #e5e7eb);
      }
      html[data-theme='dark'] .cinacoin-appkit-btn--secondary {
        background: var(--cc-surface, #1f2937);
        color: var(--cc-body, #d1d5db);
        border-color: var(--cc-hairline, #374151);
      }
      html[data-theme='dark'] .cinacoin-appkit-btn--secondary:hover {
        background: var(--cc-canvas-soft, #374151);
      }
    `;
    document.head.appendChild(style);
  }
}
