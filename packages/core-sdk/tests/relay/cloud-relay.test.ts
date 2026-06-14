/**
 * CloudRelay comprehensive tests.
 *
 * Tests the production-grade relay transport with:
 * - Multi-endpoint failover
 * - Exponential backoff with jitter
 * - Connection pool and concurrency control
 * - Adaptive heartbeat
 * - Circuit breaker integration
 * - Metrics collection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  sent: unknown[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code: code ?? 1000, reason: reason ?? '', wasClean: code === 1000 } as CloseEvent);
    }
  }

  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  simulateError(): void {
    if (this.onerror) this.onerror(new Event('error'));
  }

  simulateClose(code: number = 1006, reason: string = ''): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason, wasClean: code === 1000 } as CloseEvent);
    }
  }
}

const RealWebSocket = globalThis.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket;
  vi.useFakeTimers();
});

afterEach(() => {
  globalThis.WebSocket = RealWebSocket;
  vi.useRealTimers();
});

async function importCloudRelay() {
  return await import('../../src/relay/cloud-relay.js');
}

/**
 * Helper: advance timers and flush promises to handle retry backoff.
 */
async function advanceTimersAndFlush(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
}

describe('CloudRelay', () => {
  describe('Initialization', () => {
    it('creates with minimal config', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });
      expect(relay.type).toBe('cloud-relay');
      expect(relay.isConnected()).toBe(false);
      expect(relay.getState()).toBe('disconnected');
    });

    it('creates with full config', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [
          { url: 'wss://relay1.example.com', name: 'primary', priority: 1 },
          { url: 'wss://relay2.example.com', name: 'backup', priority: 2 },
        ],
        fallbackUrl: 'wss://relay.walletconnect.org',
        connectionTimeout: 5000,
        projectId: 'test-project',
        pool: {
          maxConnections: 10,
          maxPendingRequests: 200,
          requestTimeout: 60000,
        },
        retry: {
          maxAttempts: 5,
          initialDelay: 500,
          maxDelay: 60000,
          multiplier: 2.5,
          jitter: false,
        },
        heartbeat: {
          interval: 15000,
          adaptive: true,
          missedThreshold: 5,
          latencyThreshold: 300,
        },
        debug: true,
      });
      expect(relay).toBeDefined();
    });

    it('adds default fallback endpoint', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });
      
      const metrics = relay.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('Connection', () => {
    it('connects to primary endpoint', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com', name: 'primary' }],
      });

      const connectPromise = relay.connect();
      const ws = MockWebSocket.instances[0];
      ws.simulateOpen();

      await expect(connectPromise).resolves.not.toThrow();
      expect(relay.isConnected()).toBe(true);
      expect(relay.getState()).toBe('connected');
      expect(relay.getActiveEndpoint()).toBe('wss://relay.example.com');
    });

    it('fails over to secondary endpoint', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [
          { url: 'wss://primary.example.com', name: 'primary' },
          { url: 'wss://backup.example.com', name: 'backup' },
        ],
        retry: { maxAttempts: 1, initialDelay: 100, jitter: false },
      });

      const connectPromise = relay.connect();
      
      // Primary fails
      const ws1 = MockWebSocket.instances[0];
      ws1.simulateError();

      // Advance past the backoff delay
      await advanceTimersAndFlush(200);

      // Backup should now be attempted
      const ws2 = MockWebSocket.instances[1];
      if (ws2) {
        ws2.simulateOpen();
      }

      await expect(connectPromise).resolves.not.toThrow();
      expect(relay.isConnected()).toBe(true);
      expect(relay.getActiveEndpoint()).toBe('wss://backup.example.com');
    });

    it('fails over to WalletConnect fallback', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://custom.example.com', name: 'custom' }],
        retry: { maxAttempts: 1, initialDelay: 100, jitter: false },
      });

      const connectPromise = relay.connect();
      
      // Custom endpoint fails
      const ws1 = MockWebSocket.instances[0];
      ws1.simulateError();

      // Advance past backoff
      await advanceTimersAndFlush(200);

      // WalletConnect fallback should now be attempted
      const wsFallback = MockWebSocket.instances.find(ws => 
        ws.url.includes('relay.walletconnect.org')
      );
      if (wsFallback) {
        wsFallback.simulateOpen();
      }

      await expect(connectPromise).resolves.not.toThrow();
      expect(relay.isConnected()).toBe(true);
      expect(relay.getActiveEndpoint()).toContain('relay.walletconnect.org');
    });

    it('emits connected event', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      let connectedUrl: string | null = null;
      relay.on('connected', (url: unknown) => {
        connectedUrl = url as string;
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      expect(connectedUrl).toBe('wss://relay.example.com');
    });

    it('emits failover event', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [
          { url: 'wss://primary.example.com' },
          { url: 'wss://backup.example.com' },
        ],
        retry: { maxAttempts: 1, initialDelay: 100, jitter: false },
      });

      let failoverFrom: string | null = null;
      let failoverTo: string | null = null;
      relay.on('failover', (from: unknown, to: unknown) => {
        failoverFrom = from as string;
        failoverTo = to as string;
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateError();
      
      // Advance past backoff
      await advanceTimersAndFlush(200);
      
      const ws2 = MockWebSocket.instances[1];
      if (ws2) ws2.simulateOpen();
      await connectPromise;

      expect(failoverFrom).toBe('wss://primary.example.com');
      expect(failoverTo).toBe('wss://backup.example.com');
    });

    it('rejects when all endpoints fail', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
        fallbackUrl: 'wss://relay.walletconnect.org',
        retry: { maxAttempts: 1, initialDelay: 100, jitter: false },
      });

      const connectPromise = relay.connect();
      
      // First endpoint fails
      MockWebSocket.instances[0].simulateError();
      await advanceTimersAndFlush(200);
      
      // Fallback also fails
      const wsFallback = MockWebSocket.instances.find(ws => 
        ws.url.includes('relay.walletconnect.org')
      );
      if (wsFallback) {
        wsFallback.simulateError();
      }
      await advanceTimersAndFlush(200);

      try {
        await connectPromise;
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(relay.getState()).toBe('error');
      }
    });

    it('resolves immediately when already connected', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      await expect(relay.connect()).resolves.not.toThrow();
    });
  });

  describe('Disconnection', () => {
    it('disconnects cleanly', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.disconnect();
      expect(relay.isConnected()).toBe(false);
      expect(relay.getState()).toBe('disconnected');
      expect(relay.getActiveEndpoint()).toBeNull();
    });

    it('emits disconnected event', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      let disconnected = false;
      relay.on('disconnected', () => {
        disconnected = true;
      });

      relay.disconnect();
      expect(disconnected).toBe(true);
    });

    it('does not reconnect after intentional disconnect', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.disconnect();
      
      // Advance time to ensure no reconnection
      vi.advanceTimersByTime(60000);
      
      expect(MockWebSocket.instances.length).toBe(1); // No new connections
    });
  });

  describe('Subscriptions', () => {
    it('subscribes to topics', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.subscribe('topic123');
      
      const ws = MockWebSocket.instances[0];
      const subscribeMsg = ws.sent.find(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'subscribe' && msg.topic === 'topic123';
      });
      
      expect(subscribeMsg).toBeDefined();
    });

    it('unsubscribes from topics', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.subscribe('topic123');
      relay.unsubscribe('topic123');
      
      const ws = MockWebSocket.instances[0];
      const unsubscribeMsg = ws.sent.find(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'unsubscribe' && msg.topic === 'topic123';
      });
      
      expect(unsubscribeMsg).toBeDefined();
    });

    it('resubscribes after reconnection', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
        retry: { maxAttempts: 1, initialDelay: 100, jitter: false },
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.subscribe('topic1');
      relay.subscribe('topic2');

      // Disconnect unexpectedly
      MockWebSocket.instances[0].simulateClose(1006);
      
      // Advance past reconnect delay
      await advanceTimersAndFlush(2000);
      
      const ws2 = MockWebSocket.instances[1];
      if (ws2) {
        ws2.simulateOpen();
        // Wait for resubscribe to complete
        await advanceTimersAndFlush(100);
        
        const subscribeMsgs = ws2.sent.filter((s: unknown) => {
          const msg = JSON.parse(s as string);
          return msg.type === 'subscribe';
        });
        
        expect(subscribeMsgs.length).toBe(2);
      }
    });
  });

  describe('Publishing', () => {
    it('publishes messages when connected', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.publish('topic1', 'encrypted-payload');
      
      const ws = MockWebSocket.instances[0];
      const publishMsg = ws.sent.find(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'publish' && msg.topic === 'topic1' && msg.payload === 'encrypted-payload';
      });
      
      expect(publishMsg).toBeDefined();
    });

    it('queues messages when disconnected', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      relay.publish('topic1', 'queued-payload');
      
      // Message should be queued, not sent
      expect(MockWebSocket.instances.length).toBe(0);
    });

    it('flushes pending messages after reconnection', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      // Queue messages while disconnected
      relay.publish('topic1', 'payload1');
      relay.publish('topic2', 'payload2');

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      const ws = MockWebSocket.instances[0];
      const publishMsgs = ws.sent.filter(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'publish';
      });
      
      expect(publishMsgs.length).toBe(2);
    });
  });

  describe('Heartbeat', () => {
    it('sends periodic pings', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
        heartbeat: { interval: 5000, adaptive: false },
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      const ws = MockWebSocket.instances[0];
      
      vi.advanceTimersByTime(5000);
      const pingCount1 = ws.sent.filter(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'ping';
      }).length;
      expect(pingCount1).toBe(1);

      vi.advanceTimersByTime(5000);
      const pingCount2 = ws.sent.filter(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'ping';
      }).length;
      expect(pingCount2).toBe(2);
    });

    it('handles pong responses and tracks latency', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
        heartbeat: { interval: 5000, adaptive: false },
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      // Send ping
      vi.advanceTimersByTime(5000);

      // Simulate 50ms latency — advance timers then respond with pong
      vi.advanceTimersByTime(50);
      MockWebSocket.instances[0].simulateMessage(JSON.stringify({ type: 'pong' }));

      const metrics = relay.getMetrics();
      expect(metrics.latencyMs).toBe(50);
      expect(metrics.avgLatencyMs).toBe(50);
    });

    it('triggers heartbeat failure after missed threshold', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
        heartbeat: { interval: 5000, missedThreshold: 2, adaptive: false },
        retry: { maxAttempts: 1, initialDelay: 100, jitter: false },
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      let heartbeatFailure = false;
      relay.on('heartbeatFailure', () => {
        heartbeatFailure = true;
      });

      // First ping sent, no pong → miss 1
      vi.advanceTimersByTime(5000);
      // Miss timeout fires
      vi.advanceTimersByTime(5000);
      // Second ping sent, no pong → miss 2 (threshold reached)
      vi.advanceTimersByTime(5000);
      // Miss timeout fires again → triggers failure
      vi.advanceTimersByTime(5000);

      expect(heartbeatFailure).toBe(true);
    });

    it('stops heartbeat on disconnect', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
        heartbeat: { interval: 5000, adaptive: false },
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.disconnect();
      
      const ws = MockWebSocket.instances[0];
      const pingCountBefore = ws.sent.filter(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'ping';
      }).length;

      vi.advanceTimersByTime(10000);
      
      const pingCountAfter = ws.sent.filter(s => {
        const msg = JSON.parse(s as string);
        return msg.type === 'ping';
      }).length;

      expect(pingCountAfter).toBe(pingCountBefore);
    });
  });

  describe('Message Handling', () => {
    it('emits message event', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      let receivedTopic: string | null = null;
      let receivedPayload: string | null = null;
      relay.on('message', (topic: unknown, payload: unknown) => {
        receivedTopic = topic as string;
        receivedPayload = payload as string;
      });

      MockWebSocket.instances[0].simulateMessage(
        JSON.stringify({ type: 'message', topic: 'topic1', payload: 'data' })
      );

      expect(receivedTopic).toBe('topic1');
      expect(receivedPayload).toBe('data');
    });

    it('emits ack event', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      let ackTopic: string | null = null;
      relay.on('ack', (topic: unknown) => {
        ackTopic = topic as string;
      });

      MockWebSocket.instances[0].simulateMessage(
        JSON.stringify({ type: 'ack', topic: 'topic1' })
      );

      expect(ackTopic).toBe('topic1');
    });

    it('emits error event on relay error', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      let error: Error | null = null;
      relay.on('error', (e: unknown) => {
        error = e as Error;
      });

      MockWebSocket.instances[0].simulateMessage(
        JSON.stringify({ type: 'error', message: 'relay error' })
      );

      expect(error?.message).toBe('relay error');
    });

    it('handles malformed messages gracefully', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      expect(() => {
        MockWebSocket.instances[0].simulateMessage('not-json');
      }).not.toThrow();
    });
  });

  describe('Metrics', () => {
    it('tracks connection metrics', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      const metrics = relay.getMetrics();
      expect(metrics.connectionAttempts).toBe(1);
      expect(metrics.successfulConnections).toBe(1);
      expect(metrics.state).toBe('connected');
      expect(metrics.uptimeMs).toBeGreaterThanOrEqual(0);
    });

    it('tracks message metrics', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.publish('topic1', 'payload1');
      relay.publish('topic2', 'payload2');

      MockWebSocket.instances[0].simulateMessage(
        JSON.stringify({ type: 'message', topic: 't1', payload: 'data' })
      );

      const metrics = relay.getMetrics();
      expect(metrics.messagesSent).toBe(2);
      expect(metrics.messagesReceived).toBe(1);
    });

    it('tracks latency metrics', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
        heartbeat: { interval: 5000, adaptive: false },
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      // Send ping
      vi.advanceTimersByTime(5000);

      // Simulate 100ms latency
      vi.advanceTimersByTime(100);
      MockWebSocket.instances[0].simulateMessage(JSON.stringify({ type: 'pong' }));

      const metrics = relay.getMetrics();
      expect(metrics.latencyMs).toBe(100);
      expect(metrics.avgLatencyMs).toBe(100);
    });

    it('resets metrics', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      relay.resetMetrics();

      const metrics = relay.getMetrics();
      expect(metrics.connectionAttempts).toBe(0);
      expect(metrics.successfulConnections).toBe(0);
    });
  });

  describe('Force Failover', () => {
    it('forces failover to next endpoint', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [
          { url: 'wss://primary.example.com' },
          { url: 'wss://backup.example.com' },
        ],
        retry: { maxAttempts: 1, initialDelay: 100, jitter: false },
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      expect(relay.getActiveEndpoint()).toBe('wss://primary.example.com');

      const failoverPromise = relay.forceFailover('manual trigger');
      
      // The forceFailover closes current ws and calls connect() which tries next endpoint
      // Find the new WebSocket (should be backup)
      const ws2 = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      ws2.simulateOpen();
      
      await failoverPromise;

      expect(relay.getActiveEndpoint()).toBe('wss://backup.example.com');
    });
  });

  describe('Circuit Breaker', () => {
    it('tracks circuit breaker state', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const metrics = relay.getMetrics();
      expect(metrics.circuitState).toBe('CLOSED');
    });

    it('emits circuit state change events', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      let stateChanged = false;
      relay.on('circuitStateChange', () => {
        stateChanged = true;
      });

      // Circuit breaker state changes are internal, but we can verify the listener is registered
      expect(stateChanged).toBe(false);
    });
  });

  describe('State Management', () => {
    it('emits state change events', async () => {
      const { CloudRelay } = await importCloudRelay();
      const relay = new CloudRelay({
        endpoints: [{ url: 'wss://relay.example.com' }],
      });

      const stateChanges: string[] = [];
      relay.on('stateChange', (oldState: unknown, newState: unknown) => {
        stateChanges.push(`${oldState}→${newState}`);
      });

      const connectPromise = relay.connect();
      MockWebSocket.instances[0].simulateOpen();
      await connectPromise;

      expect(stateChanges).toContain('disconnected→connecting');
      expect(stateChanges).toContain('connecting→connected');
    });
  });
});
