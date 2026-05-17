/**
 * Sanctions and risk lists — in-memory data with daily-sync hooks.
 *
 * In production, replace the static seed data with a live feed from your
 * compliance data provider (Chainalysis, TRM Labs, Elliptic, etc.).
 */
import { RiskLevel } from './types.js';
/** Initialise the lists from seed data. */
export declare function seedLists(): void;
/**
 * Check whether an address appears on the OFAC SDN list.
 */
export declare function isSanctioned(address: string): boolean;
/**
 * Check whether an address is a known mixer / tumbler.
 */
export declare function isMixer(address: string): boolean;
/**
 * Check whether an address is a known scam address.
 */
export declare function isScamAddress(address: string): boolean;
/**
 * Check whether an address belongs to a high-risk exchange.
 */
export declare function isRiskyExchange(address: string): boolean;
/**
 * Return the list names that the address matches.
 */
export declare function getMatchedLists(address: string): string[];
/**
 * Assign a base risk level from list membership alone.
 * This is the floor — transaction pattern analysis may raise it.
 */
export declare function listBasedRiskLevel(address: string): RiskLevel;
/**
 * Update callback type — called by the daily sync job.
 * Replace the in-memory sets with fresh data from your provider.
 */
export interface ListUpdate {
    ofacSdn?: string[];
    mixers?: string[];
    scams?: string[];
    riskyExchanges?: string[];
}
/**
 * Apply a bulk list update (e.g. from a daily sync job).
 */
export declare function updateLists(update: ListUpdate): void;
//# sourceMappingURL=lists.d.ts.map