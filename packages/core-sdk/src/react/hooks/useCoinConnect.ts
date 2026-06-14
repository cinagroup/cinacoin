/**
 * useCoinConnect — Custom Hook for wallet connection operations.
 *
 * 对标 wagmi's useConnect/useDisconnect + Cinacoin's useAppKit.
 *
 * @example
 * ```tsx
 * function ConnectPanel() {
 *   const { connect, disconnect, switchChain, signMessage, isConnected, isConnecting } = useCoinConnect();
 *
 *   return (
 *     <div>
 *       <button onClick={() => connect('metamask')}>Connect MetaMask</button>
 *       <button onClick={disconnect}>Disconnect</button>
 *       <button onClick={() => switchChain(137)}>Switch to Polygon</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useCoinContext } from '../CoinProvider.js';
import type { ConnectorConfig } from '../CoinProvider.js';

export interface UseCoinConnectReturn {
  /** Connect to a wallet by connector ID */
  connect: (connectorId: string) => Promise<void>;
  /** Disconnect the current wallet */
  disconnect: () => Promise<void>;
  /** Switch to a different chain */
  switchChain: (chainId: number) => Promise<void>;
  /** Sign a message with the connected wallet */
  signMessage: (message: string) => Promise<string>;
  /** Sign a transaction */
  signTransaction: (tx: import('../../types.js').TransactionRequest) => Promise<string>;
  /** Open the wallet selection modal */
  openModal: () => void;
  /** Close the wallet modal */
  closeModal: () => void;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Whether currently connected */
  isConnected: boolean;
  /** Whether reconnecting */
  isReconnecting: boolean;
  /** Current error message */
  error: string | null;
  /** List of available connectors */
  connectors: ConnectorConfig[];
  /** Current connection status */
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
}

export function useCoinConnect(): UseCoinConnectReturn {
  const { state, actions, connectors } = useCoinContext();

  const connect = useCallback(async (connectorId: string) => {
    await actions.connect(connectorId);
  }, [actions]);

  const disconnect = useCallback(async () => {
    await actions.disconnect();
  }, [actions]);

  const switchChain = useCallback(async (chainId: number) => {
    await actions.switchChain(chainId);
  }, [actions]);

  const signMessage = useCallback(async (message: string) => {
    return actions.signMessage(message);
  }, [actions]);

  const signTransaction = useCallback(async (tx: import('../../types.js').TransactionRequest) => {
    return actions.signTransaction(tx);
  }, [actions]);

  return useMemo(() => ({
    connect,
    disconnect,
    switchChain,
    signMessage,
    signTransaction,
    openModal: actions.openModal,
    closeModal: actions.closeModal,
    isConnecting: state.status === 'connecting',
    isConnected: state.status === 'connected',
    isReconnecting: state.status === 'reconnecting',
    error: state.error,
    connectors: connectors.getAll(),
    status: state.status,
  }), [
    connect, disconnect, switchChain, signMessage, signTransaction,
    actions.openModal, actions.closeModal,
    state.status, state.error, connectors,
  ]);
}
