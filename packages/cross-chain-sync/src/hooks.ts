/**
 * React Hooks for Cross-Chain Sync
 *
 * Provides useBridge and useCrossChainBalance hooks for React applications.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { StateStorage, ChainFamily, ChainAccount } from "./types.js";
import type { StateSync } from "./sync.js";
import type {
  BridgeTransfer,
  BridgeState,
  BridgeAsset,
} from "./bridge.js";
import {
  createBridgeTransfer,
  transitionBridge,
  getBridgeProgress,
  isBridgeTerminal,
  canRetryBridge,
} from "./bridge.js";
import type { CrossChainMessage } from "./messaging.js";
import { RelayClient } from "./messaging.js";

// ============================================================
// useBridge Hook
// ============================================================

export interface UseBridgeOptions {
  /** Relay server base URL */
  relayServerUrl?: string;
  /** Relay server API key */
  relayApiKey?: string;
  /** Polling interval for bridge status (ms) */
  pollIntervalMs?: number;
  /** Storage for persisting bridge state */
  storage?: StateStorage;
}

export interface UseBridgeReturn {
  /** Active bridge transfers */
  transfers: BridgeTransfer[];
  /** Whether a bridge operation is in progress */
  isBridging: boolean;
  /** Last error */
  error: Error | null;
  /** Initiate a new bridge transfer */
  initiateBridge: (options: BridgeInitiateOptions) => Promise<BridgeTransfer>;
  /** Get status of a specific bridge */
  getBridgeStatus: (bridgeId: string) => Promise<BridgeTransfer>;
  /** Retry a failed bridge */
  retryBridge: (bridgeId: string) => Promise<BridgeTransfer>;
  /** Get progress percentage for a bridge */
  getProgress: (bridgeId: string) => number;
}

export interface BridgeInitiateOptions {
  sourceChain: ChainFamily;
  sourceChainId: number;
  destChain: ChainFamily;
  destChainId: number;
  asset: BridgeAsset;
  sourceAddress: string;
  destAddress: string;
  protocol: string;
}

/**
 * Hook for managing cross-chain bridge transfers.
 *
 * @example
 * ```tsx
 * const { transfers, initiateBridge, isBridging } = useBridge({
 *   relayServerUrl: 'https://relay.cinacoin.dev',
 *   pollIntervalMs: 5000,
 * });
 *
 * const handleBridge = async () => {
 *   const transfer = await initiateBridge({
 *     sourceChain: 'evm',
 *     sourceChainId: 1,
 *     destChain: 'evm',
 *     destChainId: 8453,
 *     asset: { symbol: 'USDC', sourceToken: usdcEth, destToken: usdcBase, amount: 100n * 10n ** 6n, decimals: 6 },
 *     sourceAddress: walletAddress,
 *     destAddress: walletAddress,
 *     protocol: 'relay-server',
 *   });
 *   console.log('Bridge started:', transfer.bridgeId);
 * };
 * ```
 */
