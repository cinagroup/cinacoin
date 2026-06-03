/**
 * useBalance — fetch the native token balance for an address.
 *
 * Defaults to the connected account when no address is provided.
 * Auto-refreshes when the connected account changes.
 *
 * Requires being used within <CinacoinProvider>.
 *
 * ```tsx
 * const { balance, isLoading } = useBalance();
 * const { balance: otherBalance } = useBalance('0x...');
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useCinacoinContext } from '../CinacoinProvider.js';

/** Return value for useBalance hook. */
export interface UseBalanceReturn {
  /** Balance as a decimal string (e.g. "1.234"). */
  balance: string | null;
  /** Whether a fetch is in progress. */
  isLoading: boolean;
  /** Error if the fetch failed. */
  error: Error | null;
  /** Re-fetch balance. */
  refetch: () => Promise<void>;
}

export function useBalance(
  address?: string,
  chainId?: number,
): UseBalanceReturn {
  const { account, request: ctxRequest } = useCinacoinContext();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const targetAddress = address ?? account.address;
  const targetChainId = chainId ?? account.chainId;

  const fetchBalance = useCallback(async () => {
    if (!targetAddress || !targetChainId) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hexBalance = await ctxRequest<string>('eth_getBalance', [
        targetAddress,
        'latest',
      ]);

      // Convert wei to ether
      const wei = BigInt(hexBalance);
      const ether = Number(wei) / 1e18;
      setBalance(ether.toFixed(6));
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress, targetChainId, ctxRequest]);

  // Auto-fetch when address/chain changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
}
