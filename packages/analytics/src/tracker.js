/**
 * Event Tracker & Analytics
 *
 * Core event tracking with provider-agnostic design.
 * Exports both the new EventTracker API and a legacy-compatible Analytics class.
 */
import { randomUUID } from "crypto";
// ============================================================
// EventTracker — new unified API
// ============================================================
export class EventTracker {
    constructor(sessionId) {
        this.providers = [];
        this.trackingEnabled = true;
        this.events = [];
        this.sessionId = sessionId ?? this.generateSessionId();
    }
    generateSessionId() {
        return `sess_${randomUUID().slice(0, 12)}`;
    }
    addProvider(provider) {
        this.providers.push(provider);
    }
    setEnabled(enabled) {
        this.trackingEnabled = enabled;
    }
    isEnabled() {
        return this.trackingEnabled;
    }
    getSessionId() {
        return this.sessionId;
    }
    resetSession() {
        this.sessionId = this.generateSessionId();
        return this.sessionId;
    }
    async track(type, options) {
        if (!this.trackingEnabled)
            return;
        const event = {
            eventId: randomUUID(),
            type,
            timestamp: Date.now(),
            chainId: options?.chainId,
            wallet: options?.wallet,
            txHash: options?.txHash,
            error: options?.error,
            properties: options?.properties,
            sessionId: this.sessionId,
        };
        this.events.push(event);
        await Promise.allSettled(this.providers.map((p) => p.track(event)));
    }
    async trackWalletConnected(wallet, chainId) {
        await this.track("wallet_connected", { wallet, chainId });
    }
    async trackWalletDisconnected(wallet) {
        await this.track("wallet_disconnected", { wallet });
    }
    async trackChainSwitched(chainId, wallet) {
        await this.track("chain_switched", { chainId, wallet });
    }
    async trackTransactionAttempted(txHash, chainId, wallet) {
        await this.track("transaction_attempted", { txHash, chainId, wallet });
    }
    async trackTransactionConfirmed(txHash, chainId, wallet) {
        await this.track("transaction_confirmed", { txHash, chainId, wallet });
    }
    async trackError(error, properties) {
        await this.track("error_occurred", { error, properties });
    }
    async getEvents() {
        const allEvents = await Promise.all(this.providers.map((p) => p.getEvents()));
        const combined = [...this.events, ...allEvents.flat()];
        const seen = new Set();
        return combined.filter((e) => {
            if (seen.has(e.eventId))
                return false;
            seen.add(e.eventId);
            return true;
        });
    }
    async clear() {
        this.events = [];
        await Promise.allSettled(this.providers.map((p) => p.clear()));
    }
}
export class Analytics {
    constructor(config) {
        this.events = [];
        this.tracking = true;
        this.config = config ?? {};
        this.sessionId = `sess_${randomUUID().slice(0, 12)}`;
    }
    getState() {
        return {
            sessionId: this.sessionId,
            tracking: this.tracking,
            eventCount: this.events.length,
        };
    }
    trackWalletConnect(params) {
        if (!this.tracking)
            return;
        this.events.push({
            type: "wallet_connect",
            timestamp: Date.now(),
            walletId: params.walletId,
            chainId: params.chainId,
            address: params.address,
            connectorType: params.connectorType,
            duration: params.duration,
            success: params.success,
        });
    }
    trackWalletDisconnect(walletId, reason) {
        if (!this.tracking)
            return;
        this.events.push({
            type: "wallet_disconnect",
            timestamp: Date.now(),
            walletId,
            reason,
        });
    }
    trackChainSwitch(fromChainId, toChainId) {
        if (!this.tracking)
            return;
        this.events.push({
            type: "chain_switch",
            timestamp: Date.now(),
            chainId: toChainId,
            properties: { fromChainId, toChainId },
        });
    }
    trackTransactionAttempt(params) {
        if (!this.tracking)
            return;
        this.events.push({
            type: params.success ? "transaction_success" : "transaction_failure",
            timestamp: Date.now(),
            chainId: params.chainId,
            method: params.method,
            duration: params.duration,
            success: params.success,
            error: params.error,
        });
    }
    trackError(errorCode, message, context) {
        if (!this.tracking)
            return;
        this.events.push({
            type: "error",
            timestamp: Date.now(),
            errorCode,
            error: message,
            properties: context,
        });
    }
    disable() {
        this.tracking = false;
    }
    enable() {
        this.tracking = true;
    }
    getEvents() {
        return [...this.events];
    }
    clear() {
        this.events = [];
    }
    getMetrics() {
        const connectEvents = this.events.filter((e) => e.type === "wallet_connect");
        const successful = connectEvents.filter((e) => e.success);
        const failed = connectEvents.filter((e) => !e.success);
        const avgDuration = successful.length > 0
            ? successful.reduce((sum, e) => sum + (e.duration ?? 0), 0) / successful.length
            : 0;
        const walletCounts = new Map();
        for (const e of connectEvents) {
            if (e.walletId) {
                walletCounts.set(e.walletId, (walletCounts.get(e.walletId) ?? 0) + 1);
            }
        }
        const topWallets = [...walletCounts.entries()]
            .map(([walletId, count]) => ({ walletId, count }))
            .sort((a, b) => b.count - a.count);
        const chainCounts = new Map();
        for (const e of connectEvents) {
            if (e.chainId !== undefined) {
                chainCounts.set(e.chainId, (chainCounts.get(e.chainId) ?? 0) + 1);
            }
        }
        return {
            connection: {
                totalAttempts: connectEvents.length,
                successful: successful.length,
                failed: failed.length,
                successRate: connectEvents.length > 0 ? successful.length / connectEvents.length : 0,
                avgDuration,
            },
            wallet: {
                uniqueWallets: walletCounts.size,
                topWallets,
            },
            chain: {
                chainUsage: [...chainCounts.entries()]
                    .map(([chainId, count]) => ({ chainId, count }))
                    .sort((a, b) => b.count - a.count),
            },
        };
    }
}
//# sourceMappingURL=tracker.js.map