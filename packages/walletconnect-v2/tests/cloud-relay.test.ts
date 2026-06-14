/**
 * CloudRelay unit tests.
 *
 * Tests the IRN (Inter-Relay Network) protocol implementation:
 * - Connection lifecycle (connect, disconnect, reconnect, fallback)
 * - Subscription management (subscribe, unsubscribe, resubscribe)
 * - Publish (single, batch, queued)
 * - Message handling (IRN responses, subscription notifications, errors)
 * - Heartbeat (ping/pong, stale detection)
 * - Reconnection with exponential backoff
 * - Utility methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CloudRelay,
  WC_CLOUD_RELAY_URL,
  FALLBACK_RELAY_URLS,
  WAKU_FALLBACK_RELAY_URLS,
  IRN_PROTOCOL_VERSION,
} from '../src/cloud-relay.js';

// ============================================================
// Mock WebSocket
// ============================================================

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  _sentMessages: unknown[] = [];
  _url: string;

  constructor(url: string) {
    this._url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this._sentMessages.push(JSON.parse(data));
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason });
    }
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  simulateError() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onerror) this.onerror();
  }

  static instances: MockWebSocket[] = [];
  static reset() {
    MockWebSocket.instances = [];
  }
  static get latest(): MockWebSocket | null {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1] ?? null;
  }
}

function setupWebSocketMock() {
  MockWebSocket.reset();
  vi.stubGlobal('WebSocket', class {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url: string) {
      const ws = new MockWebSocket(url);
      return ws;
    }
  });
}

/** Create a relay config with NO fallback URLs to prevent fallback loop in tests */
function testConfig(overrides = {}) {
  return {
    url: 'wss://test.example.com',
    fallbackUrls: [],
    maxReconnectAttempts: 0,
    connectionTimeout: 100, // Short timeout for tests
    ...overrides,
  };
}

// ============================================================
// Constants & Exports
// ============================================================

describe('CloudRelay constants', () => {
  it('exports WC_CLOUD_RELAY_URL', () => {
    expect(WC_CLOUD_RELAY_URL).toBe('wss://relay.walletconnect.com');
  });

  it('exports FALLBACK_RELAY_URLS as array', () => {
    expect(Array.isArray(FALLBACK_RELAY_URLS)).toBe(true);
    expect(FALLBACK_RELAY_URLS.length).toBeGreaterThan(0);
  });

  it('exports WAKU_FALLBACK_RELAY_URLS as array', () => {
    expect(Array.isArray(WAKU_FALLBACK_RELAY_URLS)).toBe(true);
    expect(WAKU_FALLBACK_RELAY_URLS.length).toBeGreaterThan(0);
  });

  it('exports IRN_PROTOCOL_VERSION', () => {
    expect(IRN_PROTOCOL_VERSION).toBe('irn.org');
  });
});

// ============================================================
// Constructor & Configuration
// ============================================================

describe('CloudRelay constructor', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates with default config', () => {
    const relay = new CloudRelay(testConfig());
    expect(relay).toBeDefined();
    expect(relay.getState()).toBe('disconnected');
    expect(relay.isConnected()).toBe(false);
  });

  it('uses default URL when none provided', () => {
    const relay = new CloudRelay({ fallbackUrls: [] });
    expect(relay).toBeDefined();
    expect(relay.getState()).toBe('disconnected');
  });

  it('accepts projectId', () => {
    const relay = new CloudRelay({
      ...testConfig(),
      url: 'wss://relay.walletconnect.com',
      projectId: 'test-project-id',
    });
    expect(relay).toBeDefined();
  });

  it('accepts custom fallback URLs', () => {
    const relay = new CloudRelay({
      ...testConfig(),
      fallbackUrls: ['wss://fallback1.example.com'],
    });
    expect(relay).toBeDefined();
  });

  it('accepts custom timeouts', () => {
    const relay = new CloudRelay({
      ...testConfig(),
      connectionTimeout: 5000,
      heartbeatInterval: 15000,
      maxReconnectAttempts: 3,
    });
    expect(relay).toBeDefined();
  });
});

// ============================================================
// Connection Lifecycle
// ============================================================

