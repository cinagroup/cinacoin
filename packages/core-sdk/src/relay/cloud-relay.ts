/**
 * CloudRelay — Official relay integration with failover, retry, and connection pooling.
 *
 * Provides a production-grade WebSocket relay transport with:
 * - Multi-endpoint failover (primary → fallback relays)
 * - Exponential backoff with jitter for retries
 * - Connection pool with concurrency control
 * - Adaptive heartbeat with latency monitoring
 * - Detailed structured logging for observability
 * - Circuit breaker integration for cascade failure prevention
 *
 * @packageDocumentation
 */

import type { EventHandler } from '../types.js';
import { EventEmitter } from '../events.js';
import { CircuitBreaker, type CircuitBreakerState } from '../utils/circuitBreaker.js';
import { logger } from '@cinacoin/logger';

// ─── Types ────────────────────────────────────────────────────────────

/** Configuration for a single relay endpoint. */
export interface RelayEndpoint {
  /** WebSocket URL (e.g., wss://relay.example.com/v1). */
  url: string;
  /** Human-readable name for logging. */
  name?: string;
  /** Priority (lower = higher priority). Default: index order. */
  priority?: number;
  /** Optional authentication token. */
  authToken?: string;
}

/** Connection pool configuration for CloudRelay. */
export interface CloudRelayPoolConfig {
  /** Maximum concurrent WebSocket connections. Default: 5. */
  maxConnections?: number;
  /** Maximum pending requests in queue. Default: 100. */
  maxPendingRequests?: number;
  /** Request timeout in milliseconds. Default: 30000. */
  requestTimeout?: number;
}

/** Retry configuration with exponential backoff. */
export interface CloudRelayRetryConfig {
  /** Maximum retry attempts per endpoint. Default: 3. */
  maxAttempts?: number;
  /** Initial backoff delay in ms. Default: 1000. */
  initialDelay?: number;
  /** Maximum backoff delay in ms. Default: 30000. */
  maxDelay?: number;
  /** Backoff multiplier. Default: 2. */
  multiplier?: number;
  /** Enable jitter to prevent thundering herd. Default: true. */
  jitter?: boolean;
}

/** Heartbeat configuration with adaptive intervals. */
export interface CloudRelayHeartbeatConfig {
  /** Base heartbeat interval in ms. Default: 30000. */
  interval?: number;
  /** Adaptive interval based on latency. Default: true. */
  adaptive?: boolean;
  /** Missed pong threshold before reconnect. Default: 3. */
  missedThreshold?: number;
  /** Latency threshold to increase heartbeat frequency (ms). Default: 500. */
  latencyThreshold?: number;
}

/** Full CloudRelay configuration. */
export interface CloudRelayConfig {
  /** Primary relay endpoints (tried in priority order). */
  endpoints: RelayEndpoint[];
  /** Fallback relay URL (e.g., relay.walletconnect.org). */
  fallbackUrl?: string;
  /** Connection timeout in ms. Default: 10000. */
  connectionTimeout?: number;
  /** Pool configuration. */
  pool?: CloudRelayPoolConfig;
  /** Retry configuration. */
  retry?: CloudRelayRetryConfig;
  /** Heartbeat configuration. */
  heartbeat?: CloudRelayHeartbeatConfig;
  /** Enable debug logging. Default: false. */
  debug?: boolean;
  /** Project ID for relay authentication. */
  projectId?: string;
}

/** CloudRelay connection state. */
export type CloudRelayState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failover'
  | 'error';

/** Metrics for observability. */
export interface CloudRelayMetrics {
  /** Current connection state. */
  state: CloudRelayState;
  /** Active endpoint URL. */
  activeEndpoint: string | null;
  /** Total connection attempts. */
  connectionAttempts: number;
  /** Total successful connections. */
  successfulConnections: number;
  /** Total failover events. */
  failoverCount: number;
  /** Total messages sent. */
  messagesSent: number;
  /** Total messages received. */
  messagesReceived: number;
  /** Current round-trip latency (ms). */
  latencyMs: number;
  /** Average latency (ms). */
  avgLatencyMs: number;
  /** Total reconnection attempts. */
  reconnectAttempts: number;
  /** Uptime since first connection (ms). */
  uptimeMs: number;
  /** Circuit breaker state. */
  circuitState: CircuitBreakerState;
}

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_FALLBACK_URL = 'wss://relay.walletconnect.org';
const DEFAULT_CONNECTION_TIMEOUT = 10_000;
const DEFAULT_MAX_CONNECTIONS = 5;
const DEFAULT_MAX_PENDING = 100;
const DEFAULT_REQUEST_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_INITIAL_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30_000;
const DEFAULT_BACKOFF_MULTIPLIER = 2;
const DEFAULT_HEARTBEAT_INTERVAL = 30_000;
const DEFAULT_MISSED_THRESHOLD = 3;
const DEFAULT_LATENCY_THRESHOLD = 500;

