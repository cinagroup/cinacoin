/**
 * Integration Test — Analytics Tracking Lifecycle
 *
 * Tests the complete analytics flow: initialization, event tracking,
 * consent management, and data export.
 *
 * 6 tests covering:
 * - Event tracking lifecycle
 * - Consent-based filtering
 * - Event anonymization
 * - Provider aggregation
 * - Session tracking
 * - Data export and deletion
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ── Mock Provider ─────────────────────────────────────────────────
class MockAnalyticsProvider {
    constructor(name = 'mock') {
        this.events = [];
        this.name = name;
    }
    async track(event) {
        this.events.push(event);
    }
    async flush() { }
}
// ── Consent Manager ───────────────────────────────────────────────
class ConsentManager {
    constructor() {
        this.preferences = new Map();
    }
    setPreference(category, consented) {
        this.preferences.set(category, consented);
    }
    isConsented(category) {
        return this.preferences.get(category) ?? false;
    }
    hasAnyConsent() {
        return Array.from(this.preferences.values()).some(Boolean);
    }
    reset() {
        this.preferences.clear();
    }
}
// ── Anonymization ─────────────────────────────────────────────────
function anonymizeEvent(event) {
    const anonymized = { ...event };
    anonymized.userId = undefined;
    const sensitiveKeys = ['address', 'txHash', 'email', 'ip'];
    for (const key of sensitiveKeys) {
        if (anonymized.properties[key]) {
            anonymized.properties = { ...anonymized.properties, [key]: '[REDACTED]' };
        }
    }
    return anonymized;
}
// ── Event Tracker ─────────────────────────────────────────────────
class EventTracker {
    constructor(sessionId) {
        this.providers = [];
        this.events = [];
        this._sessionId = sessionId || 'session-' + Date.now();
        this.consentManager = new ConsentManager();
    }
    addProvider(provider) {
        this.providers.push(provider);
    }
    setConsent(category, consented) {
        this.consentManager.setPreference(category, consented);
    }
    async track(type, properties = {}) {
        // Check consent
        if (!this.consentManager.isConsented('analytics')) {
            return; // Silently drop events without consent
        }
        const event = {
            type,
            timestamp: Date.now(),
            properties,
            sessionId: this._sessionId,
        };
        this.events.push(event);
        // Send to all providers
        await Promise.all(this.providers.map((p) => p.track(event)));
    }
    getEvents() {
        return [...this.events];
    }
    async flush() {
        await Promise.all(this.providers.map((p) => p.flush()));
    }
    exportData() {
        return [...this.events];
    }
    deleteData() {
        this.events = [];
        for (const provider of this.providers) {
            if ('events' in provider) {
                provider.events = [];
            }
        }
    }
    get sessionId() {
        return this._sessionId;
    }
}
// ── Tests ─────────────────────────────────────────────────────────
describe('Analytics Flow — Tracking Lifecycle', () => {
    let tracker;
    let provider1;
    let provider2;
    beforeEach(() => {
        tracker = new EventTracker('test-session-1');
        provider1 = new MockAnalyticsProvider('local');
        provider2 = new MockAnalyticsProvider('remote');
        tracker.addProvider(provider1);
        tracker.addProvider(provider2);
    });
    it('should track events and send to all providers', async () => {
        tracker.setConsent('analytics', true);
        await tracker.track('wallet_connected', {
            walletId: 'metamask',
            chainId: 1,
        });
        await tracker.track('transaction_initiated', {
            txType: 'swap',
            fromToken: 'ETH',
            toToken: 'USDC',
        });
        expect(tracker.getEvents()).toHaveLength(2);
        expect(provider1.events).toHaveLength(2);
        expect(provider2.events).toHaveLength(2);
        // Verify event structure
        const event = tracker.getEvents()[0];
        expect(event.type).toBe('wallet_connected');
        expect(event.sessionId).toBe('test-session-1');
        expect(event.properties.walletId).toBe('metamask');
        expect(event.timestamp).toBeGreaterThan(0);
    });
    it('should drop events when consent is not granted', async () => {
        // No consent set — defaults to false
        await tracker.track('wallet_connected', { walletId: 'metamask' });
        expect(tracker.getEvents()).toHaveLength(0);
        expect(provider1.events).toHaveLength(0);
        expect(provider2.events).toHaveLength(0);
    });
    it('should anonymize sensitive data before export', async () => {
        tracker.setConsent('analytics', true);
        await tracker.track('transaction_completed', {
            txHash: '0xabc123',
            address: '0x1234567890abcdef',
            amount: '1.5',
        });
        const events = tracker.exportData();
        const anonEvents = events.map(anonymizeEvent);
        expect(anonEvents[0].properties.txHash).toBe('[REDACTED]');
        expect(anonEvents[0].properties.address).toBe('[REDACTED]');
        expect(anonEvents[0].properties.amount).toBe('1.5'); // Not sensitive
        expect(anonEvents[0].userId).toBeUndefined();
    });
    it('should flush all providers', async () => {
        tracker.setConsent('analytics', true);
        const flushSpy1 = vi.spyOn(provider1, 'flush');
        const flushSpy2 = vi.spyOn(provider2, 'flush');
        await tracker.flush();
        expect(flushSpy1).toHaveBeenCalled();
        expect(flushSpy2).toHaveBeenCalled();
    });
    it('should track multiple events in a session with consistent sessionId', async () => {
        tracker.setConsent('analytics', true);
        await tracker.track('page_view', { page: '/dashboard' });
        await tracker.track('button_click', { button: 'connect' });
        await tracker.track('wallet_connected', { walletId: 'coinbase' });
        const events = tracker.getEvents();
        expect(events).toHaveLength(3);
        // All events should have the same session ID
        const sessionIds = new Set(events.map((e) => e.sessionId));
        expect(sessionIds.size).toBe(1);
        expect(sessionIds.has('test-session-1')).toBe(true);
    });
    it('should delete all tracked data', async () => {
        tracker.setConsent('analytics', true);
        await tracker.track('event1', {});
        await tracker.track('event2', {});
        expect(tracker.getEvents()).toHaveLength(2);
        expect(provider1.events).toHaveLength(2);
        tracker.deleteData();
        expect(tracker.getEvents()).toHaveLength(0);
        expect(provider1.events).toHaveLength(0);
    });
});
//# sourceMappingURL=analytics-flow.test.js.map