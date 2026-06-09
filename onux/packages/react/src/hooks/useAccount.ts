/**
 * useAccount — get the current account state (address, balance, chainId).
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { address, balance, chainId, chainSymbol, ensName } = useAccount();
 * ```
 */

import { useCinacoinContext } from '../CinacoinProvider.js';
import type { AccountState } from '../CinacoinProvider.js';

/** Extended return value that flattens the account state. */
export interface UseAccountReturn extends AccountState {
  /** Whether an account is connected. */
  isConnected: boolean;
}

export function useAccount(): UseAccountReturn {
  const { account, status } = useCinacoinContext();
  return {
    ...account,
    isConnected: status === 'connected',
  };
}
