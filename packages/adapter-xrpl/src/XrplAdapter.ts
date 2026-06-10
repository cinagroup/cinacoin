import type { Connector } from '@cinacoin/core-sdk';
import type {
  XrplConnector,
  XrplPlatform,
  XrplFeature,
  XrplConnectionResult,
  XrplConnectorEvents,
  XrplProvider,
  XrplNetwork,
  XrpSendParams,
  AccountSettingsParams,
  TrustLineParams,
  NftMintParams,
  NftBurnParams,
} from './types';
import { XrplConnectorRegistry } from './types';
import { XamanConnector, announceXamanEIP6963 } from './connectors/xaman';

/**
 * XRP Ledger chain adapter for Cinacoin.
 *
 * Supports Xaman (formerly Xumm), Fireblocks, and Ledger.
 * Provides XRP transfers, account settings, trust lines,
 * and NFT minting/burning.
 *
 * @example
 * ```ts
 * import { XrplAdapter, XamanConnector, announceXrplProviders } from '@cinacoin/adapter-xrpl';
 *
 * // Announce providers for EIP-6963 discovery
 * announceXrplProviders();
 *
 * // Use the adapter directly
 * const adapter = new XrplAdapter();
 * const result = await adapter.connect({ connectorId: 'xaman' });
 * const { transactionHash } = await adapter.sendXRP({
 *   destination: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH',
 *   amount: '1000000', // 1 XRP in drops
 * });
 *
 * // Or use individual connectors
 * const xaman = new XamanConnector();
 * if (xaman.isAvailable()) {
 *   await xaman.connect();
 * }
 * ```
 */
export class XrplAdapter implements XrplConnector {
  readonly id = 'xrpl';
  readonly name = 'XRP Ledger';
  readonly icon =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="%23000"/><text x="16" y="22" text-anchor="middle" font-size="12" fill="white" font-family="sans-serif" font-weight="bold">XRP</text></svg>';
  readonly platforms: XrplPlatform[] = ['browser', 'mobile', 'extension', 'hardware'];

  private _connector: XrplConnector | null = null;
  private _registry: XrplConnectorRegistry = new Map();
  private _handlers: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private _coreConnector: Connector | null = null;

  constructor() {
    this._registerBuiltInConnectors();
  }

  // ─── Connector Registry ─────────────────────────────────────────

  private _registerBuiltInConnectors(): void {
    this.registerConnector(new XamanConnector());
    // Fireblocks and Ledger connectors would be registered here
    // when their implementations are added:
    // this.registerConnector(new FireblocksXrplConnector());
    // this.registerConnector(new LedgerXrplConnector());
  }

  /**
   * Register an XRPL connector.
   */
  registerConnector(connector: XrplConnector): void {
    this._registry.set(connector.id, connector);
  }

  /**
   * Get a connector by id.
   */
  getConnector(id: string): XrplConnector | undefined {
    return this._registry.get(id);
  }

  /**
   * Get all registered connectors.
   */
  getAllConnectors(): XrplConnector[] {
    return Array.from(this._registry.values());
  }

  /**
   * Detect which connectors are currently available (wallet installed).
   */
  detectAvailableConnectors(): XrplConnector[] {
    return this.getAllConnectors().filter(c => c.isAvailable());
  }

  /**
   * Get recommended connectors in priority order.
   */
  getRecommendedConnectors(): XrplConnector[] {
    const available = this.detectAvailableConnectors();
    const priority = ['xaman', 'fireblocks', 'ledger'];
    return priority
      .map(id => available.find(c => c.id === id))
      .filter((c): c is XrplConnector => c !== undefined);
  }

  /**
   * Set the underlying Cinacoin core connector.
   */
  setConnector(connector: Connector): void {
    this._coreConnector = connector;
  }

  // ─── XrplConnector Implementation ───────────────────────────────

  get supportedFeatures(): XrplFeature[] {
    return this._connector?.supportedFeatures ?? [
      'xrpl:connect',
      'xrpl:signTransaction',
      'xrpl:sendXRP',
      'xrpl:getBalance',
      'xrpl:accountSettings',
      'xrpl:trustLine',
      'xrpl:nftMint',
      'xrpl:nftBurn',
      'xrpl:signMessage',
    ];
  }

