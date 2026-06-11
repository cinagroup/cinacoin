/**
 * useCoinBalance — Hook for querying wallet balance.
 *
 * 对标 wagmi's useBalance.
 *
 * @example
 * ```tsx
 * function BalanceDisplay() {
 *   const { balance, isLoading, error, refetch } = useCoinBalance();
 *
 *   if (isLoading) return <span>Loading...</span>;
 *   if (error) return <span>Error: {error}</span>;
 *
 *   return <span>{balance?.formatted} {balance?.symbol}</span>;
 * }
 *
 * // With token address (ERC-20):
 * const { balance } = useCoinBalance({
 *   token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCoinContext } from '../CoinProvider.js';

// ============================================================================
// Types
// ============================================================================

export interface BalanceData {
  /** Raw balance in smallest unit (wei, lamports, satoshis) */
  value: bigint;
  /** Formatted balance with decimals */
  formatted: string;
  /** Currency symbol (ETH, SOL, BTC) */
  symbol: string;
  /** Number of decimals */
  decimals: number;
  /** Token address (for ERC-20/SPL tokens) */
  tokenAddress?: string;
}

export interface UseCoinBalanceOptions {
  /** Token contract address for ERC-20/SPL balance queries */
  token?: string;
  /** Chain ID override (defaults to connected chain) */
  chainId?: number;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Whether to enable the query */
  enabled?: boolean;
}

export interface UseCoinBalanceReturn {
  /** Balance data */
  balance: BalanceData | null;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Error message if query failed */
  error: string | null;
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
}

// ============================================================================
// ERC-20 ABI fragment for balanceOf
// ============================================================================

const ERC20_BALANCE_OF_SELECTOR = '0x70a08231';

function encodeBalanceOf(address: string): string {
  const padded = address.toLowerCase().replace('0x', '').padStart(64, '0');
  return `${ERC20_BALANCE_OF_SELECTOR}${padded}`;
}

// ============================================================================
// Hook
// ============================================================================

export function useCoinBalance(options: UseCoinBalanceOptions = {}): UseCoinBalanceReturn {
  const { token, chainId: overrideChainId, refreshInterval = 0, enabled = true } = options;
  const { state } = useCoinContext();

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chainId = overrideChainId ?? state.account?.chainId;
  const address = state.account?.address;
  const isConnected = state.status === 'connected';

  const fetchBalance = useCallback(async () => {
    if (!enabled || !isConnected || !address || !chainId) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Find chain config
      const chain = state.chains.find(c => {
        const ref = c.id.split(':')[1] || c.id;
        return parseInt(ref, 10) === chainId || c.id === `eip155:${chainId}`;
      });

      if (!chain) {
        throw new Error(`Chain ${chainId} not found in configuration`);
      }

      const namespace = chain.id.split(':')[0] || 'eip155';

      if (namespace === 'eip155') {
        // EVM balance query
        const response = await fetch(chain.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: token ? 'eth_call' : 'eth_getBalance',
            params: token
              ? [{ to: token, data: encodeBalanceOf(address) }, 'latest']
              : [address, 'latest'],
          }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const rawValue = BigInt(data.result || '0x0');
        const decimals = token ? 18 : (chain.nativeCurrency?.decimals ?? 18);
        const symbol = token ? 'TOKEN' : (chain.nativeCurrency?.symbol ?? 'ETH');

        setBalance({
          value: rawValue,
          formatted: formatUnits(rawValue, decimals),
          symbol,
          decimals,
          tokenAddress: token,
        });
      } else if (namespace === 'solana') {
        // Solana balance query
        const response = await fetch(chain.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [address],
          }),
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const lamports = BigInt(data.result?.value || '0');
        setBalance({
          value: lamports,
          formatted: formatUnits(lamports, 9),
          symbol: 'SOL',
          decimals: 9,
        });
      } else if (namespace === 'bip122') {
        // Bitcoin balance query (simplified — uses blockstream API)
        const explorerApi = chain.explorerUrl?.replace('/#/', '/api/');
        if (explorerApi) {
          const response = await fetch(`${explorerApi}/address/${address}`);
          const data = await response.json();

          const funded = data.chain_stats?.funded_txo_sum || 0;
          const spent = data.chain_stats?.spent_txo_sum || 0;
          const sats = BigInt(funded - spent);

          setBalance({
            value: sats,
            formatted: formatUnits(sats, 8),
            symbol: 'BTC',
            decimals: 8,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isConnected, address, chainId, state.chains, token]);

  // Initial fetch and refetch on dependency change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && isConnected) {
      timerRef.current = setInterval(fetchBalance, refreshInterval);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    return undefined;
  }, [refreshInterval, isConnected, fetchBalance]);

  return useMemo(() => ({
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  }), [balance, isLoading, error, fetchBalance]);
}

// ============================================================================
// Helpers
// ============================================================================

function formatUnits(value: bigint, decimals: number): string {
  const str = value.toString();
  if (str.length <= decimals) {
    const padded = str.padStart(decimals + 1, '0');
    const int = padded.slice(0, padded.length - decimals);
    const frac = padded.slice(padded.length - decimals).replace(/0+$/, '');
    return frac ? `${int}.${frac}` : int;
  }
  const int = str.slice(0, str.length - decimals);
  const frac = str.slice(str.length - decimals).replace(/0+$/, '');
  return frac ? `${int}.${frac.slice(0, 6)}` : int;
}
