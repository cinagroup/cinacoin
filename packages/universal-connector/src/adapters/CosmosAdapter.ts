/**
 * @cinacoin/universal-connector — Cosmos chain adapter.
 *
 * Supports Cosmos Hub and IBC-compatible chains.
 * Integrates with Keplr wallet.
 *
 * @example
 * ```ts
 * const adapter = new CosmosAdapter();
 * adapter.registerChains([...cosmosChains]);
 * const result = await adapter.connect({ chainId: 'cosmos:cosmoshub-4' });
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
 * Keplr wallet provider interface.
 */
interface KeplrProvider {
  enable(chainId: string): Promise<void>;
  getKey(chainId: string): Promise<{
    bech32Address: string;
    pubKey: Uint8Array;
    algo: string;
  }>;
  signArbitrary(
    chainId: string,
    signer: string,
    data: string
  ): Promise<{ signature: string; pub_key: { value: string } }>;
  signAndBroadcast(
    chainId: string,
    msgs: unknown[],
    fee: unknown,
    memo?: string
  ): Promise<{ code: number; transactionHash: string }>;
  sendIBCTransfer(
    chainId: string,
    params: {
      sourceChannel: string;
      token: { denom: string; amount: string };
      receiver: string;
      memo?: string;
    }
  ): Promise<{ hash: string }>;
}

/**
 * CosmosAdapter — connects to Cosmos Hub and IBC chains via Keplr wallet.
 */
export class CosmosAdapter extends BaseAdapter {
  private provider: KeplrProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'cosmos',
      name: 'Cosmos Adapter',
      namespaces: ['cosmos'],
      ...config,
    });
  }

  /**
   * Connect to a Cosmos chain.
   *
   * @param options - Connection options (chainId).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[CosmosAdapter] Chain "${chainId}" not registered`);
    }

    // Detect Keplr
    if (!this.provider) {
      this.provider = this.detectProvider();
    }

    if (!this.provider) {
      throw new Error('[CosmosAdapter] Keplr wallet not detected. Install Keplr extension.');
    }

    // Extract Cosmos chain ID from CAIP-2 (e.g. "cosmos:cosmoshub-4" → "cosmoshub-4")
    const cosmosChainId = this.extractCosmosChainId(chainId);

    // Enable chain in Keplr
    await this.provider.enable(cosmosChainId);

    // Get key
    const key = await this.provider.getKey(cosmosChainId);
    const accounts = [key.bech32Address];

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
   * Disconnect from the current Cosmos chain.
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
   * Sign arbitrary data using Keplr.
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[CosmosAdapter] No provider');

    const address = state.accounts[0];
    const cosmosChainId = this.extractCosmosChainId(this._activeChainId!);

    const { signature } = await this.provider.signArbitrary(cosmosChainId, address, message);

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Sign and broadcast a transaction.
   *
   * @param tx - Transaction messages and fee.
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[CosmosAdapter] No provider');

    const txObj = tx as { msgs: unknown[]; fee: unknown; memo?: string };
    const cosmosChainId = this.extractCosmosChainId(this._activeChainId!);

    const result = await this.provider.signAndBroadcast(
      cosmosChainId,
      txObj.msgs,
      txObj.fee,
      txObj.memo
    );

    if (result.code !== 0) {
      throw new Error(`[CosmosAdapter] Transaction failed with code ${result.code}`);
    }

    return {
      hash: result.transactionHash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      broadcast: true,
    };
  }

  /**
   * Get native token balance for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    // Note: In production, use Cosmos SDK REST/RPC to fetch balance
    // This is a placeholder implementation
    const balance = '0'; // Placeholder
    const symbol = chain?.nativeCurrency?.symbol ?? 'ATOM';
    const formatted = this.formatBalance(balance, 6);

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
   * Switch to a different Cosmos chain.
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[CosmosAdapter] Chain "${chainId}" not registered`);
    }
    if (!this.provider) {
      throw new Error('[CosmosAdapter] No provider. Call connect() first.');
    }

    const cosmosChainId = this.extractCosmosChainId(chainId);
    await this.provider.enable(cosmosChainId);

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /**
   * Send an IBC transfer.
   *
   * @param params - IBC transfer parameters.
   * @returns Transaction result.
   */
  async sendIBCTransfer(params: {
    sourceChannel: string;
    token: { denom: string; amount: string };
    receiver: string;
    memo?: string;
  }): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[CosmosAdapter] No provider');

    const cosmosChainId = this.extractCosmosChainId(this._activeChainId!);
    const { hash } = await this.provider.sendIBCTransfer(cosmosChainId, params);

    return {
      hash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: params.receiver,
      broadcast: true,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect Keplr wallet provider.
   */
  private detectProvider(): KeplrProvider | null {
    if (typeof window === 'undefined') return null;
    return (window as any).keplr ?? null;
  }

  /**
   * Extract Cosmos chain ID from CAIP-2 format.
   * e.g. "cosmos:cosmoshub-4" → "cosmoshub-4"
   */
  private extractCosmosChainId(caip2: string): string {
    return caip2.split(':')[1];
  }

  /**
   * Format balance from smallest unit to human-readable.
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
