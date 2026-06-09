/**
 * usePaymentStatus — React hook to query and subscribe to a payment's on-chain status.
 *
 * @example
 * ```tsx
 * const { payment, state, txHash, isLoading, refetch } = usePaymentStatus(paymentId, executor);
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import type { PaymentRequest, PaymentState } from "../types";
import type { PaymentExecutor } from "../executor/PaymentExecutor";

export interface UsePaymentStatusReturn {
  /** The current payment request. */
  payment: PaymentRequest | null;
  /** Current payment state. */
  state: PaymentState | null;
  /** On-chain transaction hash. */
  txHash: `0x${string}` | undefined;
  /** Whether a status check is in progress. */
  isLoading: boolean;
  /** Error from the last status check. */
  error: Error | null;
  /** Manually re-fetch the payment status. */
  refetch: () => Promise<void>;
}

export function usePaymentStatus(
  paymentId: string | null,
  executor: PaymentExecutor | null,
  /** Auto-refresh interval in ms (0 = disabled). */
  refreshMs: number = 0,
): UsePaymentStatusReturn {
  const [payment, setPayment] = useState<PaymentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!paymentId || !executor) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await executor.getPaymentStatus(paymentId);
      setPayment(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [paymentId, executor]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-refresh for in-flight payments
  useEffect(() => {
    if (refreshMs <= 0 || !paymentId) return;
    if (payment?.state !== "processing") return;

    const timer = setInterval(fetchStatus, refreshMs);
    return () => clearInterval(timer);
  }, [payment?.state, refreshMs, paymentId, fetchStatus]);

  return {
    payment,
    state: payment?.state ?? null,
    txHash: payment?.txHash,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
