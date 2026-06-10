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

  /**
   * Send a TRC-20 token transfer.
   * TRC-20 is TRON's token standard, similar to ERC-20.
   *
   * @param params - TRC-20 transfer parameters.
   * @returns Transaction result.
   */
  async sendTRC20Transfer(params: {
    contractAddress: string;
    to: string;
    amount: string;
    feeLimit?: number;
  }): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TronAdapter] No provider');

    // TRC-20 transfer function selector: transfer(address,uint256)
    const functionSelector = 'transfer(address,uint256)';
    
    // Convert address to TRON hex format (41 + hex address)
    const toAddressHex = this.addressToHex(params.to);
    
    // Convert amount to hex (TRC-20 uses 6 decimals for USDT, etc.)
    const amountHex = BigInt(params.amount).toString(16).padStart(64, '0');
    
    const parameter = [
      { type: 'address', value: toAddressHex },
      { type: 'uint256', value: amountHex },
    ];

    const options = {
      feeLimit: params.feeLimit ?? 100_000_000, // 100 TRX default
      callValue: 0,
    };

    const { result, transaction } = await this.provider.trx.triggerSmartContract(
      params.contractAddress,
      functionSelector,
      options,
      parameter,
      state.accounts[0]
    );

    if (!result.result) {
      throw new Error('[TronAdapter] TRC-20 transfer failed');
    }

    const txHash = (transaction as Record<string, unknown>).txID as string;
    return {
      hash: txHash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: params.to,
      broadcast: true,
    };
  }

  /**
   * Approve TRC-20 token spending.
   *
   * @param params - TRC-20 approval parameters.
   * @returns Transaction result.
   */
  async approveTRC20(params: {
    contractAddress: string;
    spender: string;
    amount: string;
  }): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[TronAdapter] No provider');

    const functionSelector = 'approve(address,uint256)';
    const spenderHex = this.addressToHex(params.spender);
    const amountHex = BigInt(params.amount).toString(16).padStart(64, '0');

    const parameter = [
      { type: 'address', value: spenderHex },
      { type: 'uint256', value: amountHex },
    ];

    const { result, transaction } = await this.provider.trx.triggerSmartContract(
      params.contractAddress,
      functionSelector,
      { feeLimit: 100_000_000, callValue: 0 },
      parameter,
      state.accounts[0]
    );

    if (!result.result) {
      throw new Error('[TronAdapter] TRC-20 approval failed');
    }

    const txHash = (transaction as Record<string, unknown>).txID as string;
    return {
      hash: txHash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: params.spender,
      broadcast: true,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect TronLink wallet provider.
   */
  private detectProvider(): TronProvider | null {
    if (typeof window === 'undefined') return null;
    return (window as unknown as Window & typeof globalThis).tronLink ?? (window as unknown as Window & typeof globalThis).tronWeb ?? null;
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

  /**
   * Convert TRON base58 address to hex format.
   * TRON addresses start with 'T' and need to be converted to 41+hex for smart contracts.
   */
  private addressToHex(base58Address: string): string {
    // Simplified conversion - in production use tronweb's addressToHex
    // TRON base58check decode -> 0x41 + 20-byte address
    if (base58Address.startsWith('41')) {
      return base58Address; // Already hex
    }
    // Placeholder: return with 41 prefix
    return '41' + Buffer.from(base58Address).toString('hex').slice(0, 40);
  }
}
