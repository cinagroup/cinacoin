import type { ScreeningResult, TransactionRisk } from '../types.js';
import { screenTransaction } from '../screening.js';
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
/**
 * Provides KYC screening utilities with reactive state tracking.
 *
 * @example
 * ```tsx
 * const { screenAddress, isCompliant, riskLevel } = useKycScreening();
 * const result = screenAddress('0x...');
 * ```
 */
export declare function useKycScreening(): UseKycScreeningReturn;
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
export declare function usePaymentScreening(recipient: string, amount: string | number, asset: string): UsePaymentScreeningReturn;
//# sourceMappingURL=useKycScreening.d.ts.map