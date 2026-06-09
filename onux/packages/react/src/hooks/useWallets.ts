/**
 * useWallets — get list of available wallet connectors.
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { wallets, connectors } = useWallets();
 *
 * // Render wallet list
 * wallets.map(wallet => (
 *   <button key={wallet.id} onClick={() => connect(wallet.id)}>
 *     {wallet.name}
 *   </button>
 * ));
 * ```
 */

import { useMemo } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';
import type { Connector } from '../CinacoinProvider.js';

/** Wallet entry with computed fields. */
export interface WalletEntry extends Connector {
  /** Whether this wallet is currently installed/available. */
  available: boolean;
  /** Whether this wallet is the currently connected wallet. */
  isActive: boolean;
}

/** Return value for useWallets hook. */
export interface UseWalletsReturn {
  /** Enhanced list of wallet connectors. */
  wallets: WalletEntry[];
  /** Raw connector list from context. */
  connectors: Connector[];
  /** Whether any wallets are available. */
  hasWallets: boolean;
  /** Get a connector by ID. */
  getConnector: (id: string) => Connector | undefined;
}

export function useWallets(): UseWalletsReturn {
  const { connectors, account, status } = useCinacoinContext();

  const wallets = useMemo<WalletEntry[]>(() => {
    return connectors.map((connector) => ({
      ...connector,
      available: connector.installed ?? true,
      isActive: status === 'connected' && connector.id === account.address?.slice(0, 6),
    }));
  }, [connectors, account.address, status]);

  const getConnector = (id: string): Connector | undefined => {
    return connectors.find((c) => c.id === id);
  };

  return {
    wallets,
    connectors,
    hasWallets: connectors.length > 0,
    getConnector,
  };
}
