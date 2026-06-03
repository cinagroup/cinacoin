/**
 * Analytics Query Layer
 *
 * Provides typed interfaces and in-memory query engine for
 * on-ramp conversion analytics. In production, replace the
 * in-memory store with a database-backed implementation.
 */
// ============================================================
// In-Memory Store + Query Engine
// ============================================================
export class AnalyticsEngine {
    constructor() {
        this.events = [];
    }
    /** Load initial dataset */
    loadEvents(events) {
        this.events = events.slice().sort((a, b) => a.timestamp - b.timestamp);
    }
    /** Append events */
    addEvents(events) {
        this.events.push(...events);
        this.events.sort((a, b) => a.timestamp - b.timestamp);
    }
    /** Filter events by query params */
    filter(params) {
        const { timeRange, filters } = params;
        return this.events.filter((e) => {
            if (e.timestamp < timeRange.from || e.timestamp > timeRange.to)
                return false;
            if (filters?.providers?.length && !filters.providers.includes(e.provider))
                return false;
            if (filters?.regions?.length && !filters.regions.includes(e.region))
                return false;
            if (filters?.fiatCurrencies?.length && !filters.fiatCurrencies.includes(e.fiatCurrency))
                return false;
            if (filters?.cryptoTokens?.length && !filters.cryptoTokens.includes(e.cryptoToken ?? ""))
                return false;
            return true;
        });
    }
    /**
     * Run metrics query — returns time-series data grouped by event type
     * and optionally by a dimension (provider, region, etc.).
     */
    query(params) {
        const filtered = this.filter(params);
        if (!params.groupBy) {
            const counts = new Map();
            for (const e of filtered) {
                counts.set(e.type, (counts.get(e.type) || 0) + 1);
            }
            return Array.from(counts.entries()).map(([label, value]) => ({
                metric: label,
                points: [{ timestamp: params.timeRange.to, label, value }],
            }));
        }
        const grouped = new Map();
        for (const e of filtered) {
            const key = e[params.groupBy] ?? "unknown";
            if (!grouped.has(key))
                grouped.set(key, new Map());
            const inner = grouped.get(key);
            inner.set(e.type, (inner.get(e.type) || 0) + 1);
        }
        const results = [];
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
    aggregate(params) {
        const filtered = this.filter(params);
        const groups = new Map();
        const groupBy = params.groupBy ?? "provider";
        for (const e of filtered) {
            const key = e[groupBy] ?? "unknown";
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(e);
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
    analyzeFunnel(params) {
        const { timeRange, filters } = params;
        const funnelOrder = [
            "widget_opened",
            "quote_requested",
            "purchase_initiated",
            "purchase_completed",
        ];
        const filtered = this.events.filter((e) => {
            if (e.timestamp < timeRange.from || e.timestamp > timeRange.to)
                return false;
            if (!funnelOrder.includes(e.type))
                return false;
            if (filters?.provider && e.provider !== filters.provider)
                return false;
            if (filters?.region && e.region !== filters.region)
                return false;
            return true;
        });
        const firstStageUsers = new Set(filtered
            .filter((e) => e.type === funnelOrder[0])
            .map((e) => e.userId));
        const totalEntries = firstStageUsers.size;
        const steps = [];
        for (let i = 0; i < funnelOrder.length; i++) {
            const stageType = funnelOrder[i];
            const stageUsers = new Set(filtered
                .filter((e) => e.type === stageType)
                .map((e) => e.userId));
            const count = stageUsers.size;
            const prevCount = i > 0
                ? new Set(filtered
                    .filter((e) => e.type === funnelOrder[i - 1])
                    .map((e) => e.userId)).size
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
        const providerBreakdown = {};
        filtered
            .filter((e) => e.type === "purchase_completed")
            .forEach((e) => {
            providerBreakdown[e.provider] = (providerBreakdown[e.provider] || 0) + 1;
        });
        return {
            steps,
            totalEntries,
            totalCompletions: steps[steps.length - 1]?.count ?? 0,
            overallConversionRate: totalEntries > 0 ? steps[steps.length - 1].count / totalEntries : 0,
            timeRange,
            providerBreakdown,
        };
    }
    /**
     * Compute dashboard KPIs.
     */
    computeKPIs(timeRange, prevTimeRange) {
        const calc = (tr) => {
            const evts = this.events.filter((e) => e.timestamp >= tr.from && e.timestamp <= tr.to);
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
        function kpi(label, value, unit, prev) {
            const change = prev !== 0 ? ((value - prev) / prev) * 100 : (value > 0 ? 100 : 0);
            const dir = change > 0 ? "up" : change < 0 ? "down" : "flat";
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
//# sourceMappingURL=analytics.js.map