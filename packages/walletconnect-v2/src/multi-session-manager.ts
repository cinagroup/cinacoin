/**
 * Multi-Session Manager for WalletConnect v2.
 *
 * Manages multiple concurrent WC v2 sessions with full lifecycle
 * support: creation, restoration, expiry detection, selection,
 * and per-session request routing. Integrates with the SessionStore
 * for persistence and the CloudRelay for transport.
 *
 * @packageDocumentation
 */

import { logger } from '@cinacoin/logger';
import { EventEmitter } from '@cinacoin/core-sdk';
import type { AppMetadata, RequiredNamespace } from '@cinacoin/core-sdk';
import type {
  Session,
  WcClientEvent,
  JsonRpcRequest,
  JsonRpcResponse,
  SessionNamespace,
  SessionProposal,
} from './types.js';
import { CloudRelay } from './cloud-relay.js';
import { SessionStore, StoredSession, StoredKeypair } from './session-store.js';
import { generateKeypair, sharedSecret, bytesToHex, hexToBytes, encrypt, decrypt } from './crypto.js';
import { parseWcUri, isValidWcUri, createPairing, encryptPairingMessage, decryptPairingMessage } from './pairing.js';
import { getDefaultRequiredNamespaces } from './methods.js';
import { sha256 } from '@noble/hashes/sha2.js';

// ============================================================
// Multi-Session Config
// ============================================================

/** Configuration for MultiSessionManager. */
export interface MultiSessionManagerConfig {
  /** Relay server URL (or use CloudRelay default). */
  relayUrl?: string;
  /** Project ID for WalletConnect Cloud relay. */
  projectId?: string;
  /** dApp metadata. */
  metadata: AppMetadata;
  /** Chains to request (CAIP-2). */
  chains?: string[];
  /** Methods to request. */
  methods?: string[];
  /** Events to subscribe to. */
  events?: string[];
  /** Session TTL in seconds (default: 7 days). */
  sessionTtl?: number;
  /** Shared SessionStore instance. */
  store?: SessionStore;
  /** Fallback relay URLs. */
  fallbackRelayUrls?: string[];
}

// ============================================================
// Managed Session
// ============================================================

/** A session managed by the MultiSessionManager. */
export interface ManagedSession {
  /** The session object. */
  session: Session;
  /** Our X25519 keypair for this session. */
  keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
  /** Peer's public key (for re-deriving shared secret). */
  peerPublicKey: string;
  /** Cached shared secret. */
  sharedSecret: Uint8Array;
  /** Pending RPC requests for this session. */
  pendingRequests: Map<number, { resolve: (r: unknown) => void; reject: (e: Error) => void; timeout: ReturnType<typeof setTimeout> }>;
  /** Last activity timestamp. */
  lastActivity: number;
}

// ============================================================
// Pending Proposal
// ============================================================

/** Tracks an in-flight proposal waiting for wallet response. */
interface PendingProposal {
  /** The keypair used to create this proposal. */
  keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
  /** Topic this proposal was sent on. */
  pairingTopic: string;
  /** When the proposal was sent. */
  createdAt: number;
}

// ============================================================
// Multi-Session Manager State
// ============================================================

/** State emitted by the MultiSessionManager. */
export type MultiSessionState =
  | { status: 'idle' }
  | { status: 'connecting'; topic: string }
  | { status: 'connected'; activeTopic: string; sessionCount: number }
  | { status: 'error'; error: Error };

// ============================================================
// MultiSessionManager
// ============================================================

/**
 * Manages multiple WC v2 sessions concurrently.
 *
 * Features:
 * - Create new sessions (pair + propose)
 * - Restore sessions from persistent storage
 * - Route requests to the correct session
 * - Detect and clean expired sessions
 * - Emit events for all session lifecycle changes
 * - Support active session selection
 */
