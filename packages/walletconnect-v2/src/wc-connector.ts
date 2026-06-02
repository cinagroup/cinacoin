/**
 * WalletConnect v2 Connector for Cinacoin Core SDK.
 *
 * Bridges the WalletConnect v2 protocol to the core-sdk Connector
 * interface, allowing the WC v2 client to be used interchangeably
 * with other connectors (injected, QR, etc.).
 *
 * Integrates:
 * - CloudRelay transport (relay.walletconnect.com)
 * - MultiSessionManager (multi-session support)
 * - SessionStore (persistence)
 * - NonceManager (replay protection)
 * - Signature verification
 *
 * @packageDocumentation
 */

import { Connector } from '@cinacoin/core-sdk';
import type {
  ConnectParams,
  ConnectionResult,
  TransactionRequest,
  AppMetadata,
} from '@cinacoin/core-sdk';
import { MultiSessionManager } from './multi-session-manager.js';
import type { MultiSessionManagerConfig, ManagedSession } from './multi-session-manager.js';
import { SessionStore } from './session-store.js';
import { NonceManager } from './signature-verification.js';
import { parseWcUri, isValidWcUri } from './pairing.js';

// ============================================================
// WC Connector Configuration
// ============================================================

/** Configuration for WcConnector. */
export interface WcConnectorConfig extends Partial<MultiSessionManagerConfig> {
  /** dApp metadata (required). */
  metadata: AppMetadata;
  /** Project ID for WalletConnect Cloud relay. */
  projectId?: string;
  /** Chains to request (CAIP-2 format). */
  chains?: string[];
  /** Methods to request (defaults to standard EVM methods). */
  methods?: string[];
  /** Events to subscribe to (defaults to standard EVM events). */
  events?: string[];
  /** Session TTL in seconds (default: 7 days). */
  sessionTtl?: number;
  /** Relay URL override. */
  relayUrl?: string;
  /** Auto-restore sessions on creation. */
  autoRestore?: boolean;
}

// ============================================================
// WcConnector
// ============================================================

/**
 * WalletConnect v2 connector for the Cinacoin Core SDK.
 *
 * Implements the Connector interface, providing a unified API
 * for wallet connection via WalletConnect v2.
 *
 * Features:
 * - QR code / URI-based pairing
 * - Deep link support for mobile wallets
 * - Session persistence and restoration
 * - Multi-session management
 * - Replay attack protection
 * - Signature verification
 *
 * @example
 * ```ts
 * const connector = new WcConnector({
 *   projectId: 'your_project_id',
 *   metadata: {
 *     name: 'My dApp',
 *     description: 'A great dApp',
 *     url: 'https://mydapp.com',
 *     icons: ['https://mydapp.com/icon.png'],
 *   },
 *   chains: ['eip155:1', 'eip155:137'],
 * });
 *
 * // Create pairing and display QR code
 * const uri = await connector.connect();
 * console.log(uri); // wc:abc123...@2?...
 *
 * // Or connect from a scanned URI
 * const result = await connector.connect({ uri: 'wc:...' });
 * console.log(result.accounts);
 * ```
 */
export class WcConnector extends Connector {
  /** Connector identifier. */
  readonly id = 'walletconnect-v2';

  /** Human-readable name. */
  readonly name = 'WalletConnect v2';

  /** Connector icon. */
  readonly icon = 'https://walletconnect.com/walletconnect-icon.png';

  /** Whether the connector is installed (always true for WC v2). */
  readonly installed = true;

  /** Connection type. */
  readonly type = 'walletconnect';

  private config: WcConnectorConfig;
  private manager: MultiSessionManager;
  private store: SessionStore;
  private nonceManager: NonceManager;
  private _connected = false;

  constructor(config: WcConnectorConfig) {
    super();
    this.config = config;
    this.store = new SessionStore();
    this.nonceManager = new NonceManager();

    this.manager = new MultiSessionManager({
      metadata: config.metadata,
      projectId: config.projectId,
      chains: config.chains,
      methods: config.methods,
      events: config.events,
      sessionTtl: config.sessionTtl,
      relayUrl: config.relayUrl,
      fallbackRelayUrls: config.fallbackRelayUrls,
      store: this.store,
    });

    // Forward events from the manager
    this.manager.on('stateChange', (state: unknown) => {
      this.emit('stateChange', state);
    });
    this.manager.on('wcEvent', (event: unknown) => {
      this.emit('wcEvent', event);

      // Track connection state
      if (event && typeof event === 'object' && 'type' in event) {
        const typed = event as { type: string };
        if (typed.type === 'connected') {
          this._connected = true;
        } else if (typed.type === 'disconnected' || typed.type === 'session_delete') {
          this._connected = false;
        }
      }
    });

    // Auto-restore sessions if configured
    if (config.autoRestore !== false) {
      this.restore().catch(() => {});
    }
  }

