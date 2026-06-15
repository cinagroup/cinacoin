/**
 * WalletConnect v2 Unified Abstraction Layer.
 *
 * Provides a platform-agnostic interface for WalletConnect v2 operations,
 * abstracting over the different platform-specific WC SDK implementations
 * (iOS WalletConnectSwiftV2, Android WC SDK, Flutter walletconnect_flutter_v2,
 * Unity/TypeScript custom implementations).
 *
 * This allows the UniversalConnector to delegate WC-specific operations
 * without depending on any single platform's implementation details.
 *
 * @packageDocumentation
 */

import type { EventHandler } from './types';

/* ------------------------------------------------------------------ */
/*  WC v2 Core Types                                                   */
/* ------------------------------------------------------------------ */

/**
 * WalletConnect v2 pairing URI.
 */
export interface WCPairingURI {
  /** The full WC URI string (e.g., "wc:topic@2?bridge=..."). */
  uri: string;
  /** The pairing topic. */
  topic: string;
  /** The relay protocol (e.g., "waku"). */
  relayProtocol: string;
  /** Symmetric key for the pairing (if available). */
  symKey?: string;
}

/**
 * WalletConnect v2 session proposal.
 */
export interface WCSessionProposal {
  /** Unique proposal ID. */
  id: number;
  /** Proposer metadata. */
  proposer: {
    metadata: WCPeerMetadata;
    publicKey: string;
  };
  /** Required namespaces (CAIP-2). */
  requiredNamespaces: Record<string, WCNamespace>;
  /** Optional namespaces (CAIP-2). */
  optionalNamespaces?: Record<string, WCNamespace>;
  /** Relay protocol. */
  relayProtocol: string;
  /** Pairing topic. */
  pairingTopic: string;
}

/**
 * WalletConnect v2 approved session.
 */
export interface WCSession {
  /** Session topic (unique identifier). */
  topic: string;
  /** Peer (wallet) metadata. */
  peer: WCPeerMetadata;
  /** Approved namespaces with accounts and methods. */
  namespaces: Record<string, WCApprovedNamespace>;
  /** Session expiry timestamp (seconds since epoch). */
  expiry: number;
  /** Whether the session is acknowledged. */
  acknowledged: boolean;
  /** Relay protocol. */
  relayProtocol: string;
}

/**
 * Peer metadata (wallet or dApp).
 */
export interface WCPeerMetadata {
  /** Application name. */
  name: string;
  /** Application description. */
  description: string;
  /** Application URL. */
  url: string;
  /** Icon URLs. */
  icons: string[];
}

/**
 * Namespace requirements or approval.
 */
export interface WCNamespace {
  /** Required chains (CAIP-2, e.g., ["eip155:1", "eip155:137"]). */
  chains?: string[];
  /** Required methods. */
  methods: string[];
  /** Required events. */
  events: string[];
}

/**
 * Approved namespace with accounts.
 */
export interface WCApprovedNamespace {
  /** Approved accounts (CAIP-10, e.g., ["eip155:1:0x123..."]). */
  accounts: string[];
  /** Approved chains. */
  chains?: string[];
  /** Approved methods. */
  methods: string[];
  /** Approved events. */
  events: string[];
}

/**
 * JSON-RPC request to send through a WC session.
 */
export interface WCRequest {
  /** Session topic. */
  topic: string;
  /** JSON-RPC method (e.g., "personal_sign", "eth_sendTransaction"). */
  method: string;
  /** JSON-RPC parameters. */
  params: unknown;
  /** Chain ID (CAIP-2). */
  chainId: string;
}

/**
 * JSON-RPC response from a WC session.
 */
export interface WCResponse {
  /** Session topic. */
  topic: string;
  /** JSON-RPC method. */
  method: string;
  /** Result data. */
  result?: unknown;
  /** Error data. */
  error?: {
    code: number;
    message: string;
  };
}

/**
 * WC v2 event types.
 */
