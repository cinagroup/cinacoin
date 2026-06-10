/**
 * Phantom Wallet Adapter.
 *
 * Connects to Phantom wallet for Solana (and optionally Ethereum).
 * Supports message signing and transaction signing.
 *
 * @example
 * ```ts
 * import { PhantomAdapter } from '@cinacoin/adapters/phantom';
 *
 * const adapter = new PhantomAdapter({
 *   solana: true,
 *   network: 'mainnet-beta',
 * });
 *
 * const result = await adapter.connect();
 * console.log(result.accounts); // [base58 address]
 * ```
 */

import type { ConnectParams, ConnectionResult, TransactionRequest } from '@cinacoin/core-sdk';
import { Connector } from '@cinacoin/core-sdk';
import type { PhantomConfig, PhantomSolanaProvider, PhantomEthereumProvider } from './types.js';
import {
  detectPhantomSolana,
  detectPhantomEthereum,
  getPhantomInstallLink,
  encodeSolanaMessage,
  solanaSignatureToHex,
} from './utils.js';

export class PhantomAdapter extends Connector {
  readonly id = 'phantom';
  readonly name = 'Phantom';
  readonly icon = '👻';
  readonly type = 'extension';

  private solanaProvider: PhantomSolanaProvider | null = null;
  private ethereumProvider: PhantomEthereumProvider | null = null;
  private config: PhantomConfig;
  private useSolana: boolean;

  constructor(config: PhantomConfig = {}) {
    super();
    this.config = config;
    this.useSolana = config.solana !== false; // Default to Solana
  }

  get installed(): boolean {
    return !!(this.solanaProvider || this.ethereumProvider);
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    if (this.useSolana) {
      return this.connectSolana();
    } else {
      return this.connectEthereum();
    }
  }

  private async connectSolana(): Promise<ConnectionResult> {
    this.solanaProvider = detectPhantomSolana();

    if (!this.solanaProvider) {
      throw new Error(
        `Phantom not installed. Install from: ${getPhantomInstallLink()}`
      );
    }

    // Connect to Solana
    const { publicKey } = await this.solanaProvider.connect();
    const address = publicKey.toBase58();

    // Get cluster (chain ID equivalent for Solana)
    // Phantom uses network names instead of numeric IDs
    const network = this.config.network || 'mainnet-beta';
    const chainId = network === 'mainnet-beta' ? 101 : network === 'devnet' ? 102 : 103;

    this.setupSolanaListeners();

    return {
      sessionId: `phantom-solana-${Date.now()}`,
      accounts: [address],
      chainId,
      connectorId: this.id,
    };
  }

  private async connectEthereum(): Promise<ConnectionResult> {
    this.ethereumProvider = detectPhantomEthereum();

    if (!this.ethereumProvider) {
      throw new Error('Phantom Ethereum provider not available');
    }

    // Request accounts
    const accounts = await this.ethereumProvider.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from Phantom');
    }

    // Get chain ID
    const chainIdHex = await this.ethereumProvider.request({
      method: 'eth_chainId',
    }) as string;
    const chainId = parseInt(chainIdHex, 16);

    this.setupEthereumListeners();

    return {
      sessionId: `phantom-eth-${Date.now()}`,
      accounts,
      chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    if (this.solanaProvider) {
      await this.solanaProvider.disconnect();
      this.removeSolanaListeners();
      this.solanaProvider = null;
    }

    if (this.ethereumProvider) {
      this.removeEthereumListeners();
      this.ethereumProvider = null;
    }
  }

  async getAccounts(): Promise<string[]> {
    if (this.useSolana && this.solanaProvider?.publicKey) {
      return [this.solanaProvider.publicKey.toBase58()];
    }

    if (this.ethereumProvider) {
      const accounts = await this.ethereumProvider.request({
        method: 'eth_accounts',
      }) as string[];
      return accounts;
    }

    return [];
  }

  async getChainId(): Promise<number> {
    if (this.useSolana) {
      const network = this.config.network || 'mainnet-beta';
      return network === 'mainnet-beta' ? 101 : network === 'devnet' ? 102 : 103;
    }

    if (this.ethereumProvider) {
      const chainIdHex = await this.ethereumProvider.request({
        method: 'eth_chainId',
      }) as string;
      return parseInt(chainIdHex, 16);
    }

    throw new Error('Not connected');
  }

