/**
 * Transaction screening engine.
 *
 * Combines sanctions-list lookups with heuristic pattern analysis to
 * produce a risk assessment for any on-chain transaction or payment.
 */
import type { ScreeningResult, TransactionRisk, TransactionInput, PaymentScreeningParams, ComplianceReport } from './types.js';
/**
 * Screen a single address against all known lists.
 */
export declare function screenAddress(address: string): ScreeningResult;
/**
 * Analyse a full transaction for suspicious patterns.
 */
export declare function screenTransaction(tx: TransactionInput): TransactionRisk;
/**
 * Pre-payment compliance check — convenience wrapper.
 */
export declare function screenPayment(params: PaymentScreeningParams): TransactionRisk;
/**
 * Get a numeric risk score for an address (0–100).
 */
export declare function getRiskScore(address: string): number;
/**
 * Build a full compliance report for an address.
 */
export declare function getComplianceReport(address: string): ComplianceReport;
//# sourceMappingURL=screening.d.ts.map