export class MultiSessionManager extends EventEmitter {
  private config: Required<Pick<MultiSessionManagerConfig, 'metadata' | 'sessionTtl'>> &
    Pick<MultiSessionManagerConfig, 'chains' | 'methods' | 'events' | 'relayUrl' | 'projectId' | 'fallbackRelayUrls'>;
  private relay: CloudRelay | null = null;
  private store: SessionStore;
  private sessions: Map<string, ManagedSession> = new Map();
  private activeTopic: string | null = null;
  private state: MultiSessionState = { status: 'idle' };
  private nextRpcId = 1;

  /** Pending session establishment (connectUri flow). */
  private pendingSessionResolve: ((session: Session) => void) | null = null;
  private pendingSessionReject: ((error: Error) => void) | null = null;
  private pendingSessionTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Pending proposals keyed by pairing topic. */
  private pendingProposals: Map<string, PendingProposal> = new Map();

  private _relayUrl: string;

  constructor(config: MultiSessionManagerConfig) {
    super();
    this.config = {
      metadata: config.metadata,
      sessionTtl: config.sessionTtl ?? 7 * 24 * 60 * 60,
      chains: config.chains,
      methods: config.methods,
      events: config.events,
      relayUrl: config.relayUrl,
      projectId: config.projectId,
      fallbackRelayUrls: config.fallbackRelayUrls,
    };
    this.store = config.store ?? new SessionStore();
    this._relayUrl = config.relayUrl || 'wss://relay.walletconnect.com';
  }

  // ============================================================
  // State
  // ============================================================

  /** Current manager state. */
  getState(): MultiSessionState {
    return this.state;
  }

  /** Update internal state and emit change. */
  private setState(state: MultiSessionState): void {
    this.state = state;
    this.emit('stateChange', state);
  }

  // ============================================================
  // Relay Lifecycle
  // ============================================================

  /** Initialize the relay connection. */
  async init(): Promise<void> {
    if (this.relay?.isConnected()) return;

    this.relay = new CloudRelay({
      url: this.config.relayUrl ?? 'wss://relay.walletconnect.com',
      projectId: this.config.projectId,
      fallbackUrls: this.config.fallbackRelayUrls,
    });
    await this.relay.connect();
  }

  /** Whether the relay is connected. */
  isConnected(): boolean {
    return this.relay?.isConnected() ?? false;
  }

  /** Disconnect the relay and all sessions. */
  async disconnect(): Promise<void> {
    // Send delete notifications for all sessions
    for (const topic of this.sessions.keys()) {
      await this.sendSessionDelete(topic).catch(err => {
        logger.warn(`[MultiSessionManager] Failed to send session delete for ${topic}:`, err?.message ?? err);
      });
    }

    this.sessions.clear();
    this.activeTopic = null;

    // Clear pending session promise
    if (this.pendingSessionTimeout) {
      clearTimeout(this.pendingSessionTimeout);
    }
    this.pendingSessionResolve = null;
    this.pendingSessionReject = null;
    this.pendingSessionTimeout = null;

    this.pendingProposals.clear();

    this.relay?.disconnect();
    this.relay = null;

    this.setState({ status: 'idle' });
  }

  // ============================================================
  // Session Restoration
  // ============================================================

  /**
   * Restore all persisted sessions.
   *
   * Loads sessions from the SessionStore, reconnects to the relay,
   * and re-subscribes to each session's topic.
   */
  async restore(): Promise<Session[]> {
    await this.init();

    // Clean up expired data first
    this.store.fullCleanup();

    const restored = this.store.restoreAllSessions();
    const sessions: Session[] = [];

    for (const { session: stored, keypair } of restored) {
      try {
        const managed = this.rebuildSession(stored, keypair);
        if (managed) {
          sessions.push(managed.session);
        }
      } catch (err) {
        logger.warn(`[MultiSessionManager] Failed to restore session ${stored.topic}:`, err);
        this.store.deleteSession(stored.topic);
      }
    }

    // Set active session to the most recently updated one
    if (sessions.length > 0 && !this.activeTopic) {
      // Pick the one with latest lastActivity (or just the last one)
      const sorted = [...sessions].sort((a, b) => b.expiry - a.expiry);
      this.activeTopic = sorted[0].topic;
    }

    if (sessions.length > 0) {
      this.setState({
        status: 'connected',
        activeTopic: this.activeTopic!,
        sessionCount: sessions.length,
      });
    }

    return sessions;
  }

