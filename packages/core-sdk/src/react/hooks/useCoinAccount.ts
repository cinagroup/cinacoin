/**
 * useCoinAccount — Hook for wallet account state.
 *
 * 对标 wagmi's useAccount.
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const { address, chainId, isConnected, connector } = useCoinAccount();
 *
 *   if (!isConnected) return <div>Please connect your wallet</div>;
 *
 *   return (
 *     <div>
 *       <p>Address: {address}</p>
 *       <p>Chain: {chainId}</p>
 *       <p>Wallet: {connector?.name}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useCoinContext } from '../CoinProvider.js';
import type { ConnectedAccount } from '../CoinProvider.js';

export interface UseCoinAccountReturn {
  /** Connected account address, or undefined */
  address: string | undefined;
  /** Current chain ID */
  chainId: number | undefined;
  /** Whether a wallet is connected */
  isConnected: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Whether reconnecting */
  isReconnecting: boolean;
  /** Current connection status */
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  /** Full connected account object */
  account: ConnectedAccount | null;
  /** Connector ID */
  connectorId: string | undefined;
  /** Connector name */
  connectorName: string | undefined;
  /** Chain namespace (eip155, solana, bip122, etc.) */
  namespace: string | undefined;
  /** Truncated address for display */
  displayAddress: string | undefined;
}

function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function useCoinAccount(): UseCoinAccountReturn {
  const { state } = useCoinContext();

  return useMemo(() => {
    const account = state.account;
    const isConnected = state.status === 'connected' && account !== null;

    return {
      address: account?.address,
      chainId: account?.chainId,
      isConnected,
      isConnecting: state.status === 'connecting',
      isReconnecting: state.status === 'reconnecting',
      status: state.status,
      account,
      connectorId: account?.connectorId,
      connectorName: account?.connectorName,
      namespace: account?.namespace,
      displayAddress: account?.address ? truncateAddress(account.address) : undefined,
    };
  }, [state.account, state.status]);
}
