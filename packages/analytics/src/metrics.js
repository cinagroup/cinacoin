/**
 * Metric calculations for analytics events.
 */
export class MetricsCalculator {
    /** Calculate all metrics from events */
    calculate(events) {
        return {
            connection: this.calculateConnectionMetrics(events),
            wallet: this.calculateWalletMetrics(events),
            chain: this.calculateChainMetrics(events),
        };
    }
    /** Calculate connection success rate and avg time */
    calculateConnectionMetrics(events) {
        const connectEvents = events.filter((e) => e.type === 'wallet_connect');
        const totalAttempts = connectEvents.length;
        const successful = connectEvents.filter((e) => e.success === true).length;
        const failed = totalAttempts - successful;
        const successRate = totalAttempts > 0 ? successful / totalAttempts : 0;
        const durations = connectEvents
            .map((e) => e.duration)
            .filter((d) => d != null);
        const avgConnectionTime = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        return { totalAttempts, successful, failed, successRate, avgConnectionTime };
    }
    /** Calculate wallet popularity */
    calculateWalletMetrics(events) {
        const popularity = new Map();
        for (const event of events) {
            if (event.type === 'wallet_connect') {
                const walletId = event.walletId;
                popularity.set(walletId, (popularity.get(walletId) ?? 0) + 1);
            }
        }
        return { uniqueWallets: popularity.size, walletPopularity: popularity };
    }
    /** Calculate chain usage distribution */
    calculateChainMetrics(events) {
        const usage = new Map();
        let maxCount = 0;
        let mostSwitchedTo;
        for (const event of events) {
            if (event.type === 'chain_switch') {
                const toChain = event.toChainId;
                const count = (usage.get(toChain) ?? 0) + 1;
                usage.set(toChain, count);
                if (count > maxCount) {
                    maxCount = count;
                    mostSwitchedTo = toChain;
                }
            }
        }
        return { chainUsage: usage, mostSwitchedToChain: mostSwitchedTo };
    }
}
//# sourceMappingURL=metrics.js.map