  /**
   * Rebuild a ManagedSession from stored data (sync — relay already connected).
   */
  private rebuildSession(
    stored: StoredSession,
    keypairData?: StoredKeypair,
  ): ManagedSession | null {
    // Check expiry
    if (stored.expiry <= Date.now()) {
      return null;
    }

    let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
    let peerPublicKey: string;

    if (keypairData) {
      keypair = {
        publicKey: hexToBytes(keypairData.keypair.publicKey),
        privateKey: hexToBytes(keypairData.keypair.privateKey),
      };
      peerPublicKey = keypairData.peerPublicKey;
    } else if (stored.keypair && stored.peerPublicKey) {
      keypair = {
        publicKey: hexToBytes(stored.keypair.publicKey),
        privateKey: hexToBytes(stored.keypair.privateKey),
      };
      peerPublicKey = stored.peerPublicKey;
    } else {
      return null;
    }

    // Derive shared secret
    const peerPubBytes = hexToBytes(peerPublicKey);
    const ss = sharedSecret(keypair.privateKey, peerPubBytes);

    // Build session object
    const session: Session = {
      topic: stored.topic,
      peerMetadata: stored.peerMetadata,
      accounts: stored.accounts,
      namespaces: stored.namespaces,
      requiredNamespaces: stored.requiredNamespaces,
      expiry: stored.expiry,
      relay: stored.relay,
    };

    // Build managed session
    const managed: ManagedSession = {
      session,
      keypair,
      peerPublicKey,
      sharedSecret: ss,
      pendingRequests: new Map(),
      lastActivity: Date.now(),
    };

    this.sessions.set(session.topic, managed);

    // Subscribe to the session topic for incoming messages
    this.relay?.subscribe(session.topic, (payload: string) => {
      this.handleSessionMessage(session.topic, payload).catch(err => {
        logger.warn(`[MultiSessionManager] Failed to handle session message for ${session.topic}:`, err?.message ?? err);
      });
    });

    return managed;
  }

  // ============================================================
  // Session Creation
  // ============================================================

  /**
   * Create a new pairing and return the URI.
   *
   * After the wallet scans the QR code, use `waitForSession()` to
   * wait for approval.
   */
  async createPairing(): Promise<string> {
    await this.init();

    const { pairing } = await createPairing({
      relayUrl: this._relayUrl,
      expiry: 300,
    });

    // Subscribe via our relay
    await this.relay!.subscribe(pairing.topic, (payload: string) => {
      this.handlePairingMessage(pairing.topic, payload, pairing.symKey!).catch(err => {
        logger.warn(`[MultiSessionManager] Failed to handle pairing message for ${pairing.topic}:`, err?.message ?? err);
      });
    });

    // Save pairing
    this.store.savePairing(pairing);

    this.setState({ status: 'connecting', topic: pairing.topic });

    return pairing.uri;
  }

  /**
   * Wait for a session to be established after creating a pairing.
   *
   * @param timeoutMs - Timeout (default: 5 minutes).
   */
  waitForSession(timeoutMs: number = 300_000): Promise<Session> {
    return new Promise((resolve, reject) => {
      this.pendingSessionResolve = resolve;
      this.pendingSessionReject = reject;

      this.pendingSessionTimeout = setTimeout(() => {
        this.clearPendingSession();
        reject(new Error('Session establishment timed out'));
      }, timeoutMs);
    });
  }

  /** Clear pending session promise. */
  private clearPendingSession(): void {
    if (this.pendingSessionTimeout) {
      clearTimeout(this.pendingSessionTimeout);
    }
    this.pendingSessionResolve = null;
    this.pendingSessionReject = null;
    this.pendingSessionTimeout = null;
  }

