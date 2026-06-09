/**
 * React Hooks for Cross-Chain Bridge
 *
 * Provides hooks for bridge transfers, status, history, and fees:
 *   - useBridgeTransfer: Create and execute bridge transfers
 *   - useBridgeStatus: Query and poll bridge status
 *   - useBridgeHistory: Query bridge transfer history
 *   - useBridgeFee: Estimate bridge fees
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type {
  BridgeFeeEstimate,
  BridgeLifecycleState,
  BridgeRoute,
  BridgeTransferRecord,
  BridgeTransferResult,
  CreateBridgeTransferOptions,
} from "./types";
import { BridgeEngine } from "./bridge-engine";
import type { BridgeEngineOptions, BridgeCreateOptions } from "./bridge-engine";
import { BridgeStateManager } from "./bridge-state-manager";
import { getActiveRoutes, getRoute, isSupportedPair } from "./bridge-routes";

// ============================================================
// useBridgeTransfer
// ============================================================

export interface UseBridgeTransferOptions extends BridgeEngineOptions {
  /** Whether to auto-execute after creation */
  autoExecute?: boolean;
}

export interface UseBridgeTransferReturn {
  /** Create a new bridge transfer */
  createTransfer: (options: CreateBridgeTransferOptions) => Promise<BridgeTransferRecord>;
  /** Execute a bridge transfer */
  executeTransfer: (transferId: string) => Promise<BridgeTransferRecord>;
  /** Whether a transfer is being created */
  isCreating: boolean;
  /** Whether a transfer is being executed */
  isExecuting: boolean;
  /** Last created transfer */
  lastTransfer: BridgeTransferRecord | null;
  /** Last error */
  error: Error | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for creating and executing bridge transfers.
 *
 * @example
 * ```tsx
 * const { createTransfer, executeTransfer, isCreating, isExecuting, lastTransfer, error } = useBridgeTransfer({
 *   relayServerUrl: 'http://localhost:3001',
 *   autoExecute: false,
 * });
 *
 * const handleBridge = async () => {
 *   const transfer = await createTransfer({
 *     fromChain: 'eth',
 *     toChain: 'arbitrum',
 *     amount: '1',
 *     token: 'ETH',
 *     recipient: '0x...',
 *     sender: '0x...',
 *   });
 *
 *   await executeTransfer(transfer.transferId);
 * };
 * ```
 */
export function useBridgeTransfer(
  options: UseBridgeTransferOptions = {},
): UseBridgeTransferReturn {
  const { autoExecute = false, ...engineOptions } = options;

  const engineRef = useRef<BridgeEngine | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastTransfer, setLastTransfer] = useState<BridgeTransferRecord | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize engine
  if (!engineRef.current) {
    const sm = (engineOptions as BridgeEngineOptions).stateManager;
    engineRef.current = new BridgeEngine(sm);
  }

  const createTransfer = useCallback(
    async (createOptions: CreateBridgeTransferOptions): Promise<BridgeTransferRecord> => {
      setIsCreating(true);
      setError(null);

      try {
        const result: BridgeTransferResult = await engineRef.current!.createBridgeTransfer(createOptions);
        const record = result.transfer;
        if (!record) throw new Error("createBridgeTransfer did not return a transfer record");
        setLastTransfer(record);

        // Auto-execute if configured
        if (autoExecute) {
          const executed = await engineRef.current!.executeBridgeTransfer(
            record.transferId,
          );
          setLastTransfer(executed);
          return executed;
        }

        return record;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsCreating(false);
      }
    },
    [autoExecute],
  );

