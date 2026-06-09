/**
 * Analytics Query Layer
 *
 * Typed interfaces and an in-memory query engine for conversion analytics.
 * The production dashboard reads aggregated metrics directly from the
 * D1-backed analytics-server Worker (GET /v1/overview); this engine powers
 * the optional in-app API routes and unit tests where a non-static runtime
 * loads events explicitly via loadEvents()/addEvents().
 */

// ============================================================
// Core Types
// ============================================================

export interface TimeRange {
  from: number; // unix ms
  to: number;
}

export type FunnelStageName =
  | "widget_opened"
  | "quote_requested"
  | "purchase_initiated"
  | "purchase_completed"
  | "purchase_failed";

export type EventType =
  | FunnelStageName
  | "kyc_started"
  | "provider_selected"
  | "widget_closed";

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

// ============================================================
// Query Types
// ============================================================

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

// ============================================================
// Result Types
// ============================================================

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
  conversionRate: number;   // vs previous stage
  overallRate: number;      // vs first stage
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
  change?: number;      // % change vs previous period
  changeDirection?: "up" | "down" | "flat";
}

export interface DashboardKPIs {
  totalPurchases: KPI;
  totalVolume: KPI;
  uniqueUsers: KPI;
  avgPurchaseAmount: KPI;
  conversionRate: KPI;
}

// ============================================================
// In-Memory Store + Query Engine
// ============================================================