  /**
   * Connect using an existing WC URI.
   *
   * @param uri - WalletConnect v2 URI.
   * @returns The established session.
   */
  async connectUri(uri: string): Promise<Session> {
    if (!isValidWcUri(uri)) {
      throw new Error('Invalid WalletConnect URI');
    }

    await this.init();

    const parsed = parseWcUri(uri);

    // Save pairing
    const pairing = {
      topic: parsed.topic,
      uri,
      active: true,
      expiry: Date.now() + 300_000,
      symKey: parsed.symKey,
    };
    this.store.savePairing(pairing);

    // Subscribe to pairing topic
    await this.relay!.subscribe(parsed.topic, (payload: string) => {
      this.handlePairingMessage(parsed.topic, payload, parsed.symKey).catch(err => {
        logger.warn(`[MultiSessionManager] Failed to handle pairing message for ${parsed.topic}:`, err?.message ?? err);
      });
    });

    // Send session proposal
    await this.sendSessionProposal(parsed);

    return this.waitForSession();
  }

  /** Send a session proposal over the pairing channel. */
  private async sendSessionProposal(parsed: ReturnType<typeof parseWcUri>): Promise<void> {
    const keypair = generateKeypair();

    // Store the keypair so we can use it when the response arrives
    this.pendingProposals.set(parsed.topic, {
      keypair,
      pairingTopic: parsed.topic,
      createdAt: Date.now(),
    });

    const requiredNamespaces = getDefaultRequiredNamespaces({
      chains: this.config.chains,
      methods: this.config.methods,
      events: this.config.events,
    });

    const proposal = {
      id: this.nextRpcId++,
      jsonrpc: '2.0' as const,
      method: 'wc_sessionPropose',
      params: {
        requiredNamespaces,
        optionalNamespaces: {},
        relays: [{ protocol: 'irn' }],
        proposer: {
          publicKey: bytesToHex(keypair.publicKey),
          metadata: this.config.metadata,
        },
      },
    };

    const encrypted = encryptPairingMessage(parsed.symKey, proposal);
    await this.relay!.publish(parsed.topic, encrypted);
  }

  // ============================================================
  // Session Management
  // ============================================================

  /** Get all active sessions. */
  getSessions(): Session[] {
    return Array.from(this.sessions.values()).map((m) => m.session);
  }

  /** Get a specific session by topic. */
  getSession(topic: string): Session | null {
    return this.sessions.get(topic)?.session ?? null;
  }

  /** Get the active (selected) session. */
  getActiveSession(): Session | null {
    if (!this.activeTopic) return null;
    return this.sessions.get(this.activeTopic)?.session ?? null;
  }

  /**
   * Get a session that supports the given chain (CAIP-2, e.g., 'eip155:1').
   *
   * Returns the active session if it supports the chain, otherwise finds
   * the first session that does, or null.
   *
   * @param chainId - CAIP-2 chain identifier.
   * @returns Session supporting the chain, or null.
   */
  getSessionByChain(chainId: string): Session | null {
    // Check active session first
    const active = this.getActiveSession();
    if (active && this.sessionSupportsChain(active, chainId)) {
      return active;
    }

    // Search all sessions
    for (const managed of this.sessions.values()) {
      if (this.sessionSupportsChain(managed.session, chainId)) {
        return managed.session;
      }
    }

    return null;
  }

  /** Check if a session supports a given chain. */
  private sessionSupportsChain(session: Session, chainId: string): boolean {
    // Check if any account belongs to this chain
    for (const account of session.accounts) {
      if (account.startsWith(`${chainId}:`)) {
        return true;
      }
    }

    // Check namespaces
    for (const ns of Object.values(session.namespaces)) {
      if (ns.chains?.includes(chainId)) {
        return true;
      }
    }

    return false;
  }