  /**
   * Connect via the best available connector.
   * Optionally specify a connector id to use a specific wallet.
   */
  async connect(params?: {
    connectorId?: string;
    network?: XrplNetwork;
  }): Promise<XrplConnectionResult> {
    let connector: XrplConnector;

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
          'No XRPL wallet found. Install Xaman Wallet or connect a Ledger.'
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

  async getNetwork(): Promise<XrplNetwork> {
    const connector = this._getConnectorOrThrow();
    return connector.getNetwork();
  }

  async switchNetwork(network: XrplNetwork): Promise<void> {
    const connector = this._getConnectorOrThrow();
    await connector.switchNetwork(network);
  }

  isAvailable(): boolean {
    return this.detectAvailableConnectors().length > 0;
  }

  async signTransaction(params: {
    transaction: Record<string, unknown>;
  }): Promise<{ signedTransaction: Record<string, unknown>; txBlob: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.signTransaction(params);
  }

  async sendXRP(params: XrpSendParams): Promise<{ transactionHash: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.sendXRP(params);
  }

  async getBalance(address?: string): Promise<{ balance: string; unit: 'drops' }> {
    const connector = this._getConnectorOrThrow();
    return connector.getBalance(address);
  }

  async updateAccountSettings(params: AccountSettingsParams): Promise<{ transactionHash: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.updateAccountSettings(params);
  }

  async setTrustLine(params: TrustLineParams): Promise<{ transactionHash: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.setTrustLine(params);
  }

  async mintNFT(params: NftMintParams): Promise<{ nftId: string; transactionHash: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.mintNFT(params);
  }

  async burnNFT(params: NftBurnParams): Promise<{ transactionHash: string }> {
    const connector = this._getConnectorOrThrow();
    return connector.burnNFT(params);
  }

  // ─── Events ──────────────────────────────────────────────────────

  on<E extends keyof XrplConnectorEvents>(
    event: E,
    handler: XrplConnectorEvents[E]
  ): void;
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event)!.add(handler);
  }

  off<E extends keyof XrplConnectorEvents>(
    event: E,
    handler: XrplConnectorEvents[E]
  ): void;
  off(event: string, handler: (...args: unknown[]) => void): void {
    this._handlers.get(event)?.delete(handler);
  }

  // ─── Internal ────────────────────────────────────────────────────

  private _getConnectorOrThrow(): XrplConnector {
    if (!this._connector) {
      throw new Error('No XRPL wallet connected. Call connect() first.');
    }
    return this._connector;
  }

  // ─── Real RPC Execution ─────────────────────────────────────────

  /**
   * Submit a signed transaction via `submit` RPC.
   */
  async submitViaRpc(
    network: import('./types.js').XrplNetwork,
    txBlob: string,
  ): Promise<import('./services/xrpl-ops.js').XrplSubmitResult> {
    const { submitViaRpc } = await import('./services/xrpl-ops.js');
    return submitViaRpc(network, txBlob);
  }

  /**
   * Prepare a Payment transaction via RPC (builds unsigned tx ready for signing).
   */
  async preparePaymentViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
    destination: string,
    amountDrops: string,
    destinationTag?: number,
    memo?: string,
  ): Promise<{ txJson: import('./services/xrpl-ops.js').XrplTransaction; sequence: number; fee: string; lastLedgerSequence: number }> {
    const { preparePaymentViaRpc } = await import('./services/xrpl-ops.js');
    return preparePaymentViaRpc(network, account, destination, amountDrops, destinationTag, memo);
  }

  /**
   * Prepare a TrustSet transaction via RPC (Trust Line management).
   */
  async prepareTrustSetViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
    issuer: string,
    currency: string,
    limit: string,
    flags?: number,
  ): Promise<{ txJson: import('./services/xrpl-ops.js').XrplTransaction; sequence: number; fee: string; lastLedgerSequence: number }> {
    const { prepareTrustSetViaRpc } = await import('./services/xrpl-ops.js');
    return prepareTrustSetViaRpc(network, account, issuer, currency, limit, flags);
  }

  /**
   * Prepare an OfferCreate transaction via RPC (DEX order placement).
   */
  async prepareOfferCreateViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
    takerPays: string | { value: string; currency: string; issuer: string },
    takerGets: string | { value: string; currency: string; issuer: string },
    expiration?: number,
    flags?: number,
  ): Promise<{ txJson: import('./services/xrpl-ops.js').XrplTransaction; sequence: number; fee: string; lastLedgerSequence: number }> {
    const { prepareOfferCreateViaRpc } = await import('./services/xrpl-ops.js');
    return prepareOfferCreateViaRpc(network, account, takerPays, takerGets, expiration, flags);
  }

  /**
   * Query order book via `book_offers` RPC.
   */
  async getOrderBookViaRpc(
    network: import('./types.js').XrplNetwork,
    gets: { currency: string; issuer?: string },
    pays: { currency: string; issuer?: string },
    limit?: number,
  ): Promise<{
    offers: Array<{
      Account: string;
      BookDirectory: string;
      TakerGets: string | { value: string; currency: string; issuer: string };
      TakerPays: string | { value: string; currency: string; issuer: string };
      Sequence: number;
    }>;
  }> {
    const { getOrderBookViaRpc } = await import('./services/xrpl-ops.js');
    return getOrderBookViaRpc(network, gets, pays, limit);
  }

  /**
   * Get account info via `account_info` RPC.
   */
  async getAccountInfoViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
  ): Promise<{ sequence: number; xrpBalance: string; ownerCount: number; flags: number }> {
    const { getAccountInfoViaRpc } = await import('./services/xrpl-ops.js');
    return getAccountInfoViaRpc(network, account);
  }

  /**
   * Get account trust lines via `account_lines` RPC.
   */
  async getTrustLinesViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
    peerAccount?: string,
    limit?: number,
  ): Promise<{
    lines: Array<{
      account: string; balance: string; limit: string; limit_peer: string; currency: string;
    }>;
  }> {
    const { getTrustLinesViaRpc } = await import('./services/xrpl-ops.js');
    return getTrustLinesViaRpc(network, account, peerAccount, limit);
  }

  /**
   * Get account offers via `account_offers` RPC.
   */
  async getAccountOffersViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
    limit?: number,
  ): Promise<{
    offers: Array<{
      flags: number; seq: number;
      taker_gets: string | { value: string; currency: string; issuer: string };
      taker_pays: string | { value: string; currency: string; issuer: string };
    }>;
  }> {
    const { getAccountOffersViaRpc } = await import('./services/xrpl-ops.js');
    return getAccountOffersViaRpc(network, account, limit);
  }

  /**
   * Get server info via `server_info` RPC.
   */
  async getServerInfoViaRpc(
    network: import('./types.js').XrplNetwork,
  ): Promise<{
    info: { validated_ledger: { seq: number; hash: string }; server_state: string; uptime: number };
  }> {
    const { getServerInfoViaRpc } = await import('./services/xrpl-ops.js');
    return getServerInfoViaRpc(network);
  }

  /**
   * Get ledger info via `ledger` RPC.
   */
  async getLedgerViaRpc(
    network: import('./types.js').XrplNetwork,
    ledgerIndex?: string | number,
  ): Promise<{ ledger_hash: string; ledger_index: number; transactions: unknown[] }> {
    const { getLedgerViaRpc } = await import('./services/xrpl-ops.js');
    return getLedgerViaRpc(network, ledgerIndex);
  }

  /**
   * Prepare a PaymentChannelCreate transaction via RPC.
   * Payment Channels enable off-chain micropayments with on-chain settlement.
   *
   * @param network - XRPL network (mainnet/testnet/devnet).
   * @param account - Source account address.
   * @param destination - Destination account address.
   * @param amount - Amount in drops to fund the channel.
   * @param settleDelay - Settlement delay in seconds.
   * @returns Prepared transaction ready for signing.
   */
  async preparePaymentChannelCreateViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
    destination: string,
    amount: string,
    settleDelay: number,
  ): Promise<{ txJson: import('./services/xrpl-ops.js').XrplTransaction; sequence: number; fee: string; lastLedgerSequence: number }> {
    const { preparePaymentChannelCreateViaRpc } = await import('./services/xrpl-ops.js');
    return preparePaymentChannelCreateViaRpc(network, account, destination, amount, settleDelay);
  }

  /**
   * Prepare a PaymentChannelClaim transaction via RPC.
   * Claims funds from a payment channel.
   *
   * @param network - XRPL network.
   * @param account - Claimant account address.
   * @param channel - Payment channel ID.
   * @param amount - Amount to claim in drops.
   * @param signature - Channel authorization signature.
   * @returns Prepared transaction ready for signing.
   */
  async preparePaymentChannelClaimViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
    channel: string,
    amount: string,
    signature?: string,
  ): Promise<{ txJson: import('./services/xrpl-ops.js').XrplTransaction; sequence: number; fee: string; lastLedgerSequence: number }> {
    const { preparePaymentChannelClaimViaRpc } = await import('./services/xrpl-ops.js');
    return preparePaymentChannelClaimViaRpc(network, account, channel, amount, signature);
  }

  /**
   * Query payment channels for an account via `account_channels` RPC.
   *
   * @param network - XRPL network.
   * @param account - Account address.
   * @returns Array of payment channels.
   */
  async getPaymentChannelsViaRpc(
    network: import('./types.js').XrplNetwork,
    account: string,
  ): Promise<{
    channels: Array<{
      account: string;
      channel_id: string;
      destination: string;
      amount: string;
      balance: string;
      settle_delay: number;
    }>;
  }> {
    const { getPaymentChannelsViaRpc } = await import('./services/xrpl-ops.js');
    return getPaymentChannelsViaRpc(network, account);
  }
}

/**
 * Announce all registered XRPL providers via EIP-6963.
 * Call this during application bootstrap.
 */
export function announceXrplProviders(): void {
  announceXamanEIP6963();
}
