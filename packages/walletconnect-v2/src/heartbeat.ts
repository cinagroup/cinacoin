import { logger } from '@cinacoin/logger';
/**
 * Cinacoin v2 Heartbeat & Reconnection Manager
 *
 * Provides:
 *   - Automatic ping/pong health checks (default: every 30s)
 *   - Disconnection detection and automatic reconnection with exponential backoff
 *   - Session state recovery after reconnection
 *   - Status event emission (connected / disconnected / reconnecting)
 *
 * Integrates with WcConnector via the MultiSessionManager to monitor
 * relay connection health and maintain session continuity.
 *
 * @example
 * ```ts
 * import { HeartbeatManager } from '@cinacoin/walletconnect-v2/heartbeat';
 *
 * const heartbeat = new HeartbeatManager({
 *   intervalMs: 30_000,
 *   maxReconnectAttempts: 10,
 *   reconnectBackoffMs: 1_000,
 * });
 *
 * // Start monitoring
 * heartbeat.start(connector);
 *
 * // Listen for status changes
 * heartbeat.on('status', (status) => {
 *   logger.info(`WC connection: ${status}`);
 * });
 *
 * // Stop when done
 * heartbeat.stop();
 * ```
 */

// ============================================================
// Types
// ============================================================

/** Heartbeat connection status. */
export type HeartbeatStatus = 'connected' | 'disconnected' | 'reconnecting' | 'stopped';

/** Heartbeat event types. */
export type HeartbeatEvent =
  | { type: 'status'; status: HeartbeatStatus; reason?: string }
  | { type: 'ping'; latency: number }
  | { type: 'reconnect_attempt'; attempt: number; maxAttempts: number }
  | { type: 'session_restored'; sessionCount: number };

/** Event listener type. */
type HeartbeatListener = (event: HeartbeatEvent) => void;

/** Configuration for the heartbeat manager. */
export interface HeartbeatConfig {
  /** Ping interval in milliseconds (default: 30_000 = 30s). */
  intervalMs?: number;
  /** Maximum reconnection attempts before giving up (default: 10). */
  maxReconnectAttempts?: number;
  /** Initial backoff delay for reconnection (ms, default: 1_000). */
  reconnectBackoffMs?: number;
  /** Maximum backoff delay cap (ms, default: 30_000). */
  maxBackoffMs?: number;
  /** Ping timeout — if no pong within this time, consider dead (ms, default: 10_000). */
  pingTimeoutMs?: number;
  /** Number of consecutive ping failures before declaring disconnected (default: 3). */
  failureThreshold?: number;
}

/** Default heartbeat configuration. */
export const DEFAULT_HEARTBEAT_CONFIG: Required<HeartbeatConfig> = {
  intervalMs: 30_000,
  maxReconnectAttempts: 10,
  reconnectBackoffMs: 1_000,
  maxBackoffMs: 30_000,
  pingTimeoutMs: 10_000,
  failureThreshold: 3,
};

// ============================================================
// Connector Interface (minimal subset needed for heartbeat)
// ============================================================

/** Minimal interface a connector must implement for heartbeat monitoring. */
export interface HeartbeatConnector {
  /** Check if the connector is currently connected. */
  isConnected(): boolean;
  /** Attempt to restore persisted sessions. Returns null if no sessions to restore. */
  restore(): Promise<unknown | null>;
  /** Emit an event to listeners. */
  emit(event: string, data?: unknown): void;
  /** Register an event listener. */
  on(event: string, listener: (...args: unknown[]) => void): void;
  /** Remove an event listener. */
  off(event: string, listener: (...args: unknown[]) => void): void;
}

// ============================================================
// HeartbeatManager
// ============================================================

/**
 * Manages the heartbeat lifecycle for Cinacoin v2 connections.
 *
 * Monitors connection health via periodic pings, detects disconnections,
 * and performs automatic reconnection with exponential backoff.
 */
export class HeartbeatManager {
  private config: Required<HeartbeatConfig>;
  private connector: HeartbeatConnector | null = null;
  private status: HeartbeatStatus = 'stopped';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private consecutiveFailures = 0;
  private listeners = new Map<string, Set<HeartbeatListener>>();

