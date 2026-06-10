/**
 * @cinacoin/universal-connector — Hedera chain adapter.
 *
 * Integrates with HashPack wallet for Hedera Hashgraph interactions.
 *
 * @example
 * ```ts
 * const adapter = new HederaAdapter();
 * adapter.registerChains([...hederaChains]);
 * const result = await adapter.connect({ chainId: 'hedera:mainnet' });
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
 * HashPack wallet provider interface.
 */
interface HederaProvider {
  connect(topic?: string): Promise<{
    accountId: string;
    publicKey: string;
    topic: string;
  }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  executeTransaction(transaction: unknown): Promise<{
    transactionId: string;
    receipt: { status: string };
  }>;
  getBalance(accountId: string): Promise<string>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * HederaAdapter — connects to Hedera Hashgraph via HashPack wallet.
 */
export class HederaAdapter extends BaseAdapter {
  private provider: HederaProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'hedera',
      name: 'Hedera Adapter',
      namespaces: ['hedera'],
      ...config,
    });
  }

  /**
   * Connect to Hedera network via HashPack.
   *
   * @param options - Connection options (chainId).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[HederaAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider();
    }

    if (!this.provider) {
      throw new Error('[HederaAdapter] No Hedera wallet detected. Install HashPack.');
    }

    // Connect via HashPack
    const { accountId, topic } = await this.provider.connect();
    const accounts = [accountId];

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
   * Disconnect from Hedera network.
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
   * Sign a message using HashPack.
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[HederaAdapter] No provider');

    const address = state.accounts[0];
    const messageBytes = new TextEncoder().encode(message);
    const { signature } = await this.provider.signMessage(messageBytes);

    // Convert signature to hex
    const signatureHex = Array.from(signature)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      message,
      signature: signatureHex,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Execute a Hedera transaction.
   *
   * @param tx - Transaction object (Hedera SDK transaction).
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[HederaAdapter] No provider');

    const { transactionId, receipt } = await this.provider.executeTransaction(tx);

    if (receipt.status !== 'SUCCESS') {
      throw new Error(`[HederaAdapter] Transaction failed with status: ${receipt.status}`);
    }

    return {
      hash: transactionId,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      broadcast: true,
    };
  }

  /**
   * Get HBAR balance for an account.
   *
   * @param address - Account ID (e.g. "0.0.12345"). Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[HederaAdapter] No provider');

    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    const balanceTinybars = await this.provider.getBalance(targetAddress);
    const symbol = chain?.nativeCurrency?.symbol ?? 'HBAR';
    const formatted = this.formatBalance(balanceTinybars, 8);

    return {
      address: targetAddress,
      balance: balanceTinybars,
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
   * Switch to a different Hedera network (mainnet/testnet/previewnet).
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[HederaAdapter] Chain "${chainId}" not registered`);
    }

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect HashPack wallet provider.
   */
  private detectProvider(): HederaProvider | null {
    if (typeof window === 'undefined') return null;
    return (window as any).hashpack ?? null;
  }

  /**
   * Setup event listeners on the provider.
   */
  private setupProviderListeners(): void {
    if (!this.provider) return;

    this.provider.on('pairedAccountChange', (data: unknown) => {
      if (this._activeChainId && data) {
        const d = data as { accountId: string };
        const accounts = [d.accountId];
        const state = this.getConnectionState(this._activeChainId);
        this.setConnectionState(this._activeChainId, { ...state, accounts });
        this.emit('accountsChanged', { accounts });
      }
    });

    this.provider.on('disconnected', () => {
      this.emit('disconnect');
    });
  }

  /**
   * Format balance from tinybars to HBAR.
   */
  private formatBalance(balance: string, decimals: number): string {
    const value = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 8);
    return `${integerPart}.${fractionalStr}`;
  }
}
