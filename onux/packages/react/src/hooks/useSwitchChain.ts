/**
 * useSwitchChain — switch the active chain.
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { switchChain, isSwitching } = useSwitchChain();
 *
 * <button onClick={() => switchChain(137)}>Switch to Polygon</button>
 * ```
 */

import { useState, useCallback } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';

/** Return value for useSwitchChain hook. */
export interface UseSwitchChainReturn {
  /** Switch to the given chain ID. */
  switchChain: (chainId: number) => Promise<void>;
  /** Whether a chain switch is in progress. */
  isSwitching: boolean;
  /** Error if the switch failed. */
  error: Error | null;
}

export function useSwitchChain(): UseSwitchChainReturn {
  const { switchChain: ctxSwitch, isSwitchingChain } = useCinacoinContext();
  const [error, setError] = useState<Error | null>(null);

  const doSwitch = useCallback(
    async (chainId: number): Promise<void> => {
      setError(null);
      try {
        await ctxSwitch(chainId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      }
    },
    [ctxSwitch],
  );

  return { switchChain: doSwitch, isSwitching: isSwitchingChain, error };
}
