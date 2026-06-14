import type { Connector } from '@cinacoin/core-sdk';
import type {
  HederaConnector,
  HederaPlatform,
  HederaFeature,
  HederaConnectionResult,
  HederaConnectorEvents,
  HederaProvider,
  HederaNetwork,
  HbarTransferParams,
  TokenTransferParams,
  ContractCallParams,
} from './types';
import { ConnectorRegistry } from './types';
import { HashPackConnector, announceHashPackEIP6963 } from './connectors/hashpack';
import { BladeCinacoinor, announceBladeEIP6963 } from './connectors/blade-wallet';
import { KantaraCinacoinor, announceKantaraEIP6963 } from './connectors/kantara-wallet';

/**
 * Hedera Hashgraph chain adapter for Cinacoin.
 *
 * Supports Blade Wallet, HashPack, and Kantara Wallet.
 * Provides HBAR transfers, token transfers, smart contract calls,
 * and standard chain adapter operations.
 *
 * @example
 * ```ts
 * import { HederaAdapter } from '@cinacoin/adapter-hedera';
 *
 * const adapter = new HederaAdapter();
 * adapter.registerConnector(new HashPackConnector());
 * adapter.registerConnector(new BladeCinacoinor());
 * adapter.registerConnector(new KantaraCinacoinor());
 *
 * await adapter.connect();
 * const balance = await adapter.getBalance();
 * const { transactionId } = await adapter.transferHbar({
 *   recipient: '0.0.12345',
 *   amount: '100000000', // 1 HBAR in tinybar
 * });
 * ```
 */
export class HederaAdapter implements HederaConnector {
  readonly id = 'hedera';
  readonly name = 'Hedera Hashgraph';
  readonly icon =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="%23232323"/><text x="16" y="22" text-anchor="middle" font-size="14" fill="white" font-family="sans-serif" font-weight="bold">HBAR</text></svg>';
  readonly platforms: HederaPlatform[] = ['browser', 'mobile', 'extension'];

  private _connector: HederaConnector | null = null;
  private _registry: ConnectorRegistry = new Map();
  private _handlers: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private _coreConnector: Connector | null = null;

  constructor() {
    this._registerBuiltInConnectors();
  }

  // ─── Connector Registry ─────────────────────────────────────────

  private _registerBuiltInConnectors(): void {
    this.registerConnector(new HashPackConnector());
    this.registerConnector(new BladeCinacoinor());
    this.registerConnector(new KantaraCinacoinor());
  }

  /**
   * Register a Hedera connector.
   */
  registerConnector(connector: HederaConnector): void {
    this._registry.set(connector.id, connector);
  }

  /**
   * Get a connector by id.
   */
  getConnector(id: string): HederaConnector | undefined {
    return this._registry.get(id);
  }

  /**
   * Get all registered connectors.
   */
  getAllConnectors(): HederaConnector[] {
    return Array.from(this._registry.values());
  }

  /**
   * Detect which connectors are currently available (wallet installed).
   */
  detectAvailableConnectors(): HederaConnector[] {
    return this.getAllConnectors().filter(c => c.isAvailable());
  }

  /**
   * Get recommended connectors in priority order.
   */
  getRecommendedConnectors(): HederaConnector[] {
    const available = this.detectAvailableConnectors();
    const priority = ['hashpack', 'blade', 'kantara'];
    return priority
      .map(id => available.find(c => c.id === id))
      .filter((c): c is HederaConnector => c !== undefined);
  }

  /**
   * Set the underlying Cinacoin core connector.
   */
  setConnector(connector: Connector): void {
    this._coreConnector = connector;
  }

  // ─── HederaConnector Implementation ─────────────────────────────

  get supportedFeatures(): HederaFeature[] {
    return this._connector?.supportedFeatures ?? [
      'hedera:connect',
      'hedera:signTransaction',
      'hedera:executeTransaction',
      'hedera:getBalance',
      'hedera:transferHbar',
      'hedera:transferToken',
      'hedera:contractCall',
    ];
  }

