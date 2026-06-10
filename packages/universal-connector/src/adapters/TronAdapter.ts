/**
 * @cinacoin/universal-connector — TRON chain adapter.
 *
 * Integrates with TronLink wallet for TRON network interactions.
 *
 * @example
 * ```ts
 * const adapter = new TronAdapter();
 * adapter.registerChains([...tronChains]);
 * const result = await adapter.connect({ chainId: 'tron:mainnet' });
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
 * TronLink wallet provider interface.
 */
interface TronProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  trx: {
    sign(message: string): Promise<string>;
    sendTransaction(to: string, amount: number): Promise<{ txid: string }>;
    triggerSmartContract(
      contractAddress: string,
      functionSelector: string,
      options: Record<string, unknown>,
      parameter: Array<{ type: string; value: unknown }>,
      issuerAddress?: string
    ): Promise<{ result: { result: boolean }; transaction: unknown }>;
    getBalance(address: string): Promise<number>;
  };
  ready: boolean;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * TronAdapter — connects to TRON network via TronLink wallet.
 */
export class TronAdapter extends BaseAdapter {
  private provider: TronProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'tron',
      name: 'TRON Adapter',
      namespaces: ['tron'],
      ...config,
    });
  }

  /**
   * Connect to TRON network.
   *
   * @param options - Connection options (chainId).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[TronAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider();
    }

    if (!this.provider) {
      throw new Error('[TronAdapter] No TRON wallet detected. Install TronLink extension.');
    }

    // Request connection
    const result = (await this.provider.request({
      method: 'tron_requestAccounts',
    })) as { base58?: string[] };

    const accounts = result.base58 ?? [];
    if (accounts.length === 0) {
      throw new Error('[TronAdapter] No accounts returned from TronLink');
    }

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
   * Disconnect from TRON network.
   */
  async disconnect(): Promise<void> {
    if (this._activeChainId) {
      this.clearConnectionState(this._activeChainId);
      this._activeChainId = null;
    }
    this.provider = null;
    this.emit('disconnect');
  }

  /**
   * Sign a message using TronLink.
   *
   * @param message - Message to sign (UTF-8 string).
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TronAdapter] No provider');

    const address = state.accounts[0];
    const signature = await this.provider.trx.sign(message);

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Send a TRX transaction or trigger a smart contract.
   *
   * @param tx - Transaction object.
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TronAdapter] No provider');

    const txObj = tx as Record<string, unknown>;

    // Smart contract interaction
    if (txObj.contractAddress && txObj.functionSelector) {
      const { transaction } = await this.provider.trx.triggerSmartContract(
        txObj.contractAddress as string,
        txObj.functionSelector as string,
        (txObj.options ?? {}) as Record<string, unknown>,
        (txObj.parameter ?? []) as Array<{ type: string; value: unknown }>,
        txObj.issuerAddress as string | undefined
      );

      const txHash = (transaction as Record<string, unknown>).txID as string;
      return {
        hash: txHash,
        chainId: this._activeChainId!,
        from: state.accounts[0],
        to: txObj.contractAddress as string,
        broadcast: true,
      };
    }

    // Simple TRX transfer
    const { txid } = await this.provider.trx.sendTransaction(
      txObj.to as string,
      txObj.amount as number
    );

    return {
      hash: txid,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: txObj.to as string,
      broadcast: true,
    };
  }

  /**
   * Get TRX balance for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TronAdapter] No provider');

    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    const balanceSun = await this.provider.trx.getBalance(targetAddress);
    const balanceStr = balanceSun.toString();
    const symbol = chain?.nativeCurrency?.symbol ?? 'TRX';
    const formatted = this.formatBalance(balanceStr, 6);

    return {
      address: targetAddress,
      balance: balanceStr,
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
   * Switch to a different TRON network.
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[TronAdapter] Chain "${chainId}" not registered`);
    }

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect TronLink wallet provider.
   */
  private detectProvider(): TronProvider | null {
    if (typeof window === 'undefined') return null;
    return (window as any).tronLink ?? (window as any).tronWeb ?? null;
  }

  /**
   * Setup event listeners on the provider.
   */
  private setupProviderListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts: unknown) => {
      if (this._activeChainId && accounts) {
        const accs = accounts as string[];
        const state = this.getConnectionState(this._activeChainId);
        this.setConnectionState(this._activeChainId, { ...state, accounts: accs });
        this.emit('accountsChanged', { accounts: accs });
      }
    });
  }

  /**
   * Format balance from SUN to TRX.
   */
  private formatBalance(balance: string, decimals: number): string {
    const value = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 6);
    return `${integerPart}.${fractionalStr}`;
  }
}
