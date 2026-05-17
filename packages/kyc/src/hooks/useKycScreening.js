import { useCallback, useMemo } from 'react';
import { screenAddress, screenTransaction, screenPayment, } from '../screening.js';
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
export function useKycScreening() {
    const lastResult = useMemo(() => ({ current: null }), []);
    const wrappedScreenAddress = useCallback((address) => {
        const result = screenAddress(address);
        lastResult.current = result;
        return result;
    }, [lastResult]);
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
export function usePaymentScreening(recipient, amount, asset) {
    const screening = useMemo(() => {
        if (!recipient)
            return null;
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
//# sourceMappingURL=useKycScreening.js.map