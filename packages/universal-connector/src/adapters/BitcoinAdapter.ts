/**
 * @cinacoin/universal-connector — Bitcoin chain adapter.
 *
 * Supports BTC mainnet and testnet.
 * Integrates with Leather, Xverse, and UniSat wallets.
 *
 * @example
 * ```ts
 * const adapter = new BitcoinAdapter();
 * adapter.registerChains([...bitcoinChains]);
 * const result = await adapter.connect({ chainId: 'bip122:000000000019d6689c085ae165831e93' });
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
 * Bitcoin wallet provider interface (Leather/Xverse/UniSat).
 */
interface BitcoinProvider {
  connect(): Promise<{ addresses: Array<{ address: string; purpose: string }> }>;
  disconnect(): Promise<void>;
  signMessage(message: string, paymentType?: string): Promise<{ signature: string; address: string }>;
  sendTransaction(params: {
    address: string;
    amount: string;
    memo?: string;
  }): Promise<{ txid: string }>;
  getAccounts(): Promise<Array<{ address: string; purpose: string }>>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * BitcoinAdapter — connects to Bitcoin networks via injected wallet providers.
 */
export class BitcoinAdapter extends BaseAdapter {
  private provider: BitcoinProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'bitcoin',
      name: 'Bitcoin Adapter',
      namespaces: ['bip122'],
      ...config,
    });
  }

  /**
   * Connect to a Bitcoin network.
   *
   * @param options - Connection options (chainId, provider).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[BitcoinAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider(options?.provider);
    }

    if (!this.provider) {
      throw new Error('[BitcoinAdapter] No Bitcoin wallet detected. Install Leather, Xverse, or UniSat.');
    }

    // Connect wallet
    const { addresses } = await this.provider.connect();
    const accounts = addresses.map(addr => addr.address);

    // Set connection state
    const sessionId = this.generateSessionId();
    this.setConnectionState(chainId, {
      connected: true,
      accounts,
      connectedAt: Date.now(),
      sessionId,
    });
    this._activeChainId = chainId;

    return {
      sessionId,
      chainId,
      accounts,
      adapterId: this.id,
      connectedAt: Date.now(),
    };
  }

  /**
   * Disconnect from the current Bitcoin network.
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
   * Sign a message using BIP-322 standard.
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[BitcoinAdapter] No provider');

    const address = state.accounts[0];
    const { signature } = await this.provider.signMessage(message, 'p2wpkh');

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Send a Bitcoin transaction.
   *
   * @param tx - Transaction object (address, amount, memo).
   * @returns Transaction result with txid.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[BitcoinAdapter] No provider');

    const txObj = tx as { address: string; amount: string; memo?: string };
    const { txid } = await this.provider.sendTransaction(txObj);

    return {
      hash: txid,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: txObj.address,
      broadcast: true,
    };
  }

  /**
   * Get BTC balance for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    // Note: In production, use a Bitcoin API/RPC to fetch balance
    // This is a placeholder implementation
    const balanceSats = '0'; // Placeholder
    const symbol = chain?.nativeCurrency?.symbol ?? 'BTC';
    const formatted = this.formatBalance(balanceSats, 8);

    return {
      address: targetAddress,
      balance: balanceSats,
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
   * Switch to a different Bitcoin network (mainnet/testnet).
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[BitcoinAdapter] Chain "${chainId}" not registered`);
    }

    // Bitcoin wallets typically require reconnection for network switching
    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect Bitcoin wallet provider.
   */
  private detectProvider(preferred?: string): BitcoinProvider | null {
    if (typeof window === 'undefined') return null;

    const leather = (window as any).LeatherProvider;
    const xverse = (window as any).XverseProviders?.BitcoinProvider;
    const unisat = (window as any).unisat;

    if (preferred === 'leather' && leather) return leather;
    if (preferred === 'xverse' && xverse) return xverse;
    if (preferred === 'unisat' && unisat) return unisat;

    return leather ?? xverse ?? unisat ?? null;
  }

  /**
   * Format balance from satoshis to BTC.
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