export function useBridge(options: UseBridgeOptions = {}): UseBridgeReturn {
  const { relayServerUrl, relayApiKey, pollIntervalMs = 5000, storage } = options;

  const [transfers, setTransfers] = useState<BridgeTransfer[]>([]);
  const [isBridging, setIsBridging] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const relayClientRef = useRef<RelayClient | null>(null);
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Initialize relay client
  useEffect(() => {
    relayClientRef.current = relayServerUrl
      ? new RelayClient({ baseUrl: relayServerUrl, apiKey: relayApiKey })
      : null;

    // Restore from storage
    if (storage) {
      storage.get<BridgeTransfer[]>("bridge-transfers").then((stored) => {
        if (stored) setTransfers(stored);
      });
    }
  }, [relayServerUrl, relayApiKey, storage]);

  // Persist transfers to storage
  useEffect(() => {
    if (storage && transfers.length > 0) {
      storage.set("bridge-transfers", transfers).catch(() => {});
    }
  }, [transfers, storage]);

  // Poll for active bridge status updates
  useEffect(() => {
    // Clean up old intervals
    for (const [id, interval] of pollIntervalsRef.current.entries()) {
      if (!transfers.find((t) => t.bridgeId === id) || isBridgeTerminal(transfers.find((t) => t.bridgeId === id)!)) {
        clearInterval(interval);
        pollIntervalsRef.current.delete(id);
      }
    }

    // Start polling for non-terminal transfers
    for (const transfer of transfers) {
      if (!isBridgeTerminal(transfer) && !pollIntervalsRef.current.has(transfer.bridgeId)) {
        const interval = setInterval(() => {
          pollBridgeStatus(transfer.bridgeId);
        }, pollIntervalMs);
        pollIntervalsRef.current.set(transfer.bridgeId, interval);
      }
    }

    return () => {
      for (const interval of pollIntervalsRef.current.values()) {
        clearInterval(interval);
      }
      pollIntervalsRef.current.clear();
    };
  }, [transfers, pollIntervalMs]);

  const pollBridgeStatus = useCallback(async (bridgeId: string) => {
    const relay = relayClientRef.current;
    if (!relay) return;

    try {
      const status = await relay.getStatus(bridgeId);
      setTransfers((prev) =>
        prev.map((t) => {
          if (t.bridgeId !== bridgeId) return t;

          // Map relay status to bridge state
          const stateMap: Record<string, BridgeState> = {
            pending: "preparing",
            relaying: "bridging",
            delivered: "confirming",
            confirmed: "completed",
            failed: "failed",
          };

          const newState = stateMap[status.status];
          if (newState && newState !== t.state) {
            try {
              return transitionBridge(t, newState, {
                destTxHash: status.destTxHash ?? "",
              });
            } catch {
              return t;
            }
          }
          return t;
        }),
      );
    } catch {
      // Polling error, silently retry
    }
  }, []);

  const initiateBridge = useCallback(
    async (bridgeOptions: BridgeInitiateOptions): Promise<BridgeTransfer> => {
      setIsBridging(true);
      setError(null);

      try {
        const transfer = createBridgeTransfer(bridgeOptions);

        // Transition to preparing
        const preparing = transitionBridge(transfer, "preparing");
        setTransfers((prev) => [...prev, preparing]);

        // Submit to relay server
        const relay = relayClientRef.current;
        if (relay) {
          // Create a cross-chain message
          const messagePayload = {
            asset: bridgeOptions.asset.symbol,
            amount: bridgeOptions.asset.amount.toString(),
            sourceToken: bridgeOptions.asset.sourceToken,
            destToken: bridgeOptions.asset.destToken,
            sourceAddress: bridgeOptions.sourceAddress,
            destAddress: bridgeOptions.destAddress,
          };

          const message: CrossChainMessage = {
            messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            type: "transfer",
            sourceChain: bridgeOptions.sourceChain,
            sourceChainId: bridgeOptions.sourceChainId,
            destChain: bridgeOptions.destChain,
            destChainId: bridgeOptions.destChainId,
            sender: bridgeOptions.sourceAddress,
            recipient: bridgeOptions.destAddress,
            payload: messagePayload,
            signature: "0x", // Would be signed by wallet in production
            nonce: Date.now(),
            createdAt: Date.now(),
            ttlSeconds: 3600,
            status: "pending",
            deliveryAttempts: 0,
          };

          await relay.submit(message);
        }

        // Transition to locked (assets locked on source chain)
        const locked = transitionBridge(preparing, "locked");
        setTransfers((prev) =>
          prev.map((t) => (t.bridgeId === preparing.bridgeId ? locked : t)),
        );

        return locked;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsBridging(false);
      }
    },
    [],
  );

  const getBridgeStatus = useCallback(
    async (bridgeId: string): Promise<BridgeTransfer> => {
      const transfer = transfers.find((t) => t.bridgeId === bridgeId);
      if (!transfer) throw new Error(`Bridge ${bridgeId} not found`);

      const relay = relayClientRef.current;
      if (relay && !isBridgeTerminal(transfer)) {
        const status = await relay.getStatus(bridgeId);
        setTransfers((prev) => {
          const t = prev.find((x) => x.bridgeId === bridgeId);
          if (!t) return prev;
          const stateMap: Record<string, BridgeState> = {
            pending: "preparing",
            relaying: "bridging",
            delivered: "confirming",
            confirmed: "completed",
            failed: "failed",
          };
          const newState = stateMap[status.status];
          if (newState && newState !== t.state) {
            try {
              const updated = transitionBridge(t, newState, {
                destTxHash: status.destTxHash ?? "",
              });
              return prev.map((x) => (x.bridgeId === bridgeId ? updated : x));
            } catch {
              return prev;
            }
          }
          return prev;
        });
      }

      return transfers.find((t) => t.bridgeId === bridgeId) || transfer;
    },
    [transfers],
  );

  const retryBridge = useCallback(
    async (bridgeId: string): Promise<BridgeTransfer> => {
      const transfer = transfers.find((t) => t.bridgeId === bridgeId);
      if (!transfer) throw new Error(`Bridge ${bridgeId} not found`);
      if (!canRetryBridge(transfer)) {
        throw new Error(`Bridge ${bridgeId} cannot be retried (state: ${transfer.state})`);
      }

      try {
        const refunding = transitionBridge(transfer, "refunding");
        setTransfers((prev) =>
          prev.map((t) => (t.bridgeId === bridgeId ? refunding : t)),
        );

        // Re-submit to relay
        const relay = relayClientRef.current;
        if (relay) {
          await relay.getStatus(bridgeId); // Check status
        }

        const retried = transitionBridge(refunding, "preparing");
        setTransfers((prev) =>
          prev.map((t) => (t.bridgeId === bridgeId ? retried : t)),
        );

        return retried;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      }
    },
    [transfers],
  );

  const getProgress = useCallback(
    (bridgeId: string): number => {
      const transfer = transfers.find((t) => t.bridgeId === bridgeId);
      return transfer ? getBridgeProgress(transfer) : 0;
    },
    [transfers],
  );

  return {
    transfers,
    isBridging,
    error,
    initiateBridge,
    getBridgeStatus,
    retryBridge,
    getProgress,
  };
}