  // ============================================================
  // Connector Interface
  // ============================================================

  /**
   * Connect to a wallet via WalletConnect v2.
   *
   * If no URI is provided, creates a new pairing and returns
   * the WC URI (for QR code display). The session will be
   * established when the wallet scans and approves.
   *
   * If a URI is provided (e.g., from a scanned QR code),
   * connects immediately and returns the ConnectionResult.
   *
   * @param params - Optional connection parameters.
   * @returns WC URI string or ConnectionResult.
   */
  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    // Initialize relay
    await this.manager.init();

    if (params?.uri && isValidWcUri(params.uri)) {
      // Connect via existing URI
      const session = await this.manager.connectUri(params.uri);
      this._connected = true;

      return {
        sessionId: session.topic,
        accounts: session.accounts,
        chainId: this.parseChainId(session),
        connectorId: this.id,
      };
    }

    // Create new pairing — return the URI
    const uri = await this.manager.createPairing();

    // The connection will complete asynchronously when the wallet approves
    // The caller should listen for 'wcEvent' with type 'connected'
    // or await manager.waitForSession()
    this.emit('pairing_created', { uri });

    // Return a ConnectionResult-like object with the pairing URI
    // The actual accounts will be available after the session is established
    return {
      sessionId: parseWcUri(uri).topic,
      accounts: [],
      chainId: parseInt(this.config.chains?.[0]?.split(':')[1] ?? '1'),
      connectorId: this.id,
    };
  }

  /**
   * Disconnect from the current session(s).
   */
  async disconnect(): Promise<void> {
    await this.manager.disconnect();
    this._connected = false;
    this.emit('disconnected');
  }

  /**
   * Get the connected account addresses.
   *
   * Returns accounts from the active session.
   */
  async getAccounts(): Promise<string[]> {
    const session = this.manager.getActiveSession();
    return session?.accounts ?? [];
  }

  /**
   * Get the current chain ID from the active session.
   */
  async getChainId(): Promise<number> {
    const session = this.manager.getActiveSession();
    if (!session) {
      throw new Error('No active session');
    }
    return this.parseChainId(session);
  }

  /**
   * Switch to a different chain.
   *
   * Sends a wallet_switchEthereumChain request to the wallet.
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: number): Promise<void> {
    const session = this.manager.getActiveSession();
    if (!session) {
      throw new Error('No active session');
    }

    await this.manager.request('wallet_switchEthereumChain', [
      { chainId: '0x' + chainId.toString(16) },
    ]);
  }

  /**
   * Sign a message with the connected account.
   *
   * Uses personal_sign (EIP-191) for message signing.
   *
   * @param message - Message to sign.
   * @returns Signature as a hex string.
   */
  async signMessage(message: string): Promise<string> {
    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No connected account');
    }

    // Generate a nonce for replay protection
    const nonce = this.nonceManager.generate();
    const messageWithNonce = `${message}\n\nNonce: ${nonce}`;

    const result = await this.manager.request<string>('personal_sign', [
      message.startsWith('0x') ? message : '0x' + Array.from(new TextEncoder().encode(messageWithNonce))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      accounts[0],
    ]);

    // Mark nonce as used
    this.nonceManager.consume(nonce);

    return result;
  }

  /**
   * Sign a transaction.
   *
   * Sends an eth_sendTransaction request to the wallet.
   *
   * @param tx - Transaction request.
   * @returns Transaction hash as a hex string.
   */
  async signTransaction(tx: TransactionRequest): Promise<string> {
    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No connected account');
    }

    return this.manager.request<string>('eth_sendTransaction', [{
      from: accounts[0],
      to: tx.to,
      value: tx.value ?? '0x0',
      data: tx.data ?? '0x',
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chainId: tx.chainId,
    }]);
  }

  // ============================================================
  // WC-Specific Methods
  // ============================================================

  /**
   * Restore persisted sessions.
   *
   * Loads sessions from localStorage, reconnects to the relay,
   * and re-subscribes to session topics.
   */
  async restore(): Promise<ConnectionResult | null> {
    const sessions = await this.manager.restore();

    if (sessions.length > 0) {
      this._connected = true;
      const latest = sessions[sessions.length - 1];
      return {
        sessionId: latest.topic,
        accounts: latest.accounts,
        chainId: this.parseChainId(latest),
        connectorId: this.id,
      };
    }

    return null;
  }

  /**
   * Get all active sessions.
   */
  getSessions() {
    return this.manager.getSessions();
  }

  /**
   * Get the active session.
   */
  getActiveSession() {
    return this.manager.getActiveSession();
  }

  /**
   * Set the active session by topic.
   */
  setActiveSession(topic: string): boolean {
    return this.manager.setActiveSession(topic);
  }

  /**
   * Whether there's an active connection.
   */
  isConnected(): boolean {
    return this._connected && this.manager.isConnected();
  }

  /**
   * Send a raw JSON-RPC request.
   */
  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    return this.manager.request<T>(method, params);
  }

  /**
   * Send a request to a specific session.
   */
  async requestTo<T = unknown>(topic: string, method: string, params?: unknown): Promise<T> {
    return this.manager.requestTo<T>(topic, method, params);
  }

  /**
   * Wait for a session to be established (after createPairing).
   *
   * @param timeoutMs - Timeout in milliseconds (default: 5 minutes).
   * @returns ConnectionResult when the session is established.
   */
  async waitForSession(timeoutMs?: number): Promise<ConnectionResult> {
    const session = await this.manager.waitForSession(timeoutMs);
    this._connected = true;

    return {
      sessionId: session.topic,
      accounts: session.accounts,
      chainId: this.parseChainId(session),
      connectorId: this.id,
    };
  }

  /**
   * Get the pairing URI (after connect() is called).
   * This is a convenience method that returns the URI from the last
   * connect() call.
   */
  async getPairingUri(): Promise<string> {
    return this.manager.createPairing();
  }

  /**
   * Clean up expired sessions and nonces.
   */
  cleanup(): void {
    this.manager.cleanupExpiredSessions();
    this.nonceManager.cleanup();
    this.store.fullCleanup();
  }

  /**
   * Get the nonce manager for custom nonce operations.
   */
  getNonceManager(): NonceManager {
    return this.nonceManager;
  }

  /**
   * Get the session store for direct access.
   */
  getStore(): SessionStore {
    return this.store;
  }

  /**
   * Get the multi-session manager for advanced operations.
   */
  getManager(): MultiSessionManager {
    return this.manager;
  }

  /**
   * Generate an authentication challenge message.
   */
  generateAuthChallenge(address?: string): string | null {
    const accounts = this.manager.getActiveSession()?.accounts;
    const addr = address ?? accounts?.[0];
    if (!addr) return null;

    const nonce = this.nonceManager.generate();
    this.nonceManager.attachMetadata(nonce, { address: addr, purpose: 'auth' });

    const domain = this.config.metadata.url.replace(/^https?:\/\//, '');
    return [
      `${this.config.metadata.name} wants you to sign in with your Ethereum account:`,
      addr,
      '',
      this.config.metadata.description || 'Sign in with Ethereum to the app.',
      '',
      `URI: ${this.config.metadata.url}`,
      `Version: 1`,
      `Chain ID: 1`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date().toISOString()}`,
    ].join('\n');
  }

  // ============================================================
  // Internal Helpers
  // ============================================================

  /** Parse the chain ID from a session's accounts. */
  private parseChainId(session: { accounts: string[] }): number {
    if (session.accounts.length === 0) {
      return parseInt(this.config.chains?.[0]?.split(':')[1] ?? '1');
    }

    // CAIP-10 format: chainId:address
    // For EVM: eip155:1:0x...
    const account = session.accounts[0];
    const parts = account.split(':');
    if (parts.length >= 2) {
      const chainRef = parts[1]; // The chain reference (e.g., '1' from 'eip155:1')
      const parsed = parseInt(chainRef, 10);
      if (!isNaN(parsed)) return parsed;
    }

    return parseInt(this.config.chains?.[0]?.split(':')[1] ?? '1');
  }
}
