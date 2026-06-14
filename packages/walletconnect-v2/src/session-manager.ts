/**
 * Enhanced Session Manager for Cinacoin v2.
 *
 * Unified session management layer that integrates:
 * - Persistent storage (localStorage + IndexedDB fallback)
 * - Multi-session support with automatic selection
 * - Session restoration and auto-reconnection
 * - Expiry detection and cleanup
 * - Comprehensive event system
 * - Heartbeat monitoring for connection health
 *
 * This is the recommended high-level API for managing WC v2 sessions.
 *
 * @example
 * ```ts
 * import { SessionManager } from '@cinacoin/walletconnect-v2';
 *
 * const manager = new SessionManager({
 *   metadata: {
 *     name: 'My dApp',
 *     description: 'A decentralized app',
 *     url: 'https://mydapp.com',
 *     icons: ['https://mydapp.com/icon.png'],
 *   },
 *   chains: ['eip155:1', 'eip155:137'],
 *   projectId: 'your-wc-project-id',
 * });
 *
 * // Initialize and restore sessions
 * await manager.init();
 *
 * // Create a new session
 * const uri = await manager.createSession();
 * console.log('Scan this QR code:', uri);
 *
 * // Wait for session establishment
 * const session = await manager.waitForSession();
 * console.log('Connected:', session.topic);
 *
 * // Send requests
 * const accounts = await manager.request('eth_accounts', []);
 *
 * // Listen for events
 * manager.on('session_update', (session) => {
 *   console.log('Session updated:', session);
 * });
 *
 * // Cleanup
 * await manager.destroy();
 * ```
 *
 * @packageDocumentation
 */

import { EventEmitter } from '@cinacoin/core-sdk';
import type { AppMetadata, RequiredNamespace } from '@cinacoin/core-sdk';
import type {
  Session,
  WcClientEvent,
  SessionNamespace,
  SessionNotification,
  JsonRpcRequest,
  JsonRpcResponse,
} from './types.js';
import { MultiSessionManager, MultiSessionManagerConfig, ManagedSession } from './multi-session-manager.js';
import { SessionStore, StoredSession, StoredKeypair } from './session-store.js';
import { HeartbeatManager, HeartbeatConfig, HeartbeatStatus, HeartbeatEvent } from './heartbeat.js';
import { bytesToHex } from './crypto.js';
import { logger } from '@cinacoin/logger';

// ============================================================
// Session Manager Configuration
// ============================================================

/** Configuration for SessionManager. */
export interface EnhancedSessionManagerConfig {
  /** dApp metadata (name, description, url, icons). */
  metadata: AppMetadata;
  /** Chains to request (CAIP-2, e.g., 'eip155:1'). */
  chains?: string[];
  /** Methods to request. */
  methods?: string[];
  /** Events to subscribe to. */
  events?: string[];
  /** Session TTL in seconds (default: 7 days). */
  sessionTtl?: number;
  /** Project ID for Cinacoin Cloud relay. */
  projectId?: string;
  /** Relay server URL (defaults to WC Cloud relay). */
  relayUrl?: string;
  /** Fallback relay URLs. */
  fallbackRelayUrls?: string[];
  /** Storage backend: 'localStorage' | 'indexedDB' | 'memory' (default: auto-detect). */
  storageBackend?: 'localStorage' | 'indexedDB' | 'memory';
  /** Enable automatic session restoration on init (default: true). */
  autoRestore?: boolean;
  /** Enable heartbeat monitoring (default: true). */
  enableHeartbeat?: boolean;
  /** Heartbeat configuration. */
  heartbeat?: HeartbeatConfig;
  /** Enable automatic expiry cleanup (default: true). */
  autoCleanup?: boolean;
  /** Cleanup interval in milliseconds (default: 60_000 = 1 min). */
  cleanupInterval?: number;
  /** Maximum concurrent sessions (default: 10). */
  maxSessions?: number;
  /** Auto-select session by chain when making requests (default: true). */
  autoSelectByChain?: boolean;
}

// ============================================================
// Session Manager State
// ============================================================

/** Session manager lifecycle state. */
export type SessionManagerState =
  | { status: 'idle' }
  | { status: 'initializing' }
  | { status: 'ready'; sessionCount: number }
  | { status: 'connecting'; topic: string }
  | { status: 'connected'; activeTopic: string; sessionCount: number }
  | { status: 'error'; error: Error };

// ============================================================
// Session Manager Events
// ============================================================