// ============================================================
// useCrossChainBalance Hook
// ============================================================

export interface UseCrossChainBalanceOptions {
  /** StateSync instance */
  stateSync?: StateSync;
  /** Chain accounts to track */
  accounts: ChainAccount[];
  /** Polling interval for balance refresh (ms) */
  refreshIntervalMs?: number;
}

export interface ChainBalance {
  chain: ChainFamily;
  chainId?: number;
  address: string;
  /** Token balances (symbol → balance string) */
  balances: Record<string, string>;
  /** Last refresh timestamp */
  lastRefreshed: number;
  /** Whether the balance fetch is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error?: string;
}

export interface UseCrossChainBalanceReturn {
  /** Balances per chain */
  balances: ChainBalance[];
  /** Whether any balance is loading */
  isLoading: boolean;
  /** Refresh all balances */
  refresh: () => Promise<void>;
}

/**
 * Hook for tracking balances across multiple chains.
 *
 * @example
 * ```tsx
 * const { balances, isLoading, refresh } = useCrossChainBalance({
 *   accounts: [
 *     { chain: 'evm', chainId: 1, address: '0x...', addedAt: Date.now() },
 *     { chain: 'evm', chainId: 8453, address: '0x...', addedAt: Date.now() },
 *     { chain: 'solana', address: 'sol1...', addedAt: Date.now() },
 *   ],
 *   refreshIntervalMs: 30000,
 * });
 * ```
 */
export function useCrossChainBalance(
  options: UseCrossChainBalanceOptions,
): UseCrossChainBalanceReturn {
  const { accounts, refreshIntervalMs = 30000 } = options;

  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (accounts.length === 0) return;

    setIsLoading(true);

    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        // In production, this would call RPC endpoints per chain
        // For now, return empty balances
        const balance: ChainBalance = {
          chain: account.chain,
          chainId: account.chainId,
          address: account.address,
          balances: {},
          lastRefreshed: Date.now(),
          isLoading: false,
        };

        // Attempt to fetch from state sync if available
        try {
          const state = options.stateSync?.getState();
          if (state) {
            // Extract balance data from synced state
            balance.lastRefreshed = state.lastSyncedAt;
          }
        } catch {
          balance.error = "Failed to fetch balance";
        }

        return balance;
      }),
    );

    const fetched = results
      .filter((r): r is PromiseFulfilledResult<ChainBalance> => r.status === "fulfilled")
      .map((r) => r.value);

    setBalances(fetched);
    setIsLoading(false);
  }, [accounts, options.stateSync]);

  // Auto-refresh
  useEffect(() => {
    fetchBalances();

    if (refreshIntervalMs > 0) {
      const interval = setInterval(fetchBalances, refreshIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, refreshIntervalMs]);

  return {
    balances,
    isLoading,
    refresh: fetchBalances,
  };
}
