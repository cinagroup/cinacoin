/**
 * @cinaconnect/analytics
 *
 * CinaConnect Analytics SDK — GDPR-compliant event tracking and metrics.
 *
 * @example
 * ```ts
 * import { EventTracker, InMemoryProvider, ConsentManager } from '@cinaconnect/analytics';
 *
 * const tracker = new EventTracker();
 * tracker.addProvider(new InMemoryProvider());
 *
 * await tracker.trackWalletConnected('metamask', 1);
 * await tracker.trackTransactionAttempted('0x123', 1, 'metamask');
 * ```
 */
export type { AnalyticsEvent, AnalyticsEventType, AnalyticsProvider, WalletProvider, ConnectionMetrics, WalletPopularity, ChainUsage, ConsentPreferences, AnonymizeOptions, DataExport, } from "./types.js.js";
export { EventTracker } from "./tracker.js.js";
export { LocalStorageProvider, InMemoryProvider } from "./providers/local.js.js";
export { RemoteProvider } from "./providers/remote.js.js";
export type { RemoteProviderConfig } from "./providers/remote.js.js";
export { calculateConnectionMetrics, calculateWalletPopularity, calculateChainUsage, calculateTransactionSuccessRate, countUniqueSessions, } from "./metrics.js.js";
export { anonymizeEvent, anonymizeEvents, ConsentManager, exportUserData, deleteUserData, } from "./privacy.js.js";
//# sourceMappingURL=index.d.ts.map