  constructor(config: HeartbeatConfig = {}) {
    this.config = {
      intervalMs: config.intervalMs ?? DEFAULT_HEARTBEAT_CONFIG.intervalMs,
      maxReconnectAttempts: config.maxReconnectAttempts ?? DEFAULT_HEARTBEAT_CONFIG.maxReconnectAttempts,
      reconnectBackoffMs: config.reconnectBackoffMs ?? DEFAULT_HEARTBEAT_CONFIG.reconnectBackoffMs,
      maxBackoffMs: config.maxBackoffMs ?? DEFAULT_HEARTBEAT_CONFIG.maxBackoffMs,
      pingTimeoutMs: config.pingTimeoutMs ?? DEFAULT_HEARTBEAT_CONFIG.pingTimeoutMs,
      failureThreshold: config.failureThreshold ?? DEFAULT_HEARTBEAT_CONFIG.failureThreshold,
    };
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Start heartbeat monitoring on the given connector.
   * Sets up ping interval and connection state listeners.
   */
  start(connector: HeartbeatConnector): void {
    if (this.intervalId) {
      this.stop();
    }

    this.connector = connector;
    this.reconnectAttempt = 0;
    this.consecutiveFailures = 0;
    this.setStatus('connected');

    // Set up periodic ping
    this.intervalId = setInterval(() => this.ping(), this.config.intervalMs);

    // Listen for external disconnection events
    connector.on('disconnected', () => this.handleDisconnection('External disconnect event'));
    connector.on('session_delete', () => this.handleDisconnection('Session deleted'));

    this.emitEvent({ type: 'status', status: 'connected', reason: 'Heartbeat started' });
  }

  /**
   * Stop heartbeat monitoring.
   * Clears intervals, timeouts, and event listeners.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }

    // Remove our event listeners
    if (this.connector) {
      this.connector.off('disconnected', () => {});
      this.connector.off('session_delete', () => {});
    }

    this.setStatus('stopped');
    this.emitEvent({ type: 'status', status: 'stopped', reason: 'Heartbeat stopped' });
  }

  /**
   * Get current heartbeat status.
   */
  getStatus(): HeartbeatStatus {
    return this.status;
  }

  /**
   * Subscribe to heartbeat events.
   */
  on(event: string, listener: HeartbeatListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Unsubscribe from heartbeat events.
   */
  off(event: string, listener: HeartbeatListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Force an immediate ping check.
   */
  async ping(): Promise<void> {
    if (!this.connector || this.status === 'stopped') return;

    const startTime = Date.now();

    try {
      // Set up ping timeout
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
      }

      const pongReceived = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), this.config.pingTimeoutMs);

        const onPong = () => {
          clearTimeout(timeout);
          resolve(true);
        };

        // Listen for pong response
        this.connector!.on('pong', onPong);

        // Send ping
        this.connector!.emit('ping');

        // Clean up listener after timeout
        setTimeout(() => {
          this.connector!.off('pong', onPong);
        }, this.config.pingTimeoutMs + 100);
      });

      const gotPong = await pongReceived;
      const latency = Date.now() - startTime;

      if (gotPong) {
        this.consecutiveFailures = 0;
        this.emitEvent({ type: 'ping', latency });

        // If we were reconnecting, we're now connected
        if (this.status === 'reconnecting') {
          this.setStatus('connected');
          this.emitEvent({ type: 'status', status: 'connected', reason: 'Connection restored' });
          this.reconnectAttempt = 0;
        }
      } else {
        this.consecutiveFailures++;
        this.handlePingFailure();
      }
    } catch {
      this.consecutiveFailures++;
      this.handlePingFailure();
    }
  }

  /**
   * Manually trigger a reconnection attempt.
   */
  async reconnect(): Promise<void> {
    if (!this.connector) return;
    if (this.status === 'reconnecting') return;

    this.setStatus('reconnecting');

    for (let attempt = 0; attempt < this.config.maxReconnectAttempts; attempt++) {
      this.reconnectAttempt = attempt + 1;
      this.emitEvent({
        type: 'reconnect_attempt',
        attempt: this.reconnectAttempt,
        maxAttempts: this.config.maxReconnectAttempts,
      });

      try {
        const restored = await this.connector.restore();

        if (restored !== null && this.connector.isConnected()) {
          // Session restored successfully
          this.consecutiveFailures = 0;
          this.reconnectAttempt = 0;
          this.setStatus('connected');

          // Emit session restored event
          const sessions = this.connector.isConnected() ? 1 : 0;
          this.emitEvent({ type: 'session_restored', sessionCount: sessions });
          this.emitEvent({ type: 'status', status: 'connected', reason: 'Session restored' });
          return;
        }
      } catch (err) {
        logger.warn('[Heartbeat] Reconnect attempt failed:', err);
      }

      // Exponential backoff
      const delay = this.getBackoffDelay(attempt);
      await this.sleep(delay);
    }

    // All attempts exhausted
    this.setStatus('disconnected');
    this.emitEvent({
      type: 'status',
      status: 'disconnected',
      reason: `Reconnection failed after ${this.config.maxReconnectAttempts} attempts`,
    });
  }

  // ── Internal Methods ────────────────────────────────────────────

  private handlePingFailure(): void {
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.handleDisconnection(`Ping failed ${this.consecutiveFailures} times (threshold: ${this.config.failureThreshold})`);
    }
  }

  private handleDisconnection(reason: string): void {
    if (this.status === 'stopped' || this.status === 'reconnecting') return;

    this.setStatus('disconnected');
    this.emitEvent({ type: 'status', status: 'disconnected', reason });

    // Start automatic reconnection
    this.reconnect().catch((err) => {
      logger.error('[Heartbeat] Automatic reconnection failed:', err);
    });
  }

  private setStatus(newStatus: HeartbeatStatus): void {
    this.status = newStatus;
  }

  private getBackoffDelay(attempt: number): number {
    const exponential = this.config.reconnectBackoffMs * Math.pow(2, attempt);
    // Add jitter (±10%)
    const jitter = exponential * 0.1 * (Math.random() * 2 - 1);
    return Math.min(exponential + jitter, this.config.maxBackoffMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.reconnectTimeout = setTimeout(resolve, ms);
    });
  }

  private emitEvent(event: HeartbeatEvent): void {
    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(event);
        } catch (err) {
          logger.error('[Heartbeat] Event listener error:', err);
        }
      }
    }
  }
}

// ============================================================
// Factory
// ============================================================

/**
 * Create a HeartbeatManager with the given configuration.
 */
export function createHeartbeat(config?: HeartbeatConfig): HeartbeatManager {
  return new HeartbeatManager(config);
}