export type WCEvent =
  | 'session_proposal'
  | 'session_update'
  | 'session_delete'
  | 'session_expire'
  | 'session_request'
  | 'session_request_sent'
  | 'session_event'
  | 'proposal_expire'
  | 'pairing_delete'
  | 'pairing_expire'
  | 'session_ping'
  | 'session_ping_error';

/**
 * Event payloads for WC events.
 */
export interface WCEventPayloads {
  session_proposal: WCSessionProposal;
  session_update: { topic: string; namespaces: Record<string, WCApprovedNamespace> };
  session_delete: { topic: string };
  session_expire: { topic: string };
  session_request: WCRequest;
  session_request_sent: WCRequest;
  session_event: { topic: string; event: { name: string; data: unknown } };
  proposal_expire: { id: number };
  pairing_delete: { topic: string };
  pairing_expire: { topic: string };
  session_ping: { topic: string };
  session_ping_error: { topic: string; error: Error };
}

/* ------------------------------------------------------------------ */
/*  IWalletConnectClient Interface                                     */
/* ------------------------------------------------------------------ */

/**
 * IWalletConnectClient — unified WalletConnect v2 abstraction interface.
 *
 * Platform-specific implementations (iOS, Android, Flutter, TypeScript)
 * must implement this interface to provide WC v2 functionality to the
 * UniversalConnector.
 *
 * @example
 * ```ts
 * // TypeScript / Node.js implementation
 * const wcClient = new WalletConnectClient({
 *   projectId: 'your-project-id',
 *   metadata: {
 *     name: 'My dApp',
 *     description: 'Example dApp',
 *     url: 'https://example.com',
 *     icons: ['https://example.com/icon.png'],
 *   },
 *   relayUrl: 'wss://relay.walletconnect.com',
 * });
 *
 * await wcClient.init();
 * const uri = await wcClient.pair();
 * const session = await wcClient.awaitSessionApproval(uri.topic);
 * ```
 */
export interface IWalletConnectClient {
  /* ── Lifecycle ── */

  /**
   * Initialize the WC client.
   * Must be called before any other operations.
   */
  init(): Promise<void>;

  /**
   * Destroy the WC client and clean up resources.
   */
  destroy(): Promise<void>;

  /**
   * Whether the client is initialized and ready.
   */
  readonly isInitialized: boolean;

  /* ── Pairing ── */

  /**
   * Create a new pairing and return the WC URI.
   *
   * @param optionalNamespaces - Optional namespace requirements to include in the URI.
   * @returns The pairing URI with topic and relay information.
   */
  pair(optionalNamespaces?: Record<string, WCNamespace>): Promise<WCPairingURI>;

  /**
   * Parse a WC URI string into a structured pairing object.
   *
   * @param uri - The WC URI string to parse.
   * @returns Parsed pairing URI object.
   */
  parseUri(uri: string): WCPairingURI;

  /* ── Session Management ── */

  /**
   * Approve a session proposal.
   *
   * @param proposal - The session proposal to approve.
   * @param namespaces - The approved namespaces with accounts.
   * @returns The approved session.
   */
  approveSession(
    proposal: WCSessionProposal,
    namespaces: Record<string, WCApprovedNamespace>,
  ): Promise<WCSession>;

  /**
   * Reject a session proposal.
   *
   * @param proposal - The session proposal to reject.
   * @param reason - Human-readable rejection reason.
   */
  rejectSession(proposal: WCSessionProposal, reason?: string): Promise<void>;

  /**
   * Await session approval from the wallet (after pairing).
   *
   * @param pairingTopic - The pairing topic from a previous pair() call.
   * @param timeout - Timeout in milliseconds (default: 300000 = 5 minutes).
   * @returns The approved session.
   */
  awaitSessionApproval(pairingTopic: string, timeout?: number): Promise<WCSession>;

