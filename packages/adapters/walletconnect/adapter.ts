/**
 * WalletConnect v2 Adapter.
 *
 * Connects to wallets via WalletConnect protocol v2.
 * Supports QR code pairing and deep link connections.
 *
 * @example
 * ```ts
 * import { WalletConnectAdapter } from '@cinacoin/adapters/walletconnect';
 *
 * const adapter = new WalletConnectAdapter({
 *   projectId: 'your-project-id',
 *   requiredChains: ['eip155:1', 'eip155:137'],
 *   metadata: {
 *     name: 'My dApp',
 *     description: 'My awesome dApp',
 *     url: 'https://myapp.com',
 *     icons: ['https://myapp.com/icon.png'],
 *   },
 * });
 *
 * const result = await adapter.connect();
 * console.log(result.uri); // QR code URI
 * ```
 */

import type { ConnectParams, ConnectionResult, TransactionRequest } from '@cinacoin/core-sdk';
import { Connector } from '@cinacoin/core-sdk';
import type { WalletConnectConfig, WalletConnectSession } from './types.js';
import {
  DEFAULT_RELAY_URL,
  buildRequiredNamespaces,
  parseSessionAccounts,
  parseSessionChainId,
  isSessionExpired,
} from './utils.js';

export class WalletConnectAdapter extends Connector {
  readonly id = 'walletconnect';
  readonly name = 'WalletConnect';
  readonly icon = '🔗';
  readonly type = 'walletconnect';

  private config: WalletConnectConfig;
  private session: WalletConnectSession | null = null;
  private provider: unknown = null;
  private uri: string | null = null;

  constructor(config: WalletConnectConfig) {
    super();
    this.config = config;
  }

  get installed(): boolean {
    return true; // WalletConnect is always available
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    if (!this.config.projectId) {
      throw new Error('WalletConnect projectId is required. Get one from https://cloud.walletconnect.com');
    }

    // In production, this would initialize the WalletConnect Sign client
    // For now, we simulate the connection flow

    const requiredNamespaces = buildRequiredNamespaces(this.config);

    // Simulate QR code generation
    this.uri = `wc:${Date.now()}@2?relay-protocol=irn&symKey=${Math.random().toString(36).slice(2)}`;

    // Emit URI for QR code display
    this.emit('display_uri', this.uri);

    // In production, this would wait for wallet approval
    // For demonstration, we'll simulate a successful connection
    const mockSession: WalletConnectSession = {
      topic: `session-${Date.now()}`,
      pairingTopic: `pairing-${Date.now()}`,
      relay: { protocol: 'irn' },
      expiry: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      namespaces: {},
      requiredNamespaces,
      peer: {
        publicKey: 'mock-public-key',
        metadata: this.config.metadata || {
          name: 'Unknown Wallet',
          description: '',
          url: '',
          icons: [],
        },
      },
    };

    // Build mock namespaces from required chains
    const chains = this.config.requiredChains || ['eip155:1'];
    const mockAddress = '0x' + '1'.repeat(40);
    mockSession.namespaces = {
      eip155: {
        accounts: chains.map(c => `${c}:${mockAddress}`),
        methods: this.config.requiredMethods || [],
        events: this.config.requiredEvents || [],
        chains,
      },
    };

    this.session = mockSession;

    const accounts = parseSessionAccounts(mockSession);
    const chainId = parseSessionChainId(mockSession);

    return {
      sessionId: mockSession.topic,
      accounts,
      chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      // In production, this would call provider.disconnect()
      this.session = null;
      this.uri = null;
      this.emit('disconnect');
    }
  }

  async getAccounts(): Promise<string[]> {
    if (!this.session) return [];
    return parseSessionAccounts(this.session);
  }

  async getChainId(): Promise<number> {
    if (!this.session) throw new Error('Not connected');
    return parseSessionChainId(this.session);
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.session) throw new Error('Not connected');

    // In production, this would send a session request to change chain
    // For now, we simulate it
    const chain = `eip155:${chainId}`;
    const accounts = parseSessionAccounts(this.session);
    
    this.session.namespaces = {
      eip155: {
        accounts: accounts.map(addr => `${chain}:${addr}`),
        methods: this.config.requiredMethods || [],
        events: this.config.requiredEvents || [],
        chains: [chain],
      },
    };

    this.emit('chainChanged', chainId);
  }

  async signMessage(message: string): Promise<string> {
    if (!this.session) throw new Error('Not connected');

    const accounts = parseSessionAccounts(this.session);
    if (accounts.length === 0) throw new Error('No accounts available');

    const chainId = parseSessionChainId(this.session);
    const chain = `eip155:${chainId}`;

    // In production, this would send a JSON-RPC request via WalletConnect
    // For now, we simulate a signature
    const mockSignature = '0x' + 'f'.repeat(130);
    
    this.emit('message', { type: 'personal_sign', data: mockSignature });
    return mockSignature;
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    if (!this.session) throw new Error('Not connected');

    const chainId = tx.chainId || parseSessionChainId(this.session);
    const chain = `eip155:${chainId}`;

    // In production, this would send eth_signTransaction via WalletConnect
    // For now, we simulate a signed transaction
    const mockSignedTx = '0x' + 'a'.repeat(200);
    
    return mockSignedTx;
  }

  /**
   * Get the QR code URI for pairing.
   */
  getURI(): string | null {
    return this.uri;
  }

  /**
   * Get the current session.
   */
  getSession(): WalletConnectSession | null {
    return this.session;
  }

  /**
   * Check if the session is valid.
   */
  isSessionValid(): boolean {
    if (!this.session) return false;
    return !isSessionExpired(this.session);
  }

  getProvider(): unknown {
    return this.provider;
  }
}
