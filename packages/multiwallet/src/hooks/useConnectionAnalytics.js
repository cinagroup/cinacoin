import { useMemo } from "react";
import { useMultiwallet } from "./useMultiwallet.js";
/**
 * React hook that computes analytics over the current multiwallet connections.
 *
 * @example
 * ```tsx
 * const { totalConnections, walletsByNamespace, lastConnected, mostUsedWallet } = useConnectionAnalytics();
 * ```
 *
 * @returns Analytics data object derived from the store state.
 */
export function useConnectionAnalytics() {
    const { connections, analyze } = useMultiwallet();
    return useMemo(() => {
        const totalConnections = Object.values(connections).reduce((sum, arr) => sum + arr.length, 0);
        const walletsByNamespace = {};
        for (const [ns, conns] of Object.entries(connections)) {
            walletsByNamespace[ns] = conns.length;
        }
        const allConnections = Object.values(connections).flat();
        let lastConnected = null;
        for (const c of allConnections) {
            if (!lastConnected || c.connectedAt > lastConnected) {
                lastConnected = c.connectedAt;
            }
        }
        // Count active usages per wallet to determine most-used
        const walletUsage = new Map();
        for (const c of allConnections) {
            const key = `${c.walletId}:${c.namespace}`;
            walletUsage.set(key, (walletUsage.get(key) ?? 0) + 1);
        }
        let mostUsedWallet = null;
        let maxCount = 0;
        for (const [key, count] of walletUsage) {
            if (count > maxCount) {
                maxCount = count;
                mostUsedWallet = key;
            }
        }
        // Fall back to store's analyze for richer data if available
        const storeAnalytics = analyze();
        return {
            totalConnections,
            walletsByNamespace,
            lastConnected: lastConnected ?? storeAnalytics.lastConnected,
            mostUsedWallet: mostUsedWallet ?? storeAnalytics.mostUsedWallet,
        };
    }, [connections, analyze]);
}
//# sourceMappingURL=useConnectionAnalytics.js.map