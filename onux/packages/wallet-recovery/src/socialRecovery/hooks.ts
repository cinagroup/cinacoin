/**
 * React Hooks for Social Recovery.
 *
 * - useRecovery: Initiate and execute wallet recovery flows.
 * - useGuardians: Manage Guardian set (add/remove/list).
 * - useRecoveryStatus: Query recovery status and monitor progress.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { SocialRecoveryManager, type NotificationCallback } from './SocialRecoveryManager.js';
import type {
  Guardian,
  RecoveryRequest,
  RecoveryStatusResult,
  RecoveryEvent,
  InitiateRecoveryParams,
  SetGuardiansResult,
} from './types.js';

// ─── useRecovery ───────────────────────────────────────────────────────

export interface UseRecoveryReturn {
  manager: SocialRecoveryManager;
  activeRecovery: RecoveryRequest | null;
  isExecuting: boolean;
  error: string | null;
  initiateRecovery: (params: InitiateRecoveryParams) => RecoveryRequest;
  guardianApprove: (recoveryId: string, guardianId: string, signature: string) => RecoveryRequest;
  executeRecovery: (recoveryId: string, newOwner: string) => RecoveryRequest;
  cancelRecovery: (recoveryId: string, cancelledBy: string) => RecoveryRequest;
  clearError: () => void;
}

/**
 * Hook for initiating and executing wallet recovery.
 *
 * @param manager - SocialRecoveryManager instance.
 * @param walletId - Optional wallet ID to filter active recoveries.
 * @returns Recovery operations and state.
 */
