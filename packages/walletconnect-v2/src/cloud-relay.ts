/**
 * WalletConnect Cloud Relay Transport.
 *
 * Connects to the official WalletConnect Cloud relay (relay.walletconnect.com)
 * using the IRN (Inter-Relay Network) protocol over WebSocket. Provides
 * publish/subscribe messaging with JSON-RPC envelope support.
 *
 * Supports fallback to self-hosted relay servers when the Cloud relay
 * is unavailable.
 *
 * Implements the WC v2 relay protocol:
 *  - Subscribe to topics to receive messages
 *  - Publish encrypted envelopes to topics
 *  - Heartbeat keepalive with pong responses
 *  - Auto-reconnect with exponential backoff
 *
 * @packageDocumentation
 */

import { EventEmitter } from '@cinacoin/core-sdk';
import type { RelayConfig, RelayMessage, JsonRpcRequest, JsonRpcResponse, JsonRpcError } from './types.js';

// ============================================================
// Constants
// ============================================================

/** Default WalletConnect Cloud relay URL. */
export const WC_CLOUD_RELAY_URL = 'wss://relay.walletconnect.com';

/** Fallback relay URLs when the primary Cloud relay is unreachable. */
export const FALLBACK_RELAY_URLS: readonly string[] = [
  'wss://relay.walletconnect.org',
  'wss://relay.wallet.network',
];

/** Default connection timeout (ms). */
const DEFAULT_CONNECTION_TIMEOUT = 10_000;

/** Default heartbeat interval (ms). */
const DEFAULT_HEARTBEAT_INTERVAL = 30_000;

/** Maximum reconnection attempts before giving up. */
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

/** IRN protocol version. */
export const IRN_PROTOCOL_VERSION = 'irn.org';

// ============================================================
// Relay State
// ============================================================

/** CloudRelay connection state. */
export type CloudRelayState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// ============================================================
// CloudRelay Configuration
// ============================================================

/** Configuration for CloudRelay. */
export interface CloudRelayConfig extends RelayConfig {
  /** Project ID for WalletConnect Cloud (required for IRN). */
  projectId?: string;
  /** Fallback relay URLs if the primary relay fails. */
  fallbackUrls?: string[];
}

// ============================================================
// Pending Subscription
// ============================================================

/** Tracks a pending subscribe request awaiting ack. */
interface PendingSubscribe {
  id: number;
  resolve: (id: number) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ============================================================
// CloudRelay
// ============================================================

/**
 * WalletConnect Cloud relay transport.
 *
 * Implements the IRN protocol over WebSocket:
 * 1. Connect to relay.walletconnect.com (or configured URL)
 * 2. Subscribe to topics to receive messages
 * 3. Publish encrypted payloads to topics
 * 4. Maintain connection with heartbeat
 *
 * Handles auto-reconnect with exponential backoff and
 * fallback to secondary relays.
 */
export class CloudRelay extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<Omit<CloudRelayConfig, 'projectId' | 'fallbackUrls'>> &
    Pick<CloudRelayConfig, 'projectId'> &
    { fallbackUrls?: readonly string[] };
  private state: CloudRelayState = 'disconnected';
  private subscriptions: Map<string, Set<(payload: string, topic: string, tag?: number) => void>> = new Map();
  private activeTopicIds: Map<string, number> = new Map();
  private pendingSubscribes: Map<number, PendingSubscribe> = new Map();
  private pendingPublishes: Array<{ topic: string; payload: string; tag: number; resolve: () => void; reject: (e: Error) => void }> = [];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private nextId = 1;
  private connectionUrl: string;

  constructor(config: CloudRelayConfig) {
    super();
    this.config = {
      url: config.url || WC_CLOUD_RELAY_URL,
      projectId: config.projectId,
      fallbackUrls: config.fallbackUrls ?? FALLBACK_RELAY_URLS,
      connectionTimeout: config.connectionTimeout ?? DEFAULT_CONNECTION_TIMEOUT,
      heartbeatInterval: config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      maxReconnectAttempts: config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
    };
    this.connectionUrl = config.url || WC_CLOUD_RELAY_URL;
  }

  // ============================================================
  // Connection Lifecycle
  // ============================================================

  /** Current connection state. */
  getState(): CloudRelayState {
    return this.state;
  }

  /** Whether the relay is currently connected. */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Connect to the relay server.
   *
   * Attempts to connect to the primary relay URL. On failure,
   * tries each fallback URL in order.
   *
   * @returns Promise that resolves when connected.
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') return;
    if (this.state === 'connecting') {
      return new Promise<void>((resolve) => {
        const handler = () => {
          this.off('connected', handler);
          resolve();
        };
        this.on('connected', handler);
      });
    }

    const urls = [this.config.url, ...(this.config.fallbackUrls || [])];

