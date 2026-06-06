/**
 * Analytics SDK Type Definitions
 */
/** Supported wallet providers */
export type WalletProvider = "metamask" | "walletconnect" | "coinbase" | "rainbow" | "trust" | "ledger" | "trezor" | "phantom" | "other";
/** Event types */
export type AnalyticsEventType = "wallet_connected" | "wallet_disconnected" | "chain_switched" | "transaction_attempted" | "transaction_confirmed" | "transaction_failed" | "error_occurred" | "page_viewed" | "button_clicked" | "feature_used";
/** Base analytics event */
export interface AnalyticsEvent {
    /** Unique event ID */
    eventId: string;
    /** Event type */
    type: AnalyticsEventType;
    /** Timestamp */
    timestamp: number;
    /** Chain ID (if applicable) */
    chainId?: number;
    /** Wallet provider */
    wallet?: WalletProvider;
    /** Transaction hash (if applicable) */
    txHash?: string;
    /** Error message (if applicable) */
    error?: string;
    /** Additional properties */
    properties?: Record<string, string | number | boolean>;
    /** Session ID */
    sessionId: string;
}
/** Provider interface for analytics storage */
export interface AnalyticsProvider {
    track(event: AnalyticsEvent): Promise<void>;
    getEvents(): Promise<AnalyticsEvent[]>;
    clear(): Promise<void>;
}
/** Metrics calculations */
export interface ConnectionMetrics {
    /** Total connection attempts */
    totalAttempts: number;
    /** Successful connections */
    successfulConnections: number;
    /** Connection success rate (0-1) */
    successRate: number;
    /** Average connection time (ms) */
    avgConnectionTime: number;
}
export interface WalletPopularity {
    wallet: WalletProvider;
    count: number;
    percentage: number;
}
export interface ChainUsage {
    chainId: number;
    count: number;
    percentage: number;
}
/** Consent preferences */
export interface ConsentPreferences {
    analytics: boolean;
    performance: boolean;
    marketing: boolean;
    updatedAt: number;
}
/** Anonymization options */
export interface AnonymizeOptions {
    /** Remove IP address */
    removeIP?: boolean;
    /** Remove precise location */
    coarsenLocation?: boolean;
    /** Remove identifiers */
    removeIdentifiers?: boolean;
}
/** Data export result */
export interface DataExport {
    userId: string;
    events: AnalyticsEvent[];
    exportedAt: number;
    format: "json";
}
//# sourceMappingURL=types.d.ts.map