/** Events emitted by SessionManager. */
export type SessionManagerEvent =
  | { type: 'state_change'; state: SessionManagerState }
  | { type: 'session_created'; session: Session }
  | { type: 'session_restored'; sessions: Session[] }
  | { type: 'session_selected'; session: Session }
  | { type: 'session_removed'; topic: string; reason: string }
  | { type: 'heartbeat_status'; status: HeartbeatStatus }
  | { type: 'cleanup'; removedCount: number }
  | WcClientEvent;

// ============================================================
// IndexedDB Storage Backend
// ============================================================

/**
 * IndexedDB storage backend for browsers with larger storage needs.
 * Falls back to localStorage if IndexedDB is unavailable.
 */
class IndexedDBStorageBackend {
  private dbName = 'cinacoin_wc_sessions';
  private storeName = 'sessions';
  private db: IDBDatabase | null = null;
  private fallback: StorageBackend | null = null;

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      this.fallback = this.createMemoryStorage();
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        logger.warn('[SessionManager] IndexedDB unavailable, using memory storage');
        this.fallback = this.createMemoryStorage();
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    if (this.fallback) {
      return this.fallback.getItem(key);
    }
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };
      request.onerror = () => resolve(null);
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.fallback) {
      this.fallback.setItem(key, value);
      return;
    }
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeItem(key: string): Promise<void> {
    if (this.fallback) {
      this.fallback.removeItem(key);
      return;
    }
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private createMemoryStorage(): StorageBackend {
    const store = new Map<string, string>();
    return {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    };
  }
}

interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// ============================================================
// Session Manager
// ============================================================

/**
 * Enhanced Session Manager for Cinacoin v2.
 *
 * Provides a unified, production-ready API for managing WC v2 sessions
 * with persistence, multi-session support, auto-reconnection, and
 * comprehensive event handling.
 */
export class SessionManager extends EventEmitter {
  private config: Required<Pick<EnhancedSessionManagerConfig, 'metadata' | 'autoRestore' | 'enableHeartbeat' | 'autoCleanup' | 'cleanupInterval' | 'maxSessions' | 'autoSelectByChain'>> &
    Pick<EnhancedSessionManagerConfig, 'chains' | 'methods' | 'events' | 'sessionTtl' | 'projectId' | 'relayUrl' | 'fallbackRelayUrls' | 'storageBackend' | 'heartbeat'>;
  