  /**
   * Update session namespaces.
   *
   * @param topic - Session topic.
   * @param namespaces - Updated namespaces.
   */
  updateSession(
    topic: string,
    namespaces: Record<string, WCApprovedNamespace>,
  ): Promise<void>;

  /**
   * Extend session expiry.
   *
   * @param topic - Session topic.
   */
  extendSession(topic: string): Promise<void>;

  /**
   * Disconnect a session.
   *
   * @param topic - Session topic.
   * @param reason - Human-readable disconnect reason.
   */
  disconnectSession(topic: string, reason?: string): Promise<void>;

  /**
   * Get all active sessions.
   */
  getActiveSessions(): WCSession[];

  /**
   * Get a session by topic.
   *
   * @param topic - Session topic.
   * @returns The session, or undefined if not found.
   */
  getSession(topic: string): WCSession | undefined;

  /* ── Requests ── */

  /**
   * Send a JSON-RPC request through a session.
   *
   * @param request - The request to send.
   * @returns The response from the wallet.
   */
  request(request: WCRequest): Promise<WCResponse>;

  /**
   * Respond to a session request (for wallet-side implementations).
   *
   * @param topic - Session topic.
   * @param response - The response to send.
   */
  respond(topic: string, response: WCResponse): Promise<void>;

  /* ── Events ── */

  /**
   * Register an event listener.
   *
   * @param event - WC event name.
   * @param callback - Event handler.
   */
  on<K extends WCEvent>(event: K, callback: (payload: WCEventPayloads[K]) => void): void;

  /**
   * Remove an event listener.
   *
   * @param event - WC event name.
   * @param callback - Event handler to remove.
   */
  off<K extends WCEvent>(event: K, callback: (payload: WCEventPayloads[K]) => void): void;

  /* ── Utilities ── */

  /**
   * Ping a session to check if it's still alive.
   *
   * @param topic - Session topic.
   * @returns True if the session is alive.
   */
  ping(topic: string): Promise<boolean>;

  /**
   * Emit a session event.
   *
   * @param topic - Session topic.
   * @param event - Event name and data.
   * @param chainId - CAIP-2 chain ID.
   */
  emit(
    topic: string,
    event: { name: string; data: unknown },
    chainId: string,
  ): Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  WalletConnectClientConfig                                          */
/* ------------------------------------------------------------------ */

/**
 * Configuration for initializing a WalletConnectClient.
 */
export interface WalletConnectClientConfig {
  /** WalletConnect Cloud project ID. */
  projectId: string;
  /** dApp metadata for session proposals. */
  metadata: WCPeerMetadata;
  /** Relay server URL (default: "wss://relay.walletconnect.com"). */
  relayUrl?: string;
  /** Required namespaces for session proposals. */
  requiredNamespaces?: Record<string, WCNamespace>;
  /** Optional namespaces for session proposals. */
  optionalNamespaces?: Record<string, WCNamespace>;
  /** Session TTL in seconds (default: 604800 = 7 days). */
  sessionTtl?: number;
}

/* ------------------------------------------------------------------ */
/*  Default Implementation (TypeScript / Node.js)                      */
/* ------------------------------------------------------------------ */

/**
 * Default WalletConnect v2 client implementation for TypeScript/Node.js.
 *
 * This is a reference implementation that can be used directly in web/Node
 * environments, or as a template for platform-specific implementations.
 *
 * In production, this would wrap the @walletconnect/sign-client SDK.
 */
export class WalletConnectClient implements IWalletConnectClient {
  private _initialized = false;
  private _config: WalletConnectClientConfig;
  private _sessions: Map<string, WCSession> = new Map();
  private _eventListeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private _pendingPairings: Map<string, WCPairingURI> = new Map();