// ─── CloudRelay Class ─────────────────────────────────────────────────

/**
 * CloudRelay — Production-grade relay transport with failover and resilience.
 *
 * Features:
 * - Multi-endpoint failover with automatic fallback to relay.walletconnect.org
 * - Exponential backoff with jitter for retry storms prevention
 * - Connection pool with concurrency limits and request queuing
 * - Adaptive heartbeat that adjusts based on network latency
 * - Circuit breaker pattern for cascade failure prevention
 * - Comprehensive metrics and structured logging
 *
 * @example
 * ```ts
 * const relay = new CloudRelay({
 *   endpoints: [
 *     { url: 'wss://relay.myapp.com', name: 'primary' },
 *     { url: 'wss://relay-backup.myapp.com', name: 'backup' },
 *   ],
 *   fallbackUrl: 'wss://relay.walletconnect.org',
 *   projectId: 'my-project-id',
 *   retry: { maxAttempts: 3, jitter: true },
 *   heartbeat: { adaptive: true },
 * });
 *
 * relay.on('connected', () => console.log('Connected!'));
 * relay.on('failover', (from, to) => console.log(`Failover: ${from} → ${to}`));
 *
 * await relay.connect();
 * relay.subscribe('topic-hex');
 * relay.publish('topic-hex', 'encrypted-payload');
 * ```
 */
export class CloudRelay extends EventEmitter {
  readonly type = 'cloud-relay';

  // Configuration
  private config: Required<Omit<CloudRelayConfig, 'fallbackUrl' | 'pool' | 'retry' | 'heartbeat' | 'projectId'>> & {
    fallbackUrl: string;
    pool: Required<CloudRelayPoolConfig>;
    retry: Required<CloudRelayRetryConfig>;
    heartbeat: Required<CloudRelayHeartbeatConfig>;
    projectId: string | undefined;
  };
  private sortedEndpoints: RelayEndpoint[];

  // Connection state
  private ws: WebSocket | null = null;
  private state: CloudRelayState = 'disconnected';
  private activeEndpointIndex = -1;
  private activeEndpoint: RelayEndpoint | null = null;

  // Reconnection
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalDisconnect = false;

  // Subscriptions and message queue
  private subscriptions: Set<string> = new Set();
  private pendingMessages: Array<{ topic: string; payload: string; timestamp: number }> = [];

  // Heartbeat
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private missedPongs = 0;
  private lastPongAt = 0;

  // Latency tracking
  private pingSentAt = 0;
  private currentLatency = 0;
  private latencyHistory: number[] = [];
  private readonly maxLatencyHistory = 20;

  // Connection pool / concurrency
  private activeOperations = 0;
  private operationQueue: Array<() => void> = [];

  // Circuit breaker
  private circuitBreaker: CircuitBreaker;

  // Metrics
  private metrics: Omit<CloudRelayMetrics, 'state' | 'activeEndpoint' | 'circuitState'> = {
    connectionAttempts: 0,
    successfulConnections: 0,
    failoverCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
    latencyMs: 0,
    avgLatencyMs: 0,
    reconnectAttempts: 0,
    uptimeMs: 0,
  };
  private connectedAt: number | null = null;

