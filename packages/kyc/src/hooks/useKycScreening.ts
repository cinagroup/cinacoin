import { useCallback, useMemo } from 'react';
import type { ScreeningResult, TransactionRisk } from '../types.js';
import {
  screenAddress,
  screenTransaction,
  screenPayment,
  getRiskScore,
} from '../screening.js';

/* ── types ─────────────────────────────────────────────────────── */

export interface UseKycScreeningReturn {
  /** Screen a single address. */
  screenAddress: (address: string) => ScreeningResult;
  /** Screen a full transaction. */
  screenTransaction: typeof screenTransaction;
  /** Whether the last-screened address is compliant (risk ≤ medium). */
  isCompliant: boolean;
  /** Risk level of the last-screened address. */
  riskLevel: ScreeningResult['riskLevel'];
  /** Numeric risk score of the last-screened address. */
  riskScore: number;
  /** Last screening result, if any. */
  lastResult: ScreeningResult | null;
}

export interface UsePaymentScreeningReturn {
  /** Run a pre-payment screening. */
  screening: TransactionRisk | null;
  /** Whether the payment is safe to proceed. */
  isSafe: boolean;
  /** Human-readable recommendation. */
  recommendation: string;
}

/* ── hook: useKycScreening ────────────────────────────────────── */

/**
 * Provides KYC screening utilities with reactive state tracking.
 *
 * @example
 * ```tsx
 * const { screenAddress, isCompliant, riskLevel } = useKycScreening();
 * const result = screenAddress('0x...');
 * ```
 */
export function useKycScreening(): UseKycScreeningReturn {
  const lastResult = useMemo(() => ({ current: null as ScreeningResult | null }), []);

  const wrappedScreenAddress = useCallback(
    (address: string): ScreeningResult => {
      const result = screenAddress(address);
      lastResult.current = result;
      return result;
    },
    [lastResult],
  );

  // We need a stable boolean/level derived from the last result.
  // Using a simple ref pattern — the hook consumer will re-render
  // after calling screenAddress and reading the returned value.
  // For a fully reactive version, lift state into useState.

  return {
    screenAddress: wrappedScreenAddress,
    screenTransaction,
    get isCompliant() {
      const r = lastResult.current;
      return r ? r.riskLevel !== 'sanctioned' && r.riskLevel !== 'high' : true;
    },
    get riskLevel() {
      return lastResult.current?.riskLevel ?? 'low';
    },
    get riskScore() {
      return lastResult.current?.riskScore ?? 0;
    },
    get lastResult() {
      return lastResult.current;
    },
  };
}

/* ── hook: usePaymentScreening ─────────────────────────────────── */

/**
 * Pre-payment screening hook — evaluates recipient, amount, and asset
 * before a payment is initiated.
 *
 * @param recipient - Recipient address
 * @param amount    - Payment amount
 * @param asset     - Asset symbol or contract address
 *
 * @example
 * ```tsx
 * const { screening, isSafe, recommendation } = usePaymentScreening(
 *   recipient, amount, 'USDC'
 * );
 * ```
 */
export function usePaymentScreening(
  recipient: string,
  amount: string | number,
  asset: string,
): UsePaymentScreeningReturn {
  const screening = useMemo(() => {
    if (!recipient) return null;
    return screenPayment({ recipient, amount, asset });
  }, [recipient, amount, asset]);

  return {
    screening,
    isSafe: screening
      ? !screening.shouldBlock && screening.riskLevel !== 'sanctioned'
      : true,
    recommendation: screening?.recommendation ?? 'No screening performed',
  };
}
