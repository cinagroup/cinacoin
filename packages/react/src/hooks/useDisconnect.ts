/**
 * useDisconnect — disconnect the current wallet.
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { disconnect } = useDisconnect();
 *
 * <button onClick={() => disconnect()}>Disconnect</button>
 * ```
 */

import { useState } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';

/** Return value for useDisconnect hook. */
export interface UseDisconnectReturn {
  /** Disconnect the current wallet. */
  disconnect: () => Promise<void>;
  /** Whether a disconnect is in progress. */
  isPending: boolean;
  /** Error if disconnect failed. */
  error: Error | null;
}

export function useDisconnect(): UseDisconnectReturn {
  const { disconnect: ctxDisconnect } = useCinacoinContext();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const disconnect = async (): Promise<void> => {
    setIsPending(true);
    setError(null);
    try {
      await ctxDisconnect();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  return { disconnect, isPending, error };
}