  private multiSession: MultiSessionManager;
  private store: SessionStore;
  private heartbeat: HeartbeatManager | null = null;
  private indexedDB: IndexedDBStorageBackend | null = null;
  private state: SessionManagerState = { status: 'idle' };
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  constructor(config: EnhancedSessionManagerConfig) {
    super();
    
    this.config = {
      metadata: config.metadata,
      chains: config.chains,
      methods: config.methods,
      events: config.events,
      sessionTtl: config.sessionTtl,
      projectId: config.projectId,
      relayUrl: config.relayUrl,
      fallbackRelayUrls: config.fallbackRelayUrls,
      storageBackend: config.storageBackend ?? 'localStorage',
      autoRestore: config.autoRestore ?? true,
      enableHeartbeat: config.enableHeartbeat ?? true,
      heartbeat: config.heartbeat,
      autoCleanup: config.autoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60_000,
      maxSessions: config.maxSessions ?? 10,
      autoSelectByChain: config.autoSelectByChain ?? true,
    };

    // Initialize session store
    this.store = new SessionStore();

    // Initialize multi-session manager
    this.multiSession = new MultiSessionManager({
      metadata: this.config.metadata,
      chains: this.config.chains,
      methods: this.config.methods,
      events: this.config.events,
      sessionTtl: this.config.sessionTtl,
      projectId: this.config.projectId,
      relayUrl: this.config.relayUrl,
      fallbackRelayUrls: this.config.fallbackRelayUrls,
      store: this.store,
    });

    // Forward events from multi-session manager
    this.multiSession.on('wcEvent', ((...args: unknown[]) => {
      const event = args[0] as WcClientEvent;
      this.emit('event', event);
      this.emit(event.type, event);
    }) as (...args: unknown[]) => void);

    this.multiSession.on('stateChange', ((...args: unknown[]) => {
      const state = args[0] as { status: string; [key: string]: unknown };
      this.updateStateFromMultiSession(state);
    }) as (...args: unknown[]) => void);
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  /**
   * Initialize the session manager.
   *
   * Sets up storage, restores sessions, starts heartbeat monitoring,
   * and begins automatic cleanup.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this.setState({ status: 'initializing' });

    try {
      // Initialize IndexedDB if configured
      if (this.config.storageBackend === 'indexedDB') {
        this.indexedDB = new IndexedDBStorageBackend();
        await this.indexedDB.init();
      }

      // Initialize multi-session manager
      await this.multiSession.init();

      // Restore sessions if enabled
      if (this.config.autoRestore) {
        const restored = await this.multiSession.restore();
        if (restored.length > 0) {
          this.emit('event', { type: 'session_restored', sessions: restored } as SessionManagerEvent);
          this.emit('session_restored', restored);
        }
      }

      // Start heartbeat monitoring if enabled
      if (this.config.enableHeartbeat) {
        this.startHeartbeat();
      }

      // Start automatic cleanup if enabled
      if (this.config.autoCleanup) {
        this.startAutoCleanup();
      }

      this.initialized = true;
      this.setState({
        status: 'ready',
        sessionCount: this.multiSession.sessionCount,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({ status: 'error', error: err });
      throw err;
    }
  }

  /**
   * Destroy the session manager and clean up all resources.
   */
  async destroy(): Promise<void> {
    // Stop heartbeat
    this.stopHeartbeat();

    // Stop auto-cleanup
    this.stopAutoCleanup();

    // Disconnect all sessions
    await this.multiSession.disconnect();

    // Close IndexedDB
    if (this.indexedDB) {
      await this.indexedDB.close();
      this.indexedDB = null;
    }

    this.initialized = false;
    this.setState({ status: 'idle' });
    this.removeAllListeners();
  }

  /**
   * Whether the session manager is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ============================================================
  // State
  // ============================================================

  /**
   * Get the current session manager state.
   */
  getState(): SessionManagerState {
    return this.state;
  }

  /**
   * Update internal state and emit change event.
   */
  private setState(state: SessionManagerState): void {
    this.state = state;
    this.emit('event', { type: 'state_change', state } as SessionManagerEvent);
    this.emit('state_change', state);
  }

  /**
   * Update state based on multi-session manager state.
   */
  private updateStateFromMultiSession(state: { status: string; [key: string]: unknown }): void {
    switch (state.status) {
      case 'idle':
        this.setState({ status: 'ready', sessionCount: 0 });
        break;
      case 'connecting':
        this.setState({ status: 'connecting', topic: state.topic as string });
        break;
      case 'connected':
        this.setState({
          status: 'connected',
          activeTopic: state.activeTopic as string,
          sessionCount: state.sessionCount as number,
        });
        break;
      case 'error':
        this.setState({ status: 'error', error: state.error as Error });
        break;
    }
  }

  // ============================================================
  // Session Creation
  // ============================================================

  /**
   * Create a new session and return the pairing URI.
   *
   * @returns Pairing URI string (for QR code display).
   */
  async createSession(): Promise<string> {
    this.ensureInitialized();

    // Check max sessions limit
    if (this.multiSession.sessionCount >= this.config.maxSessions) {
      throw new Error(`Maximum session limit reached (${this.config.maxSessions})`);
    }

    const uri = await this.multiSession.createPairing();
    
    this.emit('event', { type: 'session_created', session: { topic: uri } as Session } as SessionManagerEvent);
    this.emit('session_created', uri);

    return uri;
  }

  /**
   * Wait for a session to be established after creating a pairing.
   *
   * @param timeoutMs - Timeout in milliseconds (default: 5 minutes).
   * @returns The established session.
   */
  async waitForSession(timeoutMs: number = 300_000): Promise<Session> {
    this.ensureInitialized();
    return this.multiSession.waitForSession(timeoutMs);
  }

  /**
   * Connect using an existing Cinacoin URI.
   *
   * @param uri - Cinacoin v2 URI.
   * @returns The established session.
   */
  async connectWithUri(uri: string): Promise<Session> {
    this.ensureInitialized();
    return this.multiSession.connectUri(uri);
  }

  // ============================================================
  // Session Management
  // ============================================================

  /**
   * Get all active sessions.
   */
  getSessions(): Session[] {
    return this.multiSession.getSessions();
  }

  /**
   * Get a specific session by topic.
   */
  getSession(topic: string): Session | null {
    return this.multiSession.getSession(topic);
  }

  /**
   * Get the currently active (selected) session.
   */
  getActiveSession(): Session | null {
    return this.multiSession.getActiveSession();
  }

  /**
   * Set the active session by topic.
   *
   * @param topic - Session topic.
   * @returns True if session was found and selected.
   */
  setActiveSession(topic: string): boolean {
    const success = this.multiSession.setActiveSession(topic);
    if (success) {
      const session = this.multiSession.getSession(topic);
      if (session) {
        this.emit('event', { type: 'session_selected', session } as SessionManagerEvent);
        this.emit('session_selected', session);
      }
    }
    return success;
  }

  /**
   * Get a session that supports the given chain.
   *
   * @param chainId - CAIP-2 chain identifier (e.g., 'eip155:1').
   * @returns Session supporting the chain, or null.
   */
  getSessionByChain(chainId: string): Session | null {
    return this.multiSession.getSessionByChain(chainId);
  }

  /**
   * Get the number of active sessions.
   */
  get sessionCount(): number {
    return this.multiSession.sessionCount;
  }

  /**
   * Whether there's at least one active session.
   */
  isConnected(): boolean {
    return this.multiSession.sessionCount > 0 && this.multiSession.isConnected();
  }

  // ============================================================
  // JSON-RPC Requests
  // ============================================================

  /**
   * Send a JSON-RPC request via the active session.
   *
   * @param method - RPC method name.
   * @param params - Method parameters.
   * @returns Promise resolving with the response.
   */
  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    this.ensureInitialized();
    return this.multiSession.request<T>(method, params);
  }

