/**
 * @cinacoin/universal-connector — NEAR chain adapter.
 *
 * Integrates with NEAR Wallet Selector for NEAR Protocol interactions.
 *
 * @example
 * ```ts
 * const adapter = new NearAdapter();
 * adapter.registerChains([...nearChains]);
 * const result = await adapter.connect({ chainId: 'near:mainnet' });
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
 * NEAR wallet provider interface.
 */
interface NearProvider {
  signIn(params: { contractId?: string; methodNames?: string[] }): Promise<string[]>;
  signOut(): Promise<void>;
  getAccounts(): Promise<Array<{ accountId: string }>>;
  signMessage(params: { message: string; recipient: string; nonce: string }): Promise<{
    signature: string;
    publicKey: string;
  }>;
  sendTransaction(params: {
    receiverId: string;
    actions: unknown[];
  }): Promise<{ transaction: { hash: string } }>;
}

/**
 * NearAdapter — connects to NEAR Protocol via Wallet Selector.
 */
export class NearAdapter extends BaseAdapter {
  private provider: NearProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'near',
      name: 'NEAR Adapter',
      namespaces: ['near'],
      ...config,
    });
  }

  /**
   * Connect to NEAR network.
   *
   * @param options - Connection options (chainId, contractId).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[NearAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider();
    }

    if (!this.provider) {
      throw new Error('[NearAdapter] No NEAR wallet detected. Install a NEAR wallet.');
    }

    // Sign in
    const contractId = options?.contractId as string | undefined;
    const accountIds = await this.provider.signIn({ contractId });

    // Set connection state
    const sessionId = this.generateSessionId();
    this.setConnectionState(chainId, {
      connected: true,
      accounts: accountIds,
      connectedAt: Date.now(),
      sessionId,
    });
    this._activeChainId = chainId;

    return {
      sessionId,
      chainId,
      accounts: accountIds,
      adapterId: this.id,
      connectedAt: Date.now(),
    };
  }

  /**
   * Disconnect from NEAR network.
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.signOut();
    }
    if (this._activeChainId) {
      this.clearConnectionState(this._activeChainId);
      this._activeChainId = null;
    }
    this.provider = null;
    this.emit('disconnect');
  }

  /**
   * Sign a message.
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[NearAdapter] No provider');

    const address = state.accounts[0];
    const nonce = Date.now().toString();
    const { signature } = await this.provider.signMessage({
      message,
      recipient: address,
      nonce,
    });

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Send a transaction.
   *
   * @param tx - Transaction object (receiverId, actions).
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[NearAdapter] No provider');

    const txObj = tx as { receiverId: string; actions: unknown[] };
    const { transaction } = await this.provider.sendTransaction(txObj);

    return {
      hash: transaction.hash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: txObj.receiverId,
      broadcast: true,
    };
  }

  /**
   * Get NEAR balance for an address.
   *
   * @param address - Account ID. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    // Note: In production, use NEAR RPC to fetch balance
    const balance = '0'; // Placeholder (yoctoNEAR)
    const symbol = chain?.nativeCurrency?.symbol ?? 'NEAR';
    const formatted = this.formatBalance(balance, 24);

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
   * Switch to a different NEAR network (mainnet/testnet).
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[NearAdapter] Chain "${chainId}" not registered`);
    }

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect NEAR wallet provider.
   */
  private detectProvider(): NearProvider | null {
    if (typeof window === 'undefined') return null;
    // In production, use @near-wallet-selector/core
    return (window as any).nearWallet ?? null;
  }

  /**
   * Format balance from yoctoNEAR to NEAR.
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