    for (const url of urls) {
      try {
        await this.connectTo(url);
        return;
      } catch (err) {
        console.warn(`[CloudRelay] Failed to connect to ${url}:`, err);
      }
    }

    throw new Error(`Failed to connect to any relay server. Tried: ${urls.join(', ')}`);
  }

  /**
   * Connect to a specific relay URL.
   */
  private connectTo(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.state = 'connecting';
      this.connectionUrl = url;

      try {
        // Build WebSocket URL with optional project ID for Cloud relay
        const wsUrl = this.buildWebSocketUrl(url);
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error(`Relay connection timeout (${this.config.connectionTimeout}ms)`));
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');

          // Resubscribe to all active topics
          this.resubscribeAll();

          // Flush pending publishes
          this.flushPendingPublishes();

          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data as string);
            this.handleMessage(data);
          } catch {
            console.warn('[CloudRelay] Failed to parse relay message:', event.data);
          }
        };

        this.ws.onclose = (event: CloseEvent) => {
          this.state = 'disconnected';
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });

          // Auto-reconnect if not a clean disconnect
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (event) => {
          clearTimeout(timeout);
          this.state = 'error';
          reject(new Error('WebSocket connection error'));
        };
      } catch (error) {
        this.state = 'error';
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Disconnect from the relay server.
   */
  disconnect(): void {
    this.stopHeartbeat();

    // Clean up pending subscriptions
    for (const [, pending] of this.pendingSubscribes) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Relay disconnected'));
    }
    this.pendingSubscribes.clear();

    // Clean up pending publishes
    for (const pending of this.pendingPublishes) {
      pending.reject(new Error('Relay disconnected'));
    }
    this.pendingPublishes = [];

    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
    this.state = 'disconnected';
    this.emit('disconnected');
  }

  /**
   * Build the WebSocket URL, optionally appending the project ID
   * for WalletConnect Cloud relay authentication.
   */
  private buildWebSocketUrl(url: string): string {
    if (this.config.projectId && url.includes('walletconnect.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}projectId=${this.config.projectId}`;
    }
    return url;
  }

  // ============================================================
  // Subscription Management
  // ============================================================

  /**
   * Subscribe to a topic and register a message handler.
   *
   * Sends an IRN `irn_subscribe` request and waits for acknowledgment
   * before registering the topic as active.
   *
   * @param topic - 64-character hex topic.
   * @param handler - Callback for incoming messages.
   * @returns Promise resolving with the subscription ID.
   */
  async subscribe(topic: string, handler?: (payload: string, topic: string, tag?: number) => void): Promise<number> {
    // Register handler immediately for local delivery
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    if (handler) {
      this.subscriptions.get(topic)!.add(handler);
    }

    // If already subscribed, return existing ID
    if (this.activeTopicIds.has(topic)) {
      return this.activeTopicIds.get(topic)!;
    }

    // If not connected, queue for later
    if (this.state !== 'connected') {
      return new Promise((resolve) => {
        // Store a placeholder; will be resolved on connect
        this.once('connected', () => {
          this.subscribe(topic, handler).then(resolve);
        });
      }) as Promise<number>;
    }

    return this.sendSubscribe(topic);
  }

  /**
   * Send IRN subscribe request.
   */
  private sendSubscribe(topic: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;

      const timeout = setTimeout(() => {
        this.pendingSubscribes.delete(id);
        reject(new Error(`Subscribe timeout for topic ${topic}`));
      }, this.config.connectionTimeout);

      this.pendingSubscribes.set(id, { id, resolve, reject, timeout });

      const message: JsonRpcRequest = {
        id,
        jsonrpc: '2.0',
        method: 'irn_subscribe',
        params: { topic },
      };

      this.send(message);
    });
  }

  /**
   * Unsubscribe from a topic.
   *
   * Sends `irn_unsubscribe` to the relay and removes all handlers
   * for this topic (or a specific handler if provided).
   *
   * @param topic - Topic to unsubscribe from.
   * @param handler - Optional specific handler to remove.
   */
  async unsubscribe(topic: string, handler?: (payload: string, topic: string, tag?: number) => void): Promise<void> {
    if (handler) {
      this.subscriptions.get(topic)?.delete(handler);
      if (this.subscriptions.get(topic)?.size === 0) {
        this.subscriptions.delete(topic);
      }
    } else {
      this.subscriptions.delete(topic);
    }

    const subscriptionId = this.activeTopicIds.get(topic);
    if (!subscriptionId) return;

    this.activeTopicIds.delete(topic);

    if (this.state === 'connected') {
      const unsubscribeMsg: JsonRpcRequest = {
        id: this.nextId++,
        jsonrpc: '2.0',
        method: 'irn_unsubscribe',
        params: { topic },
      };
      this.send(unsubscribeMsg);
    }
  }

  /**
   * Resubscribe to all active topics after reconnection.
   */
  private async resubscribeAll(): Promise<void> {
    const topics = Array.from(this.subscriptions.keys());
    for (const topic of topics) {
      try {
        const subId = await this.sendSubscribe(topic);
        this.activeTopicIds.set(topic, subId);
      } catch (err) {
        console.warn(`[CloudRelay] Failed to resubscribe to ${topic}:`, err);
      }
    }
  }

  // ============================================================
  // Publish
  // ============================================================

  /**
   * Publish an encrypted payload to a topic.
   *
   * Sends an IRN `irn_publish` request. If not connected,
   * queues the publish for later delivery.
   *
   * @param topic - Target topic (64-char hex).
   * @param payload - Base64-encoded encrypted payload.
   * @param tag - Message type tag (default: 11 for session messages).
   * @returns Promise that resolves when published.
   */
  async publish(topic: string, payload: string, tag: number = 11): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === 'connected') {
        const publishMsg: JsonRpcRequest = {
          id: this.nextId++,
          jsonrpc: '2.0',
          method: 'irn_publish',
          params: { topic, message: payload, tag, prompt: false, ttl: 300 },
        };
        this.send(publishMsg);
        resolve();
      } else {
        this.pendingPublishes.push({ topic, payload, tag, resolve, reject });
      }
    });
  }

  /** Flush queued publishes after reconnection. */
  private flushPendingPublishes(): void {
    const pending = [...this.pendingPublishes];
    this.pendingPublishes = [];

    for (const { topic, payload, tag, resolve, reject } of pending) {
      const publishMsg: JsonRpcRequest = {
        id: this.nextId++,
        jsonrpc: '2.0',
        method: 'irn_publish',
        params: { topic, message: payload, tag, prompt: false, ttl: 300 },
      };
      this.send(publishMsg);
      resolve();
    }
  }

  // ============================================================
  // Message Handling
  // ============================================================

  /** Handle incoming IRN messages. */
  private handleMessage(data: JsonRpcRequest | JsonRpcResponse): void {
    // Check for JSON-RPC response (to our subscribe/unsubscribe requests)
    if ('result' in data || 'error' in data) {
      this.handleResponse(data as JsonRpcResponse);
      return;
    }

    // Check for IRN subscription notification (incoming message on a topic)
    const msg = data as JsonRpcRequest;
    if (msg.method === 'irn_subscription') {
      this.handleSubscription(msg);
      return;
    }

    // Legacy relay format support
    const legacyMsg = data as unknown as RelayMessage;
    if (legacyMsg.type === 'message') {
      this.handleLegacyMessage(legacyMsg);
    }
  }

  /** Handle JSON-RPC responses to our requests. */
  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingSubscribes.get(response.id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingSubscribes.delete(response.id);

      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else if (response.result) {
        const result = response.result as { id?: number; subscriptionId?: number };
        const subId = result.id ?? result.subscriptionId ?? response.id;
        pending.resolve(subId);
      }
    }
  }

  /** Handle incoming IRN subscription notifications. */
  private handleSubscription(msg: JsonRpcRequest): void {
    const params = msg.params as { topic?: string; message?: string; data?: unknown } | undefined;
    if (!params?.topic) return;

    const topic = params.topic;
    const payload = (params.message as string) ?? '';

    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      for (const handler of handlers) {
        handler(payload, topic);
      }
    }
    this.emit('message', payload, topic);
  }

  /** Handle legacy relay message format. */
  private handleLegacyMessage(data: RelayMessage): void {
    const handlers = this.subscriptions.get(data.topic);
    if (handlers) {
      for (const handler of handlers) {
        handler(data.payload, data.topic, data.tag);
      }
    }
  }

  // ============================================================
  // Heartbeat & Reconnect
  // ============================================================

  /** Send a raw JSON message over WebSocket. */
  private send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /** Start heartbeat keepalive. */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({
        id: this.nextId++,
        jsonrpc: '2.0',
        method: 'irn_ping',
        params: {},
      });
    }, this.config.heartbeatInterval);
  }

  /** Stop heartbeat timer. */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /** Attempt reconnection with exponential backoff. */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.state = 'error';
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.state = 'reconnecting';

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    console.log(
      `[CloudRelay] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.connect().catch(() => {
        // Error handling is in connectTo/onclose
      });
    }, delay);
  }

  // ============================================================
  // Utility
  // ============================================================

  /** Get the URL of the currently connected relay. */
  getConnectedUrl(): string {
    return this.connectionUrl;
  }

  /** Get all currently subscribed topics. */
  getSubscribedTopics(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /** Get the number of active subscriptions. */
  getSubscriptionCount(): number {
    return this.activeTopicIds.size;
  }
}