  /**
   * Send a request to a specific session.
   *
   * @param topic - Session topic.
   * @param method - RPC method name.
   * @param params - Method parameters.
   * @returns Promise resolving with the response.
   */
  async requestTo<T = unknown>(topic: string, method: string, params?: unknown): Promise<T> {
    this.ensureInitialized();
    return this.multiSession.requestTo<T>(topic, method, params);
  }

  /**
   * Send a request to a session that supports the given chain.
   *
   * Automatically routes to the appropriate session based on chainId.
   *
   * @param chainId - CAIP-2 chain identifier (e.g., 'eip155:1').
   * @param method - RPC method name.
   * @param params - Method parameters.
   * @returns Promise resolving with the response.
   */
  async requestForChain<T = unknown>(chainId: string, method: string, params?: unknown): Promise<T> {
    this.ensureInitialized();
    return this.multiSession.requestForChain<T>(chainId, method, params);
  }

  // ============================================================
  // Session Operations
  // ============================================================

  /**
   * Extend a session's TTL.
   *
   * @param topic - Session topic.
   * @param newExpiry - New expiry timestamp (seconds from epoch).
   */
  async extendSession(topic: string, newExpiry: number): Promise<void> {
    this.ensureInitialized();
    await this.multiSession.extendSession(topic, newExpiry);
  }

  /**
   * Update a session's namespaces.
   *
   * @param topic - Session topic.
   * @param namespaces - Updated namespaces.
   */
  async updateSession(topic: string, namespaces: Record<string, SessionNamespace>): Promise<void> {
    this.ensureInitialized();
    await this.multiSession.updateSession(topic, namespaces);
  }

  /**
   * Disconnect a specific session.
   *
   * @param topic - Session topic.
   */
  async disconnectSession(topic: string): Promise<void> {
    this.ensureInitialized();
    await this.multiSession.disconnectSession(topic);
    this.emit('event', { type: 'session_removed', topic, reason: 'disconnected' } as SessionManagerEvent);
    this.emit('session_removed', topic, 'disconnected');
  }

  /**
   * Disconnect all sessions.
   */
  async disconnectAll(): Promise<void> {
    this.ensureInitialized();
    await this.multiSession.disconnect();
  }

  // ============================================================
  // Session Expiry & Cleanup
  // ============================================================

  /**
   * Check if a session is expired.
   *
   * @param topic - Session topic.
   * @returns True if session is expired.
   */
  isSessionExpired(topic: string): boolean {
    const session = this.getSession(topic);
    if (!session) return true;
    return this.multiSession.isSessionExpired(session);
  }

  /**
   * Get session expiry information.
   *
   * @param topic - Session topic.
   * @returns Expiry info or null if session not found.
   */
  getSessionExpiry(topic: string): { expiry: number; remainingMs: number; isExpired: boolean } | null {
    return this.multiSession.getSessionExpiry(topic);
  }

  /**
   * Clean up all expired sessions.
   *
   * @returns Number of sessions removed.
   */
  cleanupExpiredSessions(): number {
    const count = this.multiSession.cleanupExpiredSessions();
    if (count > 0) {
      this.emit('event', { type: 'cleanup', removedCount: count } as SessionManagerEvent);
      this.emit('cleanup', count);
    }
    return count;
  }

