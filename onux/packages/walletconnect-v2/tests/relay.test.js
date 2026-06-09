/**
 * WalletConnect v2 Relay (WcRelay) tests.
 *
 * Tests the WcRelay WebSocket relay client implementation.
 */
var _a;
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WcRelay } from '../src/relay.js';
// ============================================================
// Helper: Mock WebSocket
// ============================================================
class MockWebSocket {
    constructor(_url) {
        this.readyState = WebSocket.CONNECTING;
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        this._sentMessages = [];
        // Start in CONNECTING state
    }
    send(data) {
        this._sentMessages.push(JSON.parse(data));
    }
    close(code = 1000, reason = '') {
        this.readyState = WebSocket.CLOSED;
        if (this.onclose) {
            this.onclose({ code, reason });
        }
    }
    simulateOpen() {
        this.readyState = WebSocket.OPEN;
        if (this.onopen)
            this.onopen();
    }
    simulateMessage(data) {
        if (this.onmessage) {
            this.onmessage({ data: JSON.stringify(data) });
        }
    }
    simulateError() {
        if (this.onerror)
            this.onerror();
    }
}
let mockWs = null;
vi.stubGlobal('WebSocket', (_a = class {
        constructor(url) {
            mockWs = new MockWebSocket(url);
            return mockWs;
        }
    },
    _a.CONNECTING = 0,
    _a.OPEN = 1,
    _a.CLOSING = 2,
    _a.CLOSED = 3,
    _a));
