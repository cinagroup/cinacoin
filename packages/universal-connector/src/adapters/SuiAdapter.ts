/**
 * @cinacoin/universal-connector — Sui chain adapter.
 *
 * Integrates with Sui Wallet for Move-based interactions.
 *
 * @example
 * ```ts
 * const adapter = new SuiAdapter();
 * adapter.registerChains([...suiChains]);
 * const result = await adapter.connect({ chainId: 'sui:mainnet' });
 * const txResult = await adapter.signTransaction(txBlock);
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
 * Sui wallet provider interface.
 */
interface SuiProvider {
  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  signAndExecuteTransactionBlock(params: {
    transactionBlock: unknown;
    options?: { showEffects?: boolean; showEvents?: boolean };
  }): Promise<{ digest: string; effects?: unknown; events?: unknown }>;
  signMessage(params: { message: Uint8Array }): Promise<{ signature: string }>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * SuiAdapter — connects to Sui network via Sui Wallet.
 */
export class SuiAdapter extends BaseAdapter {
  private provider: SuiProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'sui',
      name: 'Sui Adapter',
      namespaces: ['sui'],
      ...config,
    });
  }

  /**
   * Connect to Sui network.
   *
   * @param options - Connection options (chainId, provider).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[SuiAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider();
    }

    if (!this.provider) {
      throw new Error('[SuiAdapter] No Sui wallet detected. Install Sui Wallet extension.');
    }

    // Request accounts
    const accounts = await this.provider.requestAccounts();

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
   * Disconnect from Sui network.
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
   * Sign a message.
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[SuiAdapter] No provider');

    const address = state.accounts[0];
    const messageBytes = new TextEncoder().encode(message);
    const { signature } = await this.provider.signMessage({ message: messageBytes });

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Sign and execute a transaction block.
   *
   * @param tx - Transaction block (SuiTransactionBlock).
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[SuiAdapter] No provider');

    const { digest } = await this.provider.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: { showEffects: true, showEvents: true },
    });

    return {
      hash: digest,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      broadcast: true,
    };
  }

  /**
   * Get SUI balance for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    // Note: In production, use Sui RPC client to fetch balance
    const balance = '0'; // Placeholder (MIST)
    const symbol = chain?.nativeCurrency?.symbol ?? 'SUI';
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
   * Switch to a different Sui network (mainnet/testnet/devnet).
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[SuiAdapter] Chain "${chainId}" not registered`);
    }

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /**
   * Build and execute a Programmable Transaction Block (PTB).
   * PTBs allow complex multi-step transactions in Sui.
   *
   * @param builder - PTB builder function that constructs the transaction.
   * @returns Transaction result.
   */
  async executePTB(
    builder: (tx: PTBBuilder) => void
  ): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[SuiAdapter] No provider');

    const txBuilder = new PTBBuilder();
    builder(txBuilder);

    const ptb = txBuilder.build();

    const { digest } = await this.provider.signAndExecuteTransactionBlock({
      transactionBlock: ptb,
      options: { showEffects: true, showEvents: true },
    });

    return {
      hash: digest,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      broadcast: true,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect Sui wallet provider.
   */
  private detectProvider(): SuiProvider | null {
    if (typeof window === 'undefined') return null;
    return (window as unknown as Window & typeof globalThis).suiWallet ?? (window as unknown as Window & typeof globalThis).suiWallets?.[0] ?? null;
  }

  /**
   * Setup event listeners on the provider.
   */
  private setupProviderListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountChanged', (accounts: unknown) => {
      if (this._activeChainId && accounts) {
        const accs = accounts as string[];
        const state = this.getConnectionState(this._activeChainId);
        this.setConnectionState(this._activeChainId, { ...state, accounts: accs });
        this.emit('accountsChanged', { accounts: accs });
      }
    });
  }

  /**
   * Format balance from MIST to SUI.
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

/**
 * PTBBuilder - Programmable Transaction Block builder for Sui.
 * Allows constructing complex multi-step transactions.
 */
export class PTBBuilder {
  private commands: unknown[] = [];
  private inputs: unknown[] = [];

  /**
   * Add a Move call to the PTB.
   */
  moveCall(params: {
    target: string;
    arguments?: unknown[];
    typeArguments?: string[];
  }): this {
    this.commands.push({
      kind: 'MoveCall',
      target: params.target,
      arguments: params.arguments ?? [],
      typeArguments: params.typeArguments ?? [],
    });
    return this;
  }

  /**
   * Transfer objects to recipients.
   */
  transferObjects(objects: unknown[], recipient: string): this {
    this.commands.push({
      kind: 'TransferObjects',
      objects,
      recipient,
    });
    return this;
  }

  /**
   * Split a coin into multiple coins.
   */
  splitCoins(coin: unknown, amounts: unknown[]): this {
    this.commands.push({
      kind: 'SplitCoins',
      coin,
      amounts,
    });
    return this;
  }

  /**
   * Merge multiple coins into one.
   */
  mergeCoins(destination: unknown, sources: unknown[]): this {
    this.commands.push({
      kind: 'MergeCoins',
      destination,
      sources,
    });
    return this;
  }

  /**
   * Add an input (pure value or object reference).
   */
  input(value: unknown): unknown {
    const index = this.inputs.length;
    this.inputs.push(value);
    return { kind: 'Input', index };
  }

  /**
   * Build the PTB into a transaction block.
   */
  build(): unknown {
    return {
      version: 1,
      commands: this.commands,
      inputs: this.inputs,
    };
  }
}