  /**
   * Perform a full cleanup of expired data (sessions, pairings, nonces).
   *
   * @returns Cleanup statistics.
   */
  fullCleanup(): { pairings: number; sessions: number; nonces: number } {
    return this.store.fullCleanup();
  }

  // ============================================================
  // Heartbeat Monitoring
  // ============================================================

  /**
   * Start heartbeat monitoring.
   */
  private startHeartbeat(): void {
    if (this.heartbeat) return;

    this.heartbeat = new HeartbeatManager(this.config.heartbeat);
    
    this.heartbeat.on('status', (event: HeartbeatEvent) => {
      if (event.type !== 'status') return;
      this.emit('event', { type: 'heartbeat_status', status: event.status } as SessionManagerEvent);
      this.emit('heartbeat_status', event.status);

      // Auto-reconnect on disconnection
      if (event.status === 'disconnected' && this.config.autoRestore) {
        this.handleDisconnection().catch((err) => {
          logger.error('[SessionManager] Failed to handle disconnection:', err);
        });
      }
    });

    // Adapt MultiSessionManager to HeartbeatConnector interface
    const connector = {
      isConnected: () => this.multiSession.isConnected(),
      restore: () => this.multiSession.restore(),
      emit: (event: string, data?: unknown) => this.multiSession.emit(event, data),
      on: (event: string, listener: (...args: unknown[]) => void) => this.multiSession.on(event, listener),
      off: (event: string, listener: (...args: unknown[]) => void) => this.multiSession.off(event, listener),
    };
    this.heartbeat.start(connector);
  }

  /**
   * Stop heartbeat monitoring.
   */
  private stopHeartbeat(): void {
    if (this.heartbeat) {
      this.heartbeat.stop();
      this.heartbeat = null;
    }
  }

  /**
   * Handle disconnection by attempting to restore sessions.
   */
  private async handleDisconnection(): Promise<void> {
    logger.info('[SessionManager] Disconnection detected, attempting to restore sessions...');
    
    try {
      await this.multiSession.restore();
      logger.info('[SessionManager] Sessions restored successfully');
    } catch (error) {
      logger.error('[SessionManager] Failed to restore sessions:', error);
    }
  }

  // ============================================================
  // Automatic Cleanup
  // ============================================================

  /**
   * Start automatic cleanup timer.
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
      this.fullCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer.
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // ============================================================
  // Persistence
  // ============================================================

  /**
   * Manually persist all sessions to storage.
   */
  persistSessions(): void {
    const sessions = this.multiSession.getSessions();
    for (const session of sessions) {
      const managed = (this.multiSession as any).sessions.get(session.topic) as ManagedSession;
      if (managed) {
        this.store.saveSession(
          session,
          {
            publicKey: bytesToHex(managed.keypair.publicKey),
            privateKey: bytesToHex(managed.keypair.privateKey),
          },
          managed.peerPublicKey,
        );
      }
    }
  }

  /**
   * Clear all persisted data.
   */
  clearPersistedData(): void {
    this.store.clear();
  }

  /**
   * Get a summary of stored data.
   */
  getStorageSummary(): {
    pairings: number;
    sessions: number;
    keypairs: number;
    nonces: number;
    activePairings: number;
    activeSessions: number;
  } {
    return this.store.getSummary();
  }

  // ============================================================
  // Events
  // ============================================================

  /**
   * Register an event listener.
   *
   * @param event - Event name.
   * @param handler - Event handler.
   */
  on(event: string, handler: (...args: unknown[]) => void): void {
    super.on(event, handler);
  }

  /**
   * Register a one-time event listener.
   *
   * @param event - Event name.
   * @param handler - Event handler.
   */
  once(event: string, handler: (...args: unknown[]) => void): void {
    super.once(event, handler);
  }

  /**
   * Remove an event listener.
   *
   * @param event - Event name.
   * @param handler - Event handler.
   */
  off(event: string, handler: (...args: unknown[]) => void): void {
    super.off(event, handler);
  }

  // ============================================================
  // Utilities
  // ============================================================

  /**
   * Ensure the session manager is initialized.
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SessionManager not initialized — call init() first');
    }
  }

  /**
   * Get the relay URL being used.
   */
  getRelayUrl(): string {
    return this.multiSession.getRelayUrl();
  }

  /**
   * Check if the relay is connected.
   */
  isRelayConnected(): boolean {
    return this.multiSession.isConnected();
  }
}