  constructor(config: WalletConnectClientConfig) {
    this._config = config;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  async init(): Promise<void> {
    if (this._initialized) return;

    // In production: initialize @walletconnect/sign-client
    // this._client = await SignClient.init({
    //   projectId: this._config.projectId,
    //   metadata: this._config.metadata,
    //   relayUrl: this._config.relayUrl ?? 'wss://relay.walletconnect.com',
    // });

    this._initialized = true;
  }

  async destroy(): Promise<void> {
    this._sessions.clear();
    this._pendingPairings.clear();
    this._eventListeners.clear();
    this._initialized = false;
  }

  async pair(optionalNamespaces?: Record<string, WCNamespace>): Promise<WCPairingURI> {
    this.assertInitialized();

    // In production: use SignClient.core.pairer.create()
    const topic = this.generateTopic();
    const relayUrl = this._config.relayUrl ?? 'wss://relay.walletconnect.com';

    const pairingUri: WCPairingURI = {
      uri: `wc:${topic}@2?relay-protocol=irn&relay-data=${encodeURIComponent(relayUrl)}`,
      topic,
      relayProtocol: 'irn',
    };

    this._pendingPairings.set(topic, pairingUri);
    return pairingUri;
  }

  parseUri(uri: string): WCPairingURI {
    const match = uri.match(/^wc:([^@]+)@(\d+)\?(.+)$/);
    if (!match) {
      throw new Error(`Invalid WC URI: ${uri}`);
    }

    const [, topic, version, params] = match;
    if (version !== '2') {
      throw new Error(`Unsupported WC version: ${version}`);
    }

    const searchParams = new URLSearchParams(params);
    const relayProtocol = searchParams.get('relay-protocol') ?? 'irn';

    return {
      uri,
      topic,
      relayProtocol,
    };
  }

  async approveSession(
    proposal: WCSessionProposal,
    namespaces: Record<string, WCApprovedNamespace>,
  ): Promise<WCSession> {
    this.assertInitialized();

    const session: WCSession = {
      topic: proposal.pairingTopic,
      peer: proposal.proposer.metadata,
      namespaces,
      expiry: Math.floor(Date.now() / 1000) + (this._config.sessionTtl ?? 604800),
      acknowledged: true,
      relayProtocol: proposal.relayProtocol,
    };

    this._sessions.set(session.topic, session);
    return session;
  }

  async rejectSession(proposal: WCSessionProposal, reason?: string): Promise<void> {
    this.assertInitialized();
    // In production: SignClient.reject({ id: proposal.id, reason: ... })
  }

  async awaitSessionApproval(pairingTopic: string, timeout = 300000): Promise<WCSession> {
    this.assertInitialized();

    // In production: listen for session_approve events
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Session approval timed out after ${timeout}ms`));
      }, timeout);

      this.on('session_proposal', (proposal) => {
        clearTimeout(timer);
        // Auto-approve for reference implementation
        const namespaces: Record<string, WCApprovedNamespace> = {};
        for (const [key, ns] of Object.entries(proposal.requiredNamespaces)) {
          namespaces[key] = {
            accounts: [],
            chains: ns.chains,
            methods: ns.methods,
            events: ns.events,
          };
        }
        this.approveSession(proposal, namespaces).then(resolve).catch(reject);
      });
    });
  }

  async updateSession(
    topic: string,
    namespaces: Record<string, WCApprovedNamespace>,
  ): Promise<void> {
    this.assertInitialized();
    const session = this._sessions.get(topic);
    if (!session) throw new Error(`Session not found: ${topic}`);
    session.namespaces = namespaces;
  }

  async extendSession(topic: string): Promise<void> {
    this.assertInitialized();
    const session = this._sessions.get(topic);
    if (!session) throw new Error(`Session not found: ${topic}`);
    session.expiry = Math.floor(Date.now() / 1000) + (this._config.sessionTtl ?? 604800);
  }

  async disconnectSession(topic: string, reason?: string): Promise<void> {
    this.assertInitialized();
    this._sessions.delete(topic);
    this.emitEvent('session_delete', { topic });
  }

  getActiveSessions(): WCSession[] {
    return Array.from(this._sessions.values()).filter(
      (s) => s.expiry > Math.floor(Date.now() / 1000),
    );
  }

  getSession(topic: string): WCSession | undefined {
    return this._sessions.get(topic);
  }

  async request(request: WCRequest): Promise<WCResponse> {
    this.assertInitialized();
    const session = this._sessions.get(request.topic);
    if (!session) throw new Error(`Session not found: ${request.topic}`);

    // In production: SignClient.request(request)
    // For reference implementation, return a placeholder
    return {
      topic: request.topic,
      method: request.method,
      result: null,
    };
  }

  async respond(topic: string, response: WCResponse): Promise<void> {
    this.assertInitialized();
    // In production: SignClient.respond({ topic, response })
  }

  on<K extends WCEvent>(event: K, callback: (payload: WCEventPayloads[K]) => void): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set());
    }
    this._eventListeners.get(event)!.add(callback as (...args: unknown[]) => void);
  }

  off<K extends WCEvent>(event: K, callback: (payload: WCEventPayloads[K]) => void): void {
    this._eventListeners.get(event)?.delete(callback as (...args: unknown[]) => void);
  }

  async ping(topic: string): Promise<boolean> {
    this.assertInitialized();
    // In production: SignClient.ping({ topic })
    return this._sessions.has(topic);
  }

  async emit(
    topic: string,
    event: { name: string; data: unknown },
    chainId: string,
  ): Promise<void> {
    this.assertInitialized();
    // In production: SignClient.emit({ topic, event, chainId })
  }

  /* ── Private ── */

  private assertInitialized(): void {
    if (!this._initialized) {
      throw new Error('WalletConnectClient not initialized. Call init() first.');
    }
  }

  private generateTopic(): string {
    // In production: use crypto.randomUUID() or WC SDK topic generation
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
  }

  private emitEvent(event: string, payload: unknown): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(payload);
        } catch {
          // ignore listener errors
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Adapter Bridge                                                     */
/* ------------------------------------------------------------------ */

/**
 * Bridge between IWalletConnectClient and the UniversalConnector adapter system.
 *
 * Allows chain adapters to use WC v2 for session management and request dispatch
 * without depending on platform-specific implementations.
 */
export class WalletConnectBridge {
  private client: IWalletConnectClient;
  private activeSessionTopic: string | null = null;

  constructor(client: IWalletConnectClient) {
    this.client = client;
  }

  /**
   * Connect via WalletConnect and return the session.
   */
  async connect(
    requiredNamespaces?: Record<string, WCNamespace>,
    timeout?: number,
  ): Promise<WCSession> {
    if (!this.client.isInitialized) {
      await this.client.init();
    }

    const pairing = await this.client.pair(requiredNamespaces);
    const session = await this.client.awaitSessionApproval(pairing.topic, timeout);
    this.activeSessionTopic = session.topic;
    return session;
  }

  /**
   * Disconnect the active WC session.
   */
  async disconnect(reason?: string): Promise<void> {
    if (this.activeSessionTopic) {
      await this.client.disconnectSession(this.activeSessionTopic, reason);
      this.activeSessionTopic = null;
    }
  }

  /**
   * Send a JSON-RPC request through the active session.
   */
  async request(method: string, params: unknown, chainId: string): Promise<WCResponse> {
    if (!this.activeSessionTopic) {
      throw new Error('No active WalletConnect session. Call connect() first.');
    }

    return this.client.request({
      topic: this.activeSessionTopic,
      method,
      params,
      chainId,
    });
  }

  /**
   * Get the active session, if any.
   */
  getActiveSession(): WCSession | undefined {
    if (!this.activeSessionTopic) return undefined;
    return this.client.getSession(this.activeSessionTopic);
  }

  /**
   * Check if there's an active session.
   */
  get isConnected(): boolean {
    return this.activeSessionTopic !== null;
  }
}