  const executeTransfer = useCallback(
    async (transferId: string): Promise<BridgeTransferRecord> => {
      setIsExecuting(true);
      setError(null);

      try {
        const executed = await engineRef.current!.executeBridgeTransfer(transferId);
        setLastTransfer(executed);
        return executed;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsExecuting(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    createTransfer,
    executeTransfer,
    isCreating,
    isExecuting,
    lastTransfer,
    error,
    clearError,
  };
}

// ============================================================
// useBridgeStatus
// ============================================================

export interface UseBridgeStatusOptions {
  /** Relay server URL */
  relayServerUrl?: string;
  /** Polling interval in ms */
  pollIntervalMs?: number;
  /** Whether to enable polling */
  enabled?: boolean;
}

export interface UseBridgeStatusReturn {
  /** Current transfer status */
  transfer: BridgeTransferRecord | null;
  /** Current state */
  state: BridgeLifecycleState | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the transfer is loading */
  isLoading: boolean;
  /** Last error */
  error: Error | null;
  /** Refresh status manually */
  refresh: () => Promise<void>;
  /** Estimated remaining time */
  estimatedRemainingSeconds: number | null;
}

/** Progress map for bridge states */
const STATE_PROGRESS: Record<BridgeLifecycleState, number> = {
  initiated: 0,
  confirming: 15,
  locking: 35,
  minting: 70,
  completed: 100,
  failed: -1,
  expired: -1,
  refunded: -1,
};

/**
 * Hook for querying and polling bridge transfer status.
 *
 * @example
 * ```tsx
 * const { transfer, state, progress, isLoading, refresh } = useBridgeStatus({
 *   transferId: 'bridge-abc123',
 *   pollIntervalMs: 5000,
 *   enabled: true,
 * });
 * ```
 */
export function useBridgeStatus(
  transferId: string,
  options: UseBridgeStatusOptions = {},
): UseBridgeStatusReturn {
  const { relayServerUrl, pollIntervalMs = 5000, enabled = true } = options;

  const stateManagerRef = useRef<BridgeStateManager | null>(null);
  const [transfer, setTransfer] = useState<BridgeTransferRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize state manager
  if (!stateManagerRef.current) {
    stateManagerRef.current = new BridgeStateManager();
  }

  const fetchStatus = useCallback(async () => {
    if (!transferId) return;

    try {
      const t = await stateManagerRef.current!.getTransfer(transferId);
      setTransfer(t);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [transferId]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling
  useEffect(() => {
    if (!enabled || !transferId) return;

    const interval = setInterval(() => {
      const t = stateManagerRef.current!;
      t.getTransfer(transferId).then((result) => {
        setTransfer(result);

        // Stop polling when terminal
        if (result && (result.state === "completed" || result.state === "refunded" || result.state === "failed")) {
          setIsLoading(false);
        }
      }).catch(() => {});
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [transferId, enabled, pollIntervalMs]);

  const state = transfer?.state ?? null;
  const progress = transfer ? STATE_PROGRESS[transfer.state] ?? 0 : 0;

  // Estimated remaining time
  const estimatedRemainingSeconds = useMemo(() => {
    if (!transfer || transfer.state === "completed" || transfer.state === "failed" || transfer.state === "refunded") {
      return null;
    }

    const route = getRoute(transfer.fromChain, transfer.toChain);
    if (!route) return null;

    const elapsed = (Date.now() - transfer.createdAt) / 1000;
    const remaining = route.estimatedTimeSeconds - elapsed;
    return Math.max(0, remaining);
  }, [transfer]);

  return {
    transfer,
    state,
    progress,
    isLoading,
    error,
    refresh: fetchStatus,
    estimatedRemainingSeconds,
  };
}

// ============================================================
// useBridgeHistory
// ============================================================

export interface UseBridgeHistoryOptions {
  /** Relay server URL */
  relayServerUrl?: string;
  /** Filter by state */
  stateFilter?: BridgeLifecycleState;
  /** Maximum number of records */
  limit?: number;
}

export interface UseBridgeHistoryReturn {
  /** Bridge transfer history */
  history: BridgeTransferRecord[];
  /** Whether history is loading */
  isLoading: boolean;
  /** Last error */
  error: Error | null;
  /** Refresh history */
  refresh: () => Promise<void>;
}

/**
 * Hook for querying bridge transfer history.
 *
 * @example
 * ```tsx
 * const { history, isLoading, refresh } = useBridgeHistory({
 *   address: '0x...',
 *   stateFilter: 'completed',
 *   limit: 50,
 * });
 * ```
 */
export function useBridgeHistory(
  address: string,
  options: UseBridgeHistoryOptions = {},
): UseBridgeHistoryReturn {
  const { stateFilter, limit = 50 } = options;

  const stateManagerRef = useRef<BridgeStateManager | null>(null);
  const [history, setHistory] = useState<BridgeTransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize state manager
  if (!stateManagerRef.current) {
    stateManagerRef.current = new BridgeStateManager();
  }

  const fetchHistory = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      let transfers: BridgeTransferRecord[];

      if (stateFilter) {
        transfers = await stateManagerRef.current!.getTransfersByState(stateFilter);
        transfers = transfers.filter(
          (t) =>
            t.sender.toLowerCase() === address.toLowerCase() ||
            t.recipient.toLowerCase() === address.toLowerCase(),
        );
      } else {
        transfers = await stateManagerRef.current!.getTransfersByAddress(address);
      }

      // Apply limit and sort by createdAt desc
      transfers = transfers
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);

      setHistory(transfers);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [address, stateFilter, limit]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refresh: fetchHistory,
  };
}

// ============================================================
// useBridgeFee
// ============================================================

export interface UseBridgeFeeOptions {
  /** Relay server URL */
  relayServerUrl?: string;
}

export interface UseBridgeFeeReturn {
  /** Fee estimate */
  estimate: BridgeFeeEstimate | null;
  /** Whether estimate is loading */
  isLoading: boolean;
  /** Last error */
  error: Error | null;
  /** Route info */
  route: BridgeRoute | null;
  /** Whether the pair is supported */
  isSupported: boolean;
}

/**
 * Hook for estimating bridge fees.
 *
 * @example
 * ```tsx
 * const { estimate, isLoading, route, isSupported } = useBridgeFee(
 *   'eth',
 *   'arbitrum',
 *   1n * 10n ** 18n, // 1 ETH
 *   'ETH',
 * );
 * ```
 */
export function useBridgeFee(
  fromChain: string,
  toChain: string,
  amount: bigint,
  tokenSymbol: string = "ETH",
  options: UseBridgeFeeOptions = {},
): UseBridgeFeeReturn {
  const engineRef = useRef<BridgeEngine | null>(null);
  const [estimate, setEstimate] = useState<BridgeFeeEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize engine
  if (!engineRef.current) {
    const sm = (options as BridgeEngineOptions).stateManager;
    engineRef.current = new BridgeEngine(sm);
  }

  // Compute route info
  const routeInfo = useMemo(
    () => getRoute(fromChain, toChain) ?? null,
    [fromChain, toChain],
  );

  const supported = useMemo(
    () => isSupportedPair(fromChain, toChain),
    [fromChain, toChain],
  );

  useEffect(() => {
    if (!supported || amount <= 0n) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    engineRef.current!
      .estimateBridgeFee(fromChain, toChain, amount, tokenSymbol)
      .then((fee) => {
        setEstimate(fee);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fromChain, toChain, amount, tokenSymbol, supported]);

  return {
    estimate,
    isLoading,
    error,
    route: routeInfo,
    isSupported: supported,
  };
}

// ============================================================
// useBridgeRoutes (bonus: get available routes)
// ============================================================

export interface UseBridgeRoutesReturn {
  /** All active routes */
  routes: BridgeRoute[];
  /** Routes from a specific chain */
  fromChain: (chain: string) => BridgeRoute[];
  /** Routes to a specific chain */
  toChain: (chain: string) => BridgeRoute[];
}

/**
 * Hook for accessing available bridge routes.
 */
export function useBridgeRoutes(): UseBridgeRoutesReturn {
  const routes = useMemo(() => getActiveRoutes(), []);

  const fromChain = useCallback(
    (chain: string) => routes.filter((r) => r.fromChain === chain),
    [routes],
  );

  const toChain = useCallback(
    (chain: string) => routes.filter((r) => r.toChain === chain),
    [routes],
  );

  return { routes, fromChain, toChain };
}
