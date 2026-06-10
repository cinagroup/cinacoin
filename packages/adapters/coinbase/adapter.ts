/**
 * Coinbase Wallet Adapter.
 *
 * Connects via Coinbase Wallet browser extension or Smart Wallet.
 * Supports EVM chains with full signing capabilities.
 *
 * @example
 * ```ts
 * import { CoinbaseAdapter } from '@cinacoin/adapters/coinbase';
 *
 * const adapter = new CoinbaseAdapter({
 *   appName: 'My dApp',
 *   chains: [1, 8453], // Ethereum + Base
 * });
 *
 * const result = await adapter.connect();
 * ```
 */

import type { ConnectParams, ConnectionResult, TransactionRequest } from '@cinacoin/core-sdk';
import { Connector } from '@cinacoin/core-sdk';
import type { CoinbaseWalletConfig, CoinbaseWalletProvider } from './types.js';
import { detectCoinbaseWallet, toHexChainId, fromHexChainId, getCoinbaseWalletInstallLink } from './utils.js';

export class CoinbaseAdapter extends Connector {
  readonly id = 'coinbase';
  readonly name = 'Coinbase Wallet';
  readonly icon = '🔵';
  readonly type = 'extension';

  private provider: CoinbaseWalletProvider | null = null;
  private config: CoinbaseWalletConfig;

  constructor(config: CoinbaseWalletConfig) {
    super();
    this.config = config;
  }

  get installed(): boolean {
    return !!this.provider;
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    this.provider = detectCoinbaseWallet();

    if (!this.provider) {
      throw new Error(
        `Coinbase Wallet not installed. Install from: ${getCoinbaseWalletInstallLink()}`
      );
    }

    // Request accounts
    let accounts: string[];
    try {
      accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      }) as string[];
    } catch {
      // Fallback for older SDK versions
      accounts = await this.provider.enable();
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from Coinbase Wallet');
    }

    // Get chain ID
    const chainIdHex = await this.provider.request({
      method: 'eth_chainId',
    }) as string;
    const chainId = fromHexChainId(chainIdHex);

    // Switch to preferred chain if needed
    if (this.config.chains?.length && !this.config.chains.includes(chainId)) {
      try {
        await this.switchChain(this.config.chains[0]);
      } catch {
        // Chain switch failed
      }
    }

    this.setupListeners();

    return {
      sessionId: `coinbase-${Date.now()}`,
      accounts,
      chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      this.removeListeners();
      try {
        this.provider.close?.();
      } catch {
        // ignore
      }
    }
    this.provider = null;
  }

  async getAccounts(): Promise<string[]> {
    if (!this.provider) return [];
    const accounts = await this.provider.request({
      method: 'eth_accounts',
    }) as string[];
    return accounts;
  }

  async getChainId(): Promise<number> {
    if (!this.provider) throw new Error('Not connected');
    const chainIdHex = await this.provider.request({
      method: 'eth_chainId',
    }) as string;
    return fromHexChainId(chainIdHex);
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) throw new Error('Not connected');

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHexChainId(chainId) }],
      });
    } catch (err: unknown) {
      const error = err as { code?: number };
      if (error.code === 4902) {
        throw new Error(`Chain ${chainId} not configured in Coinbase Wallet`);
      }
      throw err;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider) throw new Error('Not connected');
    const accounts = await this.getAccounts();
    if (accounts.length === 0) throw new Error('No accounts available');

    const signature = await this.provider.request({
      method: 'personal_sign',
      params: [message, accounts[0]],
    }) as string;

    return signature;
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    if (!this.provider) throw new Error('Not connected');

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
    if (tx.chainId) txParams.chainId = toHexChainId(tx.chainId);

    const signedTx = await this.provider.request({
      method: 'eth_signTransaction',
      params: [txParams],
    }) as string;

    return signedTx;
  }

  getProvider(): CoinbaseWalletProvider | null {
    return this.provider;
  }

  // ── Event Listeners ──

  private handleAccountsChanged = (accounts: unknown) => {
    this.emit('accountsChanged', accounts);
  };

  private handleChainChanged = (chainId: unknown) => {
    this.emit('chainChanged', chainId);
  };

  private handleDisconnect = () => {
    this.emit('disconnect');
  };

  private setupListeners(): void {
    if (!this.provider) return;
    this.provider.on('accountsChanged', this.handleAccountsChanged);
    this.provider.on('chainChanged', this.handleChainChanged);
    this.provider.on('disconnect', this.handleDisconnect);
  }

  private removeListeners(): void {
    if (!this.provider) return;
    this.provider.removeListener('accountsChanged', this.handleAccountsChanged);
    this.provider.removeListener('chainChanged', this.handleChainChanged);
    this.provider.removeListener('disconnect', this.handleDisconnect);
  }
}