describe('CloudRelay connection', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('transitions to connected on WebSocket open', async () => {
    const relay = new CloudRelay(testConfig());
    const connectPromise = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await connectPromise;

    expect(relay.getState()).toBe('connected');
    expect(relay.isConnected()).toBe(true);
  });

  it('emits connected event', async () => {
    const relay = new CloudRelay(testConfig());
    const handler = vi.fn();
    relay.on('connected', handler);

    const connectPromise = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await connectPromise;

    expect(handler).toHaveBeenCalled();
  });

  it('returns immediately if already connected', async () => {
    const relay = new CloudRelay(testConfig());
    const p1 = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p1;

    await expect(relay.connect()).resolves.toBeUndefined();
  });

  it('rejects on WebSocket error', async () => {
    const relay = new CloudRelay(testConfig());
    const connectPromise = relay.connect();
    MockWebSocket.latest!.simulateError();

    await expect(connectPromise).rejects.toThrow('Failed to connect to any relay server');
    expect(relay.getState()).toBe('error');
  });

  it('transitions to disconnected on clean close', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    MockWebSocket.latest!.close(1000, 'normal');
    expect(relay.getState()).toBe('disconnected');
  });

  it('emits disconnected event on close', async () => {
    const relay = new CloudRelay(testConfig());
    const handler = vi.fn();
    relay.on('disconnected', handler);

    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    MockWebSocket.latest!.close(1000, 'normal');
    expect(handler).toHaveBeenCalled();
  });

  it('appends projectId to URL for walletconnect.com', async () => {
    const relay = new CloudRelay({
      ...testConfig(),
      url: 'wss://relay.walletconnect.com',
      projectId: 'my-project-id',
    });
    const p = relay.connect();
    const ws = MockWebSocket.latest!;
    expect(ws._url).toContain('projectId=my-project-id');
    ws.simulateOpen();
    await p;
  });

  it('disconnect cleans up WebSocket', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    relay.disconnect();
    expect(relay.getState()).toBe('disconnected');
    expect(relay.isConnected()).toBe(false);
  });

  it('disconnect rejects pending publishes', async () => {
    const relay = new CloudRelay(testConfig());
    // Don't connect — publish will be queued
    const publishPromise = relay.publish('topic123', 'payload');

    relay.disconnect();
    await expect(publishPromise).rejects.toThrow('Relay disconnected');
  });
});

// ============================================================
// Subscription Management
// ============================================================

describe('CloudRelay subscriptions', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subscribe sends irn_subscribe when connected', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'a'.repeat(64);
    const subPromise = relay.subscribe(topic);

    // Simulate response to prevent timeout
    const sent = MockWebSocket.latest!._sentMessages;
    const subMsg = sent.find(
      (m: any) => m.method === 'irn_subscribe' && m.params?.topic === topic,
    );
    expect(subMsg).toBeDefined();
    
    MockWebSocket.latest!.simulateMessage({
      id: subMsg.id,
      jsonrpc: '2.0',
      result: { id: 1 },
    });
    
    await subPromise;
  });

  it('subscribe resolves when response received', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'b'.repeat(64);
    const subPromise = relay.subscribe(topic);

    // Get the actual request from the WebSocket
    const sent = MockWebSocket.latest!._sentMessages;
    const subMsg = sent.find((m: any) => m.method === 'irn_subscribe');
    const requestId = subMsg.id;

    // Send response with the correct ID
    MockWebSocket.latest!.simulateMessage({
      id: requestId,
      jsonrpc: '2.0',
      result: { id: 42, subscriptionId: 42 },
    });

    const subId = await subPromise;
    expect(subId).toBe(42);
  });

  it('subscribe rejects on error response', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'c'.repeat(64);
    const subPromise = relay.subscribe(topic);

    // Get the actual request from the WebSocket
    const sent = MockWebSocket.latest!._sentMessages;
    const subMsg = sent.find((m: any) => m.method === 'irn_subscribe');
    const requestId = subMsg.id;

    // Send error response with the correct ID
    MockWebSocket.latest!.simulateMessage({
      id: requestId,
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid request' },
    });

    await expect(subPromise).rejects.toThrow('Invalid request');
  });

  it('subscribe returns existing ID for already-subscribed topic', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'e'.repeat(64);

    // First subscribe
    const sub1 = relay.subscribe(topic);
    const sent = MockWebSocket.latest!._sentMessages;
    const subMsg = sent.find((m: any) => m.method === 'irn_subscribe');
    const requestId = subMsg.id;
    
    MockWebSocket.latest!.simulateMessage({
      id: requestId,
      jsonrpc: '2.0',
      result: { id: 99 },
    });
    const id1 = await sub1;

    // Second subscribe to same topic should return same ID
    const id2 = await relay.subscribe(topic);
    expect(id2).toBe(id1);
  });

  it('subscribe registers handler for topic', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'f'.repeat(64);
    const handler = vi.fn();
    relay.subscribe(topic, handler);

    MockWebSocket.latest!.simulateMessage({
      id: 0,
      jsonrpc: '2.0',
      method: 'irn_subscription',
      params: { topic, message: 'encrypted-payload' },
    });

    expect(handler).toHaveBeenCalledWith('encrypted-payload', topic);
  });

  it('unsubscribe sends irn_unsubscribe when connected', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'g'.repeat(64);
    const subP = relay.subscribe(topic);

    const sent = MockWebSocket.latest!._sentMessages;
    const subMsg = sent.find((m: any) => m.method === 'irn_subscribe');
    MockWebSocket.latest!.simulateMessage({
      id: subMsg.id,
      jsonrpc: '2.0',
      result: { id: 1 },
    });
    await subP;

    MockWebSocket.latest!._sentMessages.length = 0;
    await relay.unsubscribe(topic);

    const unsubMsg = MockWebSocket.latest!._sentMessages.find(
      (m: any) => m.method === 'irn_unsubscribe',
    );
    expect(unsubMsg).toBeDefined();
  });

  it('getSubscribedTopics returns all topics', () => {
    const relay = new CloudRelay(testConfig());
    relay.subscribe('topic1');
    relay.subscribe('topic2');

    const topics = relay.getSubscribedTopics();
    expect(topics).toContain('topic1');
    expect(topics).toContain('topic2');
  });

  it('getSubscriptionCount returns active count', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'i'.repeat(64);
    const subP = relay.subscribe(topic);

    // Get the actual request from the WebSocket
    const sent = MockWebSocket.latest!._sentMessages;
    const subMsg = sent.find((m: any) => m.method === 'irn_subscribe');
    const requestId = subMsg.id;
    
    MockWebSocket.latest!.simulateMessage({
      id: requestId,
      jsonrpc: '2.0',
      result: { id: 1 },
    });

    await subP;
    expect(relay.getSubscriptionCount()).toBe(1);
  });
});