export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];

  /** Load initial dataset */
  loadEvents(events: AnalyticsEvent[]): void {
    this.events = events.slice().sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Append events */
  addEvents(events: AnalyticsEvent[]): void {
    this.events.push(...events);
    this.events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Filter events by query params */
  filter(params: QueryParams): AnalyticsEvent[] {
    const { timeRange, filters } = params;
    return this.events.filter((e) => {
      if (e.timestamp < timeRange.from || e.timestamp > timeRange.to) return false;
      if (filters?.providers?.length && !filters.providers.includes(e.provider)) return false;
      if (filters?.regions?.length && !filters.regions.includes(e.region)) return false;
      if (filters?.fiatCurrencies?.length && !filters.fiatCurrencies.includes(e.fiatCurrency)) return false;
      if (filters?.cryptoTokens?.length && !filters.cryptoTokens.includes(e.cryptoToken ?? "")) return false;
      return true;
    });
  }

  /**
   * Run metrics query — returns time-series data grouped by event type
   * and optionally by a dimension (provider, region, etc.).
   */
  query(params: QueryParams): TimeSeriesResult[] {
    const filtered = this.filter(params);

    if (!params.groupBy) {
      const counts = new Map<string, number>();
      for (const e of filtered) {
        counts.set(e.type, (counts.get(e.type) || 0) + 1);
      }
      return Array.from(counts.entries()).map(([label, value]) => ({
        metric: label,
        points: [{ timestamp: params.timeRange.to, label, value }],
      }));
    }

    const grouped = new Map<string, Map<string, number>>();
    for (const e of filtered) {
      const key = e[params.groupBy!] as string ?? "unknown";
      if (!grouped.has(key)) grouped.set(key, new Map());
      const inner = grouped.get(key)!;
      inner.set(e.type, (inner.get(e.type) || 0) + 1);
    }

    const results: TimeSeriesResult[] = [];
    for (const [groupKey, typeCounts] of grouped) {
      for (const [type, count] of typeCounts) {
        results.push({
          metric: type,
          group: groupKey,
          points: [{ timestamp: params.timeRange.to, label: `${groupKey}:${type}`, value: count }],
        });
      }
    }
    return results;
  }

  /**
   * Aggregation — returns summary stats per group.
   */
  aggregate(params: QueryParams): AggregationResult[] {
    const filtered = this.filter(params);
    const groups = new Map<string, AnalyticsEvent[]>();

    const groupBy = params.groupBy ?? "provider";
    for (const e of filtered) {
      const key = e[groupBy] as string ?? "unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }

    return Array.from(groups.entries()).map(([group, events]) => {
      const users = new Set(events.map((e) => e.userId));
      const completed = events.filter((e) => e.type === "purchase_completed");
      const completedUsers = new Set(completed.map((e) => e.userId));

      return {
        group,
        totalEvents: events.length,
        totalFiatVolume: events.reduce((s, e) => s + e.fiatAmount, 0),
        totalCryptoVolume: events.reduce((s, e) => s + (e.cryptoAmount ?? 0), 0),
        uniqueUsers: users.size,
        completedPurchases: completed.length,
        conversionRate: users.size > 0 ? completedUsers.size / users.size : 0,
      };
    }).sort((a, b) => b.totalFiatVolume - a.totalFiatVolume);
  }

  /**
   * Funnel analysis: widget_opened → quote_requested → purchase_initiated → purchase_completed
   */
  analyzeFunnel(params: FunnelQuery): FunnelResult {
    const { timeRange, filters } = params;

    const funnelOrder: FunnelStageName[] = [
      "widget_opened",
      "quote_requested",
      "purchase_initiated",
      "purchase_completed",
    ];

    const filtered = this.events.filter((e) => {
      if (e.timestamp < timeRange.from || e.timestamp > timeRange.to) return false;
      if (!funnelOrder.includes(e.type as FunnelStageName)) return false;
      if (filters?.provider && e.provider !== filters.provider) return false;
      if (filters?.region && e.region !== filters.region) return false;
      return true;
    });

    const firstStageUsers = new Set(
      filtered
        .filter((e) => e.type === funnelOrder[0])
        .map((e) => e.userId),
    );
    const totalEntries = firstStageUsers.size;

    const steps: FunnelStep[] = [];

    for (let i = 0; i < funnelOrder.length; i++) {
      const stageType = funnelOrder[i];
      const stageUsers = new Set(
        filtered
          .filter((e) => e.type === stageType)
          .map((e) => e.userId),
      );

      const count = stageUsers.size;
      const prevCount = i > 0
        ? new Set(
            filtered
              .filter((e) => e.type === funnelOrder[i - 1])
              .map((e) => e.userId),
          ).size
        : totalEntries;

      const conversionRate = prevCount > 0 ? count / prevCount : 0;

      steps.push({
        name: stageType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        eventType: stageType,
        count,
        conversionRate,
        overallRate: totalEntries > 0 ? count / totalEntries : 0,
        dropoffRate: 1 - conversionRate,
      });
    }

    // Provider breakdown on completed purchases
    const providerBreakdown: Record<string, number> = {};
    filtered
      .filter((e) => e.type === "purchase_completed")
      .forEach((e) => {
        providerBreakdown[e.provider] = (providerBreakdown[e.provider] || 0) + 1;
      });

    return {
      steps,
      totalEntries,
      totalCompletions: steps[steps.length - 1]?.count ?? 0,
      overallConversionRate: totalEntries > 0 ? steps[steps.length - 1]!.count / totalEntries : 0,
      timeRange,
      providerBreakdown,
    };
  }

  /**
   * Compute dashboard KPIs.
   */
  computeKPIs(timeRange: TimeRange, prevTimeRange?: TimeRange): DashboardKPIs {
    const calc = (tr: TimeRange) => {
      const evts = this.events.filter(
        (e) => e.timestamp >= tr.from && e.timestamp <= tr.to,
      );
      const completed = evts.filter((e) => e.type === "purchase_completed");
      const initiated = evts.filter((e) => e.type === "purchase_initiated");

      const totalPurchases = completed.length;
      const volume = completed.reduce((s, e) => s + e.fiatAmount, 0);
      const users = new Set(completed.map((e) => e.userId)).size;
      const avg = totalPurchases > 0 ? volume / totalPurchases : 0;
      const conversion = initiated.length > 0 ? totalPurchases / initiated.length : 0;

      return { totalPurchases, volume, users, avg, conversion };
    };

    const cur = calc(timeRange);

    function kpi(
      label: string,
      value: number,
      unit: string,
      prev: number,
    ): KPI {
      const change = prev !== 0 ? ((value - prev) / prev) * 100 : (value > 0 ? 100 : 0);
      const dir: KPI["changeDirection"] = change > 0 ? "up" : change < 0 ? "down" : "flat";
      return { label, value, unit, change, changeDirection: dir };
    }

    if (prevTimeRange) {
      const prev = calc(prevTimeRange);
      return {
        totalPurchases: kpi("Total Purchases", cur.totalPurchases, "", prev.totalPurchases),
        totalVolume: kpi("Total Volume", cur.volume, "USD", prev.volume),
        uniqueUsers: kpi("Unique Buyers", cur.users, "", prev.users),
        avgPurchaseAmount: kpi("Avg Purchase", cur.avg, "USD", prev.avg),
        conversionRate: kpi("Conversion Rate", cur.conversion * 100, "%", prev.conversion * 100),
      };
    }

    return {
      totalPurchases: { label: "Total Purchases", value: cur.totalPurchases, unit: "" },
      totalVolume: { label: "Total Volume", value: cur.volume, unit: "USD" },
      uniqueUsers: { label: "Unique Buyers", value: cur.users, unit: "" },
      avgPurchaseAmount: { label: "Avg Purchase", value: cur.avg, unit: "USD" },
      conversionRate: { label: "Conversion Rate", value: cur.conversion * 100, unit: "%" },
    };
  }
}
