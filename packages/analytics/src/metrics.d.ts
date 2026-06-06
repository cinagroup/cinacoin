/**
 * Metric calculations for analytics events.
 */
import { AnalyticsEvent } from '../types.js';
export interface ConnectionMetrics {
    /** Total connection attempts. */
    totalAttempts: number;
    /** Successful connections. */
    successful: number;
    /** Failed connections. */
    failed: number;
    /** Connection success rate (0-1). */
    successRate: number;
    /** Average connection time (ms). */
    avgConnectionTime: number;
}
export interface WalletMetrics {
    /** Number of unique wallets seen. */
    uniqueWallets: number;
    /** Wallet popularity: walletId -> connection count. */
    walletPopularity: Map<string, number>;
}
export interface ChainMetrics {
    /** Chain usage distribution: chainId -> switch count. */
    chainUsage: Map<number, number>;
    /** Most common destination chain. */
    mostSwitchedToChain?: number;
}
export declare class MetricsCalculator {
    /** Calculate all metrics from events */
    calculate(events: AnalyticsEvent[]): {
        connection: ConnectionMetrics;
        wallet: WalletMetrics;
        chain: ChainMetrics;
    };
    /** Calculate connection success rate and avg time */
    private calculateConnectionMetrics;
    /** Calculate wallet popularity */
    private calculateWalletMetrics;
    /** Calculate chain usage distribution */
    private calculateChainMetrics;
}
//# sourceMappingURL=metrics.d.ts.map