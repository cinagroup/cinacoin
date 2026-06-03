/**
 * usePaymentHistory — React hook for querying and browsing payment history.
 *
 * Tracks all payments created via the associated PaymentExecutor.
 * Supports filtering by state, pagination, and auto-refresh.
 *
 * @example
 * ```tsx
 * const { payments, loading, filter, setFilter } = usePaymentHistory(executor);
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PaymentRequest, PaymentState } from "../types";
import type { PaymentExecutor } from "../executor/PaymentExecutor";

export interface UsePaymentHistoryReturn {
  /** All tracked payments. */
  payments: PaymentRequest[];
  /** Whether loading is in progress. */
  loading: boolean;
  /** Current filter (null = show all). */
  filter: PaymentState | null;
  /** Set a new filter. */
  setFilter: (state: PaymentState | null) => void;
  /** Re-fetch the payment list. */
  refresh: () => void;
  /** Get a payment by ID. */
  getPayment: (id: string) => PaymentRequest | undefined;
}

export function usePaymentHistory(
  executor: PaymentExecutor | null,
  /** Auto-refresh interval in ms (0 = disabled). */
  refreshMs: number = 0,
): UsePaymentHistoryReturn {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<PaymentState | null>(null);
  const [version, setVersion] = useState(0); // Bump to trigger re-fetch

  const refresh = useCallback(() => {
    if (!executor) return;
    setLoading(true);
    try {
      const all = executor.getAllPayments();
      setPayments(all);
    } finally {
      setLoading(false);
    }
  }, [executor]);

  useEffect(() => {
    refresh();
  }, [refresh, version]);

  // Auto-refresh
  useEffect(() => {
    if (refreshMs <= 0) return;
    const timer = setInterval(refresh, refreshMs);
    return () => clearInterval(timer);
  }, [refresh, refreshMs]);

  const filteredPayments = useMemo(() => {
    if (!filter) return payments;
    return payments.filter((p) => p.state === filter);
  }, [payments, filter]);

  const getPayment = useCallback(
    (id: string) => executor?.getPayment(id),
    [executor],
  );

  return {
    payments: filteredPayments,
    loading,
    filter,
    setFilter: (s: PaymentState | null) => {
      setFilter(s);
      setVersion((v) => v + 1);
    },
    refresh: () => setVersion((v) => v + 1),
    getPayment,
  };
}
