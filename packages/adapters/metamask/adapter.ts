/**
 * MetaMask Wallet Adapter.
 *
 * Connects to MetaMask via EIP-6963 discovery or window.ethereum.
 * Supports EVM chains with full signing and transaction capabilities.
 *
 * @example
 * ```ts
 * import { MetaMaskAdapter } from '@cinacoin/adapters/metamask';
 *
 * const adapter = new MetaMaskAdapter({ chains: [1, 137] });
 * const result = await adapter.connect();
 * console.log(result.accounts); // ['0x...']
 * ```
 */

import type { ConnectParams, ConnectionResult, TransactionRequest } from '@cinacoin/core-sdk';
import { Connector } from '@cinacoin/core-sdk';
import type { MetaMaskProvider, MetaMaskConfig } from './types.js';
import { detectMetaMask, toHexChainId, fromHexChainId, getMetaMaskInstallLink } from './utils.js';

export class MetaMaskAdapter extends Connector {
  readonly id = 'metamask';
  readonly name = 'MetaMask';
  readonly icon = '🦊';
  readonly type = 'injected';

  private provider: MetaMaskProvider | null = null;
  private config: MetaMaskConfig;

  constructor(config: MetaMaskConfig = {}) {
    super();
    this.config = config;
  }

  get installed(): boolean {
    return !!this.provider;
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    this.provider = await detectMetaMask(this.config.useEIP6963 ?? true);

    if (!this.provider) {
      throw new Error(
        `MetaMask not installed. Install from: ${getMetaMaskInstallLink()}`
      );
    }

    // Request accounts
    const accounts = await this.provider.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask');
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
        // Chain switch failed, continue with current chain
      }
    }

    // Setup event listeners
    this.setupListeners();

    return {
      sessionId: `metamask-${Date.now()}`,
      accounts,
      chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      this.removeListeners();
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

    const hexChainId = toHexChainId(chainId);

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (err: unknown) {
      const error = err as { code?: number };
      // Chain not added, try to add it
      if (error.code === 4902) {
        throw new Error(`Chain ${chainId} not configured in MetaMask. Please add it manually.`);
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

  getProvider(): MetaMaskProvider | null {
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
