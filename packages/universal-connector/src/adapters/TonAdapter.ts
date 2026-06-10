/**
 * @cinacoin/universal-connector — TON chain adapter.
 *
 * Integrates with TonConnect for The Open Network interactions.
 *
 * @example
 * ```ts
 * const adapter = new TonAdapter({ options: { manifestUrl: 'https://...' } });
 * adapter.registerChains([...tonChains]);
 * const result = await adapter.connect({ chainId: 'ton:mainnet' });
 * const sig = await adapter.signMessage('Hello');
 * ```
 */

import { BaseAdapter } from './BaseAdapter.js';
import type {
  AdapterConfig,
  ConnectOptions,
  ConnectionResult,
  SignatureResult,
  TxResult,
  BalanceResult,
} from '../types.js';

/**
 * TonConnect provider interface.
 */
interface TonConnectProvider {
  connect(manifestUrl?: string): Promise<{
    address: string;
    publicKey: string;
    wallet: string;
  }>;
  disconnect(): Promise<void>;
  signData(params: {
    cell: string;
  }): Promise<{ signature: string }>;
  sendTransaction(params: {
    validUntil: number;
    messages: Array<{
      address: string;
      amount: string;
      payload?: string;
      stateInit?: string;
    }>;
  }): Promise<{ boc: string; result: unknown }>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * TonAdapter — connects to TON via TonConnect protocol.
 */
export class TonAdapter extends BaseAdapter {
  private provider: TonConnectProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'ton',
      name: 'TON Adapter',
      namespaces: ['ton'],
      ...config,
    });
  }

  /**
   * Connect to TON network via TonConnect.
   *
   * @param options - Connection options (chainId, manifestUrl).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[TonAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider();
    }

    if (!this.provider) {
      throw new Error('[TonAdapter] No TON wallet detected. Install Tonkeeper or another TON wallet.');
    }

    // Connect via TonConnect
    const manifestUrl = (options?.manifestUrl ?? this.options.manifestUrl) as string | undefined;
    const { address, publicKey } = await this.provider.connect(manifestUrl);
    const accounts = [address];

    // Set connection state
    const sessionId = this.generateSessionId();
    this.setConnectionState(chainId, {
      connected: true,
      accounts,
      connectedAt: Date.now(),
      sessionId,
    });
    this._activeChainId = chainId;

    // Listen for events
    this.setupProviderListeners();

    return {
      sessionId,
      chainId,
      accounts,
      adapterId: this.id,
      connectedAt: Date.now(),
    };
  }

  /**
   * Disconnect from TON network.
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
    }
    if (this._activeChainId) {
      this.clearConnectionState(this._activeChainId);
      this._activeChainId = null;
    }
    this.provider = null;
    this.emit('disconnect');
  }

  /**
   * Sign data using TonConnect.
   *
   * @param message - Message/data to sign (hex-encoded cell).
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TonAdapter] No provider');

    const address = state.accounts[0];
    const { signature } = await this.provider.signData({ cell: message });

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Send a TON transaction.
   *
   * @param tx - Transaction object (messages with address, amount, payload).
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TonAdapter] No provider');

    const txObj = tx as {
      validUntil?: number;
      messages: Array<{
        address: string;
        amount: string;
        payload?: string;
        stateInit?: string;
      }>;
    };

    const result = await this.provider.sendTransaction({
      validUntil: txObj.validUntil ?? Math.floor(Date.now() / 1000) + 300,
      messages: txObj.messages,
    });

    return {
      hash: result.boc,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: txObj.messages[0]?.address,
      raw: result.boc,
      broadcast: true,
    };
  }

  /**
   * Get TON balance for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    // Note: In production, use TON API/RPC to fetch balance
    const balance = '0'; // Placeholder (nanotons)
    const symbol = chain?.nativeCurrency?.symbol ?? 'TON';
    const formatted = this.formatBalance(balance, 9);

    return {
      address: targetAddress,
      balance,
      formatted,
      symbol,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Get connected accounts.
   */
  async getAccounts(): Promise<string[]> {
    const state = this.requireConnection();
    return state.accounts;
  }

  /**
   * Switch to a different TON network (mainnet/testnet).
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[TonAdapter] Chain "${chainId}" not registered`);
    }

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /**
   * Send a Jetton (TON token standard) transfer.
   * Jettons are fungible tokens on TON, similar to ERC-20.
   *
   * @param params - Jetton transfer parameters.
   * @returns Transaction result.
   */
  async sendJettonTransfer(params: {
    jettonMasterAddress: string;
    destination: string;
    amount: string;
    responseAddress?: string;
    forwardTonAmount?: string;
    comment?: string;
  }): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TonAdapter] No provider');

    // Build Jetton transfer payload
    // Jetton transfer requires calling the sender's Jetton wallet contract
    // with a specific op code (0xf8a7ea5 for transfer)
    const transferPayload = this.buildJettonTransferPayload({
      destination: params.destination,
      amount: params.amount,
      responseAddress: params.responseAddress ?? state.accounts[0],
      forwardTonAmount: params.forwardTonAmount ?? '0',
      comment: params.comment,
    });

    const result = await this.provider.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: params.jettonMasterAddress, // Sender's Jetton wallet
          amount: params.forwardTonAmount ?? '50000000', // 0.05 TON for fees
          payload: transferPayload,
        },
      ],
    });

    return {
      hash: result.boc,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: params.destination,
      raw: result.boc,
      broadcast: true,
    };
  }

  /**
   * Get Jetton balance for an address.
   *
   * @param params - Jetton balance query parameters.
   * @returns Balance result.
   */
  async getJettonBalance(params: {
    jettonMasterAddress: string;
    address?: string;
  }): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = params.address ?? state.accounts[0];

    // In production, query the Jetton wallet contract for balance
    // This is a placeholder implementation
    const balance = '0';
    const formatted = this.formatBalance(balance, 9);

    return {
      address: targetAddress,
      balance,
      formatted,
      symbol: 'JETTON',
      chainId: this._activeChainId!,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect TON wallet provider.
   */
  private detectProvider(): TonConnectProvider | null {
    if (typeof window === 'undefined') return null;
    return (window as unknown as Window & typeof globalThis).tonConnect ?? (window as unknown as Window & typeof globalThis).tonkeeper?.tonConnect ?? null;
  }

  /**
   * Setup event listeners on the provider.
   */
  private setupProviderListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountChanged', (data: unknown) => {
      if (this._activeChainId && data) {
        const d = data as { address: string };
        const accounts = [d.address];
        const state = this.getConnectionState(this._activeChainId);
        this.setConnectionState(this._activeChainId, { ...state, accounts });
        this.emit('accountsChanged', { accounts });
      }
    });
  }

  /**
   * Format balance from nanotons to TON.
   */
  private formatBalance(balance: string, decimals: number): string {
    const value = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 9);
    return `${integerPart}.${fractionalStr}`;
  }

  /**
   * Build Jetton transfer payload (cell).
   * In production, this would use TON's Cell builder.
   */
  private buildJettonTransferPayload(params: {
    destination: string;
    amount: string;
    responseAddress: string;
    forwardTonAmount: string;
    comment?: string;
  }): string {
    // Jetton transfer op code: 0xf8a7ea5
    // This is a simplified placeholder - in production use @ton/core Cell builder
    const payload = {
      op: 0xf8a7ea5,
      queryId: Date.now(),
      amount: params.amount,
      destination: params.destination,
      responseDestination: params.responseAddress,
      customPayload: null,
      forwardTonAmount: params.forwardTonAmount,
      forwardPayload: params.comment ?? null,
    };
    // Encode as base64 cell (placeholder)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}