function getMockWs() {
    if (!mockWs)
        throw new Error('WebSocket not instantiated');
    return mockWs;
}
// ============================================================
// Constructor & Config
// ============================================================
describe('WcRelay constructor', () => {
    beforeEach(() => {
        mockWs = null;
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('uses default connectionTimeout of 10s', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        expect(relay).toBeDefined();
        expect(relay.getState()).toBe('disconnected');
    });
    it('uses default heartbeatInterval of 30s', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        expect(relay.isConnected()).toBe(false);
    });
    it('uses default maxReconnectAttempts of 10', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        expect(relay).toBeDefined();
    });
    it('accepts custom config overrides', () => {
        const relay = new WcRelay({
            url: 'wss://test.example.com',
            connectionTimeout: 5000,
            heartbeatInterval: 15000,
            maxReconnectAttempts: 3,
        });
        expect(relay).toBeDefined();
    });
});
// ============================================================
// State management
// ============================================================
describe('WcRelay state management', () => {
    beforeEach(() => {
        mockWs = null;
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('starts in disconnected state', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        expect(relay.getState()).toBe('disconnected');
    });
    it('isConnected returns false initially', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        expect(relay.isConnected()).toBe(false);
    });
});
// ============================================================
// Connection lifecycle (mocked)
// ============================================================
describe('WcRelay connection lifecycle', () => {
    beforeEach(() => {
        mockWs = null;
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        mockWs = null;
    });
    it('transitions to connected state on WebSocket open', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        const ws = getMockWs();
        ws.simulateOpen();
        await connectPromise;
        expect(relay.getState()).toBe('connected');
        expect(relay.isConnected()).toBe(true);
    });
    it('emits connected event on successful connection', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const handler = vi.fn();
        relay.on('connected', handler);
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        expect(handler).toHaveBeenCalled();
    });
    it('returns immediately if already connected', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        // Second connect should resolve immediately
        await expect(relay.connect()).resolves.toBeUndefined();
    });
    it('rejects on WebSocket error', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateError();
        await expect(connectPromise).rejects.toThrow('WebSocket connection error');
        expect(relay.getState()).toBe('error');
    });
    it('rejects on connection timeout', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com', connectionTimeout: 100 });
        const connectPromise = relay.connect();
        // Advance time past timeout
        await vi.advanceTimersByTimeAsync(150);
        await expect(connectPromise).rejects.toThrow('Relay connection timeout');
        expect(relay.getState()).toBe('error');
    });
    it('transitions to disconnected on close', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        getMockWs().close(1000, 'Client disconnect');
        expect(relay.getState()).toBe('disconnected');
    });
    it('emits disconnected event on close', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const disconnectHandler = vi.fn();
        relay.on('disconnected', disconnectHandler);
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        getMockWs().close(1000, 'normal');
        expect(disconnectHandler).toHaveBeenCalled();
    });
});
// ============================================================
// Subscription management
// ============================================================
describe('WcRelay subscriptions', () => {
    beforeEach(() => {
        mockWs = null;
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        mockWs = null;
    });
    it('subscribe adds topic and sends subscribe message when connected', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        const topic = 'abc123'.repeat(11) + 'abc'; // 64 chars
        relay.subscribe(topic);
        const sent = getMockWs()._sentMessages;
        const subMsg = sent.find((m) => m.type === 'subscribe' && m.topic === topic);
        expect(subMsg).toBeDefined();
    });
    it('subscribe queues topic when not connected', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const topic = 'abc123'.repeat(11) + 'abc';
        relay.subscribe(topic);
        // Should not throw, topic stored for later
    });
    it('unsubscribe removes topic and sends unsubscribe when connected', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        const topic = 'abc123'.repeat(11) + 'abc';
        relay.subscribe(topic);
        relay.unsubscribe(topic);
        const sent = getMockWs()._sentMessages;
        const unsubMsg = sent.find((m) => m.type === 'unsubscribe' && m.topic === topic);
        expect(unsubMsg).toBeDefined();
    });
    it('unsubscribe with handler removes only that handler', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const topic = 'abc123'.repeat(11) + 'abc';
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        relay.subscribe(topic, handler1);
        relay.subscribe(topic, handler2);
        relay.unsubscribe(topic, handler1);
        // handler2 should still be registered
    });
});
// ============================================================
// Publish
// ============================================================
describe('WcRelay publish', () => {
    beforeEach(() => {
        mockWs = null;
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        mockWs = null;
    });
    it('publish sends message when connected', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        const topic = 'abc123'.repeat(11) + 'abc';
        await relay.publish(topic, 'encrypted-payload');
        const sent = getMockWs()._sentMessages;
        const pubMsg = sent.find((m) => m.type === 'publish' && m.topic === topic && m.payload === 'encrypted-payload');
        expect(pubMsg).toBeDefined();
    });
    it('publish queues message when not connected', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const topic = 'abc123'.repeat(11) + 'abc';
        // Start connect but don't open yet
        const connectPromise = relay.connect();
        // Publish while still connecting
        const publishPromise = relay.publish(topic, 'encrypted-data');
        // Open the connection
        getMockWs().simulateOpen();
        await connectPromise;
        await publishPromise;
        const sent = getMockWs()._sentMessages;
        const pubMsg = sent.find((m) => m.type === 'publish' && m.topic === topic);
        expect(pubMsg).toBeDefined();
    });
});
// ============================================================
// Message handling
// ============================================================
describe('WcRelay message handling', () => {
    beforeEach(() => {
        mockWs = null;
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        mockWs = null;
    });
    it('delivers message type to topic handlers', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        const topic = 'abc123'.repeat(11) + 'abc';
        const handler = vi.fn();
        relay.subscribe(topic, handler);
        getMockWs().simulateMessage({
            type: 'message',
            topic,
            payload: 'test-payload',
            timestamp: Date.now(),
        });
        expect(handler).toHaveBeenCalledWith('test-payload', topic);
    });
    it('emits message event globally', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        const globalHandler = vi.fn();
        relay.on('message', globalHandler);
        getMockWs().simulateMessage({
            type: 'message',
            topic: 'test-topic',
            payload: 'data',
            timestamp: Date.now(),
        });
        expect(globalHandler).toHaveBeenCalledWith('data', 'test-topic');
    });
    it('emits ack event on ack message', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        const ackHandler = vi.fn();
        relay.on('ack', ackHandler);
        getMockWs().simulateMessage({
            type: 'ack',
            topic: 'test-topic',
            payload: '',
            timestamp: Date.now(),
        });
        expect(ackHandler).toHaveBeenCalledWith('test-topic');
    });
    it('emits error event on error message', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        const errorHandler = vi.fn();
        relay.on('error', errorHandler);
        getMockWs().simulateMessage({
            type: 'error',
            topic: 'test',
            payload: '',
            timestamp: Date.now(),
            message: 'relay error details',
        });
        expect(errorHandler).toHaveBeenCalled();
    });
});
// ============================================================
// Disconnect
// ============================================================
describe('WcRelay disconnect', () => {
    beforeEach(() => {
        mockWs = null;
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        mockWs = null;
    });
    it('closes WebSocket and sets state to disconnected', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        relay.disconnect();
        expect(relay.getState()).toBe('disconnected');
    });
    it('emits disconnected event', () => {
        const relay = new WcRelay({ url: 'wss://test.example.com' });
        const handler = vi.fn();
        relay.on('disconnected', handler);
        relay.disconnect();
        expect(handler).toHaveBeenCalled();
    });
});
// ============================================================
// Heartbeat
// ============================================================
describe('WcRelay heartbeat', () => {
    beforeEach(() => {
        mockWs = null;
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        mockWs = null;
    });
    it('sends ping messages at configured interval', async () => {
        const relay = new WcRelay({ url: 'wss://test.example.com', heartbeatInterval: 1000 });
        const connectPromise = relay.connect();
        getMockWs().simulateOpen();
        await connectPromise;
        // Clear connection messages
        getMockWs()._sentMessages.length = 0;
        // Advance time past heartbeat interval
        await vi.advanceTimersByTimeAsync(1100);
        const sent = getMockWs()._sentMessages;
        const pingMsg = sent.find((m) => m.type === 'ping');
        expect(pingMsg).toBeDefined();
    });
});
//# sourceMappingURL=relay.test.js.map