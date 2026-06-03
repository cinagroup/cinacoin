/**
 * useConnect — connect to a wallet by connector ID.
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { connect, status, isSwitchingChain } = useConnect();
 *
 * // Connect to MetaMask
 * <button onClick={() => connect('metamask')}>Connect</button>
 * ```
 */

import { useCinacoinContext } from '../CinacoinProvider.js';

/** Return value for useConnect hook. */
export interface UseConnectReturn {
  /** Connect to a wallet by connector ID. */
  connect: (connectorId: string) => Promise<void>;
  /** Current connection status. */
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Whether a chain switch is in progress. */
  isSwitchingChain: boolean;
}

export function useConnect(): UseConnectReturn {
  const { connect, status, isSwitchingChain } = useCinacoinContext();
  return { connect, status, isSwitchingChain };
}