// ============================================================
// Publish
// ============================================================

describe('CloudRelay publish', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('publish sends irn_publish when connected', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'j'.repeat(64);
    await relay.publish(topic, 'encrypted-data', 11);

    const sent = MockWebSocket.latest!._sentMessages;
    const pubMsg = sent.find(
      (m: any) => m.method === 'irn_publish' && m.params?.topic === topic,
    );
    expect(pubMsg).toBeDefined();
    expect((pubMsg as any).params.message).toBe('encrypted-data');
    expect((pubMsg as any).params.tag).toBe(11);
  });

  it('publish uses default tag of 11', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    await relay.publish('topic', 'data');

    const sent = MockWebSocket.latest!._sentMessages;
    const pubMsg = sent.find((m: any) => m.method === 'irn_publish');
    expect((pubMsg as any).params.tag).toBe(11);
  });

  it('publish queues when not connected and flushes on connect', async () => {
    const relay = new CloudRelay(testConfig());

    // Publish without connecting — will be queued
    const publishPromise = relay.publish('topic', 'queued-data');

    // Now connect
    const connectPromise = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await connectPromise;

    await publishPromise;

    const sent = MockWebSocket.latest!._sentMessages;
    const pubMsg = sent.find(
      (m: any) => m.method === 'irn_publish' && m.params?.message === 'queued-data',
    );
    expect(pubMsg).toBeDefined();
  });

  it('batchPublish sends irn_batchPublish', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    await relay.batchPublish([
      { topic: 'topic1', payload: 'data1' },
      { topic: 'topic2', payload: 'data2', tag: 12 },
    ]);

    const sent = MockWebSocket.latest!._sentMessages;
    const batchMsg = sent.find((m: any) => m.method === 'irn_batchPublish');
    expect(batchMsg).toBeDefined();
    expect((batchMsg as any).params.messages).toHaveLength(2);
  });

  it('batchPublish does nothing when not connected', async () => {
    const relay = new CloudRelay(testConfig());
    await relay.batchPublish([{ topic: 't', payload: 'd' }]);
    // Should not throw
  });

  it('batchPublish does nothing with empty array', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    MockWebSocket.latest!._sentMessages.length = 0;
    await relay.batchPublish([]);
    expect(MockWebSocket.latest!._sentMessages).toHaveLength(0);
  });
});

// ============================================================
// Message Handling
// ============================================================

