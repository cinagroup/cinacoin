/**
 * @cinacoin/universal-connector — Solana chain adapter.
 *
 * Supports Solana mainnet and devnet.
 * Integrates with Phantom, Solflare, and other Solana wallets.
 *
 * @example
 * ```ts
 * const adapter = new SolanaAdapter();
 * adapter.registerChains([...solanaChains]);
 * const result = await adapter.connect({ chainId: 'solana:mainnet' });
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
 * Solana wallet provider interface.
 */
interface SolanaProvider {
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  signTransaction(transaction: unknown): Promise<unknown>;
  signAndSendTransaction(transaction: unknown): Promise<{ signature: string }>;
  publicKey: { toString(): string } | null;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * SolanaAdapter — connects to Solana chains via injected wallet providers.
 */
export class SolanaAdapter extends BaseAdapter {
  private provider: SolanaProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'solana',
      name: 'Solana Adapter',
      namespaces: ['solana'],
      ...config,
    });
  }

  /**
   * Connect to a Solana chain.
   *
   * @param options - Connection options (chainId, provider).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[SolanaAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider(options?.provider);
    }

    if (!this.provider) {
      throw new Error('[SolanaAdapter] No Solana wallet detected. Install Phantom or Solflare.');
    }

    // Connect wallet
    const { publicKey } = await this.provider.connect();
    const accounts = [publicKey.toString()];

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
   * Disconnect from the current Solana chain.
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
   * Sign a message.
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[SolanaAdapter] No provider');

    const address = state.accounts[0];
    const messageBytes = new TextEncoder().encode(message);
    const { signature } = await this.provider.signMessage(messageBytes);

    // Convert signature to base58 (simplified)
    const signatureBase58 = this.uint8ArrayToBase58(signature);

    return {
      message,
      signature: signatureBase58,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Sign a transaction.
   *
   * @param tx - Transaction object.
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[SolanaAdapter] No provider');

    const signedTx = await this.provider.signTransaction(tx);
    const { signature } = await this.provider.signAndSendTransaction(signedTx);

    return {
      hash: signature,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      broadcast: true,
    };
  }

  /**
   * Get SOL balance for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    // Note: In production, use @solana/web3.js Connection to fetch balance
    // This is a placeholder implementation
    const balanceLamports = '0'; // Placeholder
    const symbol = chain?.nativeCurrency?.symbol ?? 'SOL';
    const formatted = this.formatBalance(balanceLamports, 9);

    return {
      address: targetAddress,
      balance: balanceLamports,
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
   * Switch to a different Solana chain (mainnet/devnet).
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[SolanaAdapter] Chain "${chainId}" not registered`);
    }

    // Solana wallets typically handle network switching internally
    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect Solana wallet provider.
   */
  private detectProvider(preferred?: string): SolanaProvider | null {
    if (typeof window === 'undefined') return null;

    const phantom = (window as unknown as Window & typeof globalThis).phantom?.solana;
    const solflare = (window as unknown as Window & typeof globalThis).solflare;

    if (preferred === 'phantom' && phantom) return phantom;
    if (preferred === 'solflare' && solflare) return solflare;

    return phantom ?? solflare ?? null;
  }

  /**
   * Setup event listeners on the provider.
   */
  private setupProviderListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountChanged', (publicKey: unknown) => {
      if (this._activeChainId && publicKey) {
        const pk = publicKey as { toString(): string };
        const accounts = [pk.toString()];
        const state = this.getConnectionState(this._activeChainId);
        this.setConnectionState(this._activeChainId, { ...state, accounts });
        this.emit('accountsChanged', { accounts });
      }
    });

    this.provider.on('disconnect', () => {
      this.emit('disconnect');
    });
  }

  /**
   * Convert Uint8Array to base58 (simplified).
   */
  private uint8ArrayToBase58(bytes: Uint8Array): string {
    // Simplified base58 encoding (in production, use a proper library)
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));

    while (num > 0n) {
      const remainder = Number(num % 58n);
      num = num / 58n;
      result = ALPHABET[remainder] + result;
    }

    return result || '1';
  }

  /**
   * Format balance from lamports to SOL.
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
}