  /** Set the active session by topic. Returns false if topic not found. */
  setActiveSession(topic: string): boolean {
    if (!this.sessions.has(topic)) return false;
    this.activeTopic = topic;

    this.setState({
      status: 'connected',
      activeTopic: topic,
      sessionCount: this.sessions.size,
    });

    this.emit('wcEvent', { type: 'connected', session: this.sessions.get(topic)!.session } as WcClientEvent);
    return true;
  }

  /** Number of active sessions. */
  get sessionCount(): number {
    return this.sessions.size;
  }

  // ============================================================
  // JSON-RPC Requests
  // ============================================================

  /** Send a request via the active session. */
  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    const managed = this.getActiveManagedSession();
    if (!managed) {
      throw new Error('No active session — connect first');
    }
    if (this.isSessionExpired(managed.session)) {
      this.removeSession(managed.session.topic);
      throw new Error('Session has expired');
    }
    return this.sendRequest<T>(managed, method, params);
  }

  /** Send a request to a specific session. */
  async requestTo<T = unknown>(topic: string, method: string, params?: unknown): Promise<T> {
    const managed = this.sessions.get(topic);
    if (!managed) throw new Error(`Session not found: ${topic}`);
    return this.sendRequest<T>(managed, method, params);
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
    const session = this.getSessionByChain(chainId);
    if (!session) {
      throw new Error(`No session supports chain ${chainId}`);
    }
    const managed = this.sessions.get(session.topic);
    if (!managed) {
      throw new Error(`Session not found for topic ${session.topic}`);
    }
    return this.sendRequest<T>(managed, method, params);
  }

  /** Send a JSON-RPC request. */
  private sendRequest<T = unknown>(
    managed: ManagedSession,
    method: string,
    params?: unknown,
  ): Promise<T> {
    const id = this.nextRpcId++;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        managed.pendingRequests.delete(id);
        reject(new Error(`Request '${method}' timed out`));
      }, 60_000);

      managed.pendingRequests.set(id, { resolve: resolve as (r: unknown) => void, reject, timeout });

      const request: JsonRpcRequest = {
        id,
        jsonrpc: '2.0',
        method,
        params: params ?? [],
      };

      this.publishToSession(managed, request).catch(reject);
    });
  }

  // ============================================================
  // Session Operations
  // ============================================================

  /** Extend a session's TTL. */
  async extendSession(topic: string, newExpiry: number): Promise<void> {
    const managed = this.sessions.get(topic);
    if (!managed) throw new Error('Session not found');

    const notification: JsonRpcRequest = {
      id: this.nextRpcId++,
      jsonrpc: '2.0',
      method: 'wc_sessionExtend',
      params: { expiry: newExpiry },
    };

    await this.publishToSession(managed, notification);

    managed.session.expiry = newExpiry * 1000;
    this.persistSession(managed);

    this.emit('wcEvent', {
      type: 'session_extend',
      topic: managed.session.topic,
      newExpiry: managed.session.expiry,
    } as WcClientEvent);
  }

  /** Update a session's namespaces. */
  async updateSession(topic: string, namespaces: Record<string, SessionNamespace>): Promise<void> {
    const managed = this.sessions.get(topic);
    if (!managed) throw new Error('Session not found');

    const notification: JsonRpcRequest = {
      id: this.nextRpcId++,
      jsonrpc: '2.0',
      method: 'wc_sessionUpdate',
      params: { namespaces },
    };

    await this.publishToSession(managed, notification);

    managed.session.namespaces = namespaces;
    this.persistSession(managed);

    this.emit('wcEvent', {
      type: 'session_update',
      session: managed.session,
    } as WcClientEvent);
  }

  /** Disconnect a specific session. */
  async disconnectSession(topic: string): Promise<void> {
    await this.sendSessionDelete(topic).catch(err => {
      logger.warn(`[MultiSessionManager] Failed to send session delete for ${topic}:`, err?.message ?? err);
    });
    this.removeSession(topic);
  }

  /** Remove a session from internal state. */
  private removeSession(topic: string): void {
    const managed = this.sessions.get(topic);
    if (managed) {
      for (const [, pending] of managed.pendingRequests) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Session disconnected'));
      }
      managed.pendingRequests.clear();

      this.relay?.unsubscribe(topic);
      this.sessions.delete(topic);
      this.store.deleteSession(topic);

      this.emit('wcEvent', { type: 'session_delete', topic } as WcClientEvent);
    }

    if (this.activeTopic === topic) {
      const remaining = this.sessions.keys().next();
      if (remaining.done) {
        this.activeTopic = null;
        this.setState({ status: 'idle' });
      } else {
        this.activeTopic = remaining.value;
        this.setState({
          status: 'connected',
          activeTopic: this.activeTopic,
          sessionCount: this.sessions.size,
        });
      }
    }
  }

  // ============================================================
  // Expiry Detection
  // ============================================================

  /** Check if a session is expired. */
  isSessionExpired(session: Session): boolean {
    return Date.now() >= session.expiry;
  }

  /** Remove all expired sessions. Returns count. */
  cleanupExpiredSessions(): number {
    const expired: string[] = [];
    for (const [topic, managed] of this.sessions) {
      if (this.isSessionExpired(managed.session)) {
        expired.push(topic);
      }
    }
    for (const topic of expired) {
      this.removeSession(topic);
    }
    return expired.length;
  }

  // ============================================================
  // Message Handling — Pairing Channel
  // ============================================================

  /** Handle messages on the pairing channel (proposal responses). */
  private async handlePairingMessage(
    pairingTopic: string,
    encryptedPayload: string,
    symKey: string,
  ): Promise<void> {
    try {
      const decrypted = decryptPairingMessage(symKey, encryptedPayload);
      const msg = decrypted as Record<string, unknown>;

      // Check for session proposal response
      if (msg.result && typeof msg.result === 'object') {
        const result = msg.result as Record<string, unknown>;
        if ('responderPublicKey' in result) {
          await this.handleProposalResponse(pairingTopic, result);
          return;
        }
      }

      // Check for proposal rejection (wc_sessionPropose error)
      if (msg.error) {
        const err = msg.error as { code?: number; message?: string };
        const pending = this.pendingProposals.get(pairingTopic);
        if (pending) {
          this.pendingProposals.delete(pairingTopic);
          this.pendingSessionReject?.(
            new Error(`Proposal rejected (code ${err.code}): ${err.message ?? 'Unknown'}`),
          );
          this.clearPendingSession();
          this.store.deletePairing(pairingTopic);
        }
        this.emit('wcEvent', {
          type: 'error',
          error: new Error(`Proposal rejected: ${err.message ?? 'Unknown'}`),
        } as WcClientEvent);
        return;
      }

      // Handle incoming session proposal (wallet → dApp)
      if (msg.method === 'wc_sessionPropose') {
        this.emit('wcEvent', {
          type: 'session_proposal',
          proposal: msg as unknown as SessionProposal,
        } as WcClientEvent);
      }
    } catch (err) {
      logger.warn(`[MultiSessionManager] Failed to handle pairing message:`, err);
    }
  }

  /** Handle the wallet's response to a session proposal. */
  private async handleProposalResponse(
    pairingTopic: string,
    result: Record<string, unknown>,
  ): Promise<void> {
    const pending = this.pendingProposals.get(pairingTopic);
    if (!pending) {
      logger.warn(`[MultiSessionManager] No pending proposal for topic ${pairingTopic}`);
      return;
    }

    const responderPublicKey = (result.responderPublicKey as string) ?? '';
    if (!responderPublicKey) {
      this.pendingSessionReject?.(new Error('Missing responder public key'));
      return;
    }

    // Check for approval errors (user rejected, unsupported chains, etc.)
    const approvalError = result.error as { code?: number; message?: string } | undefined;
    if (approvalError) {
      this.pendingProposals.delete(pairingTopic);
      this.pendingSessionReject?.(
        new Error(`Session rejected (code ${approvalError.code}): ${approvalError.message}`),
      );
      this.clearPendingSession();
      this.store.deletePairing(pairingTopic);
      return;
    }

    const { keypair } = pending;
    this.pendingProposals.delete(pairingTopic);

    // Derive shared secret
    const peerPubBytes = hexToBytes(responderPublicKey);
    const ss = sharedSecret(keypair.privateKey, peerPubBytes);

    // Derive session topic: SHA-256(pubKeyA || pubKeyB)
    const combined = new Uint8Array(keypair.publicKey.length + peerPubBytes.length);
    combined.set(keypair.publicKey);
    combined.set(peerPubBytes);
    const hash = sha256(combined);
    const sessionTopic = Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');

    // Subscribe to session topic
    await this.relay?.subscribe(sessionTopic, (payload: string) => {
      this.handleSessionMessage(sessionTopic, payload).catch(err => {
        logger.warn(`[MultiSessionManager] Failed to handle session message for ${sessionTopic}:`, err?.message ?? err);
      });
    });

    // Build session object
    const accounts = (result.accounts as string[]) ?? [];
    const sessionExpiry = (result.expiry as number) ?? Date.now() + (this.config.sessionTtl * 1000);

    const session: Session = {
      topic: sessionTopic,
      peerMetadata: (result.peerMetadata as AppMetadata) ?? {
        name: 'Unknown Wallet',
        description: '',
        url: '',
        icons: [],
      },
      accounts,
      namespaces: (result.namespaces as Record<string, SessionNamespace>) ?? {},
      requiredNamespaces: this.getDefaultNamespaces(),
      expiry: sessionExpiry,
      relay: { protocol: 'irn' },
    };

    const managed: ManagedSession = {
      session,
      keypair,
      peerPublicKey: responderPublicKey,
      sharedSecret: ss,
      pendingRequests: new Map(),
      lastActivity: Date.now(),
    };

    this.sessions.set(session.topic, managed);
    this.store.saveSession(session, {
      publicKey: bytesToHex(keypair.publicKey),
      privateKey: bytesToHex(keypair.privateKey),
    }, responderPublicKey);

    // Clean up pairing
    this.store.deletePairing(pairingTopic);

    // Set active if no active session yet
    if (!this.activeTopic) {
      this.activeTopic = session.topic;
    }

    this.setState({
      status: 'connected',
      activeTopic: this.activeTopic,
      sessionCount: this.sessions.size,
    });

    // Resolve the waiting promise
    this.emit('wcEvent', { type: 'connected', session } as WcClientEvent);
    this.pendingSessionResolve?.(session);
    this.clearPendingSession();
  }

  // ============================================================
  // Message Handling — Session Channel
  // ============================================================

  /** Handle messages on a session topic. */
  private async handleSessionMessage(topic: string, encryptedPayload: string): Promise<void> {
    const managed = this.sessions.get(topic);
    if (!managed) return;

    try {
      const plaintext = decrypt(managed.sharedSecret, encryptedPayload);
      const msg = JSON.parse(new TextDecoder().decode(plaintext)) as JsonRpcRequest | JsonRpcResponse;

      managed.lastActivity = Date.now();

      // Response to our request
      if ('result' in msg || 'error' in msg) {
        const pending = managed.pendingRequests.get(msg.id);
        if (pending) {
          clearTimeout(pending.timeout);
          managed.pendingRequests.delete(msg.id);

          if ('error' in msg && msg.error) {
            pending.reject(new Error((msg.error as { message: string }).message));
          } else {
            pending.resolve(msg.result);
          }
        }
        return;
      }

      // Incoming request/notification
      const request = msg as JsonRpcRequest;

      switch (request.method) {
        case 'wc_sessionUpdate': {
          if (managed.session) {
            managed.session.namespaces = (request.params as { namespaces: Record<string, SessionNamespace> }).namespaces;
            this.persistSession(managed);
            this.emit('wcEvent', { type: 'session_update', session: managed.session } as WcClientEvent);
          }
          break;
        }

        case 'wc_sessionDelete': {
          this.emit('wcEvent', { type: 'session_delete', topic: managed.session.topic } as WcClientEvent);
          this.removeSession(topic);
          break;
        }

        case 'wc_sessionExtend': {
          if (managed.session) {
            const expiry = (request.params as { expiry: number }).expiry;
            managed.session.expiry = expiry * 1000;
            this.persistSession(managed);
            this.emit('wcEvent', {
              type: 'session_extend',
              topic: managed.session.topic,
              newExpiry: managed.session.expiry,
            } as WcClientEvent);
          }
          break;
        }

        case 'wc_sessionEvent':
        case 'wc_sessionEmit':
          this.emit('wcEvent', {
            type: 'session_notification',
            notification: request.params as { chainId: string; name: string; data: unknown },
          } as WcClientEvent);
          break;

        case 'wc_sessionPing': {
          const pong: JsonRpcResponse = {
            id: request.id,
            jsonrpc: '2.0',
            result: {},
          };
          const pongEncrypted = encrypt(managed.sharedSecret, new TextEncoder().encode(JSON.stringify(pong)));
          await this.relay?.publish(topic, pongEncrypted);
          break;
        }

        default: {
          const errorResponse: JsonRpcResponse = {
            id: request.id,
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not supported: ${request.method}`,
            },
          };
          const errEncrypted = encrypt(managed.sharedSecret, new TextEncoder().encode(JSON.stringify(errorResponse)));
          await this.relay?.publish(topic, errEncrypted);
        }
      }
    } catch (err) {
      logger.warn(`[MultiSessionManager] Failed to handle message on ${topic}:`, err);
    }
  }

  // ============================================================
  // Internal Helpers
  // ============================================================

  private getActiveManagedSession(): ManagedSession | null {
    if (!this.activeTopic) return null;
    return this.sessions.get(this.activeTopic) ?? null;
  }

  private async publishToSession(managed: ManagedSession, message: unknown): Promise<void> {
    if (!this.relay) throw new Error('Relay not connected');
    const encrypted = encrypt(managed.sharedSecret, new TextEncoder().encode(JSON.stringify(message)));
    await this.relay.publish(managed.session.topic, encrypted);
  }

  private persistSession(managed: ManagedSession): void {
    this.store.saveSession(managed.session, {
      publicKey: bytesToHex(managed.keypair.publicKey),
      privateKey: bytesToHex(managed.keypair.privateKey),
    }, managed.peerPublicKey);
  }

  private async sendSessionDelete(topic: string): Promise<void> {
    const managed = this.sessions.get(topic);
    if (!managed || !this.relay) return;

    const notification: JsonRpcRequest = {
      id: this.nextRpcId++,
      jsonrpc: '2.0',
      method: 'wc_sessionDelete',
      params: { code: 6000, message: 'User disconnected' },
    };

    const encrypted = encrypt(managed.sharedSecret, new TextEncoder().encode(JSON.stringify(notification)));
    await this.relay.publish(topic, encrypted);
  }

  private getDefaultNamespaces(): Record<string, RequiredNamespace> {
    return getDefaultRequiredNamespaces({
      chains: this.config.chains,
      methods: this.config.methods,
      events: this.config.events,
    });
  }

  /** Get the relay URL being used. */
  getRelayUrl(): string {
    return this.relay?.getConnectedUrl() ?? this._relayUrl;
  }

  /** Get session expiry info. */
  getSessionExpiry(topic: string): { expiry: number; remainingMs: number; isExpired: boolean } | null {
    const session = this.getSession(topic);
    if (!session) return null;
    const now = Date.now();
    return {
      expiry: session.expiry,
      remainingMs: Math.max(0, session.expiry - now),
      isExpired: now >= session.expiry,
    };
  }
}
