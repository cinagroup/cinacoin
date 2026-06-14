/**
 * @cinacoin/universal-connector — Starknet chain adapter.
 *
 * Integrates with Argent and Braavos wallets for Starknet (Account Abstraction) interactions.
 *
 * @example
 * ```ts
 * const adapter = new StarknetAdapter();
 * adapter.registerChains([...starknetChains]);
 * const result = await adapter.connect({ chainId: 'starknet:SN_MAIN' });
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
 * Starknet wallet provider interface (Argent/Braavos).
 */
interface StarknetProvider {
  enable(): Promise<string[]>;
  disable(): Promise<void>;
  isConnected: boolean;
  account?: {
    address: string;
    signMessage(typedData: unknown): Promise<string[]>;
    execute(calls: unknown[]): Promise<{ transaction_hash: string }>;
  };
  selectedAddress?: string;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * StarknetAdapter — connects to Starknet via Argent/Braavos wallets.
 *
 * Leverages Starknet's native Account Abstraction for flexible
 * transaction signing and multi-call execution.
 */
export class StarknetAdapter extends BaseAdapter {
  private provider: StarknetProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'starknet',
      name: 'Starknet Adapter',
      namespaces: ['starknet'],
      ...config,
    });
  }

  /**
   * Connect to Starknet.
   *
   * @param options - Connection options (chainId, provider).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[StarknetAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = this.detectProvider(options?.provider);
    }

    if (!this.provider) {
      throw new Error('[StarknetAdapter] No Starknet wallet detected. Install Argent or Braavos.');
    }

    // Enable wallet
    const accounts = await this.provider.enable();

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
   * Disconnect from Starknet.
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disable();
    }
    if (this._activeChainId) {
      this.clearConnectionState(this._activeChainId);
      this._activeChainId = null;
    }
    this.provider = null;
    this.emit('disconnect');
  }

  /**
   * Sign a message using Starknet typed data (EIP-712 style).
   *
   * @param message - Message to sign (will be wrapped in typed data).
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider?.account) throw new Error('[StarknetAdapter] No provider or account');

    const address = state.accounts[0];

    // Wrap message in Starknet typed data format
    const typedData = {
      types: {
        StarkNetDomain: [
          { name: 'name', type: 'felt' },
          { name: 'version', type: 'felt' },
          { name: 'chainId', type: 'felt' },
        ],
        Message: [{ name: 'message', type: 'felt' }],
      },
      primaryType: 'Message',
      domain: { name: 'Cinacoin', version: '1', chainId: this._activeChainId! },
      message: { message: this.stringToFelt(message) },
    };

    const signatureParts = await this.provider.account.signMessage(typedData);
    const signature = signatureParts.join(',');

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Execute one or more calls via Account Abstraction.
   *
   * @param tx - Transaction object (single call or array of calls).
   * @returns Transaction result.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider?.account) throw new Error('[StarknetAdapter] No provider or account');

    // Normalize to array of calls
    const calls = Array.isArray(tx) ? tx : [tx];
    const { transaction_hash } = await this.provider.account.execute(calls as unknown[]);

    return {
      hash: transaction_hash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      broadcast: true,
    };
  }

  /**
   * Get ETH balance on Starknet for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    // Note: In production, use Starknet.js Provider to fetch balance
    const balance = '0'; // Placeholder (wei)
    const symbol = chain?.nativeCurrency?.symbol ?? 'ETH';
    const formatted = this.formatBalance(balance, 18);

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
   * Switch to a different Starknet network (mainnet/goerli/sepolia).
   *
   * @param chainId - Target chain ID.
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[StarknetAdapter] Chain "${chainId}" not registered`);
    }

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /**
   * Execute a multi-call transaction via Account Abstraction.
   * Starknet's native AA allows batching multiple calls in one transaction.
   *
   * @param calls - Array of contract calls to execute atomically.
   * @returns Transaction result.
   */
  async executeMultiCall(calls: Array<{
    contractAddress: string;
    entrypoint: string;
    calldata: unknown[];
  }>): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider?.account) throw new Error('[StarknetAdapter] No provider or account');

    // Convert to Starknet call format
    const starknetCalls = calls.map(call => ({
      contractAddress: call.contractAddress,
      entrypoint: call.entrypoint,
      calldata: call.calldata,
    }));

    const { transaction_hash } = await this.provider.account.execute(starknetCalls);

    return {
      hash: transaction_hash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      broadcast: true,
    };
  }

  /**
   * Estimate fee for a transaction before execution.
   * Important for AA accounts to ensure sufficient balance.
   *
   * @param calls - Array of contract calls to estimate.
   * @returns Estimated fee information.
   */
  async estimateFee(calls: Array<{
    contractAddress: string;
    entrypoint: string;
    calldata: unknown[];
  }>): Promise<{
    overallFee: string;
    gasConsumed: string;
    gasPrice: string;
    unit: string;
  }> {
    this.requireConnection();
    
    // In production, use Starknet.js Provider to estimate fee
    // This is a placeholder implementation
    return {
      overallFee: '0',
      gasConsumed: '0',
      gasPrice: '0',
      unit: 'ETH',
    };
  }

  /**
   * Deploy an Account contract (for AA account creation).
   * Starknet accounts are smart contracts, not just key pairs.
   *
   * @param params - Account deployment parameters.
   * @returns Transaction result with deployed address.
   */
  async deployAccount(params: {
    classHash: string;
    constructorCalldata: unknown[];
    addressSalt: string;
  }): Promise<TxResult & { deployedAddress: string }> {
    this.requireConnection();
    if (!this.provider) throw new Error('[StarknetAdapter] No provider');

    // In production, use Starknet.js DeployAccountFlow
    // This is a placeholder implementation
    const deployedAddress = `0x${params.addressSalt.slice(0, 40)}`;
    
    return {
      hash: '0x0', // Placeholder
      chainId: this._activeChainId!,
      from: deployedAddress,
      broadcast: true,
      deployedAddress,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect Starknet wallet provider (Argent or Braavos).
   */
  private detectProvider(preferred?: string): StarknetProvider | null {
    if (typeof window === 'undefined') return null;

    const argent = (window as unknown as Window & typeof globalThis).starknet_argentX;
    const braavos = (window as unknown as Window & typeof globalThis).starknet_braavos;
    const starknet = (window as unknown as Window & typeof globalThis).starknet;

    if (preferred === 'argent' && argent) return argent;
    if (preferred === 'braavos' && braavos) return braavos;

    return argent ?? braavos ?? starknet ?? null;
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

    this.provider.on('networkChanged', (chainId: unknown) => {
      if (typeof chainId === 'string') {
        this._activeChainId = `starknet:${chainId}`;
        this.emit('chainChanged', { chainId: this._activeChainId });
      }
    });
  }

  /**
   * Convert a string to a felt value (simplified hex encoding).
   */
  private stringToFelt(str: string): string {
    const hex = Buffer.from(str).toString('hex');
    return '0x' + hex;
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
