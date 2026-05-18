import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { WalletManager } from '../WalletManager';
import { AuthMethod, EmbeddedWalletConfig, WalletSession } from '../types';

// ─── Context ─────────────────────────────────────────────────────────────────

interface EmbeddedWalletContextValue {
  wallet: WalletSession | null;
  loading: boolean;
  error: string | null;
  create: (authMethod: AuthMethod, identifier: string, label?: string) => Promise<WalletSession>;
  login: (identifier: string) => Promise<WalletSession>;
  logout: () => void;
  manager: WalletManager;
}

const EmbeddedWalletContext = createContext<EmbeddedWalletContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export interface EmbeddedWalletProviderProps {
  children: ReactNode;
  config: Omit<EmbeddedWalletConfig, 'createdAt'>;
  /** Auto-login with this identifier on mount. */
  autoLoginIdentifier?: string;
}

export function EmbeddedWalletProvider({
  children,
  config,
  autoLoginIdentifier,
}: EmbeddedWalletProviderProps): React.JSX.Element {
  const managerRef = useRef<WalletManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new WalletManager({
      ...config,
      createdAt: new Date().toISOString(),
    });
  }
  const manager = managerRef.current;

  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (authMethod: AuthMethod, identifier: string, label?: string) => {
      setLoading(true);
      setError(null);
      try {
        const session = await manager.create(authMethod, identifier, label);
        setWallet(session);
        return session;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [manager]
  );

  const login = useCallback(
    async (identifier: string) => {
      setLoading(true);
      setError(null);
      try {
        const session = await manager.login(identifier);
        setWallet(session);
        return session;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [manager]
  );

  const logout = useCallback(() => {
    manager.logout();
    setWallet(null);
    setError(null);
  }, [manager]);

  // Auto-login on mount
  useEffect(() => {
    if (autoLoginIdentifier) {
      void login(autoLoginIdentifier).catch(() => {
        // Silently ignore — error state is set
      });
    }
  }, [autoLoginIdentifier, login]);

  return (
    <EmbeddedWalletContext.Provider value={{ wallet, loading, error, create, login, logout, manager }}>
      {children}
    </EmbeddedWalletContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useEmbeddedWallet(): EmbeddedWalletContextValue {
  const ctx = useContext(EmbeddedWalletContext);
  if (!ctx) {
    throw new Error('useEmbeddedWallet must be used within an EmbeddedWalletProvider');
  }
  return ctx;
}