  /**
   * Connect via the best available connector.
   * Optionally specify a connector id to use a specific wallet.
   */
  async connect(params?: {
    connectorId?: string;
    network?: HederaNetwork;
  }): Promise<HederaConnectionResult> {
    let connector: HederaConnector;

    if (params?.connectorId) {
      const c = this.getConnector(params.connectorId);
      if (!c) {
        throw new Error(`Connector "${params.connectorId}" not found`);
      }
      connector = c;
    } else {
      const recommended = this.getRecommendedConnectors();
      if (recommended.length === 0) {
        throw new Error(
          'No Hedera wallet found. Install HashPack, Blade, or Kantara Wallet.'
        );
      }
      connector = recommended[0];
    }

    const result = await connector.connect({ network: params?.network });
    this._connector = connector;

    // Forward connector events through this adapter
    connector.on('accountsChanged', (accounts) => {
      const handlers = this._handlers.get('accountsChanged') ?? new Set();
      for (const handler of handlers) {
        handler(accounts);
      }
    });

    connector.on('networkChanged', (network) => {
      const handlers = this._handlers.get('networkChanged') ?? new Set();
      for (const handler of handlers) {
        handler(network);
      }
    });

    connector.on('disconnect', (error) => {
      this._connector = null;
      const handlers = this._handlers.get('disconnect') ?? new Set();
      for (const handler of handlers) {
        handler(error);
      }
    });

    return result;
  }

  async disconnect(): Promise<void> {
    if (this._connector) {
      await this._connector.disconnect();
      this._connector = null;
    }
  }