describe('CloudRelay message handling', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles irn_subscription notifications', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'k'.repeat(64);
    const handler = vi.fn();
    relay.subscribe(topic, handler);

    const globalHandler = vi.fn();
    relay.on('message', globalHandler);

    MockWebSocket.latest!.simulateMessage({
      id: 0,
      jsonrpc: '2.0',
      method: 'irn_subscription',
      params: { topic, message: 'payload-data' },
    });

    expect(handler).toHaveBeenCalledWith('payload-data', topic);
    expect(globalHandler).toHaveBeenCalledWith('payload-data', topic);
  });

  it('handles irn_pong responses', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    // Should not throw
    MockWebSocket.latest!.simulateMessage({
      id: 0,
      jsonrpc: '2.0',
      method: 'irn_pong',
      params: {},
    });
  });

  it('handles irn_error messages', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const errorHandler = vi.fn();
    relay.on('error', errorHandler);

    MockWebSocket.latest!.simulateMessage({
      id: 0,
      jsonrpc: '2.0',
      method: 'irn_error',
      params: { code: 401, message: 'Invalid project ID' },
    });

    expect(errorHandler).toHaveBeenCalled();
  });

  it('handles legacy message format', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const topic = 'l'.repeat(64);
    const handler = vi.fn();
    relay.subscribe(topic, handler);

    MockWebSocket.latest!.simulateMessage({
      type: 'message',
      topic,
      payload: 'legacy-data',
      tag: 11,
      timestamp: Date.now(),
    });

    expect(handler).toHaveBeenCalledWith('legacy-data', topic, 11);
  });

  it('handles malformed JSON gracefully', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    // Send invalid JSON — should not throw
    MockWebSocket.latest!.onmessage!({ data: 'not-json{{{' });
  });

  it('handles publish error responses', async () => {
    const relay = new CloudRelay(testConfig());
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const errorHandler = vi.fn();
    relay.on('publish_error', errorHandler);

    MockWebSocket.latest!.simulateMessage({
      id: 999,
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Publish failed' },
    });

    expect(errorHandler).toHaveBeenCalled();
  });
});

// ============================================================
// Heartbeat
// ============================================================

describe('CloudRelay heartbeat', () => {
  beforeEach(() => {
    setupWebSocketMock();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sends irn_ping at configured interval', async () => {
    const relay = new CloudRelay({
      ...testConfig(),
      heartbeatInterval: 1000,
    });
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    MockWebSocket.latest!._sentMessages.length = 0;
    await vi.advanceTimersByTimeAsync(1100);

    const sent = MockWebSocket.latest!._sentMessages;
    const pingMsg = sent.find((m: any) => m.method === 'irn_ping');
    expect(pingMsg).toBeDefined();
  });

  it('stops heartbeat on disconnect', async () => {
    const relay = new CloudRelay({
      ...testConfig(),
      heartbeatInterval: 1000,
    });
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    relay.disconnect();

    MockWebSocket.latest!._sentMessages.length = 0;
    await vi.advanceTimersByTimeAsync(2000);

    const sent = MockWebSocket.latest!._sentMessages;
    const pingMsg = sent.find((m: any) => m.method === 'irn_ping');
    expect(pingMsg).toBeUndefined();
  });
});

// ============================================================
// Reconnection
// ============================================================

describe('CloudRelay reconnection', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attempts reconnect on abnormal close', async () => {
    const relay = new CloudRelay({
      ...testConfig(),
      maxReconnectAttempts: 2,
    });
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    // Abnormal close (not 1000 or 1001)
    MockWebSocket.latest!.close(4000, 'Abnormal');

    expect(relay.getState()).toBe('reconnecting');
  });

  it('does not reconnect on clean close (1000)', async () => {
    const relay = new CloudRelay({
      ...testConfig(),
      maxReconnectAttempts: 2,
    });
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    MockWebSocket.latest!.close(1000, 'Normal');
    expect(relay.getState()).toBe('disconnected');
  });

  it('emits error after max reconnect attempts exhausted', async () => {
    const relay = new CloudRelay({
      ...testConfig(),
      maxReconnectAttempts: 0,
    });
    const p = relay.connect();
    MockWebSocket.latest!.simulateOpen();
    await p;

    const errorHandler = vi.fn();
    relay.on('error', errorHandler);

    // Abnormal close with 0 max attempts
    MockWebSocket.latest!.close(4000, 'Abnormal');

    expect(relay.getState()).toBe('error');
    expect(errorHandler).toHaveBeenCalled();
  });
});

// ============================================================
// Utility Methods
// ============================================================

describe('CloudRelay utility', () => {
  beforeEach(() => {
    setupWebSocketMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getConnectedUrl returns the connection URL', () => {
    const relay = new CloudRelay(testConfig());
    expect(relay.getConnectedUrl()).toBe('wss://test.example.com');
  });

  it('getSubscribedTopics returns empty initially', () => {
    const relay = new CloudRelay(testConfig());
    expect(relay.getSubscribedTopics()).toEqual([]);
  });

  it('getSubscriptionCount returns 0 initially', () => {
    const relay = new CloudRelay(testConfig());
    expect(relay.getSubscriptionCount()).toBe(0);
  });
});