export function useRecovery(
  manager: SocialRecoveryManager,
  walletId?: string
): UseRecoveryReturn {
  const [activeRecovery, setActiveRecovery] = useState<RecoveryRequest | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateRecovery = useCallback(
    (params: InitiateRecoveryParams): RecoveryRequest => {
      try {
        setError(null);
        const result = manager.initiateRecovery(params);
        setActiveRecovery(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initiate recovery';
        setError(message);
        throw err;
      }
    },
    [manager]
  );

  const guardianApprove = useCallback(
    (recoveryId: string, guardianId: string, signature: string): RecoveryRequest => {
      try {
        setError(null);
        const result = manager.guardianApprove(recoveryId, guardianId, signature);
        setActiveRecovery(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to approve recovery';
        setError(message);
        throw err;
      }
    },
    [manager]
  );

  const executeRecovery = useCallback(
    (recoveryId: string, newOwner: string): RecoveryRequest => {
      try {
        setIsExecuting(true);
        setError(null);
        const result = manager.executeRecovery(recoveryId, newOwner);
        setActiveRecovery(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to execute recovery';
        setError(message);
        throw err;
      } finally {
        setIsExecuting(false);
      }
    },
    [manager]
  );

  const cancelRecovery = useCallback(
    (recoveryId: string, cancelledBy: string): RecoveryRequest => {
      try {
        setError(null);
        const result = manager.cancelRecovery(recoveryId, cancelledBy);
        setActiveRecovery(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel recovery';
        setError(message);
        throw err;
      }
    },
    [manager]
  );

  const clearError = useCallback(() => setError(null), []);

  // Refresh active recovery on mount if walletId provided
  useEffect(() => {
    if (walletId) {
      const active = manager.listActiveRecoveries(walletId);
      if (active.length > 0) {
        setActiveRecovery(active[0]);
      }
    }
  }, [manager, walletId]);

  return {
    manager,
    activeRecovery,
    isExecuting,
    error,
    initiateRecovery,
    guardianApprove,
    executeRecovery,
    cancelRecovery,
    clearError,
  };
}

// ─── useGuardians ──────────────────────────────────────────────────────

export interface UseGuardiansReturn {
  guardians: Guardian[];
  guardianCount: number;
  threshold: number;
  isLoading: boolean;
  error: string | null;
  setGuardians: (guardians: Guardian[], threshold?: number) => SetGuardiansResult;
  addGuardian: (guardian: Guardian) => number;
  removeGuardian: (guardianId: string) => number;
  deactivateGuardian: (guardianId: string) => void;
  refresh: () => void;
  clearError: () => void;
}

/**
 * Hook for managing the Guardian set.
 *
 * @param manager - SocialRecoveryManager instance.
 * @param walletId - Wallet identifier.
 * @returns Guardian management operations and state.
 */
export function useGuardians(
  manager: SocialRecoveryManager,
  walletId: string
): UseGuardiansReturn {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [guardianCount, setGuardianCount] = useState(0);
  const [threshold, setThreshold] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const config = manager.getGuardianConfig(walletId);
      if (mountedRef.current) {
        setGuardians(config.guardians);
        setGuardianCount(config.guardians.filter((g) => g.active).length);
        setThreshold(config.threshold);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load guardians');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [manager, walletId]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const setGuardiansFn = useCallback(
    (newGuardians: Guardian[], newThreshold?: number): SetGuardiansResult => {
      try {
        setError(null);
        const result = manager.setGuardians(walletId, newGuardians, newThreshold);
        if (mountedRef.current) {
          setGuardians(newGuardians);
          setGuardianCount(result.guardianCount);
          setThreshold(result.threshold);
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to set guardians';
        setError(message);
        throw err;
      }
    },
    [manager, walletId]
  );

  const addGuardian = useCallback(
    (guardian: Guardian): number => {
      try {
        setError(null);
        const count = manager.addGuardian(walletId, guardian);
        if (mountedRef.current) {
          setGuardians((prev) => [...prev, { ...guardian, active: true, addedAt: prev.length > 0 ? prev[0].addedAt : Math.floor(Date.now() / 1000) }]);
          setGuardianCount(count);
        }
        return count;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add guardian';
        setError(message);
        throw err;
      }
    },
    [manager, walletId]
  );

  const removeGuardian = useCallback(
    (guardianId: string): number => {
      try {
        setError(null);
        const count = manager.removeGuardian(walletId, guardianId);
        if (mountedRef.current) {
          setGuardians((prev) => prev.filter((g) => g.id !== guardianId));
          setGuardianCount(count);
        }
        return count;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove guardian';
        setError(message);
        throw err;
      }
    },
    [manager, walletId]
  );

  const deactivateGuardian = useCallback(
    (guardianId: string): void => {
      try {
        setError(null);
        manager.deactivateGuardian(walletId, guardianId);
        if (mountedRef.current) {
          setGuardians((prev) =>
            prev.map((g) => (g.id === guardianId ? { ...g, active: false } : g))
          );
          setGuardianCount((prev) => prev - 1);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to deactivate guardian';
        setError(message);
        throw err;
      }
    },
    [manager, walletId]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    guardians,
    guardianCount,
    threshold,
    isLoading,
    error,
    setGuardians: setGuardiansFn,
    addGuardian,
    removeGuardian,
    deactivateGuardian,
    refresh,
    clearError,
  };
}

// ─── useRecoveryStatus ─────────────────────────────────────────────────

export interface UseRecoveryStatusReturn {
  status: RecoveryStatusResult | null;
  events: RecoveryEvent[];
  canExecute: boolean;
  delayRemaining: number;
  timeoutRemaining: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  clearError: () => void;
}

/**
 * Hook for monitoring a recovery request's status.
 *
 * Polls for status updates automatically when the recovery is in progress.
 *
 * @param manager - SocialRecoveryManager instance.
 * @param recoveryId - Recovery request ID to monitor.
 * @param pollingIntervalMs - Poll interval in milliseconds (default: 5000). Set to 0 to disable polling.
 * @returns Recovery status and monitoring controls.
 */
export function useRecoveryStatus(
  manager: SocialRecoveryManager,
  recoveryId: string | null,
  pollingIntervalMs: number = 5000
): UseRecoveryStatusReturn {
  const [status, setStatus] = useState<RecoveryStatusResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(() => {
    if (!recoveryId) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = manager.getRecoveryStatus(recoveryId);
      if (mountedRef.current) {
        setStatus(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to get recovery status');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [manager, recoveryId]);

  useEffect(() => {
    mountedRef.current = true;

    if (recoveryId) {
      refresh();
    } else {
      setStatus(null);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [recoveryId, refresh]);

  // Auto-polling for in-progress recoveries
  useEffect(() => {
    if (!recoveryId || pollingIntervalMs <= 0) return;

    const interval = setInterval(() => {
      if (!mountedRef.current) return;

      const s = status;
      if (s && (s.request.status === 'initiated' || s.request.status === 'approved')) {
        refresh();
      }
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [recoveryId, pollingIntervalMs, refresh, status]);

  const clearError = useCallback(() => setError(null), []);

  return {
    status,
    events: status?.events || [],
    canExecute: status?.canExecute || false,
    delayRemaining: status?.delayRemaining || 0,
    timeoutRemaining: status?.timeoutRemaining || 0,
    isLoading,
    error,
    refresh,
    clearError,
  };
}
