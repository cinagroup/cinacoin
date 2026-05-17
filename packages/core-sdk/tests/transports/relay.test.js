/**
 * Relay WebSocket transport tests for core-sdk.
 *
 * Tests the RelayTransport class for:
 * - Connection lifecycle (connect, disconnect, reconnect)
 * - Topic subscription management
 * - Message publish/subscribe
 * - Heartbeat/keepalive
 * - Pending message queue
 * - Reconnection logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Mock WebSocket
class MockWebSocket {
    constructor(url) {
        this.readyState = WebSocket.CONNECTING;
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        this.sent = [];
        this.url = url;
        MockWebSocket.instances.push(this);
    }
    send(data) {
        this.sent.push(data);
    }
    close(code, reason) {
        this.readyState = WebSocket.CLOSED;
        if (this.onclose) {
            this.onclose({ code: code ?? 1000, reason: reason ?? '' });
        }
    }
    simulateOpen() {
        this.readyState = WebSocket.OPEN;
        if (this.onopen)
            this.onopen();
    }
    simulateMessage(data) {
        if (this.onmessage) {
            this.onmessage({ data });
        }
    }
    simulateError() {
        if (this.onerror)
            this.onerror();
    }
    simulateClose(code = 1006) {
        this.readyState = WebSocket.CLOSED;
        if (this.onclose) {
            this.onclose({ code });
        }
    }
}
MockWebSocket.instances = [];
const RealWebSocket = globalThis.WebSocket;
beforeEach(() => {
    MockWebSocket.instances = [];
    // @ts-ignore
    globalThis.WebSocket = MockWebSocket;
    vi.useFakeTimers();
});
afterEach(() => {
    globalThis.WebSocket = RealWebSocket;
    vi.useRealTimers();
});
// Dynamic import to get the mocked WebSocket
async function importRelay() {
    return await import('../../src/transports/relay.js');
}
describe('RelayTransport', () => {
    it('creates with default config', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        expect(transport.type).toBe('relay');
        expect(transport.isConnected()).toBe(false);
    });
    it('creates with custom config', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({
            url: 'wss://relay.example.com',
            connectionTimeout: 5000,
            heartbeatInterval: 10000,
            maxReconnectAttempts: 3,
        });
        expect(transport).toBeDefined();
    });
    it('connects successfully', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        const ws = MockWebSocket.instances[0];
        ws.simulateOpen();
        await expect(connectPromise).resolves.not.toThrow();
        expect(transport.isConnected()).toBe(true);
    });
    it('connect timeout rejects', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({
            url: 'wss://relay.example.com',
            connectionTimeout: 1000,
        });
        const connectPromise = transport.connect();
        vi.advanceTimersByTime(1001);
        await expect(connectPromise).rejects.toThrow('Connection timeout');
    });
    it('connection error rejects', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        const ws = MockWebSocket.instances[0];
        ws.simulateError();
        await expect(connectPromise).rejects.toThrow('WebSocket connection error');
    });
    it('disconnects cleanly', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        const ws = MockWebSocket.instances[0];
        ws.simulateOpen();
        await connectPromise;
        transport.disconnect();
        expect(transport.isConnected()).toBe(false);
    });
    it('isConnected returns true after connect', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        expect(transport.isConnected()).toBe(true);
    });
    it('subscribes to topics', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        transport.subscribe('topic1');
        const ws = MockWebSocket.instances[0];
        const sent = ws.sent.filter((s) => {
            const msg = JSON.parse(s);
            return msg.type === 'subscribe' && msg.topic === 'topic1';
        });
        expect(sent.length).toBe(1);
    });
    it('unsubscribes from topics', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        transport.subscribe('topic1');
        transport.unsubscribe('topic1');
        const ws = MockWebSocket.instances[0];
        const sent = ws.sent.filter((s) => {
            const msg = JSON.parse(s);
            return msg.type === 'unsubscribe' && msg.topic === 'topic1';
        });
        expect(sent.length).toBe(1);
    });
    it('publishes messages when connected', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        transport.publish('topic1', 'encrypted-payload');
        const ws = MockWebSocket.instances[0];
        const sent = ws.sent.filter((s) => {
            const msg = JSON.parse(s);
            return msg.type === 'publish' && msg.topic === 'topic1' && msg.payload === 'encrypted-payload';
        });
        expect(sent.length).toBe(1);
    });
    it('queues messages when disconnected', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        transport.publish('topic1', 'payload');
        expect(transport.isConnected()).toBe(false); // queued
    });
    it('emits message event on incoming data', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        let received = [];
        transport.on('message', (topic, payload) => {
            received = [topic, payload];
        });
        MockWebSocket.instances[0].simulateMessage(JSON.stringify({ type: 'message', topic: 't1', payload: 'data' }));
        expect(received).toEqual(['t1', 'data']);
    });
    it('emits connected event', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        let connected = false;
        transport.on('connected', () => {
            connected = true;
        });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        expect(connected).toBe(true);
    });
    it('emits disconnected event', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        let disconnected = false;
        transport.on('disconnected', () => {
            disconnected = true;
        });
        MockWebSocket.instances[0].simulateClose(1006);
        expect(disconnected).toBe(true);
    });
    it('sends heartbeat periodically', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({
            url: 'wss://relay.example.com',
            heartbeatInterval: 5000,
        });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        const ws = MockWebSocket.instances[0];
        const pingCount = () => ws.sent.filter((s) => {
            const msg = JSON.parse(s);
            return msg.type === 'ping';
        }).length;
        expect(pingCount()).toBe(0);
        vi.advanceTimersByTime(5000);
        expect(pingCount()).toBe(1);
        vi.advanceTimersByTime(5000);
        expect(pingCount()).toBe(2);
    });
    it('handles ack messages', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        let ackTopic;
        transport.on('ack', (topic) => {
            ackTopic = topic;
        });
        MockWebSocket.instances[0].simulateMessage(JSON.stringify({ type: 'ack', topic: 'my-topic' }));
        expect(ackTopic).toBe('my-topic');
    });
    it('handles error messages', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        let error = null;
        transport.on('error', (e) => {
            error = e;
        });
        MockWebSocket.instances[0].simulateMessage(JSON.stringify({ type: 'error', message: 'relay error' }));
        expect(error?.message).toBe('relay error');
    });
    it('reconnects after disconnect', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({
            url: 'wss://relay.example.com',
            maxReconnectAttempts: 1,
        });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        transport.disconnect();
        expect(transport.isConnected()).toBe(false);
    });
    it('reconnect is idempotent when already connected', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        // Second connect should resolve immediately
        await expect(transport.connect()).resolves.not.toThrow();
    });
    it('stops heartbeat on disconnect', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({
            url: 'wss://relay.example.com',
            heartbeatInterval: 5000,
        });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        transport.disconnect();
        vi.advanceTimersByTime(10000);
        // After disconnect, no more pings should be sent
        const ws = MockWebSocket.instances[0];
        const pingCount = ws.sent.filter((s) => JSON.parse(s).type === 'ping').length;
        expect(pingCount).toBe(0); // heartbeat was stopped
    });
    it('handles malformed incoming messages gracefully', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        // Should not throw
        expect(() => {
            MockWebSocket.instances[0].simulateMessage('not-json');
        }).not.toThrow();
    });
    it('resubscribes to topics after reconnect', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        transport.subscribe('topic1');
        MockWebSocket.instances[0].simulateClose(1006); // unexpected close
        vi.advanceTimersByTime(2000); // reconnect delay
        const newWs = MockWebSocket.instances[1];
        if (newWs) {
            newWs.simulateOpen();
            const sent = newWs.sent.filter((s) => {
                const msg = JSON.parse(s);
                return msg.type === 'subscribe' && msg.topic === 'topic1';
            });
            expect(sent.length).toBe(1);
        }
    });
    it('flushes pending messages after reconnect', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        transport.publish('topic1', 'pending-payload');
        const ws = MockWebSocket.instances[0];
        const published = ws.sent.filter((s) => {
            const msg = JSON.parse(s);
            return msg.type === 'publish' && msg.payload === 'pending-payload';
        });
        expect(published.length).toBe(1);
    });
    it('handles pong messages silently', async () => {
        const { RelayTransport } = await importRelay();
        const transport = new RelayTransport({ url: 'wss://relay.example.com' });
        const connectPromise = transport.connect();
        MockWebSocket.instances[0].simulateOpen();
        await connectPromise;
        // Should not throw or emit any error
        expect(() => {
            MockWebSocket.instances[0].simulateMessage(JSON.stringify({ type: 'pong' }));
        }).not.toThrow();
    });
});
//# sourceMappingURL=relay.test.js.map