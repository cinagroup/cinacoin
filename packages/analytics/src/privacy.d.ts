/**
 * Privacy controls for GDPR-compliant analytics.
 *
 * Manages user consent, data minimization, and retention policies.
 */
import { AnalyticsEvent } from '../types.js';
export interface PrivacyConfig {
    /** Whether tracking is allowed by default. */
    allowByDefault?: boolean;
    /** Maximum event retention in days. */
    retentionDays?: number;
    /** Whether to anonymize IP addresses (handled server-side). */
    anonymizeIp?: boolean;
    /** Whether to exclude wallet addresses from events. */
    excludeAddresses?: boolean;
}
export interface ConsentRecord {
    consented: boolean;
    timestamp: number;
    categories: string[];
}
export declare class PrivacyManager {
    private config;
    private consent;
    constructor(config?: PrivacyConfig);
    /** Check if an event can be tracked based on consent */
    canTrack(event: AnalyticsEvent): boolean;
    /** Apply data minimization to an event */
    sanitize(event: AnalyticsEvent): AnalyticsEvent;
    /** Record user consent */
    recordConsent(consented: boolean, categories?: string[]): void;
    /** Get current consent status */
    getConsent(): ConsentRecord | null;
    /** Check if consent has expired */
    isConsentValid(): boolean;
    /** Withdraw consent */
    withdrawConsent(): void;
    /** Hash an address for anonymization */
    private hashAddress;
    /** Load consent from storage */
    private loadConsent;
    /** Persist consent to storage */
    private persistConsent;
    /** Get storage API */
    private getStorage;
}
//# sourceMappingURL=privacy.d.ts.map