  async switchChain(chainId: number): Promise<void> {
    if (this.useSolana) {
      // Solana doesn't support chain switching in the same way
      // We'd need to reconnect with a different network
      const network = chainId === 101 ? 'mainnet-beta' : chainId === 102 ? 'devnet' : 'testnet';
      this.config.network = network as 'mainnet-beta' | 'devnet' | 'testnet';
      this.emit('chainChanged', chainId);
      return;
    }

    if (this.ethereumProvider) {
      await this.ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    }
  }

  async signMessage(message: string): Promise<string> {
    if (this.useSolana && this.solanaProvider) {
      const encoded = encodeSolanaMessage(message);
      const { signature } = await this.solanaProvider.signMessage(encoded);
      return solanaSignatureToHex(signature);
    }

    if (this.ethereumProvider) {
      const accounts = await this.getAccounts();
      if (accounts.length === 0) throw new Error('No accounts available');

      const signature = await this.ethereumProvider.request({
        method: 'personal_sign',
        params: [message, accounts[0]],
      }) as string;

      return signature;
    }

    throw new Error('Not connected');
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    if (this.useSolana && this.solanaProvider) {
      // For Solana, we'd need to build a proper Transaction object
      // This is a simplified version
      throw new Error('Solana transaction signing requires Transaction object. Use signAndSendTransaction instead.');
    }

    if (this.ethereumProvider) {
      const txParams: Record<string, string> = {
        from: tx.from,
        to: tx.to,
      };

      if (tx.value) txParams.value = tx.value;
      if (tx.data) txParams.data = tx.data;
      if (tx.gas) txParams.gas = tx.gas;
      if (tx.gasPrice) txParams.gasPrice = tx.gasPrice;
      if (tx.maxFeePerGas) txParams.maxFeePerGas = tx.maxFeePerGas;
      if (tx.maxPriorityFeePerGas) txParams.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
      if (tx.nonce) txParams.nonce = tx.nonce;
      if (tx.chainId) txParams.chainId = `0x${tx.chainId.toString(16)}`;

      const signedTx = await this.ethereumProvider.request({
        method: 'eth_signTransaction',
        params: [txParams],
      }) as string;

      return signedTx;
    }

    throw new Error('Not connected');
  }

  /**
   * Sign and send a Solana transaction.
   */
  async signAndSendTransaction(transaction: unknown): Promise<string> {
    if (!this.solanaProvider) {
      throw new Error('Solana provider not available');
    }

    const { signature } = await this.solanaProvider.signAndSendTransaction(transaction);
    return signature;
  }

  getProvider(): PhantomSolanaProvider | PhantomEthereumProvider | null {
    return this.useSolana ? this.solanaProvider : this.ethereumProvider;
  }

  // ── Solana Event Listeners ──

  private handleSolanaConnect = () => {
    this.emit('connect');
  };

  private handleSolanaDisconnect = () => {
    this.emit('disconnect');
  };

  private handleSolanaAccountChanged = (publicKey: unknown) => {
    this.emit('accountsChanged', [publicKey]);
  };

  private setupSolanaListeners(): void {
    if (!this.solanaProvider) return;
    this.solanaProvider.on('connect', this.handleSolanaConnect);
    this.solanaProvider.on('disconnect', this.handleSolanaDisconnect);
    this.solanaProvider.on('accountChanged', this.handleSolanaAccountChanged);
  }

  private removeSolanaListeners(): void {
    if (!this.solanaProvider) return;
    this.solanaProvider.off('connect', this.handleSolanaConnect);
    this.solanaProvider.off('disconnect', this.handleSolanaDisconnect);
    this.solanaProvider.off('accountChanged', this.handleSolanaAccountChanged);
  }

  // ── Ethereum Event Listeners ──

  private handleEthAccountsChanged = (accounts: unknown) => {
    this.emit('accountsChanged', accounts);
  };

  private handleEthChainChanged = (chainId: unknown) => {
    this.emit('chainChanged', chainId);
  };

  private handleEthDisconnect = () => {
    this.emit('disconnect');
  };

  private setupEthereumListeners(): void {
    if (!this.ethereumProvider) return;
    this.ethereumProvider.on('accountsChanged', this.handleEthAccountsChanged);
    this.ethereumProvider.on('chainChanged', this.handleEthChainChanged);
    this.ethereumProvider.on('disconnect', this.handleEthDisconnect);
  }

  private removeEthereumListeners(): void {
    if (!this.ethereumProvider) return;
    this.ethereumProvider.removeListener('accountsChanged', this.handleEthAccountsChanged);
    this.ethereumProvider.removeListener('chainChanged', this.handleEthChainChanged);
    this.ethereumProvider.removeListener('disconnect', this.handleEthDisconnect);
  }
}