  constructor(config: CloudRelayConfig) {
    super();

    // Build sorted endpoint list
    const endpoints = [...config.endpoints];
    if (config.fallbackUrl) {
      endpoints.push({ url: config.fallbackUrl, name: 'fallback-walletconnect', priority: Infinity });
    } else {
      // Always add Cinacoin relay as ultimate fallback
      endpoints.push({ url: DEFAULT_FALLBACK_URL, name: 'fallback-walletconnect', priority: Infinity });
    }

    this.sortedEndpoints = endpoints.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    this.config = {
      endpoints: this.sortedEndpoints,
      fallbackUrl: config.fallbackUrl ?? DEFAULT_FALLBACK_URL,
      connectionTimeout: config.connectionTimeout ?? DEFAULT_CONNECTION_TIMEOUT,
      debug: config.debug ?? false,
      projectId: config.projectId,
      pool: {
        maxConnections: config.pool?.maxConnections ?? DEFAULT_MAX_CONNECTIONS,
        maxPendingRequests: config.pool?.maxPendingRequests ?? DEFAULT_MAX_PENDING,
        requestTimeout: config.pool?.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT,
      },
      retry: {
        maxAttempts: config.retry?.maxAttempts ?? DEFAULT_MAX_RETRY_ATTEMPTS,
        initialDelay: config.retry?.initialDelay ?? DEFAULT_INITIAL_DELAY,
        maxDelay: config.retry?.maxDelay ?? DEFAULT_MAX_DELAY,
        multiplier: config.retry?.multiplier ?? DEFAULT_BACKOFF_MULTIPLIER,
        jitter: config.retry?.jitter ?? true,
      },
      heartbeat: {
        interval: config.heartbeat?.interval ?? DEFAULT_HEARTBEAT_INTERVAL,
        adaptive: config.heartbeat?.adaptive ?? true,
        missedThreshold: config.heartbeat?.missedThreshold ?? DEFAULT_MISSED_THRESHOLD,
        latencyThreshold: config.heartbeat?.latencyThreshold ?? DEFAULT_LATENCY_THRESHOLD,
      },
    };

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30_000,
      halfOpenMaxAttempts: 2,
      onStateChange: (from, to, error) => {
        this.log('info', `Circuit breaker: ${from} → ${to}`, error ? { error: error.message } : undefined);
        this.emit('circuitStateChange', from, to, error);
      },
    });

    this.log('info', 'CloudRelay initialized', {
      endpoints: this.sortedEndpoints.map((e) => e.url),
      fallbackUrl: this.config.fallbackUrl,
    });
  }

  // ─── Public API ───────────────────────────────────────────────────

  /**
   * Connect to the relay, trying endpoints in priority order with failover.
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') {
      this.log('debug', 'Already connected');
      return;
    }

    this.intentionalDisconnect = false;
    this.metrics.connectionAttempts++;
    this.setState('connecting');

    this.log('info', 'Starting connection sequence', {
      endpoints: this.sortedEndpoints.length,
      attempt: this.metrics.connectionAttempts,
    });

    // Try each endpoint starting from the current index (supports failover ordering)
    const startIndex = this.activeEndpointIndex >= 0 ? this.activeEndpointIndex : 0;
    const total = this.sortedEndpoints.length;

    for (let offset = 0; offset < total; offset++) {
      const i = (startIndex + offset) % total;
      const endpoint = this.sortedEndpoints[i];

      // Check circuit breaker
      const cbState = this.circuitBreaker.getState();
      if (cbState === 'OPEN') {
        this.log('warn', `Circuit breaker OPEN, skipping endpoint ${endpoint.name ?? endpoint.url}`);
        continue;
      }

      try {
        await this.connectToEndpoint(endpoint, i);
        return; // Success
      } catch (error) {
        this.log('warn', `Failed to connect to ${endpoint.name ?? endpoint.url}`, {
          error: error instanceof Error ? error.message : String(error),
          endpointIndex: i,
        });
        this.emit('endpointFailed', endpoint.url, error);

        // Emit failover event when moving to next endpoint
        if (offset < total - 1) {
          const nextI = (startIndex + offset + 1) % total;
          this.metrics.failoverCount++;
          this.emit('failover', endpoint.url, this.sortedEndpoints[nextI]?.url);
        }
      }
    }

    // All endpoints failed
    this.setState('error');
    const err = new Error('All relay endpoints failed');
    this.emit('error', err);
    throw err;
  }

  /**
   * Disconnect from the relay gracefully.
   */
  disconnect(): void {
    this.log('info', 'Disconnecting from relay');
    this.intentionalDisconnect = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.activeEndpoint = null;
    this.activeEndpointIndex = -1;
    this.connectedAt = null;
    this.setState('disconnected');
    this.emit('disconnected', 'client_initiated');
  }

  /**
   * Subscribe to a topic.
   * @param topic - 32-byte hex topic identifier.
   */
  subscribe(topic: string): void {
    this.subscriptions.add(topic);
    this.log('debug', `Subscribing to topic: ${topic.slice(0, 8)}...`);
    this.send({ type: 'subscribe', topic, payload: '', timestamp: Date.now() });
  }

  /**
   * Unsubscribe from a topic.
   * @param topic - Topic to unsubscribe from.
   */
  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
    this.log('debug', `Unsubscribing from topic: ${topic.slice(0, 8)}...`);
    this.send({ type: 'unsubscribe', topic, payload: '', timestamp: Date.now() });
  }

  /**
   * Publish an encrypted message to a topic.
   * Queues the message if not currently connected.
   * @param topic - Target topic.
   * @param payload - Base64-encoded encrypted payload.
   */
  publish(topic: string, payload: string): void {
    if (this.state !== 'connected') {
      this.log('debug', `Queueing message (state=${this.state})`);
      this.enqueueMessage(topic, payload);
      return;
    }

    this.sendWithConcurrency(() => {
      this.metrics.messagesSent++;
      this.send({ type: 'publish', topic, payload, timestamp: Date.now() });
    });
  }

  /** Check if the relay is connected. */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /** Get the current connection state. */
  getState(): CloudRelayState {
    return this.state;
  }

  /** Get the active endpoint URL. */
  getActiveEndpoint(): string | null {
    return this.activeEndpoint?.url ?? null;
  }

  /** Get comprehensive metrics snapshot. */
  getMetrics(): CloudRelayMetrics {
    return {
      ...this.metrics,
      state: this.state,
      activeEndpoint: this.activeEndpoint?.url ?? null,
      circuitState: this.circuitBreaker.getState(),
      uptimeMs: this.connectedAt ? Date.now() - this.connectedAt : 0,
    };
  }

  /** Reset metrics counters. */
  resetMetrics(): void {
    this.metrics = {
      connectionAttempts: 0,
      successfulConnections: 0,
      failoverCount: 0,
      messagesSent: 0,
      messagesReceived: 0,
      latencyMs: 0,
      avgLatencyMs: 0,
      reconnectAttempts: 0,
      uptimeMs: 0,
    };
    this.latencyHistory = [];
  }

  /** Force failover to the next available endpoint. */
  async forceFailover(reason?: string): Promise<void> {
    this.log('warn', `Forced failover triggered${reason ? `: ${reason}` : ''}`);
    this.stopHeartbeat();
    this.clearReconnectTimer();

    // Prevent the close handler from scheduling a competing reconnect
    this.intentionalDisconnect = true;

    if (this.ws) {
      this.ws.close(4000, 'Forced failover');
      this.ws = null;
    }

    // Advance to next endpoint
    const previousIndex = this.activeEndpointIndex;
    this.activeEndpointIndex = (this.activeEndpointIndex + 1) % this.sortedEndpoints.length;

    if (this.activeEndpointIndex === previousIndex && this.sortedEndpoints.length === 1) {
      // Only one endpoint, just retry it
      this.log('info', 'Only one endpoint available, retrying...');
    }

    this.metrics.failoverCount++;
    this.emit('failover', this.sortedEndpoints[previousIndex]?.url, this.sortedEndpoints[this.activeEndpointIndex]?.url);

    // Reset intentional disconnect so connect() works normally
    this.intentionalDisconnect = false;
    await this.connect();
  }

  // ─── Connection Management ────────────────────────────────────────

  /**
   * Connect to a specific endpoint with retry logic.
   */
  private async connectToEndpoint(endpoint: RelayEndpoint, index: number): Promise<void> {
    const maxAttempts = this.config.retry.maxAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log('info', `Connecting to ${endpoint.name ?? endpoint.url} (attempt ${attempt}/${maxAttempts})`);

        await this.circuitBreaker.execute(() =>
          this.establishConnection(endpoint, index),
        );

        // Success
        this.activeEndpoint = endpoint;
        this.activeEndpointIndex = index;
        this.connectedAt = Date.now();
        this.reconnectAttempts = 0;
        this.metrics.successfulConnections++;
        this.setState('connected');
        this.startHeartbeat();

        this.log('info', `Connected to ${endpoint.name ?? endpoint.url}`, {
          latencyMs: this.currentLatency,
        });

        this.emit('connected', endpoint.url);

        // Resubscribe and flush
        this.resubscribeAll();
        this.flushPendingMessages();

        return;
      } catch (error) {
        this.log('warn', `Connection attempt ${attempt}/${maxAttempts} failed for ${endpoint.name ?? endpoint.url}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        if (attempt < maxAttempts) {
          const delay = this.calculateBackoff(attempt);
          this.log('debug', `Waiting ${delay}ms before retry...`);
          // Use Promise-based delay that works with both real and fake timers
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to connect to ${endpoint.name ?? endpoint.url} after ${maxAttempts} attempts`);
  }

  /**
   * Establish a single WebSocket connection.
   */
  private establishConnection(endpoint: RelayEndpoint, _index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.buildEndpointUrl(endpoint);

      try {
        this.ws = new WebSocket(url);

        const timeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error(`Connection timeout after ${this.config.connectionTimeout}ms`));
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.log('debug', `WebSocket opened to ${endpoint.name ?? endpoint.url}`);
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event: CloseEvent) => {
          clearTimeout(timeout);
          this.handleClose(event);
        };

        this.ws.onerror = (event) => {
          clearTimeout(timeout);
          this.log('error', `WebSocket error on ${endpoint.name ?? endpoint.url}`);
          reject(new Error('WebSocket connection error'));
        };
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Build the full endpoint URL with auth params.
   */
  private buildEndpointUrl(endpoint: RelayEndpoint): string {
    let url = endpoint.url;

    // Append project ID if configured
    if (this.config.projectId) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}projectId=${this.config.projectId}`;
    }

    // Append auth token if provided
    if (endpoint.authToken) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}authToken=${endpoint.authToken}`;
    }

    return url;
  }

  // ─── Retry / Backoff ──────────────────────────────────────────────

  /**
   * Calculate exponential backoff delay with optional jitter.
   */
  private calculateBackoff(attempt: number): number {
    const { initialDelay, maxDelay, multiplier, jitter } = this.config.retry;

    let delay = Math.min(
      initialDelay * Math.pow(multiplier, attempt - 1),
      maxDelay,
    );

    if (jitter) {
      // Full jitter: random value between 0 and calculated delay
      delay = Math.random() * delay;
    }

    return Math.round(delay);
  }

  // ─── Heartbeat ────────────────────────────────────────────────────

  /**
   * Start the adaptive heartbeat system.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.missedPongs = 0;

    const interval = this.getHeartbeatInterval();
    this.log('debug', `Starting heartbeat (interval=${interval}ms, adaptive=${this.config.heartbeat.adaptive})`);

    this.heartbeatTimer = setInterval(() => {
      this.sendPing();
    }, interval);
  }

  /**
   * Stop the heartbeat system.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Get the current heartbeat interval (adaptive based on latency).
   */
  private getHeartbeatInterval(): number {
    if (!this.config.heartbeat.adaptive) {
      return this.config.heartbeat.interval;
    }

    // If latency is high, increase heartbeat frequency
    if (this.currentLatency > this.config.heartbeat.latencyThreshold) {
      return Math.max(
        this.config.heartbeat.interval / 2,
        5000, // Never faster than 5s
      );
    }

    return this.config.heartbeat.interval;
  }

  /**
   * Send a ping and track latency.
   */
  private sendPing(): void {
    if (this.state !== 'connected' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.pingSentAt = Date.now();
    this.send({ type: 'ping', timestamp: this.pingSentAt });

    // Set timeout for pong response
    this.heartbeatTimeout = setTimeout(() => {
      this.missedPongs++;
      this.log('warn', `Missed pong (${this.missedPongs}/${this.config.heartbeat.missedThreshold})`);

      if (this.missedPongs >= this.config.heartbeat.missedThreshold) {
        this.log('error', `Missed ${this.missedPongs} pongs, triggering reconnect`);
        this.handleHeartbeatFailure();
      }
    }, this.config.heartbeat.interval);
  }

  /**
   * Handle pong response — update latency metrics.
   */
  private handlePong(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    if (this.pingSentAt > 0) {
      this.currentLatency = Date.now() - this.pingSentAt;
      this.metrics.latencyMs = this.currentLatency;

      // Update latency history
      this.latencyHistory.push(this.currentLatency);
      if (this.latencyHistory.length > this.maxLatencyHistory) {
        this.latencyHistory.shift();
      }

      // Calculate average
      this.metrics.avgLatencyMs = Math.round(
        this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length,
      );

      this.log('debug', `Pong received (latency=${this.currentLatency}ms, avg=${this.metrics.avgLatencyMs}ms)`);
    }

    this.missedPongs = 0;
    this.lastPongAt = Date.now();

    // Restart heartbeat with potentially new adaptive interval
    if (this.config.heartbeat.adaptive) {
      this.startHeartbeat();
    }
  }

  /**
   * Handle heartbeat failure — trigger reconnection.
   */
  private handleHeartbeatFailure(): void {
    this.stopHeartbeat();
    this.emit('heartbeatFailure', this.missedPongs);

    if (this.ws) {
      this.ws.close(4001, 'Heartbeat timeout');
      this.ws = null;
    }

    this.setState('reconnecting');
    this.scheduleReconnect();
  }

  // ─── Connection Pool / Concurrency ────────────────────────────────

  /**
   * Execute an operation with concurrency control.
   */
  private sendWithConcurrency(operation: () => void): void {
    if (this.activeOperations < this.config.pool.maxConnections) {
      this.activeOperations++;
      try {
        operation();
      } finally {
        this.activeOperations--;
        this.processQueue();
      }
    } else if (this.operationQueue.length < this.config.pool.maxPendingRequests) {
      this.log('debug', `Operation queued (${this.operationQueue.length}/${this.config.pool.maxPendingRequests})`);
      this.operationQueue.push(operation);
    } else {
      this.log('error', 'Operation queue full, dropping message');
      this.emit('queueFull');
    }
  }

  /**
   * Process the next operation in the queue.
   */
  private processQueue(): void {
    if (this.operationQueue.length > 0 && this.activeOperations < this.config.pool.maxConnections) {
      const next = this.operationQueue.shift()!;
      this.activeOperations++;
      try {
        next();
      } finally {
        this.activeOperations--;
        // Continue processing
        if (this.operationQueue.length > 0) {
          queueMicrotask(() => this.processQueue());
        }
      }
    }
  }

  /**
   * Enqueue a message for later delivery.
   */
  private enqueueMessage(topic: string, payload: string): void {
    if (this.pendingMessages.length >= this.config.pool.maxPendingRequests) {
      this.log('warn', 'Pending message queue full, dropping oldest');
      this.pendingMessages.shift();
    }
    this.pendingMessages.push({ topic, payload, timestamp: Date.now() });
  }

  // ─── Message Handling ─────────────────────────────────────────────

  /**
   * Handle incoming WebSocket messages.
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string);
      const type = data.type as string;

      this.metrics.messagesReceived++;

      switch (type) {
        case 'message':
          this.log('debug', `Received message on topic: ${(data.topic as string)?.slice(0, 8)}...`);
          this.emit('message', data.topic, data.payload);
          break;

        case 'pong':
          this.handlePong();
          break;

        case 'ack':
          this.log('debug', `ACK received for topic: ${(data.topic as string)?.slice(0, 8)}...`);
          this.emit('ack', data.topic);
          break;

        case 'error':
          this.log('error', `Relay error: ${data.message}`);
          this.emit('error', new Error(data.message as string));
          break;

        case 'subscription_ack':
          this.log('debug', `Subscription confirmed: ${(data.topic as string)?.slice(0, 8)}...`);
          this.emit('subscriptionAck', data.topic);
          break;

        default:
          this.log('debug', `Unknown message type: ${type}`);
          break;
      }
    } catch (error) {
      this.log('warn', 'Failed to parse relay message', {
        error: error instanceof Error ? error.message : String(error),
        rawData: typeof event.data === 'string' ? event.data.slice(0, 100) : '[binary]',
      });
    }
  }

  // ─── Reconnection ─────────────────────────────────────────────────

  /**
   * Handle WebSocket close event.
   */
  private handleClose(event: CloseEvent): void {
    const wasConnected = this.state === 'connected';
    this.stopHeartbeat();
    this.setState('disconnected');

    this.log('info', `WebSocket closed (code=${event.code}, reason=${event.reason || 'none'}, wasClean=${event.wasClean})`);

    this.emit('disconnected', event);

    // Don't reconnect on intentional disconnect or normal close
    if (this.intentionalDisconnect || event.code === 1000) {
      return;
    }

    // Trigger reconnection or failover
    if (wasConnected) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt with backoff.
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;
    this.metrics.reconnectAttempts++;

    const maxReconnectAttempts = this.config.retry.maxAttempts * this.sortedEndpoints.length;

    if (this.reconnectAttempts > maxReconnectAttempts) {
      this.log('error', `Max reconnect attempts reached (${maxReconnectAttempts}), giving up`);
      this.setState('error');
      this.emit('maxReconnectAttemptsReached', maxReconnectAttempts);
      return;
    }

    // Determine if we should failover to next endpoint
    const attemptsPerEndpoint = this.config.retry.maxAttempts;
    const shouldFailover = this.reconnectAttempts % attemptsPerEndpoint === 0;

    if (shouldFailover && this.sortedEndpoints.length > 1) {
      this.log('info', `Switching to next endpoint after ${attemptsPerEndpoint} failed attempts`);
      this.activeEndpointIndex = (this.activeEndpointIndex + 1) % this.sortedEndpoints.length;
      this.metrics.failoverCount++;
      this.emit('failover', this.activeEndpoint?.url, this.sortedEndpoints[this.activeEndpointIndex]?.url);
    }

    const delay = this.calculateBackoff(Math.min(this.reconnectAttempts, this.config.retry.maxAttempts));
    this.setState('reconnecting');

    this.log('info', `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${maxReconnectAttempts})`, {
      nextEndpoint: this.sortedEndpoints[this.activeEndpointIndex]?.name ?? this.sortedEndpoints[this.activeEndpointIndex]?.url,
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log('error', 'Reconnection failed', { error: error instanceof Error ? error.message : String(error) });
      });
    }, delay);
  }

  /**
   * Clear any pending reconnect timer.
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ─── Subscription & Message Recovery ──────────────────────────────

  /**
   * Resubscribe to all topics after reconnection.
   */
  private resubscribeAll(): void {
    if (this.subscriptions.size === 0) return;

    this.log('info', `Resubscribing to ${this.subscriptions.size} topics`);

    for (const topic of this.subscriptions) {
      this.send({ type: 'subscribe', topic, payload: '', timestamp: Date.now() });
    }
  }

  /**
   * Flush pending messages after reconnection.
   */
  private flushPendingMessages(): void {
    if (this.pendingMessages.length === 0) return;

    this.log('info', `Flushing ${this.pendingMessages.length} pending messages`);

    const messages = [...this.pendingMessages];
    this.pendingMessages = [];

    for (const msg of messages) {
      // Drop messages older than request timeout
      if (Date.now() - msg.timestamp > this.config.pool.requestTimeout) {
        this.log('warn', `Dropping stale message (age=${Date.now() - msg.timestamp}ms)`);
        continue;
      }
      this.metrics.messagesSent++;
      this.send({ type: 'publish', topic: msg.topic, payload: msg.payload, timestamp: Date.now() });
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────

  /**
   * Send a message over WebSocket.
   */
  private send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.log('error', 'Failed to send message', {
          error: error instanceof Error ? error.message : String(error),
          messageType: message.type,
        });
      }
    }
  }

  /**
   * Update internal state and emit event.
   */
  private setState(newState: CloudRelayState): void {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    this.log('debug', `State: ${oldState} → ${newState}`);
    this.emit('stateChange', oldState, newState);
  }

  /**
   * Structured logging helper.
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
    const prefix = `[CloudRelay]`;
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        if (this.config.debug) {
          logger.debug(fullMessage, context);
        }
        break;
      case 'info':
        logger.info(fullMessage, context);
        break;
      case 'warn':
        logger.warn(fullMessage, context);
        break;
      case 'error':
        logger.error(fullMessage, context);
        break;
    }
  }

  /**
   * Sleep helper for retry delays.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
