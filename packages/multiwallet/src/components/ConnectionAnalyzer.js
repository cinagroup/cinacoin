import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from "react";
import { useConnectionAnalytics } from "../hooks/useConnectionAnalytics.js";
/**
 * React component that displays connection analytics: total connections,
 * usage patterns, wallet distribution, and smart recommendations.
 *
 * @example
 * ```tsx
 * <ConnectionAnalyzer showDetail showRecommendations />
 * ```
 */
export function ConnectionAnalyzer({ className, showDetail = true, showRecommendations = true, }) {
    const analytics = useConnectionAnalytics();
    const recommendations = useMemo(() => {
        const recs = [];
        if (analytics.totalConnections === 0) {
            recs.push("No wallets connected. Connect a wallet to get started.");
            return recs;
        }
        // Check for namespaces with no connections
        const nsLabels = {
            eip155: "EVM",
            solana: "Solana",
            bip122: "Bitcoin",
        };
        for (const [ns, count] of Object.entries(analytics.walletsByNamespace)) {
            if (count === 0) {
                recs.push(`No ${nsLabels[ns] ?? ns} wallet connected.`);
            }
        }
        // Check for multiple wallets in same namespace without an active one
        for (const [ns, count] of Object.entries(analytics.walletsByNamespace)) {
            if (count > 1) {
                recs.push(`${nsLabels[ns] ?? ns} has ${count} wallets — consider removing unused connections.`);
            }
        }
        if (analytics.mostUsedWallet) {
            const [walletId] = analytics.mostUsedWallet.split(":");
            recs.push(`${walletId} is your most frequently used wallet.`);
        }
        if (analytics.totalConnections > 5) {
            recs.push(`You have ${analytics.totalConnections} connections. Review periodically for security.`);
        }
        return recs;
    }, [analytics]);
    return (_jsxs("div", { className: `connection-analyzer ${className ?? ""}`.trim(), children: [_jsx("h3", { style: styles.title, children: "Connection Analytics" }), _jsxs("div", { style: styles.summaryGrid, children: [_jsx(StatCard, { label: "Total Connections", value: analytics.totalConnections.toString(), icon: "\uD83D\uDD17" }), _jsx(StatCard, { label: "Namespaces", value: Object.keys(analytics.walletsByNamespace).filter((ns) => analytics.walletsByNamespace[ns] > 0).length.toString(), icon: "\uD83C\uDF10" }), analytics.mostUsedWallet && (_jsx(StatCard, { label: "Most Used", value: analytics.mostUsedWallet.split(":")[0], icon: "\u2B50" })), analytics.lastConnected && (_jsx(StatCard, { label: "Last Connected", value: formatRelativeDate(analytics.lastConnected), icon: "\uD83D\uDD50" }))] }), showDetail && (_jsxs("div", { style: styles.detailSection, children: [_jsx("h4", { style: styles.detailTitle, children: "Connections by Namespace" }), Object.entries(analytics.walletsByNamespace).map(([ns, count]) => (_jsxs("div", { style: styles.nsRow, children: [_jsx("span", { style: styles.nsLabel, children: getNamespaceLabel(ns) }), _jsx("div", { style: styles.barContainer, children: _jsx("div", { style: {
                                        ...styles.bar,
                                        width: `${getBarWidth(count, analytics.totalConnections)}%`,
                                    } }) }), _jsx("span", { style: styles.nsCount, children: count })] }, ns)))] })), showRecommendations && recommendations.length > 0 && (_jsxs("div", { style: styles.recommendations, children: [_jsx("h4", { style: styles.recommendationsTitle, children: "\uD83D\uDCA1 Recommendations" }), _jsx("ul", { style: styles.recommendationsList, children: recommendations.map((rec, i) => (_jsx("li", { style: styles.recommendationItem, children: rec }, i))) })] }))] }));
}
function StatCard({ label, value, icon }) {
    return (_jsxs("div", { style: styles.statCard, children: [_jsx("span", { style: styles.statIcon, children: icon }), _jsxs("div", { children: [_jsx("div", { style: styles.statValue, children: value }), _jsx("div", { style: styles.statLabel, children: label })] })] }));
}
// ─── Helpers ─────────────────────────────────────────────────────
function getNamespaceLabel(ns) {
    const labels = {
        eip155: "EVM",
        solana: "Solana",
        bip122: "Bitcoin",
    };
    return labels[ns] ?? ns;
}
function getBarWidth(count, total) {
    if (total === 0)
        return 0;
    return Math.max(5, (count / total) * 100);
}
function formatRelativeDate(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffSec < 60)
        return "Just now";
    if (diffMin < 60)
        return `${diffMin}m ago`;
    if (diffHr < 24)
        return `${diffHr}h ago`;
    if (diffDay < 7)
        return `${diffDay}d ago`;
    return date.toLocaleDateString();
}
// ─── Inline Styles ───────────────────────────────────────────────
const styles = {
    title: {
        margin: "0 0 16px",
        fontSize: "16px",
        fontWeight: 600,
        color: "#111827",
    },
    summaryGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "12px",
        marginBottom: "20px",
    },
    statCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        background: "#f9fafb",
        borderRadius: "10px",
        border: "1px solid #f3f4f6",
    },
    statIcon: {
        fontSize: "20px",
    },
    statValue: {
        fontSize: "16px",
        fontWeight: 700,
        color: "#111827",
    },
    statLabel: {
        fontSize: "11px",
        color: "#6b7280",
        marginTop: "2px",
    },
    detailSection: {
        marginBottom: "20px",
    },
    detailTitle: {
        margin: "0 0 12px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#374151",
    },
    nsRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "8px",
        fontSize: "13px",
    },
    nsLabel: {
        width: "60px",
        fontWeight: 500,
        color: "#4b5563",
    },
    barContainer: {
        flex: 1,
        height: "8px",
        background: "#e5e7eb",
        borderRadius: "4px",
        overflow: "hidden",
    },
    bar: {
        height: "100%",
        background: "#3b82f6",
        borderRadius: "4px",
        transition: "width 0.3s ease",
    },
    nsCount: {
        width: "20px",
        textAlign: "right",
        fontSize: "12px",
        color: "#6b7280",
    },
    recommendations: {
        padding: "12px 16px",
        background: "#fffbeb",
        border: "1px solid #fde68a",
        borderRadius: "10px",
    },
    recommendationsTitle: {
        margin: "0 0 8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#92400e",
    },
    recommendationsList: {
        margin: 0,
        paddingLeft: "18px",
    },
    recommendationItem: {
        fontSize: "13px",
        color: "#78350f",
        marginBottom: "4px",
        lineHeight: 1.5,
    },
};
//# sourceMappingURL=ConnectionAnalyzer.js.map