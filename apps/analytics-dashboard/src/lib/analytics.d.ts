/**
 * Analytics Query Layer
 *
 * Provides typed interfaces and in-memory query engine for
 * on-ramp conversion analytics. In production, replace the
 * in-memory store with a database-backed implementation.
 */
export interface TimeRange {
    from: number;
    to: number;
}
export type FunnelStageName = "widget_opened" | "quote_requested" | "purchase_initiated" | "purchase_completed" | "purchase_failed";
export type EventType = FunnelStageName | "kyc_started" | "provider_selected" | "widget_closed";
export interface AnalyticsEvent {
    id: string;
    type: EventType;
    userId: string;
    provider: string;
    region: string;
    fiatCurrency: string;
    fiatAmount: number;
    cryptoToken?: string;
    cryptoAmount?: number;
    timestamp: number;
    paymentMethod?: string;
    metadata?: Record<string, unknown>;
}
export type GroupBy = "provider" | "region" | "fiatCurrency" | "cryptoToken";
export type TimeBucket = "1h" | "6h" | "1d" | "7d";
export interface QueryParams {
    timeRange: TimeRange;
    filters?: {
        providers?: string[];
        regions?: string[];
        fiatCurrencies?: string[];
        cryptoTokens?: string[];
    };
    groupBy?: GroupBy;
}
export interface FunnelQuery {
    timeRange: TimeRange;
    filters?: {
        provider?: string;
        region?: string;
    };
}
export interface MetricPoint {
    timestamp: number;
    label: string;
    value: number;
}
export interface TimeSeriesResult {
    metric: string;
    points: MetricPoint[];
    group?: string;
}
export interface AggregationResult {
    group: string;
    totalEvents: number;
    totalFiatVolume: number;
    totalCryptoVolume: number;
    uniqueUsers: number;
    completedPurchases: number;
    conversionRate: number;
}
export interface FunnelStep {
    name: string;
    eventType: FunnelStageName;
    count: number;
    conversionRate: number;
    overallRate: number;
    dropoffRate: number;
}
export interface FunnelResult {
    steps: FunnelStep[];
    totalEntries: number;
    totalCompletions: number;
    overallConversionRate: number;
    timeRange: TimeRange;
    providerBreakdown?: Record<string, number>;
}
export interface KPI {
    label: string;
    value: number;
    unit: string;
    change?: number;
    changeDirection?: "up" | "down" | "flat";
}
export interface DashboardKPIs {
    totalPurchases: KPI;
    totalVolume: KPI;
    uniqueUsers: KPI;
    avgPurchaseAmount: KPI;
    conversionRate: KPI;
}
export declare class AnalyticsEngine {
    private events;
    /** Load initial dataset */
    loadEvents(events: AnalyticsEvent[]): void;
    /** Append events */
    addEvents(events: AnalyticsEvent[]): void;
    /** Filter events by query params */
    filter(params: QueryParams): AnalyticsEvent[];
    /**
     * Run metrics query — returns time-series data grouped by event type
     * and optionally by a dimension (provider, region, etc.).
     */
    query(params: QueryParams): TimeSeriesResult[];
    /**
     * Aggregation — returns summary stats per group.
     */
    aggregate(params: QueryParams): AggregationResult[];
    /**
     * Funnel analysis: widget_opened → quote_requested → purchase_initiated → purchase_completed
     */
    analyzeFunnel(params: FunnelQuery): FunnelResult;
    /**
     * Compute dashboard KPIs.
     */
    computeKPIs(timeRange: TimeRange, prevTimeRange?: TimeRange): DashboardKPIs;
}
//# sourceMappingURL=analytics.d.ts.map