  async request<T = unknown>(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }): Promise<T> {
    const connector = this._getConnectorOrThrow();
    return connector.request(args);
  }

  async getAccounts(): Promise<string[]> {
    const connector = this._getConnectorOrThrow();
    return connector.getAccounts();
  }

  async getNetwork(): Promise<HederaNetwork> {
    const connector = this._getConnectorOrThrow();
    return connector.getNetwork();
  }

  async switchNetwork(network: HederaNetwork): Promise<void> {
    const connector = this._getConnectorOrThrow();
    await connector.switchNetwork(network);
  }

  isAvailable(): boolean {
    return this.detectAvailableConnectors().length > 0;
  }

  async signTransaction(params: {
    transaction: string;
  }): Promise<{ signedTransaction: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.signTransaction(params);
  }

  async executeTransaction(params: {
    transaction: string;
  }): Promise<{ transactionId: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.executeTransaction(params);
  }

  async getBalance(accountId?: string): Promise<{ balance: string; unit: 'tinybar' }> {
    const connector = this._getConnectorOrThrow();
    return connector.getBalance(accountId);
  }

  async transferHbar(params: HbarTransferParams): Promise<{ transactionId: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.transferHbar(params);
  }

  async transferToken(params: TokenTransferParams): Promise<{ transactionId: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.transferToken(params);
  }

  async contractCall(params: ContractCallParams): Promise<{ transactionId: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.contractCall(params);
  }

  // ─── Events ──────────────────────────────────────────────────────

  on<E extends keyof HederaConnectorEvents>(
    event: E,
    handler: HederaConnectorEvents[E]
  ): void;
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event)!.add(handler);
  }

  off<E extends keyof HederaConnectorEvents>(
    event: E,
    handler: HederaConnectorEvents[E]
  ): void;
  off(event: string, handler: (...args: unknown[]) => void): void {
    this._handlers.get(event)?.delete(handler);
  }

  // ─── Internal ────────────────────────────────────────────────────

  private _getConnectorOrThrow(): HederaConnector {
    if (!this._connector) {
      throw new Error('No Hedera wallet connected. Call connect() first.');
    }
    return this._connector;
  }

  // ─── Real RPC Execution ─────────────────────────────────────────

  /**
   * Submit a signed transaction via Hedera JSON-RPC relay.
   */
  async submitViaRpc(
    relayUrl: string,
    signedTxHex: string,
  ): Promise<import('./services/hedera-ops.js').HederaSubmitResult> {
    const { submitViaRpc } = await import('./services/hedera-ops.js');
    return submitViaRpc(relayUrl, signedTxHex);
  }

  /**
   * Prepare an HBAR transfer for signing via relay.
   */
  async prepareHbarTransferViaRpc(
    relayUrl: string,
    from: string,
    to: string,
    amountTinybar: string,
    memo?: string,
  ): Promise<import('./services/hedera-ops.js').HederaSubmitResult> {
    const { submitHbarTransferViaRpc } = await import('./services/hedera-ops.js');
    return submitHbarTransferViaRpc(relayUrl, from, to, amountTinybar, memo);
  }

  /**
   * Prepare an HTS token transfer for signing via relay.
   */
  async prepareTokenTransferViaRpc(
    relayUrl: string,
    from: string,
    to: string,
    tokenId: string,
    amount: string,
  ): Promise<import('./services/hedera-ops.js').HederaSubmitResult> {
    const { submitTokenTransferViaRpc } = await import('./services/hedera-ops.js');
    return submitTokenTransferViaRpc(relayUrl, from, to, tokenId, amount);
  }

  /**
   * Prepare a smart contract call for signing via relay.
   */
  async prepareContractCallViaRpc(
    relayUrl: string,
    contractId: string,
    functionParameters: string,
    gas: number,
    amount?: string,
  ): Promise<import('./services/hedera-ops.js').HederaSubmitResult> {
    const { submitContractCallViaRpc } = await import('./services/hedera-ops.js');
    return submitContractCallViaRpc(relayUrl, contractId, functionParameters, gas, amount);
  }

  /**
   * Get account balance via mirror node REST API.
   */
  async getBalanceViaMirror(
    accountId: string,
    network: import('./services/hedera-ops.js').HederaNetwork = 'mainnet',
  ): Promise<{ balance: string; tokens: Array<{ tokenId: string; balance: string }> }> {
    const { HEDERA_NETWORKS, getBalanceViaMirror } = await import('./services/hedera-ops.js');
    const mirrorUrl = HEDERA_NETWORKS[network].mirrorNodeUrl;
    return getBalanceViaMirror(mirrorUrl, accountId);
  }

  /**
   * Get token info via mirror node REST API.
   */
  async getTokenInfoViaMirror(
    tokenId: string,
    network: import('./services/hedera-ops.js').HederaNetwork = 'mainnet',
  ): Promise<{
    tokenId: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    const { HEDERA_NETWORKS, getTokenInfoViaMirror } = await import('./services/hedera-ops.js');
    const mirrorUrl = HEDERA_NETWORKS[network].mirrorNodeUrl;
    return getTokenInfoViaMirror(mirrorUrl, tokenId);
  }

  /**
   * Get transaction history via mirror node REST API.
   */
  async getTransactionHistoryViaMirror(
    accountId: string,
    network: import('./services/hedera-ops.js').HederaNetwork = 'mainnet',
    limit: number = 10,
  ): Promise<{
    transactions: Array<{
      transaction_id: string;
      name: string;
      consensus_timestamp: string;
    }>;
  }> {
    const { HEDERA_NETWORKS, getTransactionHistoryViaMirror } = await import('./services/hedera-ops.js');
    const mirrorUrl = HEDERA_NETWORKS[network].mirrorNodeUrl;
    return getTransactionHistoryViaMirror(mirrorUrl, accountId, limit);
  }
}

/**
 * Announce all registered Hedera providers via EIP-6963.
 * Call this during application bootstrap.
 */
export function announceHederaProviders(): void {
  announceHashPackEIP6963();
  announceBladeEIP6963();
  announceKantaraEIP6963();
}
